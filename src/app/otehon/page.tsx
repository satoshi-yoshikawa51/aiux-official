import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { OtehonGame } from "./game";

export const metadata: Metadata = {
  title: "お手本ひとつで｜ゼロショット・フューショット体験ゲーム｜COMIXAI",
  description:
    "AIに渡す「お手本」を選ぶと、その特徴どおりに出力が量産される。良い例はAIを一撃で賢くし、悪い例は悪癖ごと増殖——ゼロショット・フューショットの効果とリスクが、遊ぶだけで体感できます。",
  keywords: ["ゼロショット とは", "フューショット とは", "few-shot プロンプト", "プロンプト 例示"],
  alternates: { canonical: "/otehon" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "お手本ひとつで｜お手本ひとつで、AIは化ける。",
    description: "AIに渡すお手本を選べ。良い例は一撃で効き、悪い例は悪癖ごと量産される。",
    url: "/otehon",
    locale: "ja_JP",
    images: [{ url: "/og/games/otehon.png", width: 1200, height: 630, alt: "お手本ひとつで" }],
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
        { "@type": "ListItem", position: 2, name: "お手本ひとつで", item: "https://comixai.dev/otehon" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "お手本ひとつで",
      url: "https://comixai.dev/otehon",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "ゼロショット・フューショットの例示テクニックを体験するお手本選びゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function OtehonPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "お手本ひとつで" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — ゼロショット／フューショット体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          お手本ひとつで、AIは化ける。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          <a href="/glossary/zero-shot" style={{ color: "var(--red-600)", fontWeight: 700 }}>ゼロショット</a>はお手本なしでAIに頼むこと、フューショットはお手本を見せてから頼むこと。
          良い例はAIを一撃で賢くし、悪い例は悪癖ごと量産されます。どのお手本を渡すか——あなたの目利きが試されます。
        </p>
      </section>
      <section style={{ maxWidth: "min(560px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <OtehonGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
