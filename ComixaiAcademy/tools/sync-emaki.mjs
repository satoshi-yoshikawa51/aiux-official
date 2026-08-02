/* ============================================================
   サイトの「AI歴史絵巻」（/history）を、アプリのオープニング用に取り込む。

   ・src/app/history/eras.ts（サイト側）を読んで src/data/emaki.ts を書き出す
   ・public/history/<year>.webp を assets/images/emaki/ にコピーする

   サイト側の年表を直したら、これを実行して取り込み直すこと。
   **src/data/emaki.ts は自動生成なので手で編集しない。**

   動画（mp4, 計8MB）は取り込まない。アプリに積むには重すぎるし、
   1コマずつボタンで送る見せ方なら静止画で足りる。

   使い方:
     node tools/sync-emaki.mjs
     （= npm run emaki）
   ============================================================ */
import { mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(APP, '..');
const IMG_DIR = path.join(APP, 'assets/images/emaki');
const OUT = path.join(APP, 'src/data/emaki.ts');

const { ERAS } = await import(pathToFileURL(path.join(SITE, 'src/app/history/eras.ts')).href);

await mkdir(IMG_DIR, { recursive: true });

/** "2024-25" のような年もファイル名になっているので、そのまま使う */
const slugOf = (era) => era.year;

const kept = [];
for (const era of ERAS) {
  const slug = slugOf(era);
  const src = path.join(SITE, 'public/history', `${slug}.webp`);
  try {
    await access(src);
  } catch {
    console.log(`  ! ${slug}.webp が無いので飛ばす`);
    continue;
  }
  await copyFile(src, path.join(IMG_DIR, `${slug}.webp`));
  kept.push({ slug, era });
  console.log(`  ✔ ${slug}.webp`);
}

const q = (s) => JSON.stringify(s ?? '');

const body = `/* ============================================================
   AI歴史絵巻。起動時のオープニングで1コマずつ見せる。

   **このファイルは tools/sync-emaki.mjs が作る。手で編集しない。**
   直したいときはサイト側の src/app/history/eras.ts を直して、
   npm run emaki を実行すること。

   絵は assets/images/emaki/ に置いてある（サイトの public/history から
   コピーしたもの）。動画は重いので取り込んでいない。
   ============================================================ */

export interface EmakiPanel {
  /** 年（"2024-25" のような表記もある） */
  year: string;
  title: string;
  body: string;
  /** 手書きふうのツッコミ */
  hand?: string;
  /** 冬の時代か、ブームか。コマの色みを変えるのに使う */
  tone?: 'winter' | 'boom';
  /** require したコマ絵 */
  image: number;
}

export const EMAKI: EmakiPanel[] = [
${kept
  .map(
    ({ slug, era }) => `  {
    year: ${q(era.year)},
    title: ${q(era.title)},
    body: ${q(era.body)},${era.hand ? `\n    hand: ${q(era.hand)},` : ''}${
      era.tone ? `\n    tone: '${era.tone}',` : ''
    }
    image: require('@/assets/images/emaki/${slug}.webp'),
  },`,
  )
  .join('\n')}
];
`;

await writeFile(OUT, body, 'utf8');
console.log(`\n-> ${path.relative(APP, OUT)}  （${kept.length}コマ）`);
