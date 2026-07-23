import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Button } from "../ds";
import { NOTE } from "../data";
import { WORK_DETAILS } from "./data";
import { Breadcrumb, SectionHead, WorkCard } from "./ui";

export const metadata: Metadata = {
  title: "つくったもの一覧｜AIで作ったゲーム・アプリ｜COMIXAI",
  description:
    "Claude Codeを遊びながら学べるRPG「Claude Code Quest」、手描きイラストから作った3Dゲーム、AIニュースリーダー「Prism」など、AIクリエイター吉川聡史がClaude・Claude Codeで作ったプロダクトを紹介。すべてブラウザですぐ試せます。",
  keywords: [
    "Claude Code 作品",
    "AI ゲーム",
    "Claude Code Quest",
    "AIアプリ 開発事例",
    "生成AI プロダクト",
    "吉川聡史",
  ],
  alternates: { canonical: "/works" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "つくったもの一覧｜AIで作ったゲーム・アプリ｜COMIXAI",
    description: "Claude・Claude Codeで作ったゲームやアプリの一覧。すべてブラウザですぐ試せます。",
    url: "/works",
    locale: "ja_JP",
    images: [{ url: "/ogp.png", width: 924, height: 540 }],
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
      ],
    },
    {
      "@type": "CollectionPage",
      name: "つくったもの一覧",
      url: "https://comixai.dev/works",
      inLanguage: "ja",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: WORK_DETAILS.map((w, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: w.title,
          url: `https://comixai.dev/works/${w.slug}`,
        })),
      },
    },
  ],
};

const CATS: { key: "ゲーム" | "ニュース" | "ツール"; icon: string }[] = [
  { key: "ゲーム", icon: "ph-game-controller" },
  { key: "ニュース", icon: "ph-newspaper" },
  { key: "ツール", icon: "ph-wrench" },
];

export default function WorksIndexPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "つくったもの" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 50px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          WORKS — つくったもの
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIでつくった、遊べるもの。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          「AIでこんなものが作れる」は、記事で読むより触ったほうが早い。Claude・Claude Codeで作ったゲームやアプリを、制作の裏側といっしょに紹介します。すべてブラウザですぐ試せて、作り方はnoteで公開中。気になったものから、どうぞ。
        </p>
      </section>

      <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)", backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)", backgroundSize: "11px 11px" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 60px" }}>
          {CATS.map((cat) => {
            const items = WORK_DETAILS.filter((w) => w.category === cat.key);
            if (!items.length) return null;
            return (
              <div key={cat.key} style={{ marginBottom: 34 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <i className={"ph-bold " + cat.icon} style={{ fontSize: 20, color: "var(--ink-900)" }} />
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17 }}>{cat.key}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="articles-grid">
                  {items.map((w) => (
                    <WorkCard key={w.slug} work={w} />
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <a href={NOTE} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                制作の裏側をnoteで読む
              </Button>
            </a>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "40px 0 46px" }}>
        <SectionHead kicker="MANGA — マンガ連載" title="マンガで学ぶなら" hand="連載シリーズもどうぞ" />
        <a href="/manga" style={{ textDecoration: "none" }}>
          <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
            連載シリーズ一覧を見る
          </Button>
        </a>
      </div>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
