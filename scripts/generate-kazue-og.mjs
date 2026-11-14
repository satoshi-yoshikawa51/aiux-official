/* ============================================================
   「号外!! 新選組カズエ RE:BOOT」（/kazue）のOGP画像（1200×630）を生成する。
   ティザーのヒーローと同じ素材（町並み・五人・ロゴ）を重ねて1枚にする。
   色（--ink-900 / --paper-0）は globals.css から読む。
   Playwright(Chromium)でスクリーンショットして public/og/kazue.png に書き出す。

   使い方:
     node scripts/generate-kazue-og.mjs
     （npm run og:kazue でも実行できる）

   ▍素材を差し替えたとき
   public/kazue/ の bg.webp / cast.webp / logo.webp を替えたら、これを
   回し直せばOGPも揃う。SNSは古い画像をキャッシュするので、反映には
   各サービスのカード検証ツールでの再取得が要る。
   ============================================================ */
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/og/kazue.png");

const css = await readFile(path.join(ROOT, "src/app/globals.css"), "utf8");
const tok = (name) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))[1].trim();
const INK = tok("ink-900");
const PAPER = tok("paper-0");

/* 画像は data URI で埋める（setContent のページからは file:// を読めないため） */
const img = async (name) => `data:image/webp;base64,${(await readFile(path.join(ROOT, "public/kazue", name))).toString("base64")}`;
const [BG, CAST, LOGO] = await Promise.all([img("bg.webp"), img("cast.webp"), img("logo.webp")]);

async function fontCss(pkg, weights) {
  let out = "";
  for (const w of weights) {
    const cssPath = path.join(ROOT, "node_modules/@fontsource", pkg, `${w}.css`);
    const dirUrl = pathToFileURL(path.join(ROOT, "node_modules/@fontsource", pkg)).href;
    out += (await readFile(cssPath, "utf8")).replaceAll("url(./", `url(${dirUrl}/`);
  }
  return out;
}
const FONTS = (await fontCss("zen-kaku-gothic-new", [900])) + (await fontCss("jetbrains-mono", [700]));

/* 灰。乱数は種を固定して、毎回同じ絵にする */
let seed = 51;
const rnd = () => {
  seed = (seed * 48271) % 2147483647;
  return seed / 2147483647;
};
const ASH = Array.from({ length: 46 }, () => {
  const s = 4 + rnd() * 9;
  return `<i style="left:${(rnd() * 1200).toFixed(0)}px;top:${(rnd() * 630).toFixed(0)}px;width:${s.toFixed(1)}px;height:${(s / 2).toFixed(1)}px;opacity:${(0.35 + rnd() * 0.55).toFixed(2)};transform:rotate(${(rnd() * 180).toFixed(0)}deg);background:${rnd() < 0.3 ? INK : PAPER}"></i>`;
}).join("");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:${INK}}
body{position:relative;color:${PAPER};font-family:"Zen Kaku Gothic New",sans-serif}
/* 町並み：黒い太陽が五人の頭上に来る位置で切る */
.bg{position:absolute;left:-40px;top:-70px;width:1280px;height:auto}
/* 五人：右に大きく。左端は霞ませてロゴの裏へ消す */
.cast{position:absolute;right:-70px;top:-168px;height:1040px;width:auto;
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 20%);mask-image:linear-gradient(to right,transparent 0,#000 20%)}
.shade{position:absolute;inset:0;background:
  linear-gradient(to right,${INK}f2 0%,${INK}b3 30%,${INK}00 58%),
  linear-gradient(to top,${INK}d9 0%,${INK}00 34%),
  radial-gradient(ellipse at 62% 40%,${INK}00 40%,${INK}99 100%)}
.ash i{position:absolute}
.brand{position:absolute;left:52px;top:40px;font-family:"JetBrains Mono",monospace;font-weight:700;font-size:20px;letter-spacing:.2em}
.kicker{position:absolute;left:44px;top:118px;z-index:2;padding:6px 22px 8px;background:${PAPER};color:${INK};border:4px solid ${INK};
  font-weight:900;font-size:26px;letter-spacing:.34em;text-indent:.34em;transform:rotate(-8deg)}
.logo{position:absolute;left:52px;top:150px;width:560px;height:auto;filter:drop-shadow(0 12px 26px ${INK}cc)}
.soon{position:absolute;left:52px;top:522px;width:560px;text-align:center;font-weight:900;font-size:38px;letter-spacing:.34em;text-indent:.34em;
  text-shadow:0 3px 14px ${INK}}
</style></head><body>
<img class="bg" src="${BG}">
<img class="cast" src="${CAST}">
<div class="shade"></div>
<div class="ash">${ASH}</div>
<div class="brand">COMIXAI</div>
<div class="kicker">新連載</div>
<img class="logo" src="${LOGO}">
<div class="soon">近日連載開始</div>
</body></html>`;

const npmRoot = execSync("npm root -g").toString().trim();
const { chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href);
/* 環境変数 → いつもの場所 → Playwright任せ、の順で探す */
const fixed = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || (existsSync(fixed) ? fixed : undefined);
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await mkdir(path.dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT, type: "png" });
await browser.close();
console.log("✔ public/og/kazue.png");
