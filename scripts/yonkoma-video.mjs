/* ============================================================
   入稿済みの4コマを、ショート動画（1080×1920・約24秒）にする。

     npm run yonkoma:video -- <slug>

   仕組み:
     public/yonkoma/<glossary|prompts>/<slug>.png を読み、
     コマの黒枠を画像から自動検出 → コマごとに切り出し →
     サイトと同じ書体・トークンでフレーム画像を組み →
     ffmpegでズーム＋スライド＋めくりSEのmp4に書き出す。
     4コマの後には、用語ページと同じ図解（ビルド済みHTMLから抜く）＋
     一文説明の「図解カード」が挟まる。
     枠が検出できない絵は、全体をゆっくりスクロールする構成に落ちる。

   出力:
     yonkoma-videos/<slug>.mp4   … YouTube Shorts / TikTok / Reels / X 共用
     yonkoma-videos/<slug>.txt   … アップロード用のタイトル・説明文・タグ

   必要なもの（どちらも package.json には入れない。使う時だけ）:
     npm install --no-save ffmpeg-static   （ffmpegがPATHに無い場合）
     Playwright（他スクリプトと同じくグローバル or ローカル導入を自動で拾う）

   任意:
     scripts/yonkoma-bgm.mp3 … 権利クリアなBGMを置くと小音量でミックスされる
     public/yonkoma/<section>/<slug>.panels.json
       … 自動検出がうまくいかない絵のコマ位置指定 [{"top":120,"bottom":640},…]
   ============================================================ */
import { mkdir, readFile, writeFile, access, rm, mkdtemp } from "node:fs/promises";
import { execSync, execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "yonkoma-videos");
const BGM_PATH = path.join(ROOT, "scripts/yonkoma-bgm.mp3");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const KEEP = flags.has("--keep"); // 中間ファイル（フレームPNG等）を残してデバッグ

/* —— 尺の設計。ショートは冒頭で掴んで15〜20秒で終えるのが基本 —— */
const FPS = 30;
const PANEL_SEC = 3.2;
/* 4コマ目の後の図解・説明カード。一文＋図を読み切れる長さ */
const EXPLAIN_SEC = 6.0;
const END_SEC = 2.8;
/* ページめくりはCSS 3Dをコマ送りで撮る（ffmpegの既製トランジションに
   めくりが無いため）。16コマ×30fps ≒ 0.53秒 */
const FLIP_FRAMES = 16;
/* エンドカードへのクロスフェードの長さ（めくりはコマ間だけの演出） */
const FADE_FRAMES = 10;
/* 紙のたわみ表現: ページを縦の短冊に割り、円筒写像で曲げる。多いほど滑らか */
const FLIP_STRIPS = 27;

/* —— デザイントークン（globals.cssと揃える） —— */
const INK = "#14110f";
const INK_500 = "#6e635b";
const PAPER_0 = "#ffffff";
const PAPER_50 = "#fbf7ef";
const PAPER_100 = "#f4ecdd";
const YELLOW = "#ffd23f";
const RED = "#e60012";
const RED_600 = "#c70010";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

/* ═══════════════ 対象を解決 ═══════════════ */

const slug = args[0];
if (!slug) {
  console.log("使い方: npm run yonkoma:video -- <slug>   （対象一覧は npm run yonkoma -- --list）");
  process.exit(1);
}

const { TERMS } = await import(pathToFileURL(path.join(ROOT, "src/app/glossary/data.ts")).href);
const RECIPES = [
  ...(await import(pathToFileURL(path.join(ROOT, "src/app/prompts/recipes-basics.ts")).href)).RECIPES_BASICS,
  ...(await import(pathToFileURL(path.join(ROOT, "src/app/prompts/recipes-biz.ts")).href)).RECIPES_BIZ,
  ...(await import(pathToFileURL(path.join(ROOT, "src/app/prompts/recipes-work.ts")).href)).RECIPES_WORK,
];

const term = TERMS.find((t) => t.slug === slug);
const recipe = RECIPES.find((r) => r.slug === slug);
if (!term && !recipe) {
  console.error(`slug「${slug}」は用語集にもプロンプト集にも無い`);
  process.exit(1);
}
const section = term ? "glossary" : "prompts";
const meta = term
  ? {
      title: `${term.term}とは？`,
      short: term.short,
      pagePath: `/glossary/${term.slug}`,
      hashtags: ["#AI", "#生成AI", "#4コマ漫画", `#${term.term.replace(/[（(].*$/, "")}`],
    }
  : {
      title: recipe.title,
      short: recipe.catch,
      pagePath: `/prompts/${recipe.slug}`,
      hashtags: ["#AI", "#生成AI", "#4コマ漫画", "#プロンプト"],
    };

let stripPath = null;
for (const ext of ["webp", "png"]) {
  const p = path.join(ROOT, "public/yonkoma", section, `${slug}.${ext}`);
  if (await exists(p)) stripPath = p;
}
if (!stripPath) {
  console.error(`4コマがまだ入稿されていない: public/yonkoma/${section}/${slug}.png`);
  process.exit(1);
}

/* ═══════════════ 道具の確保 ═══════════════ */

function resolveFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return "ffmpeg";
  } catch {}
  const local = path.join(ROOT, "node_modules/ffmpeg-static/ffmpeg");
  try {
    execFileSync(local, ["-version"], { stdio: "ignore" });
    return local;
  } catch {}
  console.error("ffmpegが無い。`npm install --no-save ffmpeg-static` を実行してからやり直して");
  process.exit(1);
}
const FFMPEG = resolveFfmpeg();

async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    const npmRoot = execSync("npm root -g").toString().trim();
    ({ chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href));
  }
  const sandboxChrome = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_PATH || ((await exists(sandboxChrome)) ? sandboxChrome : undefined);
  return chromium.launch({ executablePath, args: ["--allow-file-access-from-files"] });
}

async function fontCss(pkg, weights) {
  let css = "";
  for (const w of weights) {
    const cssPath = path.join(ROOT, "node_modules/@fontsource", pkg, `${w}.css`);
    const dirUrl = pathToFileURL(path.join(ROOT, "node_modules/@fontsource", pkg)).href;
    css += (await readFile(cssPath, "utf8")).replaceAll("url(./", `url(${dirUrl}/`);
  }
  return css;
}
const FONTS =
  (await fontCss("zen-kaku-gothic-new", [500, 700, 900])) +
  (await fontCss("jetbrains-mono", [700])) +
  (await fontCss("yusei-magic", [400]));

/* ═══════════════ 1. コマの検出と切り出し ═══════════════ */

/* setContentしたページ（about:blank相当）からはfile://の画像が読めないので、
   画像は常にdata URLで渡す */
async function toDataUrl(file) {
  const mime = file.endsWith(".webp") ? "image/webp" : "image/png";
  return `data:${mime};base64,${(await readFile(file)).toString("base64")}`;
}

/** ブラウザ内でピクセルを走査して、コマの黒枠の帯を探す */
async function detectAndCropPanels(page) {
  const sidecar = stripPath.replace(/\.(png|webp)$/, ".panels.json");
  const manual = (await exists(sidecar)) ? JSON.parse(await readFile(sidecar, "utf8")) : null;

  await page.setContent(`<img id="strip" src="${await toDataUrl(stripPath)}">`);
  await page.waitForFunction(
    () => document.getElementById("strip").complete && document.getElementById("strip").naturalWidth > 0
  );

  const result = await page.evaluate((manualBands) => {
    const img = document.getElementById("strip");
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const cx = cv.getContext("2d");
    cx.drawImage(img, 0, 0);
    const data = cx.getImageData(0, 0, w, h).data;
    const darkAt = (x, y) => {
      const i = (y * w + x) * 4;
      return data[i] + data[i + 1] + data[i + 2] < 270 && data[i + 3] > 128;
    };

    let bands;
    if (manualBands) {
      bands = manualBands;
    } else {
      /* 行ごとに「中央90%のうち暗いピクセルの割合」を出す */
      const x0 = Math.floor(w * 0.05);
      const x1 = Math.ceil(w * 0.95);
      const frac = new Array(h);
      for (let y = 0; y < h; y++) {
        let n = 0;
        for (let x = x0; x < x1; x += 2) if (darkAt(x, y)) n++;
        frac[y] = n / ((x1 - x0) / 2);
      }
      /* 横断する黒い行の連なり＝枠線の帯。太い帯（ベタ背景）は枠ではない */
      const raw = [];
      let start = -1;
      for (let y = 0; y <= h; y++) {
        const on = y < h && frac[y] > 0.5;
        if (on && start < 0) start = y;
        if (!on && start >= 0) {
          raw.push({ top: start, bottom: y - 1 });
          start = -1;
        }
      }
      const borders = raw.filter((b) => b.bottom - b.top < 40);
      if (borders.length < 6 || borders.length % 2 !== 0) return { panels: null, w, h };
      /* 枠線の帯を上下ペアにしてコマとみなす */
      bands = [];
      for (let i = 0; i + 1 < borders.length; i += 2) {
        bands.push({ top: borders[i].top, bottom: borders[i + 1].bottom });
      }
      const ok =
        bands.length >= 3 &&
        bands.length <= 6 &&
        bands.every((b) => b.bottom - b.top > 150) &&
        bands.every((b, i) => i === 0 || b.top - bands[i - 1].bottom > 2);
      if (!ok) return { panels: null, w, h };
    }

    /* コマごとに左右の端も検出して切り出す */
    const panels = [];
    for (const b of bands) {
      let left = w;
      let right = 0;
      for (let x = 0; x < w; x += 2) {
        for (let y = b.top; y <= b.bottom; y += 4) {
          if (darkAt(x, y)) {
            if (x < left) left = x;
            if (x > right) right = x;
            break;
          }
        }
      }
      if (right <= left) {
        left = 0;
        right = w - 1;
      }
      const pad = 4;
      const px = Math.max(0, left - pad);
      const py = Math.max(0, b.top - pad);
      const pw = Math.min(w, right + pad) - px;
      const ph = Math.min(h, b.bottom + pad) - py;
      const out = document.createElement("canvas");
      out.width = pw;
      out.height = ph;
      out.getContext("2d").drawImage(img, px, py, pw, ph, 0, 0, pw, ph);
      panels.push(out.toDataURL("image/png"));
    }
    return { panels, w, h };
  }, manual);

  /* panelsはdata URLの配列のまま返す（フレームHTMLに直接埋め込む） */
  return result.panels;
}

/* ═══════════════ 2. フレーム画像を組む ═══════════════ */

/* ヘッダーはシリーズロゴ（public/yonkoma/logo.webp）。
   ロゴの文言は「AI用語」なので用語集の動画だけに使い、
   プロンプト集や、万一ロゴが無い場合はテキストkickerに落ちる */
const LOGO_PATH = path.join(ROOT, "public/yonkoma/logo.webp");
const logoUrl = section === "glossary" && (await exists(LOGO_PATH)) ? await toDataUrl(LOGO_PATH) : null;
const HEADER = logoUrl
  ? `<img class="serieslogo" src="${logoUrl}" alt="4コマでわかる！AI用語">
  <div class="title"><span class="mk">${esc(meta.title)}</span></div>`
  : `<div class="kicker">4コマで学ぶAI</div>
  <div class="title"><span class="mk">${esc(meta.title)}</span></div>`;

/* サイトと同じ言語で組む：クリーム地＋トーンドット、シリーズロゴ、
   墨色の極太見出しに黄色マーカー、フッターに小さくロゴ */
const FRAME_BASE = `
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1080px; height:1920px; font-family:"Zen Kaku Gothic New", sans-serif; color:${INK};
  background:${PAPER_100};
  background-image:radial-gradient(rgba(20,17,15,0.13) 1.7px, transparent 1.8px);
  background-size:15px 15px; overflow:hidden; }
.stage { width:1080px; height:1920px; display:flex; flex-direction:column; align-items:center; padding:70px 56px 140px; }
.kicker { font-family:"JetBrains Mono", monospace; font-size:25px; letter-spacing:.2em; font-weight:700; color:${RED_600}; margin-top:50px; }
/* ロゴ画像は正方形カンバスに余白込みで描かれているので、負マージンで詰める */
.serieslogo { width:400px; height:auto; margin:-30px 0 -46px; }
.title { font-size:54px; font-weight:900; line-height:1.5; text-align:center; margin-top:20px; max-width:940px; letter-spacing:.02em; }
.title .mk { background:linear-gradient(transparent 64%, ${YELLOW} 64%); padding:0 8px; }
.foot { margin-top:auto; display:flex; flex-direction:column; align-items:center; gap:20px; }
.dots { display:flex; gap:14px; }
.dot { width:18px; height:18px; border-radius:50%; border:3px solid ${INK}; opacity:.2; }
.dot.on { background:${YELLOW}; border-color:${INK}; opacity:1; }
.brand { display:flex; align-items:baseline; gap:16px; }
.logo { font-size:29px; font-weight:900; letter-spacing:.01em; color:${INK}; }
.logo .mix { color:${RED}; }
.site { font-family:"JetBrains Mono", monospace; font-size:21px; font-weight:700; color:${INK_500}; }
`;

function panelFrameHtml(panelUrl, index, total) {
  const dots = Array.from({ length: total }, (_, i) => `<span class="dot ${i === index ? "on" : ""}"></span>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}${FRAME_BASE}
.panel-wrap { margin-top:56px; flex:1; display:flex; align-items:center; justify-content:center; min-height:0; width:100%; }
/* 元画像が小さくてもカード幅いっぱいに拡大する（width固定＋containで比率維持） */
.panel-wrap img { width:968px; height:auto; max-height:1180px; object-fit:contain;
  background:${PAPER_0}; border-radius:14px; }
</style></head><body><div class="stage">
  ${HEADER}
  <div class="panel-wrap"><img src="${panelUrl}"></div>
  <div class="foot"><div class="dots">${dots}</div><div class="brand"><span class="logo">CO<span class="mix">MIX</span>AI</span><span class="site">comixai.dev</span></div></div>
</div></body></html>`;
}

/* 締めは黒画面ではなく「同じ棚の最後のカード」。4コマ目がめくれると
   下からこのカードが現れる（＝最後もめくりで統一できる）。
   968×640で描き、他のコマと同じカードとして枠に置く */
function endCardHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
* { margin:0; padding:0; box-sizing:border-box; }
body { width:968px; height:640px; font-family:"Zen Kaku Gothic New", sans-serif; color:${INK};
  background:${PAPER_0};
  background-image:radial-gradient(rgba(20,17,15,0.07) 1.5px, transparent 1.6px);
  background-size:14px 14px; }
.card { width:968px; height:640px; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:26px; border:6px solid ${INK}; border-radius:14px; }
.logo { font-size:64px; font-weight:900; letter-spacing:.01em; }
.logo .mix { color:${RED}; }
.tsuzuki { font-size:32px; font-weight:900; }
.url { font-family:"JetBrains Mono", monospace; font-size:27px; font-weight:700;
  background:${YELLOW}; padding:14px 26px; border-radius:10px; border:3px solid ${INK}; }
.sub { font-size:19px; font-weight:700; color:${INK_500}; }
</style></head><body><div class="card">
  <div class="logo">CO<span class="mix">MIX</span>AI</div>
  <div class="tsuzuki">解説の続きは</div>
  <div class="url">comixai.dev${esc(meta.pagePath)}</div>
  <div class="sub">漫画家が描くAI解説・毎回描き下ろし</div>
</div></body></html>`;
}

/* —— 図解・説明カード（4コマ目の後に挟む） ——
   図解は用語ページと同じSVGを、ビルド済みHTML（.next/server/app/…）から
   そのまま抜いて使う。diagrams.tsxはJSXなのでnodeから直接importできない。
   ビルドが無い・図解が無い用語・プロンプト集では、一文説明だけのカードになる */
async function extractDiagram() {
  try {
    const html = await readFile(path.join(ROOT, ".next/server/app", section, `${slug}.html`), "utf8");
    const s = html.indexOf('<svg viewBox="0 0 600');
    if (s < 0) return null;
    const e = html.indexOf("</svg>", s);
    if (e < 0) return null;
    const svg = html.slice(s, e + 6);
    /* 直後のfont-handの一文がキャプション（diagrams.tsxのcaption） */
    const cap = html.slice(e, e + 400).match(/font-hand[^"]*"\s*>([^<]+)<\/div>/);
    return { svg, caption: cap ? cap[1] : null };
  } catch {
    return null;
  }
}

/** 968幅のカード。図解SVG＋キャプション＋一文説明。動画は引きで見るので
    サイトより文字を大きめに組む */
function explainCardHtml(diagram) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
* { margin:0; padding:0; box-sizing:border-box; }
/* SVG図解はサイトのvar(--…)参照のまま埋めるので、ここでトークンを定義する */
:root { --ink-900:${INK}; --paper-0:${PAPER_0}; --yellow-400:${YELLOW}; --red-500:${RED};
  --blue-500:#1a6cff; --text-muted:${INK_500};
  --font-heading:"Zen Kaku Gothic New", sans-serif; --font-hand:"Yusei Magic", sans-serif; }
body { width:968px; font-family:"Zen Kaku Gothic New", sans-serif; color:${INK}; background:transparent; }
.card { width:968px; display:flex; flex-direction:column; gap:18px;
  border:6px solid ${INK}; border-radius:14px; padding:42px 46px 40px;
  background:${PAPER_0};
  background-image:radial-gradient(rgba(20,17,15,0.07) 1.5px, transparent 1.6px);
  background-size:14px 14px; }
.lab { font-family:"JetBrains Mono", monospace; font-size:22px; letter-spacing:.14em;
  font-weight:700; color:${RED_600}; }
.diag svg { display:block; width:100%; height:auto; }
.cap { font-family:"Yusei Magic", sans-serif; font-size:25px; color:${INK_500}; text-align:right; margin-top:-6px; }
.exp { font-size:${diagram ? 31 : 35}px; font-weight:700; line-height:1.8; letter-spacing:.01em; }
.exp .mk { background:linear-gradient(transparent 64%, ${YELLOW} 64%); }
</style></head><body><div class="card">
  ${diagram ? `<div class="lab">DIAGRAM — 図解</div><div class="diag">${diagram.svg}</div>` : ""}
  ${diagram?.caption ? `<div class="cap">${esc(diagram.caption)}</div>` : ""}
  <div class="exp"><span class="mk">つまり？</span>　${esc(meta.short)}</div>
</div></body></html>`;
}

/** 検出に失敗した絵は、全体をスクロールで見せるフレーム（縦長1枚）にする */
function scrollFrameHtml(stripUrl, stripW, stripH) {
  const drawW = 968;
  const drawH = Math.round((stripH / stripW) * drawW);
  const frameH = Math.max(1920, drawH + 460);
  return {
    height: frameH,
    html: `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}${FRAME_BASE}
body { height:${frameH}px; }
.stage { height:${frameH}px; padding-bottom:120px; }
.strip { margin-top:52px; width:${drawW}px; border-radius:14px; background:${PAPER_0}; }
</style></head><body><div class="stage">
  ${HEADER}
  <img class="strip" src="${stripUrl}">
</div></body></html>`,
  };
}

/* ═══════════════ 2.5 コマめくりのコマ送り ═══════════════ */

/** コマのカード単体が、右から左へ紙らしく「曲がりながら」めくれて、
    下から次のコマが現れる。背景（タイトル・進捗ドット等）は静止したまま。
    モデルは実物のページカール：
      ・折り目（半径Rの円筒）がカード右端から左へ走る
      ・折り目より右の紙は円筒に巻き付いて持ち上がり、
        巻き切った部分は紙の裏（クリーム色）を上にして平らに左へ倒れる
      ・下のコマは折り目の右側だけ順に見えてくる（めくった下から現れる）
    実装はカードを縦短冊に割った絶対配置。短冊ごとに円筒写像
    x'=a+R·sinφ, z'=R(1-cosφ)（φ=(x-a)/R）を計算して translate3d + rotateY。 */
function flipSceneHtml(fromUrl, toUrl, dotIndex, total) {
  const dots = Array.from({ length: total }, (_, i) => `<span class="dot ${i === dotIndex ? "on" : ""}"></span>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}${FRAME_BASE}
.panel-wrap { margin-top:56px; flex:1; width:100%; position:relative; min-height:0; perspective:2000px; perspective-origin:50% 50%; }
.layer { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
.card { width:968px; height:auto; max-height:1180px; object-fit:contain; background:${PAPER_0}; border-radius:14px; }
#fromHolder { visibility:hidden; }
#rig { position:absolute; transform-style:preserve-3d; }
/* めくりの間だけ現れるスピード線（右から左）。うるさくならないよう
   本数少なめ・低不透明度・尾が消えるグラデにする。
   #lines=カード帯の手前 / #bglines=画面全体の背景（文字やカードの後ろ）の2層 */
#lines { position:absolute; inset:0; pointer-events:none; }
#bglines { position:absolute; inset:0; pointer-events:none; z-index:-1; }
.spd { position:absolute; height:5px; border-radius:3px;
  background:linear-gradient(to left, rgba(20,17,15,.55), rgba(20,17,15,0)); }
.seg { position:absolute; top:0; transform-origin:0% 50%; transform-style:preserve-3d; }
/* backface-visibilityは子に継承されないので、面の中身にも個別指定する */
.seg, .seg * { backface-visibility:hidden; }
.sface { position:absolute; top:0; left:0; overflow:hidden; background-repeat:no-repeat; background-color:${PAPER_0}; }
.sshade { position:absolute; inset:0; background:#000; }
/* 紙の裏。クリーム地に埋もれないよう白寄りにして、浮いている影を足す。
   影は下方向だけに絞る（横に広げると隣の短冊に落ちて縦縞に見える） */
.sback { position:absolute; top:0; left:0; transform:rotateY(180deg); background:#fffdf6;
  box-shadow:0 16px 18px -12px rgba(20,17,15,.28); }
/* コマの落ち影はやめた（絵より目立つ）。要素はJSの都合で残すが描画は無し */
#rigShadow { position:absolute; border-radius:14px; }
</style></head><body>
<div id="bglines"></div>
<div class="stage">
  ${HEADER}
  <div class="panel-wrap" id="wrap">
    <div class="layer"><img id="toCard" class="card" src="${toUrl}"></div>
    <div class="layer"><img id="fromHolder" class="card" src="${fromUrl}"></div>
    <div id="rigShadow"></div>
    <div id="rig"></div>
    <div id="lines"></div>
  </div>
  <div class="foot"><div class="dots">${dots}</div><div class="brand"><span class="logo">CO<span class="mix">MIX</span>AI</span><span class="site">comixai.dev</span></div></div>
</div>
<script>
  window.__init = async (N, seed) => {
    const toCard = document.getElementById("toCard");
    const holder = document.getElementById("fromHolder");
    await toCard.decode();
    await holder.decode();
    const wrapRect = document.getElementById("wrap").getBoundingClientRect();
    const fr = holder.getBoundingClientRect();
    const tr = toCard.getBoundingClientRect();
    const W = fr.width, H = fr.height;
    const left = fr.left - wrapRect.left, top = fr.top - wrapRect.top;
    const rig = document.getElementById("rig");
    rig.style.left = left + "px"; rig.style.top = top + "px";
    rig.style.width = W + "px"; rig.style.height = H + "px";
    const shadow = document.getElementById("rigShadow");
    shadow.style.left = left + "px"; shadow.style.top = top + "px";
    shadow.style.width = W + "px"; shadow.style.height = H + "px";
    const sw = W / N;
    window.__ctx = { W, H, left, sw, toLeft: tr.left - wrapRect.left, toW: tr.width, segs: [] };
    for (let i = 0; i < N; i++) {
      const x = i * sw;
      const seg = document.createElement("div");
      seg.className = "seg";
      seg.style.left = x + "px"; seg.style.width = sw + "px"; seg.style.height = H + "px";
      const f = document.createElement("div");
      f.className = "sface";
      f.style.width = (sw + 2) + "px"; f.style.height = H + "px";
      f.style.backgroundImage = "url(" + holder.src + ")";
      f.style.backgroundSize = W + "px " + H + "px";
      f.style.backgroundPosition = (-x) + "px 0";
      /* カードの角丸を端の短冊だけ再現して、静止コマとの継ぎ目を消す */
      if (i === 0) f.style.borderRadius = "14px 0 0 14px";
      if (i === N - 1) f.style.borderRadius = "0 14px 14px 0";
      const sh = document.createElement("div");
      sh.className = "sshade"; sh.style.opacity = "0";
      f.appendChild(sh);
      const b = document.createElement("div");
      b.className = "sback"; b.style.width = (sw + 2) + "px"; b.style.height = H + "px";
      seg.appendChild(b); seg.appendChild(f); rig.appendChild(seg);
      window.__ctx.segs.push({ seg, sh, x });
    }

    /* スピード線。位置と速さは乱数だが、コマ送りの全フレームで同一に
       なるようシード付き（回によっては配置が変わってよい）。
       手前（カード帯・濃いめ）と背景（画面全体・薄め）の2層 */
    let s = (seed * 48271) % 2147483647 || 1234;
    const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647;
    window.__lines = [];
    const addLine = (parent, y, maxY, op) => {
      const d = document.createElement("div");
      d.className = "spd";
      d.style.top = Math.max(8, Math.min(maxY, y)).toFixed(1) + "px";
      d.style.width = (220 + rnd() * 380).toFixed(0) + "px";
      d.style.height = (3 + rnd() * 4).toFixed(1) + "px";
      d.style.opacity = "0";
      parent.appendChild(d);
      window.__lines.push({ el: d, speed: 1 + rnd() * 0.9, x0: 1080 + rnd() * 500, op });
    };
    const linesEl = document.getElementById("lines");
    const wrapH = document.getElementById("wrap").getBoundingClientRect().height;
    for (let i = 0; i < 8; i++) addLine(linesEl, top - 70 + rnd() * (H + 140), wrapH - 12, 0.45);
    const bgEl = document.getElementById("bglines");
    for (let i = 0; i < 12; i++) addLine(bgEl, rnd() * 1900, 1908, 0.3);
  };

  window.setProgress = (p) => {
    const e = 0.5 - 0.5 * Math.cos(Math.PI * p);  /* ease-in-out */
    const { W, left, segs, toLeft, toW } = window.__ctx;
    const R = Math.max(90, W * 0.13);              /* 折り目の円筒半径＝紙の硬さ */
    /* カードは画面幅より狭いので、カード左端で止めると紙の束が画面に残る。
       画面の左外（カード位置left＋余白）まで走らせて完全に抜け切らせる */
    const a = W - (W + R + left + 60) * e;
    segs.forEach(({ seg, sh, x }) => {
      if (x <= a) {
        seg.style.transform = "none";
        sh.style.opacity = "0";
        return;
      }
      const phi = (x - a) / R;
      let tx, tz, deg, shade;
      if (phi <= Math.PI) {
        tx = a + R * Math.sin(phi) - x;
        tz = R * (1 - Math.cos(phi));
        deg = (phi * 180) / Math.PI;
        shade = phi <= Math.PI / 2 ? 0.32 * Math.sin(phi) : 0.1;
      } else {
        /* 巻き切った区間。tzを僅かに傾けて同一平面のちらつきを防ぐ */
        tx = a - (phi - Math.PI) * R - x;
        tz = 2 * R + (phi - Math.PI) * 0.6;
        deg = 179.5;
        shade = 0;
      }
      seg.style.transform =
        "translate3d(" + tx.toFixed(2) + "px,0," + tz.toFixed(2) + "px) rotateY(" + -deg.toFixed(2) + "deg)";
      sh.style.opacity = shade.toFixed(3);
    });
    /* 下のコマは折り目の右側だけ見せる。insetの他辺は負にして影を切らない */
    const clipL = Math.max(0, Math.min(toW, left + a - toLeft));
    document.getElementById("toCard").style.clipPath = "inset(-40px -40px -40px " + clipL.toFixed(1) + "px)";
    document.getElementById("rigShadow").style.opacity = (1 - e).toFixed(3);
    /* スピード線：中盤で最も濃く、始まりと終わりは消えている */
    const env = Math.sin(Math.PI * e);
    window.__lines.forEach(({ el, speed, x0, op }) => {
      el.style.left = (x0 - 2000 * e * speed).toFixed(1) + "px";
      el.style.opacity = (op * env).toFixed(3);
    });
  };
</script></body></html>`;
}

async function renderPanelCurlFrames(page, fromPanelUrl, toPanelUrl, dotIndex, total, work, index) {
  await page.setContent(flipSceneHtml(fromPanelUrl, toPanelUrl, dotIndex, total), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(({ N, seed }) => window.__init(N, seed), { N: FLIP_STRIPS, seed: index + 1 });
  const files = [];
  for (let k = 0; k < FLIP_FRAMES; k++) {
    await page.evaluate((p) => window.setProgress(p), k / (FLIP_FRAMES - 1));
    const f = path.join(work, `flip${index}-${String(k).padStart(2, "0")}.png`);
    await page.screenshot({ path: f });
    files.push(f);
  }
  return { pattern: path.join(work, `flip${index}-%02d.png`), n: FLIP_FRAMES };
}

/** エンドカードへの控えめなクロスフェード（めくりはコマ間だけの演出にする） */
async function renderFadeFrames(page, fromUrl, toUrl, work, index) {
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>
* { margin:0; padding:0; }
body { width:1080px; height:1920px; overflow:hidden; background:${INK}; }
img { position:absolute; inset:0; width:1080px; height:1920px; }
</style></head><body>
<img id="a" src="${fromUrl}"><img id="b" src="${toUrl}" style="opacity:0">
<script>
  window.__init = async () => {
    await document.getElementById("a").decode();
    await document.getElementById("b").decode();
  };
  window.setProgress = (p) => {
    document.getElementById("b").style.opacity = (0.5 - 0.5 * Math.cos(Math.PI * p)).toFixed(3);
  };
</script></body></html>`,
    { waitUntil: "networkidle" }
  );
  await page.evaluate(() => window.__init());
  const files = [];
  for (let k = 0; k < FADE_FRAMES; k++) {
    await page.evaluate((p) => window.setProgress(p), k / (FADE_FRAMES - 1));
    const f = path.join(work, `flip${index}-${String(k).padStart(2, "0")}.png`);
    await page.screenshot({ path: f });
    files.push(f);
  }
  return { pattern: path.join(work, `flip${index}-%02d.png`), n: FADE_FRAMES };
}

/* ═══════════════ 3. 音 ═══════════════ */

/** ページをめくる「サッ」を合成する（外部素材なしで済ませる） */
function makeFlipSe(work) {
  const out = path.join(work, "flip.wav");
  execFileSync(FFMPEG, [
    "-y",
    "-f", "lavfi",
    "-i", "anoisesrc=d=0.18:c=pink:a=0.6",
    "-af", "highpass=f=900,lowpass=f=7000,afade=t=in:d=0.02,afade=t=out:st=0.06:d=0.12,volume=0.55",
    out,
  ], { stdio: "ignore" });
  return out;
}

/* ═══════════════ 4. 組み立て ═══════════════ */

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const work = await mkdtemp(path.join(os.tmpdir(), "yonkoma-"));
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

  console.log(`「${meta.title}」の動画を作る…`);
  const panels = await detectAndCropPanels(page);

  const frames = [];
  const durations = [];

  if (panels) {
    console.log(`  コマ検出: ${panels.length}コマ`);
    for (let i = 0; i < panels.length; i++) {
      await page.setContent(panelFrameHtml(panels[i], i, panels.length), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const f = path.join(work, `frame-${i}.png`);
      await page.screenshot({ path: f });
      frames.push(f);
      durations.push(PANEL_SEC);
    }
  } else {
    console.log("  コマの枠を検出できない → 全体スクロール構成にする");
    console.log(`  （コマ位置を教えるには ${path.basename(stripPath).replace(/\.(png|webp)$/, "")}.panels.json を隣に置く。docs/yonkoma.md参照）`);
    const stripUrl = await toDataUrl(stripPath);
    const size = await page.evaluate(async (url) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { w: img.naturalWidth, h: img.naturalHeight };
    }, stripUrl);
    const { html, height } = scrollFrameHtml(stripUrl, size.w, size.h);
    await page.setViewportSize({ width: 1080, height });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const f = path.join(work, "frame-scroll.png");
    await page.screenshot({ path: f, fullPage: true });
    frames.push(f);
    durations.push(Math.min(16, Math.max(10, Math.round(height / 220))));
    await page.setViewportSize({ width: 1080, height: 1920 });
  }

  const dotsTotal = panels ? panels.length : 0;

  /* 図解・説明カード（4コマ目の後）。dotIndex=-1 で本編の外の意味 */
  const diagram = await extractDiagram();
  if (!diagram) console.log("  図解が見つからない（用語に図解が無いか、npm run build がまだ）→ 一文説明のみ");
  await page.setContent(explainCardHtml(diagram), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const explainCardPng = path.join(work, "explain-card.png");
  await page.locator(".card").screenshot({ path: explainCardPng });
  const explainCardUrl = await toDataUrl(explainCardPng);
  await page.setContent(panelFrameHtml(explainCardUrl, -1, dotsTotal), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const explainFrame = path.join(work, "frame-explain.png");
  await page.screenshot({ path: explainFrame });
  frames.push(explainFrame);
  durations.push(EXPLAIN_SEC);

  /* エンドカード（CTAを「最後のカード」として同じ枠に置く） */
  await page.setContent(endCardHtml(), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const endCardPng = path.join(work, "end-card.png");
  await page.screenshot({ path: endCardPng, clip: { x: 0, y: 0, width: 968, height: 640 } });
  const endCardUrl = await toDataUrl(endCardPng);
  await page.setContent(panelFrameHtml(endCardUrl, -1, dotsTotal), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const endFrame = path.join(work, "frame-end.png");
  await page.screenshot({ path: endFrame });
  frames.push(endFrame);
  durations.push(END_SEC);

  /* 切り替えのコマ送りを撮る。最後のCTAカードまで含めて全部めくりで進む */
  const transSeqs = [];
  if (panels) {
    const deck = [...panels, explainCardUrl, endCardUrl];
    for (let t = 0; t < deck.length - 1; t++) {
      const dotIndex = t + 1 < panels.length ? t + 1 : -1;
      transSeqs.push(await renderPanelCurlFrames(page, deck[t], deck[t + 1], dotIndex, panels.length, work, t));
    }
  } else {
    /* スクロール構成: 最後に見えている下端1920px → 図解カード → エンドカードのフェード */
    const lastView = await page.evaluate(async (url) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const cv = document.createElement("canvas");
      cv.width = 1080;
      cv.height = 1920;
      cv.getContext("2d").drawImage(img, 0, img.naturalHeight - 1920, 1080, 1920, 0, 0, 1080, 1920);
      return cv.toDataURL("image/png");
    }, await toDataUrl(frames[0]));
    transSeqs.push(await renderFadeFrames(page, lastView, await toDataUrl(explainFrame), work, 0));
    transSeqs.push(await renderFadeFrames(page, await toDataUrl(explainFrame), await toDataUrl(endFrame), work, 1));
  }
  await browser.close();

  /* —— ffmpeg —— */
  const seWav = makeFlipSe(work);
  const hasBgm = await exists(BGM_PATH);

  const inputs = [];
  for (const f of frames) inputs.push("-i", f);
  for (const seq of transSeqs) inputs.push("-framerate", String(FPS), "-i", seq.pattern);
  inputs.push("-i", seWav);
  const seIdx = frames.length + transSeqs.length;
  let bgmIdx = -1;
  if (hasBgm) {
    inputs.push("-stream_loop", "-1", "-i", BGM_PATH);
    bgmIdx = seIdx + 1;
  }

  /* 静止セグメント。切り替え側の絵と一致させるためズームはしない。
     スクロール構成の1枚目だけは、cropのy式で上から下へ流す。
     concatで繋ぐので、全枝で fps/timebase/SAR/pixfmt を揃えること */
  const fc = [];
  const NORM = `settb=AVTB,setsar=1,format=yuv420p`;
  for (let i = 0; i < frames.length; i++) {
    const d = Math.round(durations[i] * FPS);
    /* PNG入力の既定タイムスタンプは25fps。loopの直後にsetptsで30fpsに
       打ち直さないと尺が1.2倍に伸び、-tの合計計算とズレて末尾が切れる */
    if (!panels && i === 0) {
      fc.push(
        `[${i}:v]loop=loop=${d}:size=1:start=0,setpts=N/${FPS}/TB,scale=1080:-2,` +
          `crop=1080:1920:0:'min(ih-1920,(ih-1920)*t/${durations[i] - 1.2})',` +
          `fps=${FPS},${NORM}[s${i}]`
      );
    } else {
      fc.push(`[${i}:v]loop=loop=${d}:size=1:start=0,setpts=N/${FPS}/TB,fps=${FPS},${NORM}[s${i}]`);
    }
  }
  transSeqs.forEach((_, t) => {
    fc.push(`[${frames.length + t}:v]fps=${FPS},${NORM}[f${t}]`);
  });

  /* 静止→切り替え→静止…の順で連結 */
  const order = [];
  for (let i = 0; i < frames.length; i++) {
    order.push(`[s${i}]`);
    if (i < transSeqs.length) order.push(`[f${i}]`);
  }
  fc.push(`${order.join("")}concat=n=${order.length}:v=1:a=0[vout]`);

  /* 切り替え開始時刻（SEをここに置く） */
  const flipStarts = [];
  let acc = 0;
  for (let t = 0; t < transSeqs.length; t++) {
    acc += durations[t];
    flipStarts.push(acc);
    acc += transSeqs[t].n / FPS;
  }
  const total = durations.reduce((a, b) => a + b, 0) + transSeqs.reduce((a, s) => a + s.n / FPS, 0);

  /* めくりSEを各めくり位置に置き、あればBGMを小さく敷く */
  const audioMix = [];
  flipStarts.forEach((o, i) => {
    const ms = Math.round(o * 1000);
    fc.push(`[${seIdx}:a]adelay=${ms}|${ms}[se${i}]`);
    audioMix.push(`[se${i}]`);
  });
  if (hasBgm) {
    fc.push(
      `[${bgmIdx}:a]atrim=0:${total},volume=0.2,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2[bgm]`
    );
    audioMix.push("[bgm]");
  }
  if (audioMix.length === 0) {
    fc.push(`anullsrc=r=44100:cl=stereo,atrim=0:${total}[aout]`);
  } else {
    fc.push(`${audioMix.join("")}amix=inputs=${audioMix.length}:normalize=0[aout]`);
  }

  const outMp4 = path.join(OUT_DIR, `${slug}.mp4`);
  execFileSync(
    FFMPEG,
    [
      "-y",
      ...inputs,
      "-filter_complex", fc.join(";"),
      "-map", "[vout]",
      "-map", "[aout]",
      "-t", String(total),
      "-c:v", "libx264",
      "-crf", "20",
      "-preset", "medium",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "128k",
      outMp4,
    ],
    { stdio: KEEP ? "inherit" : "ignore" }
  );

  /* —— アップロード用の下書き —— */
  const txt = `【4コマ】${meta.title}

── タイトル案 ──
【4コマで学ぶAI】${meta.title}

── 説明文 ──
${meta.short}

解説の続き（マンガの元ページ）:
https://comixai.dev${meta.pagePath}

描いた人: 吉川聡史（週刊少年チャンピオンで連載経験のある漫画家・AIクリエイター）
https://comixai.dev

${meta.hashtags.join(" ")} #Shorts

── メモ ──
・同じmp4をYouTube Shorts / TikTok / Reels / Xに使い回せる
・尺 約${Math.round(total)}秒 / 1080×1920 / ${hasBgm ? "BGMあり" : "BGMなし（scripts/yonkoma-bgm.mp3 を置くと入る）"}
`;
  await writeFile(path.join(OUT_DIR, `${slug}.txt`), txt);

  if (!KEEP) await rm(work, { recursive: true, force: true });
  else console.log(`  中間ファイル: ${work}`);
  console.log(`完了: yonkoma-videos/${slug}.mp4（約${Math.round(total)}秒）`);
  console.log(`      yonkoma-videos/${slug}.txt にタイトル・説明文の下書き`);
}

await main();
