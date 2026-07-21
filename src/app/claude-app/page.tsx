import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { GuidedClaudeApp } from "./guide";

export const metadata: Metadata = {
  title: "Claudeアプリ・シミュレーター｜PC・スマホ画面をブラウザで擬似体験｜COMIXAI",
  description:
    "Claudeアプリの画面（PC版・スマホ版）をブラウザ上に再現した体験シミュレーター。チャット・コワーク・コードの3モード切替に加え、フォルダのアクセス許可・diff/コマンド承認・成果物プレビューまで、実際の仕事の流れをそのまま操作できる。Anthropic APIキーを設定すれば本物のClaudeとも会話できる。",
  keywords: ["Claude 使い方", "Claude アプリ", "Claude 初心者", "Anthropic Claude 入門", "Claude チャット 体験"],
  alternates: { canonical: "/claude-app" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "Claudeアプリ・シミュレーター｜ブラウザで擬似体験",
    description: "PC・スマホのClaudeアプリ画面を再現。APIキーがあれば本物のClaudeとも話せる。",
    url: "/claude-app",
    locale: "ja_JP",
    images: [{ url: "/ogp.png", width: 1200, height: 630, alt: "Claudeアプリ・シミュレーター" }],
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
        { "@type": "ListItem", position: 2, name: "Claudeアプリ・シミュレーター", item: "https://comixai.dev/claude-app" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "Claudeアプリ・シミュレーター",
      url: "https://comixai.dev/claude-app",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description:
        "Claudeアプリの画面（PC・スマホ）をブラウザ上に再現した体験シミュレーター。Anthropic APIキーを設定すると本物のClaudeとの会話も体験できる。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function ClaudeAppPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "Claudeアプリ・シミュレーター" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          LAB — Claudeアプリ擬似体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          Claudeアプリを、ブラウザで擬似体験。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          Claudeのアプリ画面（PC版・スマホ版）を再現しました。<b>チャット／コワーク／コード</b>の3モード切替、モデル切替、履歴、流れるように届く返事——
          さらに<b>フォルダを渡して許可する・変更やコマンドを承認する・できあがった成果物をプレビューする</b>、という実際の仕事の流れまで、登録なしでさわれます。
          お手持ちのAnthropic APIキーを設定すれば、この画面のまま<b>本物のClaude</b>と会話することも。
        </p>
      </section>
      <section style={{ maxWidth: "min(880px, 94vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <GuidedClaudeApp />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
