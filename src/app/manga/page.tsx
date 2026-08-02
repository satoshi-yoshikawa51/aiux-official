import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { NOTE } from "../data";
import { MANGA_SERIES } from "./data";
import { Breadcrumb, SectionHead, ShareRow, SeriesCard } from "./ui";
import { toneBg } from "../site-ui";

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

/* ═══ 連載の全体像 ═══
   「何話あって、どれだけ読まれているか」が一目でわかるようにする。
   読む人には「どれから読むか」の material に、
   出版・寄稿の相談で見に来た人には連載の規模の裏づけになる。
   数字はすべて episodes.json（CIが毎週noteから更新）から算出する。 */
const ALL_EPISODES = MANGA_SERIES.flatMap((s) => s.episodes);
const TOTAL_LIKES = ALL_EPISODES.reduce((n, e) => n + (e.likes ?? 0), 0);
const EPISODE_DATES = ALL_EPISODES.map((e) => e.date)
  .filter((d): d is string => Boolean(d))
  .sort();
const FIRST_DATE = EPISODE_DATES[0];
/** 2024-09-02 → 2024.9 */
const ymLabel = (d: string) => `${d.slice(0, 4)}.${Number(d.slice(5, 7))}`;

const STATS: { value: string; label: string }[] = [
  { value: String(MANGA_SERIES.length), label: "シリーズ" },
  { value: String(ALL_EPISODES.length), label: "全話数" },
  { value: TOTAL_LIKES.toLocaleString("ja-JP"), label: "累計スキ" },
  { value: FIRST_DATE ? `${ymLabel(FIRST_DATE)}〜` : "—", label: "連載中" },
];

function EpisodeRow({ ep }: { ep: (typeof ALL_EPISODES)[number] }) {
  return (
    <a
      href={ep.url}
      target="_blank"
      rel="noopener noreferrer"
      data-ga="card_click"
      data-ga-place="manga-episode"
      data-ga-path={ep.url}
      style={{
        display: "grid",
        gridTemplateColumns: "58px minmax(0, 1fr) auto",
        gap: 14,
        alignItems: "center",
        padding: "13px 16px",
        textDecoration: "none",
        color: "inherit",
        borderBottom: "var(--bw-hair) solid var(--paper-200)",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--red-600)" }}>
        {ep.no != null ? `第${ep.no}話` : ep.date ? ymLabel(ep.date) : "—"}
      </span>
      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14.5, lineHeight: 1.6, minWidth: 0 }}>
        {ep.title}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        {ep.likes != null && (
          <>
            <i className="ph-bold ph-heart" style={{ color: "var(--red-500)" }} />
            {ep.likes.toLocaleString("ja-JP")}
          </>
        )}
        <i className="ph-bold ph-arrow-up-right" />
      </span>
    </a>
  );
}

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

      {/* ═══ 全話一覧 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "54px 0 50px" }}>
        <SectionHead
          kicker="EPISODES — 全話一覧"
          title={`${ALL_EPISODES.length}話、ぜんぶここに。`}
          hand="気になった回から読んでOK"
        />
        <div
          style={{
            display: "grid",
            /* PCは4つ横並び、スマホは2列に折り返す（縦一列だと間延びする） */
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                border: "var(--bw-line) solid var(--ink-900)",
                borderRadius: "var(--radius-md)",
                background: "var(--paper-0)",
                boxShadow: "var(--shadow-pop-sm)",
                padding: "18px 12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 27, lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: 22 }}>
          {MANGA_SERIES.map((s) => (
            <Card key={s.slug} variant="pop" padding={0} style={{ overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  padding: "14px 18px",
                  background: toneBg(s.tone),
                  borderBottom: "var(--bw-line) solid var(--ink-900)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Badge tone="red">{s.label}</Badge>
                  <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17 }}>
                    {s.title}
                  </h3>
                </div>
                <a
                  href={`/manga/${s.slug}`}
                  data-ga="card_click"
                  data-ga-place="manga-series"
                  data-ga-path={`/manga/${s.slug}`}
                  style={{
                    textDecoration: "none",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--ink-900)",
                  }}
                >
                  シリーズ紹介を見る <i className="ph-bold ph-arrow-right" />
                </a>
              </div>
              <div style={{ background: "var(--paper-0)" }}>
                {s.episodes.map((ep) => (
                  <EpisodeRow key={ep.url} ep={ep} />
                ))}
              </div>
            </Card>
          ))}
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
