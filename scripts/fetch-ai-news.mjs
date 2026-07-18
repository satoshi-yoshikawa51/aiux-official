/* ============================================================
   AI系ニュースのRSSから最新の見出しを取得し、
   src/app/calendar/news-headlines.json を更新するスクリプト。
   /calendar の「今日のAIニュース」欄で使う。

   使い方:  node scripts/fetch-ai-news.mjs
   （外部に到達できる環境で実行する。CIからは
     .github/workflows/refresh-ai-news.yml で毎朝実行される）

   方針:
   ・載せるのは見出し・出典名・リンクのみ（本文は転載しない）
   ・総合系フィードはAI関連キーワードで絞り込む
   ・「話題」枠として、はてなブックマークIT人気エントリからAI関連を採用
     （リンク先は元記事。Xの代替となる「日本で話題」のシグナル）
   ・英語見出しは日本語へ自動翻訳（失敗時は原文のまま）
   ・日本語8本＋海外6本を目安に、日付降順で掲載
   ・フィード単位で失敗しても他のフィードは処理を続行。
     全フィード失敗時は既存のJSONを維持する
   ============================================================ */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_PATH = path.join(ROOT, "src/app/calendar/news-headlines.json");

/* filter=true の総合フィードは、AI関連キーワードに一致した見出しだけ採用する */
const FEEDS = [
  { source: "ITmedia AI＋", lang: "ja", url: "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml" },
  { source: "Ledge.ai", lang: "ja", url: "https://ledge.ai/feed/" },
  { source: "Publickey", lang: "ja", url: "https://www.publickey1.jp/atom.xml", filter: true },
  { source: "ASCII.jp", lang: "ja", url: "https://ascii.jp/rss.xml", filter: true },
  { source: "GIZMODO JAPAN", lang: "ja", url: "https://www.gizmodo.jp/index.xml", filter: true },
  { source: "CNET Japan", lang: "ja", url: "https://feeds.japan.cnet.com/rss/cnet/all.rdf", filter: true },
  { source: "話題（はてブ）", lang: "ja", url: "https://b.hatena.ne.jp/hotentry/it.rss", filter: true, kind: "buzz" },
  { source: "TechCrunch", lang: "en", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { source: "The Verge", lang: "en", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
];

/* 話題（はてブ）枠の出典表示：リンク先URLのドメインから元媒体名を引く。
   未知のドメインはドメイン名そのままを出典として出す */
const HOST_NAMES = {
  "www.itmedia.co.jp": "ITmedia",
  "atmarkit.itmedia.co.jp": "＠IT",
  "togetter.com": "Togetter",
  "gigazine.net": "GIGAZINE",
  "www.publickey1.jp": "Publickey",
  "zenn.dev": "Zenn",
  "qiita.com": "Qiita",
  "note.com": "note",
  "anond.hatelabo.jp": "はてな匿名ダイアリー",
  "www.nikkei.com": "日本経済新聞",
  "www3.nhk.or.jp": "NHK",
  "ascii.jp": "ASCII.jp",
  "www.gizmodo.jp": "GIZMODO JAPAN",
  "japan.cnet.com": "CNET Japan",
  "japan.zdnet.com": "ZDNET Japan",
  "www.watch.impress.co.jp": "Impress Watch",
  "internet.watch.impress.co.jp": "INTERNET Watch",
  "pc.watch.impress.co.jp": "PC Watch",
  "forest.watch.impress.co.jp": "窓の杜",
  "xtech.nikkei.com": "日経クロステック",
  "www.techno-edge.net": "テクノエッジ",
  "codezine.jp": "CodeZine",
  "gihyo.jp": "gihyo.jp",
  "automaton-media.com": "AUTOMATON",
  "businessinsider.jp": "Business Insider Japan",
  "wired.jp": "WIRED.jp",
  "ledge.ai": "Ledge.ai",
  "speakerdeck.com": "Speaker Deck",
  "www.docswell.com": "Docswell",
  "www.youtube.com": "YouTube",
  "github.com": "GitHub",
  "openai.com": "OpenAI",
  "www.anthropic.com": "Anthropic",
};
function sourceFromUrl(url, fallback) {
  try {
    const host = new URL(url).hostname;
    return HOST_NAMES[host] ?? host.replace(/^www\./, "");
  } catch {
    return fallback;
  }
}

const AI_KEYWORDS =
  /AI|人工知能|生成|LLM|ChatGPT|Claude|Gemini|OpenAI|Anthropic|Copilot|エージェント|Sora|Midjourney|機械学習|ディープラーニング|NVIDIA/i;

/* セール・広告系のノイズ見出しを除外する */
const NOISE =
  /セール|SALE|[0-9０-９]+[%％]\s*(OFF|オフ)|割引|クーポン|お得|ポイント還元|タイムセール|福袋|プレゼントキャンペーン/i;

const MAX_PER_FEED = 4;
const MAX_BUZZ = 3;
const MAX_JA = 8;
const MAX_EN = 6;
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
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ")
    .trim();

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1] : "";
}

/* RSS2.0の<item>・RSS1.0(RDF)の<item>・Atomの<entry>に対応 */
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
    if (feed.filter && !AI_KEYWORDS.test(title)) continue;
    if (NOISE.test(title)) continue;
    /* はてブのブックマーク数（＝その日の話題度）。トップページの
       「今日イチの話題」の選定に使う */
    const countRaw = pick(b, "hatena:bookmarkcount");
    const count = countRaw ? Number(stripHtml(countRaw)) : undefined;
    const url = link.split("?utm")[0];
    items.push({
      title,
      url,
      /* 話題枠はアグリゲータ名ではなく、リンク先の元媒体を出典として載せる */
      source: feed.kind === "buzz" ? sourceFromUrl(url, feed.source) : feed.source,
      lang: feed.lang,
      ...(feed.kind ? { kind: feed.kind } : {}),
      ...(Number.isFinite(count) ? { count } : {}),
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
    console.log(`    ${feed.source}: ${items.length}本（AI関連・全期間）`);
    return items;
  } catch (e) {
    console.log(`  ✗ ${feed.source} の取得に失敗: ${e.message}`);
    return [];
  }
}

/* 英語見出しの日本語訳（無料の翻訳エンドポイント。失敗したらnull） */
async function translateToJa(text) {
  try {
    const u =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ja&dt=t&q=" +
      encodeURIComponent(text);
    const res = await fetch(u, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const j = await res.json();
    const out = (j?.[0] || []).map((seg) => seg?.[0] || "").join("").trim();
    return out || null;
  } catch {
    return null;
  }
}

console.log("AIニュースの見出しを取得します…");
const all = (await Promise.all(FEEDS.map(fetchFeed))).flat();

if (all.length === 0) {
  console.log("全フィードの取得に失敗しました。既存のJSONを維持します。");
  process.exit(0);
}

const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 3600 * 1000;
const fresh = all
  .filter((a) => new Date(a.date).getTime() >= cutoff)
  .sort((x, y) => (x.date < y.date ? 1 : -1));

/* 同一URL・同一見出しの重複除去（はてブと元媒体の重複対策） */
const seenUrl = new Set();
const seenTitle = new Set();
const deduped = [];
for (const a of fresh) {
  const t = a.title.toLowerCase();
  if (seenUrl.has(a.url) || seenTitle.has(t)) continue;
  seenUrl.add(a.url);
  seenTitle.add(t);
  deduped.push(a);
}

/* 日本語枠・海外枠それぞれで、媒体ごとの上限を守りながら採用 */
function select(items, maxTotal) {
  const perFeed = new Map();
  let buzzUsed = 0; /* 話題枠は出典がバラバラなので媒体別ではなく合計で数える */
  const out = [];
  for (const a of items) {
    if (a.kind === "buzz") {
      if (buzzUsed >= MAX_BUZZ) continue;
      buzzUsed += 1;
    } else {
      const n = perFeed.get(a.source) ?? 0;
      if (n >= MAX_PER_FEED) continue;
      perFeed.set(a.source, n + 1);
    }
    out.push(a);
    if (out.length >= maxTotal) break;
  }
  return out;
}

const ja = select(deduped.filter((a) => a.lang === "ja"), MAX_JA);
const en = select(deduped.filter((a) => a.lang === "en"), MAX_EN);

/* 海外見出しを翻訳（1本ずつ・失敗しても続行） */
for (const a of en) {
  const t = await translateToJa(a.title);
  if (t) a.titleJa = t.replace(/\s*[-–—:：]\s*$/, "").replace(/\s+/g, " ").trim();
  await new Promise((r) => setTimeout(r, 300));
}
console.log(`  翻訳: ${en.filter((a) => a.titleJa).length}/${en.length}本 成功`);

const picked = [...ja, ...en].sort((x, y) => (x.date < y.date ? 1 : -1));

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
console.log(`✔ news-headlines.json を更新しました（日本語${ja.length}本＋海外${en.length}本）`);
