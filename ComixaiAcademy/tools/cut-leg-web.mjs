/* 左右の脚をつないでいる余計な面（内ももや靴の間の膜）を削る。

   Tripoは脚がくっついた姿勢で生成すると、内ももや靴の内側に本来ない面を張る。
   これがあると脚を開いたときに水かきのように伸びる。

   左脚に属する頂点と右脚に属する頂点を「両方含む」三角形を、指定の高さより下で削除する。
   股（ズボンとして本来つながる所。y=-0.25あたり）は残すので --below は -0.30 程度にする。

   使い方:
     node tools/cut-leg-web.mjs in.glb out.glb [--below -0.30]

   ※ ウェイトで左右を判定するので、先に fix-leg-weights.mjs をかけてから実行すること
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const args = process.argv.slice(2);
const [IN, OUT] = args.filter((a) => !a.startsWith('--'));
const i = args.indexOf('--below');
const BELOW = i >= 0 ? Number(args[i + 1]) : -0.3;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const doc = await io.read(IN);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const joints = root.listSkins()[0].listJoints().map((j) => j.getName());
const side = (n) =>
  /^L_(Thigh|Calf|Foot|Toe)/.test(n) ? 'L' : /^R_(Thigh|Calf|Foot|Toe)/.test(n) ? 'R' : '';

let removed = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    const P = prim.getAttribute('POSITION');
    const idx = prim.getIndices();
    if (!J || !W || !idx) continue;

    /* 頂点ごとに、左脚寄りか右脚寄りかを決める */
    const owner = new Array(J.getCount());
    for (let v = 0; v < J.getCount(); v++) {
      const j = J.getElement(v, [0, 0, 0, 0]);
      const w = W.getElement(v, [0, 0, 0, 0]);
      let l = 0;
      let r = 0;
      for (let k = 0; k < 4; k++) {
        const s = side(joints[j[k]]);
        if (s === 'L') l += w[k];
        if (s === 'R') r += w[k];
      }
      owner[v] = l > 0.5 ? 'L' : r > 0.5 ? 'R' : '-';
    }

    const keep = [];
    for (let t = 0; t < idx.getCount(); t += 3) {
      const vi = [idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2)];
      const o = vi.map((v) => owner[v]);
      const y = vi.reduce((s, v) => s + P.getElement(v, [0, 0, 0])[1], 0) / 3;
      if (o.includes('L') && o.includes('R') && y < BELOW) {
        removed++;
        continue;
      }
      keep.push(...vi);
    }

    const Ctor = idx.getArray().constructor;
    prim.setIndices(
      doc.createAccessor().setType('SCALAR').setArray(new Ctor(keep)).setBuffer(buffer),
    );
  }
}

/* 差し替えで参照されなくなったアクセサを捨てる。放置するとGLBに残って太る */
for (const acc of root.listAccessors()) {
  if (acc.listParents().every((p) => p.propertyType === 'Root')) acc.dispose();
}

await io.write(OUT, doc);
console.log(`削除した三角形: ${removed} (below=${BELOW})`);
console.log('->', OUT);
