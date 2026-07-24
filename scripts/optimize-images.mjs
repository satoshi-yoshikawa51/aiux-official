/* ============================================================
   ページ表示に使う画像を軽量化するスクリプト。
   小さい枠に原寸を送っているアイコンや、PNGのまま貼っている
   大きい画像を、表示に見合ったサイズ・形式に落とす。

   使い方:
     node scripts/optimize-images.mjs
     （npm run img:optimize でも実行できる）

   2つのモードがある:
     ①アイコン（box を指定）
       CSSの object-fit:cover / object-position と同じ規則で正方形に
       切り出し、表示サイズの3倍（高DPI端末ぶん）に縮小する。
       ブラウザ側の見え方は変わらない。
     ②再エンコード（box を指定しない）
       原寸のままWebPにするだけ。こちらは非可逆なので、線画や
       文字が乗った画像を足すときは quality を上げて実物を確認する。

   注意1: out は必ず src と別名にすること。上書きにすると再実行の
     たびに非可逆変換が重なって画質が落ちていく。元画像は再生成の
     ためのマスターとして残す（portrait.png は /profile の原寸表示
     でも使っている）。
   注意2: OGP画像（SNSのカード表示用）はPNG/JPEGのまま残すこと。
     WebPを解釈しないサービスがあるため、表示用だけ差し替える。
   ============================================================ */
import { execSync } from "node:child_process";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

/* src     = 元画像（public/ からの相対パス）
   out     = 出力先。省略時は src を上書きする
   box     = ①アイコンモード。CSSでの最大表示サイズ(px)
   pos     = 切り出し位置。CSSの object-position と揃えること
   quality = WebPの品質(0-1)。省略時は 0.92 */
const TARGETS = [
  {
    // 用語集150ページ＋プロンプト24ページの著者カード（54px）
    src: "profile/portrait.png",
    out: "profile/portrait-icon.webp",
    box: 54,
    pos: { x: 0.5, y: 0 }, // object-position: top
  },
  {
    // トップのAI受付バブル(36px)、同チャット(44px)、/uketsuke(30px)
    src: "uketsuke/char.webp",
    out: "uketsuke/char-icon.webp",
    box: 44,
    pos: { x: 0.5, y: 0.04 }, // object-position: 50% 4%
  },
  {
    // /profile のヒーロー写真（PCで約490px幅・高DPIぶんの原寸を維持）。
    // 元の portrait.png は構造化データ(jsonld.ts)の image で使い続ける。
    src: "profile/portrait.png",
    out: "profile/portrait.webp",
    quality: 0.9,
  },
  {
    // トップページの教習所バナー（PCで486px幅・高DPIぶんの原寸を維持）。
    // 元の ogp.png は /claude-app のOGP画像として使い続けるので残す。
    // 線画ロゴと小さい文字が乗っているぶん品質は高めに取る。
    src: "claude-app/ogp.png",
    out: "claude-app/banner.webp",
    quality: 0.94,
  },
];

const DPR = 3;
const DEFAULT_QUALITY = 0.92;

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

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;

for (const t of TARGETS) {
  const srcAbs = path.join(PUBLIC, t.src);
  const outAbs = path.join(PUBLIC, t.out || t.src);
  const before = (await stat(srcAbs)).size;

  const { dataUrl, size } = await page.evaluate(
    async ({ url, box, pos, quality, dpr }) => {
      const im = new Image();
      await new Promise((res, rej) => {
        im.onload = res;
        im.onerror = rej;
        im.src = url;
      });

      const cv = document.createElement("canvas");
      const ctx = cv.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (box) {
        /* ①アイコン: object-fit:cover と同じ切り出し（正方形の枠） */
        const side = box * dpr;
        const crop = Math.min(im.naturalWidth, im.naturalHeight);
        const sx = (im.naturalWidth - crop) * pos.x;
        const sy = (im.naturalHeight - crop) * pos.y;
        cv.width = side;
        cv.height = side;
        ctx.drawImage(im, sx, sy, crop, crop, 0, 0, side, side);
      } else {
        /* ②再エンコード: 原寸のまま */
        cv.width = im.naturalWidth;
        cv.height = im.naturalHeight;
        ctx.drawImage(im, 0, 0);
      }

      return {
        dataUrl: cv.toDataURL("image/webp", quality),
        size: `${cv.width}×${cv.height}`,
      };
    },
    {
      url: pathToFileURL(srcAbs).href,
      box: t.box || null,
      pos: t.pos || { x: 0.5, y: 0.5 },
      quality: t.quality ?? DEFAULT_QUALITY,
      dpr: DPR,
    }
  );

  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  await writeFile(outAbs, buf);
  console.log(`  ✔ ${t.out || t.src}  ${size}  ${kb(before)} → ${kb(buf.length)}`);
}

await browser.close();
