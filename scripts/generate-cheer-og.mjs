/* ============================================================
   「きょうの きみに」名言ページのOGP画像（1200×630）を一括生成。
   左に犬（名言idから決まる子のポスター画像）、右に名言テキスト。
   Playwright(Chromium)でスクリーンショットして
   public/cheer/og/{id}.jpg に書き出す。

   使い方:
     node scripts/generate-cheer-og.mjs
     （npm run og:cheer でも実行できる）

   quotes.ts に名言を追加したら再実行してコミットすること。
   ============================================================ */
import { mkdir, readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/cheer/og");

const { KOTOBA } = await import(pathToFileURL(path.join(ROOT, "src/app/cheer/quotes.ts")).href);

/* pets/ は拡張子なしimportを含みnodeから直接読めないため、ここに写しを持つ。
   ids の並びと dogFor のロジックは src/app/cheer/pets/index.ts と揃えること */
const DOG_POSTERS = {
  poodle: "/cheer/dogs/poodle.jpg",
  chihuahua: "/cheer/dogs/chihuahua.jpg",
  mameshiba: "/cheer/dogs/mameshiba.jpg",
  pomeranian: "/cheer/dogs/pomeranian.jpg",
  dachshund: "/cheer/dogs/dachshund.jpg",
  frenchbulldog: "/cheer/dogs/frenchbulldog.jpg",
};
const DOG_IDS = Object.keys(DOG_POSTERS);
function dogFor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return { poster: DOG_POSTERS[DOG_IDS[h % DOG_IDS.length]] };
}

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
/* Zen Maru Gothic には「ゞ」など一部の字が入っていないので、
   フォールバックを積む。最後の Noto Sans CJK JP はOSのフォント
   （このスクリプトの実行には fonts-noto-cjk が必要）。
   実機のブラウザではOSのフォントが肩代わりするため、画面側は問題ない */
const FONTS =
  (await fontCss("zen-maru-gothic", [500, 700])) +
  (await fontCss("zen-kaku-gothic-new", [500, 700]));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ポスター画像はdata URIで埋め込む（setContentのページからはfile://が読めない） */
const posterCache = new Map();
async function posterData(posterPath) {
  if (!posterCache.has(posterPath)) {
    const buf = await readFile(path.join(ROOT, "public", posterPath.slice(1)));
    posterCache.set(posterPath, `data:image/jpeg;base64,${buf.toString("base64")}`);
  }
  return posterCache.get(posterPath);
}

async function cardHtml(k) {
  const dog = dogFor(k.id);
  const imgUrl = await posterData(dog.poster);
  const lines = k.lines.map(esc).join("<br>");
  const credit = k.who === "ことわざ" ? "ことわざ" : `${esc(k.who)}のことば`;
  const size = Math.max(...k.lines.map((l) => [...l].length)) <= 11 ? 54 : 46;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;font-family:"Zen Maru Gothic","Zen Kaku Gothic New","Noto Sans CJK JP",sans-serif;color:#3B3350;background:#F2ECFF;display:flex}
.dog{width:460px;height:630px;flex:none;overflow:hidden}
.dog img{width:100%;height:100%;object-fit:cover;object-position:center 25%}
.right{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px 56px;gap:22px}
.lines{font-size:${size}px;font-weight:700;line-height:1.65}
.credit{font-size:26px;color:#8A80A6;font-weight:500}
.brand{position:absolute;right:56px;bottom:34px;font-size:24px;color:#8A80A6;font-weight:500}
</style></head><body>
<div class="dog"><img src="${imgUrl}"></div>
<div class="right"><div class="lines">${lines}</div><div class="credit">${credit}</div></div>
<div class="brand">きょうの きみに ─ comixai.dev</div>
</body></html>`;
}

/* —— Playwright起動（ローカル node_modules → グローバルの順で探す） —— */
let chromium;
try {
  ({ chromium } = await import(
    pathToFileURL(path.join(ROOT, "node_modules/playwright-core/index.mjs")).href
  ));
} catch {
  const npmRoot = execSync("npm root -g").toString().trim();
  ({ chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href));
}
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

await mkdir(OUT_DIR, { recursive: true });
for (const k of KOTOBA) {
  await page.setContent(await cardHtml(k), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT_DIR, `${k.id}.jpg`), type: "jpeg", quality: 82 });
  console.log(`  ✔ ${k.id}.jpg`);
}
await browser.close();
console.log(`done: ${KOTOBA.length} cards -> public/cheer/og/`);
