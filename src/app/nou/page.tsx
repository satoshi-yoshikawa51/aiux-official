import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, ShareRow } from "../site-ui";
import { NouGame } from "./game";

export const metadata: Metadata = {
  title: "速い脳・遅い脳｜推論モデル体験ゲーム｜COMIXAI",
  description:
    "流れてくる仕事を「反射AI（速い・安い・浅い）」と「熟考AI（遅い・高い・深い）」に振り分けるリアルタイム仕分けゲーム。一見カンタンで実は深い、ひっかけ仕事にご用心。推論モデルの使い分けが遊ぶだけで身につきます。",
  keywords: ["推論モデル とは", "リーズニングモデル", "AI 使い分け", "o1 とは"],
  alternates: { canonical: "/nou" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "速い脳・遅い脳｜その仕事、どっちの脳に任せる？",
    description: "反射AI⚡と熟考AI🧠に仕事を振り分けろ。予算30コイン、ミスは3回まで。",
    url: "/nou",
    locale: "ja_JP",
    images: [{ url: "/og/games/nou.png", width: 1200, height: 630, alt: "速い脳・遅い脳" }],
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
        { "@type": "ListItem", position: 2, name: "速い脳・遅い脳", item: "https://comixai.dev/nou" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "速い脳・遅い脳",
      url: "https://comixai.dev/nou",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "推論モデルと通常モデルの使い分けを体験するリアルタイム仕分けゲーム。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function NouPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "速い脳・遅い脳" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — 推論モデル体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          その仕事、どっちの脳に任せる？
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          <a href="/glossary/reasoning-model" style={{ color: "var(--red-600)", fontWeight: 700 }}>推論モデル</a>とは、答える前に「考える時間」を取るAI。賢いぶん、遅くて高い。
          反射AI⚡と熟考AI🧠、どちらに任せるかの采配があなたの仕事です。見た目に騙されないように。
        </p>
      </section>
      <section style={{ maxWidth: "min(560px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <NouGame />
      </section>
      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/nou" text="速い脳・遅い脳｜その仕事、どっちの脳に任せる？" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
