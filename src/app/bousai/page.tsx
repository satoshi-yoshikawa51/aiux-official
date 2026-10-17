import type { Metadata } from "next";
import { TaisakuApp } from "./app";
import { CyberRain } from "./rain";
import "./bousai.css";

/* ============================================================
   サイバー攻撃防災手帳 — 体験そのもののページ。
   説明ページは /works/cyber-bousai（works/data.ts）にあり、
   そこから「つくってもらう」でここに来る。白紙のLP（/lp）と同じ
   二段構えなので、ここにはサイトのナビやパンくずを置かず、
   見た目もサイト本体から切り離してサイバー調にしている。
   ============================================================ */

const TITLE = "サイバー攻撃防災手帳｜5問で、あなた専用のセキュリティ手順書";
const DESC =
  "サイバー攻撃や個人情報流出が不安な人へ。いまの状況・端末・使っているサービスを5問選ぶだけで、iPhone / Android / Windows / Mac 別に、設定画面の階層まで書いた手順書ができます。「今日の15分」「今週中に」「もしもの時に」の3段階、やった順にチェック。回答はサーバーに送りません。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: [
    "セキュリティ対策 やり方",
    "個人情報 流出 対処",
    "2段階認証 設定方法",
    "フィッシング 見分け方",
    "アカウント 乗っ取り 対処",
    "パスワード 使い回し 対策",
  ],
  alternates: { canonical: "/bousai" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: TITLE,
    description: "5問選ぶと、端末別の手順が並んだ自分専用のセキュリティ手順書ができる。入力はこの端末の中だけ。",
    url: "/bousai",
    locale: "ja_JP",
    images: [{ url: "/og/bousai.png", width: 1200, height: 630, alt: "サイバー攻撃防災手帳" }],
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
        { "@type": "ListItem", position: 2, name: "サイバー攻撃防災手帳", item: "https://comixai.dev/bousai" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "サイバー攻撃防災手帳",
      url: "https://comixai.dev/bousai",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      description: "5つの質問から、端末別の手順を並べた自分専用のセキュリティ手順書を組み立てるWebアプリ。回答はブラウザ内だけで処理する。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

const SHARE_TEXT = "サイバー攻撃防災手帳｜5問で、あなた専用のセキュリティ手順書 | COMIXAI";
const X_HREF = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent("https://comixai.dev/bousai")}`;

export default function TaisakuPage() {
  return (
    <div className="tk-root">
      <CyberRain />
      <main className="tk-main">
        <div className="tk-topbar">
          {/* ロゴは本体サイトのナビ（site-chrome.tsx）と同じ組み方。差し色だけ赤→緑 */}
          <a href="/" className="tk-brand" data-ga="cta_click" data-ga-place="bousai-top" data-ga-path="/">
            CO<b>MIX</b>AI
          </a>
          <span className="tk-spacer" />
          <span className="tk-status">LOCAL ONLY</span>
        </div>

        <header className="tk-hero">
          <div className="tk-kicker">CYBER ATTACK — DISASTER KIT</div>
          <h1 className="tk-title" data-text="サイバー攻撃防災手帳">
            サイバー攻撃防災手帳
          </h1>
          <p className="tk-lead">
            サイバー攻撃や情報流出のニュースが毎日のように流れるいま、「自分は何をすればいいのか」という不安に。
            5つの質問で、あなたの状況・端末・使っているサービスに合わせた防災策をご提案します。
            手順は設定画面の階層まで書いてあり、「今日の15分」「今週中に」「もしもの時に」の3段階に並びます。
          </p>
        </header>

        <TaisakuApp />

        <div className="tk-bottombar tk-noprint">
          <a href="/works/cyber-bousai" data-ga="cta_click" data-ga-place="bousai-bottom" data-ga-path="/works/cyber-bousai">
            <i className="ph-bold ph-info" />
            このコンテンツについて
          </a>
          <a href={X_HREF} target="_blank" rel="noopener noreferrer" data-ga="share_click" data-ga-network="x" data-ga-path="/bousai">
            <i className="ph-bold ph-x-logo" />
            ポスト
          </a>
          <a href="/" data-ga="cta_click" data-ga-place="bousai-bottom" data-ga-path="/">
            <i className="ph-bold ph-house" />
            COMIXAI トップへ
          </a>
        </div>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
