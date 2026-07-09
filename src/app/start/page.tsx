import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { Breadcrumb } from "../site-ui";

export const metadata: Metadata = {
  title: "AIのはじめかた｜何から学ぶ？遊びながら覚える5ステップ｜COMIXAI",
  description:
    "「AIを勉強したいけど、何から始めればいいかわからない」人のための学習ロードマップ。歴史をつかむ→基本用語→腕試し診断→ゲームで体感→マンガで実践。全部無料、この順番で遊ぶだけでAIの全体像がつかめます。",
  keywords: ["AI 勉強 何から", "AI 初心者 独学", "生成AI 学び方", "AI 入門", "AI 学習 ロードマップ"],
  alternates: { canonical: "/start" },
  openGraph: {
    type: "article",
    siteName: "COMIXAI",
    title: "AIのはじめかた｜遊びながら覚える5ステップ",
    description: "何から始めればいいかわからない人へ。歴史→用語→診断→ゲーム→実践の学習コース。",
    url: "/start",
    locale: "ja_JP",
    images: [{ url: "/og/games/start.png", width: 1200, height: 630, alt: "AIのはじめかた" }],
  },
  twitter: { card: "summary_large_image" },
};

const STEPS = [
  {
    n: 1,
    emoji: "📜",
    time: "5分",
    title: "まず、歴史の流れをつかむ",
    desc: "いまのAIブームは突然始まったわけではありません。75年の歴史をスクロールで読める「AI歴史絵巻」で、冬の時代とブームの繰り返しを眺めると、ニュースの見え方が変わります。",
    href: "/history",
    cta: "AI歴史絵巻を読む",
  },
  {
    n: 2,
    emoji: "📖",
    time: "15分",
    title: "基本の12語だけ、押さえる",
    desc: "生成AI・LLM・プロンプト・ハルシネーション……用語集の「まずはこの12語」を読めば、AIニュースの9割は読めるようになります。50語ぜんぶ覚える必要はありません。",
    href: "/glossary",
    cta: "AI用語集を見る",
  },
  {
    n: 3,
    emoji: "✏️",
    time: "3分",
    title: "診断で、腕試しする",
    desc: "覚えたつもりを確かめるのが12問の用語力診断。ひっかけ問題入りなので、間違えた解説こそが一番の教材です。何級だったかは、Xでシェアして自慢（または供養）を。",
    href: "/quiz",
    cta: "AI用語力診断を受ける",
  },
  {
    n: 4,
    emoji: "🎮",
    time: "すきま時間",
    title: "ゲームで、体感する",
    desc: "このサイトには隠し部屋が12こあり、それぞれがAI用語の体験ゲームになっています。プロンプトの事故も、AIの検問も、読むより遊ぶほうが100倍記憶に残ります。入口は……用語集のどこかに。",
    href: "/play",
    cta: "あそびばを見る",
  },
  {
    n: 5,
    emoji: "📚",
    time: "じっくり",
    title: "マンガと実践記事で、現場につなげる",
    desc: "基礎がついたら、noteの連載「マンガでわかる！AI活用」と実践記事へ。実際の仕事でどう使うか、失敗談込みのリアルな記録が読めます。",
    href: "https://note.com/aiux_unite",
    cta: "noteの連載を読む",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
        { "@type": "ListItem", position: 2, name: "AIのはじめかた", item: "https://comixai.dev/start" },
      ],
    },
    {
      "@type": "HowTo",
      name: "AIのはじめかた——遊びながら覚える5ステップ",
      description: "AI初心者のための学習ロードマップ。歴史→基本用語→診断→体験ゲーム→実践の順で、無料で学べます。",
      inLanguage: "ja",
      step: STEPS.map((s) => ({
        "@type": "HowToStep",
        position: s.n,
        name: s.title,
        text: s.desc,
        url: s.href.startsWith("http") ? s.href : `https://comixai.dev${s.href}`,
      })),
    },
  ],
};

export default function StartPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIのはじめかた" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          START — AIのはじめかた
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIは、遊びながら覚える。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          「勉強しなきゃ」と思うと続きません。このサイトは、歴史絵巻・用語集・診断・体験ゲームがぜんぶつながった<b>遊べる学習コース</b>になっています。
          上から順にやるだけ。ぜんぶ無料で、登録も不要です。
        </p>
      </section>

      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "10px 0 40px", display: "grid", gap: 18 }}>
        {STEPS.map((s) => (
          <Card key={s.n} variant="pop" padding={0} style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 16, padding: "20px 22px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: "none", width: 64, height: 64, borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: "var(--yellow-400)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-pop-sm)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11 }}>STEP</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 26, lineHeight: 1 }}>{s.n}</span>
              </div>
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 18 }}>
                    {s.emoji} {s.title}
                  </h2>
                  <Badge tone="soft">目安 {s.time}</Badge>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)" }}>{s.desc}</p>
                <a href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined} style={{ textDecoration: "none" }}>
                  <Button variant={s.n === 1 ? "primary" : "ink"} size="md" iconRight={<i className={`ph-bold ${s.href.startsWith("http") ? "ph-arrow-up-right" : "ph-arrow-right"}`} />}>
                    {s.cta}
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        ))}

        <div style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-100)", padding: "16px 20px" }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 2, color: "var(--text-body)" }}>
            💬 学ぶ前の不安（仕事を奪われる？会社で使っていい？）には{" "}
            <a href="/faq" style={{ color: "var(--red-600)", fontWeight: 700 }}>AIのよくある質問</a> で答えています。
            どのAIを使うか迷ったら <a href="/compare" style={{ color: "var(--red-600)", fontWeight: 700 }}>ChatGPT・Claude・Geminiの使い分け</a> をどうぞ。
          </p>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
