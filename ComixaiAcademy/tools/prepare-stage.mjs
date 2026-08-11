/* ============================================================
   Midjourneyで描いた背景を、ホームのコマ用に整える。

   生成された絵をそのまま敷くと、たいてい**床が多すぎる**。
   MJは「low horizon」と書いても地平線を絵の真ん中あたりに置きがちで、
   そのぶん窓や黒板が上に寄る。上は端末によって切られるので、
   横長のコマ（iPhone SE）だと床だけの絵になってしまう。

   ここでやること:
   1. 下（床）を削って、地平線を下げる
   2. **ぼかして、少し沈める**（下の「なぜぼかすのか」）
   3. 立ち位置に、やわらかい楕円の影を焼き込む
      （3Dのキャラは影を持たないので、これが無いと浮いて見える）
   4. 出来上がりの縦横比を出す（src/data/stage.ts の STAGE_RATIO に入れる）
   5. 実測した3端末のコマの比率で切って、確認用に並べる

   ▍なぜぼかすのか
   3Dのキャラは固定のカメラで描かれていて、MJが描いた部屋の遠近とは
   一致しない。実測すると、この絵の地平線はキャラの**顎**を通っていた
   （本来は目の高さに来る）。ズレは12%ほどだが、背景がくっきりしていると
   脳が窓や床の大きさとキャラを比べてしまい、「小人が立っている」ように
   見える。ぼかすと背景が「遠く」として処理され、比べるのをやめる。
   アバター系のアプリが軒並み背景をぼかしているのはこのため。

   使い方:
     # 元画像を assets/images/_raw/ に置いてから
     node tools/prepare-stage.mjs assets/images/_raw/classroom.png
     （= npm run stage:prepare -- assets/images/_raw/classroom.png）

     CROP_BOTTOM=0.16 node tools/prepare-stage.mjs 元.png   # 削る量を変える

   ▍絵は横に広いほどよい（縦長にしない）
   コマには「覆いきる最小の大きさ」で敷くので、**縦長の絵ほど
   拡大率が上がる**。拡大されるほど窓や黒板が大きく写り、隣に立つ
   キャラは小さく見える。実測で、縦長（0.637）の絵だと iPhone SE3 の
   教室は 15 Pro より24%大きく写っていた。
   **出来上がりの比率は 0.8 以上を目安**にする。ツールが 0.75 を
   下回ったら警告する。
   ============================================================ */
import sharp from 'sharp';
import fs from 'node:fs';

const SRC = process.argv[2];
if (!SRC) {
  console.error('元画像のパスを渡してください。例: node tools/prepare-stage.mjs assets/images/_raw/classroom.png');
  process.exit(1);
}

/** 下から削る割合。地平線を下げるほど、キャラが床に立って見える */
const CROP_BOTTOM = Number(process.env.CROP_BOTTOM ?? 0.16);

/** ぼかし（元画像の画素での sigma）。0で無効 */
const BLUR = Number(process.env.BLUR ?? 8);
/** 明るさ・彩度。1で無効。キャラを前に出すため、背景は少し沈める */
const BRIGHTNESS = Number(process.env.BRIGHTNESS ?? 0.92);
const SATURATION = Number(process.env.SATURATION ?? 0.8);

/** 出来上がりの比率の下限。これを下回ると、狭い端末で絵が大きく
    拡大され、キャラが小人に見える（冒頭のメモ） */
const MIN_RATIO = 0.75;

const OUT = new URL('./.icon-preview/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
const dst = new URL('../assets/images/stage-classroom.jpg', import.meta.url).pathname;

const src = sharp(SRC);
const meta = await src.metadata();
const W = meta.width;
const H0 = meta.height;
const H = Math.round(H0 * (1 - CROP_BOTTOM));

console.log(`元: ${W}x${H0}（比率 ${(W / H0).toFixed(3)}）`);
console.log(`下を ${Math.round(CROP_BOTTOM * 100)}% 削る -> ${W}x${H}`);

/* ———— 立ち位置の影 ————
   キャラはコマの下端・中央に立つ。その足元に楕円の影を敷く。

   ぼかしは**別の工程で**掛ける。sharp は composite をパイプラインの
   最後に適用するので、`create().composite().blur()` と書いても
   ぼかしは空のキャンバスに掛かるだけで、楕円には効かない。
   絵と同じ寸法のオーバーレイを1枚ラスタライズしてから blur する。 */
const SHADOW_OPACITY = Number(process.env.SHADOW ?? 0.3);
const shadow = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      `<ellipse cx="${W / 2}" cy="${Math.round(H * 0.965)}"` +
      ` rx="${Math.round(W * 0.27)}" ry="${Math.round(H * 0.018)}"` +
      ` fill="#3a2f22" fill-opacity="${SHADOW_OPACITY}"/></svg>`,
  ),
)
  .blur(Math.max(6, Math.round(H * 0.012)))
  .png()
  .toBuffer();

/* ぼかしと沈めは影を焼く**前**に掛ける。影までぼかすと、
   せっかく足元に置いた輪郭が消えてしまう */
const base = await sharp(SRC)
  .extract({ left: 0, top: 0, width: W, height: H })
  .modulate({ brightness: BRIGHTNESS, saturation: SATURATION })
  .blur(BLUR > 0 ? BLUR : undefined)
  .png()
  .toBuffer();

/* JPEGで出す。透過が要らないぶんPNGより一桁小さくなる
   （ぼかしたぶん更に縮んで、この絵で 2.4MB -> 60KB 程度）。
   アプリに積む画像なので効く */
await sharp(base)
  .composite([{ input: shadow, left: 0, top: 0 }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(dst);

const ratio = W / H;
console.log(`-> ${dst}  ${(fs.statSync(dst).size / 1024).toFixed(0)} KB`);
console.log(`\nsrc/data/stage.ts に入れる値:`);
console.log(`  STAGE_RATIO = ${ratio.toFixed(4)}   // ${W}/${H}`);

const top = await sharp(dst).extract({ left: 0, top: 0, width: W, height: 4 }).stats();
const wall = '#' + top.channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, '0')).join('');
console.log(`  STAGE_WALL  = '${wall}'  // 絵のいちばん上の色`);

if (ratio < MIN_RATIO) {
  console.log(
    `\n⚠ 比率 ${ratio.toFixed(3)} が ${MIN_RATIO} を下回っている（縦長すぎる）。` +
      `\n  狭い端末で絵が大きく拡大され、キャラが小人に見える。` +
      `\n  もっと引きで（横に広く）描いた絵を使うこと。`,
  );
}

/* ———— 確認用 ———— */
const PANELS = [
  ['iPhone SE   1.10（いちばん横長）', 1.103],
  ['iPhone 13   0.73', 0.726],
  ['iPhone 15PM 0.68', 0.684],
];
const CARD_H = 430;
const pad = 26;
const cards = [];
let x = pad;
for (const [label, pr] of PANELS) {
  const pw = Math.round(CARD_H * pr);
  const ih = Math.round(pw / ratio);
  const scaled = await sharp(dst).resize(pw, ih).png().toBuffer();
  const visible = Math.min(ih, CARD_H);
  const clipped = await sharp(scaled)
    .extract({ left: 0, top: ih - visible, width: pw, height: visible })
    .png()
    .toBuffer();
  const panel = await sharp({ create: { width: pw, height: CARD_H, channels: 4, background: wall } })
    .composite([{ input: clipped, left: 0, top: CARD_H - visible }])
    .png()
    .toBuffer();
  const guide =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${CARD_H}">` +
    `<rect x="0" y="0" width="${pw}" height="${Math.round(CARD_H * 0.3)}" fill="#e60012" opacity="0.10"/>` +
    `<text x="8" y="${Math.round(CARD_H * 0.3) - 8}" fill="#e60012" font-size="12" font-family="monospace">フキダシ</text>` +
    `<rect x="${Math.round(pw * 0.19)}" y="${Math.round(CARD_H * 0.28)}" width="${Math.round(pw * 0.62)}" height="${Math.round(CARD_H * 0.72)}" fill="none" stroke="#1a6cff" stroke-width="2" stroke-dasharray="7 5"/>` +
    `<text x="${Math.round(pw * 0.19) + 4}" y="${CARD_H - 8}" fill="#1a6cff" font-size="12" font-family="monospace">キャラ</text>` +
    `</svg>`;
  cards.push({
    input: await sharp(panel).composite([{ input: Buffer.from(guide) }]).png().toBuffer(),
    left: x,
    top: pad + 22,
  });
  cards.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${pw + 60}" height="20">` +
        `<text x="0" y="15" fill="#8a8078" font-size="12" font-family="monospace">${label}</text></svg>`,
    ),
    left: x,
    top: pad,
  });
  x += pw + pad;
}
await sharp({ create: { width: x, height: CARD_H + pad * 2 + 22, channels: 4, background: '#2a2420' } })
  .composite(cards)
  .png()
  .toFile(new URL('stage.png', OUT).pathname);
console.log('-> tools/.icon-preview/stage.png（確認用）');
