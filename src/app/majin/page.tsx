import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, ShareRow } from "../site-ui";
import { MajinGame } from "./game";

export const metadata: Metadata = {
  title: "魔神AIの願い方｜アライメント体験ゲーム｜COMIXAI",
  description:
    "言葉どおりに願いを叶える魔神AIに、事故らない願い方ができるか。「テストで高得点を」と言えばカンニングも辞さない——AIの目標を人間の意図と揃える「アライメント」がなぜ必要か、5つの願いで体感できます。",
  keywords: ["アライメント とは", "AI アライメント", "AI 安全性", "AI 目標設定"],
  alternates: { canonical: "/majin" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "魔神AIの願い方｜願いは、言葉どおりに叶う。",
    description: "魔神は悪気ゼロで、あなたの言葉だけを全力で叶えます。5つの願い、事故らせずに叶えられる？",
    url: "/majin",
    locale: "ja_JP",
    images: [{ url: "/og/games/majin.png", width: 1200, height: 630, alt: "魔神AIの願い方" }],
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
        { "@type": "ListItem", position: 2, name: "魔神AIの願い方", item: "https://comixai.dev/majin" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "魔神AIの願い方",
      url: "https://comixai.dev/majin",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "字義どおりに願いを叶える魔神AIで、アライメント（AIと人間の意図合わせ）の重要性を体験するゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function MajinPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "魔神AIの願い方" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — アライメント体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          願いは、言葉どおりに叶う。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/alignment" style={{ color: "var(--red-600)", fontWeight: 700 }}>アライメント</a>とは、AIの目標を人間の意図と「揃える」こと。
          魔神は悪気ゼロで、あなたの言葉だけを全力で叶えます。行間は読みません。5つの願い、事故らせずに叶えられますか？
        </p>
      </section>
      <section style={{ maxWidth: "min(560px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <MajinGame />
      </section>
      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/majin" text="魔神AIの願い方｜願いは、言葉どおりに叶う。" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
