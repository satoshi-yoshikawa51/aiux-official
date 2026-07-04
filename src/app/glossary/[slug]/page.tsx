import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav, Footer, PAGE } from "../../site-chrome";
import { Badge, Button, Card } from "../../ds";
import { Breadcrumb, SectionHead } from "../../site-ui";
import { TERMS, getTerm } from "../data";

export const dynamicParams = false;

export function generateStaticParams() {
  return TERMS.map((t) => ({ slug: t.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getTerm(slug);
  if (!t) return {};
  const title = `${t.term}とは？意味をわかりやすく解説`;
  return {
    title: `${title}｜AI用語集｜COMIXAI`,
    description: t.short,
    keywords: [`${t.term}とは`, `${t.term} 意味`, `${t.term} わかりやすく`, "AI 用語集", "生成AI"],
    alternates: { canonical: `/glossary/${t.slug}` },
    openGraph: {
      type: "article",
      siteName: "COMIXAI",
      title,
      description: t.short,
      url: `/glossary/${t.slug}`,
      locale: "ja_JP",
      images: [{ url: "/ogp.png", width: 924, height: 540 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function GlossaryTermPage({ params }: Props) {
  const { slug } = await params;
  const t = getTerm(slug);
  if (!t) notFound();

  const related = t.relatedSlugs
    .map((s) => getTerm(s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
          { "@type": "ListItem", position: 2, name: "AI用語集", item: "https://comixai.dev/glossary" },
          { "@type": "ListItem", position: 3, name: t.term, item: `https://comixai.dev/glossary/${t.slug}` },
        ],
      },
      {
        "@type": "DefinedTerm",
        name: t.term,
        ...(t.en ? { alternateName: t.en } : {}),
        url: `https://comixai.dev/glossary/${t.slug}`,
        description: t.short,
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          "@id": "https://comixai.dev/glossary",
          name: "COMIXAI AI用語集",
        },
      },
      {
        "@type": "Article",
        headline: `${t.term}とは？意味をわかりやすく解説`,
        url: `https://comixai.dev/glossary/${t.slug}`,
        inLanguage: "ja",
        dateModified: t.lastUpdated,
        author: {
          "@type": "Person",
          name: "吉川 聡史",
          alternateName: "COMIXAI",
          url: "https://comixai.dev/profile",
        },
      },
    ],
  };

  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI用語集", href: "/glossary" }, { name: t.term }]} />

      {/* ═══ 定義 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 50px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <Badge tone="red">{t.category}</Badge>
          <span style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>{t.yomi}</span>
          {t.en && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{t.en}</span>}
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.3, margin: "0 0 22px" }}>
          {t.term}とは？
        </h1>
        <Card variant="pop" padding={22} style={{ maxWidth: 760, background: "var(--yellow-400)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 8 }}>
            DEFINITION — ひとことで言うと
          </div>
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16.5, lineHeight: 1.9 }}>{t.short}</p>
        </Card>
        <div style={{ maxWidth: 760, marginTop: 26 }}>
          {t.body.map((p) => (
            <p key={p.slice(0, 12)} style={{ fontSize: 15.5, lineHeight: 2.1, color: "var(--text-body)", margin: "0 0 16px" }}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* ═══ あわせて読みたい ═══ */}
      <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)", backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)", backgroundSize: "11px 11px" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "50px 0 54px" }}>
          <SectionHead kicker="LEARN MORE — もっと深く" title="マンガ・実践記事で理解する" hand="読むより速い、体感で学ぶ" />
          <div style={{ display: "grid", gap: 12, maxWidth: 760 }}>
            {t.links.map((l) => {
              const external = l.href.startsWith("http");
              return (
                <a key={l.href} href={l.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={{ textDecoration: "none", color: "inherit" }}>
                  <Card variant="pop" hover padding={16} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, lineHeight: 1.6 }}>
                      <i className={"ph-bold " + (external ? "ph-book-open" : "ph-arrow-bend-down-right")} style={{ color: "var(--red-500)", marginRight: 10 }} />
                      {l.label}
                    </span>
                    <i className={"ph-bold " + (external ? "ph-arrow-up-right" : "ph-arrow-right")} style={{ color: "var(--red-600)", flex: "none" }} />
                  </Card>
                </a>
              );
            })}
          </div>

          {related.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 12 }}>
                <i className="ph-bold ph-link" style={{ color: "var(--red-500)", marginRight: 8 }} />
                関連用語
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {related.map((r) => (
                  <a key={r.slug} href={`/glossary/${r.slug}`} style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5, color: "var(--ink-900)", background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-full)", padding: "8px 16px", boxShadow: "var(--shadow-pop-sm)" }}>
                    {r.term} <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)" }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "48px 0 54px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-hand)", fontSize: 17, color: "var(--text-muted)", margin: "0 0 18px" }}>
          用語を覚えるより、ストーリーで体感するほうが早い。
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/manga" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              マンガ連載で学ぶ
            </Button>
          </a>
          <a href="/glossary" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              用語集にもどる
            </Button>
          </a>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
