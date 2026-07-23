import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { TokenizerLab } from "./lab";

export const metadata: Metadata = {
  title: "トークナイザー体験｜AIは文章をこう読む【打つだけでわかる】｜COMIXAI",
  description:
    "文章を打つと、AIが実際に使うトークナイザーがその場で文章を「トークン」に刻む様子を体験できます。トークン数・料金の目安・コンテキストウィンドウの使用量まで一目でわかる、触って学べるAI用語ラボ。",
  keywords: ["トークナイザー", "トークン数 数える", "トークンとは", "AI 料金 トークン", "コンテキストウィンドウ"],
  alternates: { canonical: "/tokenizer" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "トークナイザー体験｜AIは文章をこう読む",
    description: "文章を打つと、その場でトークンに刻まれる。触って学べるAI用語ラボ。",
    url: "/tokenizer",
    locale: "ja_JP",
    images: [{ url: "/og/tokenizer.png", width: 1200, height: 630, alt: "トークナイザー体験｜AIは文章をこう読む" }],
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
        { "@type": "ListItem", position: 2, name: "トークナイザー体験", item: "https://comixai.dev/tokenizer" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "トークナイザー体験",
      url: "https://comixai.dev/tokenizer",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "文章がAIのトークンに分割される様子をリアルタイムで体験できる学習ツール。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function TokenizerPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "トークナイザー体験" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          LAB — トークナイザー体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIは、文章をこう読む。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          AIは文章を1文字ずつではなく、<a href="/glossary/token" style={{ color: "var(--red-600)", fontWeight: 700 }}>トークン</a>という単位に刻んで読んでいます。
          下の箱に文章を打つと、GPT系のAIが実際に使っているトークナイザーが、その場であなたの文章を刻みます。
          入力した文章はどこにも送信されません（すべてブラウザ内で完結）。
        </p>
      </section>

      <section style={{ maxWidth: "min(860px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <TokenizerLab />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
