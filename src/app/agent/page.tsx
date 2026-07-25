import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, ShareRow } from "../site-ui";
import { AgentGame } from "./game";

export const metadata: Metadata = {
  title: "AIエージェントに任せてみた｜見守りシミュレーション【エンディング6種】｜COMIXAI",
  description:
    "AIエージェントに「ライバル3社の調査レポート」を任せるシミュレーションゲーム。口を出しすぎても、放置しすぎても事故る——あなたの「任せ方」でエンディングが分岐します。遊ぶだけでAIエージェント時代のマネジメント感覚が身につく。",
  keywords: ["AIエージェント とは", "AI 任せ方", "AIエージェント 体験", "エージェント シミュレーション"],
  alternates: { canonical: "/agent" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AIエージェントに任せてみた｜あなたの任せ方で結末が変わる",
    description: "口を出しすぎても、放置しすぎても事故る。エンディング6種の見守りシミュレーション。",
    url: "/agent",
    locale: "ja_JP",
    images: [{ url: "/og/games/agent.png", width: 1200, height: 630, alt: "AIエージェントに任せてみた" }],
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
        { "@type": "ListItem", position: 2, name: "AIエージェントに任せてみた", item: "https://comixai.dev/agent" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "AIエージェントに任せてみた",
      url: "https://comixai.dev/agent",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "AIエージェントへの仕事の任せ方を体験できる分岐型シミュレーション。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function AgentPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIエージェントに任せてみた" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — エージェント見守りシミュレーション
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          任せる勇気、試されます。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/ai-agent" style={{ color: "var(--red-600)", fontWeight: 700 }}>AIエージェント</a>は、ゴールを伝えると自分で計画して働くAI。
          でも「任せる」のは意外とむずかしい——口を出しすぎても、放置しすぎても、雑に頼んでも事故ります。あなたの任せ方で、結末は6通りに分岐します。
        </p>
      </section>
      <section style={{ maxWidth: "min(680px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <AgentGame />
      </section>
      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/agent" text="AIエージェントに任せてみた｜あなたの任せ方で結末が変わる" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
