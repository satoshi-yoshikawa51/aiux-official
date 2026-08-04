import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav, Footer, PAGE } from "../../site-chrome";
import { Badge, Card } from "../../ds";
import { Breadcrumb, ShareRow } from "../../site-ui";
import { TERMS } from "../../glossary/data";
import { DAILY_ENTRIES, formatDailyDate, getDaily, neighborsOf } from "../data";

export function generateStaticParams() {
  return DAILY_ENTRIES.map((e) => ({ date: e.date }));
}

type Props = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const e = getDaily(date);
  if (!e) return { title: "ページが見つかりません｜COMIXAI" };
  const title = `${e.title}｜今日のAIを4コマで（${date}）｜COMIXAI`;
  return {
    title,
    description: e.lead,
    keywords: ["AI ニュース 4コマ", "生成AI わかりやすく", "AI マンガ", e.title],
    alternates: { canonical: `/daily/${date}` },
    openGraph: {
      type: "article",
      siteName: "COMIXAI",
      title: `${e.title}｜今日のAIを4コマで`,
      description: e.lead,
      url: `/daily/${date}`,
      locale: "ja_JP",
      publishedTime: `${date}T07:00:00+09:00`,
      images: [{ url: e.og, width: 1200, height: 630, alt: e.title }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function DailyEntryPage({ params }: Props) {
  const { date } = await params;
  const e = getDaily(date);
  if (!e) notFound();
  const { newer, older } = neighborsOf(date);
  const terms = e.terms
    .map((slug) => TERMS.find((t) => t.slug === slug))
    .filter((t): t is (typeof TERMS)[number] => Boolean(t));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
          { "@type": "ListItem", position: 2, name: "今日のAIを4コマで", item: "https://comixai.dev/daily" },
          { "@type": "ListItem", position: 3, name: e.title, item: `https://comixai.dev/daily/${date}` },
        ],
      },
      {
        "@type": "Article",
        headline: e.title,
        description: e.lead,
        image: `https://comixai.dev${e.image}`,
        datePublished: `${date}T07:00:00+09:00`,
        dateModified: `${date}T07:00:00+09:00`,
        inLanguage: "ja",
        author: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
        publisher: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
        mainEntityOfPage: `https://comixai.dev/daily/${date}`,
      },
    ],
  };

  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb
        trail={[{ name: "ホーム", href: "/" }, { name: "今日のAIを4コマで", href: "/daily" }, { name: e.title }]}
      />

      {/* ═══ 見出し ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 22px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.16em",
            color: "var(--red-600)",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          DAILY — {formatDailyDate(date)}
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "clamp(28px,4.6vw,46px)",
            lineHeight: 1.28,
            margin: "0 0 16px",
          }}
        >
          {e.title}
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>{e.lead}</p>
      </section>

      {/* ═══ 4コマ本体 ═══ */}
      <section style={{ maxWidth: "min(680px, 92vw)", margin: "0 auto", padding: "0 0 34px" }}>
        <img
          src={e.image}
          alt={`4コマ漫画「${e.title}」`}
          width={1080}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            border: "var(--bw-heavy) solid var(--ink-900)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-pop)",
          }}
        />
        {e.placeholderArt && (
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "12px 2px 0", lineHeight: 1.8 }}>
            ※ キャラクターの絵は仮素材です。差し替え作業中。
          </p>
        )}
      </section>

      {/* ═══ 一言 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 26px" }}>
        <Card variant="pop" padding={22} style={{ background: "var(--paper-0)" }}>
          <div
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: 13,
              color: "var(--red-600)",
              marginBottom: 8,
            }}
          >
            <i className="ph-bold ph-pen-nib" style={{ marginRight: 6 }} />
            描いた人から一言
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>{e.takeaway}</p>
        </Card>
      </section>

      {/* ═══ 出典と用語 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 30px" }}>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.9, marginBottom: terms.length ? 18 : 0 }}>
          元になったニュース：
          <a
            href={e.source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text-link)", fontWeight: 700, marginLeft: 4 }}
          >
            {e.source.title}
          </a>
          <span style={{ marginLeft: 6 }}>（{e.source.name}）</span>
        </div>
        {terms.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>
              この回に出てきた用語：
            </span>
            {terms.map((t) => (
              <a key={t.slug} href={`/glossary/${t.slug}`} style={{ textDecoration: "none" }}>
                <Badge tone="yellow">{t.term}</Badge>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 34px" }}>
        <ShareRow path={`/daily/${date}`} text={e.share || e.title} label="面白かったらシェア→" />
      </section>

      {/* ═══ 前後の回 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 60px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {older && (
            <a href={`/daily/${older.date}`} style={{ flex: "1 1 240px", textDecoration: "none", color: "inherit" }}>
              <Card variant="pop" padding={16} hover>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6 }}>
                  <i className="ph-bold ph-arrow-left" style={{ marginRight: 6 }} />
                  前の回 — {older.date}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.6 }}>{older.title}</div>
              </Card>
            </a>
          )}
          {newer && (
            <a href={`/daily/${newer.date}`} style={{ flex: "1 1 240px", textDecoration: "none", color: "inherit" }}>
              <Card variant="pop" padding={16} hover>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6, textAlign: "right" }}>
                  次の回 — {newer.date}
                  <i className="ph-bold ph-arrow-right" style={{ marginLeft: 6 }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.6, textAlign: "right" }}>{newer.title}</div>
              </Card>
            </a>
          )}
          <a href="/daily" style={{ flex: "1 1 200px", textDecoration: "none", color: "inherit" }}>
            <Card variant="pop" padding={16} hover style={{ background: "var(--ink-900)", color: "var(--text-on-ink)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, opacity: 0.7, marginBottom: 6 }}>ARCHIVE</div>
              <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.6 }}>
                これまでの回をぜんぶ見る
                <i className="ph-bold ph-arrow-up-right" style={{ marginLeft: 6 }} />
              </div>
            </Card>
          </a>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
