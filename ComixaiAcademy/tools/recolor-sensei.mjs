/* ============================================================
   先生の色違いテクスチャを作る。

     node tools/recolor-sensei.mjs

   assets/models/sensei-texture.jpg を読んで、髪の色だけ塗り替えた
   sensei-<id>-texture.jpg を同じ場所に書き出す。GLBは共通のまま、
   テクスチャの差し替えだけで色違いが成立する（Avatar3Dは
   テクスチャを外から material.map に貼る作りなので）。

   ▍「髪だけ」をどう見つけているか（UVアイランド単位で判定する）
   このテクスチャはTripoの一枚アトラスで、髪も服も同じ寒色
   （hue 200〜220）に住んでいて、画素の色だけでは分離しきれない。
   実際、しきい値のさじ加減では
   ・髪の影が取り残されてツートンになる
   ・スーツの肩が斑に染まる（緋色で顕著。実機で指摘）
   ・毛先だけスーツ色に残る（同じく実機で指摘）
   を行ったり来たりした。**画素ではなくパーツで判定する**のが正解。

   GLTFのメッシュはUVの継ぎ目で頂点が複製されるので、頂点を共有する
   三角形をつないでいくと、アトラスの島（UVアイランド）ごとの
   まとまりが取れる。髪の島は頭頂から毛先まで一続きなので、
   島単位で「髪かどうか」を決めれば、毛先の暗い画素も含めて
   丸ごと塗れるし、スーツの島にはひと筆も入らない。

   島の扱いは3通り（診断テクスチャを作って全周を目視で確定させた）：
   1. 髪の本体：頭のてっぺん側（y>0.6）に届いていて、寒色が主体
      （顔の島も頭に届くが、肌の暖色が主体なのでここには来ない）
   2. 毛先のリング：首から肩の帯（minY>0.2）にいて、寒色が主体、
      かつ**彩度0.4超が85%以上**。毛先は濃くても鮮やかな紺青で
      ほぼ全画素が高彩度。同じ帯にいる襟・肩のヨークは彩度0.4超が
      3〜6割止まりなので、この線で切れる（85%と60%の間が崖）
   3. 顔の島（暖色が主体）：チャートの中に**前髪が描き込まれている**。
      島ごと塗らず、寒色の画素だけを髪のふち扱いで塗る。

   ▍瞳は塗らない（実機で「左目に赤が入った」の指摘）
   虹彩は紺系なので、寒色ルールだとどうしても髪と一緒に染まる。
   そこで**白目（明るくて彩度の無い画素）を探し、その周りの暗い
   画素を塗りから守る**。瞳・まつげ・アイラインは必ず白目のすぐ
   隣にいるので、この網で全部すくえる。髪に白目ほど白い画素は
   ほぼ無いので、髪側への巻き添えは出ない。

   ▍新しい色を足すとき
   VARIANTS にエントリを足して実行 → avatars.ts の SKINS に
   require を足す → data/gacha.ts のプールに並べる。
   ============================================================ */
import sharp from 'sharp';
import fs from 'node:fs';

const DIR = new URL('../assets/models/', import.meta.url).pathname;
const SRC = `${DIR}sensei-texture.jpg`;
const GLB = `${DIR}sensei.glb`;

/* hue=塗り替え先の色相 / sat=塗り替え先の彩度 /
   lift=明度の持ち上げ（l^lift。1=そのまま、小さいほど明るく。
   元の髪は暗い青緑なので、金髪や銀髪は持ち上げないと沈む） */
const VARIANTS = [
  { id: 'kin', name: '金髪', hue: 44, sat: 0.62, lift: 0.5 },
  { id: 'gin', name: '銀髪', hue: 220, sat: 0.06, lift: 0.42 },
  { id: 'momo', name: '桃色', hue: 345, sat: 0.55, lift: 0.52 },
  { id: 'hiiro', name: '緋色', hue: 352, sat: 0.72, lift: 0.72 },
];

const SIZE = 1024;
/* 島が「頭に届いている」とみなす高さ。モデルのyは -1（足元）〜 1（頭頂）。
   ジャケットの襟は0.55あたりで止まるので、0.6なら髪と顔しか届かない */
const HEAD_TOP_Y = 0.6;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ---------- GLBを読む ---------- */

function readGlb(path) {
  const buf = fs.readFileSync(path);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString());
  const bin = buf.subarray(20 + jsonLen + 8); // BINチャンクのヘッダを飛ばす
  /* このGLBは KHR_mesh_quantization 済みで、頂点属性は
     byteStride=20 のインターリーブ。要素ごとにstrideを踏んで読み、
     normalized の整数はfloatへ戻す（5122=short/32767、5123=ushort/65535） */
  const accessor = (idx) => {
    const acc = json.accessors[idx];
    const view = json.bufferViews[acc.bufferView];
    const comps = { SCALAR: 1, VEC2: 2, VEC3: 3 }[acc.type];
    const spec = {
      5126: { size: 4, read: 'readFloatLE', div: 1 },
      5125: { size: 4, read: 'readUInt32LE', div: 1 },
      5123: { size: 2, read: 'readUInt16LE', div: 65535 },
      5122: { size: 2, read: 'readInt16LE', div: 32767 },
    }[acc.componentType];
    if (!spec) throw new Error(`未対応のcomponentType: ${acc.componentType}`);
    const stride = view.byteStride ?? comps * spec.size;
    const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    const out = new Float32Array(acc.count * comps);
    const div = acc.normalized ? spec.div : 1;
    for (let e = 0; e < acc.count; e++) {
      for (let c = 0; c < comps; c++) {
        out[e * comps + c] = bin[spec.read](base + e * stride + c * spec.size) / div;
      }
    }
    return out;
  };
  return { json, accessor };
}

/* ---------- UVアイランドに分ける ---------- */

/** 三角形の配列（頂点index 3つずつ）と頂点数から、頂点を共有する
    三角形のまとまり（＝UVアイランド）を作る。返り値は三角形→島番号 */
function buildIslands(tris, vertCount) {
  const parent = new Int32Array(vertCount);
  for (let i = 0; i < vertCount; i++) parent[i] = i;
  const find = (a) => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];
      a = parent[a];
    }
    return a;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let t = 0; t < tris.length; t += 3) {
    union(tris[t], tris[t + 1]);
    union(tris[t + 1], tris[t + 2]);
  }
  const islandOfTri = new Int32Array(tris.length / 3);
  for (let t = 0; t < islandOfTri.length; t++) islandOfTri[t] = find(tris[t * 3]);
  return islandOfTri;
}

/** 走査線での三角形塗り。縁の取りこぼしを防ぐため1px膨らませる */
function fillTriangle(map, value, x0, y0, x1, y1, x2, y2) {
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)) - 1);
  const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(y0, y1, y2)) + 1);
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)) - 1);
  const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(x0, x1, x2)) + 1);
  const edge = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const d0 = edge(x0, y0, x1, y1, px, py);
      const d1 = edge(x1, y1, x2, y2, px, py);
      const d2 = edge(x2, y2, x0, y0, px, py);
      const inside = (d0 >= 0 && d1 >= 0 && d2 >= 0) || (d0 <= 0 && d1 <= 0 && d2 <= 0);
      if (inside) map[y * SIZE + x] = value;
    }
  }
}

/** 3x3の最大値フィルタでマスクを膨らませる。UVアイランドの継ぎ目
    （どの三角形にも属さない詰め物画素）が細線として残るのを防ぐ */
function dilate(mask, times) {
  let src = mask;
  for (let n = 0; n < times; n++) {
    const dst = new Uint8Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (!src[y * SIZE + x]) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < SIZE && nx >= 0 && nx < SIZE) dst[ny * SIZE + nx] = 255;
          }
        }
      }
    }
    src = dst;
  }
  return src;
}

/* ---------- 色変換 ---------- */

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
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

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m];
}

const coolness = (h) => smooth(140, 160, h) * (1 - smooth(250, 268, h));

/* ---------- 髪の島を見つけてマスクにする ---------- */

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });

function buildHairMask() {
  const { json, accessor } = readGlb(GLB);
  /* 画素→島番号（-1＝どの島でもない） */
  const islandMap = new Int32Array(SIZE * SIZE).fill(-1);
  /* 島番号→頂点yの最大値・最小値 */
  const maxY = new Map();
  const minY = new Map();

  for (const mesh of json.meshes) {
    for (const prim of mesh.primitives) {
      const pos = accessor(prim.attributes.POSITION);
      const uv = accessor(prim.attributes.TEXCOORD_0);
      const rawIndex = prim.indices !== undefined ? accessor(prim.indices) : null;
      const tris = rawIndex
        ? Int32Array.from(rawIndex)
        : Int32Array.from({ length: pos.length / 3 }, (_, i) => i);
      const islandOfTri = buildIslands(tris, pos.length / 3);
      for (let t = 0; t < islandOfTri.length; t++) {
        const isl = islandOfTri[t];
        const ia = tris[t * 3];
        const ib = tris[t * 3 + 1];
        const ic = tris[t * 3 + 2];
        const ys = [pos[ia * 3 + 1], pos[ib * 3 + 1], pos[ic * 3 + 1]];
        maxY.set(isl, Math.max(maxY.get(isl) ?? -Infinity, ...ys));
        minY.set(isl, Math.min(minY.get(isl) ?? Infinity, ...ys));
        fillTriangle(islandMap, isl, uv[ia * 2] * SIZE, uv[ia * 2 + 1] * SIZE,
          uv[ib * 2] * SIZE, uv[ib * 2 + 1] * SIZE, uv[ic * 2] * SIZE, uv[ic * 2 + 1] * SIZE);
      }
    }
  }

  /* 島ごとに色の内訳を数える */
  const stats = new Map(); // isl -> {n, cool, teal}
  for (let p = 0; p < SIZE * SIZE; p++) {
    const isl = islandMap[p];
    if (isl < 0) continue;
    const i = p * info.channels;
    const [h, s] = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    const st = stats.get(isl) ?? { n: 0, cool: 0, vivid: 0 };
    st.n += 1;
    if (coolness(h) > 0.5) {
      st.cool += 1;
      if (s > 0.4) st.vivid += 1;
    }
    stats.set(isl, st);
  }

  /* 判定して塗る。顔の島（暖色主体）は「前髪のふちだけ」のマスクへ */
  const mask = new Uint8Array(SIZE * SIZE);
  const faceMask = new Uint8Array(SIZE * SIZE);
  const hairIslands = new Set();
  const faceIslands = new Set();
  for (const [isl, st] of stats) {
    if (st.n < 20) continue;
    const top = maxY.get(isl) ?? -1;
    const bottom = minY.get(isl) ?? 1;
    const coolFrac = st.cool / st.n;
    const vividFrac = st.vivid / st.n;
    if (top > HEAD_TOP_Y && coolFrac > 0.5) hairIslands.add(isl);
    else if (bottom > 0.2 && coolFrac > 0.5 && vividFrac > 0.85) hairIslands.add(isl);
    else if (top > HEAD_TOP_Y && coolFrac <= 0.5) faceIslands.add(isl);
  }
  for (let p = 0; p < SIZE * SIZE; p++) {
    if (hairIslands.has(islandMap[p])) mask[p] = 255;
    else if (faceIslands.has(islandMap[p])) faceMask[p] = 255;
  }
  console.log(`島の数: ${stats.size} / 髪: ${hairIslands.size} / 顔（前髪入り）: ${faceIslands.size}`);
  return { hair: dilate(mask, 2), face: faceMask };
}

/* ---------- 本体 ---------- */

const { hair, face } = buildHairMask();

/* 瞳ガード：白目（明るく彩度の無い画素）の周囲16pxを守る（虹彩の芯まで届く半径）（→冒頭コメント） */
const white = new Uint8Array(SIZE * SIZE);
for (let p = 0; p < SIZE * SIZE; p++) {
  if (!hair[p] && !face[p]) continue;
  const i = p * info.channels;
  const [, s, l] = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
  if (l > 0.78 && s < 0.28) white[p] = 255;
}
const eyeGuard = dilate(white, 16);

for (const v of VARIANTS) {
  const out = Buffer.from(data);
  for (let p = 0; p < SIZE * SIZE; p++) {
    const inHair = hair[p];
    const inFace = face[p];
    if (!inHair && !inFace) continue;
    const i = p * info.channels;
    const r = out[i] / 255;
    const g = out[i + 1] / 255;
    const b = out[i + 2] / 255;
    const [h, s, l] = rgbToHsl(r, g, b);
    /* 寒色（髪の色）だけを塗る。ハイライトの白や、ほぼ黒
       （瞳孔・アイライン）は、なだらかに元のまま残す。
       白目の周りの暗い画素＝瞳・まつげは丸ごと守る（→冒頭コメント） */
    if (eyeGuard[p] && l < 0.65) continue;
    const guard = smooth(0.02, 0.045, l) * (1 - smooth(0.9, 0.97, l));
    const w = coolness(h) * guard * (inHair ? 1 : smooth(0.1, 0.2, s));
    if (w <= 0) continue;
    const [nr, ng, nb] = hslToRgb(v.hue, s + (v.sat - s) * w, l + (Math.pow(l, v.lift) - l) * w);
    out[i] = Math.round((r + (nr - r) * w) * 255);
    out[i + 1] = Math.round((g + (ng - g) * w) * 255);
    out[i + 2] = Math.round((b + (nb - b) * w) * 255);
  }
  const dest = `${DIR}sensei-${v.id}-texture.jpg`;
  await sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .jpeg({ quality: 82 })
    .toFile(dest);
  console.log(`${v.name} → ${dest}`);
}
