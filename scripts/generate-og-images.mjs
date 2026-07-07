/* ============================================================
   用語集のSNSシェア画像（OGP, 1200×630）を一括生成するスクリプト。
   サイトと同じフォント・デザイントークンでHTMLを組み、
   Playwright(Chromium)でスクリーンショットして
   public/og/glossary/{slug}.png と index.png に書き出す。

   使い方:
     node --experimental-strip-types scripts/generate-og-images.mjs
     （npm run og:glossary でも実行できる）

   用語を追加・変更したら再実行してコミットすること。
   ============================================================ */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/og/glossary");
const QUIZ_OUT_DIR = path.join(ROOT, "public/og/quiz");

const { TERMS } = await import(pathToFileURL(path.join(ROOT, "src/app/glossary/data.ts")).href);
const { GRADES, QUIZ_SIZE } = await import(pathToFileURL(path.join(ROOT, "src/app/quiz/data.ts")).href);
const { USO_GRADES, USO_ROUNDS } = await import(pathToFileURL(path.join(ROOT, "src/app/uso/data.ts")).href);

/* —— サイトのデザイントークン（globals.cssと揃えること） —— */
const INK = "#14110f";
const INK_500 = "#6e635b";
const PAPER_0 = "#ffffff";
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
  (await fontCss("zen-kaku-gothic-new", [500, 700, 900])) +
  (await fontCss("jetbrains-mono", [700]));

/* 用語名の長さに応じて文字サイズを変える */
function termSize(term) {
  const n = [...term].length;
  if (n <= 5) return 128;
  if (n <= 7) return 108;
  if (n <= 9) return 92;
  if (n <= 12) return 76;
  return 62;
}

function pageHtml({ kicker, badge, title, titleSize, sub, short, site = "comixai.dev/glossary", img }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; font-family: "Zen Kaku Gothic New", sans-serif; color: ${INK}; }
.stage {
  width: 1200px; height: 630px; padding: 26px;
  background: ${INK};
}
.frame {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  background: ${PAPER_50};
  background-image: radial-gradient(rgba(20,17,15,0.10) 1.6px, transparent 1.7px);
  background-size: 13px 13px;
  border: 5px solid ${INK}; border-radius: 22px;
  padding: 44px 56px 40px;
  display: flex; flex-direction: column;
}
.top { display: flex; align-items: center; justify-content: space-between; }
.kicker {
  font-family: "JetBrains Mono", monospace; font-weight: 700;
  font-size: 25px; letter-spacing: 0.14em; color: ${RED};
}
.badge {
  font-weight: 700; font-size: 24px; color: ${PAPER_50};
  background: ${INK}; border-radius: 999px; padding: 8px 26px;
  margin-right: 116px; /* 右上のバーストと重ならないように */
}
.row { flex: 1; display: flex; align-items: center; gap: 36px; min-height: 0; }
.mid { flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.char {
  flex: none; width: 300px; height: 300px; border-radius: 50%;
  border: 5px solid ${INK}; background: #fff; overflow: hidden;
  transform: rotate(2deg); box-shadow: 7px 7px 0 rgba(20,17,15,0.85);
}
.char img { width: 100%; height: 100%; object-fit: cover; }
.title {
  font-weight: 900; line-height: 1.14; letter-spacing: 0.01em;
  display: inline; align-self: flex-start;
  background: linear-gradient(transparent 68%, ${YELLOW} 68%);
}
.sub {
  margin-top: 18px; font-family: "JetBrains Mono", monospace; font-weight: 700;
  font-size: 27px; color: ${INK_500}; letter-spacing: 0.04em;
}
.short {
  margin-top: 22px; font-weight: 500; font-size: 30px; line-height: 1.62; color: ${INK};
  max-width: 1000px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.bottom { display: flex; align-items: flex-end; justify-content: space-between; }
.logo { font-weight: 900; font-size: 40px; letter-spacing: 0.02em; }
.logo .mix { color: ${RED}; }
.site {
  font-family: "JetBrains Mono", monospace; font-weight: 700;
  font-size: 24px; color: ${INK_500};
}
.burst {
  position: absolute; top: -46px; right: -46px; width: 150px; height: 150px;
  background: ${YELLOW}; border: 5px solid ${INK}; border-radius: 26px;
  transform: rotate(24deg);
}
</style></head><body>
<div class="stage"><div class="frame">
  <div class="burst"></div>
  <div class="top">
    <div class="kicker">${kicker}</div>
    ${badge ? `<div class="badge">${badge}</div>` : ""}
  </div>
  <div class="row">
    <div class="mid">
      <div><span class="title" style="font-size:${titleSize}px">${title}</span></div>
      ${sub ? `<div class="sub">${sub}</div>` : ""}
      ${short ? `<div class="short">${short}</div>` : ""}
    </div>
    ${img ? `<div class="char"><img src="${img}"></div>` : ""}
  </div>
  <div class="bottom">
    <div class="logo">CO<span class="mix">MIX</span>AI</div>
    <div class="site">${site}</div>
  </div>
</div></div>
</body></html>`;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* —— Playwright起動（グローバルインストールを利用） —— */
const npmRoot = execSync("npm root -g").toString().trim();
const { chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href);
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({
  executablePath,
  args: ["--allow-file-access-from-files"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

await mkdir(OUT_DIR, { recursive: true });

async function shoot(html, file, dir = OUT_DIR) {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(dir, file) });
  console.log(`  ✔ ${file}`);
}

for (const t of TERMS) {
  const sub = [t.yomi, t.en].filter(Boolean).join("  /  ");
  await shoot(
    pageHtml({
      kicker: "GLOSSARY — 今さら聞けないAI用語集",
      badge: t.category,
      title: esc(t.term),
      titleSize: termSize(t.term),
      sub: esc(sub),
      short: esc(t.short),
    }),
    `${t.slug}.png`
  );
}

/* 一覧ページ用 */
await shoot(
  pageHtml({
    kicker: "GLOSSARY — 今さら聞けないAI用語集",
    badge: `全${TERMS.length}語`,
    title: "AIの「わからない」を、<br>なくす。",
    titleSize: 88,
    sub: "生成AI・LLM・RAG・AIエージェント…",
    short: "ニュースで毎日見かけるのに、いまさら聞きづらいAI用語を、漫画家・AIクリエイターが現場目線でわかりやすく解説。",
  }),
  "index.png"
);

/* —— AI用語力診断（/quiz）用 —— */
await mkdir(QUIZ_OUT_DIR, { recursive: true });

await shoot(
  pageHtml({
    kicker: "QUIZ — AI用語力診断",
    badge: `全${QUIZ_SIZE}問・3分`,
    title: "あなたのAI用語力は、<br>何級？",
    titleSize: 92,
    sub: "🐣 ヒヨコ級 〜 👑 賢者級",
    short: "生成AI・LLM・RAG・トークン…今さら聞けないAI用語、どこまでわかる？1問ごとに解説つき。",
    site: "comixai.dev/quiz",
  }),
  "quiz.png",
  QUIZ_OUT_DIR
);

for (const g of GRADES) {
  await shoot(
    pageHtml({
      kicker: "QUIZ — AI用語力診断",
      badge: "判定結果",
      title: g.title,
      titleSize: 88,
      sub: `AI用語力診断（全${QUIZ_SIZE}問）の判定`,
      short: `${g.comment.split("。")[0]}。あなたのAI用語力は何級？ → comixai.dev/quiz`,
      site: "comixai.dev/quiz",
      img: `data:image/webp;base64,${(await readFile(path.join(ROOT, "public", g.image))).toString("base64")}`,
    }),
    `${g.slug}.png`,
    QUIZ_OUT_DIR
  );
}

/* —— AIのウソを見抜け（/uso）用 —— */
const USO_OUT_DIR = path.join(ROOT, "public/og/uso");
await mkdir(USO_OUT_DIR, { recursive: true });

await shoot(
  pageHtml({
    kicker: "GAME — ハルシネーション体験",
    badge: `全${USO_ROUNDS}問`,
    title: "AIのウソを、<br>見抜け。",
    titleSize: 96,
    sub: "2つの回答、片方にウソが混ざってる",
    short: "架空の判例、捏造された出典、古い制度の知識——実際のAIがやらかす「ウソの型」だけを集めました。",
    site: "comixai.dev/uso",
  }),
  "uso.png",
  USO_OUT_DIR
);

for (const g of USO_GRADES) {
  await shoot(
    pageHtml({
      kicker: "GAME — AIのウソを見抜け",
      badge: "判定結果",
      title: `${g.emoji} ${g.title}`,
      titleSize: 88,
      sub: `全${USO_ROUNDS}問のハルシネーション見抜き判定`,
      short: `${g.comment.split("。")[0]}。あなたはAIに騙されない自信ある？ → comixai.dev/uso`,
      site: "comixai.dev/uso",
    }),
    `${g.slug}.png`,
    USO_OUT_DIR
  );
}

/* —— トークナイザー体験（/tokenizer）用 —— */
await shoot(
  pageHtml({
    kicker: "LAB — トークナイザー体験",
    badge: "触って学べる",
    title: "AIは、文章を<br>こう読む。",
    titleSize: 92,
    sub: "むかし / むかし / 、 / ある / ところ / に…",
    short: "文章を打つと、その場でトークンに刻まれる。料金の目安も「作業机」の使用量も、触ればわかる。",
    site: "comixai.dev/tokenizer",
  }),
  "tokenizer.png",
  path.join(ROOT, "public/og")
);

await browser.close();
console.log(`完了: 用語集${TERMS.length + 1}枚 + クイズ${GRADES.length + 1}枚 + ラボ1枚 を生成しました`);
