import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, ShareRow } from "../site-ui";
import { SECTIONS, FAQ_TOTAL } from "./data";

export const metadata: Metadata = {
  title: `AIのよくある質問${FAQ_TOTAL}選｜不安と疑問に現場目線で答える｜COMIXAI`,
  description: `AIに仕事を奪われる？会社でChatGPTを使っていい？入力は学習される？著作権は？——AIを使う前の不安から、料金・セキュリティ・法律・教育・開発まで、よくある質問${FAQ_TOTAL}個に漫画家・AIクリエイターが現場目線で一問一答。`,
  keywords: ["AI よくある質問", "AI 仕事 奪われる", "ChatGPT 会社 使っていい", "AI 信用できる", "生成AI 不安", "AI 著作権", "AI セキュリティ"],
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "article",
    siteName: "COMIXAI",
    title: `AIのよくある質問${FAQ_TOTAL}選｜不安と疑問に、一問一答。`,
    description: "仕事を奪われる？会社で使っていい？著作権は？——現場目線で答えます。",
    url: "/faq",
    locale: "ja_JP",
    images: [{ url: "/og/games/faq.png", width: 1200, height: 630, alt: "AIのよくある質問" }],
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
        { "@type": "ListItem", position: 2, name: "AIのよくある質問", item: "https://comixai.dev/faq" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: SECTIONS.flatMap((s) =>
        s.items.map((qa) => ({
          "@type": "Question",
          name: qa.q,
          acceptedAnswer: { "@type": "Answer", text: qa.a },
        }))
      ),
    },
  ],
};

export default function FaqPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIのよくある質問" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          FAQ — AIのよくある質問
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          その不安、一問一答で。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          仕事を奪われる？会社で使っていい？著作権は？——AIを使う前の不安から、料金・セキュリティ・法律・教育・開発の疑問まで、よくある質問{FAQ_TOTAL}個に現場目線で答えます。
          目次から気になるところだけ、つまみ食いでどうぞ。
        </p>
      </section>

      {/* ═══ 目次（カテゴリへのアンカー） ═══ */}
      <nav aria-label="質問カテゴリの目次" style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 30px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 880 }}>
          {SECTIONS.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              style={{
                textDecoration: "none",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 13.5,
                color: "var(--ink-900)",
                background: "var(--paper-0)",
                border: "var(--bw-line) solid var(--ink-900)",
                borderRadius: "var(--radius-full)",
                padding: "9px 16px",
                boxShadow: "var(--shadow-pop-sm)",
              }}
            >
              {sec.emoji} {sec.title}
              <span style={{ color: "var(--text-muted)", fontWeight: 500, marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                {sec.items.length}
              </span>
            </a>
          ))}
        </div>
      </nav>

      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "6px 0 50px" }}>
        {SECTIONS.map((sec) => (
          <div key={sec.title} id={sec.id} style={{ marginBottom: 34, scrollMarginTop: 80 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", margin: "0 0 16px" }}>
              {sec.emoji} {sec.title}
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {sec.items.map((qa) => (
                <details key={qa.q} style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop-sm)", overflow: "hidden" }}>
                  <summary style={{ cursor: "pointer", padding: "14px 18px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, lineHeight: 1.6, listStyle: "none" }}>
                    <span style={{ color: "var(--red-600)", marginRight: 8 }}>Q.</span>
                    {qa.q}
                  </summary>
                  <div style={{ padding: "0 18px 16px", fontSize: 14, lineHeight: 2, color: "var(--text-body)", borderTop: "1.5px dashed rgba(20,17,15,0.15)", paddingTop: 12 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, color: "var(--red-600)", marginRight: 8 }}>A.</span>
                    {qa.body}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}

        <div style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "16px 20px" }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 2, fontWeight: 700 }}>
            解決しなかった疑問は、<a href="/search" style={{ color: "var(--ink-900)" }}>AI司書（サイト内AI検索）</a>か<a href="/glossary" style={{ color: "var(--ink-900)" }}>全150語のAI用語集</a>へ。
            「で、実際どう頼めばいいの？」には<a href="/prompts" style={{ color: "var(--ink-900)" }}>仕事で使えるプロンプト集</a>、ゼロから学ぶなら<a href="/start" style={{ color: "var(--ink-900)" }}>AIのはじめかた</a>が近道です。
          </p>
        </div>
        <div style={{ marginTop: 22 }}>
          <ShareRow path="/faq" text="AIのよくある質問100選（一問一答）" />
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
