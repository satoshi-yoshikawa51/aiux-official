/* ============================================================
   「サイバー攻撃防災手帳」（/bousai）のOGP画像（1200×630）を生成する。
   ページ本体と同じ「コードの雨の廊下」を背景にする。
   廊下のCSSと色（--tk-*）は、ページとバナーが共有する cyber.css から抜き出して使う
   （見た目を2か所で持たないため）。雨を描く処理は rain.tsx と同じ考え方で、
   先に120フレーム回してから1枚撮る。
   Playwright(Chromium)でスクリーンショットして public/og/bousai.png に書き出す。

   使い方:
     node scripts/generate-bousai-og.mjs
     （npm run og:bousai でも実行できる）
   ============================================================ */
import { mkdir, readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/og/bousai.png");

const css = await readFile(path.join(ROOT, "src/app/bousai/cyber.css"), "utf8");
const tok = (name) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))[1].trim();
const BG = tok("tk-bg");
const GREEN = tok("tk-green");
const GREEN2 = tok("tk-green-2");
const TEXT = tok("tk-text");
const MUTED = tok("tk-muted");
const RED = tok("tk-red");

/* 廊下のCSS（.tk-rain 〜 .tk-scanlines）をそのまま借りる。cq単位は .tk-rain（＝画面いっぱい）基準 */
const rainCss = css.slice(css.indexOf("/* ============ コードの雨（廊下） ============ */"), css.indexOf("/* ============ 見出しのグリッチ・解読 ============ */"));

async function fontCss(pkg, weights) {
  let out = "";
  for (const w of weights) {
    const cssPath = path.join(ROOT, "node_modules/@fontsource", pkg, `${w}.css`);
    const dirUrl = pathToFileURL(path.join(ROOT, "node_modules/@fontsource", pkg)).href;
    out += (await readFile(cssPath, "utf8")).replaceAll("url(./", `url(${dirUrl}/`);
  }
  return out;
}
const FONTS = (await fontCss("zen-kaku-gothic-new", [500, 700, 900])) + (await fontCss("jetbrains-mono", [700]));

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:${BG}}
body{color:${TEXT};font-family:"Zen Kaku Gothic New",sans-serif;position:relative}
${rainCss}
/* OGP用：見出しの裏だけ暗くし、ページ側のビネットは薄くして雨を見せる */
.tk-rain-vignette{opacity:.45}
.tk-scanlines{opacity:.35}
.tk-face-floor{transform:rotateX(90deg) translateZ(-34cqh)}
.tk-face-ceil{transform:rotateX(-90deg) translateZ(-34cqh)}
.shade{position:absolute;inset:0;z-index:1;pointer-events:none;background:
  radial-gradient(ellipse 52% 70% at 34% 50%, rgba(4,8,6,.82) 0%, rgba(4,8,6,.5) 55%, rgba(4,8,6,0) 100%)}
.frame{position:absolute;inset:34px;z-index:2;border:1px solid rgba(57,255,138,.45)}
.frame i{position:absolute;width:24px;height:24px;border:3px solid ${GREEN}}
.frame i:nth-child(1){left:-2px;top:-2px;border-right:0;border-bottom:0}
.frame i:nth-child(2){right:-2px;top:-2px;border-left:0;border-bottom:0}
.frame i:nth-child(3){left:-2px;bottom:-2px;border-right:0;border-top:0}
.frame i:nth-child(4){right:-2px;bottom:-2px;border-left:0;border-top:0}
.body{position:absolute;left:84px;top:78px;right:84px;bottom:70px;z-index:3}
.top{display:flex;align-items:center;justify-content:space-between;font-family:"JetBrains Mono",monospace;font-size:19px;letter-spacing:.14em;color:${MUTED}}
.top .brand{font-family:"Zen Kaku Gothic New",sans-serif;font-weight:900;font-size:26px;letter-spacing:.01em;color:${TEXT}}
.top .brand b{color:${GREEN} !important;font-weight:900;text-shadow:0 0 12px rgba(57,255,138,.6)}
.top .status{display:inline-flex;align-items:center;gap:8px;background:rgba(4,8,6,.75);padding:6px 12px;border:1px solid rgba(57,255,138,.35)}
.top .status::before{content:"";width:9px;height:9px;border-radius:50%;background:${GREEN};box-shadow:0 0 10px ${GREEN}}
.kicker{margin-top:44px;font-family:"JetBrains Mono",monospace;font-size:21px;letter-spacing:.2em;color:${GREEN}}
.title{margin-top:10px;font-weight:900;font-size:96px;line-height:1.16;letter-spacing:.01em;color:#fff;
  text-shadow:0 0 14px rgba(57,255,138,.35),0 0 44px rgba(57,255,138,.25)}
.sub{margin-top:22px;font-size:26px;color:${TEXT};line-height:1.5;text-shadow:0 0 6px ${BG},0 0 12px ${BG},0 0 24px ${BG},0 0 36px ${BG}}
.sub b{color:${GREEN};font-weight:700}
.tags{position:absolute;left:0;bottom:0;display:flex;gap:12px}
.tag{font-family:"JetBrains Mono",monospace;font-size:19px;letter-spacing:.1em;padding:9px 16px;border:2px solid ${GREEN};color:${GREEN};background:rgba(4,8,6,.6);
  clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)}
.tag.red{border-color:${RED};color:${RED}}
.url{position:absolute;right:0;bottom:0;font-family:"JetBrains Mono",monospace;font-size:22px;letter-spacing:.1em;color:${MUTED};background:rgba(4,8,6,.75);padding:9px 14px;border:1px solid rgba(57,255,138,.35)}
.url b{color:${GREEN2};font-weight:700}
</style></head><body>
<div class="tk-rain" id="rain">
  <div class="tk-rain-stage"><div class="tk-rain-corridor">
    <canvas class="tk-face tk-face-back"></canvas>
    <canvas class="tk-face tk-face-floor"></canvas>
    <canvas class="tk-face tk-face-ceil"></canvas>
    <canvas class="tk-face tk-face-left"></canvas>
    <canvas class="tk-face tk-face-right"></canvas>
  </div></div>
  <div class="tk-rain-vignette"></div>
  <div class="tk-scanlines"></div>
</div>
<div class="shade"></div>
<div class="frame"><i></i><i></i><i></i><i></i></div>
<div class="body">
  <div class="top"><span class="brand">CO<b>MIX</b>AI</span><span class="status">LOCAL ONLY</span></div>
  <div class="kicker">&gt; CYBER ATTACK — DISASTER KIT</div>
  <div class="title">サイバー攻撃<br>防災手帳</div>
  <div class="sub">5問で、あなた専用のセキュリティ手順書。<b>iPhone / Android / Windows / Mac</b> 別に、設定画面の階層まで。</div>
  <div class="tags"><span class="tag red">回答はどこにも送らない</span><span class="tag">今日の15分 → 今週中に → もしもの時に</span></div>
  <div class="url">comixai.dev/<b>bousai</b></div>
</div>
<script>
/* rain.tsx と同じ描き方。乱数は固定して毎回同じ絵にする */
(function(){
  var seed=20261017;function rnd(){seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296}
  var G="アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEFGHJKLMNPQRSTUVWXYZ<>=/:;+*#$%&";
  var W=1280,H=1800,F=14,C=Math.floor(W/F);
  var faces=document.querySelectorAll("#rain canvas");faces.forEach(function(f){f.width=W;f.height=H});
  var src=document.createElement("canvas");src.width=W;src.height=H;var ctx=src.getContext("2d");
  var N=C*3,drops=[],speed=[];for(var i=0;i<N;i++){drops.push(rnd()*-H*1.5);speed.push(0.5+rnd()*1.2)}
  ctx.fillStyle="${BG}";ctx.fillRect(0,0,W,H);
  function step(){
    ctx.fillStyle="rgba(4,8,6,0.045)";ctx.fillRect(0,0,W,H);
    ctx.font=F+'px "JetBrains Mono", monospace';ctx.textBaseline="top";
    for(var i=0;i<N;i++){var x=(i%C)*F,y=drops[i];
      ctx.fillStyle="${GREEN}";ctx.fillText(G[(rnd()*G.length)|0],x,y-F);
      ctx.fillStyle="${TEXT}";ctx.fillText(G[(rnd()*G.length)|0],x,y);
      drops[i]=y>H+F*2?rnd()*-H*0.8:y+F*speed[i]}
  }
  for(var k=0;k<170;k++)step();
  faces.forEach(function(f){f.getContext("2d").drawImage(src,0,0)});
  window.__rainReady=true;
})();
</script>
</body></html>`;

const npmRoot = execSync("npm root -g").toString().trim();
const { chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => window.__rainReady === true);
await mkdir(path.dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT, type: "png" });
await browser.close();
console.log("✔ public/og/bousai.png");
