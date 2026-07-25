import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, ShareRow } from "../site-ui";
import { ShachoGame } from "./game";

export const metadata: Metadata = {
  title: "AI社長｜マルチエージェント体験ゲーム｜COMIXAI",
  description:
    "3体のAIエージェント（調査係・執筆係・チェック係）にタスクを割り振り、段取りを設計する経営ゲーム。順序を間違えると捏造レポートが納品される——マルチエージェントの本質「依存関係と並列の設計」が遊ぶだけでわかります。",
  keywords: ["マルチエージェント とは", "AIエージェント 連携", "エージェント オーケストレーション", "AI 分業"],
  alternates: { canonical: "/shacho" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI社長｜段取りが、成果物を決める。",
    description: "3体の部下エージェントに仕事を割り振れ。順序を間違えると怪文書が納品されます。",
    url: "/shacho",
    locale: "ja_JP",
    images: [{ url: "/og/games/shacho.png", width: 1200, height: 630, alt: "AI社長" }],
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
        { "@type": "ListItem", position: 2, name: "AI社長", item: "https://comixai.dev/shacho" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "AI社長",
      url: "https://comixai.dev/shacho",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "マルチエージェントの分業設計を体験する経営シミュレーションゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function ShachoPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI社長" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — マルチエージェント体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          段取りが、成果物を決める。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/multi-agent" style={{ color: "var(--red-600)", fontWeight: 700 }}>マルチエージェント</a>とは、複数のAIが役割分担して働く仕組み。
          あなたはリーダーAI（社長）です。6つのタスクを3体の部下×3フェーズに配置して、レポート制作の段取りを組んでください。順序と適性、どちらも大事です。
        </p>
      </section>
      <section style={{ maxWidth: "min(680px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <ShachoGame />
      </section>
      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/shacho" text="AI社長｜段取りが、成果物を決める。" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
