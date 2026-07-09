import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { SlopGame } from "./game";

export const metadata: Metadata = {
  title: "スロップ・スワイプ｜AIスロップ鑑定ゲーム｜COMIXAI",
  description:
    "流れてくる記事や投稿を「スロップ（低品質AIコンテンツ）」か「良質」かスワイプで高速判定する鑑定ゲーム。出典のない数字、いかがでしたか構文、AI画像の破綻——見抜きポイントが遊ぶだけで身につきます。",
  keywords: ["AIスロップ とは", "AI 低品質コンテンツ", "フェイク 見分け方", "AI画像 見分け方"],
  alternates: { canonical: "/slop" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "スロップ・スワイプ｜その情報、食べる前に嗅げ。",
    description: "左スワイプ＝スロップ、右スワイプ＝良質。あなたのタイムラインを守る鑑定ゲーム。",
    url: "/slop",
    locale: "ja_JP",
    images: [{ url: "/og/games/slop.png", width: 1200, height: 630, alt: "スロップ・スワイプ" }],
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
        { "@type": "ListItem", position: 2, name: "スロップ・スワイプ", item: "https://comixai.dev/slop" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "スロップ・スワイプ",
      url: "https://comixai.dev/slop",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "低品質AIコンテンツ（スロップ）を見抜く力を鍛えるスワイプ鑑定ゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function SlopPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "スロップ・スワイプ" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — AIスロップ鑑定
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          その情報、食べる前に嗅げ。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          <a href="/glossary/ai-slop" style={{ color: "var(--red-600)", fontWeight: 700 }}>AIスロップ</a>とは、大量生産された低品質なAIコンテンツのこと。
          ネットに流れてくる情報を、スワイプで「スロップ🗑️」か「良質✨」に仕分けてください。後半はどんどん速くなります。
        </p>
      </section>
      <section style={{ maxWidth: "min(560px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <SlopGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
