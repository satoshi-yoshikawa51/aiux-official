import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Button, Card } from "../ds";
import { Breadcrumb, SectionHead } from "../site-ui";
import { TERMS, FEATURED_TERMS } from "./data";
import { GlossaryBrowser } from "./browser";

export const metadata: Metadata = {
  title: "AI用語集｜生成AI・LLM・RAGをわかりやすく解説｜COMIXAI",
  description:
    "生成AI・LLM・RAG・プロンプトエンジニアリング・AIエージェント・Claude Codeなど、AI活用の頻出用語を現場目線でわかりやすく解説。マンガで学べる連載や実践記事とあわせて、AIの「わからない」をなくす用語集です。",
  keywords: ["AI 用語集", "生成AI 用語", "AI 用語 わかりやすく", "LLMとは", "RAGとは", "AI 初心者"],
  alternates: { canonical: "/glossary" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI用語集｜生成AI・LLM・RAGをわかりやすく解説｜COMIXAI",
    description: "AI活用の頻出用語を、マンガ連載とセットで現場目線でわかりやすく解説。",
    url: "/glossary",
    locale: "ja_JP",
    images: [{ url: "/ogp.png", width: 924, height: 540 }],
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
        { "@type": "ListItem", position: 2, name: "AI用語集", item: "https://comixai.dev/glossary" },
      ],
    },
    {
      "@type": "DefinedTermSet",
      "@id": "https://comixai.dev/glossary",
      name: "COMIXAI AI用語集",
      description: "生成AI活用の頻出用語を、現場目線でわかりやすく解説する用語集。",
      inLanguage: "ja",
      hasDefinedTerm: TERMS.map((t) => ({
        "@type": "DefinedTerm",
        name: t.term,
        url: `https://comixai.dev/glossary/${t.slug}`,
        description: t.short,
      })),
    },
  ],
};

export default function GlossaryIndexPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI用語集" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 50px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GLOSSARY — AI用語集
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIの「わからない」を、なくす。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          生成AI・LLM・RAG・AIエージェント——ニュースで毎日見かけるのに、いまさら聞きづらいAI用語を、Web制作の現場でAIを使い倒している漫画家・AIクリエイターが、現場目線でわかりやすく解説します。もっと深く知りたくなったら、マンガ連載へどうぞ。
        </p>
      </section>

      <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)", backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)", backgroundSize: "11px 11px" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 58px" }}>
          <SectionHead kicker="START HERE — まずはここから" title="まずはこの12語" hand="図解つき・代表用語" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="articles-grid">
            {FEATURED_TERMS.map((t) => (
              <a key={t.slug} href={`/glossary/${t.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Card variant="pop" hover padding={18} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17.5, lineHeight: 1.4 }}>{t.term}</h2>
                  {t.en && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{t.en}</div>}
                  <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.8, color: "var(--text-muted)" }}>{t.short}</p>
                  <span style={{ marginTop: "auto", alignSelf: "flex-end", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                    くわしく見る <i className="ph-bold ph-arrow-right" />
                  </span>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 全用語をさがす ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 60px" }}>
        <SectionHead kicker="SEARCH — 全用語をさがす" title={`全${TERMS.length}語から、さがす。`} hand="読み・英語・意味でも検索OK" />
        <GlossaryBrowser
          terms={TERMS.map((t) => ({ slug: t.slug, term: t.term, yomi: t.yomi, en: t.en, category: t.category, short: t.short }))}
        />
      </section>

      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "40px 0 46px" }}>
        <SectionHead kicker="MANGA — マンガ連載" title="用語の先は、マンガで。" hand="ストーリーで学ぶと忘れない" />
        <a href="/manga" style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
            連載シリーズ一覧を見る
          </Button>
        </a>
      </div>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
