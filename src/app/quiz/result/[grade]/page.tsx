import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav, Footer } from "../../../site-chrome";
import { Button, Card } from "../../../ds";
import { GRADES, QUIZ_SIZE, getGrade } from "../../data";

/* ============================================================
   判定レベル別のシェア用ランディングページ。
   Xでシェアされたときに級ごとのOGP画像を出すのが主目的なので、
   検索エンジンにはインデックスさせない（noindex）。
   ============================================================ */

export const dynamicParams = false;

export function generateStaticParams() {
  return GRADES.map((g) => ({ grade: g.slug }));
}

type Props = { params: Promise<{ grade: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { grade } = await params;
  const g = getGrade(grade);
  if (!g) return {};
  const title = `判定は「${g.title}」${g.emoji}｜AI用語力診断｜COMIXAI`;
  return {
    title,
    description: `AI用語力診断の判定結果は【${g.title}】。あなたのAI用語力は何級？全${QUIZ_SIZE}問・3分で診断できます。`,
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: "COMIXAI",
      title,
      description: `あなたのAI用語力は何級？全${QUIZ_SIZE}問・3分で診断。`,
      url: `/quiz/result/${g.slug}`,
      locale: "ja_JP",
      images: [{ url: `/og/quiz/${g.slug}.png`, width: 1200, height: 630, alt: `AI用語力診断 判定：${g.title}` }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function QuizResultPage({ params }: Props) {
  const { grade } = await params;
  const g = getGrade(grade);
  if (!g) notFound();

  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav home={false} />
      <section style={{ flex: 1, maxWidth: 640, width: "100%", margin: "0 auto", padding: "50px 20px 60px", boxSizing: "border-box" }}>
        <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "36px 30px 30px", textAlign: "center", background: "var(--yellow-400)", borderBottom: "var(--bw-bold) solid var(--ink-900)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.14em", marginBottom: 10 }}>
              AI用語力診断 — 判定
            </div>
            <div style={{ fontSize: 62, lineHeight: 1, marginBottom: 8 }}>{g.emoji}</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(32px,6vw,44px)" }}>{g.title}</h1>
          </div>
          <div style={{ padding: "24px 28px 30px", textAlign: "center" }}>
            <p style={{ margin: "0 auto 22px", fontSize: 14.5, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 440 }}>{g.comment}</p>
            <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--text-muted)" }}>
              あなたのAI用語力は、何級？
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/quiz" style={{ textDecoration: "none" }}>
                <Button variant="primary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
                  自分も診断する（3分）
                </Button>
              </a>
              <a href="/glossary" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
                  AI用語集で予習する
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </section>
      <Footer />
    </div>
  );
}
