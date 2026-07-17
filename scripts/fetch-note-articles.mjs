/* ============================================================
   noteのクリエイターページから全記事の一覧（タイトル・日付・
   スキ数・サムネ）を取得し、src/app/note-articles.json を更新する
   スクリプト。トップページの新着/人気タブはこのJSONから自動生成
   される（badge/tone/tags/excerpt の手書きメタは
   note-article-meta.json 側を優先）。

   使い方:  node scripts/fetch-note-articles.mjs
   （note.comに到達できる環境で実行する。CIからは
     .github/workflows/refresh-manga-episodes.yml で実行できる）

   取得元は順にフォールバックする:
     1. クリエイター記事API  /api/v2/creators/{user}/contents?kind=note&page=N
     2. クリエイターRSS      https://note.com/{user}/rss （直近分のみ）
   取得に失敗した場合は既存の note-articles.json をそのまま残す。
   ============================================================ */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_PATH = path.join(ROOT, "src/app/note-articles.json");
const CURATED_PATH = path.join(ROOT, "src/app/note-article-meta.json");

const USER = "aiux_unite";
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

const stripHtml = (s) =>
  (s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/* RSS/プレビュー本文から定型ノイズを除き、excerpt向けに短くする */
const cleanExcerpt = (s) => {
  let t = stripHtml(s)
    .replace(/^(こんにちは|こんばんは|おはようございます)[^。]*。\s*/,"")
    .replace(/続きをみる\s*$/, "")
    .trim();
  if (t.length > 80) t = t.slice(0, 79) + "…";
  return t;
};

const toDate = (s) => {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  /* JSTでの公開日として整形 */
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
};

/* —— 1. クリエイター記事API（全ページ辿る） —— */
async function fetchViaApi() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const body = await get(
      `https://note.com/api/v2/creators/${USER}/contents?kind=note&page=${page}`,
      "application/json"
    );
    if (!body) return null;
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      return null;
    }
    const contents = json?.data?.contents;
    if (!Array.isArray(contents)) return null;
    for (const c of contents) {
      if (!c?.key || !c?.name) continue;
      all.push({
        url: `https://note.com/${USER}/n/${c.key}`,
        title: stripHtml(c.name),
        date: toDate(c.publishAt || c.publish_at),
        likes: c.likeCount ?? c.like_count ?? 0,
        thumb: c.eyecatch || c.sp_eyecatch || undefined,
        excerpt: cleanExcerpt(c.body || ""),
      });
    }
    if (json?.data?.isLastPage !== false) break;
  }
  return all.length > 0 ? all : null;
}

/* —— 2. RSSフォールバック（直近分のみ） —— */
async function fetchViaRss() {
  const xml = await get(`https://note.com/${USER}/rss`, "application/rss+xml");
  if (!xml) return null;
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const pick = (block, tag) =>
    (block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)) || [])[1] || "";
  const unCdata = (s) => s.replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
  const out = items
    .map((b) => ({
      url: unCdata(pick(b, "link")).split("?")[0],
      title: stripHtml(unCdata(pick(b, "title"))),
      date: toDate(unCdata(pick(b, "pubDate"))),
      likes: Number(unCdata(pick(b, "note:likeCount")) || 0),
      thumb: unCdata(pick(b, "media:thumbnail")) || undefined,
      excerpt: cleanExcerpt(unCdata(pick(b, "description"))),
    }))
    .filter((a) => a.url.includes("/n/"));
  return out.length > 0 ? out : null;
}

/* —— メイン —— */
let existing = [];
try {
  existing = JSON.parse(await readFile(OUT_PATH, "utf8")).articles ?? [];
} catch {
  /* 初回はファイルなしでOK */
}

console.log("noteから記事一覧を取得します…");
let fetched = await fetchViaApi();
if (!fetched) {
  console.log("APIでの取得に失敗。RSSにフォールバックします。");
  fetched = await fetchViaRss();
}

if (!fetched) {
  console.log("取得に失敗しました。既存の note-articles.json を維持します。");
  process.exit(0);
}

/* 既存とマージ：RSSフォールバック時など、今回取れなかった過去記事は残す。
   同一URLは今回の取得値（新しいスキ数・タイトル）で上書き */
const byUrl = new Map(existing.map((a) => [a.url, a]));
for (const a of fetched) byUrl.set(a.url, { ...byUrl.get(a.url), ...a });

const articles = [...byUrl.values()].sort((a, b) =>
  (a.date || "") < (b.date || "") ? 1 : -1
);

/* 手書きメタ（badge/tone）が未登録の記事を警告する */
try {
  const curated = JSON.parse(await readFile(CURATED_PATH, "utf8"));
  for (const a of articles) {
    if (!curated[a.url]) {
      console.log(`⚠ メタ未登録（badge/toneはデフォルト表示になります）: ${a.title}`);
      console.log(`   → src/app/note-article-meta.json に "${a.url}" を追記すると整います`);
    }
  }
} catch {
  /* メタファイルが無くても致命ではない */
}

await writeFile(
  OUT_PATH,
  JSON.stringify(
    {
      _comment:
        "noteの記事一覧（自動生成）。scripts/fetch-note-articles.mjs が毎週更新する。手で編集しないこと。badge/tone/tags/excerptの手書きは note-article-meta.json 側へ。",
      updatedAt: new Date().toISOString().slice(0, 10),
      articles,
    },
    null,
    2
  ) + "\n"
);
console.log(`✔ note-articles.json を更新しました（全${articles.length}記事）`);
