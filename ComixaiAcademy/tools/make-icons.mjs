/* アプリアイコンを生成する（サイトのデザイントークンに合わせたマンガ調）。
   フォントに依存しないよう、文字は使わず図形だけで構成している。

   使い方: node tools/make-icons.mjs
   （sharp が必要: npm i -D sharp）
*/
import sharp from 'sharp';
import fs from 'node:fs';

const PAPER = '#fbf7ef';
const INK = '#14110f';
const RED = '#e60012';

/** 吹き出し（マンガのフキダシ）。cx,cy中心、rw/rh半径 */
const bubble = (cx, cy, rw, rh, fill, stroke, sw) => `
  <g>
    <ellipse cx="${cx}" cy="${cy}" rx="${rw}" ry="${rh}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />
    <path d="M ${cx - rw * 0.34} ${cy + rh * 0.86}
             L ${cx - rw * 0.16} ${cy + rh * 1.62}
             L ${cx + rw * 0.1} ${cy + rh * 0.94} Z"
          fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" />
  </g>`;

/** 中の3点リーダ（…）。AIが考えている記号 */
const dots = (cx, cy, r, gap, fill) =>
  [-gap, 0, gap].map((dx) => `<circle cx="${cx + dx}" cy="${cy}" r="${r}" fill="${fill}" />`).join('');

const tone = (id) => `
  <pattern id="${id}" width="46" height="46" patternUnits="userSpaceOnUse">
    <circle cx="10" cy="10" r="5.5" fill="${INK}" opacity="0.14" />
  </pattern>`;

const icon = (size, { bg = PAPER, pad = 0, mono = false } = {}) => {
  const s = size;
  const k = (1 - pad) ;
  const cx = s / 2;
  const cy = s / 2 - s * 0.03 * k;
  const rw = s * 0.34 * k;
  const rh = s * 0.27 * k;
  const sw = s * 0.028 * k;
  const fill = mono ? '#ffffff' : RED;
  const stroke = mono ? 'none' : INK;
  const dotFill = mono ? INK : PAPER;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <defs>${tone('t')}</defs>
    ${bg === 'none' ? '' : `<rect width="${s}" height="${s}" fill="${bg}" />`}
    ${bg === 'none' ? '' : `<rect width="${s}" height="${s}" fill="url(#t)" />`}
    ${bubble(cx, cy, rw, rh, fill, stroke, mono ? 0 : sw)}
    ${dots(cx, cy, s * 0.042 * k, s * 0.105 * k, dotFill)}
  </svg>`);
};

const out = async (file, buf) => {
  await sharp(buf).png().toFile(file);
  console.log('->', file, (fs.statSync(file).size / 1024).toFixed(0), 'KB');
};

await out('assets/images/icon.png', icon(1024));
await out('assets/images/favicon.png', icon(96));
await out('assets/images/splash-icon.png', icon(512, { bg: 'none', pad: 0.1 }));
await out('assets/images/android-icon-foreground.png', icon(1024, { bg: 'none', pad: 0.34 }));
await out('assets/images/android-icon-monochrome.png', icon(1024, { bg: 'none', pad: 0.34, mono: true }));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: PAPER } })
  .png()
  .toFile('assets/images/android-icon-background.png');
console.log('-> assets/images/android-icon-background.png');
