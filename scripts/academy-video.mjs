/* ============================================================
   スマホアプリ「COMIXAI アカデミー」の宣伝動画（縦ショート）を作る。

     npm run academy:video

   仕組み:
     実機の画面録画を素材にする。サイトと同じ書体・デザイントークンで
     組んだ1080×1920の「板」をPlaywrightで撮り、その中央にくり抜いた
     端末の枠へ、録画を切り出して流し込む。カットはクロスフェードで
     つなぎ、下端に進みぐあいのバーを引く。

   ▍なぜ画面録画なのか（静止画に戻さないこと）
   最初は審査提出用のスクショ5枚で作ったが、**このアプリの売りは
   「動いていること」**——3Dの相棒が揺れる、文字がトークンに割れる、
   バッジが跳ねる、称号バーが伸びる、ガチャからカプセルが落ちる。
   静止画をどれだけ寄せ引きしても、そこは映らなかった。
   （静止画版は git の履歴に残っている）

   素材の置き場:
     academy-video/clips/*.mp4|mov  … 実機の画面収録（Git管理外）
   出力:
     academy-video/comixai-academy.mp4  … YouTube Shorts / TikTok / Reels / X 共用
     academy-video/comixai-academy.txt  … 投稿用のタイトル・説明文・タグ

   必要なもの（package.json には入れない。使う時だけ）:
     ffmpeg（PATH に無ければ `npm install --no-save ffmpeg-static`）
     Playwright（グローバル／ローカルどちらでも自動で拾う）

   ▍撮り直したときに触るのは CUTS だけ。
   in / out は素材の秒数。長さは out-in（speed を入れると割り算される）。
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
const CLIP_DIR = path.join(OUT_DIR, "clips");
const WORK_DIR = path.join(OUT_DIR, ".work");

const KEEP = process.argv.includes("--keep"); // 中間ファイルを残してデバッグ

const FPS = 30;
const XFADE_SEC = 0.4;
const W = 1080;
const H = 1920;

/* —— 素材の切り出し —— */
/* iPhone 16 Pro Max の画面収録は 1320×2868。上の SB_CROP px には
   時刻・電波・**録画中の赤い印**が入るので、宣伝物としては必ず落とす。
   下は安全領域の黒帯なので少しだけ詰める。 */
const SRC_W = 1320;
const SRC_H = 2868;
const SB_CROP = 180;
const BOTTOM_CROP = 40;
const CROP_H = SRC_H - SB_CROP - BOTTOM_CROP;

/* —— 板の中の端末（この数字はHTML側とffmpeg側で共有する） —— */
const PHONE_H = 1360;
const PHONE_W = Math.round((PHONE_H * SRC_W) / CROP_H / 2) * 2; // 偶数に丸める
const PHONE_X = Math.round((W - PHONE_W) / 2);
const PHONE_Y = 380;
const BEZEL = 8; // 端末の白フチ
const RADIUS = 38; // 画面の角丸（フチの外側は RADIUS+BEZEL）

/* —— デザイントークン（globals.cssと揃える） —— */
const INK = "#14110f";
const PAPER_50 = "#fbf7ef";
const PAPER_200 = "#e7dcc6";
const YELLOW = "#ffd23f";

/* —— 6カット。役割は 登場→中身→体験→ごほうび→ふえる→CTA ——
   hi: 黄色く塗る語（1カット1箇所まで。増やすと効かなくなる）
   speed: 1未満でゆっくり（CTAは読ませたいので少し落としてある） */
const CUTS = [
  {
    clip: "1-home.mp4",
    in: 2.2,
    out: 6.6,
    kicker: "NEW — iPhone / iPad",
    lines: ["遊んで学べるAI学習アプリ、", "登場。"],
    hi: "遊んで学べる",
    foot: "3Dの相棒が、あなたの先生になる",
  },
  {
    clip: "2-courses.mp4",
    in: 3.0,
    out: 7.2,
    kicker: "COURSES",
    lines: ["AIの基礎知識から、", "応用まで。"],
    hi: "基礎知識から、",
    foot: "5コース・全17レッスン／1本2〜3分",
  },
  {
    clip: "3-minigame.mp4",
    in: 23.8,
    out: 29.2,
    kicker: "MINI GAME",
    lines: ["AIとゲーム感覚で、", "遊びながら学べる。"],
    hi: "遊びながら学べる",
    foot: "文字がトークンに割れる——読むより、さわる",
  },
  {
    clip: "4-badge.mov",
    /* ▍ここだけ長い。称号が出るまで＝バッジ→修了→RANK UP の一続きで、
       途中で切るとオチが無くなる（out=6.8 だと「AI研修生」の字が
       次のカットへのフェードに飲まれた） */
    in: 0.8,
    out: 9.0,
    kicker: "BADGE & RANK",
    lines: ["そして集まるバッジ、", "積みあがる称号。"],
    hi: "積みあがる称号",
    foot: "バッジ25種・称号は5段階",
  },
  {
    clip: "5-gacha.mp4",
    in: 3.8,
    out: 9.7,
    kicker: "GACHA",
    lines: ["無料のガチャで、", "相棒もステージも増える。"],
    hi: "無料のガチャ",
    foot: "Pは学習でだけ貯まる。課金は、なし",
  },
  {
    clip: "5-gacha.mp4",
    in: 13.3,
    out: 17.0,
    speed: 0.8,
    kicker: "COMIXAI アカデミー",
    lines: ["さぁ、あなたも", "遊んでAIをおぼえよう！"],
    hi: "遊んでAIをおぼえよう",
    foot: "登録不要・広告なし・完全無料　comixai.dev/academy",
    end: true,
  },
];

const cutSec = (c) => (c.out - c.in) / (c.speed ?? 1);
const TOTAL_SEC = CUTS.reduce((n, c) => n + cutSec(c), 0) - (CUTS.length - 1) * XFADE_SEC;

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
  (await fontCss("zen-kaku-gothic-new", [500, 700, 900])) + (await fontCss("jetbrains-mono", [700]));

/* 板。端末の中身は録画をあとから重ねるので、ここでは白フチと
   内側の下地だけ描いておく（＝穴を開けるのと同じことをffmpeg側でやる） */
function boardHtml({ iconDataUri, kicker, lines, hi, foot, end }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: ${W}px; height: ${H}px; overflow: hidden; position: relative;
  font-family: "Zen Kaku Gothic New", sans-serif; color: ${PAPER_50};
  background: ${INK};
  background-image: radial-gradient(rgba(255,255,255,0.075) 2px, transparent 2.1px);
  background-size: 26px 26px;
}
.head { position: absolute; top: 92px; left: 0; right: 0; text-align: center; }
.kicker {
  display: inline-block;
  font-family: "JetBrains Mono", monospace; font-weight: 700;
  font-size: 29px; letter-spacing: 0.16em; color: ${YELLOW};
  border: 3px solid ${YELLOW}; border-radius: 999px; padding: 10px 26px;
}
.lines { margin-top: 26px; }
.line {
  font-weight: 900; font-size: 60px; line-height: 1.4; letter-spacing: 0.01em;
  display: inline-block; white-space: nowrap;
}
/* 黄色マーカーは文字の下2/3に敷く。全部塗ると読みにくい */
.hi { background: linear-gradient(transparent 58%, rgba(255,210,63,0.92) 58%); color: #fff; }
${end ? ".line:last-child { font-size: 66px; }" : ""}
/* 端末。白フチと内側の下地だけ。中身はffmpegが重ねる */
.bezel {
  position: absolute;
  left: ${PHONE_X - BEZEL}px; top: ${PHONE_Y - BEZEL}px;
  width: ${PHONE_W + BEZEL * 2}px; height: ${PHONE_H + BEZEL * 2}px;
  background: ${PAPER_50}; border-radius: ${RADIUS + BEZEL}px;
  box-shadow: 0 0 0 3px ${INK}, 24px 24px 0 rgba(0,0,0,0.45);
}
.screen {
  position: absolute; left: ${BEZEL}px; top: ${BEZEL}px;
  width: ${PHONE_W}px; height: ${PHONE_H}px;
  background: ${INK}; border-radius: ${RADIUS}px;
}
.foot {
  position: absolute; left: 0; right: 0; bottom: 96px;
  display: flex; align-items: center; justify-content: center; gap: 16px;
  font-weight: 700; font-size: 29px; color: ${PAPER_200};
}
.icon { width: 60px; height: 60px; border-radius: 14px; border: 3px solid ${PAPER_50}; }
</style></head><body>
  <div class="head">
    <div class="kicker">${esc(kicker)}</div>
    <div class="lines">
      ${lines.map((l) => `<div><span class="line">${mark(l, hi)}</span></div>`).join("\n      ")}
    </div>
  </div>
  <div class="bezel"><div class="screen"></div></div>
  <div class="foot">${end ? `<img class="icon" src="${iconDataUri}">` : ""}<span>${esc(foot)}</span></div>
</body></html>`;
}

/* 画面の角丸マスク。白＝見える／黒＝透ける（ffmpegの alphamerge 用） */
const maskHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; }
body { width: ${PHONE_W}px; height: ${PHONE_H}px; background: #000; }
div { width: ${PHONE_W}px; height: ${PHONE_H}px; background: #fff; border-radius: ${RADIUS}px; }
</style></head><body><div></div></body></html>`;

/* ───────── 1. 板とマスクを撮る ───────── */
if (!(await exists(CLIP_DIR))) {
  console.error(`素材が無い: ${CLIP_DIR}\n実機の画面収録を academy-video/clips/ に置くこと`);
  process.exit(1);
}
await rm(WORK_DIR, { recursive: true, force: true });
await mkdir(WORK_DIR, { recursive: true });

const iconDataUri = `data:image/webp;base64,${(
  await readFile(path.join(ROOT, "public/academy/icon.webp"))
).toString("base64")}`;

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

for (const [i, cut] of CUTS.entries()) {
  if (!(await exists(path.join(CLIP_DIR, cut.clip)))) {
    console.error(`素材が無い: ${path.join(CLIP_DIR, cut.clip)}`);
    process.exit(1);
  }
  await page.setContent(boardHtml({ ...cut, iconDataUri }), { waitUntil: "networkidle" });
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
  }, W - 120);
  await page.screenshot({ path: path.join(WORK_DIR, `board${i}.png`) });
  console.log(`  ✔ 板${i + 1} ${cut.lines.join("")}`);
}

const maskPage = await browser.newPage({ viewport: { width: PHONE_W, height: PHONE_H }, deviceScaleFactor: 1 });
await maskPage.setContent(maskHtml);
await maskPage.screenshot({ path: path.join(WORK_DIR, "mask.png") });
await browser.close();

/* ───────── 2. カットごとに、録画を板へ流し込む ───────── */
for (const [i, cut] of CUTS.entries()) {
  const speed = cut.speed ?? 1;
  const dur = cutSec(cut);
  const chain = [
    /* 上の時刻・録画中の赤い印を落として、板の穴の大きさへ */
    `[0:v]fps=${FPS},crop=${SRC_W}:${CROP_H}:0:${SB_CROP},scale=${PHONE_W}:${PHONE_H}` +
      (speed === 1 ? "" : `,setpts=PTS/${speed}`) +
      `,format=yuva420p[v0]`,
    /* 画面の角を丸める */
    `[v0][2:v]alphamerge[vr]`,
    /* 板の上へ置く */
    `[1:v][vr]overlay=${PHONE_X}:${PHONE_Y}:format=auto[out]`,
  ].join(";");

  execFileSync(
    FFMPEG,
    [
      "-y", "-loglevel", "error",
      "-ss", String(cut.in), "-to", String(cut.out), "-i", path.join(CLIP_DIR, cut.clip),
      "-loop", "1", "-i", path.join(WORK_DIR, `board${i}.png`),
      "-loop", "1", "-i", path.join(WORK_DIR, "mask.png"),
      "-filter_complex", chain,
      "-map", "[out]",
      "-t", dur.toFixed(3),
      "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
      path.join(WORK_DIR, `seg${i}.mp4`),
    ],
    { stdio: "inherit" }
  );
  console.log(`  ✔ seg${i}.mp4（${cut.clip} ${cut.in}〜${cut.out}s → ${dur.toFixed(1)}秒）`);
}

/* ───────── 3. クロスフェードでつなぎ、進みぐあいのバーを引く ───────── */
const outMp4 = path.join(OUT_DIR, "comixai-academy.mp4");
const inputs = CUTS.flatMap((_, i) => ["-i", path.join(WORK_DIR, `seg${i}.mp4`)]);

let chain = "";
let prev = "0:v";
let offset = 0;
for (let i = 1; i < CUTS.length; i++) {
  /* オフセットは「ここまでの実尺 − フェード長」の積み上げ。
     カットの長さがバラバラなので、固定値では合わない */
  offset += cutSec(CUTS[i - 1]) - XFADE_SEC;
  const label = i === CUTS.length - 1 ? "xf" : `x${i}`;
  chain += `[${prev}][${i}:v]xfade=transition=fade:duration=${XFADE_SEC}:offset=${offset.toFixed(3)}[${label}];`;
  prev = label;
}
/* 下端の黄色いバー。残り時間が見えると最後まで見てもらいやすい */
chain += `[xf]drawbox=x=0:y=${H - 14}:w='iw*t/${TOTAL_SEC.toFixed(3)}':h=14:color=${YELLOW.replace("#", "0x")}@1:t=fill[v]`;

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
遊んで学べるAI学習アプリ、登場｜COMIXAI アカデミー

【説明文】
「AIって、けっきょく何ができて、何がダメなの？」
その疑問に“読む”ではなく“遊ぶ”で答える学習アプリを作りました。

・3Dの相棒キャラクターがあなたの先生
・5コース／全17レッスン（1本2〜3分）
・レッスンに挟まる9種のミニゲーム
・書いたプロンプトをAIが添削
・バッジ25種と、AI見習い→AIマスターの称号
・学習で貯まるPだけで回るガチャ（課金なし）

登録不要・広告なし・完全無料。
iPhone / iPad — まもなく公開
https://comixai.dev/academy

【ハッシュタグ】
#生成AI #AI学習 #プロンプト #個人開発 #アプリ #ChatGPT #Claude #AIリテラシー

【尺】${TOTAL_SEC.toFixed(1)}秒／${W}×${H}／音声なし（BGMは投稿先のアプリで付ける）
`;
await writeFile(path.join(OUT_DIR, "comixai-academy.txt"), txt);

if (!KEEP) await rm(WORK_DIR, { recursive: true, force: true });

console.log(`\n✔ ${path.relative(ROOT, outMp4)}（${TOTAL_SEC.toFixed(1)}秒・端末 ${PHONE_W}×${PHONE_H}）`);
console.log(`✔ ${path.relative(ROOT, path.join(OUT_DIR, "comixai-academy.txt"))}`);
