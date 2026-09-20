/* ============================================================
   トップのカルーセル用 横長バナー（1200×480）を生成するスクリプト。
   OGP生成（generate-og-images.mjs）と同じ方式：HTML/CSSで組んで
   Playwright/Chromiumで撮り、public/top-banners/ にwebpで書き出す。

   使い方:
     node scripts/generate-top-banners.mjs
     （npm run banners:top でも実行できる）

   ▍画像を差し替えたいとき
   デザインツール（Midjourney等）で作った絵に替える場合は、
   public/top-banners/<name>.webp を同じ名前で置き換えるだけでよい。
   このスクリプトはあくまで「コードから作る版」の再生成用。

   ▍1枚＝1リンクの前提
   バナー全体が1つの<a>になる（→ top-banners.tsx）。そのため
   画像の中に押せそうなボタン風の要素を2つ以上描かないこと。
   ============================================================ */
import { execSync } from "node:child_process";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/top-banners");
await mkdir(OUT_DIR, { recursive: true });

/* —— サイトのデザイントークン（globals.cssと揃えること） —— */
const INK = "#14110f";
const PAPER_0 = "#ffffff";
const PAPER_50 = "#fbf7ef";
const PAPER_200 = "#e9dfc9";
const YELLOW = "#ffd23f";
const RED = "#e60012";
const RED_600 = "#c70010";

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
  (await fontCss("zen-kaku-gothic-new", [500, 700, 900])) +
  (await fontCss("jetbrains-mono", [700]));

/* 画像はdata URIで埋め込む（setContentのページはfile://参照が効かないため。OG生成と同じ流儀） */
const asset = async (rel) =>
  `data:image/webp;base64,${(await readFile(path.join(ROOT, "public", rel))).toString("base64")}`;

const BASE_CSS = `
${FONTS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1200px; height: 480px; overflow: hidden; font-family: "Zen Kaku Gothic New", sans-serif; color: ${INK}; }
.stage { position: relative; width: 1200px; height: 480px; display: flex; overflow: hidden; }
.kicker { font-family: "JetBrains Mono", monospace; font-weight: 700; letter-spacing: 0.14em; font-size: 22px; }
.cta {
  display: inline-flex; align-items: center; gap: 12px;
  font-weight: 900; font-size: 27px;
  border: 3px solid ${INK}; border-radius: 999px; padding: 14px 34px;
  box-shadow: 5px 5px 0 ${INK};
  align-self: flex-start;
}
`;

/* ── バナー1：スマホアプリ（黒地・ドット模様、→ /academy） ── */
const academyHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.stage {
  background: ${INK};
  background-image: radial-gradient(rgba(255,255,255,0.07) 2.6px, transparent 2.8px);
  background-size: 28px 28px;
}
</style></head><body><div class="stage">
  <div style="flex: 1 1 0; padding: 46px 0 46px 62px; display: flex; flex-direction: column; justify-content: center; gap: 26px;">
    <img src="${await asset("academy/logo.webp")}" style="width: 330px; height: auto; filter: drop-shadow(0 8px 20px rgba(0,0,0,.55));">
    <div style="font-weight: 900; font-size: 47px; line-height: 1.35; color: ${PAPER_50};">
      AIを遊んで学べる、<br>無料アプリ。
    </div>
    <div style="font-size: 23px; font-weight: 700; color: ${PAPER_200};">
      登録不要・広告なし <span style="color:${YELLOW};">｜</span> 1日5分から
    </div>
    <div class="cta" style="background: ${YELLOW}; color: ${INK}; box-shadow: 5px 5px 0 rgba(255,255,255,.28);">
      アプリを見る <span style="font-size: 30px;">→</span>
    </div>
  </div>
  <div style="flex: 0 0 400px; position: relative;">
    <img src="${await asset("academy/shots/home.webp")}" style="
      position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%) rotate(2deg);
      width: 252px; border-radius: 22px 22px 0 0; border: 3px solid ${PAPER_50}; border-bottom: none;
      box-shadow: 0 16px 40px rgba(0,0,0,.55);">
  </div>
</div></body></html>`;

/* ── バナー2：Claude教習所（紙地、→ /claude-app） ── */
const kyoshujoHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
.stage { background: ${PAPER_50}; }
</style></head><body><div class="stage">
  <div style="flex: 1 1 0; padding: 46px 0 46px 62px; display: flex; flex-direction: column; justify-content: center; gap: 24px;">
    <div class="kicker" style="color: ${RED_600};">CLAUDE KYOSHUJO</div>
    <div style="font-weight: 900; font-size: 51px; line-height: 1.35;">
      5分で覚える！<br>Claude教習所
    </div>
    <div style="font-size: 23px; font-weight: 700; color: #463e38;">
      練習画面を講師が案内 ｜ 登録不要・無料
    </div>
    <div class="cta" style="background: ${RED}; color: ${PAPER_0};">
      無料ではじめる <span style="font-size: 30px;">→</span>
    </div>
  </div>
  <div style="flex: 0 0 520px; position: relative; border-left: 3px solid ${INK};">
    <img src="${await asset("claude-app/banner.webp")}" style="width: 100%; height: 100%; object-fit: cover; object-position: center;">
  </div>
</div></body></html>`;

/* —— Playwright起動（グローバルインストールを利用） —— */
const npmRoot = execSync("npm root -g").toString().trim();
const { chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href);
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath, args: ["--allow-file-access-from-files"] });
/* 2倍で撮る：スマホでは画像が約3分の1に縮むので、等倍だと文字が甘くなる */
const page = await browser.newPage({ viewport: { width: 1200, height: 480 }, deviceScaleFactor: 2 });

const sharp = (await import(pathToFileURL(path.join(ROOT, "node_modules/sharp/lib/index.js")).href)).default;

for (const [name, html] of [
  ["academy", academyHtml],
  ["kyoshujo", kyoshujoHtml],
]) {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  await sharp(png).webp({ quality: 88 }).toFile(path.join(OUT_DIR, `${name}.webp`));
  console.log(`  ✔ ${name}.webp`);
}

await browser.close();
console.log(`完了: トップバナー2枚を ${path.relative(ROOT, OUT_DIR)}/ に生成しました`);
