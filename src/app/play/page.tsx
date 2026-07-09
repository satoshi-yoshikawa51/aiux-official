import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { Breadcrumb } from "../site-ui";

export const metadata: Metadata = {
  title: "あそびば｜遊んで学べるAIコンテンツ一覧｜COMIXAI",
  description:
    "AI用語力診断、スクロールで読むAI歴史絵巻、コレクション図鑑——遊びながらAIが学べるコンテンツの入口。そして、このサイトのどこかには12個の隠し部屋が…。",
  keywords: ["AI ゲーム 学習", "AI クイズ", "AI 診断", "AIの歴史"],
  alternates: { canonical: "/play" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "あそびば｜遊びながら、AIを覚える。",
    description: "診断・絵巻・図鑑、そして12の隠し部屋。全部無料の遊べる学習コンテンツ。",
    url: "/play",
    locale: "ja_JP",
    images: [{ url: "/og/games/play.png", width: 1200, height: 630, alt: "あそびば" }],
  },
  twitter: { card: "summary_large_image" },
};

const MAIN: { emoji: string; title: string; desc: string; href: string; cta: string; badge: string }[] = [
  {
    emoji: "✏️",
    title: "AI用語力診断",
    desc: "毎回変わる12問・3分で5段階判定。ひっかけ問題入りなので、全問正解できたら本物の賢者です。結果はXでシェアできます。",
    href: "/quiz",
    cta: "診断してみる",
    badge: "3分",
  },
  {
    emoji: "📜",
    title: "AI歴史絵巻",
    desc: "1950年の「機械は考えられるか？」から現在まで、AIの75年をスクロールで読む1本の絵巻。時代ごとに空気が変わる演出つき。",
    href: "/history",
    cta: "絵巻を読む",
    badge: "5分",
  },
  {
    emoji: "📔",
    title: "COMIXAI図鑑",
    desc: "このサイトで遊んだ記録が刻まれるコレクション帳。診断の級、ゲームのエンディング、見つけた隠し部屋——全63項目、集めきれる？",
    href: "/zukan",
    cta: "図鑑をひらく",
    badge: "全63項目",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
        { "@type": "ListItem", position: 2, name: "あそびば", item: "https://comixai.dev/play" },
      ],
    },
  ],
};

export default function PlayPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "あそびば" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          PLAY — あそびば
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          遊びながら、AIを覚える。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          このサイトの遊べるコンテンツの入口です。ぜんぶ無料・登録不要。順番に迷ったら
          <a href="/start" style={{ color: "var(--red-600)", fontWeight: 700 }}>AIのはじめかた</a>もどうぞ。
        </p>
      </section>

      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "6px 0 30px", display: "grid", gap: 16 }}>
        {MAIN.map((m) => (
          <Card key={m.href} variant="pop" padding={0} style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 16, padding: "20px 22px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <span style={{ fontSize: 42, flex: "none", lineHeight: 1 }}>{m.emoji}</span>
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 18 }}>{m.title}</h2>
                  <Badge tone="soft">{m.badge}</Badge>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)" }}>{m.desc}</p>
                <a href={m.href} style={{ textDecoration: "none" }}>
                  <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
                    {m.cta}
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* 隠し部屋の匂わせ */}
      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "0 0 56px" }}>
        <div style={{ border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-lg)", background: "var(--ink-900)", color: "var(--paper-50)", padding: "24px 24px 26px", boxShadow: "var(--shadow-pop)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--yellow-400)", fontWeight: 700, marginBottom: 10 }}>
            SECRET — それから…
          </div>
          <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3.2vw,26px)", lineHeight: 1.5 }}>
            このサイトには、隠し部屋が<span style={{ color: "var(--yellow-400)" }}>12</span>ある。
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 2, color: "rgba(251,247,239,0.8)" }}>
            トークンが刻まれる工場、ウソを見抜く道場、エージェントの警備室……。入口は<b>AI用語集のどこか</b>にあります。
            どの用語に扉がありそうか、想像しながら探してみてください。見つけた部屋は図鑑に記録されます。
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} style={{ width: 44, height: 44, borderRadius: 10, border: "2px solid rgba(251,247,239,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                🚪
              </span>
            ))}
          </div>
          <a href="/glossary" style={{ textDecoration: "none" }}>
            <Button variant="yellow" size="md" iconRight={<i className="ph-bold ph-magnifying-glass" />}>
              用語集で扉を探す
            </Button>
          </a>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
