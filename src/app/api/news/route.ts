import { NextResponse } from "next/server";

// Yahoo!ニュース公式RSS（APIキー不要）を全カテゴリ並列で取得し、
// JSONに変換して返すプロキシ。ブラウザから直接RSSを取れない（CORS）ため
// サーバー側で取得する。5分間キャッシュ。

const FEEDS: { category: string; feed: string }[] = [
  { category: "top", feed: "top-picks" },
  { category: "domestic", feed: "domestic" },
  { category: "world", feed: "world" },
  { category: "business", feed: "business" },
  { category: "entertainment", feed: "entertainment" },
  { category: "sports", feed: "sports" },
  { category: "it", feed: "it" },
  { category: "science", feed: "science" },
  { category: "local", feed: "local" },
];

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

function parseRSS(xml: string, category: string) {
  const articles = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = match[1];
    const pick = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return m ? decodeEntities(m[1]) : "";
    };
    const title = pick("title");
    const link = pick("link");
    const pubDate = pick("pubDate");
    if (!title || !link.startsWith("http")) continue;
    const date = new Date(pubDate);
    articles.push({
      id: link,
      title,
      link,
      category,
      source: "Yahoo!ニュース",
      publishedAt: isNaN(date.getTime()) ? null : date.toISOString(),
    });
  }
  return articles;
}

export async function GET() {
  const results = await Promise.all(
    FEEDS.map(async ({ category, feed }) => {
      try {
        const res = await fetch(`https://news.yahoo.co.jp/rss/topics/${feed}.xml`, {
          next: { revalidate: 300 },
        });
        if (!res.ok) return [];
        return parseRSS(await res.text(), category);
      } catch {
        return [];
      }
    })
  );

  const seen = new Set<string>();
  const articles = results.flat().filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  return NextResponse.json(
    { articles, updatedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
