/* ============================================================
   入稿済みの4コマを、ショート動画（1080×1920・約16秒）にする。

     npm run yonkoma:video -- <slug>

   仕組み:
     public/yonkoma/<glossary|prompts>/<slug>.png を読み、
     コマの黒枠を画像から自動検出 → コマごとに切り出し →
     サイトと同じ書体・トークンでフレーム画像を組み →
     ffmpegでズーム＋スライド＋めくりSEのmp4に書き出す。
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
const END_SEC = 2.8;
/* ページめくりはCSS 3Dをコマ送りで撮る（ffmpegの既製トランジションに
   めくりが無いため）。14コマ×30fps ≒ 0.47秒 */
const FLIP_FRAMES = 14;
const FLIP_SEC = FLIP_FRAMES / FPS;

/* —— デザイントークン（globals.cssと揃える） —— */
const INK = "#14110f";
const INK_500 = "#6e635b";
const PAPER_0 = "#ffffff";
const PAPER_50 = "#fbf7ef";
const YELLOW = "#ffd23f";
const RED = "#e60012";

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
  (await fontCss("zen-kaku-gothic-new", [500, 700, 900])) + (await fontCss("jetbrains-mono", [700]));

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

const FRAME_BASE = `
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1080px; height:1920px; font-family:"Zen Kaku Gothic New", sans-serif; color:${PAPER_50};
  background:${INK};
  background-image:radial-gradient(rgba(251,247,239,0.05) 1.6px, transparent 1.7px);
  background-size:15px 15px; overflow:hidden; }
.stage { width:1080px; height:1920px; display:flex; flex-direction:column; align-items:center; padding:120px 56px 150px; }
.kicker { font-family:"JetBrains Mono", monospace; font-size:26px; letter-spacing:.18em; font-weight:700; color:${YELLOW}; }
.title { font-size:52px; font-weight:900; line-height:1.35; text-align:center; margin-top:18px; max-width:940px; }
.foot { margin-top:auto; display:flex; flex-direction:column; align-items:center; gap:20px; }
.dots { display:flex; gap:14px; }
.dot { width:18px; height:18px; border-radius:50%; border:3px solid ${PAPER_50}; opacity:.45; }
.dot.on { background:${YELLOW}; border-color:${YELLOW}; opacity:1; }
.site { font-family:"JetBrains Mono", monospace; font-size:24px; font-weight:700; color:${INK_500}; }
`;

function panelFrameHtml(panelUrl, index, total) {
  const dots = Array.from({ length: total }, (_, i) => `<span class="dot ${i === index ? "on" : ""}"></span>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}${FRAME_BASE}
.panel-wrap { margin-top:56px; flex:1; display:flex; align-items:center; justify-content:center; min-height:0; width:100%; }
.panel-wrap img { max-width:968px; max-height:1180px; width:auto; height:auto;
  background:${PAPER_0}; border-radius:14px; box-shadow:12px 12px 0 rgba(0,0,0,.55); }
</style></head><body><div class="stage">
  <div class="kicker">4コマで学ぶAI</div>
  <div class="title">${esc(meta.title)}</div>
  <div class="panel-wrap"><img src="${panelUrl}"></div>
  <div class="foot"><div class="dots">${dots}</div><div class="site">comixai.dev</div></div>
</div></body></html>`;
}

function endFrameHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}${FRAME_BASE}
.end { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:34px; }
.logo { font-size:88px; font-weight:900; letter-spacing:.01em; color:${PAPER_50}; }
.logo .mix { color:${RED}; }
.tsuzuki { font-size:44px; font-weight:900; }
.url { font-family:"JetBrains Mono", monospace; font-size:38px; font-weight:700; color:${INK};
  background:${YELLOW}; padding:18px 34px; border-radius:12px; }
.sub { font-size:28px; font-weight:700; color:${INK_500}; }
</style></head><body><div class="stage">
  <div class="kicker">4コマで学ぶAI</div>
  <div class="end">
    <div class="logo">CO<span class="mix">MIX</span>AI</div>
    <div class="tsuzuki">解説の続きは</div>
    <div class="url">comixai.dev${esc(meta.pagePath)}</div>
    <div class="sub">漫画家が描くAI解説・毎回描き下ろし</div>
  </div>
  <div class="foot"><div class="site">comixai.dev</div></div>
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
.strip { margin-top:52px; width:${drawW}px; border-radius:14px; background:${PAPER_0};
  box-shadow:12px 12px 0 rgba(0,0,0,.55); }
</style></head><body><div class="stage">
  <div class="kicker">4コマで学ぶAI</div>
  <div class="title">${esc(meta.title)}</div>
  <img class="strip" src="${stripUrl}">
</div></body></html>`,
  };
}

/* ═══════════════ 2.5 ページめくりのコマ送り ═══════════════ */

/** 前のページが上辺を軸にめくれ上がり、下のページが現れる。
    fromScale: 前セグメントのズーム終端(1.05)と絵柄を合わせるための倍率 */
async function renderFlipFrames(page, fromUrl, toUrl, fromScale, work, index) {
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>
* { margin:0; padding:0; }
body { width:1080px; height:1920px; overflow:hidden; background:${INK}; }
.scene { position:relative; width:1080px; height:1920px; perspective:2600px; }
.under, .flip { position:absolute; inset:0; }
.under img, .flip img { width:1080px; height:1920px; display:block; }
.under-shade { position:absolute; inset:0; background:#000; }
.flip { transform-origin:50% 0%; backface-visibility:hidden; will-change:transform; }
.flip-inner { width:1080px; height:1920px; transform:scale(${fromScale}); transform-origin:50% 50%; }
.flip-shade { position:absolute; inset:0; background:#000; }
</style></head><body>
<div class="scene">
  <div class="under"><img src="${toUrl}"><div class="under-shade" id="us"></div></div>
  <div class="flip" id="pg"><div class="flip-inner"><img src="${fromUrl}"></div><div class="flip-shade" id="fs"></div></div>
</div>
<script>
  window.setProgress = (p) => {
    const e = 0.5 - 0.5 * Math.cos(Math.PI * p);       /* ease-in-out */
    const deg = 115 * e;                               /* 90°で裏返り、姿を消す */
    document.getElementById("pg").style.transform = "rotateX(" + deg + "deg)";
    const lift = Math.sin(Math.min(deg, 90) * Math.PI / 180);
    document.getElementById("fs").style.opacity = 0.38 * lift;   /* めくれた紙の陰 */
    document.getElementById("us").style.opacity = 0.45 * (1 - e); /* 下のページに落ちる影 */
  };
</script></body></html>`,
    { waitUntil: "networkidle" }
  );
  const files = [];
  for (let k = 0; k < FLIP_FRAMES; k++) {
    await page.evaluate((p) => window.setProgress(p), k / (FLIP_FRAMES - 1));
    const f = path.join(work, `flip${index}-${String(k).padStart(2, "0")}.png`);
    await page.screenshot({ path: f });
    files.push(f);
  }
  return path.join(work, `flip${index}-%02d.png`);
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

  /* エンドカード */
  await page.setContent(endFrameHtml(), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const endFrame = path.join(work, "frame-end.png");
  await page.screenshot({ path: endFrame });
  frames.push(endFrame);
  durations.push(END_SEC);

  /* めくりのコマ送りを撮る（前ページの見た目の終端 → 次ページ） */
  const flipSeqs = [];
  for (let i = 0; i < frames.length - 1; i++) {
    let fromUrl;
    let fromScale = 1.05; /* zoompanの終端倍率と合わせて、切り替わりの絵飛びを防ぐ */
    if (!panels && i === 0) {
      /* スクロール構成: 最後に見えている下端1920pxを「めくられる前のページ」にする */
      fromUrl = await page.evaluate(async (url) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = 1080;
        cv.height = 1920;
        cv.getContext("2d").drawImage(img, 0, img.naturalHeight - 1920, 1080, 1920, 0, 0, 1080, 1920);
        return cv.toDataURL("image/png");
      }, await toDataUrl(frames[i]));
      fromScale = 1.0;
    } else {
      fromUrl = await toDataUrl(frames[i]);
    }
    flipSeqs.push(await renderFlipFrames(page, fromUrl, await toDataUrl(frames[i + 1]), fromScale, work, i));
  }
  await browser.close();

  /* —— ffmpeg —— */
  const seWav = makeFlipSe(work);
  const hasBgm = await exists(BGM_PATH);

  const inputs = [];
  for (const f of frames) inputs.push("-i", f);
  for (const seq of flipSeqs) inputs.push("-framerate", String(FPS), "-i", seq);
  inputs.push("-i", seWav);
  const seIdx = frames.length + flipSeqs.length;
  let bgmIdx = -1;
  if (hasBgm) {
    inputs.push("-stream_loop", "-1", "-i", BGM_PATH);
    bgmIdx = seIdx + 1;
  }

  /* 静止セグメント: 2倍に拡大してからzoompan（ガタつき防止の定石）。
     スクロール構成の1枚目だけは、cropのy式で上から下へ流す。
     concatで繋ぐので、全枝で fps/timebase/SAR/pixfmt を揃えること */
  const fc = [];
  const NORM = `settb=AVTB,setsar=1,format=yuv420p`;
  for (let i = 0; i < frames.length; i++) {
    const d = Math.round(durations[i] * FPS);
    if (!panels && i === 0) {
      fc.push(
        `[${i}:v]loop=loop=${d}:size=1:start=0,scale=1080:-2,` +
          `crop=1080:1920:0:'min(ih-1920,(ih-1920)*t/${durations[i] - 1.2})',` +
          `fps=${FPS},${NORM}[s${i}]`
      );
    } else {
      fc.push(
        `[${i}:v]scale=2160:3840,zoompan=z='1+0.05*on/${d}':` +
          `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d}:fps=${FPS}:s=1080x1920,${NORM}[s${i}]`
      );
    }
  }
  flipSeqs.forEach((_, t) => {
    fc.push(`[${frames.length + t}:v]fps=${FPS},${NORM}[f${t}]`);
  });

  /* 静止→めくり→静止…の順で連結 */
  const order = [];
  for (let i = 0; i < frames.length; i++) {
    order.push(`[s${i}]`);
    if (i < flipSeqs.length) order.push(`[f${i}]`);
  }
  fc.push(`${order.join("")}concat=n=${order.length}:v=1:a=0[vout]`);

  /* めくり開始時刻（SEをここに置く） */
  const flipStarts = [];
  let acc = 0;
  for (let t = 0; t < flipSeqs.length; t++) {
    acc += durations[t];
    flipStarts.push(acc + t * FLIP_SEC);
  }
  const total = durations.reduce((a, b) => a + b, 0) + flipSeqs.length * FLIP_SEC;

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
