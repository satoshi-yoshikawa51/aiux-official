/* ============================================================
   日本語フォントのサブセット化。

   Zen Kaku Gothic New / Yusei Magic のTTFは1本2〜3MBある。
   全部入れると10MB超になるので、「このアプリで出る可能性のある文字」
   だけを残して軽くする。

   残す文字の集合＝
     ① このアプリのソースに出てくる全文字（＝いま表示される文字すべて）
     ② サイト本体のソースに出てくる全文字
        （用語集・ガイド・プロンプト集。今後レッスンを足すときの語彙は
          ほぼここから来るので、先回りして入れておく）
     ③ ひらがな・カタカナ・英数記号・約物の全域（機械的に生成される文字対策）

   ■ レッスンを増やして「□」（豆腐）が出たら
      このスクリプトを再実行すれば、その文字が入る。
        npm run fonts:subset
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import subsetFont from 'subset-font';

const APP_SRC = new URL('../src', import.meta.url).pathname;
const SITE_SRC = new URL('../../src/app', import.meta.url).pathname;
const RAW = process.env.RAW_FONTS ?? new URL('../assets/fonts/_raw', import.meta.url).pathname;
const OUT = new URL('../assets/fonts', import.meta.url).pathname;

/** 拡張子で絞ってテキストを全部読む */
function collect(dir, exts, acc = new Set()) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue;
      collect(p, exts, acc);
    } else if (exts.some((x) => e.name.endsWith(x))) {
      for (const ch of fs.readFileSync(p, 'utf8')) acc.add(ch);
    }
  }
  return acc;
}

const chars = collect(APP_SRC, ['.ts', '.tsx']);
collect(SITE_SRC, ['.ts', '.tsx', '.json'], chars);

/** コードポイント範囲をまとめて足す */
const addRange = (from, to) => {
  for (let c = from; c <= to; c++) chars.add(String.fromCodePoint(c));
};
addRange(0x20, 0x7e); // ASCII
addRange(0x3041, 0x309f); // ひらがな
addRange(0x30a0, 0x30ff); // カタカナ
addRange(0x3000, 0x303f); // CJKの約物（、。「」…）
addRange(0xff01, 0xff5e); // 全角英数記号
addRange(0xffe0, 0xffe6); // ￥ ￡ など
for (const ch of '±×÷≒≠≦≧∞←↑→↓⇒⇔〜※°′″℃¥＄') chars.add(ch);

/* サロゲートペア（絵文字など）は端末の絵文字フォントが描くので落とす */
const text = [...chars].filter((c) => c.codePointAt(0) <= 0xffff).join('');
console.log('残す文字数:', text.length);

/* 元のTTF（フルセット・合計10MBほど）はリポジトリに入れていないので、
   無ければGoogle Fontsから取り直す。UAを古めにするとTTFで配信される。 */
const SOURCES = {
  'ZenKakuGothicNew-Regular.ttf': 'Zen+Kaku+Gothic+New:wght@400',
  'ZenKakuGothicNew-Bold.ttf': 'Zen+Kaku+Gothic+New:wght@700',
  'ZenKakuGothicNew-Black.ttf': 'Zen+Kaku+Gothic+New:wght@900',
  'YuseiMagic-Regular.ttf': 'Yusei+Magic',
  'JetBrainsMono-Bold.ttf': 'JetBrains+Mono:wght@700',
};

async function ensureRaw() {
  fs.mkdirSync(RAW, { recursive: true });
  for (const [name, family] of Object.entries(SOURCES)) {
    const dest = path.join(RAW, name);
    if (fs.existsSync(dest)) continue;
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then((r) => r.text());
    const url = css.match(/https:\/\/fonts\.gstatic\.com\/\S+?\.ttf/)?.[0];
    if (!url) throw new Error(`TTFのURLが見つからない: ${family}`);
    const buf = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
    fs.writeFileSync(dest, buf);
    console.log('取得:', name, `${(buf.length / 1024 / 1024).toFixed(1)}MB`);
  }
}

await ensureRaw();
const files = fs.readdirSync(RAW).filter((f) => f.endsWith('.ttf'));
if (files.length === 0) throw new Error(`元のTTFが無い: ${RAW}`);

fs.mkdirSync(OUT, { recursive: true });
for (const file of files) {
  const src = fs.readFileSync(path.join(RAW, file));
  const out = await subsetFont(src, text, { targetFormat: 'truetype' });
  const dest = path.join(OUT, file);
  fs.writeFileSync(dest, out);
  console.log(
    `${file}: ${(src.length / 1024 / 1024).toFixed(2)}MB -> ${(out.length / 1024).toFixed(0)}KB`,
  );
}
