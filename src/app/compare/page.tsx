import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { Breadcrumb, ShareRow } from "../site-ui";
import { ROWS, USES, PRICING, COMPARE_FAQ, COMPARE_UPDATED } from "./data";

const UPDATED = COMPARE_UPDATED;

export const metadata: Metadata = {
  title: "ChatGPT・Claude・Gemini比較【2026年7月】料金・違い・使い分け｜COMIXAI",
  description:
    "ChatGPT・Claude・Gemini、結局どれを使えばいい？最新モデル（GPT-5.6／Claude Fable 5／Gemini Omni）と料金プランを2026年7月時点で比較。得意分野・用途別おすすめ・「どっちがいい？」の一問一答つき。答えは「使い分け」——全部無料で試せます。",
  keywords: ["ChatGPT Claude 違い", "ChatGPT Gemini どっち", "AI 比較 2026", "生成AI おすすめ", "ChatGPT Claude Gemini 料金"],
  alternates: { canonical: "/compare" },
  openGraph: {
    type: "article",
    siteName: "COMIXAI",
    title: "ChatGPT・Claude・Gemini、どう違う？",
    description: "3大AIの得意分野と使い分けを、比較表と用途別おすすめで整理。",
    url: "/compare",
    locale: "ja_JP",
    images: [{ url: "/og/games/compare.png", width: 1200, height: 630, alt: "ChatGPT・Claude・Gemini比較" }],
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
        { "@type": "ListItem", position: 2, name: "ChatGPT・Claude・Gemini比較", item: "https://comixai.dev/compare" },
      ],
    },
    {
      "@type": "Article",
      headline: "ChatGPT・Claude・Geminiの違いと使い分け",
      url: "https://comixai.dev/compare",
      inLanguage: "ja",
      dateModified: UPDATED,
      author: { "@type": "Person", name: "吉川 聡史", alternateName: "COMIXAI", url: "https://comixai.dev/profile" },
    },
    {
      "@type": "FAQPage",
      mainEntity: COMPARE_FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function ComparePage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "ChatGPT・Claude・Gemini比較" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          COMPARE — 3大AIの使い分け
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          ChatGPT・Claude・Gemini、<br />どう違う？
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          結論から言うと、<b>「どれが最強か」ではなく「どれをどこで使うか」</b>です。3つとも無料で試せるので、この比較表で当たりをつけて、自分の仕事で触り比べるのが最短ルート。
        </p>
        <p style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)", margin: "10px 0 0" }}>
          ※機能は更新が速いため、細かな仕様は各公式サイトで最新を確認してください（最終更新：{UPDATED.replace(/-/g, ".")}）
        </p>
      </section>

      {/* 比較表 */}
      <section style={{ maxWidth: "min(880px, 92vw)", margin: "0 auto", padding: "6px 0 34px" }}>
        <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640, fontSize: 13.5, lineHeight: 1.7 }}>
              <thead>
                <tr style={{ background: "var(--ink-900)", color: "var(--paper-50)" }}>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 12, width: 110 }}> </th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: "var(--font-heading)", fontWeight: 900 }}>
                    <a href="/glossary/chatgpt" style={{ color: "var(--yellow-400)", textDecoration: "none" }}>ChatGPT</a>
                  </th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: "var(--font-heading)", fontWeight: 900 }}>
                    <a href="/glossary/claude" style={{ color: "var(--yellow-400)", textDecoration: "none" }}>Claude</a>
                  </th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: "var(--font-heading)", fontWeight: 900 }}>
                    <a href="/glossary/gemini" style={{ color: "var(--yellow-400)", textDecoration: "none" }}>Gemini</a>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={r.label} style={{ background: i % 2 ? "var(--paper-100)" : "var(--paper-0)" }}>
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 12.5, borderRight: "1.5px dashed rgba(20,17,15,0.15)", whiteSpace: "nowrap" }}>{r.label}</td>
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>{r.gpt}</td>
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>{r.claude}</td>
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>{r.gemini}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 料金プラン比較 */}
      <section style={{ maxWidth: "min(880px, 92vw)", margin: "0 auto", padding: "0 0 34px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", margin: "0 0 6px" }}><i className="ph-bold ph-currency-jpy" style={{ marginRight: 8, color: "var(--red-500)" }} />料金プラン早見表</h2>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.9 }}>
          2026年7月時点・日本円は税込目安（為替とプラン改定で変わります）。結論：<b>まず無料、定番は月3,000円前後</b>。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="articles-grid">
          {PRICING.map((s) => (
            <Card key={s.service} variant="pop" padding={0} style={{ overflow: "hidden" }}>
              <div style={{ background: s.color, color: "var(--paper-50)", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15.5, padding: "10px 16px" }}>{s.service}</div>
              <div style={{ padding: "6px 16px 14px" }}>
                {s.plans.map((p) => (
                  <div key={p.name} style={{ padding: "10px 0", borderBottom: "1.5px dashed rgba(20,17,15,0.12)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 13.5 }}>{p.name}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: "var(--red-600)", whiteSpace: "nowrap" }}>{p.price}</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.8, color: "var(--text-muted)", marginTop: 3 }}>{p.note}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 用途別おすすめ */}
      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "0 0 34px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", margin: "0 0 16px" }}><i className="ph-bold ph-target" style={{ marginRight: 8, color: "var(--red-500)" }} />用途別、まずこれ</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {USES.map((u) => (
            <div key={u.use} style={{ display: "flex", gap: 12, alignItems: "flex-start", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", padding: "13px 16px", boxShadow: "var(--shadow-pop-sm)", flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, flex: "none", color: "var(--red-500)" }}><i className={"ph-bold " + u.icon} /></span>
              <div style={{ flex: "1 1 240px" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14.5 }}>{u.use}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8, marginTop: 2 }}>{u.why}</div>
              </div>
              <Badge tone="yellow">{u.pick}</Badge>
            </div>
          ))}
        </div>
      </section>

      {/* どっちがいい？FAQ */}
      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "0 0 34px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", margin: "0 0 16px" }}><i className="ph-bold ph-chat-circle-dots" style={{ marginRight: 8, color: "var(--red-500)" }} />「どっちがいい？」に一問一答</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {COMPARE_FAQ.map((f) => (
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

      {/* まとめ */}
      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "0 0 56px" }}>
        <div style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "16px 20px", marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 2, fontWeight: 700 }}>
            覚えておくのはこれだけ：<b>「1社に忠誠を誓わない」</b>。得意分野は各社ずっと入れ替わり続けています。乗り換えられる人がいちばん強い——だから道具の名前より、<a href="/glossary" style={{ color: "var(--ink-900)" }}>用語＝共通の考え方</a>を覚えるのが結局いちばんの近道です。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/glossary" style={{ textDecoration: "none" }}>
            <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>AI用語集（全150語）</Button>
          </a>
          <a href="/faq" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>AIのよくある質問</Button>
          </a>
          <a href="/guide" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>職種別AI活用ガイド</Button>
          </a>
        </div>
        <div style={{ marginTop: 26 }}>
          <ShareRow path="/compare" text="ChatGPT・Claude・Gemini比較 2026年7月版（料金・使い分け）" />
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
