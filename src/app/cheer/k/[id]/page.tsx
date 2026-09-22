/* ============================================================
   きょうの きみに — 名言1つぶんの結果ページ（シェアの着地先）。
   SNSに貼られたとき、OGPで「犬＋名言」のカードが出るのが役目。
   ページ自体は静的生成で、犬の動画＋名言＋アプリへの導線だけ。
   ============================================================ */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@fontsource/zen-maru-gothic/400.css";
import "@fontsource/zen-maru-gothic/500.css";
import "@fontsource/zen-maru-gothic/700.css";
import "../../cheer.css";
import { KOTOBA } from "../../quotes";
import { dogFor } from "../../pets";

export function generateStaticParams() {
  return KOTOBA.map((k) => ({ id: k.id }));
}

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
    title: `「${k.lines[0]}」| きょうの きみに`,
    description: `${text}（${creditFor(k.who)}）— ちいさな犬が、きょうのきみに ことばを届けます。`,
    robots: { index: false }, // プロトタイプの間は検索に載せない
    alternates: { canonical: `/cheer/k/${k.id}` },
    openGraph: {
      title: text,
      description: `${creditFor(k.who)} | きょうの きみに`,
      type: "website",
      url: `/cheer/k/${k.id}`,
      images: [{ url: `/cheer/og/${k.id}.jpg`, width: 1200, height: 630 }],
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
    <div className="cheer-root">
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
          <Link href="/cheer" className="k-cta">
            じぶんも きいてもらう
          </Link>
          <p className="k-brand">きょうの きみに</p>
          </div>
        </div>
      </main>
    </div>
  );
}
