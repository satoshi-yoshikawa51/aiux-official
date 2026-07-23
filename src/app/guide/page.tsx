import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Button, Card } from "../ds";
import { Breadcrumb, ShareRow } from "../site-ui";
import { GUIDES, GUIDES_UPDATED } from "./data";

export const metadata: Metadata = {
  title: "職種別AI活用ガイド｜営業・マーケ・事務・クリエイター｜COMIXAI",
  description:
    "営業・マーケティング・事務・クリエイター——職種ごとに「AIをどの業務で、どう使い始めるか」を実践パターンでまとめたガイド集。コピペで使えるプロンプト、押さえるべき用語、職種別のよくある質問つき。",
  keywords: ["AI 活用 職種別", "営業 AI", "マーケティング AI", "事務 AI 効率化", "クリエイター AI"],
  alternates: { canonical: "/guide" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "職種別AI活用ガイド｜あなたの仕事の、どこで使う？",
    description: "営業・マーケ・事務・クリエイター。職種ごとの実践パターンをガイドに。",
    url: "/guide",
    locale: "ja_JP",
    images: [{ url: "/og/guide/index.png", width: 1200, height: 630, alt: "職種別AI活用ガイド" }],
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
        { "@type": "ListItem", position: 2, name: "職種別AI活用ガイド", item: "https://comixai.dev/guide" },
      ],
    },
    {
      "@type": "ItemList",
      itemListElement: GUIDES.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.title,
        url: `https://comixai.dev/guide/${g.slug}`,
      })),
    },
  ],
};

export default function GuideIndexPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "職種別AI活用ガイド" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 40px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GUIDE — 職種別AI活用ガイド
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          あなたの仕事の、<br />どこでAIを使う？
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 700, margin: 0 }}>
          「AIがすごい」のはもう分かった。知りたいのは<b>自分の仕事のどこで使えるか</b>のはず。
          職種ごとに、使い始める順番・業務別の実践パターン・注意点をまとめました。コピペで使えるプロンプトつきです（最終更新：{GUIDES_UPDATED}）。
        </p>
      </section>

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 50px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }} className="articles-grid">
          {GUIDES.map((g) => (
            <a key={g.slug} href={`/guide/${g.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card variant="pop" hover padding={22} style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/guide/${g.slug}.webp`}
                  alt={g.title}
                  loading="lazy"
                  style={{ display: "block", width: "calc(100% + 44px)", height: 190, objectFit: "cover", margin: "-22px -22px 16px", borderBottom: "var(--bw-bold) solid var(--ink-900)" }}
                />
                <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 19, lineHeight: 1.45 }}>
                  {g.emoji} {g.title}
                </h2>
                <p style={{ margin: "0 0 14px", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--red-600)" }}>{g.catch}</p>
                <p style={{ margin: "0 0 16px", fontSize: 13.5, lineHeight: 1.9, color: "var(--text-muted)" }}>{g.intro[0].slice(0, 80)}…</p>
                <span style={{ marginTop: "auto", alignSelf: "flex-end", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5, color: "var(--red-600)" }}>
                  ガイドを読む <i className="ph-bold ph-arrow-right" />
                </span>
              </Card>
            </a>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "0 0 56px" }}>
        <div style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "16px 20px", marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 2, fontWeight: 700 }}>
            職種を問わない基礎は<a href="/start" style={{ color: "var(--ink-900)" }}>AIのはじめかた</a>、道具選びは<a href="/compare" style={{ color: "var(--ink-900)" }}>3大AI比較</a>、
            言葉の意味は<a href="/glossary" style={{ color: "var(--ink-900)" }}>AI用語集（全150語）</a>へ。
          </p>
        </div>
        <ShareRow path="/guide" text="職種別AI活用ガイド（営業・マーケ・事務・クリエイター）" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
