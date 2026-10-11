import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, SectionHead } from "../site-ui";
import { Badge } from "../ds";
import { CostCalculator } from "./calc";
import { COST_MODELS, COST_SOURCES, COST_UPDATED } from "./data";

export const metadata: Metadata = {
  title: "AI API料金計算機｜主要モデルの月額を比較（2026年版）｜COMIXAI",
  description:
    "ChatGPT（GPT-6）・Claude・GeminiのAPI料金を、トークン数と回数を入れるだけで月額比較できる無料の計算機。入力・出力の単価一覧と、コストを下げる考え方も解説します。",
  keywords: ["AI API 料金 比較", "ChatGPT API 料金 計算", "Claude API 料金", "Gemini API 料金", "トークン 料金"],
  alternates: { canonical: "/cost" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI API料金計算機｜主要モデルの月額を比較",
    description: "トークン数と回数を入れるだけで、GPT-6・Claude・Geminiの月額コストを並べて比較。",
    url: "/cost",
    locale: "ja_JP",
    images: [{ url: "/og/cost.png", width: 1200, height: 630, alt: "AI API料金計算機" }],
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
        { "@type": "ListItem", position: 2, name: "AI API料金計算機", item: "https://comixai.dev/cost" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "AI API料金計算機",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      url: "https://comixai.dev/cost",
      description: "主要AIモデルのAPI料金を、トークン数と回数から月額で比較できる計算機。",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "トークン数はどうやって見積もればいいですか？",
          acceptedAnswer: { "@type": "Answer", text: "日本語はおおむね1文字＝1〜2トークンです。当サイトのトークナイザー体験ページに文章を貼ると、実際のトークン数をその場で確認できます。" },
        },
        {
          "@type": "Question",
          name: "この料金は正確ですか？",
          acceptedAnswer: { "@type": "Answer", text: "各社の発表と報道に基づく目安で、確認日を明記しています。キャッシュ割引・バッチ割引・長文の割増は含まないため、正確な金額は各社の公式料金ページでご確認ください。" },
        },
        {
          "@type": "Question",
          name: "どのモデルを選べばいいですか？",
          acceptedAnswer: { "@type": "Answer", text: "定石は「まず安いモデルで試し、品質が足りないタスクだけ上位モデルに引き上げる」です。全部を最上位モデルに投げると費用は数倍になります。" },
        },
      ],
    },
  ],
};

export default function CostPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Nav home={false} />
      <main>
        <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "18px 0 70px" }}>
          <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI API料金計算機" }]} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "26px 0 8px" }}>
            <Badge tone="red">CALC — 料金計算機</Badge>
            <Badge tone="paper">全{COST_MODELS.length}モデル・{COST_UPDATED.replace(/(\d+)-0?(\d+)-0?(\d+)/, "$1年$2月$3日")}更新</Badge>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.4vw,44px)", lineHeight: 1.3, margin: "0 0 14px" }}>
            AI APIの料金、月いくら？
          </h1>
          <p style={{ margin: "0 0 30px", fontSize: 15, lineHeight: 2, color: "var(--text-body)", maxWidth: 680 }}>
            トークン数と月の回数を入れるだけで、GPT-6・Claude・Geminiの月額コストを並べて比較できます。
            トークン数の感覚がつかめないときは、
            <a href="/tokenizer" style={{ color: "var(--red-600)", fontWeight: 700 }}>トークナイザー体験</a>
            に文章を貼ると実際の数が見られます。
          </p>

          <CostCalculator />

          {/* コストを下げる考え方 */}
          <section style={{ marginTop: 44 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", lineHeight: 1.5, margin: "0 0 14px", paddingLeft: 14, borderLeft: "6px solid var(--red-600)" }}>
              コストを下げる3つの定石
            </h2>
            <div style={{ display: "grid", gap: 12, maxWidth: 760 }}>
              {[
                ["モデルの使い分け", "9割の仕事は中位・下位モデルで足ります。「まず安いモデル→品質が足りないタスクだけ上位へ」の順で試すと、同じ仕事で費用が数分の一になります。表のとおり、最上位と軽量モデルの差は最大100倍です。"],
                ["入力を絞る", "料金はトークン数に比例します。毎回同じ長い前置きや、関係ない資料まで貼っていないかが最大の節約ポイント。繰り返し使う文脈にはキャッシュ割引（多くのモデルで入力の1〜2割の価格）が効きます。"],
                ["急がない処理はバッチで", "各社とも「すぐ返ってこなくていい処理」向けのバッチAPIがあり、標準価格のおおむね半額です。夜間の一括要約・定期レポートのような用途はここに回すのが定石です。"],
              ].map(([t, b]) => (
                <div key={t} style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop-sm)", padding: "16px 18px" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 6 }}>
                    <i className="ph-bold ph-coins" style={{ color: "var(--red-500)", marginRight: 7 }} />
                    {t}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.95, color: "var(--text-body)" }}>{b}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 出典と関連 */}
          <section style={{ marginTop: 40 }}>
            <SectionHead kicker="SOURCES — 正確な料金は公式で" title="出典・あわせて使いたい" hand="料金は変わるので最後は公式確認" />
            <div style={{ display: "grid", gap: 10, maxWidth: 680 }}>
              {[
                ...COST_SOURCES,
                { label: "トークナイザー体験（文章→トークン数をその場で確認）", href: "/tokenizer" },
                { label: "用語：トークン（料金の単位を理解する）", href: "/glossary/token" },
                { label: "比較：ChatGPT・Claude・Gemini どれを使う？", href: "/compare" },
              ].map((l) => (
                <a key={l.href} href={l.href} data-ga="card_click" data-ga-place="cost-links" data-ga-path={l.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--ink-900)", background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", padding: "13px 18px", boxShadow: "var(--shadow-pop-sm)" }}>
                  <span>{l.label}</span>
                  <i className={"ph-bold " + (l.href.startsWith("http") ? "ph-arrow-square-out" : "ph-arrow-right")} style={{ color: "var(--red-600)", flex: "none" }} />
                </a>
              ))}
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </>
  );
}
