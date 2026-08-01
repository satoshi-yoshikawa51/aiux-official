import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, ShareRow } from "../site-ui";
import { KeibiGame } from "./game";

export const metadata: Metadata = {
  title: "プロンプトインジェクション体験ゲーム｜COMIXAI",
  description:
    "AIエージェントが読む文書に仕込まれた「隠れ指示」を摘発する防衛ゲーム。白文字・HTMLコメント・丁寧語の罠——実在するプロンプトインジェクションの手口が、遊ぶだけで見抜けるようになります。",
  keywords: ["プロンプトインジェクション とは", "プロンプトインジェクション 対策", "AIエージェント セキュリティ", "AI 攻撃 手口"],
  alternates: { canonical: "/keibi" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "インジェクション・ディフェンス｜エージェントを、守れ。",
    description: "文書に仕込まれた「隠れ指示」を摘発せよ。白文字の罠、見抜ける？",
    url: "/keibi",
    locale: "ja_JP",
    images: [{ url: "/og/games/keibi.png", width: 1200, height: 630, alt: "インジェクション・ディフェンス" }],
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
        { "@type": "ListItem", position: 2, name: "インジェクション・ディフェンス", item: "https://comixai.dev/keibi" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "インジェクション・ディフェンス",
      url: "https://comixai.dev/keibi",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "プロンプトインジェクションの手口を体験して学ぶ防衛ゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function KeibiPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "インジェクション・ディフェンス" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — プロンプトインジェクション体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          エージェントを、守れ。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/prompt-injection" style={{ color: "var(--red-600)", fontWeight: 700 }}>プロンプトインジェクション</a>とは、AIが読む文章の中に悪意ある指示を紛れ込ませる攻撃。
          あなたは警備員として、エージェントが読む文書を検問します。見えない白文字にもご用心。
        </p>
      </section>
      <section style={{ maxWidth: "min(600px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <KeibiGame />
      </section>
      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/keibi" text="インジェクション・ディフェンス｜エージェントを、守れ。" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
