/* タブアイコンの形を作って、実寸で確認できる一覧画像を書き出す。
   24×24グリッド／白のベタ塗り（黒地に白抜き）／穴は evenodd で抜く。
   歯車・星は目分量だと歪むので座標を計算する。 */
import sharp from 'sharp';
import fs from 'node:fs';

const n = (v) => Number(v.toFixed(2));

/** 歯車。teeth枚の歯を、外周rOut・歯底rInの多角形で作る */
function gear({ cx = 12, cy = 12, teeth = 8, rOut = 11, rIn = 8.1, ratio = 0.46, rot = 0 }) {
  const step = (Math.PI * 2) / teeth;
  const half = (step * ratio) / 2;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2 + rot;
    // 歯の頂点（外周）→ 歯底へ
    pts.push([cx + rOut * Math.cos(a - half), cy + rOut * Math.sin(a - half)]);
    pts.push([cx + rOut * Math.cos(a + half), cy + rOut * Math.sin(a + half)]);
    const b = a + step / 2;
    pts.push([cx + rIn * Math.cos(b - half), cy + rIn * Math.sin(b - half)]);
    pts.push([cx + rIn * Math.cos(b + half), cy + rIn * Math.sin(b + half)]);
  }
  return 'M' + pts.map(([x, y]) => `${n(x)},${n(y)}`).join('L') + 'Z';
}

/** 星（5芒星）。頂点が真上を向く */
function star({ cx, cy, r, inner = 0.46, rot = 0 }) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (i * Math.PI) / 5 - Math.PI / 2 + rot;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  return 'M' + pts.map(([x, y]) => `${n(x)},${n(y)}`).join('L') + 'Z';
}

/** 円（穴を抜く用）。2つの弧で閉じる */
function circle({ cx, cy, r, ccw = false }) {
  const s = ccw ? 0 : 1;
  return `M${n(cx - r)},${n(cy)}A${n(r)},${n(r)} 0 1 ${s} ${n(cx + r)},${n(cy)}A${n(r)},${n(r)} 0 1 ${s} ${n(cx - r)},${n(cy)}Z`;
}

/* ———————————————— 4つのアイコン ————————————————
   いずれも「線で描く」のではなく「ベタのシルエットから白で抜く」。
   22pxまで縮めても形が潰れないのはこの作りだけ。
   マンガのベタに入れるハイライト（斜めの抜き）を各所に入れている。 */

export const ICONS = {
  /* 家。屋根は太く、庇を左右に張り出す。ドアと屋根のハイライトを抜く */
  home:
    // 外形（軒の張り出し → 胴体）。左右非対称の煙突を右の斜面に足す
    'M12,1.6L16.9,5.9L16.9,3.2L19.6,3.2L19.6,8.3L23.2,11.5L19.9,11.5L19.9,21.9L4.1,21.9L4.1,11.5L0.8,11.5Z' +
    // ドア（下は開けたまま）
    'M9.4,21.9L9.4,14.6L14.6,14.6L14.6,21.9Z' +
    // 屋根のハイライト（22pxでも残るよう太めに）
    'M5.6,10.0L10.4,5.8L12.6,5.8L7.8,10.0Z',

  /* 開いた本。中央の隙間が背になる。ページに1本ずつハイライト */
  learn:
    // 左ページ
    'M1.2,4.6C4.0,3.6 8.0,3.9 11.0,5.9L11.0,20.4C8.0,18.4 4.0,18.1 1.2,19.1Z' +
    // 右ページ
    'M22.8,4.6C20.0,3.6 16.0,3.9 13.0,5.9L13.0,20.4C16.0,18.4 20.0,18.1 22.8,19.1Z' +
    // 各ページに1本ずつ、水平の抜き＝文字行に見せる。
    // 斜めにして中央へ向けると「目」に見えてしまうので必ず水平で下寄りに置く
    'M3.7,12.0L8.9,12.0L8.9,13.9L3.7,13.9Z' +
    'M20.3,12.0L15.1,12.0L15.1,13.9L20.3,13.9Z',

  /* リボン付きのメダル。星を抜く */
  badges:
    // リボン（左右）。22pxで消えないよう太く、外へ広げる
    'M4.9,1.9L8.9,1.9L12.3,7.9L9.0,9.6Z' +
    'M19.1,1.9L15.1,1.9L11.7,7.9L15.0,9.6Z' +
    // メダル本体
    circle({ cx: 12, cy: 15.2, r: 7.4 }) +
    // 星（抜き）
    star({ cx: 12, cy: 15.3, r: 4.9, inner: 0.44 }),

  /* 歯車。中心を抜き、上部にハイライト */
  settings:
    gear({ cx: 12, cy: 12, teeth: 7, rOut: 11.4, rIn: 7.9, ratio: 0.58, rot: 0.22 }) +
    circle({ cx: 12, cy: 12, r: 4.0 }),
};

/* ———————————————— 確認用の一覧画像 ———————————————— */

const SIZES = [22, 44, 88];
const NAMES = Object.keys(ICONS);

const icon = (d, size, color = '#ffffff', x = 0, y = 0) =>
  `<g transform="translate(${x},${y}) scale(${size / 24})">
     <path d="${d}" fill="${color}" fill-rule="evenodd" />
   </g>`;

let svg = '';
const PAD = 26;
const COLW = 130;
let width = PAD * 2 + COLW * NAMES.length;
let height = 460;

NAMES.forEach((name, i) => {
  const x = PAD + COLW * i;
  let y = PAD;
  svg += `<text x="${x}" y="${y}" fill="#888" font-size="12" font-family="monospace">${name}</text>`;
  y += 20;
  for (const s of SIZES) {
    svg += icon(ICONS[name], s, '#ffffff', x, y);
    svg += `<text x="${x + s + 8}" y="${y + s / 2 + 4}" fill="#555" font-size="10" font-family="monospace">${s}px</text>`;
    y += s + 16;
  }
  /* 選択中の見え方：赤の丸ベタ＋白抜き */
  y += 8;
  svg += `<circle cx="${x + 11}" cy="${y + 11}" r="17" fill="#e60012" />`;
  svg += icon(ICONS[name], 22, '#ffffff', x, y);
  svg += `<text x="${x + 34}" y="${y + 15}" fill="#555" font-size="10" font-family="monospace">selected</text>`;
  y += 46;
  /* 非選択：白40% */
  svg += icon(ICONS[name], 22, '#ffffff', x, y);
  svg += `<rect x="${x}" y="${y}" width="22" height="22" fill="#000" opacity="0.6" />`;
  svg += `<text x="${x + 30}" y="${y + 15}" fill="#555" font-size="10" font-family="monospace">inactive</text>`;
});

const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#14110f"/>
  ${svg}
</svg>`;

fs.writeFileSync('sheet.svg', doc);
await sharp(Buffer.from(doc), { density: 288 }).png().toFile('sheet.png');
fs.writeFileSync('icons.json', JSON.stringify(ICONS, null, 2));
console.log('-> sheet.png / icons.json');
