/* 動かすと裂ける三角形を、その場で剛体にする。**穴は空けない。**

   ▍何が起きるか
   看板キャラSR（王様）の肩は、**固めた肩章と、腕と一緒に動く袖の境目**が
   引き伸ばされて、合わせ目にトゲが出る。頂点を引っ込めても消えない——
   伸びているのは面なので、両端を動かしても伸び自体は残る。

   ▍直し方：三角形の頂点を複製して、1つの塗りに揃える
   塗りを揃えた三角形は剛体として動くので、もう伸びない。面は残るので
   穴も空かない。複製するので、**その三角形だけ**が変わる（ウェイトを
   直接ならすと、その頂点を使っている隣の面まで変わって、裂け目が隣へ移る）。

   合わせ目は、動いたときに小さな段差として出る。トゲよりはよほど良い。

   ▍**範囲を必ず限る（--at）**
   モデル全体に掛けると、**上着じゅうに割れ目が出た**（しきい値0.03で
   5601枚が剛体になり、胸と腹が裂けて見えた）。剛体にした三角形は隣と
   一緒に動かないので、掛けすぎると段差だらけになる。悪さをしている
   場所（tools/find-spikes.mjs が教えてくれる）の半径ぶんだけに掛ける。

   使い方:
     node tools/cut-tearing-faces.mjs in.glb out.glb --at 0.51,0.0,0.06 --radius 0.16 [--eps 0.03] [--mirror]
   - --at     : バインド座標での中心（複数回書ける）。省略すると全体
   - --radius : この距離まで
   - --eps    : 「裂けた」とみなす実寸のひらき（モデル全高2.0のうち）
   - --mirror : xの符号を反転した場所にも掛ける

   確認は tools/find-spikes.mjs（突起が減ったか）と、上着に割れ目が
   出ていないかの目視。
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
const RADIUS = num('radius', 0.16);
const EPS = num('eps', 0.03);
const STEPS = num('steps', 6);
const MIRROR = args.includes('--mirror');
if (!IN || !OUT) {
  console.error('使い方: node tools/cut-tearing-faces.mjs in.glb out.glb --at x,y,z --radius 0.16 [--eps 0.03]');
  process.exit(1);
}
const spots = MIRROR ? AT.flatMap(([x, y, z]) => [[x, y, z], [-x, y, z]]) : AT;

/* ——— 行列（列優先）。stretch-report.mjs と同じ ——— */
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
const apply = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(IN);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const skin = root.listSkins()[0];
const joints = skin.listJoints();
const ibm = skin.getInverseBindMatrices();

function poseAt(anim, t) {
  const trs = new Map();
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
    if (!trs.has(node)) trs.set(node, {});
    trs.get(node)[ch.getTargetPath()] = a.map((x, k) => x + (b[k] - x) * u);
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

const poses = [];
for (const anim of root.listAnimations()) {
  let dur = 0;
  for (const s of anim.listSamplers()) {
    const input = s.getInput();
    if (input) dur = Math.max(dur, input.getElement(input.getCount() - 1, [0])[0]);
  }
  for (let st = 0; st < STEPS; st++) {
    const world = worldMatrices(poseAt(anim, (dur * st) / STEPS));
    poses.push(joints.map((j, i) =>
      mul(world.get(j) ?? compose([0, 0, 0], [0, 0, 0, 1], [1, 1, 1]), ibm.getElement(i, new Array(16)))));
  }
}

let hit = 0;
let dupes = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const P = prim.getAttribute('POSITION');
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    const idx = prim.getIndices();
    if (!P || !J || !W || !idx) continue;
    const count = P.getCount();

    const bind = new Float64Array(count * 3);
    const v = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      P.getElement(i, v);
      bind[i * 3] = v[0];
      bind[i * 3 + 1] = v[1];
      bind[i * 3 + 2] = v[2];
    }
    const bones = new Int32Array(count * 4);
    const wts = new Float64Array(count * 4);
    const jj = [0, 0, 0, 0];
    const ww = [0, 0, 0, 0];
    for (let i = 0; i < count; i++) {
      J.getElement(i, jj);
      W.getElement(i, ww);
      for (let k = 0; k < 4; k++) {
        bones[i * 4 + k] = jj[k];
        wts[i * 4 + k] = ww[k];
      }
    }
    /** その頂点が、直す範囲の中にあるか */
    const inRange = (i) => {
      if (!spots.length) return true;
      for (const [x, y, z] of spots) {
        if (Math.hypot(bind[i*3] - x, bind[i*3+1] - y, bind[i*3+2] - z) < RADIUS) return true;
      }
      return false;
    };

    const tris = idx.getCount() / 3;
    const grow = new Float64Array(tris);
    const posed = new Float64Array(count * 3);
    for (const skinM of poses) {
      for (let i = 0; i < count; i++) {
        const x = bind[i*3], y = bind[i*3+1], z = bind[i*3+2];
        let ax = 0, ay = 0, az = 0;
        for (let k = 0; k < 4; k++) {
          const w = wts[i*4+k];
          if (w <= 0) continue;
          const q = apply(skinM[bones[i*4+k]], x, y, z);
          ax += q[0]*w; ay += q[1]*w; az += q[2]*w;
        }
        posed[i*3] = ax; posed[i*3+1] = ay; posed[i*3+2] = az;
      }
      for (let t = 0; t < idx.getCount(); t += 3) {
        const a = idx.getScalar(t), b = idx.getScalar(t+1), c = idx.getScalar(t+2);
        for (const [p, q] of [[a, b], [b, c], [c, a]]) {
          const d0 = Math.hypot(bind[p*3]-bind[q*3], bind[p*3+1]-bind[q*3+1], bind[p*3+2]-bind[q*3+2]);
          const d1 = Math.hypot(posed[p*3]-posed[q*3], posed[p*3+1]-posed[q*3+1], posed[p*3+2]-posed[q*3+2]);
          const g = Math.abs(d1 - d0);
          if (g > grow[t/3]) grow[t/3] = g;
        }
      }
    }

    const extra = [];
    const newIdx = [];
    for (let t = 0; t < idx.getCount(); t += 3) {
      const vi = [idx.getScalar(t), idx.getScalar(t+1), idx.getScalar(t+2)];
      if (grow[t/3] <= EPS || !vi.some(inRange)) {
        newIdx.push(...vi);
        continue;
      }
      hit++;
      /* 揃える先は「いちばん重い骨の重みが大きい頂点」＝素性のはっきりした頂点。
         中途半端に混ざった頂点に揃えると、また裂ける */
      let from = vi[0];
      let best = -1;
      for (const i of vi) {
        let top = 0;
        for (let k = 0; k < 4; k++) top = Math.max(top, wts[i*4+k]);
        if (top > best) { best = top; from = i; }
      }
      newIdx.push(...vi.map((i) => {
        if (i === from) return i;
        extra.push({ src: i, from });
        dupes++;
        return count + extra.length - 1;
      }));
    }

    if (extra.length) {
      for (const semantic of prim.listSemantics()) {
        const acc = prim.getAttribute(semantic);
        const src = acc.getArray();
        const comps = acc.getElementSize();
        const out = new src.constructor((count + extra.length) * comps);
        out.set(src.subarray(0, count * comps));
        for (let e = 0; e < extra.length; e++) {
          /* 形（位置・法線・UV）は自分のもの、塗り（骨）は揃える先から */
          const take = semantic === 'JOINTS_0' || semantic === 'WEIGHTS_0' ? extra[e].from : extra[e].src;
          out.set(src.subarray(take * comps, take * comps + comps), (count + e) * comps);
        }
        prim.setAttribute(
          semantic,
          doc.createAccessor().setType(acc.getType()).setArray(out)
            .setNormalized(acc.getNormalized()).setBuffer(buffer),
        );
      }
    }
    prim.setIndices(
      doc.createAccessor().setType('SCALAR')
        .setArray(new (idx.getArray().constructor)(newIdx)).setBuffer(buffer),
    );
  }
}

for (const acc of root.listAccessors()) {
  if (acc.listParents().every((p) => p.propertyType === 'Root')) acc.dispose();
}
await io.write(OUT, doc);
console.log(`裂ける三角形を剛体化: ${hit}枚（複製した頂点 ${dupes}個・穴は空けない）`);
console.log('->', OUT);
