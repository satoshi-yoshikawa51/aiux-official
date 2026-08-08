import type { Metadata } from "next";
import { Nav } from "../site-chrome";
import UketsukeChat from "./chat";

export const metadata: Metadata = {
  title: "AI受付｜話すだけでお問い合わせが完成する｜COMIXAI",
  description:
    "AIがあなたの用件をヒアリングして、お問い合わせ内容を自動で整理。講演・寄稿・制作・取材のご相談は、チャットで話すだけでOK。Claude APIで作った、AIクリエイター吉川聡史への新しい問い合わせ窓口です。",
  keywords: ["AI 問い合わせ", "AIチャット 受付", "Claude API 活用事例", "AI受付", "チャットボット 問い合わせフォーム", "吉川聡史"],
  alternates: { canonical: "/uketsuke" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "COMIXAI AI受付｜AIと話すだけで、お問い合わせが完成する",
    description: "AIがあなたの用件をヒアリングして、お問い合わせ内容を自動で整理。チャットで話すだけでOK。",
    url: "/uketsuke",
    locale: "ja_JP",
    images: [{ url: "/uketsuke/ogp.png", width: 1200, height: 750 }],
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
        { "@type": "ListItem", position: 2, name: "COMIXAI AI受付", item: "https://comixai.dev/uketsuke" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "COMIXAI AI受付",
      url: "https://comixai.dev/uketsuke",
      image: "https://comixai.dev/uketsuke/ogp.png",
      description: "AIが用件をヒアリングして、お問い合わせ内容を自動で整理するチャット型の受付窓口。",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web browser",
      inLanguage: "ja",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      author: { "@type": "Person", name: "吉川 聡史", alternateName: "COMIXAI", url: "https://comixai.dev/profile" },
    },
  ],
};

export default function UketsukePage() {
  return (
    <div style={{ background: "var(--paper-50)", height: "100dvh", display: "flex", flexDirection: "column" }}>
      <Nav home={false} />
      <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <UketsukeChat />
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
