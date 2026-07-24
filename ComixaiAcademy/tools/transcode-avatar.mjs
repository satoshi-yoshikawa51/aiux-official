/* sensei.glb を React Native (Hermes) 向けに変換・軽量化する。

   Web版（public/claude-app/sensei.glb）はそのままでは端末アプリで使えない：
   - EXT_meshopt_compression … デコーダがWASM。HermesはWebAssembly非対応
   - EXT_texture_webp        … GLB埋め込みWebPをRNの画像デコーダが読めない
   さらに 380k tri / 4096px テクスチャはスマホのリアルタイム描画には重い。

   そこで
   1. meshoptを展開し、メッシュを簡略化（weld → simplify）
   2. アニメーションのキーを間引き（resample）
   3. テクスチャはGLBから外し、1024pxのJPEGとして別ファイルに書き出す
      （実行時に three 側で material.map に手動で割り当てる）
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, resample, simplify, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [src, outGlb, outTex] = process.argv.slice(2);
const RATIO = Number(process.env.RATIO ?? 0.12);
const TEX_SIZE = Number(process.env.TEX_SIZE ?? 1024);

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

/* —— メッシュとアニメーションの軽量化 ——
   テクスチャを外す前に実行する。先に外すと prune がUV(TEXCOORD_0)を
   「未使用の頂点属性」とみなして削除してしまうため。 */
await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.004, lockBorder: false }),
  resample(),
  dedup(),
  prune({ keepAttributes: true }),
  quantize(),
);
console.log('after:', tris(), 'tris');

/* —— テクスチャを外出し —— */
const textures = root.listTextures();
if (textures.length !== 1) throw new Error(`想定外のテクスチャ数: ${textures.length}`);
const jpeg = await sharp(Buffer.from(textures[0].getImage()))
  .resize(TEX_SIZE, TEX_SIZE, { fit: 'inside' })
  .jpeg({ quality: 86, mozjpeg: true })
  .toBuffer();
fs.mkdirSync(path.dirname(outTex), { recursive: true });
fs.writeFileSync(outTex, jpeg);
console.log('texture ->', outTex, (jpeg.length / 1024).toFixed(0), 'KB');

for (const mat of root.listMaterials()) {
  mat.setBaseColorTexture(null);
  mat.setEmissiveTexture(null);
  mat.setNormalTexture(null);
  mat.setOcclusionTexture(null);
  mat.setMetallicRoughnessTexture(null);
}
textures[0].dispose();

/* —— 圧縮拡張を落として書き出し（KHR_mesh_quantization / unlit はthreeが対応済み） —— */
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (['EXT_meshopt_compression', 'EXT_texture_webp'].includes(ext.extensionName)) ext.dispose();
}
await io.write(outGlb, doc);

console.log('glb ->', outGlb, (fs.statSync(outGlb).size / 1024 / 1024).toFixed(2), 'MB');
console.log('extensionsUsed:', doc.getRoot().listExtensionsUsed().map((e) => e.extensionName));
console.log('animations:', root.listAnimations().map((a) => a.getName()).join(', '));
