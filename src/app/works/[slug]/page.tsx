import type { Metadata } from "next";
import { seoTitle } from "../../seo";
import { notFound } from "next/navigation";
import { Nav, Footer, PAGE } from "../../site-chrome";
import { Badge, Button, Card } from "../../ds";
import { ARTICLES, ARTICLES_POPULAR, type Article } from "../../data";
import { WORK_DETAILS, getWork } from "../data";
import { Breadcrumb, SectionHead, ShareRow, WorkCard, RelatedArticleCard, toneBg } from "../ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return WORK_DETAILS.map((w) => ({ slug: w.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) return {};
  return {
    title: seoTitle(w.metaTitle, "COMIXAI"),
    description: w.metaDescription,
    keywords: w.keywords,
    alternates: { canonical: `/works/${w.slug}` },
    openGraph: {
      type: "website",
      siteName: "COMIXAI",
      title: w.metaTitle,
      description: w.metaDescription,
      url: `/works/${w.slug}`,
      locale: "ja_JP",
      images: [{ url: w.image, alt: w.title }],
    },
    twitter: { card: "summary_large_image" },
  };
}

/* note記事URL → 記事データ（制作ストーリー欄の解決用） */
const ARTICLE_POOL = new Map<string, Article>(
  [...ARTICLES, ...ARTICLES_POPULAR].map((a) => [a.url, a])
);

export default async function WorkDetailPage({ params }: Props) {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) notFound();

  const stories = w.storyUrls
    .map((u) => ARTICLE_POOL.get(u))
    .filter((a): a is Article => Boolean(a));
  const others = WORK_DETAILS.filter((o) => o.slug !== w.slug);
  const isExternal = w.appUrl.startsWith("http");
  const appLinkProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
          { "@type": "ListItem", position: 2, name: "つくったもの", item: "https://comixai.dev/works" },
          { "@type": "ListItem", position: 3, name: w.title, item: `https://comixai.dev/works/${w.slug}` },
        ],
      },
      {
        "@type": w.schemaType,
        name: w.title,
        url: `https://comixai.dev/works/${w.slug}`,
        image: `https://comixai.dev${w.image}`,
        description: w.metaDescription,
        inLanguage: "ja",
        ...(w.schemaType === "VideoGame"
          ? { gamePlatform: "Web browser", playMode: "SinglePlayer" }
          : { applicationCategory: w.appCategory || "NewsApplication", operatingSystem: "Web browser" }),
        offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
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
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "つくったもの", href: "/works" }, { name: w.title }]} />

      {/* ═══ ヒーロー ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 54px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 460px) 1fr", gap: 36, alignItems: "start" }} className="mag-grid">
          <div style={{ border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-pop)", background: toneBg(w.tone) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={w.image}
              alt={`${w.title} スクリーンショット`}
              style={{ width: "100%", display: "block", aspectRatio: "16/10", objectFit: w.imageFit || "cover", padding: w.imageFit === "contain" ? 28 : 0 }}
            />
          </div>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <Badge tone="red">{w.category}</Badge>
              {w.badge && <Badge tone="ink">{w.badge}</Badge>}
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.25, margin: "0 0 10px" }}>
              {w.title}
            </h1>
            <p style={{ fontFamily: "var(--font-hand)", fontSize: 17, color: "var(--text-muted)", margin: "0 0 16px" }}>{w.tagline}</p>
            {w.intro.map((p) => (
              <p key={p.slice(0, 12)} style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: "0 0 14px" }}>
                {p}
              </p>
            ))}
            <div className="hero-cta-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
              <a href={w.appUrl} {...appLinkProps} style={{ textDecoration: "none" }}>
                <Button variant="primary" size="lg" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                  いますぐ{w.cta}（無料）
                </Button>
              </a>
              {stories.length > 0 && (
                <a href="#story" style={{ textDecoration: "none" }}>
                  <Button variant="secondary" size="lg" iconRight={<i className="ph-bold ph-arrow-down" />}>
                    制作ストーリーを見る
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 特徴 ═══ */}
      <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)", backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)", backgroundSize: "11px 11px" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 58px" }}>
          <SectionHead kicker="FEATURES — 特徴" title={`${w.title}の特徴`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="articles-grid">
            {w.features.map((f) => (
              <Card key={f.title} variant="pop" padding={20}>
                <i className={"ph-bold " + f.icon} style={{ fontSize: 26, color: "var(--red-500)" }} />
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, margin: "10px 0 6px" }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: "var(--text-muted)" }}>{f.text}</p>
              </Card>
            ))}
          </div>
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>
              <i className="ph-bold ph-wrench" style={{ color: "var(--red-500)", marginRight: 6 }} />
              つかった技術・ツール:
            </span>
            {w.tech.map((t) => (
              <span key={t} style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, background: "var(--paper-0)", border: "1px solid var(--ink-900)", borderRadius: "var(--radius-full)", padding: "5px 12px" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 制作ストーリー ═══ */}
      {stories.length > 0 && (
        <section id="story" style={{ maxWidth: PAGE, margin: "0 auto", padding: "56px 0 60px" }}>
          <SectionHead kicker="STORY — 制作ストーリー" title="どうやって作ったか" hand="一部始終をnoteで公開中" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="articles-grid">
            {stories.map((a) => (
              <RelatedArticleCard key={a.url} a={a} />
            ))}
          </div>
        </section>
      )}

      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path={`/works/${w.slug}`} text={`${w.title} — ${w.tagline}`} />
      </section>

      {/* ═══ ほかの作品 ═══ */}
      <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 30px" }}>
          <SectionHead kicker="WORKS — ほかの作品" title="ほかのつくったもの" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="articles-grid">
            {others.map((o) => (
              <WorkCard key={o.slug} work={o} />
            ))}
          </div>
          <div style={{ textAlign: "center", margin: "34px 0 40px" }}>
            <a href={w.appUrl} {...appLinkProps} style={{ textDecoration: "none" }}>
              <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                {w.title}を{w.cta}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
