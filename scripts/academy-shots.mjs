/* ============================================================
   スマホアプリ「COMIXAI アカデミー」の紹介ページ(/academy)に貼る
   スクリーンショットを、審査提出用の原寸PNGから軽量WebPに落とす。

   使い方:
     node scripts/academy-shots.mjs
     （npm run academy:shots でも実行できる）

   元画像は ComixaiAcademy/docs/screenshots/iphone69-*.png（1290×2796）。
   **App Store提出に使うのはあくまでPNGのほう**なので、ここでは
   別ディレクトリ(public/academy/shots/)へ書き出すだけで上書きしない。

   幅620pxに落としているのは、LPでの最大表示が約300px＝高DPIの2倍で
   足りるため。原寸のままだと1枚3MBあり、5枚でLPが重くなりすぎる。

   アプリの画面を撮り直したら（審査スクショの作り直し）、これも流す。
   ============================================================ */
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join(ROOT, "ComixaiAcademy/docs/screenshots");
const OUT_DIR = path.join(ROOT, "public/academy/shots");

/* 表示幅620px（高DPIぶんを含む）。高さは元の比率のまま */
const WIDTH = 620;
const QUALITY = 82;

/* sharp はサイト本体の依存に入れていないので、グローバルから借りる
   （scripts/optimize-images.mjs と同じ作法） */
const npmRoot = execSync("npm root -g").toString().trim();
let sharp;
try {
  sharp = (await import(pathToFileURL(path.join(npmRoot, "sharp/lib/index.js")).href)).default;
} catch {
  sharp = (await import(pathToFileURL(path.join(ROOT, "node_modules/sharp/lib/index.js")).href)).default;
}

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(SRC_DIR)).filter((f) => f.startsWith("iphone69-") && f.endsWith(".png")).sort();
if (files.length === 0) {
  console.error(`スクショが見つかりません: ${SRC_DIR}`);
  process.exit(1);
}

for (const file of files) {
  /* iphone69-1-home.png → home.webp（並び順は data 側の配列で持つ） */
  const name = file.replace(/^iphone69-\d+-/, "").replace(/\.png$/, "");
  const src = path.join(SRC_DIR, file);
  const out = path.join(OUT_DIR, `${name}.webp`);
  const buf = await sharp(src).resize({ width: WIDTH }).webp({ quality: QUALITY }).toBuffer();
  await writeFile(out, buf);
  const before = (await stat(src)).size;
  console.log(`${file} → ${path.relative(ROOT, out)}  ${(before / 1024).toFixed(0)}KB → ${(buf.length / 1024).toFixed(0)}KB`);
}

/* アプリアイコン（原寸1024pxのPNG）も、LPの見出しに置くぶんだけ落とす */
const icon = await sharp(path.join(ROOT, "ComixaiAcademy/assets/images/icon.png"))
  .resize({ width: 320 })
  .webp({ quality: 90 })
  .toBuffer();
await writeFile(path.join(ROOT, "public/academy/icon.webp"), icon);
console.log(`icon.png → public/academy/icon.webp  ${(icon.length / 1024).toFixed(0)}KB`);

console.log(`\n${files.length}枚＋アイコンを書き出しました。`);
