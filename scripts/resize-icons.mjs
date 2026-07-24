/* ============================================================
   小さく表示される画像を、表示サイズに見合った解像度に落とす
   スクリプト。円形アバターのように「54pxの枠に900pxの画像を
   送っている」箇所を潰すためのもの。

   使い方:
     node scripts/resize-icons.mjs
     （npm run img:icons でも実行できる）

   やっていること:
     ①CSSの object-fit:cover / object-position と同じ規則で
       正方形に切り出す（＝ブラウザ側の見え方を変えない）
     ②表示サイズの3倍（高DPI端末ぶん）に縮小してWebPで書き出す

   元画像を別用途で使っている場合は out を別名にすること。
   例）portrait.png は /profile で原寸表示しているので上書きしない。
   ============================================================ */
import { execSync } from "node:child_process";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

/* box   = CSSでの最大表示サイズ(px)。出力はこの3倍の正方形になる
   pos   = object-position（切り出し位置）。CSSの指定と揃えること
   out   = 出力先。省略時は src を上書きする */
const TARGETS = [
  {
    // 用語集150ページ＋プロンプト24ページの著者カード（54px）で使う
    src: "profile/portrait.png",
    out: "profile/portrait-icon.webp",
    box: 54,
    pos: { x: 0.5, y: 0 }, // object-position: top
  },
  {
    // トップのAI受付バブル(36px)、同チャット(44px)、/uketsuke(30px)
    src: "uketsuke/char.webp",
    box: 44,
    pos: { x: 0.5, y: 0.04 }, // object-position: 50% 4%
  },
];

const DPR = 3;
const QUALITY = 0.92;

const npmRoot = execSync("npm root -g").toString().trim();
const { chromium } = await import(
  pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href
);
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
/* file:// 同士の読み込みを許可しないと canvas が汚染扱いになり
   toDataURL() が SecurityError で落ちる */
const browser = await chromium.launch({
  executablePath,
  args: ["--allow-file-access-from-files"],
});
const page = await browser.newPage();
/* file:// のimageをcanvasに描くため、同じ file:// オリジンにページを置く */
await page.goto(pathToFileURL(path.join(PUBLIC, "profile/portrait.png")).href);

for (const t of TARGETS) {
  const srcAbs = path.join(PUBLIC, t.src);
  const outAbs = path.join(PUBLIC, t.out || t.src);
  const before = (await stat(srcAbs)).size;
  const side = t.box * DPR;

  const dataUrl = await page.evaluate(
    async ({ url, side, pos, quality }) => {
      const im = new Image();
      await new Promise((res, rej) => {
        im.onload = res;
        im.onerror = rej;
        im.src = url;
      });
      /* object-fit:cover と同じ切り出し（正方形の枠に入れる場合） */
      const crop = Math.min(im.naturalWidth, im.naturalHeight);
      const sx = (im.naturalWidth - crop) * pos.x;
      const sy = (im.naturalHeight - crop) * pos.y;

      const cv = document.createElement("canvas");
      cv.width = side;
      cv.height = side;
      const ctx = cv.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(im, sx, sy, crop, crop, 0, 0, side, side);
      return cv.toDataURL("image/webp", quality);
    },
    { url: pathToFileURL(srcAbs).href, side, pos: t.pos, quality: QUALITY }
  );

  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  await writeFile(outAbs, buf);
  const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
  console.log(
    `  ✔ ${t.out || t.src}  ${side}×${side}  ${kb(before)} → ${kb(buf.length)}`
  );
}

await browser.close();
