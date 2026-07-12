import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { ClaudeAppGame } from "./game";

export const metadata: Metadata = {
  title: "Claudeアプリ教習所｜PC・スマホ画面でClaudeの使い方を練習｜COMIXAI",
  description:
    "Claudeアプリの画面（PC・スマホ）をブラウザ上に再現した操作トレーニング。新規チャット・モデル切替・履歴などの基本操作を8つのミッションで練習。APIキーを設定すれば、そのままの画面で本物のClaudeとも会話できる。",
  keywords: ["Claude 使い方", "Claude アプリ", "Claude 初心者", "Anthropic Claude 入門", "Claude チャット 練習"],
  alternates: { canonical: "/claude-app" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "Claudeアプリ教習所｜ミッション式でClaudeの使い方を練習",
    description: "PC・スマホのClaudeアプリ画面を再現。8ミッションで基本操作をマスター、APIキーがあれば本物とも話せる。",
    url: "/claude-app",
    locale: "ja_JP",
    images: [{ url: "/ogp.png", width: 1200, height: 630, alt: "Claudeアプリ教習所" }],
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
        { "@type": "ListItem", position: 2, name: "Claudeアプリ教習所", item: "https://comixai.dev/claude-app" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "Claudeアプリ教習所",
      url: "https://comixai.dev/claude-app",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description:
        "Claudeアプリの画面（PC・スマホ）を再現したミッション式の操作トレーニング。Anthropic APIキーを設定すると本物のClaudeとの会話も体験できる。",
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
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "Claudeアプリ教習所" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — Claudeアプリ操作トレーニング
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          こわくない。Claudeは、さわって覚える。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          <a href="/glossary/claude-code" style={{ color: "var(--red-600)", fontWeight: 700 }}>Claude</a>のアプリ画面（PC版・スマホ版）をブラウザ上に再現しました。
          「新しいチャット」「モデル切替」「履歴」——8つのミッションをこなせば、基本操作はひととおり身につきます。
          お手持ちのAnthropic APIキーを設定すれば、この画面のまま<b>本物のClaude</b>と話すことも。
        </p>
      </section>
      <section style={{ maxWidth: "min(880px, 94vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <ClaudeAppGame />
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
