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

/* ── バナー0：サイバー攻撃防災手帳（→ /bousai）
   ページ本体と同じ「コードの雨の廊下」を背景にする。廊下のCSSと色は
   src/app/bousai/bousai.css から読み、雨は rain.tsx と同じ描き方で先に回す
   （generate-bousai-og.mjs と同じ作り） ── */
const bousaiCss = await readFile(path.join(ROOT, "src/app/bousai/bousai.css"), "utf8");
const tk = (name) => bousaiCss.match(new RegExp(`--${name}:\\s*([^;]+);`))[1].trim();
const rainCss = bousaiCss.slice(
  bousaiCss.indexOf("/* ============ コードの雨（廊下） ============ */"),
  bousaiCss.indexOf("/* ============ 骨組み ============ */"),
);
const bousaiHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${BASE_CSS}
html,body{background:${tk("tk-bg")}}
body{color:${tk("tk-text")};position:relative}
${rainCss}
.tk-rain-vignette{opacity:.4}
.tk-scanlines{opacity:.35}
.tk-face-floor{transform:rotateX(90deg) translateZ(-30vh)}
.tk-face-ceil{transform:rotateX(-90deg) translateZ(-30vh)}
.shade{position:absolute;inset:0;z-index:1;pointer-events:none;background:
  radial-gradient(ellipse 62% 92% at 50% 50%, rgba(4,8,6,.9) 0%, rgba(4,8,6,.6) 55%, rgba(4,8,6,0) 100%)}
.frame{position:absolute;inset:16px;z-index:2;border:1px solid rgba(57,255,138,.4);pointer-events:none}
.frame i{position:absolute;width:18px;height:18px;border:3px solid ${tk("tk-green")}}
.frame i:nth-child(1){left:-2px;top:-2px;border-right:0;border-bottom:0}
.frame i:nth-child(2){right:-2px;top:-2px;border-left:0;border-bottom:0}
.frame i:nth-child(3){left:-2px;bottom:-2px;border-right:0;border-top:0}
.frame i:nth-child(4){right:-2px;bottom:-2px;border-left:0;border-top:0}
/* 中央揃え。左右110pxはカルーセルの矢印が文字に被らないための余白 */
.body{position:absolute;left:110px;right:110px;top:0;bottom:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px}
.kicker{color:${tk("tk-green")};font-size:20px}
.title{font-weight:900;font-size:86px;line-height:1.15;letter-spacing:.01em;color:#fff;text-shadow:0 0 14px rgba(57,255,138,.4),0 0 44px rgba(57,255,138,.28)}
.sub{font-size:24px;font-weight:700;color:${tk("tk-text")};text-shadow:0 0 6px ${tk("tk-bg")},0 0 14px ${tk("tk-bg")},0 0 28px ${tk("tk-bg")}}
.sub b{color:${tk("tk-green")}}
.cta{align-self:center;margin-top:6px;border-color:${tk("tk-green")};background:${tk("tk-green")};color:${tk("tk-bg")};box-shadow:0 0 14px rgba(57,255,138,.7),0 0 40px rgba(57,255,138,.3);border-radius:0;
  clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)}
.tag{position:absolute;right:110px;top:36px;z-index:3;font-family:"JetBrains Mono",monospace;font-weight:700;font-size:17px;letter-spacing:.12em;color:${tk("tk-red")};border:2px solid ${tk("tk-red")};padding:8px 14px;background:rgba(4,8,6,.75);
  clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)}
</style></head><body>
<div class="tk-rain" id="rain">
  <div class="tk-rain-stage"><div class="tk-rain-corridor">
    <canvas class="tk-face tk-face-back"></canvas><canvas class="tk-face tk-face-floor"></canvas><canvas class="tk-face tk-face-ceil"></canvas><canvas class="tk-face tk-face-left"></canvas><canvas class="tk-face tk-face-right"></canvas>
  </div></div>
  <div class="tk-rain-vignette"></div><div class="tk-scanlines"></div>
</div>
<div class="shade"></div>
<div class="frame"><i></i><i></i><i></i><i></i></div>
<div class="tag">回答はどこにも送らない</div>
<div class="body">
  <div class="kicker">&gt; CYBER ATTACK — DISASTER KIT</div>
  <div class="title">サイバー攻撃防災手帳</div>
  <div class="sub">5問で、<b>あなた専用</b>のセキュリティ手順書。</div>
  <div class="cta">防災手帳をつくる <span style="font-size: 30px;">→</span></div>
</div>
<script>
(function(){
  var seed=20261018;function rnd(){seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296}
  var G="アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEFGHJKLMNPQRSTUVWXYZ<>=/:;+*#$%&";
  var W=1280,H=1800,F=14,C=Math.floor(W/F);
  var faces=document.querySelectorAll("#rain canvas");faces.forEach(function(f){f.width=W;f.height=H});
  var src=document.createElement("canvas");src.width=W;src.height=H;var ctx=src.getContext("2d");
  var N=C*3,drops=[],speed=[];for(var i=0;i<N;i++){drops.push(rnd()*-H*1.5);speed.push(0.5+rnd()*1.2)}
  ctx.fillStyle="${tk("tk-bg")}";ctx.fillRect(0,0,W,H);
  function step(){ctx.fillStyle="rgba(4,8,6,0.045)";ctx.fillRect(0,0,W,H);ctx.font=F+'px "JetBrains Mono", monospace';ctx.textBaseline="top";
    for(var i=0;i<N;i++){var x=(i%C)*F,y=drops[i];ctx.fillStyle="${tk("tk-green")}";ctx.fillText(G[(rnd()*G.length)|0],x,y-F);ctx.fillStyle="${tk("tk-text")}";ctx.fillText(G[(rnd()*G.length)|0],x,y);drops[i]=y>H+F*2?rnd()*-H*0.8:y+F*speed[i]}}
  for(var k=0;k<170;k++)step();
  faces.forEach(function(f){f.getContext("2d").drawImage(src,0,0)});
  window.__rainReady=true;
})();
</script>
</body></html>`;

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
  ["bousai", bousaiHtml],
  ["academy", academyHtml],
  ["kyoshujo", kyoshujoHtml],
]) {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (name === "bousai") await page.waitForFunction(() => window.__rainReady === true);
  const png = await page.screenshot({ type: "png" });
  await sharp(png).webp({ quality: 88 }).toFile(path.join(OUT_DIR, `${name}.webp`));
  console.log(`  ✔ ${name}.webp`);
}

await browser.close();
console.log(`完了: トップバナー3枚を ${path.relative(ROOT, OUT_DIR)}/ に生成しました`);
