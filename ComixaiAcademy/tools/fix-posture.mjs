/* アバターの前傾（下向き）を起こす。

   Tripoのモーションは元キャラのバインドポーズに合わせて焼かれているので、
   キャラによっては背骨が起き上がらず、全モーションで下を向いたままになる。
   ここでは指定ボーンの回転に一定角のピッチを足して、上半身を起こす。

   - 各アニメのrotationキー全部と、restポーズの両方に効かせる
   - 親フレーム側から掛ける（= そのボーンから先が丸ごと傾く）
   - transcode-avatar.mjs の後に、軽くなったGLBに対して実行する

   使い方:
     node tools/fix-posture.mjs <入力.glb> <出力.glb> Spine01=8 Spine02=6 NeckTwist01=6
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const [src, out, ...pairs] = process.argv.slice(2);
const OFFSETS = Object.fromEntries(
  pairs.map((p) => {
    const [name, deg] = p.split('=');
    return [name, (Number(deg) * Math.PI) / 180];
  }),
);

/* q1 * q2 （[x,y,z,w]） */
const mul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const norm = (q) => {
  const n = Math.hypot(...q);
  return q.map((v) => v / n);
};
/* X軸まわり（ピッチ）の補正クォータニオン */
const pitchQuat = (rad) => [Math.sin(rad / 2), 0, 0, Math.cos(rad / 2)];

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const doc = await io.read(src);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];

/* restポーズ側 */
for (const node of root.listNodes()) {
  const rad = OFFSETS[node.getName()];
  if (rad === undefined) continue;
  node.setRotation(norm(mul(pitchQuat(rad), node.getRotation())));
}

/* 各アニメのrotationキー側。
   dedupで同じキー列が共有されていることがあるので、必ず複製してから書き換える */
let touched = 0;
for (const anim of root.listAnimations()) {
  for (const ch of anim.listChannels()) {
    const node = ch.getTargetNode();
    if (ch.getTargetPath() !== 'rotation' || !node) continue;
    const rad = OFFSETS[node.getName()];
    if (rad === undefined) continue;

    const src = ch.getSampler().getOutput();
    const q = pitchQuat(rad);
    const next = new Float32Array(src.getCount() * 4);
    for (let i = 0; i < src.getCount(); i++) {
      const v = norm(mul(q, src.getElement(i, [0, 0, 0, 0])));
      next.set(v, i * 4);
    }
    ch.getSampler().setOutput(
      doc.createAccessor().setType('VEC4').setArray(next).setBuffer(buffer),
    );
    touched++;
  }
}

/* 差し替えで参照されなくなったアクセサを捨てる。放置するとGLBに残って太る */
for (const acc of root.listAccessors()) {
  if (acc.listParents().every((p) => p.propertyType === 'Root')) acc.dispose();
}

await io.write(out, doc);
console.log(
  '補正:',
  Object.entries(OFFSETS)
    .map(([n, r]) => `${n} ${((r * 180) / Math.PI).toFixed(0)}°`)
    .join(' / '),
);
console.log('書き換えたrotationチャンネル:', touched, '本');
console.log('->', out);
