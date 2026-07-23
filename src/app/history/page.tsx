import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { Breadcrumb } from "../site-ui";
import { EmakiFx } from "./emaki-fx";

export const metadata: Metadata = {
  title: "AIの歴史75年をわかりやすく｜チューリングからエージェント時代までの絵巻｜COMIXAI",
  description:
    "1950年のチューリングテストから、AI冬の時代、ディープラーニング革命、ChatGPT、そしてAIエージェント時代まで——AIの75年の歴史を、スクロールで読める1本の絵巻にしました。各時代の用語解説つき。",
  keywords: ["AI 歴史", "人工知能 歴史 わかりやすく", "AI 年表", "ディープラーニング 歴史", "ChatGPT 歴史"],
  alternates: { canonical: "/history" },
  openGraph: {
    type: "article",
    siteName: "COMIXAI",
    title: "AIの75年を、ひと巻きに。｜AI歴史絵巻",
    description: "チューリングからエージェント時代まで。スクロールで読むAIの歴史。",
    url: "/history",
    locale: "ja_JP",
    images: [{ url: "/og/games/history.png", width: 1200, height: 630, alt: "AI歴史絵巻" }],
  },
  twitter: { card: "summary_large_image" },
};

import { ERAS, type Era } from "./eras";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
        { "@type": "ListItem", position: 2, name: "AI歴史絵巻", item: "https://comixai.dev/history" },
      ],
    },
    {
      "@type": "Article",
      headline: "AIの歴史75年をわかりやすく——チューリングからエージェント時代まで",
      url: "https://comixai.dev/history",
      inLanguage: "ja",
      dateModified: "2026-07-08",
      author: { "@type": "Person", name: "吉川 聡史", alternateName: "COMIXAI", url: "https://comixai.dev/profile" },
    },
  ],
};

export default function HistoryPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <EmakiFx />
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI歴史絵巻" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 30px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          EMAKI — AI歴史絵巻
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIの75年を、ひと巻きに。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
          1950年の「機械は考えられるか？」から、AI冬の時代、ディープラーニング革命、ChatGPT、そしてエージェント時代まで。
          下にスクロールすると、時代が進みます。ぜんぶ読むと、いまのAIブームが「何度目の春」なのかがわかります。
        </p>
      </section>

      {/* リビール由来のtransformがこのsectionをスタッキングコンテキスト化するため、
          section自体をz2に上げて演出レイヤー(z1)より前面で描画させる。
          カード間の余白は透明なので、背面のパーティクル・年号・ティントはそこから見える */}
      <section style={{ maxWidth: "min(720px, 92vw)", margin: "0 auto", padding: "10px 0 40px", position: "relative", zIndex: 2 }}>
        <div className="emaki-wrap">
          {ERAS.map((era) => (
            <article key={era.year} className="emaki-panel" data-year={era.year.slice(0, 4)} data-fx={era.fx} data-tint={era.tint}>
              <span className="emaki-dot" style={{ background: era.tone === "winter" ? "#dbe9ff" : era.tone === "boom" ? "var(--red-500)" : "var(--yellow-400)" }} />
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: era.tone === "winter" ? "var(--blue-500)" : "var(--red-600)", marginBottom: 6 }}>
                {era.year}
                {era.tone === "winter" && <Badge tone="blue" style={{ marginLeft: 10 }}>AIの冬</Badge>}
              </div>
              <Card variant="pop" padding={0} style={{ overflow: "hidden", background: era.tone === "winter" ? "#f3f7ff" : "var(--paper-0)" }}>
                {era.video ? (
                  /* ReactはSSRでmuted属性を出力しないため、rawタグで埋め込む（クイズバナーと同じ手法） */
                  <div
                    style={{ borderBottom: "var(--bw-line) solid var(--ink-900)", aspectRatio: "720 / 544", background: era.tone === "winter" ? "#f3f7ff" : "var(--paper-100)" }}
                    dangerouslySetInnerHTML={{
                      __html: `<video src="${era.video}" poster="${era.image ?? ""}" autoplay muted loop playsinline preload="metadata" aria-label="${era.title}" style="width:100%;height:100%;object-fit:cover;display:block;"></video>`,
                    }}
                  />
                ) : era.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={era.image} alt={era.title} loading="lazy" style={{ width: "100%", display: "block", borderBottom: "var(--bw-line) solid var(--ink-900)" }} />
                ) : (
                  <div style={{ textAlign: "center", fontSize: 44, letterSpacing: "0.15em", padding: "22px 10px 14px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: era.tone === "boom" ? "var(--yellow-400)" : undefined }}>
                    {era.scene}
                  </div>
                )}
                <div style={{ padding: "16px 20px 18px" }}>
                  <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 18.5, lineHeight: 1.5 }}>{era.title}</h2>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 2, color: "var(--text-body)" }}>{era.body}</p>
                  {era.hand && (
                    <p style={{ margin: "10px 0 0", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--text-muted)" }}>{era.hand}</p>
                  )}
                  {era.terms && (
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                      {era.terms.map((t) => (
                        <a
                          key={t.slug}
                          href={`/glossary/${t.slug}`}
                          style={{
                            textDecoration: "none",
                            fontFamily: "var(--font-heading)",
                            fontWeight: 700,
                            fontSize: 12,
                            color: "var(--ink-900)",
                            background: "var(--paper-0)",
                            border: "var(--bw-line) solid var(--ink-900)",
                            borderRadius: "var(--radius-full)",
                            padding: "6px 12px",
                            boxShadow: "var(--shadow-pop-sm)",
                          }}
                        >
                          {t.label} <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)" }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </article>
          ))}
        </div>

        {/* 読了エリア */}
        <Card variant="pop" padding={0} style={{ overflow: "hidden", marginTop: 10 }}>
          <div style={{ padding: "28px 26px 24px", textAlign: "center", background: "var(--yellow-400)", borderBottom: "var(--bw-bold) solid var(--ink-900)" }}>
            <div style={{ fontSize: 40, lineHeight: 1 }}>📜</div>
            <h2 style={{ margin: "8px 0 0", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.8vw,28px)" }}>読破！75年、おつかれさまでした。</h2>
          </div>
          <div style={{ padding: "20px 24px 26px", textAlign: "center" }}>
            <p style={{ margin: "0 auto 18px", fontSize: 14, lineHeight: 1.95, color: "var(--text-body)", maxWidth: 480 }}>
              AIの歴史は「ブームと冬」の繰り返しでした。いまの春を上手に使う側になるために——用語と体験は、このサイトにそろえてあります。
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("AIの75年史、1本の絵巻で読めるページが面白かった。いまが「何度目の春」か知ってる？\n#今さら聞けないAI用語集")}&url=${encodeURIComponent("https://comixai.dev/history")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                  この絵巻をXでシェア
                </Button>
              </a>
              <a href="/quiz" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
                  AI用語力診断に挑戦
                </Button>
              </a>
            </div>
            <p style={{ margin: "16px 0 0", textAlign: "center", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--text-muted)" }}>
              📖 図鑑に「AI75年史・読破」を記録しました —{" "}
              <a href="/zukan" style={{ color: "var(--red-600)", fontWeight: 700 }}>
                コレクションを見る
              </a>
            </p>
          </div>
        </Card>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
