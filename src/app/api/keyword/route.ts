import { NextResponse } from "next/server";

// フォロー中キーワードのタブと検索タブ用。
// Google News RSS検索（APIキー不要・日本語対応）で横断検索し、
// 失敗・0件のときはBing News RSSに自動フォールバックする。
// データセンターからのアクセスがbot扱いされないようブラウザ相当のUAを付ける。
// 10分キャッシュ。

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
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? decodeEntities(m[1]) : "";
}

function toArticle(
  title: string,
  link: string,
  pubDate: string,
  source: string
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
  };
}

async function fetchGoogleNews(q: string): Promise<SearchArticle[]> {
  try {
    const rssURL = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ja&gl=JP&ceid=JP:ja`;
    const res = await fetch(rssURL, {
      headers: BROWSER_HEADERS,
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const articles: SearchArticle[] = [];
    for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const block = match[1];
      const source = pickTag(block, "source");
      let title = pickTag(block, "title");
      // Google Newsのタイトルは「記事タイトル - メディア名」形式なので末尾を落とす
      if (source && title.endsWith(` - ${source}`)) {
        title = title.slice(0, -(source.length + 3)).trim();
      }
      const article = toArticle(
        title,
        pickTag(block, "link"),
        pickTag(block, "pubDate"),
        source || "Google News"
      );
      if (article) articles.push(article);
      if (articles.length >= 30) break;
    }
    return articles;
  } catch {
    return [];
  }
}

async function fetchBingNews(q: string): Promise<SearchArticle[]> {
  try {
    const rssURL = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setmkt=ja-JP`;
    const res = await fetch(rssURL, {
      headers: BROWSER_HEADERS,
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const articles: SearchArticle[] = [];
    for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const block = match[1];
      // Bingのリンクはリダイレクト用URL（url=パラメータに実URL）
      let link = pickTag(block, "link");
      try {
        const real = new URL(link).searchParams.get("url");
        if (real && real.startsWith("http")) link = real;
      } catch {
        // そのまま使う
      }
      const article = toArticle(
        pickTag(block, "title"),
        link,
        pickTag(block, "pubDate"),
        pickTag(block, "News:Source") || "Bing News"
      );
      if (article) articles.push(article);
      if (articles.length >= 30) break;
    }
    return articles;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (!q) return NextResponse.json({ articles: [], provider: "none" });

  let articles = await fetchGoogleNews(q);
  let provider = "google";
  if (articles.length === 0) {
    articles = await fetchBingNews(q);
    provider = articles.length > 0 ? "bing" : "none";
  }

  return NextResponse.json(
    { articles, provider },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    }
  );
}
