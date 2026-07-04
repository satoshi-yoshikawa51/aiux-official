import { ARTICLES_NEW } from "../data";

/* RSSフィード — サイトの新着（note記事）を配信する。
   data.ts の記事更新に自動追従。フィードリーダー・クローラーの
   更新検知用で、各itemのリンク先はnoteの記事本体。 */
export const dynamic = "force-static";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function GET() {
  const items = ARTICLES_NEW.filter((a) => a.date)
    .map(
      (a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${esc(a.url)}</link>
      <guid isPermaLink="true">${esc(a.url)}</guid>
      <pubDate>${new Date(`${a.date}T09:00:00+09:00`).toUTCString()}</pubDate>
      <description>${esc(a.excerpt)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>COMIXAI — 吉川聡史 オフィシャルサイト</title>
    <link>https://comixai.dev</link>
    <atom:link href="https://comixai.dev/feed.xml" rel="self" type="application/rss+xml" />
    <description>AIを、面白く。わかりやすく。AIクリエイター・漫画家 吉川聡史のAI活用マンガ・記事の新着情報。</description>
    <language>ja</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
