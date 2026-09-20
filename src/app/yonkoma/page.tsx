import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Card } from "../ds";
import { Breadcrumb, ShareRow } from "../site-ui";
import { TERMS } from "../glossary/data";
import { RECIPES } from "../prompts/data";
import { listYonkoma, type YonkomaItem } from "./registry";

export const metadata: Metadata = {
  title: "4コマでわかる！AI用語｜漫画家が描くAI用語とプロンプトのコツ｜COMIXAI",
  description:
    "AI用語やプロンプトのコツを、週刊少年チャンピオンで連載経験のある漫画家・吉川聡史が4コマ漫画に。文章で読むより先に、まず笑って掴む。1本ずつ増えていく描き下ろしシリーズです。",
  keywords: ["AI 4コマ", "AI マンガ わかりやすく", "AI用語 マンガ", "プロンプト マンガ"],
  alternates: { canonical: "/yonkoma" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "4コマでわかる！AI用語｜漫画家が描くAI解説",
    description: "AI用語やプロンプトのコツを4コマ漫画で。まず笑って掴む。",
    url: "/yonkoma",
    locale: "ja_JP",
    images: [{ url: "/ogp.png", width: 1200, height: 630, alt: "4コマでわかる！AI用語" }],
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
        { "@type": "ListItem", position: 2, name: "4コマで学ぶAI", item: "https://comixai.dev/yonkoma" },
      ],
    },
    {
      "@type": "CollectionPage",
      name: "4コマでわかる！AI用語",
      url: "https://comixai.dev/yonkoma",
      description: "AI用語やプロンプトのコツを4コマ漫画で解説する描き下ろしシリーズ。",
      inLanguage: "ja",
      author: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
    },
  ],
};

/* 画像のslugから、リンク先ページとタイトルを引く */
function resolveItem(item: YonkomaItem): { href: string; title: string; badge: string } | null {
  if (item.section === "glossary") {
    const t = TERMS.find((x) => x.slug === item.slug);
    return t ? { href: `/glossary/${t.slug}`, title: `${t.term}とは？`, badge: "AI用語集" } : null;
  }
  const r = RECIPES.find((x) => x.slug === item.slug);
  return r ? { href: `/prompts/${r.slug}`, title: r.title, badge: "プロンプト集" } : null;
}

export default function YonkomaGalleryPage() {
  const items = listYonkoma()
    .map((item) => ({ item, page: resolveItem(item) }))
    .filter((x): x is { item: YonkomaItem; page: NonNullable<ReturnType<typeof resolveItem>> } => Boolean(x.page));

  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "4コマで学ぶAI" }]} />

      {/* ═══ 見出し ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.16em",
            color: "var(--red-600)",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          YONKOMA — 描き下ろし
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "clamp(30px,4.8vw,48px)",
            lineHeight: 1.25,
            margin: "0 0 18px",
          }}
        >
          4コマでわかる！AI用語
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0, maxWidth: 720 }}>
          AIの用語やプロンプトのコツを、文章で読む前に、まず4コマで。
          <a href="/profile" style={{ color: "var(--red-600)", fontWeight: 700 }}>
            週刊少年チャンピオンで連載していた漫画家
          </a>
          が1本ずつ描き下ろしています。笑って掴んでから解説を読むと、覚え方が変わります。
        </p>
      </section>

      {/* ═══ 一覧 ═══ */}
      {items.length > 0 ? (
        <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 48px" }}>
          <div
            className="rv-stagger"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}
          >
            {items.map(({ item, page }) => (
              <a key={item.src} href={page.href} style={{ textDecoration: "none", color: "inherit" }}>
                <Card variant="pop" padding={0} hover style={{ overflow: "hidden", height: "100%" }}>
                  {/* 4コマは縦長なので、カードでは1コマ目あたりまでを見せて誘う */}
                  <div style={{ height: 220, overflow: "hidden", borderBottom: "var(--bw-line) solid var(--ink-900)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.src} alt="" style={{ display: "block", width: "100%", height: "auto" }} />
                  </div>
                  <div style={{ padding: "13px 15px 15px" }}>
                    <Badge tone={item.section === "glossary" ? "yellow" : "blue"} style={{ marginBottom: 8 }}>
                      {page.badge}
                    </Badge>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.6 }}>{page.title}</div>
                    <div style={{ fontFamily: "var(--font-hand)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>
                      4コマを読む <i className="ph-bold ph-arrow-right" style={{ fontSize: 11 }} />
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </section>
      ) : (
        <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 48px" }}>
          <Card variant="pop" padding={24}>
            <p style={{ fontSize: 15, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
              1本目を描き下ろし中です。できあがった4コマから順に、ここに並んでいきます。
            </p>
          </Card>
        </section>
      )}

      {/* ═══ 入口の案内 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 40px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/glossary" style={{ flex: "1 1 260px", textDecoration: "none", color: "inherit" }}>
            <Card variant="pop" padding={18} hover>
              <div style={{ fontWeight: 900, fontSize: 15.5, marginBottom: 6 }}>
                <i className="ph-bold ph-book-open-text" style={{ marginRight: 8, color: "var(--red-500)" }} />
                AI用語集を読む
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.9, color: "var(--text-muted)", margin: 0 }}>
                4コマの元になっている155語の解説。マンガ付きの語から読むのがおすすめ。
              </p>
            </Card>
          </a>
          <a href="/prompts" style={{ flex: "1 1 260px", textDecoration: "none", color: "inherit" }}>
            <Card variant="pop" padding={18} hover>
              <div style={{ fontWeight: 900, fontSize: 15.5, marginBottom: 6 }}>
                <i className="ph-bold ph-chef-hat" style={{ marginRight: 8, color: "var(--blue-500)" }} />
                プロンプト集を見る
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.9, color: "var(--text-muted)", margin: 0 }}>
                「ダメな指示→事故る→直す」の実演つきレシピ24本。4コマの舞台はだいたいここ。
              </p>
            </Card>
          </a>
        </div>
      </section>

      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 60px" }}>
        <ShareRow path="/yonkoma" text="4コマでわかる！AI用語｜漫画家が描くAI解説" label="面白かったらシェア→" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
