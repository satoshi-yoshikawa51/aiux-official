import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { GuidedClaudeApp } from "./guide";
import { DemoMovie } from "./demo";

export const metadata: Metadata = {
  title: "Claude教習所｜かんたんに、さわって覚えるClaudeアプリ入門｜COMIXAI",
  description:
    "Claudeの使い方は、読むよりさわって覚えるのが早い。本物そっくりの練習画面を講師が「どこを押すか」から1つずつ案内する無料の教習コース。チャット・コワーク・コードの使い分け、フォルダの許可、変更やコマンドの承認、成果物のプレビューまで、20分で一通り体験できる。登録不要。",
  keywords: ["Claude 使い方", "Claude 入門", "Claude 初心者", "Claude アプリ", "Anthropic Claude 練習", "Claude チュートリアル"],
  alternates: { canonical: "/claude-app" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "Claude教習所｜さわって覚えるClaudeアプリ入門",
    description: "本物そっくりの練習画面を、講師が1つずつ案内。20分でClaudeの使い方が身につく無料コース。",
    url: "/claude-app",
    locale: "ja_JP",
    images: [{ url: "/ogp.png", width: 1200, height: 630, alt: "Claude教習所" }],
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
        { "@type": "ListItem", position: 2, name: "Claude教習所", item: "https://comixai.dev/claude-app" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "Claude教習所",
      url: "https://comixai.dev/claude-app",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description:
        "本物そっくりの練習画面を講師が1つずつ案内する、さわって覚えるClaude入門コース。チャット・コワーク・コードの使い分けを20分で体験できる。",
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
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "Claude教習所" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          LAB — Claude教習所
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          Claudeの使い方は、
          <br />
          かんたんに、さわって覚える。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: "0 0 26px" }}>
          解説を読んでも、AIは使えるようになりません。ここは<b>本物そっくりの練習画面</b>を、講師が「どこを押すか」から1つずつ案内する<b>無料の教習所</b>。
          仕事の頼み方、フォルダの渡し方、変更の承認まで、<b>約20分</b>で一通り体験できます。登録は不要。失敗しても何も壊れません。
        </p>
        <DemoMovie />
      </section>
      <section style={{ maxWidth: "min(880px, 94vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <GuidedClaudeApp />
      </section>

      {/* —— 本物への橋渡し（そら先生の総まとめコースからもここを指す） —— */}
      <section
        id="start-real"
        data-guide="start-real"
        style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 70px" }}
      >
        <div
          style={{
            border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 18, background: "var(--paper-0)",
            boxShadow: "var(--shadow-pop)", padding: "26px 24px",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.2vw,30px)", margin: "0 0 6px" }}>
            🚀 本物のClaudeをはじめる
          </h2>
          <p style={{ fontSize: 14, lineHeight: 2, color: "var(--text-body)", margin: "0 0 18px" }}>
            練習おつかれさまでした。ここから先は本物です。始め方は3ステップ。
          </p>
          <ol style={{ margin: "0 0 18px", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {[
              ["①", "無料アカウントを作る", <span key="a"><a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red-600)", fontWeight: 700 }}>claude.ai</a> にアクセスして、メールアドレスかGoogleアカウントで登録。そのままブラウザで「チャット」が使えます。</span>],
              ["②", "デスクトップアプリを入れる", <span key="b"><a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red-600)", fontWeight: 700 }}>claude.ai/download</a> からPCアプリをインストール。練習した3タブ（チャット／Cowork／コード)の画面に会えます。</span>],
              ["③", "最初のひとことを送る", <span key="c">下のテンプレをコピーして、自分の仕事に書き換えて送るだけ。あとはClaudeが質問しながら進めてくれます。</span>],
            ].map(([n, t, d]) => (
              <li key={n as string} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, color: "var(--red-600)" }}>{n}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.9 }}>
                  <b>{t}</b>
                  <br />
                  {d}
                </span>
              </li>
            ))}
          </ol>
          <div
            style={{
              fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.9, background: "var(--paper-100)",
              border: "1px solid var(--line, #ddd)", borderRadius: 12, padding: "12px 14px", marginBottom: 18, whiteSpace: "pre-wrap",
            }}
          >
            {"私は◯◯の仕事をしています。\n△△を手伝ってほしいです。\n足りない情報があれば、質問しながら進めてください。"}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 2, color: "var(--text-muted)" }}>
            <b>プラン早見</b> — 無料プラン: チャットをまず試せる ／ 有料プラン(Pro〜): 利用量が増え、コード(Claude Code)などの開発機能も ／
            Coworkは上位プランから順次提供。最新の提供状況と料金は{" "}
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red-600)" }}>公式サイト</a>
            で確認してください。
          </div>
        </div>
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
