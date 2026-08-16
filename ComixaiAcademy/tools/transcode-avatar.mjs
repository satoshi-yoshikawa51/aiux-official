/* Tripo等で作った GLB を React Native (Hermes) 向けに変換・軽量化する。

   Web版（public/claude-app/sensei.glb）はそのままでは端末アプリで使えない：
   - EXT_meshopt_compression … デコーダがWASM。HermesはWebAssembly非対応
   - EXT_texture_webp        … GLB埋め込みWebPをRNの画像デコーダが読めない
   さらに 380k tri / 4096px テクスチャはスマホのリアルタイム描画には重い。

   そこで
   1. meshoptを展開し、メッシュを簡略化（weld → simplify）
   2. アニメーションのキーを間引き（resample）
   3. テクスチャはGLBから外し、1024pxのJPEGとして別ファイルに書き出す
      （実行時に three 側で material.map に手動で割り当てる）

   使い方:
     node tools/transcode-avatar.mjs <入力.glb> <出力.glb> <出力テクスチャ.jpg>

   環境変数:
     RATIO=0.12      簡略化の目標比率。Tripo v2.5の生モデル(約200万tri)は 0.03 前後
     SIMPLIFY_ERROR=0.004  簡略化の許容誤差。RATIOまで削る前にこの誤差に達したら止まる。
                     顔が崩れるときは 0.0005 まで下げる（そのぶん三角形は残る）
     LOCK_BORDER=1   UVの切れ目（服と靴の境目など）の頂点を動かさない。
                     靴とズボンが溶けて一体化するようなときに効く
     TEX_SIZE=1024   テクスチャの最大辺。拡大はしない（縮小はUVパッチ間の色滲みの元）
     UNLIT=1         マテリアルをunlit化する。トゥーン調の見た目とスマホの描画負荷に効く
     ANIM_NAMES=<json>  アニメのリネーム表 { "NlaTrack": "idle-a", ... } のパス。
                        表に無いクリップは削除される（アプリは11種しか呼ばないため）
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsUnlit } from '@gltf-transform/extensions';
import { dedup, prune, quantize, resample, simplify, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [src, outGlb, outTex] = process.argv.slice(2);
const RATIO = Number(process.env.RATIO ?? 0.12);
const TEX_SIZE = Number(process.env.TEX_SIZE ?? 1024);
const SIMPLIFY_ERROR = Number(process.env.SIMPLIFY_ERROR ?? 0.004);
const LOCK_BORDER = process.env.LOCK_BORDER === '1';
const UNLIT = process.env.UNLIT !== '0';
const ANIM_NAMES = process.env.ANIM_NAMES
  ? JSON.parse(fs.readFileSync(process.env.ANIM_NAMES, 'utf8'))
  : null;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const doc = await io.read(src);
const root = doc.getRoot();

const tris = () =>
  root.listMeshes().reduce(
    (n, m) => n + m.listPrimitives().reduce((k, p) => k + (p.getIndices()?.getCount() ?? 0) / 3, 0),
    0,
  );
console.log('before:', tris(), 'tris');

/* —— アニメーションのリネームと間引き ——
   Tripo製は NlaTrack.00x という無意味名で出てくる。軽量化の前に済ませて
   おくと、使わないクリップぶんのキーを resample / prune が持ち回らずに済む。 */
if (ANIM_NAMES) {
  for (const anim of root.listAnimations()) {
    const next = ANIM_NAMES[anim.getName()];
    if (next) anim.setName(next);
    else {
      console.log('  drop animation:', anim.getName());
      anim.dispose();
    }
  }
}

/* —— メッシュとアニメーションの軽量化 ——
   テクスチャを外す前に実行する。先に外すと prune がUV(TEXCOORD_0)を
   「未使用の頂点属性」とみなして削除してしまうため。 */
await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: SIMPLIFY_ERROR, lockBorder: LOCK_BORDER }),
  resample(),
  dedup(),
  prune({ keepAttributes: true }),
  quantize(),
);
console.log('after:', tris(), 'tris');

/* —— テクスチャを外出し ——
   Tripoは baseColor / normal / metallicRoughness の3枚を吐くが、
   実機で使うのは baseColor だけ（normal と rm は圧縮劣化でシミの原因になる）。 */
const baseColor = root.listMaterials().map((m) => m.getBaseColorTexture()).find(Boolean);
if (!baseColor) throw new Error('baseColorテクスチャが見つかりません');
const jpeg = await sharp(Buffer.from(baseColor.getImage()))
  .resize(TEX_SIZE, TEX_SIZE, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 86, mozjpeg: true })
  .toBuffer();
fs.mkdirSync(path.dirname(outTex), { recursive: true });
fs.writeFileSync(outTex, jpeg);
console.log('texture ->', outTex, (jpeg.length / 1024).toFixed(0), 'KB');

const unlit = UNLIT ? doc.createExtension(KHRMaterialsUnlit).createUnlit() : null;
for (const mat of root.listMaterials()) {
  mat.setBaseColorTexture(null);
  mat.setEmissiveTexture(null);
  mat.setNormalTexture(null);
  mat.setOcclusionTexture(null);
  mat.setMetallicRoughnessTexture(null);
  /* unlit化。立体の自己陰影で目元やくぼみが黒く落ちるのを避ける。
     three側では MeshBasicMaterial として読まれ、ライト計算も走らない。 */
  if (unlit) mat.setExtension('KHR_materials_unlit', unlit);
}
for (const tex of root.listTextures()) tex.dispose();

/* —— 圧縮拡張を落として書き出し（KHR_mesh_quantization / unlit はthreeが対応済み） —— */
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (['EXT_meshopt_compression', 'EXT_texture_webp'].includes(ext.extensionName)) ext.dispose();
}
await io.write(outGlb, doc);

console.log('glb ->', outGlb, (fs.statSync(outGlb).size / 1024 / 1024).toFixed(2), 'MB');
console.log('extensionsUsed:', doc.getRoot().listExtensionsUsed().map((e) => e.extensionName));
console.log('animations:', root.listAnimations().map((a) => a.getName()).join(', '));
