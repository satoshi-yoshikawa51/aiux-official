/* ============================================================
   スマホアプリ紹介ページ（/academy）のOGP画像 1200×630 を作る。

   使い方:
     node scripts/generate-academy-og.mjs
     （npm run og:academy でも実行できる）

   出力は public/og/academy-v2.png。**PNGのまま置く**——WebPを解釈しない
   SNSがあるため（→ scripts/optimize-images.mjs の注意2）。

   ▍絵を作り直したら、ファイル名も変える
   SNS（X・LINE・Slack等）はOGP画像を**URL単位でキャッシュする**。
   同じ名前のまま中身を差し替えても、数日は古い絵が出続ける。
   名前を変えれば、キャッシュに関係なく新しい絵が読まれる。
   古い名前（academy.png）にも同じ絵を書いておく——すでにシェア
   された投稿が、キャッシュ切れのあとに404にならないように。

   絵づくりは用語集のOGP（generate-og-images.mjs）と同じ作法で、
   サイトのフォントとデザイントークンをそのまま持ってきて
   Playwrightで撮る。ここだけ別なのは、右にアプリの実画面を
   端末の形で置くところ。アプリの宣伝なので、絵が要る。

   ▍見た目はトップページの帯と揃える（src/app/page.tsx の AcademyBanner）
   同じアプリの宣伝がSNSとサイトで別物に見えると、たどり着いた人が
   「これで合ってる？」と迷う。黒地・ロゴ・見出し・実画面2枚重ね、
   ぜんぶ帯と同じにしてある。**帯の文言を変えたらここも直す。**

   スクショを撮り直したら `npm run academy:shots` のあとに流す。
   ============================================================ */
import { copyFile, mkdir, readFile } from "node:fs/promises";
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
const gachaUrl = await dataUri("public/academy/shots/gacha.webp");
const logoUrl = await dataUri("public/academy/logo.webp");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; font-family: "Zen Kaku Gothic New", sans-serif; color: ${PAPER_50}; }
/* 外側が紙、中が黒いカード。トップページの帯と同じ組み方 */
.stage { width: 1200px; height: 630px; padding: 26px; background: ${PAPER_50}; }
.frame {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  background: ${INK};
  background-image: radial-gradient(rgba(255,255,255,0.07) 1.3px, transparent 1.4px);
  background-size: 14px 14px;
  border: 5px solid ${INK}; border-radius: 22px;
  padding: 44px 52px 40px;
  display: flex; flex-direction: column;
}
.row { flex: 1; display: flex; align-items: center; gap: 30px; min-height: 0; }
.mid { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.applogo { width: 340px; height: auto; display: block; filter: drop-shadow(0 8px 20px rgba(0,0,0,.6)); }
.title {
  margin-top: 26px; font-weight: 900; font-size: 54px; line-height: 1.28; letter-spacing: 0.01em;
  white-space: nowrap;
}
/* 黄色に白い文字は明度が近くて読めない。ベタ塗りの上は黒文字にする */
.mark { background: ${YELLOW}; color: ${INK}; padding: 0 10px; border-radius: 6px; }
.tags { margin-top: 24px; display: flex; gap: 10px; }
.tag {
  font-weight: 700; font-size: 21px; padding: 7px 17px; border-radius: 999px;
  border: 3px solid ${PAPER_50}; background: transparent; color: ${PAPER_50};
}
.tag.red { background: ${RED}; border-color: ${RED}; color: #fff; }
.tag.yellow { background: ${YELLOW}; border-color: ${YELLOW}; color: ${INK}; }
/* 実画面は2枚重ね。下を切って「奥から生えている」ように見せる */
.phones { position: relative; flex: none; width: 372px; height: 100%; }
.phones img { position: absolute; display: block; background: #fff; }
.front {
  right: 0; bottom: -46px; width: 232px;
  border: 5px solid ${PAPER_50}; border-radius: 28px 28px 0 0; border-bottom: none;
  box-shadow: 0 16px 40px rgba(0,0,0,.6); transform: rotate(2.5deg);
}
.back {
  right: 178px; bottom: -18px; width: 186px;
  border: 4px solid ${PAPER_50}; border-radius: 20px;
  box-shadow: 0 14px 34px rgba(0,0,0,.55); transform: rotate(-8deg); opacity: 0.82;
}
/* URLはロゴの右に並べる。右端に置くと、下まで伸ばした端末の絵に隠れる */
.bottom { display: flex; align-items: baseline; gap: 20px; }
.logo { font-weight: 900; font-size: 36px; letter-spacing: 0.02em; color: ${PAPER_50}; }
.logo .mix { color: ${RED}; }
.site { font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 22px; color: rgba(251,247,239,.66); }
</style></head><body>
<div class="stage"><div class="frame">
  <div class="row">
    <div class="mid">
      <img class="applogo" src="${logoUrl}">
      <div class="title">AIを遊んで<span class="mark">学べる</span>アプリ</div>
      <div class="tags">
        <span class="tag red">登録不要</span>
        <span class="tag yellow">完全無料</span>
        <span class="tag">広告なし</span>
        <span class="tag">1日5分</span>
      </div>
    </div>
    <div class="phones">
      <img class="back" src="${gachaUrl}">
      <img class="front" src="${shotUrl}">
    </div>
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
/* 新しい名前（metadataが指す先）と、古い名前（既存のシェア向け）の両方へ */
await page.screenshot({ path: path.join(OUT_DIR, "academy-v2.png") });
await copyFile(path.join(OUT_DIR, "academy-v2.png"), path.join(OUT_DIR, "academy.png"));
await browser.close();

console.log("✔ public/og/academy-v2.png（+ 旧名 academy.png にも同じ絵）");
