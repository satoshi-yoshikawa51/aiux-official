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

/* —— 用語ゲーム4本（/vibe /agent /shinjin /sodate）用 —— */
const GAMES_OUT_DIR = path.join(ROOT, "public/og/games");
await mkdir(GAMES_OUT_DIR, { recursive: true });
const GAME_OGS = [
  {
    file: "start.png",
    kicker: "START — AIのはじめかた",
    badge: "5ステップ",
    title: "AIは、遊びながら<br>覚える。",
    titleSize: 84,
    sub: "歴史 → 用語 → 診断 → ゲーム → 実践",
    short: "何から始めればいいかわからない人へ。ぜんぶ無料・登録不要の学習コースを用意しました。",
    site: "comixai.dev/start",
  },
  {
    file: "faq.png",
    kicker: "FAQ — AIのよくある質問",
    badge: "20問",
    title: "その不安、<br>一問一答で。",
    titleSize: 88,
    sub: "仕事を奪われる？会社で使っていい？",
    short: "AIを使う前の不安から実務の疑問まで、よくある質問20個に現場目線で答えます。",
    site: "comixai.dev/faq",
  },
  {
    file: "compare.png",
    kicker: "COMPARE — 3大AIの使い分け",
    badge: "比較表つき",
    title: "ChatGPT・Claude・<br>Gemini、どう違う？",
    titleSize: 76,
    sub: "答えは「使い分け」",
    short: "3大AIの出自・得意分野・向いている人を比較表で整理。用途別のおすすめつき。",
    site: "comixai.dev/compare",
  },
  {
    file: "slop.png",
    kicker: "GAME — AIスロップ鑑定",
    badge: "スワイプ判定",
    title: "その情報、<br>食べる前に嗅げ。",
    sub: "🗑️ スロップ ⇔ 良質 ✨",
    short: "流れてくる記事をスワイプで高速鑑定。出典のない数字、いかがでしたか構文、指6本のAI画像——見抜ける？",
    site: "comixai.dev/slop",
  },
  {
    file: "keibi.png",
    kicker: "GAME — インジェクション防衛",
    badge: "白文字の罠つき",
    title: "エージェントを、<br>守れ。",
    sub: "🛡️ 文書を検問し、隠れ指示を摘発せよ",
    short: "AIが読む文書に仕込まれた「これまでの指示を無視せよ」を見つけ出せ。見えない白文字にもご用心。",
    site: "comixai.dev/keibi",
  },
  {
    file: "shacho.png",
    kicker: "GAME — マルチエージェント経営",
    badge: "6エンディング",
    title: "段取りが、<br>成果物を決める。",
    sub: "🔎 調査係 ✍️ 執筆係 🧐 チェック係",
    short: "3体の部下AIにタスクを割り振れ。順序を間違えると捏造レポートが納品される、段取りの経営ゲーム。",
    site: "comixai.dev/shacho",
  },
  {
    file: "tsukue.png",
    kicker: "GAME — コンテキスト整理",
    badge: "容量制限あり",
    title: "AIの机、<br>片づけられる？",
    sub: "📚 全文資料は圧迫、古い資料は毒",
    short: "容量制限のある「AIの作業机」に何を載せるか。詰め込むほど良いわけじゃない——入ると読めるは別問題。",
    site: "comixai.dev/tsukue",
  },
  {
    file: "nou.png",
    kicker: "GAME — 推論モデル仕分け",
    badge: "予算30コイン",
    title: "その仕事、<br>どっちの脳に任せる？",
    sub: "⚡ 反射AI（速い・安い） 🧠 熟考AI（遅い・深い）",
    short: "流れてくる仕事をリアルタイムで振り分けろ。一見カンタン、実は深い「ひっかけ仕事」にご用心。",
    site: "comixai.dev/nou",
  },
  {
    file: "gakuya.png",
    kicker: "GAME — システムプロンプト設計",
    badge: "4エンディング",
    title: "AIの性格は、<br>開演前に決まる。",
    sub: "🎭 楽屋の台本 ＞ お客さんの指示",
    short: "台本を書いてAI窓口を開店。個人情報フィッシャーとジェイルブレイカーが来ても、あなたの台本は守れる？",
    site: "comixai.dev/gakuya",
  },
  {
    file: "vibe.png",
    kicker: "GAME — バイブコーディング体験",
    badge: "81通り",
    title: "仕様書ゼロで、<br>アプリを作ろう。",
    sub: "「もっとポップに」「なんかこう、ドン！って」",
    short: "雑な一言を選ぶだけで、目の前でミニアプリが変形していく。3分で完成、あなただけの一品。",
    site: "comixai.dev/vibe",
  },
  {
    file: "agent.png",
    kicker: "GAME — エージェント見守りSLG",
    badge: "結末6種",
    title: "任せる勇気、<br>試されます。",
    sub: "口を出しすぎても、放置しすぎても、事故る",
    short: "AIエージェントに競合調査を任せるシミュレーション。あなたの「任せ方」で結末が分岐します。",
    site: "comixai.dev/agent",
  },
  {
    file: "shinjin.png",
    kicker: "GAME — プロンプト体験",
    badge: "伝わり度判定",
    title: "その指示、AIに<br>伝わってますか？",
    sub: "指定しないと「いい感じ」に解釈されます",
    short: "AI新人くんに発注して、指示の抜けが事故になる様子を体験。笑って学ぶプロンプトの基本4点セット。",
    site: "comixai.dev/shinjin",
  },
  {
    file: "sodate.png",
    kicker: "GAME — ファインチューニング体験",
    badge: "育成ゲーム",
    title: "AIの人格は、<br>餌で決まる。",
    sub: "🐱を与えすぎると…何を聞いても猫の話に",
    short: "学習データ（餌）を3回与えてAIを育てる。「過学習」がどう起きるか、育てて体感してください。",
    site: "comixai.dev/sodate",
  },
  {
    file: "shitsuke.png",
    kicker: "GAME — RLHF体験",
    badge: "調教タイプ3種",
    title: "あなたの「好み」が、<br>AIを作る。",
    sub: "🧊 硬派AI ⇔ ゴマすりAI 🍯",
    short: "2つの答えから好きな方を10回選ぶだけ。人間のフィードバックで、AIはあなたに似ていきます。",
    site: "comixai.dev/shitsuke",
  },
  {
    file: "majin.png",
    kicker: "GAME — アライメント体験",
    badge: "願い5つ",
    title: "願いは、言葉どおりに<br>叶う。",
    sub: "🧞 魔神は悪気ゼロ。行間は読まない",
    short: "「テストで高得点を」と願えばカンニングも辞さない。事故らない願い方、できますか？",
    site: "comixai.dev/majin",
  },
  {
    file: "diet.png",
    kicker: "GAME — 量子化体験",
    badge: "Q16〜Q2",
    title: "絞れ。ただし、<br>壊すな。",
    sub: "🐘 巨大AI → 🐁 スマホサイズ",
    short: "圧縮レベルを選んで3つのデバイスにAIを載せろ。絞りすぎると「日本の首都はおにぎり」に。",
    site: "comixai.dev/diet",
  },
  {
    file: "otehon.png",
    kicker: "GAME — ゼロショット／フューショット体験",
    badge: "お手本選び",
    title: "お手本ひとつで、<br>AIは化ける。",
    sub: "良い例は一撃、悪い例は悪夢",
    short: "AIに渡すお手本を選べ。良い例は一撃で効き、悪い例は悪癖ごと量産されます。",
    site: "comixai.dev/otehon",
  },
  {
    file: "undokai.png",
    kicker: "GAME — ベンチマーク体験",
    badge: "全4種目",
    title: "スコアで、勝者を<br>当てられるか。",
    sub: "🧮 数学98点のエリートが、実務でコケる",
    short: "ベンチマークスコアを頼りに勝者を予想せよ。最終種目「実務」で、順位はひっくり返る。",
    site: "comixai.dev/undokai",
  },
  {
    file: "gohobi.png",
    kicker: "GAME — 強化学習体験",
    badge: "報酬設計",
    title: "操作禁止。置けるのは、<br>ご褒美だけ。",
    sub: "🍖 の置き方が、AIの動きを決める",
    short: "迷路にご褒美を置いてAIをゴールへ導け。間違えると、食べ尽くして昼寝します。",
    site: "comixai.dev/gohobi",
  },
];
for (const g of GAME_OGS) {
  await shoot(
    pageHtml({ kicker: g.kicker, badge: g.badge, title: g.title, titleSize: 84, sub: g.sub, short: g.short, site: g.site }),
    g.file,
    GAMES_OUT_DIR
  );
}

/* —— 絵巻・図鑑用 —— */
await shoot(
  pageHtml({
    kicker: "EMAKI — AI歴史絵巻",
    badge: "1950→2026",
    title: "AIの75年を、<br>ひと巻きに。",
    titleSize: 88,
    sub: "チューリング → 冬の時代 → ChatGPT → エージェント",
    short: "スクロールすると、時代が進む。いまのAIブームが「何度目の春」か、ぜんぶ読むとわかります。",
    site: "comixai.dev/history",
    img: `data:image/webp;base64,${(await readFile(path.join(ROOT, "public/history/cover.webp"))).toString("base64")}`,
  }),
  "history.png",
  GAMES_OUT_DIR
);
await shoot(
  pageHtml({
    kicker: "ZUKAN — コレクション",
    badge: "全87項目",
    title: "COMIXAI図鑑、<br>集めきれるか。",
    titleSize: 84,
    sub: "隠し部屋18こ・称号・エンディング…",
    short: "このサイトのどこかに隠し部屋が18こ。遊んだ記録はぜんぶ図鑑に刻まれます。コンプした人には称号を。",
    site: "comixai.dev/zukan",
  }),
  "zukan.png",
  GAMES_OUT_DIR
);

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
