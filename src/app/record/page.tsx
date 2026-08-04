import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Button } from "../ds";
import { Breadcrumb, SectionHead, ShareRow } from "../site-ui";
import { RECORD_GROUPS, RECORD_COUNT } from "../profile/records";
import { RecordCard, RecordGrid, cardsOf } from "../profile/record-ui";
import { seoTitle } from "../seo";

export const metadata: Metadata = {
  title: seoTitle("登壇・監修の実績", "吉川聡史", "COMIXAI"),
  description:
    "AIクリエイター・漫画家・UXディレクター 吉川聡史の登壇・出演・監修の実績一覧。カンファレンス登壇、AI活用の解説動画、記事監修などを掲載しています。講演・執筆のご相談はお問い合わせから。",
  keywords: ["吉川聡史 登壇", "吉川聡史 実績", "AI 講演", "生成AI 登壇", "記事監修", "COMIXAI"],
  alternates: { canonical: "/record" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "登壇・監修の実績｜吉川聡史",
    description: "カンファレンス登壇、AI活用の解説動画、記事監修などの実績一覧。",
    url: "/record",
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
        { "@type": "ListItem", position: 2, name: "プロフィール", item: "https://comixai.dev/profile" },
        { "@type": "ListItem", position: 3, name: "登壇・監修の実績", item: "https://comixai.dev/record" },
      ],
    },
    {
      "@type": "CollectionPage",
      name: "登壇・監修の実績",
      url: "https://comixai.dev/record",
      inLanguage: "ja",
      about: {
        "@type": "Person",
        name: "吉川 聡史",
        alternateName: "COMIXAI",
        url: "https://comixai.dev/profile",
      },
    },
  ],
};

export default function RecordPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb
        trail={[
          { name: "ホーム", href: "/" },
          { name: "プロフィール", href: "/profile" },
          { name: "登壇・監修の実績" },
        ]}
      />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 44px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          RECORD — 登壇・監修の実績
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          現場で、話してきたこと。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0, maxWidth: 760 }}>
          公開されている登壇・出演・監修・講座の記録を、区分ごとに新しい順で{RECORD_COUNT}件。
          実施主体はそれぞれに明記しています。講演・研修・執筆・監修のご相談は
          <a href="/#contact" data-ga="nav_click" data-ga-place="record-contact" data-ga-path="/#contact" style={{ color: "var(--red-600)", fontWeight: 700 }}>
            お問い合わせ
          </a>
          から。
        </p>
      </section>

      {RECORD_GROUPS.map((g, i) => {
        const cards = cardsOf(g);
        if (cards.length === 0) return null;
        /* 区分ごとに背景を交互にして、切れ目を分かりやすくする */
        const sunk = i % 2 === 1;
        return (
          <section
            key={g.label}
            style={
              sunk
                ? {
                    background: "var(--paper-100)",
                    borderTop: "var(--bw-line) solid var(--ink-900)",
                    borderBottom: "var(--bw-line) solid var(--ink-900)",
                    backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)",
                    backgroundSize: "11px 11px",
                  }
                : undefined
            }
          >
            <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "50px 0 54px" }}>
              {/* 区分名を大見出しに、説明と主体はその横に添える */}
              <SectionHead
                kicker={
                  <>
                    <i className={"ph-bold " + g.icon} style={{ marginRight: 6 }} />
                    {g.note}
                  </>
                }
                title={`${g.label}（${cards.length}件）`}
                hand={g.client}
              />
              <RecordGrid>
                {cards.map((c) => (
                  <RecordCard key={c.url} card={c} group={g} place={`record-${g.kind}`} />
                ))}
              </RecordGrid>
            </div>
          </section>
        );
      })}

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "52px 0 20px", textAlign: "center" }}>
        <a href="/profile" data-ga="cta_click" data-ga-place="record-profile" style={{ textDecoration: "none" }}>
          <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
            プロフィールを見る
          </Button>
        </a>
      </section>

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "0 0 52px" }}>
        <ShareRow path="/record" text="吉川聡史の登壇・監修の実績" />
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
