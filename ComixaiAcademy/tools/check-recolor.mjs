/* ============================================================
   色違いテクスチャを**測る**。目で見て「なんか変」で止めないための道具。

   ▍見ているのは4つ
   1. **陰影が残っているか**（いちばん大事）
      塗るときに彩度と明度を決め打ちにすると、布の折り目も縫い目も
      全部同じ色になって「塗り絵」になる。塗った範囲の明度の
      **標準偏差**を、素とRで比べる。素の半分を切ったら平らすぎ。
   2. **斑（まだら）になっていないか**
      島の中で「塗られた画素」と「塗られなかった画素」が**混ざる**と、
      黒い点々が散る。ただし --strict や --plmin で島の中をきれいに
      2つへ分けたときも割合は半端になるので、
      **塗り残しのふちの長さ**で点々と塗り分けを見分ける（→ ふち率）。
   3. **まるごと残った島がないか**
      2 は「島の中で混ざったもの」しか数えないので、島が丸ごと外れると
      0%＝正しい、と読めてしまう。実際それで**赤いスーツの襟と袖口に
      紺の染み**が残ったのを見逃した。塗った島たちと同じ色なのに
      1枚も塗られていない島を出す。
      （わざと残した所——かんろくのズボンなど——もここに出る。
        数字は手がかりで、決めるのはレンダリングした絵）
   4. **塗ってはいけない所を塗っていないか**
      島の元の色から、肌（暖色・明るい・彩度中）と目（白目を含む・
      顔の高さ）を見分けて、そこが塗られていたら数える。

   使い方:
     node tools/check-recolor.mjs <モデルID> <色違いのID>
     例) node tools/check-recolor.mjs ottori ottori-r

   出力: 上の4つの数字と、塗った所を緑・まだらの塗り残しを赤・
        まるごと残った島を青で示した地図
        （DIFF_OUT で出力先を変えられる。既定 /tmp）
   ============================================================ */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [ID, ROUT] = process.argv.slice(2);
if (!ID || !ROUT) {
  console.error('使い方: node tools/check-recolor.mjs <モデルID> <色違いのID>');
  process.exit(1);
}
const DIR = new URL('../assets/models/', import.meta.url).pathname;

const A = await sharp(`${DIR}${ID}-texture.jpg`).raw().toBuffer({ resolveWithObject: true });
const B = await sharp(`${DIR}${ROUT}-texture.jpg`).raw().toBuffer({ resolveWithObject: true });
const SIZE = A.info.width;
const ch = A.info.channels;
if (B.info.width !== SIZE) throw new Error('テクスチャの大きさが違います');

/* ---------- GLBから島の地図を作る（recolor-avatar.mjs と同じ読み方） ---------- */
function readGlb(p) {
  const buf = fs.readFileSync(p);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString());
  const bin = buf.subarray(20 + jsonLen + 8);
  const accessor = (idx) => {
    const acc = json.accessors[idx];
    const view = json.bufferViews[acc.bufferView];
    const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type];
    const spec = {
      5126: { size: 4, read: 'readFloatLE', div: 1 },
      5125: { size: 4, read: 'readUInt32LE', div: 1 },
      5123: { size: 2, read: 'readUInt16LE', div: 65535 },
      5122: { size: 2, read: 'readInt16LE', div: 32767 },
      5121: { size: 1, read: 'readUInt8', div: 255 },
    }[acc.componentType];
    const stride = view.byteStride ?? comps * spec.size;
    const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    const out = new Float32Array(acc.count * comps);
    const div = acc.normalized ? spec.div : 1;
    for (let e = 0; e < acc.count; e++)
      for (let c = 0; c < comps; c++)
        out[e * comps + c] = bin[spec.read](base + e * stride + c * spec.size) / div;
    return out;
  };
  return { json, accessor };
}
function buildIslands(tris, vertCount) {
  const parent = new Int32Array(vertCount);
  for (let i = 0; i < vertCount; i++) parent[i] = i;
  const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
  for (let t = 0; t < tris.length; t += 3) { union(tris[t], tris[t + 1]); union(tris[t + 1], tris[t + 2]); }
  const out = new Int32Array(tris.length / 3);
  for (let t = 0; t < out.length; t++) out[t] = find(tris[t * 3]);
  return out;
}
function fillTriangle(map, value, x0, y0, x1, y1, x2, y2) {
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)) - 1);
  const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(y0, y1, y2)) + 1);
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)) - 1);
  const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(x0, x1, x2)) + 1);
  const edge = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + 0.5, py = y + 0.5;
    const d0 = edge(x0, y0, x1, y1, px, py), d1 = edge(x1, y1, x2, y2, px, py), d2 = edge(x2, y2, x0, y0, px, py);
    if ((d0 >= 0 && d1 >= 0 && d2 >= 0) || (d0 <= 0 && d1 <= 0 && d2 <= 0)) map[y * SIZE + x] = value;
  }
}
function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d > 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

const { json, accessor } = readGlb(`${DIR}${ID}.glb`);
const islandMap = new Int32Array(SIZE * SIZE).fill(-1);
const box = new Map();
for (const mesh of json.meshes) for (const prim of mesh.primitives) {
  const pos = accessor(prim.attributes.POSITION);
  const uv = accessor(prim.attributes.TEXCOORD_0);
  const raw = prim.indices !== undefined ? accessor(prim.indices) : null;
  const tris = raw ? Int32Array.from(raw) : Int32Array.from({ length: pos.length / 3 }, (_, i) => i);
  const isl = buildIslands(tris, pos.length / 3);
  for (let t = 0; t < isl.length; t++) {
    const vi = [tris[t * 3], tris[t * 3 + 1], tris[t * 3 + 2]];
    const b = box.get(isl[t]) ?? { minY: 1e9, maxY: -1e9 };
    for (const v of vi) { b.minY = Math.min(b.minY, pos[v * 3 + 1]); b.maxY = Math.max(b.maxY, pos[v * 3 + 1]); }
    box.set(isl[t], b);
    fillTriangle(islandMap, isl[t], uv[vi[0] * 2] * SIZE, uv[vi[0] * 2 + 1] * SIZE,
      uv[vi[1] * 2] * SIZE, uv[vi[1] * 2 + 1] * SIZE, uv[vi[2] * 2] * SIZE, uv[vi[2] * 2 + 1] * SIZE);
  }
}

/* ---------- 画素ごとに、変わったかどうか ---------- */
const changed = new Uint8Array(SIZE * SIZE);
/* jpegなので、まったく同じにはならない。少しの揺れは「変わっていない」 */
const EPS = 18;
const st = new Map(); // 島 -> 統計
let nChanged = 0;
const sumA = { l: 0, l2: 0, s: 0, n: 0 };
const sumB = { l: 0, l2: 0, s: 0, n: 0 };
for (let p = 0; p < SIZE * SIZE; p++) {
  const i = p * ch;
  const d = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]);
  const isl = islandMap[p];
  if (isl < 0) continue;
  const rec = st.get(isl) ?? { n: 0, hit: 0, hx: 0, hy: 0, s: 0, l: 0, white: 0 };
  rec.n++;
  const [h, s, l] = rgbToHsl(A.data[i] / 255, A.data[i + 1] / 255, A.data[i + 2] / 255);
  rec.hx += Math.cos((h * Math.PI) / 180); rec.hy += Math.sin((h * Math.PI) / 180);
  rec.s += s; rec.l += l;
  if (l > 0.7 && s < 0.2) rec.white++;
  if (d > EPS) {
    changed[p] = 255; rec.hit++; nChanged++;
    sumA.l += l; sumA.l2 += l * l; sumA.s += s; sumA.n++;
    const [, s2, l2] = rgbToHsl(B.data[i] / 255, B.data[i + 1] / 255, B.data[i + 2] / 255);
    sumB.l += l2; sumB.l2 += l2 * l2; sumB.s += s2; sumB.n++;
  }
  st.set(isl, rec);
}
const sd = (o) => Math.sqrt(Math.max(0, o.l2 / o.n - (o.l / o.n) ** 2));

/* ---------- 島ごとの判定 ---------- */
const rows = [...st.entries()].filter(([, r]) => r.n >= 150).map(([isl, r]) => {
  let h = (Math.atan2(r.hy, r.hx) * 180) / Math.PI; if (h < 0) h += 360;
  const b = box.get(isl);
  return {
    島: isl, 画素: r.n, 塗った率: r.hit / r.n,
    色相: Math.round(h), 彩度: r.s / r.n, 明度: r.l / r.n,
    白目: r.white / r.n, 上: b.maxY, 下: b.minY,
  };
});
/* ▍**「半分だけ塗った島」＝まだら、ではない**
   --strict や --plmin/--plmax で切ると、島の中がきれいに2つに分かれる
   （猫の袖＝黄色い腕と青いシャツ、おてんばの島＝ニットとレギンス）。
   これは正しい塗り分けで、点々ではない。
   見分けるのは**塗り残しのふちの長さ**。塗り残した画素のうち、
   隣に塗った画素がいるものの割合を見る。点々なら1に近づき、
   ひとかたまりで残っているなら小さくなる。 */
const edgeRate = (isl) => {
  let rest = 0, touch = 0;
  for (let p = 0; p < SIZE * SIZE; p++) {
    if (islandMap[p] !== isl || changed[p]) continue;
    rest++;
    const x = p % SIZE, y = (p / SIZE) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue;
      if (changed[ny * SIZE + nx]) { touch++; break; }
    }
  }
  return rest ? touch / rest : 0;
};
const partial = rows.filter((r) => r.塗った率 > 0.05 && r.塗った率 < 0.95);
for (const r of partial) r.ふち率 = edgeRate(r.島);
const speckled = partial.filter((r) => r.ふち率 > 0.5);
const split = partial.filter((r) => r.ふち率 <= 0.5);
/* ▍**丸ごと塗り残された島**（まだら判定では引っかからない）
   まだらは「島の中で混ざる」ものだけを数えるので、島がまるごと外れた
   ときは 0% ＝ 正しい、と読めてしまう。実際それで、赤いスーツの襟と
   袖口と腿に紺の染みが残ったのを見逃した。
   塗った島たちの元の色を測って、**同じ色なのに1枚も塗られていない島**を
   出す（色相20度・彩度0.12・明度0.10 以内を「同じ色」とみなす）。 */
const paintedRows = rows.filter((r) => r.塗った率 >= 0.95);
const avg = (f) => paintedRows.reduce((a, r) => a + f(r) * r.画素, 0) / Math.max(1, paintedRows.reduce((a, r) => a + r.画素, 0));
const hueDist = (a, b) => { const x = Math.abs(a - b) % 360; return x > 180 ? 360 - x : x; };
const mH = (() => {
  const n = paintedRows.reduce((a, r) => a + r.画素, 0) || 1;
  const x = paintedRows.reduce((a, r) => a + Math.cos((r.色相 * Math.PI) / 180) * r.画素, 0) / n;
  const y = paintedRows.reduce((a, r) => a + Math.sin((r.色相 * Math.PI) / 180) * r.画素, 0) / n;
  let h = (Math.atan2(y, x) * 180) / Math.PI; return h < 0 ? h + 360 : h;
})();
const mS = avg((r) => r.彩度), mLv = avg((r) => r.明度);
const missed = paintedRows.length
  ? rows.filter((r) => r.塗った率 < 0.05 && r.画素 >= 400 &&
      hueDist(r.色相, mH) <= 20 && Math.abs(r.彩度 - mS) <= 0.12 && Math.abs(r.明度 - mLv) <= 0.10)
  : [];
/* 肌＝暖色で明るく、彩度が中くらい。塗ってはいけない代表 */
const isSkin = (r) => (r.色相 <= 30 || r.色相 >= 340) && r.彩度 > 0.28 && r.彩度 < 0.72 && r.明度 > 0.45;
const skinHit = rows.filter((r) => isSkin(r) && r.塗った率 > 0.05);
/* 目は顔の高さにしかない。**白い縁取りだけで目とみなさない**
   （襟と袖口が「目」に見えて、赤いスーツに紺の染みが残った件と同じ罠） */
const bodyMin = Math.min(...[...box.values()].map((b) => b.minY));
const bodyMax = Math.max(...[...box.values()].map((b) => b.maxY));
const faceY = bodyMin + (bodyMax - bodyMin) * 0.72;
const eyeHit = rows.filter((r) => r.白目 > 0.03 && r.上 >= faceY && r.塗った率 > 0.05);

console.log(`== ${ID} → ${ROUT}`);
console.log(`塗った画素 ${nChanged}（テクスチャの${((nChanged / (SIZE * SIZE)) * 100).toFixed(1)}%）`);
console.log(`陰影（塗った範囲の明度のばらつき）: 素 ${sd(sumA).toFixed(3)} → R ${sd(sumB).toFixed(3)}` +
  `  残り ${((sd(sumB) / Math.max(1e-6, sd(sumA))) * 100).toFixed(0)}%` +
  (sd(sumB) < sd(sumA) * 0.5 ? '   ← **平ら。塗り絵になっている**' : ''));
console.log(`彩度: 素 ${(sumA.s / sumA.n).toFixed(2)} → R ${(sumB.s / sumB.n).toFixed(2)}`);
console.log(`明度: 素 ${(sumA.l / sumA.n).toFixed(2)} → R ${(sumB.l / sumB.n).toFixed(2)}`);
console.log(`まだらな島（5〜95%だけ塗られた）: ${speckled.length} / ${rows.length}` +
  (speckled.length ? '   ← **黒い点々の正体**' : ''));
for (const r of speckled.sort((a, b) => b.画素 - a.画素).slice(0, 6))
  console.log(`   島${r.島} ${r.画素}画素 塗った率${(r.塗った率 * 100).toFixed(0)}% ふち率${r.ふち率.toFixed(2)}` +
    ` 色相${r.色相} 彩度${r.彩度.toFixed(2)} 明度${r.明度.toFixed(2)} 高さ${r.下.toFixed(2)}〜${r.上.toFixed(2)}`);
if (split.length) console.log(`（島の中で塗り分けた: ${split.length} … --strict や --plmin で切った所。点々ではない）`);
console.log(`塗った所と同じ色なのに、まるごと残った島: ${missed.length}` +
  (missed.length ? '   ← **染みになる**' : '') +
  `（塗った島の元の色: 色相${Math.round(mH)} 彩度${mS.toFixed(2)} 明度${mLv.toFixed(2)}）`);
for (const r of missed.sort((a, b) => b.画素 - a.画素).slice(0, 6))
  console.log(`   島${r.島} ${r.画素}画素 色相${r.色相} 彩度${r.彩度.toFixed(2)} 明度${r.明度.toFixed(2)}` +
    ` 白目${r.白目.toFixed(3)} 高さ${r.下.toFixed(2)}〜${r.上.toFixed(2)}`);
if (skinHit.length) {
  console.log(`肌らしい島が塗られている: ${skinHit.length}   ← **はみ出し**`);
  for (const r of skinHit.slice(0, 4))
    console.log(`   島${r.島} ${r.画素}画素 塗った率${(r.塗った率 * 100).toFixed(0)}% 色相${r.色相} 明度${r.明度.toFixed(2)}`);
}
if (eyeHit.length) console.log(`目の島が塗られている: ${eyeHit.length}   ← **はみ出し**`);

/* ---------- 地図を書き出す ---------- */
const out = Buffer.alloc(SIZE * SIZE * 3);
const speckSet = new Set(speckled.map((r) => r.島));
const missSet = new Set(missed.map((r) => r.島));
for (let p = 0; p < SIZE * SIZE; p++) {
  const i = p * ch;
  const [, , l] = rgbToHsl(A.data[i] / 255, A.data[i + 1] / 255, A.data[i + 2] / 255);
  const g = Math.round(60 + l * 90);
  let c;
  if (changed[p]) c = [0, 200, 90];                       // 塗った
  else if (speckSet.has(islandMap[p])) c = [235, 40, 40]; // まだらの中の塗り残し
  else if (missSet.has(islandMap[p])) c = [40, 90, 255];  // まるごと残った島
  else c = [g, g, g];
  out[p * 3] = c[0]; out[p * 3 + 1] = c[1]; out[p * 3 + 2] = c[2];
}
const dest = process.env.DIFF_OUT ?? '/tmp';
await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 3 } }).png().toFile(path.join(dest, `${ROUT}-diff.png`));
console.log(`地図 → ${path.join(dest, `${ROUT}-diff.png`)}（緑=塗った / 赤=まだらの塗り残し / 青=まるごと残った島）`);
