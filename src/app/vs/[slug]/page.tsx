import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav, Footer, PAGE } from "../../site-chrome";
import { Breadcrumb, SectionHead } from "../../site-ui";
import { Badge, Button, Card } from "../../ds";
import { VS_PAIRS, getVsPair } from "../data";
import { getTerm } from "../../glossary/data";
import { seoTitle, titleWidth } from "../../seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return VS_PAIRS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getVsPair(slug);
  if (!p) return {};
  /* 検索クエリは「A B 違い」。titleは短い言い回しから順に試す */
  const head =
    [`${p.title}をわかりやすく解説`, `${p.title}とは？`, p.title].find((s) => titleWidth(s) <= 34) ?? p.title;
  return {
    title: seoTitle(head, "COMIXAI"),
    description: p.short,
    keywords: [`${p.aName} ${p.bName} 違い`, `${p.aName} ${p.bName} 比較`, `${p.aName}と${p.bName}`, "AI 用語集", "わかりやすく"],
    alternates: { canonical: `/vs/${p.slug}` },
    openGraph: {
      type: "article",
      siteName: "COMIXAI",
      title: p.title,
      description: p.short,
      url: `/vs/${p.slug}`,
      locale: "ja_JP",
      images: [{ url: `/og/vs/${p.slug}.png`, width: 1200, height: 630, alt: p.title }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function VsPage({ params }: Props) {
  const { slug } = await params;
  const p = getVsPair(slug);
  if (!p) notFound();
  const a = getTerm(p.aSlug);
  const b = getTerm(p.bSlug);

  const JSON_LD = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
          { "@type": "ListItem", position: 2, name: "AI用語の比較", item: "https://comixai.dev/vs" },
          { "@type": "ListItem", position: 3, name: p.title, item: `https://comixai.dev/vs/${p.slug}` },
        ],
      },
      {
        "@type": "Article",
        headline: p.title,
        description: p.short,
        dateModified: p.lastUpdated,
        author: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
        mainEntityOfPage: `https://comixai.dev/vs/${p.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: p.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  const thStyle: React.CSSProperties = {
    fontFamily: "var(--font-heading)",
    fontWeight: 900,
    fontSize: 14,
    padding: "12px 14px",
    borderBottom: "var(--bw-bold) solid var(--ink-900)",
    textAlign: "left",
    whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    fontSize: 13.5,
    lineHeight: 1.8,
    padding: "12px 14px",
    borderBottom: "var(--bw-line) solid var(--line-200, rgba(20,17,15,0.14))",
    verticalAlign: "top",
    minWidth: 180,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Nav home={false} />
      <main>
        <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "18px 0 70px" }}>
          <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI用語の比較", href: "/vs" }, { name: p.title }]} />

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", margin: "18px 0 0" }}>
            <Badge tone="red">用語の比較</Badge>
            <span style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>
              {p.lastUpdated.replace(/(\d+)-0?(\d+)-0?(\d+)/, "$1年$2月$3日")}更新
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(26px,4.2vw,42px)", lineHeight: 1.35, margin: "10px 0 22px" }}>
            {p.title}とは？
          </h1>

          {/* 結論の先出し（DEFINITIONボックスと同じ役回り） */}
          <div style={{ border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", boxShadow: "var(--shadow-pop)", padding: "18px 22px", marginBottom: 28 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", fontWeight: 700, color: "var(--red-600)", marginBottom: 8 }}>
              ANSWER — ひとことで言うと
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15.5, lineHeight: 1.9 }}>{p.verdict}</p>
          </div>

          {p.lead.map((para) => (
            <p key={para.slice(0, 16)} style={{ margin: "0 0 18px", fontSize: 15, lineHeight: 2.05, color: "var(--text-body)" }}>
              {para}
            </p>
          ))}

          {/* 比較表 */}
          <section style={{ marginTop: 34 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", lineHeight: 1.5, margin: "0 0 14px", paddingLeft: 14, borderLeft: "6px solid var(--red-600)" }}>
              {p.aName}と{p.bName}の比較表
            </h2>
            <div style={{ overflowX: "auto", border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop)" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
                <thead>
                  <tr style={{ background: "var(--paper-50)" }}>
                    <th style={{ ...thStyle, width: 120 }}></th>
                    <th style={thStyle}>{p.aName}</th>
                    <th style={thStyle}>{p.bName}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.rows.map((r, i) => (
                    <tr key={r.point}>
                      <th style={{ ...tdStyle, fontFamily: "var(--font-heading)", fontWeight: 900, whiteSpace: "nowrap", minWidth: 0, background: "var(--paper-50)", borderBottom: i === p.rows.length - 1 ? "none" : tdStyle.borderBottom }} scope="row">
                        {r.point}
                      </th>
                      <td style={{ ...tdStyle, borderBottom: i === p.rows.length - 1 ? "none" : tdStyle.borderBottom }}>{r.a}</td>
                      <td style={{ ...tdStyle, borderBottom: i === p.rows.length - 1 ? "none" : tdStyle.borderBottom }}>{r.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 使い分け */}
          <section style={{ marginTop: 36 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", lineHeight: 1.5, margin: "0 0 14px", paddingLeft: 14, borderLeft: "6px solid var(--red-600)" }}>
              どっちを使う？（使い分けの指針）
            </h2>
            {p.usage.map((para) => (
              <p key={para.slice(0, 16)} style={{ margin: "0 0 18px", fontSize: 15, lineHeight: 2.05, color: "var(--text-body)" }}>
                {para}
              </p>
            ))}
          </section>

          {/* FAQ */}
          <section style={{ marginTop: 36 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", lineHeight: 1.5, margin: "0 0 14px", paddingLeft: 14, borderLeft: "6px solid var(--red-600)" }}>
              よくある質問
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {p.faq.map((f) => (
                <div key={f.q} style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop-sm)", padding: "16px 18px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 7 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--red-600)", flex: "none" }}>Q.</span>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, lineHeight: 1.7 }}>{f.q}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--text-muted)", flex: "none" }}>A.</span>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.95, color: "var(--text-body)" }}>{f.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* それぞれの用語ページへ */}
          <section style={{ marginTop: 40 }}>
            <SectionHead kicker="DEEP DIVE — それぞれを深く" title="1語ずつ、じっくり理解する" hand="図解・FAQつきの用語ページへ" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {[a, b].map(
                (t) =>
                  t && (
                    <a key={t.slug} href={`/glossary/${t.slug}`} data-ga="card_click" data-ga-place="vs-term" data-ga-path={`/glossary/${t.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <Card variant="pop" padding={18}>
                        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
                          {t.term}とは <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)" }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.8, color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {t.short}
                        </p>
                      </Card>
                    </a>
                  ),
              )}
            </div>
          </section>

          {/* あわせて読みたい */}
          {p.links.length > 0 && (
            <section style={{ marginTop: 36 }}>
              <SectionHead kicker="LEARN MORE — もっと深く" title="マンガ・体験ゲームで理解する" hand="読むより速い、体感で学ぶ" />
              <div style={{ display: "grid", gap: 10 }}>
                {p.links.map((l) => (
                  <a key={l.href} href={l.href} data-ga="card_click" data-ga-place="vs-links" data-ga-path={l.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--ink-900)", background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", padding: "14px 18px", boxShadow: "var(--shadow-pop-sm)" }}>
                    <span>{l.label}</span>
                    <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)", flex: "none" }} />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 他の比較へ */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <a href="/vs" style={{ textDecoration: "none" }}>
              <Button variant="secondary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
                ほかの「違い」も見る
              </Button>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
