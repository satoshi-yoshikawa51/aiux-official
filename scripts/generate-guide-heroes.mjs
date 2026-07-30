/* ============================================================
   職種別ガイドのヒーロー画像（public/guide/{slug}.webp, 1200×800）を作る。

   ▍これは「絵ができるまでのつなぎ」
   既存の4職種（sales / marketing / office / creator）は Midjourney で描いた
   3Dキャラクターの絵です。新しく足した職種にはまだ絵が無いので、
   このスクリプトがサイトと同じ書体・トークンで作った**タイポグラフィの絵**を
   置きます。絵ができたら同じファイル名で上書きしてください。

   **すでにファイルがあるものは触りません。**（Midjourneyの絵を消さないため）
   作り直したいときだけ FORCE=1 を付けること。

   使い方:
     node scripts/generate-guide-heroes.mjs
     （= npm run guide:heroes）
     FORCE=1 node scripts/generate-guide-heroes.mjs   # 既存も作り直す

   ▍Midjourneyで描くときのプロンプト
   既存4枚と絵柄を揃えるため、docs/guide-hero-prompts.md に置いてあります。
   ============================================================ */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/guide");
const FORCE = process.env.FORCE === "1";

/* —— サイトのデザイントークン（globals.cssと揃えること） —— */
const INK = "#14110f";
const INK_500 = "#6e635b";
const PAPER_0 = "#ffffff";
const PAPER_50 = "#fbf7ef";
const RED = "#e60012";

/* 絵の無い職種。icon は Phosphor のアイコン名（ph- は付けない） */
const HEROES = [
  { slug: "hr", role: "人事・採用", icon: "users-three", tint: "#e7f0ff" },
  { slug: "support", role: "サポート・CS", icon: "headset", tint: "#e4f6ec" },
  { slug: "planner", role: "企画・PM", icon: "compass", tint: "#fff1db" },
  { slug: "owner", role: "経営者・個人事業主", icon: "storefront", tint: "#ffe9ea" },
  { slug: "it", role: "情シス・社内IT", icon: "shield-check", tint: "#f4ecdd" },
];

/* fontsourceのCSSを読み、フォントURLを絶対file://に書き換えてインライン化
   （generate-og-images.mjs と同じやり方） */
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
  (await fontCss("zen-kaku-gothic-new", [700, 900])) + (await fontCss("jetbrains-mono", [700]));

/* Phosphorはboldだけ使う（サイトの読み込みと同じ）。
   .ph-bold のクラス定義（アイコン名 → 文字コード）はCSSをそのまま使い、
   @font-face だけ**自前のdata: URIに差し替える**。

   setContent で作ったページは about:blank なので、file:// のフォントは
   読み込みが拒否される（document.fonts の status が error になるだけで、
   例外は飛ばない。アイコンは黙って消える）。埋め込んでしまえば確実。 */
const PH_DIR = path.join(ROOT, "node_modules/@phosphor-icons/web/src/bold");
const PH_WOFF2 = (await readFile(path.join(PH_DIR, "Phosphor-Bold.woff2"))).toString("base64");
const PH_CSS =
  `@font-face{font-family:"Phosphor-Bold";font-display:block;` +
  `src:url(data:font/woff2;base64,${PH_WOFF2}) format("woff2")}` +
  (await readFile(path.join(PH_DIR, "style.css"), "utf8")).replace(/@font-face\s*\{[^}]*\}/, "");

function html({ role, icon, tint }) {
  return `<!doctype html><meta charset="utf-8"><style>
${FONTS}
${PH_CSS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:800px;background:${PAPER_50};display:flex;align-items:center;justify-content:center;
     font-family:"Zen Kaku Gothic New",sans-serif;overflow:hidden;position:relative}
/* 網点。サイトのトーンと同じ「紙の上の黒い点」 */
body::before{content:"";position:absolute;inset:0;
  background-image:radial-gradient(${INK} 1.6px, transparent 1.7px);
  background-size:14px 14px;opacity:.09}
.card{position:relative;width:1010px;height:620px;background:${PAPER_0};
  border:6px solid ${INK};border-radius:22px;box-shadow:16px 16px 0 ${INK};
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;overflow:hidden}
/* コマの中の色みは職種ごとに変える。下からうっすら */
.card::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,${tint} 100%)}
.disc{position:relative;width:250px;height:250px;border-radius:50%;background:${tint};
  border:6px solid ${INK};display:flex;align-items:center;justify-content:center}
.disc i{font-size:132px;color:${INK};line-height:1}
.role{position:relative;font-weight:900;font-size:62px;letter-spacing:.02em;color:${INK}}
.kicker{position:relative;font-family:"JetBrains Mono",monospace;font-weight:700;
  font-size:19px;letter-spacing:.2em;color:${RED}}
.foot{position:absolute;right:34px;bottom:26px;font-family:"JetBrains Mono",monospace;
  font-weight:700;font-size:17px;letter-spacing:.1em;color:${INK_500}}
</style>
<div class="card">
  <div class="kicker">AI GUIDE</div>
  <div class="disc"><i class="ph-bold ph-${icon}"></i></div>
  <div class="role">${role}</div>
  <div class="foot">comixai.dev/guide</div>
</div>`;
}

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--font-render-hinting=none"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

for (const h of HEROES) {
  const out = path.join(OUT_DIR, `${h.slug}.webp`);
  if (existsSync(out) && !FORCE) {
    console.log(`  – ${h.slug}.webp はすでにある（FORCE=1 で作り直せる）`);
    continue;
  }
  /* setContent（about:blank）だと file:// のフォントが読めないので、
     いったんファイルに書いてから開く。CSSの中は絶対URLなので置き場所は問わない */
  const tmp = path.join(tmpdir(), `guide-hero-${h.slug}.html`);
  await writeFile(tmp, html(h), "utf8");
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  /* 読み込みに失敗した書体が1つも無いことを見る。
     和文は unicode-range で200個以上に分割されていて、どの部分が要るかは
     文字しだいなので、document.fonts.check で1つずつ問うのは当てにならない
     （太さや文字の指定が少しずれるだけで false になる）。
     「error になった face がゼロか」なら、分割のしかたに依存しない */
  const bad = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === "error").map((f) => f.family),
  );
  if (bad.length) throw new Error(`フォントが読めていない: ${[...new Set(bad)].join(", ")}`);

  const box = await page.evaluate(() => {
    const el = document.querySelector(".disc i");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!box || box.w < 10) throw new Error(`ph-${h.icon} の箱が無い`);

  /* Playwright は png / jpeg しか吐けないので、webp化は sharp にやらせる
     （ページ側が .webp 決め打ちなので、既存4枚と拡張子を揃える必要がある） */
  const png = await page.screenshot({ type: "png" });

  /* アイコンが**本当に描かれたか**を画素で確かめる。
     Phosphorに無い名前や、フォントが読めていないときは、箱だけあって
     中身が空のまま静かに通ってしまう。地は薄い色なので、
     アイコンの矩形の中に黒い画素があるかどうかで判定できる */
  const ink = await sharp(png)
    .extract({
      left: Math.round(box.x),
      top: Math.round(box.y),
      width: Math.round(box.w),
      height: Math.round(box.h),
    })
    .stats();
  if (ink.channels[0].min > 90) {
    throw new Error(`ph-${h.icon} が描画されていない（Phosphorに無い名前か、フォントが読めていない）`);
  }

  await sharp(png).webp({ quality: 86 }).toFile(out);
  console.log(`  ✔ ${h.slug}.webp`);
}

await browser.close();
console.log("\n絵ができたら、同じファイル名で public/guide/ に上書きしてください。");
console.log("Midjourneyのプロンプトは docs/guide-hero-prompts.md にあります。");
