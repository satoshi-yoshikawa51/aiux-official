import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Button } from "../ds";
import { Breadcrumb, SectionHead } from "../site-ui";
import { TERMS } from "../glossary/data";
import { QUESTIONS, QUIZ_SIZE } from "./data";
import { QuizPlayer } from "./player";

export const metadata: Metadata = {
  title: "AI用語力診断｜あなたのAI用語力は何級？【全12問・3分】｜COMIXAI",
  description:
    "生成AI・LLM・RAG・トークン…今さら聞けないAI用語、どこまでわかる？全12問・3分のクイズであなたのAI用語力を5段階判定。1問ごとに現場目線の解説つきだから、遊ぶだけでAIに強くなれます。",
  keywords: ["AI クイズ", "AI用語 クイズ", "AI 診断", "生成AI クイズ", "AIリテラシー テスト"],
  alternates: { canonical: "/quiz" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI用語力診断｜あなたのAI用語力は何級？【全12問・3分】",
    description: "今さら聞けないAI用語、どこまでわかる？12問・3分で5段階判定。解説つき。",
    url: "/quiz",
    locale: "ja_JP",
    images: [{ url: "/og/quiz/quiz.png", width: 1200, height: 630, alt: "AI用語力診断｜あなたのAI用語力は何級？" }],
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
        { "@type": "ListItem", position: 2, name: "AI用語力診断", item: "https://comixai.dev/quiz" },
      ],
    },
    {
      "@type": "Quiz",
      name: "AI用語力診断",
      description: "生成AI・LLM・RAGなど、AI活用の頻出用語の理解度を12問で5段階判定するクイズ。",
      inLanguage: "ja",
      about: { "@type": "Thing", name: "生成AI・AI用語" },
      numberOfQuestions: QUESTIONS.length,
      provider: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
    },
  ],
};

export default function QuizPage() {
  const termNames = Object.fromEntries(TERMS.map((t) => [t.slug, t.term]));
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI用語力診断" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          QUIZ — AI用語力診断
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          あなたのAI用語力は、何級？
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          生成AI・LLM・RAG・トークン——ニュースで毎日見かけるAI用語、実はどこまでわかっていますか？
          全{QUIZ_SIZE}問・約3分。1問ごとに現場目線の解説つきなので、遊び終わるころには少し強くなっています。
        </p>
      </section>

      <section style={{ maxWidth: "min(680px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <QuizPlayer termNames={termNames} />
      </section>

      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 46px" }}>
        <SectionHead kicker="GLOSSARY — 先に予習する？" title="出題範囲は、AI用語集の全80語。" hand="カンニングは合法です" />
        <a href="/glossary" style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
            AI用語集を見る
          </Button>
        </a>
      </div>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
