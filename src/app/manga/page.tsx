import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Button } from "../ds";
import { NOTE } from "../data";
import { MANGA_SERIES } from "./data";
import { Breadcrumb, SectionHead, ShareRow, SeriesCard } from "./ui";

export const metadata: Metadata = {
  title: "AI活用マンガ連載一覧｜マンガでわかる生成AI｜COMIXAI",
  description:
    "生成AIの入門から実践、AI時代の考察まで。漫画家・AIクリエイター吉川聡史がnoteで連載する「マンガでわかる！AI活用」「マンガで実践！AI活用」「AI時代の流行と本質」の3シリーズを紹介。むずかしいAIを、マンガで面白く、わかりやすく。",
  keywords: [
    "AI活用 マンガ",
    "マンガでわかる 生成AI",
    "生成AI 入門",
    "AI マンガ 連載",
    "吉川聡史",
    "COMIXAI",
  ],
  alternates: { canonical: "/manga" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "AI活用マンガ・連載シリーズ一覧｜COMIXAI",
    description: "生成AIの入門から実践、AI時代の考察まで。マンガで学べる3つの連載シリーズを紹介します。",
    url: "/manga",
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
        { "@type": "ListItem", position: 2, name: "マンガ連載", item: "https://comixai.dev/manga" },
      ],
    },
    {
      "@type": "CollectionPage",
      name: "AI活用マンガ・連載シリーズ一覧",
      url: "https://comixai.dev/manga",
      inLanguage: "ja",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: MANGA_SERIES.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: s.title,
          url: `https://comixai.dev/manga/${s.slug}`,
        })),
      },
    },
  ],
};

export default function MangaIndexPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "マンガ連載" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 50px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          MANGA SERIES — 連載シリーズ
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          マンガで読む、AI活用。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          むずかしい生成AIの話も、マンガなら楽しく頭に入る。週刊少年チャンピオンで連載経験のある漫画家であり、Web制作の現場に立つAIクリエイターでもある吉川聡史が、noteで3つのシリーズを連載しています。入門から実践、そしてAI時代を生き延びるための考察まで——あなたに合うシリーズから、どうぞ。
        </p>
      </section>

      <section style={{ background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)", backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)", backgroundSize: "11px 11px" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 60px" }}>
          <SectionHead kicker="SERIES — 全シリーズ" title="3つの連載シリーズ" hand="入門 → 実践 → 考察" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }} className="mag-grid">
            {MANGA_SERIES.map((s) => (
              <SeriesCard key={s.slug} series={s} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <a href={NOTE} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                noteをフォローして新着を受け取る
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/manga" text="AI活用マンガ・連載シリーズ一覧" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
