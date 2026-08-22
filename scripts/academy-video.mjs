/* ============================================================
   スマホアプリ「COMIXAI アカデミー」の宣伝動画（縦ショート）を作る。

     npm run academy:video

   仕組み:
     審査提出用のスクショ（ComixaiAcademy/docs/screenshots/）を、
     サイトと同じ書体・デザイントークンで組んだ1080×1920の板に載せ、
     Playwrightで5枚撮る → ffmpegでゆっくり寄せ、クロスフェードで
     つないで、下端に進みぐあいのバーを引く。音は入れない
     （BGMは投稿先のアプリ側で付けられる＝権利の心配がない）。

   出力:
     academy-video/comixai-academy.mp4  … YouTube Shorts / TikTok / Reels / X 共用
     academy-video/comixai-academy.txt  … 投稿用のタイトル・説明文・タグ

   尺の作りは scripts/yonkoma-video.mjs と .claude/skills/short-video に
   合わせてある（5カット×5.0秒・クロスフェード0.45秒＝23.2秒）。

   必要なもの（package.json には入れない。使う時だけ）:
     ffmpeg（PATH に無ければ `npm install --no-save ffmpeg-static`）
     Playwright（グローバル／ローカルどちらでも自動で拾う）

   ▍文言を変えるときは CUTS だけ触ればよい。
   アプリの数字（本数・種類）は ComixaiAcademy/docs/appstore.md と
   src/app/academy/page.tsx が出どころ。3か所で食い違わせないこと。
   ============================================================ */
import { mkdir, readFile, writeFile, access, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync, execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "academy-video");
const WORK_DIR = path.join(OUT_DIR, ".work");
const SHOTS = path.join(ROOT, "ComixaiAcademy/docs/screenshots");

const KEEP = process.argv.includes("--keep"); // 中間ファイルを残してデバッグ

/* —— 尺。1カットを5秒より延ばすと、ショートでは離脱される —— */
const FPS = 30;
const CUT_SEC = 5.0;
const XFADE_SEC = 0.45;
const W = 1080;
const H = 1920;

/* —— デザイントークン（globals.cssと揃える） —— */
const INK = "#14110f";
const PAPER_50 = "#fbf7ef";
const PAPER_200 = "#e7dcc6";
const YELLOW = "#ffd23f";

/* —— 5カット。役割は フック→展開→転→オチ→CTA —— */
/* hi: 黄色く塗る語（1カット1箇所まで。増やすと効かなくなる）
   zoom: "in" | "out" — 隣り合うカットで向きを変えると単調にならない */
const CUTS = [
  {
    shot: "iphone69-1-home.png",
    kicker: "AIの勉強が続かない人へ",
    lines: ["読んでも身につかないのは、", "読んでいるからです。"],
    hi: "読んでいるから",
    foot: "3Dの相棒と、遊んで学ぶ生成AI",
    zoom: "in",
  },
  {
    shot: "iphone69-2-token.png",
    kicker: "FEATURE — 体感で学ぶ",
    lines: ["AIには、文章がこう見える。", "その場で割って、確かめる。"],
    hi: "その場で割って",
    foot: "レッスンに挟まるミニゲームは9種類",
    zoom: "out",
  },
  {
    shot: "iphone69-3-lesson.png",
    kicker: "FEATURE — プロンプト道場",
    lines: ["書いた指示は、", "AIが添削して返す。"],
    hi: "AIが添削して返す",
    foot: "5コース・全17レッスン／1本2〜3分",
    zoom: "in",
  },
  {
    shot: "iphone69-4-gacha.png",
    kicker: "FEATURE — つづく仕掛け",
    lines: ["ごほうびはガチャ。", "課金は、なし。"],
    hi: "課金は、なし",
    foot: "ポイントは学習でしか手に入りません",
    zoom: "out",
  },
  {
    shot: "iphone69-5-badges.png",
    kicker: "iPhone / iPad アプリ",
    lines: ["COMIXAI アカデミー", "まもなく公開。"],
    hi: "まもなく公開",
    foot: "登録不要・広告なし・完全無料　comixai.dev/academy",
    zoom: "in",
    end: true,
  },
];

const TOTAL_SEC = CUTS.length * CUT_SEC - (CUTS.length - 1) * XFADE_SEC;

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

function resolveFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return "ffmpeg";
  } catch {
    /* PATHに無ければ ffmpeg-static を探す */
  }
  const local = path.join(ROOT, "node_modules/ffmpeg-static/ffmpeg");
  if (existsSync(local)) return local;
  console.error("ffmpegが無い。`npm install --no-save ffmpeg-static` を実行してからやり直して");
  process.exit(1);
}
const FFMPEG = resolveFfmpeg();

async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    const npmRoot = execSync("npm root -g").toString().trim();
    ({ chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href));
  }
  const sandboxChrome = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_PATH || ((await exists(sandboxChrome)) ? sandboxChrome : undefined);
  return chromium.launch({ executablePath, args: ["--allow-file-access-from-files"] });
}

async function fontCss(pkg, weights) {
  let css = "";
  for (const w of weights) {
    const cssPath = path.join(ROOT, "node_modules/@fontsource", pkg, `${w}.css`);
    const dirUrl = pathToFileURL(path.join(ROOT, "node_modules/@fontsource", pkg)).href;
    css += (await readFile(cssPath, "utf8")).replaceAll("url(./", `url(${dirUrl}/`);
  }
  return css;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* 黄色マーカーは1カット1語だけ。行に含まれていれば、その語を包む */
function mark(line, hi) {
  const safe = esc(line);
  if (!hi) return safe;
  const target = esc(hi);
  return safe.includes(target) ? safe.replace(target, `<span class="hi">${target}</span>`) : safe;
}

const FONTS =
  (await fontCss("zen-kaku-gothic-new", [500, 700, 900])) +
  (await fontCss("jetbrains-mono", [700]));

function frameHtml({ shotDataUri, iconDataUri, kicker, lines, hi, foot, end }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: ${W}px; height: ${H}px; overflow: hidden;
  font-family: "Zen Kaku Gothic New", sans-serif; color: ${PAPER_50};
  background: ${INK};
  background-image: radial-gradient(rgba(255,255,255,0.075) 2px, transparent 2.1px);
  background-size: 26px 26px;
  display: flex; flex-direction: column; align-items: center;
  padding: 96px 64px 120px;
}
.kicker {
  font-family: "JetBrains Mono", monospace; font-weight: 700;
  font-size: 30px; letter-spacing: 0.16em; color: ${YELLOW};
  border: 3px solid ${YELLOW}; border-radius: 999px; padding: 10px 26px;
}
.lines { margin-top: 34px; text-align: center; }
.line {
  font-weight: 900; font-size: 62px; line-height: 1.42; letter-spacing: 0.01em;
  display: inline-block; white-space: nowrap;
}
/* 黄色マーカーは文字の下2/3に敷く。全部塗ると読みにくい */
.hi { background: linear-gradient(transparent 58%, rgba(255,210,63,0.92) 58%); color: #fff; }
${end ? `.line:first-child { font-size: 74px; }` : ""}
.stage { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; margin-top: 26px; }
.phone {
  height: 100%; border: 8px solid ${PAPER_50}; border-radius: 42px; overflow: hidden;
  box-shadow: 0 0 0 3px ${INK}, 26px 26px 0 rgba(0,0,0,0.45);
  background: #fff; transform: rotate(-1.2deg);
}
.phone img { height: 100%; display: block; }
.foot {
  margin-top: 26px; display: flex; align-items: center; gap: 16px;
  font-weight: 700; font-size: 30px; color: ${PAPER_200}; text-align: center;
}
.icon { width: 62px; height: 62px; border-radius: 15px; border: 3px solid ${PAPER_50}; }
</style></head><body>
  <div class="kicker">${esc(kicker)}</div>
  <div class="lines">
    ${lines.map((l) => `<div><span class="line">${mark(l, hi)}</span></div>`).join("\n    ")}
  </div>
  <div class="stage"><div class="phone"><img src="${shotDataUri}"></div></div>
  <div class="foot">${end ? `<img class="icon" src="${iconDataUri}">` : ""}<span>${esc(foot)}</span></div>
</body></html>`;
}

/* ───────── 1. カットごとの板を撮る ───────── */
await rm(WORK_DIR, { recursive: true, force: true });
await mkdir(WORK_DIR, { recursive: true });

const iconDataUri = `data:image/webp;base64,${(
  await readFile(path.join(ROOT, "public/academy/icon.webp"))
).toString("base64")}`;

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

for (const [i, cut] of CUTS.entries()) {
  const shotPath = path.join(SHOTS, cut.shot);
  if (!(await exists(shotPath))) {
    console.error(`スクショが無い: ${shotPath}\nApp Store提出用のスクショを先に作ること`);
    process.exit(1);
  }
  const shotDataUri = `data:image/png;base64,${(await readFile(shotPath)).toString("base64")}`;
  await page.setContent(frameHtml({ ...cut, shotDataUri, iconDataUri }), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  /* テロップは折り返さない（nowrap）ぶん、長い行は自動で縮める。
     文言を書き換えたときに、1文字だけ次の行に落ちる事故を防ぐため。
     ここを外すと、行が枠の外へ伸びて切れる */
  await page.evaluate((maxW) => {
    for (const el of document.querySelectorAll(".line")) {
      const size = parseFloat(getComputedStyle(el).fontSize);
      const w = el.scrollWidth;
      if (w > maxW) el.style.fontSize = `${Math.max(40, Math.floor(size * (maxW / w)))}px`;
    }
  }, W - 128); /* 左右の padding 64px ぶんを引いた実寸 */
  await page.screenshot({ path: path.join(WORK_DIR, `frame${i}.png`) });
  console.log(`  ✔ カット${i + 1} ${cut.lines.join(" ")}`);
}
await browser.close();

/* ───────── 2. 静止画をゆっくり寄せて動画にする ───────── */
/* zoompan は入力を拡大してから使う。原寸のまま掛けると、
   拡大率が変わる瞬間に1px単位で絵が跳ねる（カクつきの正体） */
const frames = Math.round(CUT_SEC * FPS);
for (const [i, cut] of CUTS.entries()) {
  const z =
    cut.zoom === "out"
      ? `1.06-0.06*on/${frames}` /* 引き */
      : `1+0.06*on/${frames}`; /* 寄り */
  execFileSync(
    FFMPEG,
    [
      "-y", "-loglevel", "error",
      "-loop", "1", "-i", path.join(WORK_DIR, `frame${i}.png`),
      "-t", String(CUT_SEC),
      "-filter_complex",
      `[0:v]scale=${W * 2}:${H * 2},zoompan=z='${z}':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}`,
      "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
      path.join(WORK_DIR, `seg${i}.mp4`),
    ],
    { stdio: "inherit" }
  );
  console.log(`  ✔ seg${i}.mp4（${cut.zoom === "out" ? "引き" : "寄り"}）`);
}

/* ───────── 3. クロスフェードでつなぎ、進みぐあいのバーを引く ───────── */
await mkdir(OUT_DIR, { recursive: true });
const outMp4 = path.join(OUT_DIR, "comixai-academy.mp4");

const inputs = CUTS.flatMap((_, i) => ["-i", path.join(WORK_DIR, `seg${i}.mp4`)]);
let chain = "";
let prev = "0:v";
for (let i = 1; i < CUTS.length; i++) {
  /* オフセットは累積で「カット長 − フェード長」ずつ */
  const offset = (CUT_SEC - XFADE_SEC) * i;
  const label = i === CUTS.length - 1 ? "xf" : `x${i}`;
  chain += `[${prev}][${i}:v]xfade=transition=fade:duration=${XFADE_SEC}:offset=${offset.toFixed(2)}[${label}];`;
  prev = label;
}
/* 下端の黄色いバー。残り時間が見えると最後まで見てもらいやすい */
chain += `[xf]drawbox=x=0:y=${H - 14}:w='iw*t/${TOTAL_SEC}':h=14:color=${YELLOW.replace("#", "0x")}@1:t=fill[v]`;

execFileSync(
  FFMPEG,
  [
    "-y", "-loglevel", "error",
    ...inputs,
    "-filter_complex", chain,
    "-map", "[v]",
    "-r", String(FPS),
    "-an", "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outMp4,
  ],
  { stdio: "inherit" }
);

/* ───────── 4. 投稿用の文言 ───────── */
const txt = `【タイトル】
3Dの相棒と、遊んで学ぶ生成AI｜COMIXAI アカデミー

【説明文】
「AIって、けっきょく何ができて、何がダメなの？」
その疑問に“読む”ではなく“遊ぶ”で答える学習アプリを作りました。

・5コース／全17レッスン（1本2〜3分）
・レッスンに挟まる9種のミニゲーム
・書いたプロンプトをAIが添削
・登録不要・広告なし・完全無料

iPhone / iPad — まもなく公開
https://comixai.dev/academy

【ハッシュタグ】
#生成AI #AI学習 #プロンプト #個人開発 #アプリ #ChatGPT #Claude #AIリテラシー

【尺】${TOTAL_SEC.toFixed(1)}秒／${W}×${H}／音声なし（BGMは投稿先のアプリで付ける）
`;
await writeFile(path.join(OUT_DIR, "comixai-academy.txt"), txt);

if (!KEEP) await rm(WORK_DIR, { recursive: true, force: true });

console.log(`\n✔ ${path.relative(ROOT, outMp4)}（${TOTAL_SEC.toFixed(1)}秒）`);
console.log(`✔ ${path.relative(ROOT, path.join(OUT_DIR, "comixai-academy.txt"))}`);
