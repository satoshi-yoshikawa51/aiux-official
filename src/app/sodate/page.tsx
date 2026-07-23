import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { SodateGame } from "./game";

export const metadata: Metadata = {
  title: "AIを育てよう｜ファインチューニング体験ゲーム｜COMIXAI",
  description:
    "学習データ（餌）を選んでAIを育てる体験ゲーム。猫の写真ばかり与えると、何を聞いても猫の話しかしなくなる——「過学習」を育成ゲームで体感。学習データがAIの人格を決める、ファインチューニングの本質が3分でわかります。",
  keywords: ["ファインチューニング とは", "過学習 わかりやすく", "AI 学習データ", "AI 育成 ゲーム"],
  alternates: { canonical: "/sodate" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AIを育てよう｜餌（学習データ）でAIの人格が変わる",
    description: "猫ばかり食べさせると猫の話しかしなくなる。「過学習」を体感できる育成ゲーム。",
    url: "/sodate",
    locale: "ja_JP",
    images: [{ url: "/og/games/sodate.png", width: 1200, height: 630, alt: "AIを育てよう" }],
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
        { "@type": "ListItem", position: 2, name: "AIを育てよう", item: "https://comixai.dev/sodate" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "AIを育てよう",
      url: "https://comixai.dev/sodate",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "学習データを選んでAIを育てる、ファインチューニングと過学習の体験ゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function SodatePage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIを育てよう" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — ファインチューニング体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIの人格は、餌で決まる。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/fine-tuning" style={{ color: "var(--red-600)", fontWeight: 700 }}>ファインチューニング</a>とは、AIに追加のデータを学習させて性格や得意分野を変えること。
          ここでは学習データを「餌」として3回与えて、AIを育てます。偏った食生活にすると……どうなるかは、育ててのお楽しみ。
        </p>
      </section>
      <section style={{ maxWidth: "min(680px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <SodateGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
