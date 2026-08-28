import type { Metadata } from "next";
import { seoTitle } from "../../seo";
import { notFound } from "next/navigation";
import { Nav, Footer, PAGE } from "../../site-chrome";
import { Badge, Button, Card } from "../../ds";
import { AcademyCard, Breadcrumb, SectionHead, ShareRow } from "../../site-ui";
import { GUIDES, GUIDES_UPDATED, getGuide } from "../data";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return {
    title: seoTitle(g.title, "今日から使える実践パターン", "COMIXAI"),
    description: g.metaDescription,
    keywords: g.keywords,
    alternates: { canonical: `/guide/${g.slug}` },
    openGraph: {
      type: "article",
      siteName: "COMIXAI",
      title: g.title,
      description: g.catch,
      url: `/guide/${g.slug}`,
      locale: "ja_JP",
      images: [{ url: `/guide/${g.slug}.webp`, width: 1200, height: 800, alt: g.title }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
          { "@type": "ListItem", position: 2, name: "職種別AI活用ガイド", item: "https://comixai.dev/guide" },
          { "@type": "ListItem", position: 3, name: g.title, item: `https://comixai.dev/guide/${g.slug}` },
        ],
      },
      {
        "@type": "Article",
        headline: g.title,
        description: g.metaDescription,
        url: `https://comixai.dev/guide/${g.slug}`,
        inLanguage: "ja",
        dateModified: GUIDES_UPDATED,
        author: { "@type": "Person", name: "吉川 聡史", alternateName: "COMIXAI", url: "https://comixai.dev/profile" },
      },
      {
        "@type": "FAQPage",
        mainEntity: g.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "職種別AI活用ガイド", href: "/guide" }, { name: g.role }]} />

      {/* ═══ ヒーロー（PC: テキスト左・キャラ右の2カラム / スマホ: 縦積み） ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 30px", display: "flex", gap: "36px 44px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px", minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
            GUIDE — 職種別AI活用
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.6vw,44px)", lineHeight: 1.3, margin: "0 0 12px" }}>
            <i className={"ph-bold " + g.icon} style={{ marginRight: 10 }} />
            {g.title}
          </h1>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: "clamp(15px,2vw,17px)", color: "var(--red-600)", margin: "0 0 16px" }}>{g.catch}</p>
          {g.intro.map((p, i) => (
            <p key={i} style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 720, margin: "0 0 12px" }}>
              {p}
            </p>
          ))}
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", margin: "6px 0 0" }}>最終更新：{GUIDES_UPDATED}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/guide/${g.slug}.webp`}
          alt={g.title}
          className="guide-hero-img"
          style={{ flex: "0 1 440px", width: "min(440px, 100%)", height: "auto", aspectRatio: "3/2", objectFit: "cover", border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", marginTop: 18 }}
        />
      </section>

      {/* ═══ はじめの3ステップ ═══ */}
      <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)", backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)", backgroundSize: "11px 11px" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "50px 0 54px" }}>
          <SectionHead kicker={<><i className="ph-bold ph-rocket-launch" style={{ marginRight: 6 }} />START — はじめかた</>} title="最初の3ステップ" hand="順番どおりが最短ルート" />
          <div style={{ display: "grid", gap: 14, maxWidth: 780 }}>
            {g.steps.map((s, i) => (
              <Card key={s.title} variant="pop" padding={20}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ flex: "none", width: 36, height: 36, borderRadius: "50%", background: "var(--yellow-400)", border: "var(--bw-line) solid var(--ink-900)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 17 }}>
                    {i + 1}
                  </span>
                  <div>
                    <h2 style={{ margin: "4px 0 8px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, lineHeight: 1.5 }}>{s.title}</h2>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 2, color: "var(--text-body)" }}>{s.body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 業務別ユースケース ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "50px 0 44px" }}>
        <SectionHead kicker={<><i className="ph-bold ph-briefcase" style={{ marginRight: 6 }} />USE CASES — 業務別</>} title={`${g.role}の仕事、ここで使える。`} hand="コピペで使えるレシピつき" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="articles-grid">
          {g.useCases.map((u) => (
            <Card key={u.task} variant="pop" padding={20} style={{ display: "flex", flexDirection: "column" }}>
              <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16.5, lineHeight: 1.5 }}>
                <i className={"ph-bold " + u.icon} style={{ marginRight: 8, color: "var(--red-500)" }} />
                {u.task}
              </h2>
              <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.95, color: "var(--text-body)" }}>{u.how}</p>
              <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {u.prompts.map((p) => (
                  <a
                    key={p.slug}
                    href={`/prompts/${p.slug}`}
                    style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12.5, color: "var(--ink-900)", background: "var(--yellow-400)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-full)", padding: "6px 13px", boxShadow: "var(--shadow-pop-sm)" }}
                  >
                    <i className="ph-bold ph-clipboard-text" style={{ marginRight: 5 }} />
                    {p.label}
                  </a>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══ 押さえておく用語 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 44px" }}>
        <SectionHead kicker={<><i className="ph-bold ph-books" style={{ marginRight: 6 }} />WORDS — 押さえておく用語</>} title="この5語だけは。" hand="クリックで図解つき解説へ" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 880 }}>
          {g.terms.map((t) => (
            <a
              key={t.slug}
              href={`/glossary/${t.slug}`}
              style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5, color: "var(--ink-900)", background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-full)", padding: "9px 16px", boxShadow: "var(--shadow-pop-sm)" }}
            >
              {t.label}
            </a>
          ))}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "0 0 44px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", margin: "0 0 16px" }}><i className="ph-bold ph-chat-circle-dots" style={{ marginRight: 8, color: "var(--red-500)" }} />{g.role}のよくある質問</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {g.faq.map((f) => (
            <details key={f.q} style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop-sm)", overflow: "hidden" }}>
              <summary style={{ cursor: "pointer", padding: "14px 18px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, lineHeight: 1.6, listStyle: "none" }}>
                <span style={{ color: "var(--red-600)", marginRight: 8 }}>Q.</span>
                {f.q}
              </summary>
              <div style={{ padding: "12px 18px 16px", fontSize: 14, lineHeight: 2, color: "var(--text-body)", borderTop: "1.5px dashed rgba(20,17,15,0.15)" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, color: "var(--red-600)", marginRight: 8 }}>A.</span>
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ 次の一歩 ═══ */}
      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "0 0 56px" }}>
        <div style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "16px 20px", marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 2, fontWeight: 700 }}>
            使うAIに迷ったら<a href="/compare" style={{ color: "var(--ink-900)" }}>3大AIの使い分け比較</a>、ゼロから学ぶなら<a href="/start" style={{ color: "var(--ink-900)" }}>AIのはじめかた</a>へ。
            他の職種のガイドは<a href="/guide" style={{ color: "var(--ink-900)" }}>ガイド一覧</a>からどうぞ。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 26 }}>
          <a href="/prompts" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              プロンプト集（全24レシピ）
            </Button>
          </a>
          <a href="/guide" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              他の職種のガイド
            </Button>
          </a>
        </div>
        <div style={{ marginBottom: 26 }}>
          <AcademyCard place="guide-next" wide />
        </div>
        <ShareRow path={`/guide/${g.slug}`} text={`${g.title}——今日から使える実践パターン`} />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
