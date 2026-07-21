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
  { source: "ZDNET Japan", lang: "ja", url: "https://feeds.japan.zdnet.com/rss/zdnet/all.rdf", filter: true },
  { source: "日経クロステック", lang: "ja", url: "https://xtech.nikkei.com/rss/xtech-it.rdf", filter: true },
  { source: "話題（はてブ）", lang: "ja", url: "https://b.hatena.ne.jp/hotentry/it.rss", filter: true, kind: "buzz" },
  /* 海外：公式ブログ（発表の一次情報）＋報道媒体。capは媒体ごとの採用上限 */
  { source: "OpenAI（公式）", lang: "en", url: "https://openai.com/news/rss.xml", cap: 2 },
  { source: "Google AI（公式）", lang: "en", url: "https://blog.google/technology/ai/rss/", cap: 2 },
  { source: "TechCrunch", lang: "en", url: "https://techcrunch.com/category/artificial-intelligence/feed/", cap: 3 },
  { source: "The Verge", lang: "en", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", cap: 3 },
  { source: "VentureBeat", lang: "en", url: "https://venturebeat.com/category/ai/feed/", cap: 3 },
  { source: "Ars Technica", lang: "en", url: "https://arstechnica.com/ai/feed/", cap: 3 },
];
const CAP_BY_SOURCE = Object.fromEntries(FEEDS.map((f) => [f.source, f.cap]));

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

/* 話題（はてブ）枠から除外する「ハウツー・個人ログ」系。
   ニュースのキャッチアップ欄なので、体験記やチュートリアルは載せない */
const HOWTO =
  /してみた|してみる|してもらった|作ってもらった|やってみ|作ってみ|試してみ|使ってみ|書いてみ|聞いてみ|入門|チュートリアル|ハンズオン|徹底解説|完全ガイド|する方法|の方法|作り方|使い方|手順|備忘録|◯選|[0-9０-９]+選|まとめ$|Tips|プラクティス|構築する|進め方|考え方|話$|件$/i;

/* 海外枠：コラム・ポッドキャスト・レビュー・リスト記事を除外し、
   「事実の動き」を伝える見出しだけ採用する（機械翻訳しても意味が通る） */
const EN_NOISE =
  /\?|podcast|vergecast|installer|newsletter|op-ed|opinion|review:|hands-?on|we tried|i tried|here['’]?s (how|what|why)|^how\b|how to|what to|the best|worth|explained|everything you need|recap|roundup|plot to|case study|customer story/i;
const EN_HARD =
  /launch|unveil|release|announce|introduc|debut|roll(s|ed|ing)? out|raise|funding|valuation|acquir|acquisition|merger|partner|invest|ban|law|regulat|court|sue|lawsuit|settle|fine[ds]?|appoint|resign|layoff|cuts?|outage|leak|breach|record (profit|revenue|high)|billion|\$[0-9]|GPT-|Claude|Gemini|Llama|OpenAI|Anthropic|DeepMind|Nvidia|new model|update|expand|deal|report[s:]|study|pilot|test(s|ing) /i;

/* 「キャッチアップすべき動き」を示す語。並び順のスコアに使う */
const IMPORTANT =
  /発表|リリース|公開|提供開始|開始|開設|参入|買収|統合|提携|出資|調達|上場|値上げ|値下げ|無償|無料化|規制|法案|法制|裁判|提訴|判決|障害|停止|流出|漏えい|脆弱性|新モデル|新機能|新サービス|新型|次世代|最上位|過去最高|過去最大|世界初|初の|首位|上回る|超え|抜く|パラメーター|シェア|決算|黒字|赤字|実証実験|導入|搭載|対応へ|対象に|方針|計画|戦略/;

const MAX_PER_FEED = 4;
const MAX_BUZZ = 2;
const MIN_BUZZ_COUNT = 30; /* この数未満のブックマークは「話題」と呼ばない */
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
    /* 話題枠：ハウツー・個人ログを除外（ニュース欄に体験記は載せない） */
    if (feed.kind === "buzz" && HOWTO.test(title)) continue;
    /* 海外枠：コラム・レビュー系を除外し、事実ニュースだけ通す。
       90字を超える見出しは長文コラムの可能性が高く、翻訳も崩れるので除外 */
    if (feed.lang === "en" && (EN_NOISE.test(title) || !EN_HARD.test(title) || title.length > 90)) continue;
    /* はてブのブックマーク数（＝その日の話題度）。閾値未満は不採用。
       トップページの「今日イチの話題」の選定にも使う */
    const countRaw = pick(b, "hatena:bookmarkcount");
    const count = countRaw ? Number(stripHtml(countRaw)) : undefined;
    if (feed.kind === "buzz" && !(Number.isFinite(count) && count >= MIN_BUZZ_COUNT)) continue;
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

/* 記事ページからOGP画像URLを取り出す（サムネイル用）。
   失敗・未設定ならnull（サムネなしで表示される） */
async function fetchOgImage(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    /* headにあるmetaだけ欲しいので先頭200KBで打ち切る */
    const html = (await res.text()).slice(0, 200_000);
    const m =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!m) return null;
    const img = stripHtml(m[1]);
    return /^https?:\/\//.test(img) ? img : null;
  } catch {
    return null;
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

/* 「大きなニュース」の指標：巨額・主要プレイヤー・主要モデル・規制/IPO */
const MEGA =
  /billion|\$\d+(\.\d+)?\s?(B|bn|billion)|OpenAI|Anthropic|Google|DeepMind|Meta|Microsoft|Nvidia|Apple|Amazon|xAI|GPT-\d|Claude|Gemini|Llama|Grok|EU\b|antitrust|White House|IPO|frontier model/i;

/* 見出しの「キャッチアップ価値」スコア。採用順・表示順に使う */
function score(a) {
  let s = a.kind === "buzz" ? 1 : 2; /* 報道媒体を話題枠より優先 */
  if (a.lang === "ja" && IMPORTANT.test(a.title)) s += 2;
  if (a.lang === "en" && /launch|unveil|announce|release|acquir|raise|valuation|billion|\$[0-9]|ban|lawsuit|outage|breach/i.test(a.title)) s += 2;
  if (a.lang === "en" && MEGA.test(a.title)) s += 2; /* 海外は「大きさ」を最重視 */
  if (a.source.includes("公式")) s += 1; /* 一次情報（公式発表）を格上げ */
  if (a.kind === "buzz" && (a.count ?? 0) >= 100) s += 1; /* 大バズは格上げ */
  return s;
}

/* 同じ出来事の重複報道を除く（社名・製品名などの英字トークンが3語以上一致）。
   先に来たものが勝つ＝日本語版があるときは海外版を落とす */
const sigWords = (t) =>
  new Set((t.toLowerCase().match(/[a-z][a-z0-9'’-]{3,}/g) ?? []).map((w) => w.replace(/['’]s?$/, "")));
function dropNearDup(items) {
  const seen = [];
  const out = [];
  for (const a of items) {
    const s = sigWords(a.title);
    const dup = seen.some((p) => {
      let n = 0;
      for (const w of s) if (p.has(w)) n += 1;
      return n >= 3;
    });
    if (dup) continue;
    seen.push(s);
    out.push(a);
  }
  return out;
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
      const cap = CAP_BY_SOURCE[a.source] ?? MAX_PER_FEED;
      const n = perFeed.get(a.source) ?? 0;
      if (n >= cap) continue;
      perFeed.set(a.source, n + 1);
    }
    out.push(a);
    if (out.length >= maxTotal) break;
  }
  return out;
}

/* 価値スコア順（同点なら新しい順）で採用枠を埋める */
const ranked = [...deduped].sort((x, y) => score(y) - score(x) || (x.date < y.date ? 1 : -1));
const ja = select(ranked.filter((a) => a.lang === "ja"), MAX_JA);
/* 海外枠は、日本語枠で既に報じられている出来事を除いてから採用 */
const en = dropNearDup([...ja, ...select(ranked.filter((a) => a.lang === "en"), MAX_EN + 4)])
  .filter((a) => a.lang === "en")
  .slice(0, MAX_EN);

/* 海外見出しを翻訳（1本ずつ・失敗しても続行）。
   「— here's how ...」のような飾り節は翻訳が崩れる元なので先に落とす */
for (const a of en) {
  let src = a.title;
  const m = src.match(/^(.{30,}?)\s+[—–]\s+/);
  if (m) src = m[1];
  const t = await translateToJa(src.trim());
  if (t) a.titleJa = t.replace(/\s*[-–—:：]\s*$/, "").replace(/\s+/g, " ").trim();
  await new Promise((r) => setTimeout(r, 300));
}
console.log(`  翻訳: ${en.filter((a) => a.titleJa).length}/${en.length}本 成功`);

/* 採用が決まった記事だけ、サムネイル（OGP画像）を取得 */
const withImage = [...ja, ...en];
for (const a of withImage) {
  const img = await fetchOgImage(a.url);
  if (img) a.image = img;
  await new Promise((r) => setTimeout(r, 200));
}
console.log(`  サムネ: ${withImage.filter((a) => a.image).length}/${withImage.length}本 取得`);

/* 表示は「日付（新しい日が上）→ 同日内は価値スコア順」 */
const day = (a) => a.date.slice(0, 10);
const picked = [...ja, ...en].sort(
  (x, y) => (day(x) < day(y) ? 1 : day(x) > day(y) ? -1 : score(y) - score(x) || (x.date < y.date ? 1 : -1))
);

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
