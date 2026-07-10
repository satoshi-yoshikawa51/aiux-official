import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Card } from "../ds";
import { Breadcrumb, SectionHead } from "../site-ui";
import UketsukeChat from "./chat";

export const metadata: Metadata = {
  title: "COMIXAI AI受付｜AIと話すだけで、お問い合わせが完成する｜COMIXAI",
  description:
    "AIがあなたの用件をヒアリングして、お問い合わせ内容を自動で整理。講演・寄稿・制作・取材のご相談は、チャットで話すだけでOK。Claude APIで作った、AIクリエイター吉川聡史への新しい問い合わせ窓口です。",
  keywords: ["AI 問い合わせ", "AIチャット 受付", "Claude API 活用事例", "AI受付", "チャットボット 問い合わせフォーム", "吉川聡史"],
  alternates: { canonical: "/uketsuke" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "COMIXAI AI受付｜AIと話すだけで、お問い合わせが完成する",
    description: "AIがあなたの用件をヒアリングして、お問い合わせ内容を自動で整理。チャットで話すだけでOK。",
    url: "/uketsuke",
    locale: "ja_JP",
    images: [{ url: "/works/uketsuke.png", width: 1200, height: 750 }],
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
        { "@type": "ListItem", position: 3, name: "COMIXAI AI受付", item: "https://comixai.dev/uketsuke" },
      ],
    },
    {
      "@type": "WebApplication",
      name: "COMIXAI AI受付",
      url: "https://comixai.dev/uketsuke",
      image: "https://comixai.dev/works/uketsuke.png",
      description: "AIが用件をヒアリングして、お問い合わせ内容を自動で整理するチャット型の受付窓口。",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web browser",
      inLanguage: "ja",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      author: { "@type": "Person", name: "吉川 聡史", alternateName: "COMIXAI", url: "https://comixai.dev/profile" },
    },
  ],
};

const STEPS = [
  { icon: "ph-chats-circle", title: "1. 話す", text: "「講演をお願いしたい」など、用件をふつうの言葉で伝えるだけ。AIが必要なことを質問してくれます。" },
  { icon: "ph-list-checks", title: "2. まとまる", text: "会話が終わると、AIがお問い合わせ内容をきれいに要約。内容を確認して、直したければ会話で修正。" },
  { icon: "ph-paper-plane-tilt", title: "3. 届く", text: "お名前とメールアドレスを入れて送信。整理された内容が吉川本人に届き、メールで返信が来ます。" },
];

export default function UketsukePage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "つくったもの", href: "/works" }, { name: "COMIXAI AI受付" }]} />

      {/* ═══ ヒーロー + チャット ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 56px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          AI RECEPTION — AI受付
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.6vw,46px)", lineHeight: 1.3, margin: "0 0 14px" }}>
          AIと話すだけで、
          <br />
          お問い合わせが完成する。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 640, margin: "0 0 30px" }}>
          フォームの空欄を前に「何をどう書けば…」と固まった経験、ありませんか。ここではAIがあなたの用件をヒアリングして、お問い合わせ内容を自動で整理します。講演・寄稿・制作・取材のご相談は、チャットで話すだけでOKです。
        </p>
        <div style={{ maxWidth: 720 }}>
          <UketsukeChat />
        </div>
      </section>

      {/* ═══ 使い方 ═══ */}
      <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)", backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)", backgroundSize: "11px 11px" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 58px" }}>
          <SectionHead kicker="HOW IT WORKS — しくみ" title="話す。まとまる。届く。" hand="フォーム入力はもう考えなくていい" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="articles-grid">
            {STEPS.map((s) => (
              <Card key={s.title} variant="pop" padding={20}>
                <i className={"ph-bold " + s.icon} style={{ fontSize: 26, color: "var(--red-500)" }} />
                <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, margin: "10px 0 6px" }}>{s.title}</h2>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: "var(--text-muted)" }}>{s.text}</p>
              </Card>
            ))}
          </div>
          <p style={{ margin: "24px 0 0", fontSize: 13.5, lineHeight: 2, color: "var(--text-muted)", maxWidth: 680 }}>
            このAI受付自体も、Claude（Anthropic）のAPIで作ったWORKS作品のひとつ。AIは受付と要約だけを担当し、日程や条件のご相談への回答・決定はすべて吉川本人が行います。
            <a href="/works/uketsuke" style={{ color: "var(--red-600)" }}>作品としての紹介ページ</a>もどうぞ。
          </p>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
