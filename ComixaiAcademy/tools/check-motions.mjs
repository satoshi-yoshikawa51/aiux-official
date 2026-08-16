/* 相棒のGLBに、11種のモーションが全部入っているか確かめる。

   ▍なぜ要るのか
   transcode-avatar.mjs は、tools/anim-names/<id>.json の対応表に**無い
   トラックを黙って捨てる**。表を1行書き忘れると、そのモーションだけが
   欠けたGLBができて、ビルドも型チェックも通ってしまう。

   実際に踏んだ：あとから足した4体は walk の対応づけが抜けていて、
   オンボーディングで**足を止めたまま横に滑って登場**していた。
   アプリ側は待機に落として耐えるようにしたが（→ src/avatar/Avatar3D.tsx）、
   欠けていること自体はここで気づきたい。

   使い方:
     node tools/check-motions.mjs
   欠けがあれば終了コード1。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODELS = path.join(HERE, '..', 'assets', 'models');

/* src/avatar/motions.ts の MOTIONS と同じ11種。**増やしたら両方直す** */
const MOTIONS = [
  'laugh',
  'wave',
  'bow',
  'idle-a',
  'arms-crossed',
  'walk',
  'scared',
  'angry',
  'worried',
  'idle-b',
  'explain',
];

/** GLBの先頭のJSONチャンクだけ読む（12バイトのヘッダ → 長さ4/種別4/中身） */
function readGlbJson(file) {
  const buf = fs.readFileSync(file);
  return JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
}

let ng = 0;
for (const f of fs.readdirSync(MODELS).filter((n) => n.endsWith('.glb')).sort()) {
  const names = new Set((readGlbJson(path.join(MODELS, f)).animations ?? []).map((a) => a.name));
  const missing = MOTIONS.filter((m) => !names.has(m));
  const id = f.replace(/\.glb$/, '');
  if (!missing.length) {
    console.log(`○ ${id}  11種そろっています`);
    continue;
  }
  ng += 1;
  console.log(`★ ${id}  足りない: ${missing.join(', ')}`);
  /* 対応表のどの番号が空いているかまで出す。**そこが欠けたモーション** */
  const table = path.join(HERE, 'anim-names', `${id}.json`);
  if (fs.existsSync(table)) {
    const map = JSON.parse(fs.readFileSync(table, 'utf8'));
    /* Tripoは1本目だけ番号なしの "NlaTrack"、以降 "NlaTrack.001" … と振る。
       表に書かれていない番号＝**捨てられたトラック**なので、そこが欠けた動き */
    const used = new Set(Object.keys(map));
    const all = ['NlaTrack', ...Array.from({ length: 10 }, (_, i) => `NlaTrack.${String(i + 1).padStart(3, '0')}`)];
    const gaps = all.filter((k) => !used.has(k));
    if (gaps.length) {
      console.log(`   tools/anim-names/${id}.json で対応づけていない番号: ${gaps.join(', ')}`);
      console.log(`   → "${gaps[0]}": "${missing[0]}" を足して焼き直す`);
    }
  }
}

if (ng) {
  console.log(`\n${ng}体に欠けがあります。`);
  console.log('直し方は README の「新しい相棒を足す」を見てください。');
  process.exit(1);
}
console.log('\n全員そろっています。');
