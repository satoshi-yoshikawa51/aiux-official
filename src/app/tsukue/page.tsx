import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { TsukueGame } from "./game";

export const metadata: Metadata = {
  title: "AIの作業机｜コンテキストエンジニアリング体験ゲーム｜COMIXAI",
  description:
    "容量制限のある「AIの作業机」に、どの資料を載せるかを選ぶパズルゲーム。全文資料で机を圧迫したり、古い資料が毒になったり——「入る」と「読める」は別問題。コンテキストエンジニアリングの本質が遊ぶだけでわかります。",
  keywords: ["コンテキストエンジニアリング とは", "コンテキストウィンドウ", "AI 資料 渡し方", "プロンプト 資料"],
  alternates: { canonical: "/tsukue" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AIの作業机｜何を載せるかが、答えを決める。",
    description: "容量制限の机に資料を載せるパズル。全文資料は圧迫、古い資料は毒。",
    url: "/tsukue",
    locale: "ja_JP",
    images: [{ url: "/og/games/tsukue.png", width: 1200, height: 630, alt: "AIの作業机" }],
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
        { "@type": "ListItem", position: 2, name: "AIの作業机", item: "https://comixai.dev/tsukue" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "AIの作業机",
      url: "https://comixai.dev/tsukue",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "AIに渡す資料の取捨選択を体験する、コンテキストエンジニアリングのパズルゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function TsukuePage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIの作業机" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — コンテキストエンジニアリング体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          何を載せるかが、答えを決める。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          <a href="/glossary/context-engineering" style={{ color: "var(--red-600)", fontWeight: 700 }}>コンテキストエンジニアリング</a>とは、AIに渡す情報（作業机の上）を設計する技術。
          机の容量は有限です。タスクに必要な資料だけを選んで載せてください。詰め込みすぎも、古い資料も、事故のもと。
        </p>
      </section>
      <section style={{ maxWidth: "min(620px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <TsukueGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
