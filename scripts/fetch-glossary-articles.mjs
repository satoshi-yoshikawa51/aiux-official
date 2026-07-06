/* ============================================================
   用語集(src/app/glossary/data.ts)がリンクしているnote記事のうち、
   既存データ（data.tsのARTICLES / manga/episodes.json）で解決
   できないものについて、タイトル・サムネ・概要・スキ数をnoteから
   取得し、src/app/glossary/article-meta.json に書き出すスクリプト。

   使い方:  node scripts/fetch-glossary-articles.mjs
   （note.comに到達できる環境で実行する。CIからは
     .github/workflows/refresh-manga-episodes.yml で実行できる）

   取得元は順にフォールバックする:
     1. ノートAPI  https://note.com/api/v3/notes/{key}
     2. 記事ページのOGPメタタグ
   badge / tone / excerpt は note-article-meta.json に手書きの
   エントリがあればそちらを優先する（自動取得で上書きしない）。
   取得に失敗した記事は、既存の article-meta.json の値を保持する。
   ============================================================ */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const GLOSSARY_DATA = path.join(ROOT, "src/app/glossary/data.ts");
const SITE_DATA = path.join(ROOT, "src/app/data.ts");
const EPISODES_PATH = path.join(ROOT, "src/app/manga/episodes.json");
const CURATED_PATH = path.join(ROOT, "src/app/note-article-meta.json");
const OUT_PATH = path.join(ROOT, "src/app/glossary/article-meta.json");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function get(url, accept) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "ja" },
  });
  const body = await res.text();
  console.log(`  GET ${url} -> ${res.status} (${body.length} bytes)`);
  if (!res.ok) return null;
  return body;
}

const decodeEntities = (s) =>
  (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .trim();

/* ノートAPI(v3)から取得 */
async function fromApi(key) {
  const body = await get(`https://note.com/api/v3/notes/${key}`, "application/json");
  if (!body) return null;
  try {
    const d = JSON.parse(body).data;
    if (!d?.name) return null;
    return {
      title: d.name,
      thumb: d.eyecatch || d.sp_eyecatch || undefined,
      likes: typeof d.like_count === "number" ? d.like_count : d.likeCount,
      excerpt: (d.description || "").trim() || undefined,
    };
  } catch {
    return null;
  }
}

/* 記事ページのOGPメタから取得 */
async function fromOgp(url) {
  const html = await get(url, "text/html");
  if (!html) return null;
  const pick = (prop) => {
    const m =
      html.match(new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]*)"`, "i")) ||
      html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="${prop}"`, "i"));
    return m ? decodeEntities(m[1]) : undefined;
  };
  const title = (pick("og:title") || "").replace(/｜.*$/, "").trim();
  if (!title) return null;
  return {
    title,
    thumb: pick("og:image"),
    excerpt: pick("og:description"),
  };
}

/* —— 対象URLの洗い出し —— */
const glossarySrc = await readFile(GLOSSARY_DATA, "utf8");
const linked = [...new Set(
  [...glossarySrc.matchAll(/href:\s*"(https:\/\/note\.com\/[^"]+)"/g)].map((m) => m[1])
)];

const siteSrc = await readFile(SITE_DATA, "utf8");
const inArticles = new Set([...siteSrc.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]));
const episodes = JSON.parse(await readFile(EPISODES_PATH, "utf8"));
const inEpisodes = new Set(
  Object.values(episodes.series).flatMap((s) => s.episodes).map((e) => e.url)
);

const targets = linked.filter((u) => !inArticles.has(u) && !inEpisodes.has(u));
console.log(`用語集のnoteリンク ${linked.length}件中、未解決 ${targets.length}件`);

const curated = JSON.parse(await readFile(CURATED_PATH, "utf8"));
let prev = {};
try {
  prev = JSON.parse(await readFile(OUT_PATH, "utf8"));
} catch {
  /* 初回は空でよい */
}

const out = {
  _comment:
    "用語集ページのLEARN MOREカード用のnote記事メタ（自動生成）。scripts/fetch-glossary-articles.mjs が更新します。badge/tone/excerpt を調整したい場合は note-article-meta.json に同じURLのエントリを書いてください。",
};

for (const url of targets) {
  const key = url.split("/").pop();
  console.log(`- ${url}`);
  const fetched = (await fromApi(key)) || (await fromOgp(url));
  const base = fetched || prev[url];
  if (!base) {
    console.log(`  ⚠ 取得失敗（既存データもなし）: ${url}`);
    continue;
  }
  const hand = curated[url] || {};
  out[url] = {
    title: base.title,
    excerpt: hand.excerpt || base.excerpt || undefined,
    thumb: base.thumb,
    likes: base.likes,
    badge: hand.badge || "note記事",
    tone: hand.tone || "paper",
  };
}

/* 未使用になったURLは自然に消える（targetsのみ書き出す） */
await writeFile(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
console.log(`article-meta.json を更新しました（${targets.length}件）`);
