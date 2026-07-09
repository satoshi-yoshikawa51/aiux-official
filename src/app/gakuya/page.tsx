import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { GakuyaGame } from "./game";

export const metadata: Metadata = {
  title: "楽屋の台本｜システムプロンプト体験ゲーム｜COMIXAI",
  description:
    "AIサービスの開発者になって、楽屋でAIに渡す台本（システムプロンプト）を設計するゲーム。個人情報フィッシャーやジェイルブレイカーが来店——あなたの台本は店を守れる？口調・禁止事項・迷ったときの振る舞いの設計が体験できます。",
  keywords: ["システムプロンプト とは", "システムプロンプト 書き方", "AI キャラ設定", "ジェイルブレイク"],
  alternates: { canonical: "/gakuya" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "楽屋の台本｜AIの性格は、開演前に決まる。",
    description: "システムプロンプトを設計してAI窓口を開店。ジェイルブレイカーの来店にご注意。",
    url: "/gakuya",
    locale: "ja_JP",
    images: [{ url: "/og/games/gakuya.png", width: 1200, height: 630, alt: "楽屋の台本" }],
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
        { "@type": "ListItem", position: 2, name: "楽屋の台本", item: "https://comixai.dev/gakuya" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "楽屋の台本",
      url: "https://comixai.dev/gakuya",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "システムプロンプトの設計を体験する接客シミュレーションゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function GakuyaPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "楽屋の台本" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — システムプロンプト体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIの性格は、開演前に決まる。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          <a href="/glossary/system-prompt" style={{ color: "var(--red-600)", fontWeight: 700 }}>システムプロンプト</a>とは、サービス提供者が楽屋であらかじめAIに渡している指示のこと。
          あなたは開発者です。4項目の台本を書いて、AI窓口を開店してください。……変なお客さんも来ますよ。
        </p>
      </section>
      <section style={{ maxWidth: "min(620px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <GakuyaGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
