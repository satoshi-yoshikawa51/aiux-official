import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { ShinjinGame } from "./game";

export const metadata: Metadata = {
  title: "AI新人くんに指示を出せ｜プロンプト体験ゲーム｜COMIXAI",
  description:
    "「誰に・形式・トーン・長さ」を指定してAI新人くんに発注。指定し忘れた項目は新人くんが「いい感じ」に解釈します——ラップで納品されても泣かない。笑いながらプロンプトエンジニアリングの基本が身につくゲーム。",
  keywords: ["プロンプトエンジニアリング", "プロンプト 書き方", "AI 指示 コツ", "プロンプト 練習"],
  alternates: { canonical: "/shinjin" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI新人くんに指示を出せ｜指定し忘れると「いい感じ」に事故る",
    description: "笑いながらプロンプトの基本4点セットが身につく体験ゲーム。",
    url: "/shinjin",
    locale: "ja_JP",
    images: [{ url: "/og/games/shinjin.png", width: 1200, height: 630, alt: "AI新人くんに指示を出せ" }],
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
        { "@type": "ListItem", position: 2, name: "AI新人くんに指示を出せ", item: "https://comixai.dev/shinjin" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "AI新人くんに指示を出せ",
      url: "https://comixai.dev/shinjin",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "指示の部品を組み合わせてAIに発注する、プロンプトエンジニアリングの体験ゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function ShinjinPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI新人くんに指示を出せ" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — プロンプト体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          その指示、AIに伝わってますか？
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          AIは、指示されなかったことを「いい感じ」に想像で埋めます。それがときどき、詩やラップになる——。
          <a href="/glossary/prompt-engineering" style={{ color: "var(--red-600)", fontWeight: 700 }}>プロンプトエンジニアリング</a>の基本
          「誰に・形式・トーン・長さ」を、AI新人くんへの発注で体験しましょう。
        </p>
      </section>
      <section style={{ maxWidth: "min(680px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <ShinjinGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
