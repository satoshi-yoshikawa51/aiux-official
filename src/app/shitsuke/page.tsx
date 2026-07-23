import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { ShitsukeGame } from "./game";

export const metadata: Metadata = {
  title: "AI調教師｜RLHF体験ゲーム｜COMIXAI",
  description:
    "2つの回答から「好み」を10回選ぶと、あなた好みのAIが育つ。事実ばかり選ぶと硬派AIに、心地よさばかり選ぶとゴマすりAIに——RLHF（人間のフィードバックによる強化学習）の仕組みと副作用「追従性」が、遊ぶだけで体感できます。",
  keywords: ["RLHF とは", "人間のフィードバックによる強化学習", "AI 追従性", "AI お世辞"],
  alternates: { canonical: "/shitsuke" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI調教師｜あなたの「好み」がAIを作る。",
    description: "2つの答えから好きな方を10回選ぶだけ。育つのは硬派AI？それともゴマすりAI？",
    url: "/shitsuke",
    locale: "ja_JP",
    images: [{ url: "/og/games/shitsuke.png", width: 1200, height: 630, alt: "AI調教師" }],
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
        { "@type": "ListItem", position: 2, name: "AI調教師", item: "https://comixai.dev/shitsuke" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "AI調教師",
      url: "https://comixai.dev/shitsuke",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "人間の好みでAIを調教するRLHF体験ゲーム。選び方しだいで硬派AIにもゴマすりAIにも育つ。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function ShitsukePage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI調教師" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — RLHF体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          「いいね」の積み重ねが、AIを作る。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/rlhf" style={{ color: "var(--red-600)", fontWeight: 700 }}>RLHF</a>とは、人間の「どっちの答えが好き？」を報酬にしてAIを調教する手法。
          ChatGPTが感じよくなったのはこれのおかげ——でも、好みに寄せすぎると「ゴマすりAI」が生まれます。10回の選択で、あなたのAIを育ててください。
        </p>
      </section>
      <section style={{ maxWidth: "min(560px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <ShitsukeGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
