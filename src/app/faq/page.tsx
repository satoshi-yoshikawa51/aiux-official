import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";

export const metadata: Metadata = {
  title: "AIのよくある質問20選｜不安と疑問に現場目線で答える｜COMIXAI",
  description:
    "AIに仕事を奪われる？会社でChatGPTを使っていい？答えは信用できる？——AIを使う前の不安から実務の疑問まで、よくある質問20個に漫画家・AIクリエイターが現場目線で一問一答。",
  keywords: ["AI よくある質問", "AI 仕事 奪われる", "ChatGPT 会社 使っていい", "AI 信用できる", "生成AI 不安"],
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "article",
    siteName: "COMIXAI",
    title: "AIのよくある質問20選｜不安と疑問に、一問一答。",
    description: "仕事を奪われる？会社で使っていい？信用できる？——現場目線で答えます。",
    url: "/faq",
    locale: "ja_JP",
    images: [{ url: "/og/games/faq.png", width: 1200, height: 630, alt: "AIのよくある質問" }],
  },
  twitter: { card: "summary_large_image" },
};

import { SECTIONS } from "./data";

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
          仕事を奪われる？会社で使っていい？信用できる？——AIを使う前の不安から実務の疑問まで、よくある質問20個に現場目線で答えます。
          気になるところだけ、つまみ食いでどうぞ。
        </p>
      </section>

      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "6px 0 50px" }}>
        {SECTIONS.map((sec) => (
          <div key={sec.title} style={{ marginBottom: 34 }}>
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
            解決しなかった疑問は、<a href="/glossary" style={{ color: "var(--ink-900)" }}>全80語のAI用語集</a>か、<a href="/start" style={{ color: "var(--ink-900)" }}>AIのはじめかた</a>へ。
            用語そのものを覚えたい人は<a href="/quiz" style={{ color: "var(--ink-900)" }}>診断</a>が近道です。
          </p>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
