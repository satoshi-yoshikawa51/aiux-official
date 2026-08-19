import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../../site-chrome";
import { Breadcrumb } from "../../site-ui";

/* ============================================================
   COMIXAI アカデミー（スマホアプリ）のプライバシーポリシー。
   App Store提出に必須のページ。内容はアプリの実装と一対で、
   通信するのはプロンプト採点（/api/academy/grade）だけ——という
   事実が変わったら、ここも必ず直すこと。
   ============================================================ */

export const metadata: Metadata = {
  title: "プライバシーポリシー｜COMIXAI アカデミー",
  description:
    "学習アプリ「COMIXAI アカデミー」のプライバシーポリシー。アカウント登録不要、学習記録は端末内のみ、広告・トラッキングなし。外部と通信するのはAI採点機能だけで、内容は保存しません。",
  keywords: ["COMIXAI アカデミー", "プライバシーポリシー"],
  alternates: { canonical: "/academy/privacy" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "プライバシーポリシー｜COMIXAI アカデミー",
    description: "学習アプリ「COMIXAI アカデミー」のプライバシーポリシー。",
    url: "/academy/privacy",
    locale: "ja_JP",
  },
  twitter: { card: "summary" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
        { "@type": "ListItem", position: 2, name: "アカデミー プライバシーポリシー", item: "https://comixai.dev/academy/privacy" },
      ],
    },
  ],
};

/* 見出しと本文の組。ポリシーは長文の連なりなので、部品化して読みやすくする */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ margin: "0 0 30px" }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: 20,
          margin: "0 0 10px",
          paddingLeft: 12,
          borderLeft: "5px solid var(--red-500)",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 2, color: "var(--text-body)" }}>{children}</div>
    </section>
  );
}

export default function AcademyPrivacyPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "アカデミー プライバシーポリシー" }]} />

      <div style={{ maxWidth: "min(720px, 92vw)", margin: "0 auto", padding: "30px 0 60px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          COMIXAI ACADEMY — PRIVACY POLICY
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(26px,4.4vw,38px)", lineHeight: 1.3, margin: "0 0 14px" }}>
          プライバシーポリシー
        </h1>
        <p style={{ fontSize: 15, lineHeight: 2, color: "var(--text-body)", margin: "0 0 34px" }}>
          本ポリシーは、吉川聡史（COMIXAI）が提供する学習アプリ
          「COMIXAI アカデミー」（iOS版およびWeb版。以下「本アプリ」）における
          利用者の情報の取り扱いを定めるものです。
        </p>

        <Section title="1. 個人情報は収集しません">
          <p style={{ margin: "0 0 10px" }}>
            本アプリにアカウント登録はなく、氏名・メールアドレス・位置情報などの
            個人情報を収集しません。広告の表示、アクセス解析、行動トラッキングも
            行っていません。
          </p>
        </Section>

        <Section title="2. 学習の記録は端末の中にだけ保存されます">
          <p style={{ margin: "0 0 10px" }}>
            レッスンの進捗・バッジ・ガチャの結果などの学習記録は、すべてお使いの
            端末内（Web版の場合はブラウザ内）に保存され、外部に送信されません。
            記録はアプリ内の「記録を消す」操作、またはアプリの削除により消去できます。
          </p>
          <p style={{ margin: 0 }}>
            「記録の持ち出し」機能は、学習記録を端末のクリップボードに複写するもので、
            利用者の操作なしに外部へ送られることはありません。
          </p>
        </Section>

        <Section title="3. AI採点機能で送信される情報">
          <p style={{ margin: "0 0 10px" }}>
            「プロンプト道場」のAI採点機能を使うときに限り、利用者が入力した文章と
            お題の番号が、当方のサーバー（comixai.dev）を経由して
            Anthropic社のClaude APIに送信され、採点結果の生成に使われます。
          </p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 22 }}>
            <li>送信された文章は、採点結果を返す目的にのみ使用し、当方のサーバーには保存しません。</li>
            <li>接続元情報（IPアドレス）は、連続送信を防ぐ目的で短時間のみ一時的に処理し、記録として保存しません。</li>
            <li>Anthropic社におけるAPI入力の取り扱いは同社のプライバシーポリシーに従います。API経由の入力は、既定でモデルの学習には使用されません。</li>
          </ul>
          <p style={{ margin: 0 }}>
            この機能は入力欄に文章を書いて送信ボタンを押したときにのみ動作します。
            サーバーに接続できない場合は、端末内で完結する簡易採点に切り替わります。
          </p>
        </Section>

        <Section title="4. その他の通信">
          <p style={{ margin: 0 }}>
            レッスン内の用語リンクから当サイト（comixai.dev）の解説ページを
            ブラウザで開くことがあります。また、OSの共有機能を使った学習記録の
            シェアは、利用者の操作によってのみ行われます。
          </p>
        </Section>

        <Section title="5. 改定について">
          <p style={{ margin: 0 }}>
            本ポリシーを変更する場合は、本ページで告知します。重要な変更が
            ある場合は、アプリ内でもお知らせします。
          </p>
        </Section>

        <Section title="6. お問い合わせ">
          <p style={{ margin: 0 }}>
            本ポリシーに関するお問い合わせは、
            <a href="/academy/support" style={{ color: "var(--red-600)", fontWeight: 700 }}>
              サポートページ
            </a>
            の窓口までお寄せください。
          </p>
        </Section>

        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)", margin: "38px 0 0" }}>
          制定日：2026年8月19日
          <br />
          運営者：吉川聡史（COMIXAI）
        </p>
      </div>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
