/* Tripoが NlaTrack.00x という無意味名で吐いたアニメを、
   **名前の付いた既存アバター**と骨の動きで突き合わせて対応表を作る。

   同じモーションライブラリから作られたキャラどうしなら、ボーンごとの
   最大回転量がほぼ一致する（別クリップなら桁で違う）。それを指紋にして
   最も近いものを1対1で割り当てる。

   使い方:
     node tools/match-anims.mjs <名前つき.glb> [<名前つき2.glb> ...] <NlaTrackのままの.glb>
       [> tools/anim-names/<id>.json]

   基準は複数渡せる。新キャラのように「どの既存キャラとも一部しか
   モーションが被らない」場合は、男女ぶん渡すと拾える
   （同じ名前が複数の基準にあるときは、近いほうが採用される）。

   出力は tools/anim-names/<id>.json にそのまま使えるJSON。
   採点は stderr に出るので、確信度が低い行は目で確かめること。
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

/** 先頭キーからの最大回転角（度） */
const quatRange = (acc) => {
  const q0 = acc.getElement(0, []);
  const q = [];
  let max = 0;
  for (let i = 1; i < acc.getCount(); i++) {
    acc.getElement(i, q);
    const dot = Math.min(1, Math.abs(q0[0] * q[0] + q0[1] * q[1] + q0[2] * q[2] + q0[3] * q[3]));
    max = Math.max(max, (2 * Math.acos(dot) * 180) / Math.PI);
  }
  return max;
};

/** 1クリップの指紋。ボーン名 -> 最大回転角、と 尺・移動量 */
function fingerprint(anim) {
  const bones = {};
  let move = 0;
  let dur = 0;
  for (const ch of anim.listChannels()) {
    const node = ch.getTargetNode();
    if (!node) continue;
    const out = ch.getSampler().getOutput();
    const input = ch.getSampler().getInput();
    if (input) dur = Math.max(dur, input.getElement(input.getCount() - 1, [0])[0]);
    if (ch.getTargetPath() === 'rotation') {
      bones[node.getName()] = quatRange(out);
    } else if (ch.getTargetPath() === 'translation') {
      const v = [];
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < out.getCount(); i++) {
        out.getElement(i, v);
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], v[k]);
          max[k] = Math.max(max[k], v[k]);
        }
      }
      move = Math.max(move, Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]));
    }
  }
  return { bones, move, dur };
}

/** 指紋どうしの距離。小さいほど同じクリップらしい */
function distance(a, b) {
  const names = new Set([...Object.keys(a.bones), ...Object.keys(b.bones)]);
  let sum = 0;
  for (const n of names) sum += Math.abs((a.bones[n] ?? 0) - (b.bones[n] ?? 0));
  /* 尺は強い手がかり。0.1秒ずれるごとに骨5度ぶんの罰を足す */
  sum += Math.abs(a.dur - b.dur) * 50;
  sum += Math.abs(a.move - b.move) * 20;
  return sum / Math.max(1, names.size);
}

const args = process.argv.slice(2);
const targetPath = args[args.length - 1];
const refPaths = args.slice(0, -1);
const tgtDoc = await io.read(targetPath);

const refs = [];
for (const p of refPaths) {
  const doc = await io.read(p);
  for (const a of doc.getRoot().listAnimations()) {
    refs.push({ name: a.getName(), fp: fingerprint(a) });
  }
}
const tgts = tgtDoc
  .getRoot()
  .listAnimations()
  .map((a) => ({ name: a.getName(), fp: fingerprint(a) }));

/* 全組み合わせの距離を出して、近い順に1対1で確定させる */
const pairs = [];
for (const t of tgts) for (const r of refs) pairs.push({ t: t.name, r: r.name, d: distance(t.fp, r.fp) });
pairs.sort((x, y) => x.d - y.d);

const map = {};
const usedT = new Set();
const usedR = new Set();
const chosen = [];
for (const p of pairs) {
  if (usedT.has(p.t) || usedR.has(p.r)) continue;
  usedT.add(p.t);
  usedR.add(p.r);
  map[p.t] = p.r;
  chosen.push(p);
}

/* 2番目の候補とどれだけ離れているかを確信度にする */
for (const c of chosen.sort((a, b) => a.r.localeCompare(b.r))) {
  const second = pairs.find((p) => p.t === c.t && p.r !== c.r);
  const margin = second ? second.d - c.d : Infinity;
  const mark = c.d > 8 ? '△要確認' : margin < 3 ? '△僅差' : 'OK';
  console.error(
    `  ${c.r.padEnd(14)} <- ${c.t.padEnd(14)} 距離${c.d.toFixed(2)} 次点差${margin === Infinity ? '-' : margin.toFixed(2)}  ${mark}`,
  );
}
/* 余ったクリップ（対応先が無いもの）は捨てる対象 */
for (const t of tgts) if (!usedT.has(t.name)) console.error(`  (余り) ${t.name} ${t.fp.dur.toFixed(2)}s`);

console.log(JSON.stringify(map, null, 2));
