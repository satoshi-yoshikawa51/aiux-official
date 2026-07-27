/* ============================================================
   ホームのアバターが立つ「背景」のつなぎを描く。

   本番はMidjourneyで描いた3Dアニメ調の絵に差し替える前提で、
   ここで作るのは**構図を確かめるための仮**。
   差し替え方と、そのときのプロンプトは README を見ること。

   ▍なぜ縦に長いのか
   コマの比率は端末で 0.67〜1.10（iPhone SEでは横長になる）と大きくぶれる。
   cover の中央切りだと、狭い端末で床が丸ごと消えてしまう。
   そこで**下端に揃えて敷き、はみ出た上を切る**方式にしてある。
   絵はどの端末でも床が残るよう、パネルより確実に縦長（0.55）で描く。

   構図の決まりごと（差し替える絵もこれに合わせる）:
   ・キャラはコマの**下端**に立つ。地平線は低く、手前の床が下2割
   ・**上半分は切られる前提**。黒板や窓は下半分（y 50%以降）に置く
   ・そのさらに上にフキダシが重なる。情報を置かない
   ・中央下は立ち位置。影の楕円だけ置いて、他は空ける
   ・キャラは黒フチのない3D。背景が濃いと溶けるので、彩度も明度差も抑える

   使い方:
     node tools/build-stage.mjs        （= npm run stage）
       -> assets/images/stage-placeholder.png  コマに敷く絵（9:16）
       -> tools/.icon-preview/stage.png       立ち位置のあたりを重ねた確認用
   ============================================================ */
import sharp from 'sharp';
import fs from 'node:fs';

const OUT = new URL('./.icon-preview/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

/* 9:16。Midjourneyの --ar 9:16 の出力をそのまま差し替えられるように揃えてある。
   実測でいちばん縦長なコマが0.67だったので、それより縦長（0.5625）なら
   下端に揃えたとき必ず上まで届く。
   この値は src/data/stage.ts の STAGE_RATIO と揃えること */
const RATIO = 9 / 16;
const W = 900;
const H = Math.round(W / RATIO);

/** 地平線（床と壁の境目）。下から2割 */
const HORIZON = Math.round(H * 0.82);

/* 色は src/theme/index.ts から。背景なので彩度は落として使う */
const WALL_TOP = '#f7efe0';
const WALL_BOTTOM = '#ece0c9';
const FLOOR_NEAR = '#e2d2b4';
const FLOOR_FAR = '#ece0c9';
const LINE = '#cbbb9c';
const BOARD = '#5c6b60';
const BOARD_FRAME = '#8d7c5f';
const LIGHT = '#fff6de';

const n = (v) => Number(v.toFixed(1));

/** 消失点。中央よりわずかに左（キャラが右目に寄って見えないように） */
const VP = { x: W * 0.48, y: HORIZON };

/** 床の遠近線 */
function floorLines() {
  let d = '';
  for (let i = -7; i <= 7; i++) {
    const x = VP.x + i * (W * 0.34);
    d += `M${n(VP.x)},${n(VP.y)}L${n(x)},${H}`;
  }
  /* 横線は手前ほど間隔が開く */
  let t = 0.06;
  for (let i = 0; i < 7; i++) {
    const y = HORIZON + (H - HORIZON) * t;
    d += `M0,${n(y)}L${W},${n(y)}`;
    t = t + (1 - t) * 0.34;
  }
  return d;
}

/** 窓。上半分は切られるので、下半分に置く */
const window = () => {
  const x = W * 0.05, y = H * 0.5, w = W * 0.29, h = H * 0.2;
  const mid = x + w / 2;
  return (
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(w * 0.04)}" fill="${LIGHT}"/>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(w * 0.04)}" fill="none" stroke="${LINE}" stroke-width="7"/>` +
    `<path d="M${n(mid)},${n(y)}L${n(mid)},${n(y + h)}M${n(x)},${n(y + h / 2)}L${n(x + w)},${n(y + h / 2)}" stroke="${LINE}" stroke-width="6"/>`
  );
};

/** 窓から落ちる光。床まで届かせると立ち位置が明るくなって、キャラが浮く */
const lightBeam = () => {
  const x0 = W * 0.05, x1 = W * 0.34;
  return (
    `<path d="M${n(x0)},${n(H * 0.7)}L${n(x1)},${n(H * 0.7)}` +
    `L${n(x1 + W * 0.26)},${H}L${n(x0 + W * 0.1)},${H}Z" fill="url(#beam)"/>`
  );
};

/** 黒板。アカデミーらしさはこれ1つで足りる */
const blackboard = () => {
  const x = W * 0.4, y = H * 0.54, w = W * 0.52, h = H * 0.2;
  return (
    `<rect x="${n(x - 10)}" y="${n(y - 10)}" width="${n(w + 20)}" height="${n(h + 20)}" rx="10" fill="${BOARD_FRAME}"/>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="4" fill="${BOARD}"/>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="4" fill="url(#boardSheen)"/>` +
    /* 受け皿 */
    `<rect x="${n(x - 10)}" y="${n(y + h + 10)}" width="${n(w + 20)}" height="14" rx="6" fill="${BOARD_FRAME}"/>`
  );
};

/** 立ち位置の影。これがあるだけで「床に立っている」に見える */
const groundShadow = () =>
  `<ellipse cx="${n(W * 0.5)}" cy="${n(H * 0.975)}" rx="${n(W * 0.27)}" ry="${n(H * 0.018)}" fill="url(#shadow)"/>`;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${WALL_TOP}"/><stop offset="1" stop-color="${WALL_BOTTOM}"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${FLOOR_FAR}"/><stop offset="1" stop-color="${FLOOR_NEAR}"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${LIGHT}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${LIGHT}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="boardSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="shadow">
      <stop offset="0" stop-color="#6b5f4a" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#6b5f4a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.72" r="0.7">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#4a3f2c" stop-opacity="0.16"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${HORIZON}" fill="url(#wall)"/>
  <rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#floor)"/>

  ${blackboard()}
  ${window()}

  <g opacity="0.5"><path d="${floorLines()}" stroke="${LINE}" stroke-width="3" fill="none"/></g>
  <rect y="${n(HORIZON - 3)}" width="${W}" height="6" fill="${LINE}" opacity="0.75"/>

  ${lightBeam()}
  ${groundShadow()}
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

/* 本番の絵とはファイル名を分ける。同じ名前だと、Midjourneyの絵を置いたあとに
   このツールを走らせた人が上書きしてしまう */
const file = new URL('../assets/images/stage-placeholder.png', import.meta.url).pathname;
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
console.log('->', file, (fs.statSync(file).size / 1024).toFixed(0), 'KB');

/* ———— 確認用：実測したコマの比率で、下端に揃えて敷いたところを描く ————
   比率は tools のスクリプトではなく実機（web書き出し）で測った値。
   いちばん横長の iPhone SE で床と黒板が残っていれば合格 */
const PANELS = [
  ['iPhone SE   332x301  1.10', 1.103],
  ['iPhone 13   347x478  0.73', 0.726],
  ['iPhone 15PM 387x566  0.68', 0.684],
];
const CARD_H = 430;
const pad = 26;
const cards = [];
let x = pad;
for (const [label, ratio] of PANELS) {
  const pw = Math.round(CARD_H * ratio);
  /* 実装と同じ置き方：幅をコマに合わせ、下端に揃え、上のはみ出しは切る */
  const ih = Math.round(pw / RATIO);
  const scaled = await sharp(file).resize(pw, ih).png().toBuffer();
  /* はみ出した上を切る（overflow: hidden と同じ） */
  const visible = Math.min(ih, CARD_H);
  const clipped = await sharp(scaled)
    .extract({ left: 0, top: ih - visible, width: pw, height: visible })
    .png()
    .toBuffer();
  const panel = await sharp({ create: { width: pw, height: CARD_H, channels: 4, background: WALL_TOP } })
    .composite([{ input: clipped, left: 0, top: CARD_H - visible }])
    .png()
    .toBuffer();
  const cut = Math.max(0, Math.round((1 - CARD_H / ih) * 100));
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
      `<svg xmlns="http://www.w3.org/2000/svg" width="${pw + 40}" height="20">` +
        `<text x="0" y="15" fill="#8a8078" font-size="12" font-family="monospace">${label} 上${cut}%切れ</text></svg>`,
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
