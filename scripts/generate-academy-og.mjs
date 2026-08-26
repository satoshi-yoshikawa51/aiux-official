/* ============================================================
   スマホアプリ紹介ページ（/academy）のOGP画像 1200×630 を作る。

   使い方:
     node scripts/generate-academy-og.mjs
     （npm run og:academy でも実行できる）

   出力は public/og/academy.png。**PNGのまま置く**——WebPを解釈しない
   SNSがあるため（→ scripts/optimize-images.mjs の注意2）。

   絵づくりは用語集のOGP（generate-og-images.mjs）と同じ作法で、
   サイトのフォントとデザイントークンをそのまま持ってきて
   Playwrightで撮る。ここだけ別なのは、右にアプリの実画面を
   端末の形で置くところ。アプリの宣伝なので、絵が要る。

   スクショを撮り直したら `npm run academy:shots` のあとに流す。
   ============================================================ */
import { mkdir, readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/og");

/* —— サイトのデザイントークン（globals.cssと揃えること） —— */
const INK = "#14110f";
const INK_500 = "#6e635b";
const PAPER_50 = "#fbf7ef";
const YELLOW = "#ffd23f";
const RED = "#e60012";

/* fontsourceのCSSを読み、フォントURLを絶対file://に書き換えてインライン化 */
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

/* 画像は data URI で埋める。setContent したページの出どころは about:blank
   なので、file:// のサブリソースは読み込みを拒まれる（実際に空枠で撮れた） */
const dataUri = async (rel) =>
  `data:image/webp;base64,${(await readFile(path.join(ROOT, rel))).toString("base64")}`;
const shotUrl = await dataUri("public/academy/shots/home.webp");
const iconUrl = await dataUri("public/academy/icon.webp");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; font-family: "Zen Kaku Gothic New", sans-serif; color: ${INK}; }
.stage { width: 1200px; height: 630px; padding: 26px; background: ${INK}; }
.frame {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  background: ${PAPER_50};
  background-image: radial-gradient(rgba(20,17,15,0.10) 1.6px, transparent 1.7px);
  background-size: 13px 13px;
  border: 5px solid ${INK}; border-radius: 22px;
  padding: 40px 52px 36px;
  display: flex; flex-direction: column;
}
.burst {
  position: absolute; top: -46px; right: -46px; width: 150px; height: 150px;
  background: ${YELLOW}; border: 5px solid ${INK}; border-radius: 26px;
  transform: rotate(24deg);
}
.top { display: flex; align-items: center; gap: 18px; }
.icon { width: 68px; height: 68px; border-radius: 16px; border: 4px solid ${INK}; box-shadow: 5px 5px 0 rgba(20,17,15,0.85); }
.kicker { font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 22px; letter-spacing: 0.14em; color: ${RED}; }
.appname { font-weight: 900; font-size: 27px; margin-top: 4px; }
.row { flex: 1; display: flex; align-items: center; gap: 40px; min-height: 0; }
.mid { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.title {
  font-weight: 900; font-size: 66px; line-height: 1.2; letter-spacing: 0.01em;
  display: inline; align-self: flex-start;
  background: linear-gradient(transparent 68%, ${YELLOW} 68%);
}
.tags { margin-top: 26px; display: flex; gap: 10px; }
.tag {
  font-weight: 700; font-size: 22px; padding: 8px 18px; border-radius: 999px;
  border: 3px solid ${INK}; background: #fff;
}
.tag.red { background: ${RED}; color: #fff; }
.tag.yellow { background: ${YELLOW}; }
/* 実画面。下を切って「奥から生えている」ように見せる */
.phone {
  flex: none; width: 244px; height: 470px; overflow: hidden;
  border: 5px solid ${INK}; border-radius: 30px 30px 0 0; border-bottom: none;
  box-shadow: 9px 9px 0 rgba(20,17,15,0.85); transform: rotate(2.5deg);
  margin-bottom: -46px; background: #fff;
}
.phone img { width: 100%; display: block; }
/* URLはロゴの右に並べる。右端に置くと、下まで伸ばした端末の絵に隠れる */
.bottom { display: flex; align-items: baseline; gap: 20px; }
.logo { font-weight: 900; font-size: 38px; letter-spacing: 0.02em; }
.logo .mix { color: ${RED}; }
.site { font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 23px; color: ${INK_500}; }
</style></head><body>
<div class="stage"><div class="frame">
  <div class="burst"></div>
  <div class="top">
    <img class="icon" src="${iconUrl}">
    <div>
      <div class="kicker">COMIXAI ACADEMY — iPhone / iPad</div>
      <div class="appname">COMIXAI アカデミー</div>
    </div>
  </div>
  <div class="row">
    <div class="mid">
      <div><span class="title">3Dの相棒と、<br>遊んで学ぶ生成AI。</span></div>
      <div class="tags">
        <span class="tag red">登録不要</span>
        <span class="tag yellow">完全無料</span>
        <span class="tag">広告なし</span>
        <span class="tag">1日5分</span>
      </div>
    </div>
    <div class="phone"><img src="${shotUrl}"></div>
  </div>
  <div class="bottom">
    <div class="logo">CO<span class="mix">MIX</span>AI</div>
    <div class="site">comixai.dev/academy</div>
  </div>
</div></div>
</body></html>`;

/* —— Playwright起動（グローバルインストールを利用） —— */
const npmRoot = execSync("npm root -g").toString().trim();
const { chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href);
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

await mkdir(OUT_DIR, { recursive: true });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(OUT_DIR, "academy.png") });
await browser.close();

console.log("✔ public/og/academy.png");
