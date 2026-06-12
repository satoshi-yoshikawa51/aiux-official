import { NextResponse } from "next/server";

// Yahoo!ニュースのRSSにはサムネイルが含まれないため、
// 記事ページのOGP（og:image）を取り出して画像URLへリダイレクトする。
// SSRF防止のため news.yahoo.co.jp のみ許可。1時間キャッシュ。

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url") ?? "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("invalid url", { status: 400 });
  }
  if (target.protocol !== "https:" || target.hostname !== "news.yahoo.co.jp") {
    return new NextResponse("forbidden host", { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return new NextResponse("fetch failed", { status: 404 });
    // og:imageはhead内にあるので先頭部分だけ見れば十分
    const html = (await res.text()).slice(0, 200000);
    const match =
      html.match(/property="og:image"[^>]*content="([^"]+)"/) ??
      html.match(/content="([^"]+)"[^>]*property="og:image"/);
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
