import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, SectionHead } from "../site-ui";
import { Badge, Card } from "../ds";
import { VS_PAIRS } from "./data";
import { TERMS } from "../glossary/data";

export const metadata: Metadata = {
  title: "AI用語の比較｜「違い」がわかると迷わない｜COMIXAI",
  description:
    "RAGとファインチューニング、生成AIとAIエージェント——混同されやすいAI用語を1ページ1組で比較。結論の先出し・比較表・使い分けの指針つきで、どっちを使うべきかがすぐわかります。",
  keywords: ["AI 用語 違い", "RAG ファインチューニング 違い", "生成AI AIエージェント 違い", "AI 比較", "わかりやすく"],
  alternates: { canonical: "/vs" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI用語の比較｜「違い」がわかると迷わない",
    description: "混同されやすいAI用語を1ページ1組で比較。結論の先出し・比較表・使い分けの指針つき。",
    url: "/vs",
    locale: "ja_JP",
    images: [{ url: "/og/vs/index.png", width: 1200, height: 630, alt: "AI用語の比較" }],
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
        { "@type": "ListItem", position: 2, name: "AI用語の比較", item: "https://comixai.dev/vs" },
      ],
    },
    {
      "@type": "CollectionPage",
      name: "AI用語の比較",
      description: "混同されやすいAI用語を1ページ1組で比較する連載。",
      url: "https://comixai.dev/vs",
    },
  ],
};

export default function VsIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Nav home={false} />
      <main>
        <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "18px 0 70px" }}>
          <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI用語の比較" }]} />
          <div style={{ margin: "26px 0 8px" }}>
            <Badge tone="red">VS — 用語の比較</Badge>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.3, margin: "0 0 14px" }}>
            「違い」がわかると、迷わない。
          </h1>
          <p style={{ margin: "0 0 34px", fontSize: 15, lineHeight: 2, color: "var(--text-body)", maxWidth: 680 }}>
            似ているようで役割が違うAI用語を、1ページ1組で比較します。結論の先出し・比較表・「どっちを使う？」の指針つき。
            もっと深く知りたくなったら、各用語の
            <a href="/glossary" style={{ color: "var(--red-600)", fontWeight: 700 }}>
              用語集ページ
            </a>
            へどうぞ。
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
            {VS_PAIRS.map((p) => (
              <a key={p.slug} href={`/vs/${p.slug}`} data-ga="card_click" data-ga-place="vs-index" data-ga-path={`/vs/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Card variant="pop" padding={20}>
                  {/* 長いペア名（プロンプトエンジニアリング等）でも自然に折り返せるよう、
                      flexではなくインラインの文章として流す */}
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
                    {p.aName}
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--red-600)", margin: "0 8px" }}>VS</span>
                    {p.bName}
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.8, color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.verdict}
                  </p>
                  <div style={{ marginTop: 10, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                    違いを見る <i className="ph-bold ph-arrow-right" />
                  </div>
                </Card>
              </a>
            ))}
          </div>

          <div style={{ marginTop: 48 }}>
            <SectionHead kicker="GLOSSARY — さらに" title="1語ずつ深く知るなら" hand={`全${TERMS.length}語・図解つき`} />
            <a href="/glossary" data-ga="cta_click" data-ga-place="vs-to-glossary" style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--red-600)" }}>
              AI用語集を見る <i className="ph-bold ph-arrow-right" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
