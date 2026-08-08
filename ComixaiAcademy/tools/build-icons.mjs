/* ============================================================
   アプリのアイコンを作って、実寸で確認できる画像を書き出す。

   ルール（小さいサイズで潰れないための鉄則）
   ・24×24グリッド／ベタ塗り／穴は fill-rule="evenodd" で抜く
   ・線で描かない。細い線は縮小すると消える
   ・抜き（マンガのベタに入れるハイライト）は最低2単位の幅を取る
   ・1アイコンの要素は3つまで
   ・抜きを斜めにして中央へ向けると「目」に見える。文字行なら水平に置く

   使い方:
     node tools/build-icons.mjs
       -> tools/.icon-preview/realsize.png  22pxで実際に描いて8倍に拡大（端末で見える通り）
       -> tools/.icon-preview/sheet.png     22/44/88px＋白抜き／黒版の一覧
       -> src/components/icon-paths.ts      アプリが読むパスデータ（自動生成）

   ※ 必ず realsize.png で判断すること。大きい絵だけで見ると、
     端末では潰れている、ということが起きる。
   ============================================================ */
import sharp from 'sharp';
import fs from 'node:fs';

/* 確認用の画像の置き場（gitignore対象） */
const OUT = new URL('./.icon-preview/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
const out = (name) => new URL(name, OUT).pathname;

const n = (v) => Number(v.toFixed(2));

/* ———————————————— 形の部品 ———————————————— */

const poly = (...pts) => 'M' + pts.map(([x, y]) => `${n(x)},${n(y)}`).join('L') + 'Z';

const rect = (x, y, w, h) => poly([x, y], [x + w, y], [x + w, y + h], [x, y + h]);

const circle = ({ cx, cy, r }) =>
  `M${n(cx - r)},${n(cy)}A${n(r)},${n(r)} 0 1 1 ${n(cx + r)},${n(cy)}A${n(r)},${n(r)} 0 1 1 ${n(cx - r)},${n(cy)}Z`;

const ellipse = ({ cx, cy, rx, ry }) =>
  `M${n(cx - rx)},${n(cy)}A${n(rx)},${n(ry)} 0 1 1 ${n(cx + rx)},${n(cy)}A${n(rx)},${n(ry)} 0 1 1 ${n(cx - rx)},${n(cy)}Z`;

/** 歯車 */
function gear({ cx = 12, cy = 12, teeth = 8, rOut = 11, rIn = 8.1, ratio = 0.46, rot = 0 }) {
  const step = (Math.PI * 2) / teeth;
  const half = (step * ratio) / 2;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2 + rot;
    pts.push([cx + rOut * Math.cos(a - half), cy + rOut * Math.sin(a - half)]);
    pts.push([cx + rOut * Math.cos(a + half), cy + rOut * Math.sin(a + half)]);
    const b = a + step / 2;
    pts.push([cx + rIn * Math.cos(b - half), cy + rIn * Math.sin(b - half)]);
    pts.push([cx + rIn * Math.cos(b + half), cy + rIn * Math.sin(b + half)]);
  }
  return poly(...pts);
}

/** 星（頂点が真上） */
function star({ cx, cy, r, inner = 0.46, rot = 0 }) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (i * Math.PI) / 5 - Math.PI / 2 + rot;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  return poly(...pts);
}

/** 4方向のキラリ（マンガの効果） */
function twinkle({ cx, cy, r, waist = 0.17 }) {
  const w = r * waist;
  return poly(
    [cx, cy - r], [cx + w, cy - w], [cx + r, cy], [cx + w, cy + w],
    [cx, cy + r], [cx - w, cy + w], [cx - r, cy], [cx - w, cy - w],
  );
}

/* ———————————————— アイコン ———————————————— */

export const ICONS = {
  /* ── タブ ── */

  home:
    'M12,1.6L16.9,5.9L16.9,3.2L19.6,3.2L19.6,8.3L23.2,11.5L19.9,11.5L19.9,21.9L4.1,21.9L4.1,11.5L0.8,11.5Z' +
    'M9.4,21.9L9.4,14.6L14.6,14.6L14.6,21.9Z' +
    'M5.6,10.0L10.4,5.8L12.6,5.8L7.8,10.0Z',

  learn:
    'M1.2,4.6C4.0,3.6 8.0,3.9 11.0,5.9L11.0,20.4C8.0,18.4 4.0,18.1 1.2,19.1Z' +
    'M22.8,4.6C20.0,3.6 16.0,3.9 13.0,5.9L13.0,20.4C16.0,18.4 20.0,18.1 22.8,19.1Z' +
    'M3.7,12.0L8.9,12.0L8.9,13.9L3.7,13.9Z' +
    'M20.3,12.0L15.1,12.0L15.1,13.9L20.3,13.9Z',

  badges:
    'M4.9,1.9L8.9,1.9L12.3,7.9L9.0,9.6Z' +
    'M19.1,1.9L15.1,1.9L11.7,7.9L15.0,9.6Z' +
    circle({ cx: 12, cy: 15.2, r: 7.4 }) +
    star({ cx: 12, cy: 15.3, r: 4.9, inner: 0.44 }),

  settings:
    gear({ cx: 12, cy: 12, teeth: 7, rOut: 11.4, rIn: 7.9, ratio: 0.58, rot: 0.22 }) +
    circle({ cx: 12, cy: 12, r: 4.0 }),

  /* ── 状態マーク ── */

  /** 修了のチェック。太い一筆 */
  check: poly([1.4, 12.2], [5.0, 8.6], [9.6, 13.2], [19.4, 3.4], [23.0, 7.0], [9.6, 20.4]),

  /** ノーミス＝二重丸（日本の「よくできました」） */
  perfect:
    circle({ cx: 12, cy: 12, r: 11.2 }) +
    circle({ cx: 12, cy: 12, r: 8.4 }) +
    circle({ cx: 12, cy: 12, r: 5.0 }),

  /** 未着手の再生マーク */
  play: poly([5.6, 2.6], [21.4, 12], [5.6, 21.4]),

  /** 未解除の錠前 */
  lock:
    rect(3.6, 10.0, 16.8, 11.8) +
    'M6.8,10.0L6.8,7.6A5.2,5.2 0 0 1 17.2,7.6L17.2,10.0L14.2,10.0L14.2,7.6A2.2,2.2 0 0 0 9.8,7.6L9.8,10.0Z' +
    circle({ cx: 12, cy: 15.0, r: 1.9 }) +
    rect(11.1, 15.0, 1.8, 4.0),

  /* ── コース ── */

  /** 芽（AIのきほん） */
  sprout:
    rect(10.7, 11.4, 2.6, 10.6) +
    'M11.2,13.0C6.8,13.4 3.0,10.4 2.2,5.8C6.8,5.4 10.6,8.4 11.2,13.0Z' +
    'M12.8,13.0C17.2,13.4 21.0,10.4 21.8,5.8C17.2,5.4 13.4,8.4 12.8,13.0Z',

  /** 鞄（最初の一週間） */
  briefcase:
    rect(1.6, 7.2, 20.8, 13.6) +
    'M8.4,2.6L15.6,2.6L15.6,7.2L12.9,7.2L12.9,5.2L11.1,5.2L11.1,7.2L8.4,7.2Z' +
    rect(10.2, 12.0, 3.6, 3.4),

  /** ペン（プロンプト道場） */
  pen:
    poly([17.6, 1.8], [22.2, 6.4], [8.6, 20.0], [1.6, 22.4], [4.0, 15.4]) +
    poly([15.6, 4.2], [19.8, 8.4], [17.9, 10.3], [13.7, 6.1]),

  /** 盾（事故らないAI） */
  shield:
    'M12,1.4L21.8,4.9L21.8,12.2C21.8,17.6 17.6,21.4 12,22.8C6.4,21.4 2.2,17.6 2.2,12.2L2.2,4.9Z' +
    poly([7.0, 7.4], [10.8, 6.0], [10.8, 8.6], [7.0, 10.0]),

  /** ロケット（これからのAI） */
  rocket:
    'M12,1.2C15.6,4.4 17.4,9.0 17.4,13.8L17.4,16.6L6.6,16.6L6.6,13.8C6.6,9.0 8.4,4.4 12,1.2Z' +
    circle({ cx: 12, cy: 9.2, r: 2.4 }) +
    poly([6.6, 11.4], [6.6, 16.6], [2.6, 20.2], [3.4, 13.8]) +
    poly([17.4, 11.4], [17.4, 16.6], [21.4, 20.2], [20.6, 13.8]) +
    poly([9.6, 18.4], [14.4, 18.4], [12, 23.2]),

  /* ── 職種 ── */

  /** 右肩上がりの棒グラフ（営業） */
  chart:
    rect(1.8, 14.2, 5.4, 7.6) +
    rect(9.3, 9.4, 5.4, 12.4) +
    rect(16.8, 3.4, 5.4, 18.4),

  /** メガホン（マーケティング） */
  megaphone:
    poly([21.8, 2.4], [21.8, 21.6], [8.6, 15.8], [8.6, 8.2]) +
    rect(2.2, 8.6, 6.4, 6.8) +
    poly([3.6, 15.4], [7.8, 15.4], [6.8, 22.2], [4.2, 22.2]),

  /** フォルダ（事務・バックオフィス） */
  folder:
    'M1.6,4.4L9.2,4.4L11.4,7.0L22.4,7.0L22.4,19.9L1.6,19.9Z' +
    rect(4.6, 10.6, 14.8, 2.0),

  /** パレット（クリエイター） */
  palette:
    circle({ cx: 12, cy: 12, r: 10.8 }) +
    circle({ cx: 6.4, cy: 10.4, r: 1.9 }) +
    circle({ cx: 10.2, cy: 5.8, r: 1.9 }) +
    circle({ cx: 15.8, cy: 6.4, r: 1.9 }) +
    circle({ cx: 18.8, cy: 11.0, r: 1.9 }) +
    ellipse({ cx: 13.2, cy: 16.6, rx: 3.4, ry: 2.5 }),

  /* ── 称号 ── */

  /** たまご（AI見習い） */
  egg:
    'M12,2.0C16.3,6.2 19.0,10.8 19.0,14.9C19.0,19.2 15.9,22.4 12,22.4C8.1,22.4 5.0,19.2 5.0,14.9C5.0,10.8 7.7,6.2 12,2.0Z' +
    poly(
      [5.2, 15.0], [8.2, 12.8], [10.6, 15.4], [13.4, 12.8], [15.8, 15.4], [18.8, 13.2],
      [18.8, 15.6], [15.8, 17.8], [13.4, 15.2], [10.6, 17.8], [8.2, 15.2], [5.2, 17.4],
    ),

  /** 吹き出し2つ（AIの相棒） */
  buddy:
    rect(0.8, 1.8, 13.4, 8.4) +
    poly([3.6, 10.2], [7.6, 10.2], [3.4, 14.4]) +
    rect(9.8, 12.4, 13.4, 8.4) +
    poly([16.4, 20.8], [20.4, 20.8], [20.6, 24.0]),

  /** 金槌（AI使い）。スパナは22pxで判別できなかったので道具の代表をこちらに */
  hammer:
    poly([9.2, 1.4], [21.8, 5.0], [20.0, 11.0], [7.4, 7.4]) +
    poly([9.4, 7.2], [13.0, 8.2], [6.6, 22.6], [2.8, 21.5]),

  /** 学帽（AI職人） */
  cap:
    poly([12, 2.4], [23.2, 8.0], [12, 13.6], [0.8, 8.0]) +
    'M5.6,10.6L5.6,16.4C5.6,18.9 8.4,20.8 12,20.8C15.6,20.8 18.4,18.9 18.4,16.4L18.4,10.6L12,14.0Z' +
    rect(20.4, 9.2, 1.8, 8.2),

  /** トロフィー（AI師範） */
  trophy:
    'M6.0,2.0L18.0,2.0L18.0,9.4C18.0,12.9 15.3,15.6 12,15.6C8.7,15.6 6.0,12.9 6.0,9.4Z' +
    'M6.0,3.6L1.8,3.6L1.8,7.2C1.8,9.8 3.7,11.6 6.4,11.9L6.4,9.6C5.0,9.3 4.0,8.4 4.0,7.0L4.0,5.8L6.0,5.8Z' +
    'M18.0,3.6L22.2,3.6L22.2,7.2C22.2,9.8 20.3,11.6 17.6,11.9L17.6,9.6C19.0,9.3 20.0,8.4 20.0,7.0L20.0,5.8L18.0,5.8Z' +
    rect(10.6, 15.6, 2.8, 3.4) +
    rect(6.2, 19.0, 11.6, 3.0),

  /** 王冠（AIマスター／全課程修了） */
  crown:
    poly([1.2, 6.2], [7.0, 12.6], [12, 3.0], [17.0, 12.6], [22.8, 6.2], [20.8, 19.0], [3.2, 19.0]) +
    rect(3.2, 19.8, 17.6, 2.6) +
    circle({ cx: 12, cy: 14.4, r: 1.7 }),

  /* ── バッジ ── */

  /** 仮面（相棒えらび） */
  mask:
    'M2.0,4.2C7.4,2.8 16.6,2.8 22.0,4.2C22.0,13.2 18.2,21.6 12,21.6C5.8,21.6 2.0,13.2 2.0,4.2Z' +
    poly([6.0, 8.8], [10.0, 7.8], [10.0, 11.2], [6.2, 12.0]) +
    poly([18.0, 8.8], [14.0, 7.8], [14.0, 11.2], [17.8, 12.0]) +
    poly([8.2, 15.2], [15.8, 15.2], [12, 18.6]),

  /** コンパス（配属決定） */
  compass:
    circle({ cx: 12, cy: 12, r: 11.0 }) +
    circle({ cx: 12, cy: 12, r: 8.4 }) +
    poly([17.2, 6.8], [13.8, 13.8], [6.8, 17.2], [10.2, 10.2]),

  /** 星（はじめの一歩） */
  star: star({ cx: 12, cy: 12.4, r: 11.4, inner: 0.44 }),

  /** 的（無傷の5本） */
  target:
    circle({ cx: 10.6, cy: 13.4, r: 10.4 }) +
    circle({ cx: 10.6, cy: 13.4, r: 7.4 }) +
    circle({ cx: 10.6, cy: 13.4, r: 4.2 }) +
    circle({ cx: 10.6, cy: 13.4, r: 1.7 }) +
    poly([13.6, 10.4], [21.2, 2.8], [22.8, 4.4], [15.2, 12.0]),

  /** 炎（三日坊主、返上） */
  fire:
    'M12.6,0.6C13.6,5.4 17.2,6.6 18.8,10.2C21.6,16.4 17.4,23.4 11.6,23.4C6.4,23.4 2.6,19.4 2.6,14.6C2.6,10.4 5.4,8.0 7.2,5.0C7.8,8.0 9.0,9.4 10.4,10.2C10.0,6.4 10.6,3.2 12.6,0.6Z' +
    'M12.4,12.4C13.3,14.7 15.2,15.5 15.2,17.6C15.2,19.7 13.7,21.0 11.8,21.0C9.9,21.0 8.4,19.7 8.4,17.8C8.4,15.5 11.1,14.9 12.4,12.4Z',

  /** カレンダー（一週間皆勤） */
  calendar:
    rect(1.6, 4.0, 20.8, 18.2) +
    rect(1.6, 4.0, 20.8, 5.6) +
    rect(5.8, 1.2, 3.2, 5.2) +
    rect(15.0, 1.2, 3.2, 5.2) +
    rect(4.6, 12.2, 3.6, 3.2) +
    rect(10.2, 12.2, 3.6, 3.2) +
    rect(15.8, 12.2, 3.6, 3.2) +
    rect(4.6, 17.2, 3.6, 3.2) +
    rect(10.2, 17.2, 3.6, 3.2),

  /* ── その他 ── */

  /** 人物（アバターの代役） */
  person:
    circle({ cx: 12, cy: 7.0, r: 5.2 }) +
    'M2.4,22.6C2.4,16.6 6.7,13.0 12,13.0C17.3,13.0 21.6,16.6 21.6,22.6Z',

  /** 電球（気づき） */
  bulb:
    'M12,1.0C16.7,1.0 20.4,4.7 20.4,9.2C20.4,12.5 18.5,14.6 16.9,16.4L16.9,18.2L7.1,18.2L7.1,16.4C5.5,14.6 3.6,12.5 3.6,9.2C3.6,4.7 7.3,1.0 12,1.0Z' +
    rect(7.8, 19.2, 8.4, 2.2) +
    rect(9.2, 22.2, 5.6, 1.8),

  /** 感嘆符（注意） */
  bang: poly([9.0, 1.4], [15.0, 1.4], [14.2, 15.2], [9.8, 15.2]) + circle({ cx: 12, cy: 19.8, r: 3.1 }),

  /** キラリ（よくできた） */
  sparkle: twinkle({ cx: 10.2, cy: 10.2, r: 10.2 }) + twinkle({ cx: 19.2, cy: 19.2, r: 4.6 }),

  /** キラリ1つ。**散らして舞わせる用**（sparkle は星2つ入りなので、
      6個も撒くと画面が潰れる）。サイトの ph-star-four と同じ形 */
  twinkle: twinkle({ cx: 12, cy: 12, r: 11.6 }),
};

/* ———————————————— 確認用の画像 ———————————————— */

const NAMES = Object.keys(ICONS);
const svgOf = (d, size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
     <path d="${d}" fill="#ffffff" fill-rule="evenodd"/></svg>`;

/* 1) 22pxで実際に描いてから8倍に拡大＝端末で見える通り */
const Z = 8, S22 = 22, COLS = 8;
const cell = S22 * Z + 18;
const rows = Math.ceil(NAMES.length / COLS);
const W = 18 + COLS * cell;
const H = 18 + rows * (cell + 6);
const layers = [];
for (const [i, name] of NAMES.entries()) {
  const cx = 18 + (i % COLS) * cell;
  const cy = 18 + Math.floor(i / COLS) * (cell + 6);
  const png = await sharp(Buffer.from(svgOf(ICONS[name], S22))).png().toBuffer();
  layers.push({
    input: await sharp(png).resize(S22 * Z, S22 * Z, { kernel: 'nearest' }).png().toBuffer(),
    left: cx,
    top: cy,
  });
  layers.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="22"><text x="0" y="16" fill="#8a8078" font-size="14" font-family="monospace">${name}</text></svg>`,
    ),
    left: cx,
    top: cy + S22 * Z + 2,
  });
}
await sharp({ create: { width: W, height: H, channels: 4, background: '#14110f' } })
  .composite(layers)
  .png()
  .toFile(out('realsize.png'));

/* 2) 大きさ違い＋白抜き／黒版の一覧 */
const SIZES = [22, 44, 88];
let body = '';
const CW = 150, RH = 200;
NAMES.forEach((name, i) => {
  const x = 24 + (i % 6) * CW;
  const y = 40 + Math.floor(i / 6) * RH;
  body += `<text x="${x}" y="${y - 12}" fill="#8a8078" font-size="12" font-family="monospace">${name}</text>`;
  let dx = x;
  for (const s of SIZES) {
    body += `<g transform="translate(${dx},${y + (88 - s) / 2}) scale(${s / 24})"><path d="${ICONS[name]}" fill="#fff" fill-rule="evenodd"/></g>`;
    dx += s + 6;
  }
  body += `<circle cx="${x + 15}" cy="${y + 118}" r="21" fill="#e60012"/>`;
  body += `<g transform="translate(${x + 4},${y + 107}) scale(${22 / 24})"><path d="${ICONS[name]}" fill="#fff" fill-rule="evenodd"/></g>`;
  body += `<rect x="${x + 46}" y="${y + 97}" width="42" height="42" fill="#fbf7ef"/>`;
  body += `<g transform="translate(${x + 56},${y + 107}) scale(${22 / 24})"><path d="${ICONS[name]}" fill="#14110f" fill-rule="evenodd"/></g>`;
});
const sw = 24 + 6 * CW;
const sh = 46 + Math.ceil(NAMES.length / 6) * RH;
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}"><rect width="${sw}" height="${sh}" fill="#14110f"/>${body}</svg>`;
fs.writeFileSync(out('sheet.svg'), sheet);
await sharp(Buffer.from(sheet), { density: 200 }).png().toFile(out('sheet.png'));

fs.writeFileSync(out('icons.json'), JSON.stringify(ICONS, null, 2));

/* 3) アプリが読むパスデータ（手で書き写さない） */
const ts =
  `/* このファイルは tools/build-icons.mjs が生成します。手で編集しないこと。\n` +
  `   形を変えるときは tools/build-icons.mjs を直して \`node tools/build-icons.mjs\` を実行。 */\n\n` +
  `export const ICON_PATHS = {\n` +
  NAMES.map((k) => `  ${k}: '${ICONS[k]}',`).join('\n') +
  `\n} as const;\n\nexport type IconName = keyof typeof ICON_PATHS;\n`;
fs.writeFileSync(new URL('../src/components/icon-paths.ts', import.meta.url), ts);

console.log(`-> tools/.icon-preview/（確認用）と src/components/icon-paths.ts（${NAMES.length}個）`);
