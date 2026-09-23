/* ============================================================
   いぬがたり — 名言1つぶんの結果ページ（シェアの着地先）。
   SNSに貼られたとき、OGPで「犬＋名言」のカードが出るのが役目。
   ページ自体は静的生成で、犬の動画＋名言＋アプリへの導線だけ。
   ============================================================ */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@fontsource/zen-maru-gothic/400.css";
import "@fontsource/zen-maru-gothic/500.css";
import "@fontsource/zen-maru-gothic/700.css";
import "../../inugatari.css";
import { KOTOBA } from "../../quotes";
import { dogFor } from "../../pets";

export function generateStaticParams() {
  return KOTOBA.map((k) => ({ id: k.id }));
}

/* サービス名。OGPのタイトル・説明とページ下の署名で使い回す */
const BRAND = "いぬがたり";
const TAGLINE = "〜あなたの「想い」にこたえます〜";

function creditFor(who: string): string {
  return who === "ことわざ" ? "ことわざ" : `${who}のことば`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const k = KOTOBA.find((q) => q.id === id);
  if (!k) return {};
  const dog = dogFor(k.id);
  const text = k.lines.join(" ");
  return {
    title: `「${k.lines[0]}」| ${BRAND}`,
    description: `${text}（${creditFor(k.who)}）— ワンちゃんたちが、あなたの「想い」にこたえます。`,
    robots: { index: false }, // プロトタイプの間は検索に載せない
    alternates: { canonical: `/inugatari/k/${k.id}` },
    openGraph: {
      title: text,
      description: `${creditFor(k.who)} | ${BRAND}${TAGLINE}`,
      siteName: BRAND,
      type: "website",
      url: `/inugatari/k/${k.id}`,
      images: [{ url: `/inugatari/og/${k.id}.jpg`, width: 1200, height: 630 }],
      /* 対応しているサービス（Discord等）では犬の動画がそのまま再生される */
      videos: [
        { url: `https://comixai.dev${dog.video}`, width: 464, height: 832, type: "video/mp4" },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function KotobaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const k = KOTOBA.find((q) => q.id === id);
  if (!k) notFound();
  const dog = dogFor(k.id);
  return (
    <div className="inugatari-root">
      <main className="film">
        <div className="film-bg" />
        <div className="film-stage">
          <video
          className="film-video"
          src={dog.video}
          poster={dog.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="film-scrim" />
        <div className="k-card">
          <p className="after-lines">{k.lines.join("\n")}</p>
          <p className="after-credit">{creditFor(k.who)}</p>
          <Link href="/inugatari" className="k-cta">
            じぶんも きいてもらう
          </Link>
          <p className="k-brand">{BRAND}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
