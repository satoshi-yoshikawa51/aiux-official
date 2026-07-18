/* ============================================================
   AI系ニュースのRSSから最新の見出しを取得し、
   src/app/calendar/news-headlines.json を更新するスクリプト。
   /calendar の「今日のAIニュース」欄で使う。

   使い方:  node scripts/fetch-ai-news.mjs
   （外部に到達できる環境で実行する。CIからは
     .github/workflows/refresh-ai-news.yml で毎朝実行される）

   方針:
   ・載せるのは見出し・出典名・リンクのみ（本文は転載しない）
   ・直近3日以内の記事から、1媒体あたり最大4本・合計12本
   ・フィード単位で失敗しても他のフィードは処理を続行
   ・全フィード失敗時は既存のJSONを維持する
   ============================================================ */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_PATH = path.join(ROOT, "src/app/calendar/news-headlines.json");

const FEEDS = [
  { source: "ITmedia AI＋", lang: "ja", url: "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml" },
  { source: "Ledge.ai", lang: "ja", url: "https://ledge.ai/feed/" },
  { source: "TechCrunch", lang: "en", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { source: "The Verge", lang: "en", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
];

const MAX_PER_FEED = 4;
const MAX_TOTAL = 12;
const MAX_AGE_DAYS = 3;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const stripHtml = (s) =>
  (s || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1] : "";
}

/* RSS2.0の<item>とAtomの<entry>の両対応 */
function parseFeed(xml, feed) {
  const blocks = [
    ...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g),
    ...xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/g),
  ].map((m) => m[1]);
  const items = [];
  for (const b of blocks) {
    const title = stripHtml(pick(b, "title"));
    let link = stripHtml(pick(b, "link"));
    if (!link) {
      const href = b.match(/<link[^>]*href="([^"]+)"/);
      link = href ? href[1] : "";
    }
    const dateRaw =
      stripHtml(pick(b, "pubDate")) ||
      stripHtml(pick(b, "dc:date")) ||
      stripHtml(pick(b, "published")) ||
      stripHtml(pick(b, "updated"));
    const d = new Date(dateRaw);
    if (!title || !link || Number.isNaN(d.getTime())) continue;
    items.push({
      title,
      url: link.split("?utm")[0],
      source: feed.source,
      lang: feed.lang,
      date: d.toISOString(),
    });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    });
    console.log(`  GET ${feed.url} -> ${res.status}`);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseFeed(xml, feed);
    console.log(`    ${feed.source}: ${items.length}本`);
    return items;
  } catch (e) {
    console.log(`  ✗ ${feed.source} の取得に失敗: ${e.message}`);
    return [];
  }
}

console.log("AIニュースの見出しを取得します…");
const all = (await Promise.all(FEEDS.map(fetchFeed))).flat();

if (all.length === 0) {
  console.log("全フィードの取得に失敗しました。既存のJSONを維持します。");
  process.exit(0);
}

const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 3600 * 1000;
const fresh = all.filter((a) => new Date(a.date).getTime() >= cutoff);

/* 媒体ごとに新しい順で上限本数、全体を日付降順で上限本数に */
const perFeed = new Map();
const picked = [];
for (const a of fresh.sort((x, y) => (x.date < y.date ? 1 : -1))) {
  const n = perFeed.get(a.source) ?? 0;
  if (n >= MAX_PER_FEED) continue;
  perFeed.set(a.source, n + 1);
  picked.push(a);
  if (picked.length >= MAX_TOTAL) break;
}

await writeFile(
  OUT_PATH,
  JSON.stringify(
    {
      _comment:
        "AIニュースの見出し（自動生成）。scripts/fetch-ai-news.mjs が毎朝更新する。手で編集しないこと。",
      updatedAt: new Date().toISOString(),
      items: picked,
    },
    null,
    2
  ) + "\n"
);
console.log(`✔ news-headlines.json を更新しました（${picked.length}本）`);
