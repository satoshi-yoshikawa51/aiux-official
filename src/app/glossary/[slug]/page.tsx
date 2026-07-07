import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav, Footer, PAGE } from "../../site-chrome";
import { Badge, Button, Card } from "../../ds";
import { Breadcrumb, SectionHead, MediaLinkCard } from "../../site-ui";
import { ARTICLES, ARTICLES_POPULAR, type Tone } from "../../data";
import { MANGA_SERIES } from "../../manga/data";
import { WORK_DETAILS } from "../../works/data";
import { TERMS, getTerm, type TermLink } from "../data";
import { TermDiagram, hasDiagram } from "../diagrams";
import ARTICLE_META from "../article-meta.json";

/* —— リンク先URLから、サムネ・概要つきのカード情報を解決する ——
   マガジン/作品/note記事/収録エピソードの既存データを引くので、
   用語データ側はURLを書くだけでよい。 */
interface RichLink {
  href: string;
  title: string;
  desc?: string;
  thumb?: string;
  badge?: string;
  tone: Tone;
  likes?: number;
  external: boolean;
}

const ARTICLE_POOL = new Map(
  [...ARTICLES, ...ARTICLES_POPULAR].map((a) => [a.url, a])
);

function resolveLink(l: TermLink): RichLink {
  if (l.href.startsWith("/manga/")) {
    const s = MANGA_SERIES.find((x) => `/manga/${x.slug}` === l.href);
    if (s) return { href: l.href, title: `連載「${s.title}」`, desc: s.intro[0], thumb: s.cover, badge: s.label, tone: s.tone, external: false };
  }
  if (l.href.startsWith("/works/")) {
    const w = WORK_DETAILS.find((x) => `/works/${x.slug}` === l.href);
    if (w) return { href: l.href, title: w.title, desc: w.tagline, thumb: w.image, badge: w.badge ?? w.category, tone: w.tone, external: false };
  }
  if (l.href === "/tokenizer") {
    return { href: l.href, title: "【体験】AIは、文章をこう読む。", desc: "文章を打つと、その場でトークンに刻まれるのが見えるラボ。料金の目安や「作業机」の使用量も体験できます。", badge: "LAB", tone: "blue", external: false };
  }
  if (l.href.startsWith("/glossary/")) {
    const t = TERMS.find((x) => `/glossary/${x.slug}` === l.href);
    if (t) return { href: l.href, title: `${t.term}とは？（用語解説）`, desc: t.short, badge: "AI用語集", tone: "yellow", external: false };
  }
  const a = ARTICLE_POOL.get(l.href);
  if (a) return { href: l.href, title: a.title, desc: a.excerpt, thumb: a.thumb, badge: a.badge, tone: a.tone, likes: a.likes, external: true };
  for (const s of MANGA_SERIES) {
    const ep = s.episodes.find((e) => e.url === l.href);
    if (ep) return { href: l.href, title: ep.title, desc: ep.desc || undefined, thumb: ep.thumb, badge: ep.no != null ? `第${ep.no}話` : s.label, tone: s.tone, likes: ep.likes, external: true };
  }
  /* CIがnoteから収集した記事メタ（article-meta.json）で解決する */
  const m = (ARTICLE_META as Record<string, { title?: string; excerpt?: string; thumb?: string; likes?: number; badge?: string; tone?: string }>)[l.href];
  if (m?.title) return { href: l.href, title: m.title, desc: m.excerpt, thumb: m.thumb, badge: m.badge, tone: (m.tone as Tone) ?? "paper", likes: m.likes, external: true };
  return { href: l.href, title: l.label, tone: "paper", external: l.href.startsWith("http") };
}

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
      images: [{ url: `/og/glossary/${t.slug}.png`, width: 1200, height: 630, alt: `${t.term}とは？今さら聞けないAI用語集` }],
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

      {/* ═══ 本文 + サイドバーの2カラム ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 56px" }}>
        <div className="glossary-layout" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 44, alignItems: "start" }}>
          {/* —— 本文カラム —— */}
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <Badge tone="red">{t.category}</Badge>
              <span style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>{t.yomi}</span>
              {t.en && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{t.en}</span>}
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.3, margin: "0 0 22px" }}>
              {t.term}とは？
            </h1>
            <Card variant="pop" padding={22} style={{ background: "var(--yellow-400)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 8 }}>
                DEFINITION — ひとことで言うと
              </div>
              <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16.5, lineHeight: 1.9 }}>{t.short}</p>
            </Card>
            {(t.image || hasDiagram(t.slug)) && (
              <div style={{ marginTop: 26 }}>
                {t.image ? (
                  <div style={{ border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop)", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.image.src} alt={t.image.alt} style={{ width: "100%", display: "block" }} />
                  </div>
                ) : (
                  <TermDiagram slug={t.slug} />
                )}
              </div>
            )}
            <div style={{ marginTop: 26 }}>
              {t.body.map((p) => (
                <p key={p.slice(0, 12)} style={{ fontSize: 15.5, lineHeight: 2.1, color: "var(--text-body)", margin: "0 0 16px" }}>
                  {p}
                </p>
              ))}
            </div>

            <div style={{ marginTop: 40 }}>
              <SectionHead kicker="LEARN MORE — もっと深く" title="マンガ・実践記事で理解する" hand="読むより速い、体感で学ぶ" />
              <div style={{ display: "grid", gap: 14 }}>
                {t.links.map((l) => {
                  const r = resolveLink(l);
                  return <MediaLinkCard key={r.href} {...r} />;
                })}
              </div>
            </div>
          </div>

          {/* —— サイドバー —— */}
          <aside>
            <div style={{ position: "sticky", top: 86, display: "grid", gap: 18 }}>
              {/* 著者カード（E-E-A-T） */}
              <Card variant="pop" padding={18}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/profile/portrait.png"
                    alt="吉川聡史のプロフィール写真"
                    loading="lazy"
                    style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "var(--bw-line) solid var(--ink-900)", flex: "none" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15 }}>吉川 聡史</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>AIクリエイター / 漫画家 / UXディレクター</div>
                  </div>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 12.5, lineHeight: 1.8, color: "var(--text-muted)" }}>
                  週刊少年チャンピオンで連載経験のある漫画家が、Web制作の現場目線で執筆しています。
                </p>
                <a href="/profile" style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                  プロフィールを見る <i className="ph-bold ph-arrow-right" />
                </a>
              </Card>

              {/* 関連用語 */}
              {related.length > 0 && (
                <Card variant="flat" padding={18}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14, marginBottom: 12 }}>
                    <i className="ph-bold ph-link" style={{ color: "var(--red-500)", marginRight: 7 }} />
                    関連用語
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {related.map((r) => (
                      <a key={r.slug} href={`/glossary/${r.slug}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5, color: "var(--ink-900)", background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-full)", padding: "9px 14px", boxShadow: "var(--shadow-pop-sm)" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.term}</span>
                        <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)", flex: "none" }} />
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/* 用語集へ */}
              <a href="/glossary" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="md" block iconRight={<i className="ph-bold ph-arrow-right" />}>
                  用語集の一覧を見る
                </Button>
              </a>
            </div>
          </aside>
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
