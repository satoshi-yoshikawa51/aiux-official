import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { UndokaiGame } from "./game";

export const metadata: Metadata = {
  title: "AI運動会｜ベンチマーク体験ゲーム｜COMIXAI",
  description:
    "ベンチマークスコアを頼りに、AI選手3体が競う全4種目の勝者を予想するゲーム。数学98点のエリートが最終種目「実務」でコケる——スコアと実力のギャップ、ベンチマークとの正しい付き合い方が遊ぶだけでわかります。",
  keywords: ["ベンチマーク とは", "AI ベンチマーク", "LLM 性能比較", "AIモデル 選び方"],
  alternates: { canonical: "/undokai" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI運動会｜スコアで、勝者を当てられるか。",
    description: "ベンチマークスコアを頼りに全4種目の勝者を予想せよ。最終種目「実務」で、順位はひっくり返る。",
    url: "/undokai",
    locale: "ja_JP",
    images: [{ url: "/og/games/undokai.png", width: 1200, height: 630, alt: "AI運動会" }],
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
        { "@type": "ListItem", position: 2, name: "AI運動会", item: "https://comixai.dev/undokai" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "AI運動会",
      url: "https://comixai.dev/undokai",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "ベンチマークスコアと実務の実力のギャップを体験する勝者予想ゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function UndokaiPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI運動会" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — ベンチマーク体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          スコアで、勝者を当てられるか。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/benchmark" style={{ color: "var(--red-600)", fontWeight: 700 }}>ベンチマーク</a>とは、AIの実力を測る共通テスト。
          スコアを頼りに、AI選手3体が競う全4種目の勝者を予想してください。ただし最終種目は「実務」——テストの点数と仕事ができるかは、別の話かもしれません。
        </p>
      </section>
      <section style={{ maxWidth: "min(560px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <UndokaiGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
