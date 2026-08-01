import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { Breadcrumb, SectionHead } from "../site-ui";
import { RECIPES, RECIPE_CATEGORIES, recipesByCategory } from "./data";

export const metadata: Metadata = {
  title: `仕事で使えるAIプロンプト集｜コピペOKの例文${RECIPES.length}本｜COMIXAI`,
  description:
    "営業メール・議事録・企画書・Excel関数・職務経歴書——仕事のプロンプトをコピペOKの例文で紹介。ダメな指示→事故る出力→直した指示の実演つきで、AIへの頼み方そのものが身につくプロンプト集です。",
  keywords: ["プロンプト 例文", "ChatGPT プロンプト 仕事", "プロンプト テンプレート", "生成AI 業務活用 例", "プロンプト集"],
  alternates: { canonical: "/prompts" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "仕事で使えるAIプロンプト集｜コピペOKの例文と失敗例｜COMIXAI",
    description: "ダメな指示→事故る出力→直した指示の実演つき。仕事別のコピペOKプロンプト集。",
    url: "/prompts",
    locale: "ja_JP",
    images: [{ url: "/og/prompts/index.png", width: 1200, height: 630, alt: "仕事で使えるAIプロンプト集｜COMIXAI" }],
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
        { "@type": "ListItem", position: 2, name: "AIプロンプト集", item: "https://comixai.dev/prompts" },
      ],
    },
    {
      "@type": "ItemList",
      "@id": "https://comixai.dev/prompts",
      name: "COMIXAI 仕事で使えるAIプロンプト集",
      description: "仕事のタスク別に、失敗例つきでAIプロンプトの作り方を解説するレシピ集。",
      inLanguage: "ja",
      numberOfItems: RECIPES.length,
      itemListElement: RECIPES.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: r.title,
        url: `https://comixai.dev/prompts/${r.slug}`,
      })),
    },
  ],
};

export default function PromptsIndexPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIプロンプト集" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 44px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          PROMPT RECIPES — 仕事で使えるプロンプト集
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          コピペで終わらせない、<br />プロンプトの「レシピ」集。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          営業メール、議事録、企画書、Excel関数——仕事のプロンプトを、コピペOKのテンプレートつきで紹介します。ただのテンプレ集ではありません。全レシピに「ダメな指示→事故る出力→直した指示」の実演をつけたので、読み終わる頃には<strong>AIへの頼み方そのもの</strong>が身についているはずです。書いているのは、Web制作の現場でAIを使い倒している漫画家です。
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
          <Badge tone="yellow">全{RECIPES.length}レシピ</Badge>
          <Badge tone="paper">コピペ用テンプレつき</Badge>
          <Badge tone="paper">失敗例の実演つき</Badge>
        </div>
      </section>

      {/* ═══ カテゴリごとのレシピ一覧 ═══ */}
      {RECIPE_CATEGORIES.map((cat, i) => {
        const list = recipesByCategory(cat.category);
        if (list.length === 0) return null;
        const shaded = i % 2 === 0;
        const inner = (
          <div style={{ maxWidth: PAGE, margin: "0 auto", padding: shaded ? "50px 0 54px" : "44px 0 48px" }}>
            <SectionHead kicker={<><i className={"ph-bold " + cat.icon} style={{ marginRight: 6 }} />{cat.category}</>} title={cat.desc} hand={`${list.length}レシピ`} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="articles-grid">
              {list.map((r) => (
                <a key={r.slug} href={`/prompts/${r.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <Card variant="pop" hover padding={18} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <i className={"ph-bold " + r.icon} style={{ fontSize: 30, lineHeight: 1, marginBottom: 10, display: "block", color: "var(--red-500)" }} />
                    <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, lineHeight: 1.45 }}>{r.title}</h2>
                    <p style={{ margin: "0 0 14px", fontFamily: "var(--font-hand)", fontSize: 13.5, lineHeight: 1.7, color: "var(--text-muted)" }}>{r.catch}</p>
                    <span style={{ marginTop: "auto", alignSelf: "flex-end", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                      レシピを見る <i className="ph-bold ph-arrow-right" />
                    </span>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        );
        return shaded ? (
          <section
            key={cat.category}
            style={{
              background: "var(--paper-100)",
              borderTop: "var(--bw-line) solid var(--ink-900)",
              borderBottom: "var(--bw-line) solid var(--ink-900)",
              backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)",
              backgroundSize: "11px 11px",
            }}
          >
            {inner}
          </section>
        ) : (
          <section key={cat.category}>{inner}</section>
        );
      })}

      {/* ═══ 練習ゲームへの導線 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "48px 0 20px" }}>
        <a href="/shinjin" style={{ textDecoration: "none", color: "inherit", display: "block", maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              background: "var(--ink-900)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-pop)",
              padding: "26px 42px",
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "none", fontSize: 44, lineHeight: 1, color: "var(--yellow-400)" }}><i className="ph-bold ph-student" /></div>
            <div style={{ flex: "1 1 260px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--yellow-400)", fontWeight: 700, marginBottom: 6 }}>
                GAME — 読む前に、事故っておく
              </div>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(19px,3vw,25px)", color: "var(--paper-50)", lineHeight: 1.4 }}>
                AI新人くんに指示を出せ
              </h2>
              <div style={{ fontSize: 13.5, lineHeight: 1.8, color: "rgba(251,247,239,0.75)", marginTop: 4 }}>
                指示の抜けが「いい感じの事故」になる体験ゲーム。5分遊ぶと、レシピの意味が腹落ちします。
              </div>
              <div style={{ marginTop: 16 }}>
                <Button variant="yellow" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
                  遊んでみる
                </Button>
              </div>
            </div>
          </div>
        </a>
      </section>

      {/* ═══ 用語集・マンガへの導線 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "28px 0 54px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/glossary" style={{ flex: "1 1 260px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", padding: "12px 16px", boxShadow: "var(--shadow-pop-sm)" }}>
            <span style={{ fontSize: 24, flex: "none", color: "var(--red-500)" }}><i className="ph-bold ph-book-open" /></span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14 }}>AI用語集</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>プロンプト・ハルシネーション…用語の意味はこちらで</span>
            </span>
          </a>
          <a href="/manga" style={{ flex: "1 1 260px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", padding: "12px 16px", boxShadow: "var(--shadow-pop-sm)" }}>
            <span style={{ fontSize: 24, flex: "none", color: "var(--red-500)" }}><i className="ph-bold ph-books" /></span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14 }}>マンガでわかる！AI活用</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>そもそもの使い方は、マンガ連載でストーリーから</span>
            </span>
          </a>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
