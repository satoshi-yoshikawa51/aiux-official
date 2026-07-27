/* ============================================================
   アプリアイコンとスプラッシュを書き出す。

   Expoの初期テンプレの画像を、サイトと同じ「マンガのインク＋紙」に
   差し替えるためのもの。1024のグリッドでベクターで組み、必要な
   サイズを全部ここから焼く（手でPNGを触らない）。

   使い方:
     node tools/build-app-icon.mjs
       -> assets/images/icon.png                    1024  iOS・ストア用（透過なし）
       -> assets/images/android-icon-foreground.png  512  Android アダプティブの前景
       -> assets/images/android-icon-background.png  512  同・背景
       -> assets/images/android-icon-monochrome.png  432  同・テーマアイコン（単色）
       -> assets/images/splash-icon.png              512  起動画面
       -> assets/images/favicon.png                   48  Web
       -> tools/.icon-preview/app-icon.png                確認用（実寸＋拡大）

   小さいサイズの鉄則は tools/build-icons.mjs と同じ。
   ホーム画面では60pt＝120px程度にしかならないので、**必ず
   app-icon.png の実寸のコマで判断すること**。大きい絵だけ見て
   決めると、端末では潰れている、ということが起きる。

   ▍Androidのセーフゾーン
   アダプティブアイコンは端末ごとに丸・角丸・しずくと形が変わり、
   前景は**中央66%（=72dp/108dp）の円**の外が切り落とされる。
   iOSと同じ絵をそのまま置くとフチで欠けるので、MARK_BOX から
   対角線を出して、66%に収まる倍率を計算して縮めている。
   app-icon-masks.png で3種類のマスクを掛けた結果を確認できる。
   ============================================================ */
import sharp from 'sharp';
import fs from 'node:fs';

const OUT = new URL('./.icon-preview/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
const preview = (name) => new URL(name, OUT).pathname;
const asset = (name) => new URL(`../assets/images/${name}`, import.meta.url).pathname;

const n = (v) => Number(v.toFixed(2));

/* ———————————————— 色（src/theme/index.ts と同じ値） ———————————————— */

const INK = '#14110f';
const PAPER = '#fbf7ef';
const YELLOW = '#ffd23f';
const YELLOW_TONE = '#f2bd1f'; // 網点。黄色を少しだけ沈めたもの
const RED = '#e60012';

/* ———————————————— 形 ———————————————— */

const poly = (...pts) => 'M' + pts.map(([x, y]) => `${n(x)},${n(y)}`).join('L') + 'Z';
const rect = (x, y, w, h) => poly([x, y], [x + w, y], [x + w, y + h], [x, y + h]);
const circle = ({ cx, cy, r }) =>
  `M${n(cx - r)},${n(cy)}A${n(r)},${n(r)} 0 1 1 ${n(cx + r)},${n(cy)}A${n(r)},${n(r)} 0 1 1 ${n(cx - r)},${n(cy)}Z`;

/** 4方向のキラリ（マンガの効果） */
function twinkle({ cx, cy, r, waist = 0.17 }) {
  const w = r * waist;
  return poly(
    [cx, cy - r], [cx + w, cy - w], [cx + r, cy], [cx + w, cy + w],
    [cx, cy + r], [cx - w, cy + w], [cx - r, cy], [cx - w, cy - w],
  );
}

/* 角帽。src/components の cap をアイコン用に起こし直したもの（24グリッド）。
   板とアタマは evenodd で重ねて、あいだにマンガのハイライト（V字の抜き）を出す。
   房は**別のパス**にして nonzero で塗る。同じパスに入れると重なりが
   穴になって、板から切り離された棒に見えてしまうため。 */
const CAP_BOARD =
  poly([12, 2.4], [23.2, 8.0], [12, 13.6], [0.8, 8.0]) +
  'M5.6,10.6L5.6,16.4C5.6,18.9 8.4,20.8 12,20.8C15.6,20.8 18.4,18.9 18.4,16.4L18.4,10.6L12,14.0Z';

/* 房。板の裏まで差し込んで繋げ、先を丸く膨らませて「棒」に見えないようにする。
   アタマとのすき間は最低2単位（＝小さいサイズでも溶けてくっつかない幅）を確保する */
const CAP_TASSEL = rect(20.8, 8.2, 1.6, 7.6) + circle({ cx: 21.6, cy: 16.2, r: 1.6 });

const CAP_BOX = { x: 0.8, y: 2.4, w: 22.4, h: 18.4 };

/** 角帽ひと組。板（evenodd）＋房（nonzero）の2パスで描く */
const cap = (transform, color) =>
  `<g transform="${transform}">` +
  `<path d="${CAP_BOARD}" fill="${color}" fill-rule="evenodd"/>` +
  `<path d="${CAP_TASSEL}" fill="${color}"/>` +
  `</g>`;

/** 角帽を、指定の幅で指定の中心に置く transform を返す */
function capAt({ cx, cy, width }) {
  const s = width / CAP_BOX.w;
  const tx = cx - (CAP_BOX.x + CAP_BOX.w / 2) * s;
  const ty = cy - (CAP_BOX.y + CAP_BOX.h / 2) * s;
  return `translate(${n(tx)},${n(ty)}) scale(${n(s)})`;
}

/** 網点。マンガのスクリーントーン */
function halftone({ size, r, gap, color }) {
  let d = '';
  for (let row = 0, y = -gap; y < size + gap; row++, y += gap * 0.87) {
    for (let x = (row % 2 ? gap / 2 : 0) - gap; x < size + gap; x += gap) {
      d += `M${n(x - r)},${n(y)}a${n(r)},${n(r)} 0 1 0 ${n(r * 2)},0a${n(r)},${n(r)} 0 1 0 ${n(-r * 2)},0Z`;
    }
  }
  return `<path d="${d}" fill="${color}"/>`;
}

/* ———————————————— 版 ———————————————— */

const svg = (size, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
  (bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '') +
  body +
  `</svg>`;

/** 黄色地＋網点。アイコンの下地 */
const backdrop = (size) => halftone({ size, r: size * 0.0115, gap: size * 0.062, color: YELLOW_TONE });

/* 絵の配置。すべてタイルの一辺に対する比率で持つ */
const M = {
  cap: { cx: 0.48, cy: 0.535, w: 0.64 },
  spark: { cx: 0.812, cy: 0.238, r: 0.092 },
};
const CAP_H = (M.cap.w * CAP_BOX.h) / CAP_BOX.w;

/** 帽子＋キラリを合わせた外接矩形（比率）。Androidの縮小率の計算に使う */
const MARK_BOX = (() => {
  const x0 = Math.min(M.cap.cx - M.cap.w / 2, M.spark.cx - M.spark.r);
  const x1 = Math.max(M.cap.cx + M.cap.w / 2, M.spark.cx + M.spark.r);
  const y0 = Math.min(M.cap.cy - CAP_H / 2, M.spark.cy - M.spark.r);
  const y1 = Math.max(M.cap.cy + CAP_H / 2, M.spark.cy + M.spark.r);
  return { x0, y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
})();

/** 帽子＋キラリ。ベタなので白抜き用に色を差し替えられるようにする */
const mark = (size, { ink = INK, spark = RED, sparkle = true } = {}) =>
  cap(capAt({ cx: size * M.cap.cx, cy: size * M.cap.cy, width: size * M.cap.w }), ink) +
  (sparkle
    ? `<path d="${twinkle({ cx: size * M.spark.cx, cy: size * M.spark.cy, r: size * M.spark.r })}" fill="${spark}"/>`
    : '');

/** 同じ絵を、指定の対角線に収まるまで縮めて中央に置く（Androidのセーフゾーン用） */
function markFitted(size, maxDiagonal, opts) {
  const diag = Math.hypot(MARK_BOX.w, MARK_BOX.h);
  const k = maxDiagonal / diag;
  const tx = size * (0.5 - MARK_BOX.cx * k);
  const ty = size * (0.5 - MARK_BOX.cy * k);
  return `<g transform="translate(${n(tx)},${n(ty)}) scale(${n(k)})">${mark(size, opts)}</g>`;
}

/* 角丸（スプラッシュとプレビュー用。iOS/Androidは自前で丸めるので本番アイコンは角丸にしない） */
const rounded = (size, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
  `<defs><clipPath id="r"><rect width="${size}" height="${size}" rx="${n(size * 0.223)}"/></clipPath></defs>` +
  `<g clip-path="url(#r)"><rect width="${size}" height="${size}" fill="${YELLOW}"/>${backdrop(size)}${body}</g></svg>`;

/* SVGに幅高さを書いてあるので density は既定（72＝等倍）のまま焼く。
   density を上げると勝手に拡大されて寸法が合わなくなる */
const png = (s) => sharp(Buffer.from(s)).png();

/* ———— 1) iOS・ストア用（1024・透過なし・角丸なし） ———— */
const ICON_1024 = svg(1024, backdrop(1024) + mark(1024), YELLOW);
await png(ICON_1024).flatten({ background: YELLOW }).toFile(asset('icon.png'));

/* ———— 2) Android アダプティブ ————
   見えるのは中央72dp/108dp＝66.7%。少し余裕をみて64%に収める */
const SAFE = 0.64;
const FG = svg(512, markFitted(512, SAFE));
await png(FG).toFile(asset('android-icon-foreground.png'));
await png(svg(512, backdrop(512), YELLOW)).flatten({ background: YELLOW }).toFile(asset('android-icon-background.png'));

/* テーマアイコンは単色。システムが色を塗るので、形だけを白で置く。
   キラリも同じ白になると団子に見えるので、帽子だけにする */
const MONO = svg(
  432,
  `<g transform="${capAt({ cx: 216, cy: 221, width: 432 * SAFE * (CAP_BOX.w / Math.hypot(CAP_BOX.w, CAP_BOX.h)) })}">` +
    `<path d="${CAP_BOARD}" fill="#ffffff" fill-rule="evenodd"/>` +
    `<path d="${CAP_TASSEL}" fill="#ffffff"/></g>`,
);
await png(MONO).toFile(asset('android-icon-monochrome.png'));

/* ———— 3) スプラッシュ（紙色の上に置くので、タイルごと角丸で出す） ———— */
await png(rounded(512, mark(512))).toFile(asset('splash-icon.png'));

/* ———— 4) Web ———— */
await png(ICON_1024).resize(48, 48).toFile(asset('favicon.png'));

/* 「ホーム画面に追加」で出るアイコン（public/index.html の apple-touch-icon）。
   iOSは自前で角を丸めるうえ透過を黒で合成するので、角丸なし・透過なしの
   ベタ塗りで出す。OGPのカード画像も同じものを使っている */
await png(ICON_1024)
  .resize(512, 512)
  .flatten({ background: YELLOW })
  .toFile(new URL('../public/app-icon.png', import.meta.url).pathname);

/* ———————————————— 確認用 ————————————————
   ホーム画面の実寸（60pt＝120px前後）で焼いてから拡大する。
   ここで潰れて見えるなら、端末でも潰れている */
const REAL = 120, Z = 5;
const SIZES = [48, 64, 88, 120, 180];
const gap = 22;
const stripW = SIZES.reduce((a, s) => a + s + gap, gap);
const W = Math.max(REAL * Z + 80, stripW + 40);
const H = 40 + REAL * Z + 40 + 180 + 60;

const tile = (size) => png(rounded(size, mark(size))).toBuffer();

const layers = [
  /* 実寸で焼いて、そのまま5倍（端末で見える通りの潰れ方になる） */
  {
    input: await sharp(await tile(REAL)).resize(REAL * Z, REAL * Z, { kernel: 'nearest' }).png().toBuffer(),
    left: 40,
    top: 40,
  },
];
let x = 20;
for (const s of SIZES) {
  layers.push({ input: await tile(s), left: x + (gap - 2), top: 40 + REAL * Z + 60 + (180 - s) / 2 });
  layers.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${s + gap}" height="20">` +
        `<text x="${gap - 2}" y="15" fill="#8a8078" font-size="13" font-family="monospace">${s}</text></svg>`,
    ),
    left: x,
    top: 40 + REAL * Z + 60 + 180 + 8,
  });
  x += s + gap;
}
layers.push({
  input: Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="24">` +
      `<text x="0" y="17" fill="#8a8078" font-size="15" font-family="monospace">120px (= iPhone 60pt) を5倍</text></svg>`,
  ),
  left: 40,
  top: 40 + REAL * Z + 18,
});

await sharp({ create: { width: W, height: H, channels: 4, background: '#2a2420' } })
  .composite(layers)
  .png()
  .toFile(preview('app-icon.png'));

/* ———— Androidのマスクと、起動画面の見え方 ————
   アダプティブアイコンは 512 の絵が 108dp にあたり、実際に見えるのは
   中央 72dp ＝ 66.7% だけ。ここで切ってからマスクを掛けて、
   帽子が欠けないことを確かめる */
const ADAPTIVE = 512;
const VISIBLE = Math.round((ADAPTIVE * 72) / 108 / 2) * 2; // 切り出しの端数が出ないよう偶数に丸める
/* sharpは composite を resize/extract の**後**に適用するので、
   重ねるところまでを一度焼いてから切り出す */
const flat = await sharp(await png(svg(ADAPTIVE, backdrop(ADAPTIVE), YELLOW)).toBuffer())
  .composite([{ input: await png(FG).toBuffer() }])
  .png()
  .toBuffer();
const composed = await sharp(flat)
  .extract({
    left: (ADAPTIVE - VISIBLE) / 2,
    top: (ADAPTIVE - VISIBLE) / 2,
    width: VISIBLE,
    height: VISIBLE,
  })
  .resize(200, 200)
  .png()
  .toBuffer();

const maskWith = (shape) =>
  sharp(composed)
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">${shape}</svg>`,
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

const MASKS = [
  ['circle', '<circle cx="100" cy="100" r="100" fill="#fff"/>'],
  ['squircle', '<rect width="200" height="200" rx="46" fill="#fff"/>'],
  ['squote', '<rect width="200" height="200" rx="100" ry="100" fill="#fff"/>'],
];
const SPLASH_W = 168;
const shot = [];
for (const [i, [name, shape]] of MASKS.entries()) {
  shot.push({ input: await maskWith(shape), left: 30 + i * 230, top: 40 });
  shot.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20">` +
        `<text x="0" y="15" fill="#8a8078" font-size="13" font-family="monospace">Android: ${name}</text></svg>`,
    ),
    left: 30 + i * 230,
    top: 248,
  });
}
/* 起動画面（紙色の地に、imageWidth のサイズでタイルを置く） */
shot.push({
  input: await sharp({ create: { width: 320, height: 300, channels: 4, background: PAPER } })
    .composite([
      {
        input: await png(rounded(SPLASH_W, mark(SPLASH_W))).toBuffer(),
        left: (320 - SPLASH_W) / 2,
        top: (300 - SPLASH_W) / 2,
      },
    ])
    .png()
    .toBuffer(),
  left: 30,
  top: 300,
});
shot.push({
  input: Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="20">` +
      `<text x="0" y="15" fill="#8a8078" font-size="13" font-family="monospace">起動画面（imageWidth: ${SPLASH_W}）</text></svg>`,
  ),
  left: 30,
  top: 608,
});

await sharp({ create: { width: 720, height: 640, channels: 4, background: '#2a2420' } })
  .composite(shot)
  .png()
  .toFile(preview('app-icon-masks.png'));

console.log('-> assets/images/ の6枚 ＋ public/app-icon.png');
console.log('-> tools/.icon-preview/app-icon.png・app-icon-masks.png（確認用）');
