/* ============================================================
   サイトの「AI歴史絵巻」（/history）を、アプリのオープニング用に取り込む。

   ・src/app/history/eras.ts（サイト側）を読んで src/data/emaki.ts を書き出す
   ・public/history/<year>.webp を assets/images/emaki/ にコピーする

   サイト側の年表を直したら、これを実行して取り込み直すこと。
   **src/data/emaki.ts は自動生成なので手で編集しない。**

   ▍動画はコピーしない。URLだけ持つ
   mp4は14本で7MB。**1回しか見ない画面のためにアプリを7MB太らせない。**
   サイトが同じものを配信しているので、そのURLを書き出して、
   アプリ側は再生時に取りにいく。届くまでは静止画が出ているので、
   電波が悪くても絵巻は成立する（動画が出ないだけ）。

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

/** 動画の配信元。ローカルで別の場所に向けたいときはここを変える */
const SITE_ORIGIN = process.env.EMAKI_ORIGIN ?? 'https://comixai.dev';

const body = `/* ============================================================
   AI歴史絵巻。起動時のオープニングで1コマずつ見せる。

   **このファイルは tools/sync-emaki.mjs が作る。手で編集しない。**
   直したいときはサイト側の src/app/history/eras.ts を直して、
   npm run emaki を実行すること。

   絵は assets/images/emaki/ に置いてある（サイトの public/history から
   コピーしたもの）。**動画はアプリに積まず、サイトから取りにいく**
   （14本で7MBあり、1回しか見ない画面のために積むには重い）。
   届くまでは静止画が出るので、電波が悪くても絵巻は成立する。
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
  /** require したコマ絵。動画が届くまでこれが出る */
  image: number;
  /** 動画のURL。アプリには積まず、サイトから取りにいく */
  video: string;
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
    video: '${SITE_ORIGIN}/history/${slug}.mp4',
  },`,
  )
  .join('\n')}
];
`;

await writeFile(OUT, body, 'utf8');
console.log(`\n-> ${path.relative(APP, OUT)}  （${kept.length}コマ）`);
