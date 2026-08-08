import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, ShareRow } from "../site-ui";
import { VibeGame } from "./game";

export const metadata: Metadata = {
  title: "3分バイブコーディング｜雑な一言でアプリが完成｜COMIXAI",
  description:
    "「もっとポップに」「なんかこう、ドン！って」——雑な一言を選ぶだけで、目の前でミニアプリが変形していくバイブコーディング体験。仕様書ゼロ、4ターンで完成。組み合わせは81通り。",
  keywords: ["バイブコーディング", "vibe coding とは", "AI アプリ開発 体験", "Claude Code"],
  alternates: { canonical: "/vibe" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "3分バイブコーディング｜雑な一言でアプリが完成",
    description: "仕様書ゼロ。「もっとポップに」だけでアプリが変形していく体験。",
    url: "/vibe",
    locale: "ja_JP",
    images: [{ url: "/og/games/vibe.png", width: 1200, height: 630, alt: "3分バイブコーディング" }],
  },
  twitter: { card: "summary_large_image" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
        { "@type": "ListItem", position: 2, name: "3分バイブコーディング", item: "https://comixai.dev/vibe" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "3分バイブコーディング",
      url: "https://comixai.dev/vibe",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "会話の選択だけでミニアプリが組み上がっていく、バイブコーディングの体験シミュレーター。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function VibePage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "3分バイブコーディング" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — バイブコーディング体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          仕様書ゼロで、アプリを作ろう。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/vibe-coding" style={{ color: "var(--red-600)", fontWeight: 700 }}>バイブコーディング</a>とは、細かい実装はAIに任せて、ノリと会話でものを作る開発スタイル。
          ここでは雑な一言を選ぶだけで、目の前のミニアプリが本当に変形していきます。4ターンで完成、組み合わせは81通り。
        </p>
      </section>
      <section style={{ maxWidth: "min(680px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <VibeGame />
      </section>
      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/vibe" text="3分バイブコーディング｜雑な一言でアプリが完成" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
