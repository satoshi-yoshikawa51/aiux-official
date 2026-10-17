/* ============================================================
   「サイバー攻撃防災手帳」（/bousai）のOGP画像（1200×630）を生成する。
   ページ本体と同じサイバー調（黒地に緑のコードの雨）で、
   色は bousai.css の --tk-* をそのまま読んで使う（2か所で持たない）。
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

const css = await readFile(path.join(ROOT, "src/app/bousai/bousai.css"), "utf8");
const tok = (name) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))[1].trim();
const BG = tok("tk-bg");
const GREEN = tok("tk-green");
const GREEN2 = tok("tk-green-2");
const TEXT = tok("tk-text");
const MUTED = tok("tk-muted");
const RED = tok("tk-red");

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

/* コードの雨は決め打ちの乱数で描く（毎回同じ絵になるように） */
let seed = 20261017;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEFGHJKLMNPQRSTUVWXYZ<>=/:;+*#$%&";
const cols = [];
for (let x = 0; x < 1200; x += 22) {
  const len = 8 + Math.floor(rnd() * 22);
  const top = -200 + rnd() * 700;
  const chars = Array.from({ length: len }, () => GLYPHS[Math.floor(rnd() * GLYPHS.length)]).join("<br>");
  const op = 0.25 + rnd() * 0.55;
  cols.push(`<div class="col" style="left:${x}px;top:${top}px;opacity:${op}">${chars}</div>`);
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:${BG};color:${TEXT};font-family:"Zen Kaku Gothic New",sans-serif;overflow:hidden;position:relative}
.rain{position:absolute;inset:0;overflow:hidden}
.col{position:absolute;font-family:"JetBrains Mono",monospace;font-size:17px;line-height:1.25;color:${GREEN};
  text-shadow:0 0 8px rgba(57,255,138,.6);
  -webkit-mask-image:linear-gradient(to bottom,transparent,#000 30%,#000 85%,#fff)}
.col::first-line{color:${GREEN2}}
.shade{position:absolute;inset:0;background:
  radial-gradient(ellipse 58% 70% at 42% 50%, rgba(4,8,6,.92) 0%, rgba(4,8,6,.6) 60%, rgba(4,8,6,0) 100%),
  linear-gradient(to bottom, rgba(4,8,6,.5), transparent 25%, transparent 75%, rgba(4,8,6,.6))}
.scan{position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0 3px,rgba(0,0,0,.22) 3px 4px)}
.frame{position:absolute;inset:36px;border:1px solid rgba(57,255,138,.45)}
.frame i{position:absolute;width:22px;height:22px;border:3px solid ${GREEN}}
.frame i:nth-child(1){left:-2px;top:-2px;border-right:0;border-bottom:0}
.frame i:nth-child(2){right:-2px;top:-2px;border-left:0;border-bottom:0}
.frame i:nth-child(3){left:-2px;bottom:-2px;border-right:0;border-top:0}
.frame i:nth-child(4){right:-2px;bottom:-2px;border-left:0;border-top:0}
.body{position:absolute;left:84px;top:84px;right:84px;bottom:76px}
.kicker{font-family:"JetBrains Mono",monospace;font-size:21px;letter-spacing:.2em;color:${GREEN};margin-bottom:22px}
.kicker::before{content:"> ";color:${MUTED}}
.title{font-weight:900;font-size:92px;line-height:1.22;letter-spacing:.01em;text-shadow:0 0 30px rgba(57,255,138,.35)}
.sub{margin-top:26px;font-family:"JetBrains Mono",monospace;font-size:24px;color:${MUTED};letter-spacing:.04em}
.sub b{color:${GREEN};font-weight:700}
.tags{position:absolute;left:0;bottom:0;display:flex;gap:12px}
.tag{font-family:"JetBrains Mono",monospace;font-size:19px;letter-spacing:.1em;padding:9px 16px;border:2px solid ${GREEN};color:${GREEN};
  clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)}
.tag.red{border-color:${RED};color:${RED}}
.brand{position:absolute;right:0;bottom:4px;font-family:"JetBrains Mono",monospace;font-size:22px;letter-spacing:.12em;color:${MUTED}}
.brand b{color:${GREEN};font-weight:700}
</style></head><body>
<div class="rain">${cols.join("")}</div>
<div class="shade"></div><div class="scan"></div>
<div class="frame"><i></i><i></i><i></i><i></i></div>
<div class="body">
  <div class="kicker">CYBER ATTACK — DISASTER KIT</div>
  <div class="title">サイバー攻撃<br>防災手帳</div>
  <div class="sub">5問で、あなた専用のセキュリティ手順書 ｜ iPhone / Android / Windows / Mac</div>
  <div class="tags"><span class="tag red">LOCAL ONLY</span><span class="tag">回答はどこにも送らない</span></div>
  <div class="brand">comixai.dev/bousai ・ <b>COMIXAI</b></div>
</div>
</body></html>`;

const npmRoot = execSync("npm root -g").toString().trim();
const { chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await mkdir(path.dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT, type: "png" });
await browser.close();
console.log("✔ public/og/bousai.png");
