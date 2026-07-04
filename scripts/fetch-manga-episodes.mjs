/* ============================================================
   noteマガジンから収録記事リストを取得し、
   src/app/manga/episodes.json を更新するスクリプト。

   使い方:  node scripts/fetch-manga-episodes.mjs
   （note.comに到達できる環境で実行する。CIからは
     .github/workflows/refresh-manga-episodes.yml で実行できる）

   取得元は順にフォールバックする:
     1. マガジンRSS        https://note.com/{user}/m/{key}/rss
     2. レイアウトAPI      /api/v1/layout/magazine/{key}/section
     3. マガジンノートAPI  /api/v3/magazines/{key}/notes
   既存の episodes.json の likes / desc は、新しい値が取れない
   限り保持する（手書きの紹介文を上書きしない）。
   ============================================================ */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EPISODES_PATH = path.join(ROOT, "src/app/manga/episodes.json");
const META_PATH = path.join(ROOT, "src/app/note-article-meta.json");

const USER = "aiux_unite";
/* slug は src/app/manga/data.ts の MANGA_SERIES と一致させること */
const SERIES = [
  { slug: "wakaru", key: "m92e0de4e5627" },
  { slug: "jissen", key: "m0b7bcbd79d18" },
  { slug: "honshitsu", key: "m19a44a319753" },
];

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

const unCdata = (s) => (s || "").replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();

/* RSS由来の紹介文から定型ノイズ（挨拶・「続きをみる」）を除いて短くする。
   手書きの紹介文に適用しても変化しない（冪等）ようにしておく */
const cleanDesc = (s) =>
  stripHtml(s)
    .replace(/こんにちは！吉川です。?/g, "")
    .replace(/続きをみる\s*$/, "")
    .trim()
    .slice(0, 90);

const NOTE_KEY = /^n[0-9a-f]{10,16}$/;

/* —— 1) RSS —— */
function parseRss(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const pick = (tag) => {
      const mm = it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return mm ? unCdata(mm[1]).trim() : "";
    };
    const link = pick("link");
    const keyMatch = link.match(/\/n\/(n[0-9a-f]+)/);
    if (!keyMatch) continue;
    const thumb =
      (it.match(/<media:thumbnail[^>]*>([\s\S]*?)<\/media:thumbnail>/) || [])[1]?.trim() ||
      (it.match(/<media:thumbnail[^>]*url="([^"]+)"/) || [])[1] ||
      "";
    const pubDate = pick("pubDate");
    items.push({
      key: keyMatch[1],
      title: stripHtml(pick("title")),
      desc: stripHtml(pick("description")),
      thumb: unCdata(thumb),
      date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : undefined,
    });
  }
  return items;
}

/* —— 2/3) JSON API: 形が変わっても拾えるよう、note記事らしい
      オブジェクト（key が n+hex で name を持つ）を深さ優先で収集 —— */
function collectNotes(node, out, seen) {
  if (Array.isArray(node)) {
    for (const v of node) collectNotes(v, out, seen);
    return;
  }
  if (!node || typeof node !== "object") return;
  const key = node.key ?? node.note_key ?? node.noteKey;
  const name = node.name ?? node.title;
  if (typeof key === "string" && NOTE_KEY.test(key) && typeof name === "string" && name) {
    if (!seen.has(key)) {
      seen.add(key);
      let thumb = "";
      let likes;
      let desc = "";
      for (const [k, v] of Object.entries(node)) {
        const lk = k.toLowerCase();
        if (!thumb && typeof v === "string" && /^https:\/\/assets\.st-note\.com\//.test(v) && /eyecatch|thumbnail|image/.test(lk)) thumb = v;
        if (likes == null && typeof v === "number" && /like/.test(lk)) likes = v;
        if (!desc && typeof v === "string" && /^(description|body|highlight)$/.test(lk)) desc = stripHtml(v);
      }
      out.push({ key, title: stripHtml(name), desc, thumb, likes });
    }
  }
  for (const v of Object.values(node)) collectNotes(v, out, seen);
}

function parseJsonBody(body) {
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return [];
  }
  const out = [];
  collectNotes(data, out, new Set());
  return out;
}

async function fetchSeries({ slug, key }) {
  console.log(`— ${slug} (${key})`);
  const sources = [
    async () => {
      const b = await get(`https://note.com/${USER}/m/${key}/rss`, "application/rss+xml, application/xml");
      return b ? parseRss(b) : [];
    },
    async () => {
      const b = await get(`https://note.com/api/v1/layout/magazine/${key}/section?page=1`, "application/json");
      return b ? parseJsonBody(b) : [];
    },
    async () => {
      const b = await get(`https://note.com/api/v3/magazines/${key}/notes?per=100`, "application/json");
      return b ? parseJsonBody(b) : [];
    },
  ];
  for (const src of sources) {
    try {
      const notes = await src();
      if (notes.length) return notes;
    } catch (e) {
      console.log(`  error: ${e.message}`);
    }
  }
  return [];
}

const epNo = (title) => {
  const m = title.match(/第(\d+)話/);
  return m ? Number(m[1]) : undefined;
};

function buildEpisodes(notes, prevEpisodes, meta) {
  const prevByUrl = new Map(prevEpisodes.map((e) => [e.url, e]));
  let eps = notes.map((n) => {
    const url = `https://note.com/${USER}/n/${n.key}`;
    const prev = prevByUrl.get(url);
    const ep = {
      title: n.title,
      /* 手書き(メタ)の紹介文を優先し、なければ既存/取得分をノイズ除去して使う */
      desc: meta[url]?.excerpt || cleanDesc(prev?.desc || "") || cleanDesc(n.desc || ""),
      url,
    };
    const no = epNo(n.title);
    if (no != null) ep.no = no;
    if (n.date) ep.date = n.date;
    const thumb = n.thumb || prev?.thumb;
    if (thumb) ep.thumb = thumb;
    const likes = n.likes ?? prev?.likes;
    if (likes != null) ep.likes = likes;
    return ep;
  });
  if (eps.length && eps.every((e) => e.no != null)) {
    eps = eps.sort((a, b) => a.no - b.no);
  } else if (eps.length && eps.every((e) => e.date)) {
    /* 話数がないシリーズ（エッセイ等）は公開日の昇順＝連載順に並べる */
    eps = eps.sort((a, b) => (a.date < b.date ? -1 : 1));
  }
  return eps;
}

const prev = JSON.parse(await readFile(EPISODES_PATH, "utf8"));
const meta = JSON.parse(await readFile(META_PATH, "utf8"));
const today = new Date().toISOString().slice(0, 10);

let changed = false;
for (const series of SERIES) {
  const notes = await fetchSeries(series);
  if (!notes.length) {
    console.log(`  ⚠ ${series.slug}: 取得0件のため既存データを維持`);
    continue;
  }
  const prevEntry = prev.series[series.slug] || { updatedAt: today, episodes: [] };
  const eps = buildEpisodes(notes, prevEntry.episodes, meta);
  if (JSON.stringify(eps) !== JSON.stringify(prevEntry.episodes)) {
    prev.series[series.slug] = { updatedAt: today, episodes: eps };
    changed = true;
    console.log(`  ✔ ${series.slug}: ${eps.length}話に更新`);
  } else {
    console.log(`  = ${series.slug}: 変更なし (${eps.length}話)`);
  }
}

if (changed) {
  prev.generatedAt = today;
  await writeFile(EPISODES_PATH, JSON.stringify(prev, null, 2) + "\n");
  console.log(`episodes.json を更新しました`);
} else {
  console.log("変更はありませんでした");
}
