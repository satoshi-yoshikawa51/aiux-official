import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import SearchClient from "./client";

export const metadata: Metadata = {
  title: "AI司書に聞く｜サイト内AI検索｜COMIXAI",
  description:
    "用語・FAQ・マンガ・ゲーム・歴史——COMIXAIのすべてのコンテンツから、AIが答えを探して案内するサイト内検索。「ハルシネーションって何？」のような質問文のままでどうぞ。",
  keywords: ["COMIXAI 検索", "AI用語 検索", "サイト内検索 AI"],
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI司書に聞く｜サイト内AI検索",
    description: "サイトの中身だけを根拠に、AIが答えを探して案内します。",
    url: "/search",
    locale: "ja_JP",
    images: [{ url: "/ogp.png", width: 924, height: 540 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function SearchPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav home={false} />
      {/* 親がflex列のためautoマージンのnavが中央に縮む。ブロックで包んで全幅に */}
      <div style={{ width: "100%" }}>
        <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI司書に聞く" }]} />
      </div>
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 60px", width: "100%", flex: 1, boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(0, 460px)", gap: 32, alignItems: "center", marginBottom: 50 }} className="mag-grid">
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
              SEARCH — AI司書に聞く
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.6vw,44px)", lineHeight: 1.3, margin: "0 0 14px" }}>
              探すより、聞くほうが早い。
            </h1>
            <p style={{ fontSize: 15, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
              用語集150語・FAQ100問・マンガ・ゲーム・絵巻——このサイトの中身だけを根拠に、AI司書が答えを探して案内します。キーワードじゃなくて、質問文のままでOK。
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/search/hero.webp"
            alt="大図書館で本を高速で探すAI司書"
            className="start-hero-img"
            style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-pop)", transform: "rotate(-1.2deg)", display: "block" }}
          />
        </div>
        <Suspense fallback={null}>
          <SearchClient />
        </Suspense>
        <p style={{ margin: "34px 0 0", fontSize: 12.5, color: "var(--text-muted)", textAlign: "center" }}>
          このAI司書自体もClaude APIで作ったWORKS作品です。<a href="/works/shisho" style={{ color: "var(--red-600)" }}>しくみの紹介はこちら</a>
        </p>
      </section>
      <Footer />
    </div>
  );
}
