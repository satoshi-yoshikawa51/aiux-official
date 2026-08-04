import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Card } from "../ds";
import { Breadcrumb, ShareRow } from "../site-ui";
import { DAILY_ENTRIES, DAILY_UPDATED, LATEST_DAILY, formatDailyDate } from "./data";

export const metadata: Metadata = {
  title: "今日のAIを4コマで｜毎朝更新のAIニュース漫画｜COMIXAI",
  description:
    "その日のAIニュースを、漫画家・吉川聡史のキャラクターが4コマにして毎朝おとどけ。専門用語だらけのニュースを「で、自分の仕事はどうなるの？」の目線でほぐします。読むのに1分もかかりません。",
  keywords: ["AI ニュース わかりやすく", "生成AI 毎日", "AI 4コマ", "AI マンガ 解説"],
  alternates: { canonical: "/daily" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "今日のAIを4コマで｜毎朝更新",
    description: "その日のAIニュースを4コマ漫画で。読むのに1分もかかりません。",
    url: "/daily",
    locale: "ja_JP",
    images: [
      LATEST_DAILY
        ? { url: LATEST_DAILY.og, width: 1200, height: 630, alt: LATEST_DAILY.title }
        : { url: "/ogp.png", width: 1200, height: 630, alt: "COMIXAI" },
    ],
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
        { "@type": "ListItem", position: 2, name: "今日のAIを4コマで", item: "https://comixai.dev/daily" },
      ],
    },
    {
      "@type": "Blog",
      name: "今日のAIを4コマで",
      url: "https://comixai.dev/daily",
      description: "その日のAIニュースを4コマ漫画にして毎朝更新する連載。",
      inLanguage: "ja",
      author: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
    },
  ],
};

export default function DailyIndexPage() {
  const rest = DAILY_ENTRIES.slice(1);
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "今日のAIを4コマで" }]} />

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
          DAILY — 毎朝7時ごろ更新
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
          今日のAIを、4コマで。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0, maxWidth: 720 }}>
          AIのニュースは毎日出るけれど、読んでも「で、自分の仕事はどうなるの？」が分からないまま終わりがち。
          このページでは、その日の話題を
          <a href="/profile" style={{ color: "var(--red-600)", fontWeight: 700 }}>
            漫画家
          </a>
          の目線で4コマにしています。読むのに1分もかかりません。
        </p>
      </section>

      {/* ═══ 最新回 ═══
          4コマは縦に長いので、カードの幅を絞って全体が視界に入るようにする */}
      {LATEST_DAILY ? (
        <section style={{ maxWidth: "min(560px, 92vw)", margin: "0 auto", padding: "0 0 44px" }}>
          <a href={`/daily/${LATEST_DAILY.date}`} style={{ textDecoration: "none", color: "inherit" }}>
            <Card variant="pop" padding={0} hover style={{ overflow: "hidden" }}>
              <img
                src={LATEST_DAILY.image}
                alt={`4コマ漫画「${LATEST_DAILY.title}」`}
                width={1080}
                style={{ display: "block", width: "100%", height: "auto", borderBottom: "var(--bw-line) solid var(--ink-900)" }}
              />
              <div style={{ padding: "18px 20px 20px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 8 }}>
                  最新回 — {formatDailyDate(LATEST_DAILY.date)}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, lineHeight: 1.4, marginBottom: 10 }}>
                  {LATEST_DAILY.title}
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.95, color: "var(--text-body)", margin: 0 }}>{LATEST_DAILY.lead}</p>
              </div>
            </Card>
          </a>
        </section>
      ) : (
        <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 44px" }}>
          <Card variant="pop" padding={22}>
            <p style={{ fontSize: 15, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
              明日の朝から更新がはじまります。
            </p>
          </Card>
        </section>
      )}

      {/* ═══ これまでの回 ═══ */}
      {rest.length > 0 && (
        <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 44px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, margin: "0 0 16px" }}>
            これまでの回（全{DAILY_ENTRIES.length}回）
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {rest.map((e) => (
              <a key={e.date} href={`/daily/${e.date}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Card variant="pop" padding={0} hover style={{ overflow: "hidden", height: "100%" }}>
                  <div style={{ height: 150, overflow: "hidden", borderBottom: "var(--bw-line) solid var(--ink-900)" }}>
                    <img
                      src={e.image}
                      alt=""
                      width={1080}
                      style={{ display: "block", width: "100%", height: "auto" }}
                    />
                  </div>
                  <div style={{ padding: "12px 14px 14px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                      {e.date}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.6 }}>{e.title}</div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 作り方の話 ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 34px" }}>
        <Card variant="pop" padding={22} style={{ background: "var(--paper-0)" }}>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--red-600)", marginBottom: 8 }}>
            <i className="ph-bold ph-gear" style={{ marginRight: 6 }} />
            このページの作り方
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
            毎朝、AI系メディアのRSSから見出しを集め、その中の1本をClaudeにネーム（構成とセリフ）へ起こさせ、
            用意しておいたキャラクターの表情差分をコマ割りテンプレートに流し込んで書き出しています。
            仕組みそのものが<a href="/vibe" style={{ color: "var(--red-600)", fontWeight: 700 }}>AIで作ったもの</a>です。
            出典は各回の下に必ず載せています。
          </p>
        </Card>
      </section>

      {/* ═══ シェア ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 60px" }}>
        <ShareRow path="/daily" text="今日のAIを4コマで｜毎朝更新のAIニュース漫画" label="面白かったらシェア→" />
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 14 }}>
          最終更新: {DAILY_UPDATED}
        </p>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
