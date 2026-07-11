import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { GohobiGame } from "./game";

export const metadata: Metadata = {
  title: "ご褒美で導け｜強化学習体験ゲーム｜COMIXAI",
  description:
    "AIを直接操作せず、迷路にご褒美🍖を置くだけでゴールまで導く強化学習体験ゲーム。置き方を間違えるとAIはご褒美を食べ尽くして昼寝する——報酬設計と報酬ハッキングが、遊ぶだけで体感できます。",
  keywords: ["強化学習 とは", "報酬設計", "報酬ハッキング", "AlphaGo 仕組み"],
  alternates: { canonical: "/gohobi" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "ご褒美で導け｜操作禁止。置けるのは、ご褒美だけ。",
    description: "迷路に🍖を置いてAIをゴールへ導け。置き方を間違えると、食べて昼寝します。",
    url: "/gohobi",
    locale: "ja_JP",
    images: [{ url: "/og/games/gohobi.png", width: 1200, height: 630, alt: "ご褒美で導け" }],
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
        { "@type": "ListItem", position: 2, name: "ご褒美で導け", item: "https://comixai.dev/gohobi" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "ご褒美で導け",
      url: "https://comixai.dev/gohobi",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "報酬の置き方だけでAIの行動を設計する、強化学習の報酬設計体験ゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function GohobiPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "ご褒美で導け" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — 強化学習体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          操作禁止。置けるのは、ご褒美だけ。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          <a href="/glossary/reinforcement-learning" style={{ color: "var(--red-600)", fontWeight: 700 }}>強化学習</a>とは、報酬を頼りに試行錯誤で賢くなる学習方法。
          AIを直接動かすことはできません。迷路にご褒美🍖を置いて、ゴールまで導いてください。置き方を間違えると、AIはご褒美を食べて昼寝します。
        </p>
      </section>
      <section style={{ maxWidth: "min(560px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <GohobiGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
