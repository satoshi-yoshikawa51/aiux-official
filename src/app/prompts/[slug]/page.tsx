import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav, Footer, PAGE } from "../../site-chrome";
import { Badge, Button, Card } from "../../ds";
import { Breadcrumb, SectionHead } from "../../site-ui";
import { TERMS } from "../../glossary/data";
import { RECIPES, getRecipe } from "../data";
import { CopyPromptButton } from "../copy-button";

export const dynamicParams = false;

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = getRecipe(slug);
  if (!r) return {};
  return {
    title: `${r.seoTitle}｜COMIXAI`,
    description: r.short,
    keywords: r.keywords,
    alternates: { canonical: `/prompts/${r.slug}` },
    openGraph: {
      type: "article",
      siteName: "COMIXAI",
      title: r.seoTitle,
      description: r.short,
      url: `/prompts/${r.slug}`,
      locale: "ja_JP",
      images: [{ url: `/og/prompts/${r.slug}.png`, width: 1200, height: 630, alt: `${r.title}のAIプロンプト｜COMIXAI` }],
    },
    twitter: { card: "summary_large_image" },
  };
}

/* —— 見出し（本文用h2） —— */
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", lineHeight: 1.5, margin: "0 0 14px", paddingLeft: 14, borderLeft: "6px solid var(--red-600)" }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15.5, lineHeight: 2.1, color: "var(--text-body)", margin: "0 0 16px" }}>{children}</p>;
}

export default async function PromptRecipePage({ params }: Props) {
  const { slug } = await params;
  const r = getRecipe(slug);
  if (!r) notFound();

  const related = r.relatedRecipes
    .map((s) => getRecipe(s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const glossaryTerms = r.relatedGlossary
    .map((s) => TERMS.find((t) => t.slug === s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
          { "@type": "ListItem", position: 2, name: "AIプロンプト集", item: "https://comixai.dev/prompts" },
          { "@type": "ListItem", position: 3, name: r.title, item: `https://comixai.dev/prompts/${r.slug}` },
        ],
      },
      {
        "@type": "Article",
        headline: r.seoTitle,
        url: `https://comixai.dev/prompts/${r.slug}`,
        description: r.short,
        inLanguage: "ja",
        dateModified: r.lastUpdated,
        author: {
          "@type": "Person",
          name: "吉川 聡史",
          alternateName: "COMIXAI",
          url: "https://comixai.dev/profile",
        },
        isPartOf: {
          "@type": "CollectionPage",
          "@id": "https://comixai.dev/prompts",
          name: "COMIXAI 仕事で使えるAIプロンプト集",
        },
      },
      ...(r.faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: r.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIプロンプト集", href: "/prompts" }, { name: r.title }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 56px" }}>
        <div className="glossary-layout" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 44, alignItems: "start" }}>
          {/* —— 本文カラム —— */}
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <Badge tone="red">{r.category}</Badge>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{r.emoji}</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(27px,4.2vw,42px)", lineHeight: 1.35, margin: "0 0 10px" }}>
              {r.title}のプロンプト
            </h1>
            <p style={{ fontFamily: "var(--font-hand)", fontSize: 16.5, color: "var(--text-muted)", margin: "0 0 22px" }}>{r.catch}</p>

            {r.intro.map((p) => (
              <P key={p.slice(0, 12)}>{p}</P>
            ))}

            {/* —— ダメな指示の実演 —— */}
            <section style={{ marginTop: 34 }}>
              <H2>まず、事故る指示から見る</H2>
              <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
                <div style={{ background: "var(--red-600)", padding: "10px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="ph-bold ph-x-circle" style={{ color: "var(--paper-50)", fontSize: 17 }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", fontWeight: 700, color: "var(--paper-50)" }}>
                    BAD PROMPT — ありがちな頼み方
                  </span>
                </div>
                <p style={{ margin: 0, padding: "16px 18px", fontFamily: "var(--font-mono)", fontSize: 13.5, lineHeight: 1.9, background: "var(--paper-0)" }}>
                  {r.badPrompt}
                </p>
              </Card>
              <div style={{ margin: "16px 0 0", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-100)", padding: "14px 18px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                  ↓ すると、こうなる
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 2, color: "var(--text-body)" }}>{r.badResult}</p>
              </div>
              <div style={{ marginTop: 18 }}>
                {r.badWhy.map((p) => (
                  <P key={p.slice(0, 12)}>{p}</P>
                ))}
              </div>
            </section>

            {/* —— コピペ用プロンプト —— */}
            <section style={{ marginTop: 38 }}>
              <H2>コピペで使えるプロンプト</H2>
              <P>
                【 】の中を自分の状況に書き換えて使ってください。全部埋まらなくても大丈夫——埋めた分だけ、出力があなた仕様になります。
              </P>
              <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
                <div style={{ background: "var(--ink-900)", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", fontWeight: 700, color: "var(--yellow-400)" }}>
                    GOOD PROMPT — このままコピペOK
                  </span>
                  <CopyPromptButton text={r.goodPrompt} />
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: "18px 18px 20px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    lineHeight: 1.95,
                    background: "var(--paper-0)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowX: "auto",
                  }}
                >
                  {r.goodPrompt}
                </pre>
              </Card>
            </section>

            {/* —— なぜ効くのか —— */}
            <section style={{ marginTop: 38 }}>
              <H2>このプロンプトが効く理由</H2>
              <div style={{ display: "grid", gap: 12 }}>
                {r.points.map((p, i) => (
                  <div key={p.label} style={{ display: "flex", gap: 14, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop-sm)", padding: "15px 17px" }}>
                    <span style={{ flex: "none", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 21, color: "var(--red-600)", lineHeight: 1.2 }}>
                      {i + 1}
                    </span>
                    <div>
                      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 4 }}>{p.label}</div>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.95, color: "var(--text-body)" }}>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* —— アレンジ —— */}
            <section style={{ marginTop: 38 }}>
              <H2>アレンジレシピ</H2>
              <div style={{ display: "grid", gap: 12 }}>
                {r.arrange.map((a) => (
                  <div key={a.title} style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", boxShadow: "var(--shadow-pop-sm)", padding: "15px 17px" }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 4 }}>
                      <i className="ph-bold ph-shuffle" style={{ marginRight: 7 }} />
                      {a.title}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.95, color: "var(--ink-900)" }}>{a.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* —— 現場の注意 —— */}
            <section style={{ marginTop: 38 }}>
              <H2>現場の注意（ここで事故る）</H2>
              <div style={{ display: "grid", gap: 12 }}>
                {r.pitfalls.map((p) => (
                  <div key={p.title} style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop-sm)", padding: "15px 17px" }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 4 }}>
                      <i className="ph-bold ph-warning" style={{ color: "var(--red-600)", marginRight: 7 }} />
                      {p.title}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.95, color: "var(--text-body)" }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* —— FAQ（FAQPage構造化データと対応） —— */}
            {r.faq.length > 0 && (
              <section style={{ marginTop: 38 }}>
                <H2>{r.title}×AIのよくある質問</H2>
                <div style={{ display: "grid", gap: 12 }}>
                  {r.faq.map((f) => (
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
            )}

            {/* —— 体験ゲームへの扉 —— */}
            {r.game && (
              <a href={r.game.href} style={{ textDecoration: "none", color: "inherit", display: "block", marginTop: 36 }}>
                <div style={{ background: "var(--ink-900)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", padding: "22px 28px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ flex: "none", fontSize: 38, lineHeight: 1 }}>🎮</div>
                  <div style={{ flex: "1 1 240px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--yellow-400)", fontWeight: 700, marginBottom: 6 }}>
                      GAME — 遊んで身につける
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(17px,2.6vw,22px)", color: "var(--paper-50)", lineHeight: 1.4 }}>
                      {r.game.title}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: "rgba(251,247,239,0.75)", marginTop: 4 }}>{r.game.desc}</div>
                  </div>
                  <Button variant="yellow" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
                    遊んでみる
                  </Button>
                </div>
              </a>
            )}
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
                  週刊少年チャンピオンで連載経験のある漫画家が、Web制作の現場で実際に使っているプロンプトをレシピ化しています。
                </p>
                <a href="/profile" style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                  プロフィールを見る <i className="ph-bold ph-arrow-right" />
                </a>
              </Card>

              {/* 関連レシピ */}
              {related.length > 0 && (
                <Card variant="flat" padding={18}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14, marginBottom: 12 }}>
                    <i className="ph-bold ph-fork-knife" style={{ color: "var(--red-500)", marginRight: 7 }} />
                    関連レシピ
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {related.map((x) => (
                      <a key={x.slug} href={`/prompts/${x.slug}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5, color: "var(--ink-900)", background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-full)", padding: "9px 14px", boxShadow: "var(--shadow-pop-sm)" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {x.emoji} {x.title}
                        </span>
                        <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)", flex: "none" }} />
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/* 関連用語 */}
              {glossaryTerms.length > 0 && (
                <Card variant="flat" padding={18}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14, marginBottom: 12 }}>
                    <i className="ph-bold ph-book-open-text" style={{ color: "var(--red-500)", marginRight: 7 }} />
                    このレシピに出てくる用語
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {glossaryTerms.map((t) => (
                      <a key={t.slug} href={`/glossary/${t.slug}`} style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12.5, color: "var(--ink-900)", background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-full)", padding: "7px 13px", boxShadow: "var(--shadow-pop-sm)" }}>
                        {t.term}
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              <a href="/prompts" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="md" block iconRight={<i className="ph-bold ph-arrow-right" />}>
                  プロンプト集の一覧を見る
                </Button>
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "44px 0 54px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-hand)", fontSize: 17, color: "var(--text-muted)", margin: "0 0 18px" }}>
          レシピは覚えるより、今日の仕事でひとつ試すほうが早い。
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/prompts" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              他のレシピをさがす
            </Button>
          </a>
          <a href="/manga" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              マンガ連載で学ぶ
            </Button>
          </a>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
