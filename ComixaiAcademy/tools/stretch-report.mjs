/* スキニングを実際に計算して、モーション中に裂ける面を見つける。

   目視で「ここが変」と探すのをやめるための道具。バインドポーズと
   各モーションの姿勢で辺の長さを比べる。

   ▍見るのは「倍率」ではなく「実寸のひらき」
   倍率で並べると、簡略化でできた**極小の三角形**が上位を独占する。
   元の辺が0.001しかないので少し動くだけで20倍になり、目には見えない。
   実際に画面で見えるのは**実寸で0.05以上ひらいた面**（モデル全高2.0に対して）。
   看板キャラSRでは 1.5倍以上=917枚 に対し、実寸0.05以上は27枚だった。
   ここを取り違えると、見えないノイズを何時間も追いかけることになる。

   ▍モーションは全部見る
   1本だけ見ると規模を1桁見誤る（waveだけなら27枚、全11本だと451枚だった）。
   --anim を省略すると全モーションを見る。

   使い方:
     node tools/stretch-report.mjs model.glb [--anim wave] [--steps 8] [--top 12]

   出力: 伸び率の分布、実寸でひらいた枚数、上位の三角形の位置と、
        頂点ごとのボーン（どのボーン同士が食い違っているかが分かる）。
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const args = process.argv.slice(2);
const IN = args.find((a) => !a.startsWith('--'));
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const ANIM = opt('anim', null);
const STEPS = Number(opt('steps', 8));
const TOP = Number(opt('top', 12));

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

/* ——— 行列まわり（列優先） ——— */
const mul = (a, b) => {
  const o = new Float64Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
};
const compose = ([tx, ty, tz], [x, y, z, w], [sx, sy, sz]) =>
  new Float64Array([
    (1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
    2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
    2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    tx, ty, tz, 1,
  ]);
const apply = (m, [x, y, z]) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

const doc = await io.read(IN);
const root = doc.getRoot();
const skin = root.listSkins()[0];
const joints = skin.listJoints();
const jointIndex = new Map(joints.map((j, i) => [j, i]));
const ibm = skin.getInverseBindMatrices();
const names = joints.map((j) => j.getName());

const parentOf = new Map();
for (const n of root.listNodes()) for (const c of n.listChildren()) parentOf.set(c, n);

/** 時刻tでのノードのTRS（アニメが無ければ静止値） */
function poseAt(anim, t) {
  const trs = new Map();
  if (!anim) return trs;
  for (const ch of anim.listChannels()) {
    const node = ch.getTargetNode();
    if (!node) continue;
    const s = ch.getSampler();
    const input = s.getInput();
    const output = s.getOutput();
    const n = input.getCount();
    let i = 0;
    while (i < n - 1 && input.getScalar(i + 1) < t) i++;
    const t0 = input.getScalar(i);
    const t1 = input.getScalar(Math.min(i + 1, n - 1));
    const u = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
    const size = output.getElementSize();
    const a = output.getElement(i, new Array(size));
    const b = output.getElement(Math.min(i + 1, n - 1), new Array(size));
    const v = a.map((x, k) => x + (b[k] - x) * u);
    if (!trs.has(node)) trs.set(node, {});
    trs.get(node)[ch.getTargetPath()] = v;
  }
  return trs;
}

function worldMatrices(trs) {
  const world = new Map();
  const walk = (node, parent) => {
    const o = trs.get(node) ?? {};
    const m = compose(
      o.translation ?? node.getTranslation(),
      o.rotation ?? node.getRotation(),
      o.scale ?? node.getScale(),
    );
    const w = parent ? mul(parent, m) : m;
    world.set(node, w);
    for (const c of node.listChildren()) walk(c, w);
  };
  for (const scene of root.listScenes()) for (const n of scene.listChildren()) walk(n, null);
  return world;
}

for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const P = prim.getAttribute('POSITION');
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    const idx = prim.getIndices();
    if (!P || !J || !W || !idx) continue;
    const n = P.getCount();
    const bind = new Float64Array(n * 3);
    const v = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      P.getElement(i, v);
      bind[i * 3] = v[0];
      bind[i * 3 + 1] = v[1];
      bind[i * 3 + 2] = v[2];
    }

    const anims = ANIM ? root.listAnimations().filter((a) => a.getName() === ANIM) : root.listAnimations();
    const worst = new Float64Array(idx.getCount() / 3); // 倍率
    const grow = new Float64Array(idx.getCount() / 3);  // 絶対量（元の長さからの増加）
    const worstAnim = new Array(idx.getCount() / 3).fill('');

    for (const anim of anims) {
      let dur = 0;
      for (const s of anim.listSamplers()) {
        const input = s.getInput();
        if (input) dur = Math.max(dur, input.getElement(input.getCount() - 1, [0])[0]);
      }
      for (let st = 0; st < STEPS; st++) {
        const t = (dur * st) / STEPS;
        const world = worldMatrices(poseAt(anim, t));
        /* skinMatrix = jointWorld × inverseBind */
        const skinM = joints.map((j, i) => mul(world.get(j) ?? compose([0,0,0],[0,0,0,1],[1,1,1]), ibm.getElement(i, new Array(16))));
        const posed = new Float64Array(n * 3);
        const jj = [0, 0, 0, 0];
        const ww = [0, 0, 0, 0];
        for (let i = 0; i < n; i++) {
          J.getElement(i, jj);
          W.getElement(i, ww);
          const p = [bind[i * 3], bind[i * 3 + 1], bind[i * 3 + 2]];
          let x = 0, y = 0, z = 0;
          for (let k = 0; k < 4; k++) {
            if (ww[k] <= 0) continue;
            const q = apply(skinM[jj[k]], p);
            x += q[0] * ww[k];
            y += q[1] * ww[k];
            z += q[2] * ww[k];
          }
          posed[i * 3] = x;
          posed[i * 3 + 1] = y;
          posed[i * 3 + 2] = z;
        }
        for (let t3 = 0; t3 < idx.getCount(); t3 += 3) {
          const a = idx.getScalar(t3), b = idx.getScalar(t3 + 1), c = idx.getScalar(t3 + 2);
          let ratio = 1;
          for (const [p, q] of [[a, b], [b, c], [c, a]]) {
            const d0 = Math.hypot(bind[p*3]-bind[q*3], bind[p*3+1]-bind[q*3+1], bind[p*3+2]-bind[q*3+2]);
            const d1 = Math.hypot(posed[p*3]-posed[q*3], posed[p*3+1]-posed[q*3+1], posed[p*3+2]-posed[q*3+2]);
            if (d0 > 1e-6) ratio = Math.max(ratio, d1 / d0);
            if (d1 - d0 > (grow[t3 / 3] ?? 0)) grow[t3 / 3] = d1 - d0;
          }
          const ti = t3 / 3;
          if (ratio > worst[ti]) {
            worst[ti] = ratio;
            worstAnim[ti] = anim.getName();
          }
        }
      }
    }

    /* 分布 */
    const buckets = { '1.5倍以上': 0, '2倍以上': 0, '3倍以上': 0, '5倍以上': 0 };
    for (const r of worst) {
      if (r >= 1.5) buckets['1.5倍以上']++;
      if (r >= 2) buckets['2倍以上']++;
      if (r >= 3) buckets['3倍以上']++;
      if (r >= 5) buckets['5倍以上']++;
    }
    console.log(IN.split(/[\\/]/).pop(), `三角形 ${worst.length}枚`);
    for (const [k, c] of Object.entries(buckets)) console.log(`  伸び ${k.padEnd(8)} ${c}枚`);

    /* 上位。位置と、付いているボーン */
    const big = [...grow].filter((g) => g > 0.05).length;
    console.log(`  ★実寸で0.05以上ひらいた三角形: ${big}枚（モデル全高2.0のうち）`);
    const order = [...grow.keys()].sort((a, b) => grow[b] - grow[a]).slice(0, TOP);
    for (const ti of order) {
      const vs = [idx.getScalar(ti*3), idx.getScalar(ti*3+1), idx.getScalar(ti*3+2)];
      const per = [];
      const bones = new Set();
      const jj = [0,0,0,0], ww = [0,0,0,0];
      for (const vi of vs) {
        J.getElement(vi, jj);
        W.getElement(vi, ww);
        for (let k = 0; k < 4; k++) if (ww[k] > 0.2) bones.add(names[jj[k]]);
        let bi = 0;
        for (let k = 1; k < 4; k++) if (ww[k] > ww[bi]) bi = k;
        per.push(`${names[jj[bi]]}:${(ww[bi]*100).toFixed(0)}%`);
      }
      const cx = vs.reduce((s, vi) => s + bind[vi*3], 0) / 3;
      const cy = vs.reduce((s, vi) => s + bind[vi*3+1], 0) / 3;
      const cz = vs.reduce((s, vi) => s + bind[vi*3+2], 0) / 3;
      console.log(
        `  ひらき${grow[ti].toFixed(3)} (${worst[ti].toFixed(1)}倍 ${worstAnim[ti]}) 位置 x${cx.toFixed(2)} y${cy.toFixed(2)} z${cz.toFixed(2)}
      頂点ごと: ${per.join(" / ")}`,
      );
    }
  }
}
