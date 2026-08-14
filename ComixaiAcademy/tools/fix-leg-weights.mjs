/* 内ももが左右の脚ボーンに「またがって」バインドされているのを解消する。

   Tripoの自動スキニングは、バインドポーズで脚がくっついていると、
   内ももの頂点に反対側の脚のウェイトまで乗せてしまう。すると脚を開いたとき、
   内ももが反対の脚に引っ張られて膜のように伸び、太ももが太く見える。

   ここでは脚の領域の頂点について、左右のうちウェイトが小さい側を落として
   正規化し直す（同じ側の Thigh/Calf/Foot の配分は残すので、膝や足首は曲がる）。

   使い方:
     node tools/fix-leg-weights.mjs in.glb out.glb [--below -0.16] [--blend 0.08]
   - --below : この高さ(y)より下は完全に片側だけにする
   - --blend : below〜below+blend は徐々に効かせる（股のあたりに段差を作らないため）
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
const BELOW = opt('below', -0.16);
const BLEND = opt('blend', 0.08);

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const doc = await io.read(IN);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const joints = root.listSkins()[0].listJoints().map((j) => j.getName());
const isL = (n) => /^L_(Thigh|Calf|Foot|Toe)/.test(n);
const isR = (n) => /^R_(Thigh|Calf|Foot|Toe)/.test(n);

let fixed = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    const P = prim.getAttribute('POSITION');
    if (!J || !W || !P) continue;

    /* 量子化されたウェイト(正規化ushort等)はそのままの型で書き戻す。
       float32に戻すとGLBが1割ほど太るため */
    const Ctor = W.getArray().constructor;
    const normalized = W.getNormalized();
    const SCALE = normalized ? (Ctor === Uint8Array ? 255 : 65535) : 1;
    const out = new Ctor(W.getCount() * 4);
    for (let i = 0; i < W.getCount(); i++) {
      const j = J.getElement(i, [0, 0, 0, 0]);
      const w = W.getElement(i, [0, 0, 0, 0]);
      const y = P.getElement(i, [0, 0, 0])[1];

      /* 効かせ具合。below より下で1、below+blend で0 */
      const t = Math.max(0, Math.min(1, (BELOW + BLEND - y) / BLEND));
      let l = 0;
      let r = 0;
      for (let k = 0; k < 4; k++) {
        if (isL(joints[j[k]])) l += w[k];
        if (isR(joints[j[k]])) r += w[k];
      }

      if (t > 0 && Math.min(l, r) > 0.02) {
        const weak = l >= r ? isR : isL; /* 弱い側を落とす */
        for (let k = 0; k < 4; k++) if (weak(joints[j[k]])) w[k] *= 1 - t;
        const sum = w[0] + w[1] + w[2] + w[3];
        if (sum > 0) for (let k = 0; k < 4; k++) w[k] /= sum;
        fixed++;
      }
      if (SCALE === 1) {
        out.set(w, i * 4);
      } else {
        /* 丸め誤差は最大成分に寄せて、合計がちょうど SCALE になるようにする */
        const q = w.map((v) => Math.round(v * SCALE));
        let big = 0;
        for (let k = 1; k < 4; k++) if (q[k] > q[big]) big = k;
        q[big] += SCALE - (q[0] + q[1] + q[2] + q[3]);
        out.set(q, i * 4);
      }
    }
    prim.setAttribute(
      'WEIGHTS_0',
      doc
        .createAccessor()
        .setType('VEC4')
        .setArray(out)
        .setNormalized(normalized)
        .setBuffer(buffer),
    );
  }
}

/* 差し替えで参照されなくなったアクセサを捨てる。放置するとGLBに残って太る */
for (const acc of root.listAccessors()) {
  if (acc.listParents().every((p) => p.propertyType === 'Root')) acc.dispose();
}

await io.write(OUT, doc);
console.log(`付け直した頂点: ${fixed}  (below=${BELOW} blend=${BLEND})`);
console.log('->', OUT);
