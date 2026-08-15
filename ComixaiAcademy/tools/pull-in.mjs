/* 指定した場所のまわりを、体の芯へ引っ込める。

   ▍何のために
   動かすと出てくる突起には、ウェイトでは直せないものがある。**顔や肩の面が
   服を突き抜けて見えている**もの（面の交差はどの角度から見てものこぎり状に
   なる）と、剛体に固めた部品のふちが袖から顔を出すもの。どちらも「そこが
   数ミリ出ている」だけなので、**引っ込めれば服の中に隠れる**。

   場所は tools/find-spikes.mjs が教えてくれる（バインド座標で出る）。

   ▍まわりも一緒に、弱く動かす
   点だけ動かすと、そこがへこんで折り目になる。中心から離れるにつれて
   弱くなる坂をかけて、なだらかに凹ませる。

   ▍**どちらの面を引っ込めるか**を骨で選ぶ（--bone）
   突き抜けは「AがBを突き抜けている」状態なので、AとBを一緒に引っ込めても
   位置関係は変わらず**直らない**。実際、骨を指定せずに肩まわりを引っ込めたら
   突起はそのまま残った。**顔が上着を突き抜けているなら Head だけ**、
   **固めた肩章が袖から出ているなら Clavicle だけ**を動かす。

   ▍左右は勝手に対にする（--mirror）
   この手のズレは左右そろって出るので、xの符号を反転した場所にも同じだけ掛ける。

   使い方:
     node tools/pull-in.mjs in.glb out.glb --at -0.51,-0.02,0.03 --bone Clavicle --radius 0.10 --amount 0.08 [--mirror]
   - --at     : バインド座標での中心（複数回書ける）
   - --bone   : この名前を含む骨がいちばん重い頂点だけを動かす（省略で全部）
   - --radius : この距離まで効かせる
   - --amount : 中心でどれだけ引っ込めるか（体の芯までの距離に対する割合）
   - --axis   : 体の芯のz（既定 0.09）

   確認は tools/find-spikes.mjs をもう一度かけて、突起が消えたか見る。
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const args = process.argv.slice(2);
const [IN, OUT] = args.filter((a) => !a.startsWith('--') && !/^-?[\d.]+,/.test(a));
const num = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const AT = args
  .map((a, i) => (args[i - 1] === '--at' ? a : null))
  .filter(Boolean)
  .map((s) => s.split(',').map(Number));
const RADIUS = num('radius', 0.1);
const AMOUNT = num('amount', 0.08);
const AXIS_Z = num('axis', 0.09);
const MIRROR = args.includes('--mirror');
const BONE = (() => {
  const i = args.indexOf('--bone');
  return i >= 0 ? new RegExp(args[i + 1]) : null;
})();
if (!IN || !OUT || !AT.length) {
  console.error('使い方: node tools/pull-in.mjs in.glb out.glb --at x,y,z [--at ...] [--radius 0.1] [--amount 0.08] [--mirror]');
  process.exit(1);
}
const spots = MIRROR ? AT.flatMap(([x, y, z]) => [[x, y, z], [-x, y, z]]) : AT;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(IN);
const root = doc.getRoot();
const prim = root.listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute('POSITION');
const J = prim.getAttribute('JOINTS_0');
const W = prim.getAttribute('WEIGHTS_0');
const names = root.listSkins()[0].listJoints().map((b) => b.getName());
const jj = [0, 0, 0, 0];
const ww = [0, 0, 0, 0];
/** その頂点をいちばん強く動かしている骨 */
const boss = (i) => {
  J.getElement(i, jj);
  W.getElement(i, ww);
  let b = 0;
  for (let k = 1; k < 4; k++) if (ww[k] > ww[b]) b = k;
  return names[jj[b]] ?? '';
};

let moved = 0;
let most = 0;
const p = [0, 0, 0];
for (let i = 0; i < P.getCount(); i++) {
  if (BONE && !BONE.test(boss(i))) continue;
  P.getElement(i, p);
  /* いちばん近い指定場所からの距離で、掛かり具合を決める */
  let t = 0;
  for (const [x, y, z] of spots) {
    const d = Math.hypot(p[0] - x, p[1] - y, p[2] - z);
    if (d >= RADIUS) continue;
    const u = 1 - d / RADIUS;
    t = Math.max(t, u * u * (3 - 2 * u));
  }
  if (t <= 0) continue;
  const k = AMOUNT * t;
  const dx = -p[0] * k;
  const dz = -(p[2] - AXIS_Z) * k;
  p[0] += dx;
  p[2] += dz;
  P.setElement(i, p);
  most = Math.max(most, Math.hypot(dx, dz));
  moved++;
}
console.log(`${spots.length}か所のまわり ${moved}頂点を引っ込めた（いちばん動いたところで ${most.toFixed(3)}）`);
await io.write(OUT, doc);
console.log('->', OUT);
