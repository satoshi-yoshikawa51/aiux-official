import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, ShareRow } from "../site-ui";
import { DietGame } from "./game";

export const metadata: Metadata = {
  title: "AIダイエット｜量子化体験ゲーム｜COMIXAI",
  description:
    "巨大AIモデルを量子化レベル（Q16〜Q2）で圧縮して、PC・イヤホン・ゲーム機・病院サーバーなど5つの現場に載せるゲーム。絞るほど軽く速くなるが答えが壊れ、大きいままだと賢いけど遅い——容量・品質・速度のトレードオフが遊ぶだけでわかります。",
  keywords: ["量子化 とは", "LLM 量子化", "ローカルLLM Q4", "モデル 軽量化"],
  alternates: { canonical: "/diet" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AIダイエット｜絞れ。ただし、壊すな。",
    description: "Q16〜Q2の圧縮レベルを選んで5つの現場にAIを載せろ。絞りすぎると答えが「おにぎり」に。",
    url: "/diet",
    locale: "ja_JP",
    images: [{ url: "/og/games/diet.png", width: 1200, height: 630, alt: "AIダイエット" }],
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
        { "@type": "ListItem", position: 2, name: "AIダイエット", item: "https://comixai.dev/diet" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "AIダイエット",
      url: "https://comixai.dev/diet",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "量子化によるAIモデル圧縮の容量・品質・速度のトレードオフを体験するゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function DietPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIダイエット" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — 量子化体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          絞れ。ただし、壊すな。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/quantization" style={{ color: "var(--red-600)", fontWeight: 700 }}>量子化</a>とは、AIモデルの数値の精度を落としてサイズを数分の1に圧縮する技術。
          絞るほど軽く・速くなるけど、絞りすぎると答えが「おにぎり」になります。デカいままだと賢いけど、もっさり。5つの現場に、ちょうどいい圧縮を。
        </p>
      </section>
      <section style={{ maxWidth: "min(560px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <DietGame />
      </section>
      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/diet" text="AIダイエット｜絞れ。ただし、壊すな。" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
