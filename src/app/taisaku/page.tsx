import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb, ShareRow } from "../site-ui";
import { TaisakuApp } from "./app";
import "./taisaku.css";

const TITLE = "白紙の対策書｜5問で、あなた専用のセキュリティ手順書";
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
  alternates: { canonical: "/taisaku" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: TITLE,
    description: "5問選ぶと、端末別の手順が並んだ自分専用のセキュリティ手順書ができる。入力はこの端末の中だけ。",
    url: "/taisaku",
    locale: "ja_JP",
    images: [{ url: "/og/taisaku.png", width: 1200, height: 630, alt: "白紙の対策書" }],
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
        { "@type": "ListItem", position: 2, name: "つくったもの", item: "https://comixai.dev/works" },
        { "@type": "ListItem", position: 3, name: "白紙の対策書", item: "https://comixai.dev/taisaku" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "白紙の対策書",
      url: "https://comixai.dev/taisaku",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      description: "5つの質問から、端末別の手順を並べた自分専用のセキュリティ手順書を組み立てるWebアプリ。回答はブラウザ内だけで処理する。",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

const PROMISES: { icon: string; title: string; text: string }[] = [
  { icon: "ph-devices", title: "端末別に、画面の階層まで", text: "「設定 → 自分の名前 → サインインとセキュリティ」のように、迷わない深さで書いてあります。" },
  { icon: "ph-lock-key", title: "回答はどこにも送らない", text: "回答もチェックも、この端末のブラウザの中だけ。不安を扱うページが、不安の源にならないように。" },
  { icon: "ph-pen-nib", title: "手順はAIに書かせない", text: "手順カードは人が確認して固定したもの。並び順と前書きだけを、あなたの回答から組み立てます。" },
];

export default function TaisakuPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <div className="tk-noprint">
        <Nav home={false} />
        <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "つくったもの", href: "/works" }, { name: "白紙の対策書" }]} />
      </div>

      {/* ═══ 見出し ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 22px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          TAISAKU — あなた専用のセキュリティ手順書
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.6vw,46px)", lineHeight: 1.25, margin: "0 0 16px" }}>
          不安なだけで、終わらせない。
          <br />
          5問で、あなたの対策書。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0, maxWidth: 720 }}>
          流出のニュースで心配になっても、何をすればいいか分からず、翌日には忘れる。
          だから一般論ではなく、<b>あなたの端末と使っているサービスに合わせた手順</b>を、設定画面の階層まで書いて並べます。
          「今日の15分」「今週中に」「もしもの時に」の3段階。やった順にチェックが入ります。
        </p>
      </section>

      {/* ═══ 本体 ═══ */}
      <section style={{ maxWidth: "min(720px, 92vw)", margin: "0 auto", padding: "0 0 48px" }}>
        <TaisakuApp />
      </section>

      {/* ═══ 約束 ═══ */}
      <section className="tk-noprint" style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          {PROMISES.map((p) => (
            <div key={p.title} style={{ background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-pop-sm)", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <i className={"ph-bold " + p.icon} style={{ fontSize: 20, color: "var(--red-500)" }} />
                <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15.5 }}>{p.title}</h2>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, color: "var(--text-muted)" }}>{p.text}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 13, lineHeight: 1.9, color: "var(--text-muted)" }}>
          手順は 2026年10月時点の Apple・Google・LINE 各公式ヘルプと IPA の情報をもとにしています。OSやアプリの更新で項目名が変わることがあるので、
          見つからない時は「設定」の検索欄に項目名を入れてください。
        </p>
      </section>

      {/* ═══ シェア ═══ */}
      <section className="tk-noprint" style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/taisaku" text="白紙の対策書｜5問で、あなた専用のセキュリティ手順書" />
      </section>

      <div className="tk-noprint">
        <Footer />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
