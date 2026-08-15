/* 指定した骨がある程度乗っている頂点を、その骨100%に固定する。

   ▍何のために
   看板キャラSR（王様）は、**手を下ろすと肩のあたりに金色の欠片が浮く**。
   正体は肩章（エポーレット）。肩の骨と腕の骨が半々に塗られていて
   （鎖骨0.44 / 上腕0.38+0.18）、腕が下がると引き裂かれてトゲになる。

   肩章は**硬い飾り**なので、腕と一緒に曲がる必要がない。鎖骨に固定すれば
   ただの剛体になり、裂けようがない。顔を Head 100% で固めるのと同じ考え方
   （→ tools/fix-head-weights.mjs）。

   ▍面は触らない
   ウェイトだけを書き換える。静止姿勢の見た目は変わらない。

   使い方:
     node tools/lock-bone-weights.mjs in.glb out.glb --bone L_Clavicle,R_Clavicle [--lock 0.35] [--dry]
   - --lock : この骨がこれ以上乗っていたら、その骨100%にする

   確認は tools/stretch-report.mjs と、腕を下ろした姿の見た目。
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const args = process.argv.slice(2);
const [IN, OUT] = args.filter((a) => !a.startsWith('--'));
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const BONES = String(opt('bone', '')).split(',').filter(Boolean);
const LOCK = Number(opt('lock', 0.35));
const DRY = args.includes('--dry');
if (!IN || !BONES.length) {
  console.error('使い方: node tools/lock-bone-weights.mjs in.glb out.glb --bone L_Clavicle,R_Clavicle [--lock 0.35]');
  process.exit(1);
}

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(IN);
const root = doc.getRoot();
const names = root.listSkins()[0].listJoints().map((j) => j.getName());
const targets = BONES.map((b) => {
  const i = names.indexOf(b);
  if (i < 0) throw new Error(`骨が見つかりません: ${b}`);
  return i;
});

let locked = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    if (!J || !W) continue;
    const j = [0, 0, 0, 0];
    const w = [0, 0, 0, 0];
    for (let i = 0; i < J.getCount(); i++) {
      J.getElement(i, j);
      W.getElement(i, w);
      /* いちばん乗っている対象の骨をさがす */
      let best = -1;
      let bw = 0;
      for (let k = 0; k < 4; k++) {
        if (!targets.includes(j[k])) continue;
        if (w[k] > bw) { bw = w[k]; best = j[k]; }
      }
      if (best < 0 || bw < LOCK || bw >= 0.999) continue;
      J.setElement(i, [best, 0, 0, 0]);
      W.setElement(i, [1, 0, 0, 0]);
      locked++;
    }
  }
}
console.log(`${BONES.join('/')} 100%に固定: ${locked}頂点 (lock=${LOCK})`);
if (!DRY) {
  await io.write(OUT, doc);
  console.log('->', OUT);
}
