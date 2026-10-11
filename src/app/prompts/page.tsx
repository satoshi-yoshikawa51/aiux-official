import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { Breadcrumb, SectionHead } from "../site-ui";
import { RECIPES } from "./data";
import { PromptBrowser } from "./search";

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

      {/* ═══ 検索＋カテゴリタブ＋全レシピ（用語集と同じブラウザUI） ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "8px 0 56px" }}>
        <SectionHead kicker="SEARCH — レシピをさがす" title={`全${RECIPES.length}レシピから、さがす。`} hand="やりたいこと・カテゴリで絞り込みOK" />
        <PromptBrowser
          recipes={RECIPES.map((r) => ({
            slug: r.slug,
            title: r.title,
            catch: r.catch,
            category: r.category,
            icon: r.icon,
            short: r.short,
            keywords: r.keywords,
          }))}
        />
      </section>

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
