import type { Metadata } from "next";
import { Nav, Footer } from "../../site-chrome";
import { Breadcrumb } from "../../site-ui";

/* ============================================================
   COMIXAI アカデミー（スマホアプリ）のサポートページ。
   App Store提出に必須。よくある質問は、アプリの実装
   （記録の持ち出し・AI採点の降格・設定のリセット）と一対なので、
   仕様が変わったらここも直すこと。
   ============================================================ */

export const metadata: Metadata = {
  title: "サポート｜COMIXAI アカデミー",
  description:
    "学習アプリ「COMIXAI アカデミー」のサポートページ。機種変更時の記録の引き継ぎ、音が鳴らないとき、AI採点のしくみなど、よくある質問とお問い合わせ窓口。",
  keywords: ["COMIXAI アカデミー", "サポート", "使い方", "引き継ぎ"],
  alternates: { canonical: "/academy/support" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "サポート｜COMIXAI アカデミー",
    description: "学習アプリ「COMIXAI アカデミー」のよくある質問とお問い合わせ窓口。",
    url: "/academy/support",
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
        { "@type": "ListItem", position: 2, name: "アカデミー サポート", item: "https://comixai.dev/academy/support" },
      ],
    },
  ],
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "機種変更で学習の記録を引き継ぎたい",
    a: (
      <>
        記録は端末の中にだけ保存されているため、自動では引き継がれません。
        旧端末の「設定 →『記録の持ち出し』→ 記録を書き出す」で記録をコピーし、
        メモアプリなどで新端末へ送ってから、新端末の同じ画面で貼り付けて
        取り込んでください。
      </>
    ),
  },
  {
    q: "音・BGMが鳴らない",
    a: (
      <>
        アプリ内の「設定」で「効果音」「BGM」がオンになっているか確認してください。
        オンでも鳴らない場合は、本体側面のサイレントスイッチ（消音モード）と
        音量を確認してください。
      </>
    ),
  },
  {
    q: "プロンプトの採点が「簡易採点」になる",
    a: (
      <>
        AI採点は通信を使います。機内モードや圏外のとき、またはサーバーが
        混み合っているときは、端末内で完結する簡易採点に自動で切り替わります。
        時間をおいてもう一度試すと、AI採点に戻ります。
      </>
    ),
  },
  {
    q: "はじめからやり直したい",
    a: <>アプリ内の「設定」の一番下にある「記録をぜんぶ消す」で、オープニングからやり直せます。この操作は取り消せません。消す前に「記録の持ち出し」で書き出しておくこともできます。</>,
  },
  {
    q: "ガチャの提供割合を知りたい",
    a: <>ガチャ画面の「提供割合をみる」に、レア度ごとの出やすさと救済のしくみを表示しています。ガチャはアプリ内で獲得するポイントだけで回すもので、課金はありません。</>,
  },
];

export default function AcademySupportPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "アカデミー サポート" }]} />

      <div style={{ maxWidth: "min(720px, 92vw)", margin: "0 auto", padding: "30px 0 60px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          COMIXAI ACADEMY — SUPPORT
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(26px,4.4vw,38px)", lineHeight: 1.3, margin: "0 0 14px" }}>
          COMIXAI アカデミー サポート
        </h1>
        <p style={{ fontSize: 15, lineHeight: 2, color: "var(--text-body)", margin: "0 0 34px" }}>
          学習アプリ「COMIXAI アカデミー」のよくある質問と、お問い合わせ窓口です。
        </p>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: 20,
            margin: "0 0 16px",
            paddingLeft: 12,
            borderLeft: "5px solid var(--red-500)",
          }}
        >
          よくある質問
        </h2>

        {FAQS.map((f) => (
          <details
            key={f.q}
            style={{
              background: "var(--paper-0)",
              border: "2.5px solid var(--ink-900)",
              borderRadius: "var(--radius-sm)",
              padding: "14px 16px",
              marginBottom: 12,
              boxShadow: "var(--shadow-pop-sm)",
            }}
          >
            <summary style={{ fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{f.q}</summary>
            <p style={{ fontSize: 14.5, lineHeight: 2, color: "var(--text-body)", margin: "10px 0 0" }}>{f.a}</p>
          </details>
        ))}

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: 20,
            margin: "34px 0 12px",
            paddingLeft: 12,
            borderLeft: "5px solid var(--red-500)",
          }}
        >
          お問い合わせ
        </h2>
        <p style={{ fontSize: 15, lineHeight: 2, color: "var(--text-body)", margin: "0 0 10px" }}>
          解決しない場合は、
          <a href="/#contact" style={{ color: "var(--red-600)", fontWeight: 700 }}>
            お問い合わせフォーム
          </a>
          からご連絡ください。不具合の報告は「機種名・OSのバージョン・どの画面で何が起きたか」を
          添えていただけると助かります。
        </p>
        <p style={{ fontSize: 15, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          個人情報の取り扱いについては
          <a href="/academy/privacy" style={{ color: "var(--red-600)", fontWeight: 700 }}>
            プライバシーポリシー
          </a>
          をご覧ください。
        </p>

        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)", margin: "38px 0 0" }}>
          運営者：吉川聡史（COMIXAI）
        </p>
      </div>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
