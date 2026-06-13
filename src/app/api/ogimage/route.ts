import { NextResponse } from "next/server";

// RSSにはサムネイルが含まれないため、記事ページのOGP（og:image）を
// 取り出して画像URLへリダイレクトする。Yahoo!ニュースに加え、
// キーワード検索（Bing/Google News）で出る一般ニュースサイトにも対応。
// SSRF防止のため https・公開ホスト名のみ許可。1時間キャッシュ。

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  Accept: "text/html, */*",
  "Accept-Language": "ja",
};

function isAllowedTarget(u: URL): boolean {
  if (u.protocol !== "https:") return false;
  if (u.port && u.port !== "443") return false;
  if (u.username || u.password) return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false; // IPv4リテラル
  if (host.includes(":")) return false; // IPv6リテラル
  if (!host.includes(".")) return false;
  return true;
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url") ?? "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("invalid url", { status: 400 });
  }
  if (!isAllowedTarget(target)) {
    return new NextResponse("forbidden host", { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: BROWSER_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return new NextResponse("fetch failed", { status: 404 });
    // og:imageはhead内にあるので先頭部分だけ見れば十分
    const html = (await res.text()).slice(0, 300000);
    const match =
      html.match(/property="og:image"[^>]*content="([^"]+)"/) ??
      html.match(/content="([^"]+)"[^>]*property="og:image"/) ??
      html.match(/name="twitter:image"[^>]*content="([^"]+)"/);
    const image = match?.[1]?.replace(/&amp;/g, "&");
    if (!image || !image.startsWith("https://")) {
      return new NextResponse("no og:image", { status: 404 });
    }
    return NextResponse.redirect(image, {
      status: 302,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse("upstream error", { status: 502 });
  }
}
