/* ============================================================
   外部記事・動画のOGP情報を取ってきて、
   src/app/profile/link-cards.json を更新するスクリプト。

   使い方:  node scripts/fetch-link-cards.mjs
   （外部サイトに到達できる環境で実行する。CIからは
     .github/workflows/refresh-link-cards.yml で実行できる）

   Claude Codeのサンドボックスは外部サイトに一切到達できないため
   （blog.nijibox.jp も youtube.com も接続が遮断される）、
   取得はこのワークフロー（GitHub Actionsランナー）側で行う。
   note記事やAIニュースと同じ設計。

   ------------------------------------------------------------
   取るのは og:title / og:description / og:image / og:site_name と
   公開日だけ。本文の転載や記事内画像の切り出しはしない
   （掲載許諾がその条件で出ているため、ここを勝手に広げないこと）。

   取得に失敗したURLは、既存の値をそのまま残す。一度取れた
   カードが、相手側の一時的なエラーで消えないようにするため。
   ============================================================ */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_PATH = path.join(ROOT, "src/app/profile/link-cards.json");

/* OGPを取りにいくURL。src/app/profile/records.ts に書いたURLを
   そのまま拾う（実績を1件足せば、取得対象にも自動で入る）。
   FPEC講座のnote記事など、records.ts の外で使うものは EXTRA に足す。 */
const RECORDS_PATH = path.join(ROOT, "src/app/profile/records.ts");
const EXTRA = [];

async function collectUrls() {
  const src = await readFile(RECORDS_PATH, "utf8");
  const found = [...src.matchAll(/"(https:\/\/[^"]+)"/g)].map((m) => m[1]);
  return [...new Set([...found, ...EXTRA])];
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const decode = (s) =>
  (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

/* <meta property="og:title" content="..."> と
   <meta content="..." property="og:title"> の両方の並びを拾う */
function meta(html, key) {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decode(m[1]);
  }
  return "";
}

function titleTag(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decode(m[1].replace(/\s+/g, " ")) : "";
}

/* 2026-06-30T10:00:00+09:00 → 2026-06-30 */
const ymd = (s) => {
  if (!s) return "";
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
};

/* YouTubeはOGPをJavaScriptで後から差し込むため、HTMLを取っただけでは
   タイトルが「- YouTube」、og:image が空のまま返ってくる。
   公式のoEmbedならタイトルとサムネイルが取れるので、そちらを使う。 */
async function fetchYouTube(url) {
  const id = url.match(/[?&]v=([\w-]{6,})/)?.[1] || url.match(/youtu\.be\/([\w-]{6,})/)?.[1];
  if (!id) return null;
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    { headers: { "User-Agent": UA } },
  );
  console.log(`  GET oembed ${id} -> ${res.status}`);
  if (!res.ok) return null;
  const j = await res.json();
  if (!j.title) return null;
  return {
    url,
    title: decode(j.title),
    description: "",
    /* maxresdefault は無い動画があるので、必ず存在する hqdefault を使う */
    image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    siteName: j.author_name ? decode(j.author_name) : "YouTube",
    date: "",
  };
}

async function fetchCard(url) {
  if (/(?:youtube\.com|youtu\.be)/.test(url)) {
    const yt = await fetchYouTube(url);
    if (yt) return yt;
  }
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "ja,en;q=0.8", Accept: "text/html" },
    redirect: "follow",
  });
  console.log(`  GET ${url} -> ${res.status}`);
  if (!res.ok) return null;
  const html = await res.text();

  const image = meta(html, "og:image") || meta(html, "twitter:image");
  const card = {
    url,
    title: meta(html, "og:title") || titleTag(html),
    description: meta(html, "og:description") || meta(html, "description"),
    /* 相対パスで書かれている場合に備えて絶対URLへ寄せる */
    image: image ? new URL(image, url).toString() : "",
    siteName: meta(html, "og:site_name"),
    date:
      ymd(meta(html, "article:published_time")) ||
      ymd(meta(html, "datePublished")) ||
      ymd(meta(html, "uploadDate")) ||
      "",
  };
  if (!card.title) return null;
  return card;
}

const prev = await readFile(OUT_PATH, "utf8")
  .then((t) => JSON.parse(t))
  .catch(() => ({ cards: {} }));

const cards = { ...(prev.cards ?? {}) };
let changed = false;

const URLS = await collectUrls();
console.log(`対象URL: ${URLS.length}件`);

for (const url of URLS) {
  try {
    const card = await fetchCard(url);
    if (!card) {
      console.log(`  ⚠ ${url}: 取得できなかったため既存データを維持`);
      continue;
    }
    if (JSON.stringify(cards[url]) !== JSON.stringify(card)) {
      cards[url] = card;
      changed = true;
    }
  } catch (e) {
    console.log(`  ⚠ ${url}: ${e.message} — 既存データを維持`);
  }
}

/* URLS から消えたものは残さない（掲載をやめたカードが居座らないように） */
for (const key of Object.keys(cards)) {
  if (!URLS.includes(key)) {
    delete cards[key];
    changed = true;
  }
}

if (!changed) {
  console.log("変更なし。");
} else {
  const out = {
    _comment:
      "外部記事・動画のOGP。scripts/fetch-link-cards.mjs がCIで自動生成する（手で編集しない）。取得元URLは src/app/profile/records.ts から拾う。",
    generatedAt: new Date().toISOString().slice(0, 10),
    cards,
  };
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`更新: ${Object.keys(cards).length}件`);
}
