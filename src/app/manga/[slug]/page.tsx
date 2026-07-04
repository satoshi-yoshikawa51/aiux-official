import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav, Footer, PAGE } from "../../site-chrome";
import { Badge, Button, Card } from "../../ds";
import { ARTICLES, ARTICLES_POPULAR, NOTE, type Article } from "../../data";
import { MANGA_SERIES, getSeries } from "../data";
import { Breadcrumb, SectionHead, SeriesCard, RelatedArticleCard, toneBg } from "../ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return MANGA_SERIES.map((s) => ({ slug: s.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getSeries(slug);
  if (!s) return {};
  return {
    title: `${s.metaTitle}｜COMIXAI`,
    description: s.metaDescription,
    keywords: s.keywords,
    alternates: { canonical: `/manga/${s.slug}` },
    openGraph: {
      type: "website",
      siteName: "COMIXAI",
      title: s.metaTitle,
      description: s.metaDescription,
      url: `/manga/${s.slug}`,
      locale: "ja_JP",
      images: [{ url: s.cover, width: 900, height: 300, alt: s.title }],
    },
    twitter: { card: "summary_large_image" },
  };
}

/* note記事URL → 記事データ（あわせて読みたい欄の解決用） */
const ARTICLE_POOL = new Map<string, Article>(
  [...ARTICLES, ...ARTICLES_POPULAR].map((a) => [a.url, a])
);

export default async function MangaSeriesPage({ params }: Props) {
  const { slug } = await params;
  const s = getSeries(slug);
  if (!s) notFound();

  const related = s.relatedUrls
    .map((u) => ARTICLE_POOL.get(u))
    .filter((a): a is Article => Boolean(a));
  const others = MANGA_SERIES.filter((o) => o.slug !== s.slug);
  const hasMoreOnNote = s.totalEpisodes ? s.episodes.length < s.totalEpisodes : true;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
          { "@type": "ListItem", position: 2, name: "マンガ連載", item: "https://comixai.dev/manga" },
          { "@type": "ListItem", position: 3, name: s.title, item: `https://comixai.dev/manga/${s.slug}` },
        ],
      },
      {
        "@type": "ComicSeries",
        name: s.title,
        url: `https://comixai.dev/manga/${s.slug}`,
        image: s.cover,
        description: s.metaDescription,
        inLanguage: "ja",
        sameAs: s.noteUrl,
        ...(s.totalEpisodes ? { numberOfEpisodes: s.totalEpisodes } : {}),
        author: {
          "@type": "Person",
          name: "吉川 聡史",
          alternateName: "COMIXAI",
          url: "https://comixai.dev/profile",
        },
        hasPart: s.episodes.map((e) => ({
          "@type": "ComicStory",
          name: e.title,
          url: e.url,
          ...(e.thumb ? { image: e.thumb } : {}),
        })),
      },
    ],
  };

  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "マンガ連載", href: "/manga" }, { name: s.title }]} />

      {/* ═══ ヒーロー ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 54px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 460px) 1fr", gap: 36, alignItems: "start" }} className="mag-grid">
          <div style={{ border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-pop)", background: toneBg(s.tone) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.cover} alt={`${s.title} 表紙`} style={{ width: "100%", display: "block", aspectRatio: "900/300", objectFit: "cover" }} />
          </div>
          <div>
            <Badge tone="red" style={{ marginBottom: 14 }}>{s.label}</Badge>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.25, margin: "0 0 16px" }}>
              {s.title}
            </h1>
            {s.intro.map((p) => (
              <p key={p.slice(0, 12)} style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: "0 0 14px" }}>
                {p}
              </p>
            ))}
            <div className="hero-cta-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
              <a href={s.noteUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <Button variant="primary" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                  noteでこのシリーズを読む
                </Button>
              </a>
              {s.episodes.length > 0 && (
                <a href="#episodes" style={{ textDecoration: "none" }}>
                  <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-down" />}>
                    収録エピソードを見る
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ このシリーズで学べること ═══ */}
      <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)", backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)", backgroundSize: "11px 11px" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 58px" }}>
          <SectionHead kicker="LEARN — 学べること" title="このシリーズで学べること" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }} className="articles-grid">
            {s.points.map((pt) => (
              <Card key={pt.title} variant="pop" padding={20}>
                <i className={"ph-bold " + pt.icon} style={{ fontSize: 26, color: "var(--red-500)" }} />
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, margin: "10px 0 6px" }}>{pt.title}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: "var(--text-muted)" }}>{pt.text}</p>
              </Card>
            ))}
          </div>

          <div style={{ marginTop: 26 }}>
            <Card variant="flat" padding={22} style={{ background: "var(--paper-0)" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16, margin: "0 0 12px" }}>
                <i className="ph-bold ph-users" style={{ color: "var(--red-500)", marginRight: 8 }} />
                こんな人におすすめ
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                {s.recommendedFor.map((r) => (
                  <li key={r} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 14.5, lineHeight: 1.8, color: "var(--text-body)" }}>
                    <i className="ph-bold ph-check-circle" style={{ color: "var(--green-500)", flex: "none", transform: "translateY(2px)" }} />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══ 収録エピソード ═══ */}
      <section id="episodes" style={{ maxWidth: PAGE, margin: "0 auto", padding: "56px 0 60px" }}>
        <SectionHead
          kicker="EPISODES — 収録エピソード"
          title={s.totalEpisodes ? `収録エピソード（全${s.totalEpisodes}話）` : "収録エピソード"}
          hand="各話はnoteで読めます"
        />
        {s.episodes.length > 0 && (
          <div style={{ display: "grid", gap: 16, marginBottom: 26 }}>
            {s.episodes.map((e) => (
              <a key={e.url} href={e.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                <Card variant="pop" hover padding={0} style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {e.thumb && (
                      <div style={{ flex: "0 1 240px", minWidth: 200, background: toneBg(s.tone) }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.thumb} alt={e.title} loading="lazy" style={{ width: "100%", height: "100%", minHeight: 130, objectFit: "cover", display: "block" }} />
                      </div>
                    )}
                    <div style={{ flex: "1 1 280px", padding: "16px 18px 16px", display: "flex", flexDirection: "column", borderLeft: e.thumb ? "var(--bw-line) solid var(--ink-900)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        {e.no != null && <Badge tone="yellow">第{e.no}話</Badge>}
                        {e.likes != null && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                            <i className="ph-bold ph-heart" style={{ color: "var(--red-500)" }} /> {e.likes}
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16.5, lineHeight: 1.5, textWrap: "pretty" }}>{e.title}</h3>
                      {e.desc && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8, color: "var(--text-muted)" }}>{e.desc}</p>}
                      <span style={{ marginTop: "auto", paddingTop: 10, alignSelf: "flex-end", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                        noteで読む <i className="ph-bold ph-arrow-up-right" />
                      </span>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}
        {hasMoreOnNote && (
          <Card variant="flat" padding={24} style={{ textAlign: "center", background: "var(--paper-100)" }}>
            <p style={{ margin: "0 0 14px", fontSize: 14.5, lineHeight: 1.9, color: "var(--text-body)" }}>
              {s.totalEpisodes
                ? `シリーズ全${s.totalEpisodes}話は、noteマガジンでまとめて読めます。`
                : "最新話・全エピソードは、noteマガジンで読めます。"}
            </p>
            <a href={s.noteUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                noteマガジンを開く
              </Button>
            </a>
          </Card>
        )}
      </section>

      {/* ═══ あわせて読みたい ═══ */}
      {related.length > 0 && (
        <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)" }}>
          <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 58px" }}>
            <SectionHead kicker="RELATED — あわせて読みたい" title="あわせて読みたいnote記事" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="articles-grid">
              {related.map((a) => (
                <RelatedArticleCard key={a.url} a={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ ほかのシリーズ ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "56px 0 30px" }}>
        <SectionHead kicker="SERIES — ほかのシリーズ" title="ほかの連載シリーズ" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 22 }} className="mag-grid">
          {others.map((o) => (
            <SeriesCard key={o.slug} series={o} />
          ))}
        </div>
        <div style={{ textAlign: "center", margin: "34px 0 40px" }}>
          <a href={NOTE} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
              noteをフォローして新着を受け取る
            </Button>
          </a>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
