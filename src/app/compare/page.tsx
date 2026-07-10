import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { Breadcrumb } from "../site-ui";

const UPDATED = "2026-07-09";

export const metadata: Metadata = {
  title: "ChatGPT・Claude・Geminiの違いと使い分け｜どれを使えばいい？｜COMIXAI",
  description:
    "ChatGPT・Claude・Gemini、結局どれを使えばいい？3大AIの出自・得意分野・向いている人を比較表で整理し、用途別のおすすめをまとめました。答えは「使い分け」——全部無料で試せます。",
  keywords: ["ChatGPT Claude 違い", "ChatGPT Gemini どっち", "AI 比較", "生成AI おすすめ", "Claude Gemini 比較"],
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

const ROWS: { label: string; gpt: string; claude: string; gemini: string }[] = [
  { label: "提供元", gpt: "OpenAI", claude: "Anthropic", gemini: "Google" },
  { label: "ひとことで", gpt: "機能の百貨店", claude: "文章の職人", gemini: "Google連携の申し子" },
  {
    label: "得意なこと",
    gpt: "画像生成・音声・検索など機能の幅広さ。情報も事例も一番多い",
    claude: "自然で丁寧な日本語、長文読解、コーディング支援",
    gemini: "検索・Gmail・スプレッドシートなどGoogleサービスとの連携",
  },
  {
    label: "スタイル",
    gpt: "何でも屋の万能ナイフ",
    claude: "落ち着いた文体と長い文脈の理解が持ち味",
    gemini: "普段の仕事道具に溶け込むタイプ",
  },
  {
    label: "こんな人に",
    gpt: "まず1つ選ぶならこれ、という定番が欲しい人",
    claude: "文章の質にこだわる人、長い資料を扱う人、開発者",
    gemini: "仕事がGoogle Workspace中心の人",
  },
];

const USES: { emoji: string; use: string; pick: string; why: string }[] = [
  { emoji: "✍️", use: "メール・記事・企画書などの文章", pick: "Claude", why: "日本語の自然さと文体の安定感。長文の読み込みにも強い" },
  { emoji: "📊", use: "Gmail・スプレッドシートと連携した作業", pick: "Gemini", why: "Googleのサービス群にそのまま入り込める" },
  { emoji: "🎨", use: "画像も音声も、ぜんぶ1つで済ませたい", pick: "ChatGPT", why: "機能の幅と情報量。困ったとき事例が見つかりやすい" },
  { emoji: "🔍", use: "最新情報の調べもの", pick: "Perplexity（番外）", why: "出典つきで答えるAI検索の代表格" },
  { emoji: "📚", use: "手元の資料だけから正確に答えてほしい", pick: "NotebookLM（番外）", why: "渡した資料の外を見ないからハルシネーションが起きにくい" },
  { emoji: "💻", use: "コードを書く・アプリを作る", pick: "Claude（Claude Code）", why: "コーディングエージェントの完成度。このサイトもこれ製" },
];

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
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
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

      {/* 用途別おすすめ */}
      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "0 0 34px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", margin: "0 0 16px" }}>🎯 用途別、まずこれ</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {USES.map((u) => (
            <div key={u.use} style={{ display: "flex", gap: 12, alignItems: "flex-start", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", padding: "13px 16px", boxShadow: "var(--shadow-pop-sm)", flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, flex: "none" }}>{u.emoji}</span>
              <div style={{ flex: "1 1 240px" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14.5 }}>{u.use}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8, marginTop: 2 }}>{u.why}</div>
              </div>
              <Badge tone="yellow">{u.pick}</Badge>
            </div>
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
            <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>AI用語集（全50語）</Button>
          </a>
          <a href="/faq" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>AIのよくある質問</Button>
          </a>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
