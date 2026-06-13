import { NextResponse } from "next/server";

// フォロー中キーワードのタブと検索タブ用。
// Bing News RSS（実記事URL・サムネイル付き）を優先し、
// 失敗・0件のときはGoogle News RSSにフォールバックする。
// データセンターからのアクセスがbot扱いされないようブラウザ相当のUAを付ける。
// 10分キャッシュ。`debug=1` で生RSSの先頭アイテムを確認できる。

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
  "Accept-Language": "ja",
};

type SearchArticle = {
  id: string;
  title: string;
  link: string;
  category: "search";
  source: string;
  publishedAt: string | null;
  imageURL: string | null;
};

type FetchResult = {
  articles: SearchArticle[];
  status: number;
  rawFirstItem: string | null;
};

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .trim();
}

function pickTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

// RSSで画像が入りうる場所を順に探す
function pickImage(block: string): string | null {
  const candidates = [
    block.match(/<News:Image[^>]*>([\s\S]*?)<\/News:Image>/i)?.[1],
    block.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1],
    block.match(/<media:content[^>]*url="([^"]+)"/i)?.[1],
    block.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i)?.[1],
    block.match(/<img[^>]*src=&quot;([^&]+)&quot;/i)?.[1],
    block.match(/<img[^>]*src="([^"]+)"/i)?.[1],
  ];
  for (const c of candidates) {
    if (!c) continue;
    const url = decodeEntities(c).trim();
    if (url.startsWith("https://")) return url;
    if (url.startsWith("http://")) return "https://" + url.slice(7);
    if (url.startsWith("//")) return "https:" + url;
  }
  return null;
}

function toArticle(
  title: string,
  link: string,
  pubDate: string,
  source: string,
  imageURL: string | null
): SearchArticle | null {
  if (!title || !link.startsWith("http")) return null;
  const date = new Date(pubDate);
  return {
    id: link,
    title,
    link,
    category: "search",
    source,
    publishedAt: isNaN(date.getTime()) ? null : date.toISOString(),
    imageURL,
  };
}

async function fetchFeed(
  rssURL: string,
  mapItem: (block: string) => SearchArticle | null
): Promise<FetchResult> {
  try {
    const res = await fetch(rssURL, {
      headers: BROWSER_HEADERS,
      next: { revalidate: 600 },
    });
    if (!res.ok) return { articles: [], status: res.status, rawFirstItem: null };
    const xml = await res.text();
    const articles: SearchArticle[] = [];
    let rawFirstItem: string | null = null;
    for (const match of xml.matchAll(/<item[ >]([\s\S]*?)<\/item>/g)) {
      if (rawFirstItem === null) rawFirstItem = match[1].slice(0, 2000);
      const article = mapItem(match[1]);
      if (article) articles.push(article);
      if (articles.length >= 30) break;
    }
    // <item>属性なし形式にも対応
    if (articles.length === 0) {
      for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        if (rawFirstItem === null) rawFirstItem = match[1].slice(0, 2000);
        const article = mapItem(match[1]);
        if (article) articles.push(article);
        if (articles.length >= 30) break;
      }
    }
    return { articles, status: res.status, rawFirstItem };
  } catch {
    return { articles: [], status: 0, rawFirstItem: null };
  }
}

function mapBingItem(block: string): SearchArticle | null {
  // Bingのリンクはリダイレクト用URL（url=パラメータに実URL）
  let link = pickTag(block, "link");
  try {
    const real = new URL(link).searchParams.get("url");
    if (real && real.startsWith("http")) link = real;
  } catch {
    // そのまま使う
  }
  return toArticle(
    pickTag(block, "title"),
    link,
    pickTag(block, "pubDate"),
    pickTag(block, "News:Source") || "Bing News",
    pickImage(block)
  );
}

function mapGoogleItem(block: string): SearchArticle | null {
  const source = pickTag(block, "source");
  let title = pickTag(block, "title");
  // Google Newsのタイトルは「記事タイトル - メディア名」形式なので末尾を落とす
  if (source && title.endsWith(` - ${source}`)) {
    title = title.slice(0, -(source.length + 3)).trim();
  }
  return toArticle(
    title,
    pickTag(block, "link"),
    pickTag(block, "pubDate"),
    source || "Google News",
    pickImage(block)
  );
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 60);
  const debug = params.get("debug") === "1";
  if (!q) return NextResponse.json({ articles: [], provider: "none" });

  const bingURL = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setmkt=ja-JP`;
  const googleURL = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ja&gl=JP&ceid=JP:ja`;

  const bing = await fetchFeed(bingURL, mapBingItem);
  let chosen = bing;
  let provider = "bing";
  let google: FetchResult | null = null;
  if (bing.articles.length === 0) {
    google = await fetchFeed(googleURL, mapGoogleItem);
    chosen = google;
    provider = google.articles.length > 0 ? "google" : "none";
  }

  if (debug) {
    return NextResponse.json({
      provider,
      bing: { status: bing.status, count: bing.articles.length, rawFirstItem: bing.rawFirstItem },
      google: google
        ? { status: google.status, count: google.articles.length, rawFirstItem: google.rawFirstItem }
        : "(未使用: bingで取得成功)",
      sample: chosen.articles[0] ?? null,
    });
  }

  return NextResponse.json(
    { articles: chosen.articles, provider },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    }
  );
}
