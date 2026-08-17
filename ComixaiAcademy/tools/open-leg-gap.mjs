/* ============================================================
   くっついている左右の脚のあいだに、すきまを作る。

   ▍何が起きているか
   Tripoは**脚をぴったり閉じた姿勢**で生成することがある。おてんばは
   股から足首まで、左右の脚の内側の面が 0.002 しか離れていない
   （モデル全高2.0のうち。ほかの相棒は 0.024〜0.037 空いている）。

   離れていないと、
   - 遠目には**黒い筋**が1本入って見える（内側の面どうしが重なる）
   - 動かすと、片方の内側の面がもう片方を突き抜けて**薄い刃**が飛び出す

   ▍ウェイトの問題ではないので、ウェイトでは直らない
   最初は「内ももに反対側の脚のウェイトが乗っている」やつだと思って
   fix-leg-weights.mjs を掛けた（255頂点が直った）。**伸びは1枚も減らなかった。**
   三角形そのものが左右にまたがって張られているのではなく、
   **面の位置がもともと近すぎる**のが原因なので、形を動かすしかない。

   cut-leg-web.mjs も効かない。あれは「左右にまたがる三角形」を消す道具で、
   ここの面は左右それぞれに閉じている（またいでいない）。

   ▍やり方：内側だけを、その脚の芯に寄せる
   脚ごとに芯（x の中心）を測り、**内側を向いている頂点だけ**を芯へ寄せる。
   外側は触らないので、シルエット（脚の太さ）は変わらない。
   正中線に近いほど強く効かせて、離れるにつれて0にする。

   使い方:
     node tools/open-leg-gap.mjs in.glb out.glb [--below -0.34] [--blend 0.10] [--gap 0.020]
   - --below : この高さ(y)より下に効かせる。**股（-0.25あたり）は避ける**
               （ズボンとして本来つながっている所なので、開けると穴に見える）
   - --blend : below〜below+blend は徐々に効かせる（段差を作らない）
   - --gap   : 目標のすきま（左右の内端の距離）

   確認は tools/_legprobe.mjs（すきまの実測）と、正面・背面の見た目。
   ============================================================ */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const args = process.argv.slice(2);
const [IN, OUT] = args.filter((a) => !a.startsWith('--'));
const num = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const BELOW = num('below', -0.34);
const BLEND = num('blend', 0.1);
const GAP = num('gap', 0.02);
if (!IN || !OUT) {
  console.error('使い方: node tools/open-leg-gap.mjs in.glb out.glb [--below -0.34] [--gap 0.020]');
  process.exit(1);
}

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(IN);
const root = doc.getRoot();
const names = root.listSkins()[0].listJoints().map((j) => j.getName());
const prim = root.listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute('POSITION');
const J = prim.getAttribute('JOINTS_0');
const W = prim.getAttribute('WEIGHTS_0');

const jj = [0, 0, 0, 0];
const ww = [0, 0, 0, 0];
/** その頂点は左脚寄りか右脚寄りか（cut-leg-web と同じ判定） */
const sideOf = (v) => {
  J.getElement(v, jj);
  W.getElement(v, ww);
  let l = 0;
  let r = 0;
  for (let k = 0; k < 4; k++) {
    const n = names[jj[k]] ?? '';
    if (/^L_(Thigh|Calf|Foot|Toe)/.test(n)) l += ww[k];
    if (/^R_(Thigh|Calf|Foot|Toe)/.test(n)) r += ww[k];
  }
  return l > r + 0.02 ? 1 : r > l + 0.02 ? -1 : 0;
};

/* ▍脚の芯は**測る**。決め打ちにしない
   モデルによって足の開き方も原点もずれている。効かせる範囲の中で、
   その脚に属する頂点の x の平均を芯とみなす。 */
const p = [0, 0, 0];
let lSum = 0;
let lN = 0;
let rSum = 0;
let rN = 0;
for (let v = 0; v < P.getCount(); v++) {
  P.getElement(v, p);
  if (p[1] > BELOW + BLEND) continue;
  const s = sideOf(v);
  if (s > 0) { lSum += p[0]; lN++; } else if (s < 0) { rSum += p[0]; rN++; }
}
if (!lN || !rN) {
  console.error('脚の頂点が見つかりません（--below が下すぎませんか）');
  process.exit(1);
}
const lC = lSum / lN;
const rC = rSum / rN;
const half = GAP / 2;
console.log(`脚の芯: 左 x=${lC.toFixed(3)} / 右 x=${rC.toFixed(3)}（目標のすきま ${GAP}）`);

let moved = 0;
let most = 0;
for (let v = 0; v < P.getCount(); v++) {
  const s = sideOf(v);
  if (!s) continue;
  P.getElement(v, p);
  /* 高さの効き。below より下で1、below+blend で0 */
  const t = Math.min(1, Math.max(0, (BELOW + BLEND - p[1]) / Math.max(1e-6, BLEND)));
  if (t <= 0) continue;
  const center = s > 0 ? lC : rC;
  /* 内側＝芯より正中線に近い側。外側は触らない（シルエットを変えない） */
  const inner = s > 0 ? p[0] < center : p[0] > center;
  if (!inner) continue;
  /* いまの内端から目標の内端まで、正中線に近い頂点ほど強く寄せる。
     芯に届いたら効きは0なので、内側が芯を越えて裏返ることはない */
  const want = s > 0 ? half : -half;
  const d = Math.abs(p[0] - center);
  const need = Math.abs(want - center);
  if (d <= need) continue;
  const k = ((d - need) / d) * t;
  const dx = (center - p[0]) * k;
  p[0] += dx;
  P.setElement(v, p);
  most = Math.max(most, Math.abs(dx));
  moved++;
}
console.log(`脚の内側 ${moved}頂点を寄せた（いちばん動いたところで ${most.toFixed(3)}）`);
await io.write(OUT, doc);
console.log('->', OUT);
