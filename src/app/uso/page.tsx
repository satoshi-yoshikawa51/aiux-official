import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Button } from "../ds";
import { Breadcrumb, SectionHead, ShareRow } from "../site-ui";
import { USO_QUESTIONS, USO_ROUNDS } from "./data";
import { UsoPlayer } from "./player";

export const metadata: Metadata = {
  title: "AIのウソを見抜け｜ハルシネーション体験ゲーム【全8問】｜COMIXAI",
  description:
    "AIの回答を2つ並べます。片方にはハルシネーション（ウソ）が混ざっています——見抜けますか？架空の判例、捏造された出典、古い制度の知識など、実際のAIがやらかす「ウソの型」だけを集めた体験ゲーム。遊ぶだけでAIリテラシーが身につきます。",
  keywords: ["ハルシネーション", "AI ウソ", "AI 間違い 見抜く", "AIリテラシー ゲーム", "ファクトチェック"],
  alternates: { canonical: "/uso" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AIのウソを見抜け｜どっちの回答にウソが混ざってる？",
    description: "実際のAIがやらかす「ウソの型」だけを集めた体験ゲーム。全8問、見抜けるか？",
    url: "/uso",
    locale: "ja_JP",
    images: [{ url: "/og/uso/uso.png", width: 1200, height: 630, alt: "AIのウソを見抜け" }],
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
        { "@type": "ListItem", position: 2, name: "AIのウソを見抜け", item: "https://comixai.dev/uso" },
      ],
    },
    {
      "@type": "Quiz",
      name: "AIのウソを見抜け",
      description: "AIの回答に混ざったハルシネーション（ウソ）を見抜く体験ゲーム。実際のAIが起こす間違いの型を学べる。",
      inLanguage: "ja",
      about: { "@type": "Thing", name: "ハルシネーション・AIリテラシー" },
      numberOfQuestions: USO_QUESTIONS.length,
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
    },
  ],
};

export default function UsoPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIのウソを見抜け" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          GAME — ハルシネーション体験
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIのウソを、見抜け。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          AIは、実在しない判例を作り、出典を捏造し、古い制度を今の話として語ります——しかも自信満々に。
          これは<a href="/glossary/hallucination" style={{ color: "var(--red-600)", fontWeight: 700 }}>ハルシネーション</a>と呼ばれる現象です。
          このゲームの問題は、実際のAIがやらかす「ウソの型」だけで作りました。全{USO_ROUNDS}問、あなたは騙されずにいられるか。
        </p>
      </section>

      <section style={{ maxWidth: "min(720px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <UsoPlayer />
      </section>

      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 46px" }}>
        <SectionHead kicker="NEXT — あわせて遊ぶ・学ぶ" title="疑う力の、次は知る力。" hand="どっちも3分で遊べます" />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/quiz" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
              AI用語力診断に挑戦
            </Button>
          </a>
          <a href="/glossary/hallucination" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
              ハルシネーションとは？
            </Button>
          </a>
        </div>
      </div>

      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/uso" text="AIのウソを見抜け｜どっちの回答にウソが混ざってる？" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
