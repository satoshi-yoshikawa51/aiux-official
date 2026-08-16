/* 頭の「すそ」（あごの下の、服に隠れているはずの帯）を、少しだけ内側へ入れる。

   ▍何が起きるか
   看板キャラSR（王様）は、**手を下ろすと右のほおの下からギザギザの突起**が
   出る。裂けているのではない。刺さっているのが見えている——顔は Head 100%
   の剛体、上着の肩は腕と一緒に動くので、腕を下ろすと上着が内へ寄って、
   その下に隠れていたほおのふちが**上着を突き抜けて顔を出す**。

   ギザギザなのは、2つの面が交わった線がそのまま見えているため（面の
   交差はどの角度から見てものこぎり状になる）。ウェイトをどう直しても
   消えない。素のモデルでも同じ場所に出ていた。

   ▍直し方：隠れている帯を、ほんの少し細くする
   あごの骨より下、かつ後ろ半分にある顔の頂点を、頭の芯へ向けて
   数%引き寄せる。そこは立っていても動いても上着の中なので、**細くしても
   見た目は変わらない**。突き抜けるぶんの余裕（数ミリ）だけを作る。

   境目はなめらかにする（深さと奥行きで坂をかける）。きっちり切ると、
   そこが折り目になって別の段差が見える。

   使い方:
     node tools/tuck-head-skirt.mjs in.glb out.glb [--amount 0.07] [--depth 0.12] [--front 0.12]
   - --amount : いちばん深いところで、どれだけ細くするか（割合）
   - --depth  : あごの骨から下、この深さまでを対象にする（坂の長さ）
   - --front  : これより手前（z）は触らない。正面のあごを痩せさせないため

   ※ 顔の固定（fix-head-weights.mjs）の後に実行する。
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const args = process.argv.slice(2);
const [IN, OUT] = args.filter((a) => !a.startsWith('--'));
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const AMOUNT = opt('amount', 0.07);
const DEPTH = opt('depth', 0.12);
const FRONT = opt('front', 0.12);
if (!IN || !OUT) {
  console.error('使い方: node tools/tuck-head-skirt.mjs in.glb out.glb [--amount 0.07]');
  process.exit(1);
}

/** 4x4（列優先）の逆行列。逆バインド行列から、メッシュ座標系での骨の位置を得る */
function invert(m) {
  const inv = new Float64Array(16);
  inv[0] = m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
  inv[4] = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
  inv[8] = m[4]*m[9]*m[15] - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
  inv[12] = -m[4]*m[9]*m[14] + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
  inv[1] = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
  inv[5] = m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
  inv[9] = -m[0]*m[9]*m[15] + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
  inv[13] = m[0]*m[9]*m[14] - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
  inv[2] = m[1]*m[6]*m[15] - m[1]*m[7]*m[14] - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7] - m[13]*m[3]*m[6];
  inv[6] = -m[0]*m[6]*m[15] + m[0]*m[7]*m[14] + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7] + m[12]*m[3]*m[6];
  inv[10] = m[0]*m[5]*m[15] - m[0]*m[7]*m[13] - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7] - m[12]*m[3]*m[5];
  inv[14] = -m[0]*m[5]*m[14] + m[0]*m[6]*m[13] + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6] + m[12]*m[2]*m[5];
  inv[3] = -m[1]*m[6]*m[11] + m[1]*m[7]*m[10] + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7] + m[9]*m[3]*m[6];
  inv[7] = m[0]*m[6]*m[11] - m[0]*m[7]*m[10] - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7] - m[8]*m[3]*m[6];
  inv[11] = -m[0]*m[5]*m[11] + m[0]*m[7]*m[9] + m[4]*m[1]*m[11] - m[4]*m[3]*m[9] - m[8]*m[1]*m[7] + m[8]*m[3]*m[5];
  inv[15] = m[0]*m[5]*m[10] - m[0]*m[6]*m[9] - m[4]*m[1]*m[10] + m[4]*m[2]*m[9] + m[8]*m[1]*m[6] - m[8]*m[2]*m[5];
  const det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
  for (let i = 0; i < 16; i++) inv[i] /= det;
  return inv;
}

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(IN);
const root = doc.getRoot();
const skin = root.listSkins()[0];
const names = skin.listJoints().map((j) => j.getName());
const headIndex = names.indexOf('Head');
if (headIndex < 0) throw new Error('Head ボーンが見つかりません');
const hm = invert(skin.getInverseBindMatrices().getElement(headIndex, new Array(16)));
const headY = hm[13];
const headZ = hm[14];

let moved = 0;
let most = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const P = prim.getAttribute('POSITION');
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    if (!P || !J || !W) continue;
    const p = [0, 0, 0];
    const j = [0, 0, 0, 0];
    const w = [0, 0, 0, 0];
    for (let i = 0; i < P.getCount(); i++) {
      J.getElement(i, j);
      W.getElement(i, w);
      let h = 0;
      for (let k = 0; k < 4; k++) if (j[k] === headIndex) h += w[k];
      if (h < 0.5) continue;
      P.getElement(i, p);
      /* あごの骨より下ほど強く、DEPTH で頭打ち */
      const down = (headY - p[1]) / DEPTH;
      if (down <= 0) continue;
      const a = Math.min(1, down);
      /* 手前（正面のあご）は触らない。FRONT より奥だけ、なめらかに */
      const back = Math.min(1, Math.max(0, (FRONT - (p[2] - headZ)) / FRONT));
      const t = a * a * (3 - 2 * a) * (back * back * (3 - 2 * back));
      if (t <= 0) continue;
      const k = 1 - AMOUNT * t;
      const dx = p[0] * (k - 1);
      const dz = (p[2] - headZ) * (k - 1);
      p[0] += dx;
      p[2] += dz;
      P.setElement(i, p);
      most = Math.max(most, Math.hypot(dx, dz));
      moved++;
    }
  }
}
console.log(`頭のすそを細くした: ${moved}頂点（いちばん動いたところで ${most.toFixed(3)}）`);
await io.write(OUT, doc);
console.log('->', OUT);
