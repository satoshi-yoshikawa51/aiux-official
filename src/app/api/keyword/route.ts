import { NextResponse } from "next/server";

// フォロー中キーワードのタブと検索タブ用。
// Google News RSS検索（APIキー不要）で日本語ニュースを横断検索する。
// Yahoo!ニュースRSSは件数が少なく（全体で約70本）キーワードに
// ヒットしないことが多いため、キーワード系はこちらで補う。10分キャッシュ。

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

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (!q) return NextResponse.json({ articles: [] });

  try {
    const rssURL = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ja&gl=JP&ceid=JP:ja`;
    const res = await fetch(rssURL, { next: { revalidate: 600 } });
    if (!res.ok) return NextResponse.json({ articles: [] });
    const xml = await res.text();

    const articles = [];
    for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const block = match[1];
      const pick = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return m ? decodeEntities(m[1]) : "";
      };
      const source = pick("source");
      let title = pick("title");
      // Google Newsのタイトルは「記事タイトル - メディア名」形式なので末尾を落とす
      if (source && title.endsWith(` - ${source}`)) {
        title = title.slice(0, -(source.length + 3)).trim();
      }
      const link = pick("link");
      const pubDate = pick("pubDate");
      if (!title || !link.startsWith("http")) continue;
      const date = new Date(pubDate);
      articles.push({
        id: link,
        title,
        link,
        category: "search",
        source: source || "Google News",
        publishedAt: isNaN(date.getTime()) ? null : date.toISOString(),
      });
      if (articles.length >= 30) break;
    }

    return NextResponse.json(
      { articles },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
