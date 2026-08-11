/* ============================================================
   先生の色違いテクスチャを作る。

     node tools/recolor-sensei.mjs

   assets/models/sensei-texture.jpg を読んで、髪の色だけ塗り替えた
   sensei-<id>-texture.jpg を同じ場所に書き出す。GLBは共通のまま、
   テクスチャの差し替えだけで色違いが成立する（Avatar3Dは
   テクスチャを外から material.map に貼る作りなので）。

   ▍「髪だけ」をどう選んでいるか（形×色の2段構え）
   このテクスチャはTripoの一枚アトラスで、髪も服も同じ寒色
   （hue 200〜220）に住んでいて、色相だけでは分離できない。
   色だけ（彩度しきい値）で試すと、**髪の影（暗い紺）が取り残されて
   ツートンになり、逆にスーツの明るい画素が斑に染まった**。

   そこでGLBの頂点を読み、「しきい値より上の三角形のUV」を塗った
   頭マスクを2枚作って場所で条件を変える：
   ・あごの上（y>0.5）…… ほぼ髪と顔。寒色なら影の髪まで塗る
   ・肩の上（y>0.35）…… ボブの毛先と、ジャケットの肩・襟が同居する。
     彩度だけでは肩の明るい画素を拾ってしまい、**緋色にしたら肩まで
     赤くなった**（実機で指摘）。毛先は青緑（hue 180〜200）、スーツは
     くすんだ紺（hue 206〜222）なので、ここは**色相の関門**も掛けて
     「鮮やか かつ 青緑」だけ塗る
   ・それより下 …… スーツなので触らない

   顔の肌・頬・口は暖色なので寒色マスクの外。アイラインと瞳孔は
   明度0.025未満の黒なので、明度の下限ランプで守る。

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

/* 頭マスクのしきい値。モデルのyは -1（足元）〜 1（頭頂）。
   strict（0.5＝あごの下）の中はほぼ髪か顔なので、暗い影の髪まで塗る。
   loose（0.35＝肩の上）はボブの毛先と襟が同居するので、
   彩度が髪並みに高い画素だけ塗る（襟のくすんだ紺は残る） */
const HEAD_STRICT_Y = 0.5;
const HEAD_LOOSE_Y = 0.35;
const SIZE = 1024;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ---------- GLBから頭マスクを作る ---------- */

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

/** yThreshold より上にある三角形のUVを塗ったマスクを返す */
function buildHeadMask(yThreshold) {
  const { json, accessor } = readGlb(GLB);
  const mask = new Uint8Array(SIZE * SIZE);
  for (const mesh of json.meshes) {
    for (const prim of mesh.primitives) {
      const pos = accessor(prim.attributes.POSITION);
      const uv = accessor(prim.attributes.TEXCOORD_0);
      const index = prim.indices !== undefined ? accessor(prim.indices) : null;
      const triCount = (index ? index.length : pos.length / 3) / 3;
      for (let t = 0; t < triCount; t++) {
        const ia = index ? index[t * 3] : t * 3;
        const ib = index ? index[t * 3 + 1] : t * 3 + 1;
        const ic = index ? index[t * 3 + 2] : t * 3 + 2;
        if (pos[ia * 3 + 1] < yThreshold || pos[ib * 3 + 1] < yThreshold || pos[ic * 3 + 1] < yThreshold)
          continue;
        fillTriangle(mask, uv[ia * 2] * SIZE, uv[ia * 2 + 1] * SIZE,
          uv[ib * 2] * SIZE, uv[ib * 2 + 1] * SIZE, uv[ic * 2] * SIZE, uv[ic * 2 + 1] * SIZE);
      }
    }
  }
  return mask;
}

/** 走査線での三角形塗り。縁の取りこぼしを防ぐため1px膨らませる */
function fillTriangle(mask, x0, y0, x1, y1, x2, y2) {
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
      /* 内側ならt塗る。境界1px許容のため、距離が小さい外側も拾う */
      const inside = (d0 >= 0 && d1 >= 0 && d2 >= 0) || (d0 <= 0 && d1 <= 0 && d2 <= 0);
      if (inside) mask[y * SIZE + x] = 255;
    }
  }
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

/* ---------- 本体 ---------- */

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

/* 膨張はstrictだけ広めに（UVの継ぎ目対策）。looseまで広げると、
   隣に詰まっているスーツのパッチへ塗りが染み出す */
const headStrict = dilate(buildHeadMask(HEAD_STRICT_Y), 3);
const headLoose = dilate(buildHeadMask(HEAD_LOOSE_Y), 1);
const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });

for (const v of VARIANTS) {
  const out = Buffer.from(data);
  for (let p = 0; p < SIZE * SIZE; p++) {
    const i = p * info.channels;
    const r = out[i] / 255;
    const g = out[i + 1] / 255;
    const b = out[i + 2] / 255;
    const [h, s, l] = rgbToHsl(r, g, b);
    const cool = smooth(140, 160, h) * (1 - smooth(250, 268, h));
    if (cool <= 0) continue;
    /* あごの上＝影の髪まで塗る／肩の上＝髪並みに鮮やかな毛先だけ塗る。
       暗い画素は彩度が壊れる（HSLの分母が潰れる）ので、彩度の条件と
       「十分暗い＝髪の影」をORで併用する。ただしアイラインと瞳孔は
       0.025より黒いので、明度の下限ランプで守る */
    const darkGuard = smooth(0.025, 0.055, l);
    const darkHair = 1 - smooth(0.07, 0.12, l);
    /* 肩上ゾーンの色相の関門。毛先の青緑だけ通し、スーツの紺は弾く */
    const tealGate = 1 - smooth(198, 206, h);
    const w =
      cool *
      darkGuard *
      (headStrict[p]
        ? Math.max(smooth(0.07, 0.18, s), darkHair)
        : headLoose[p]
          ? smooth(0.3, 0.42, s) * tealGate
          : 0);
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
