import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { PROFILE_BODY_TOP, PROFILE_BODY_BOTTOM } from "./body";
import { Button } from "../ds";
import { RECORD_GROUPS, RECORD_COUNT } from "./records";
import { RecordCard, RecordGrid, cardsOf } from "./record-ui";
import { PROFILE_JSONLD } from "./jsonld";
import "./profile.css";

export const metadata: Metadata = {
  title: "吉川聡史（COMIXAI）プロフィール｜AIクリエイター・漫画家",
  description:
    "吉川聡史（よしかわさとし）のプロフィール。週刊少年チャンピオン連載の漫画家であり、株式会社ニジボックスの室長／UXディレクター。生成AI活用をマンガで伝えるAIクリエイターです。講演・研修・寄稿のご相談も承っています。",
  keywords: [
    "吉川聡史",
    "よしかわさとし",
    "COMIXAI",
    "AIクリエイター",
    "漫画家",
    "UXディレクター",
    "ニジボックス",
    "生成AI",
    "AI活用",
    "Claude Code",
    "週刊少年チャンピオン",
  ],
  alternates: { canonical: "/profile" },
  openGraph: {
    type: "profile",
    siteName: "COMIXAI",
    title: "吉川 聡史 プロフィール｜AIクリエイター・漫画家・UXディレクター",
    description: "マンガとUXの力で、生成AIを『現場で使える武器』に。漫画家・UXディレクター・AIクリエイター 吉川聡史のプロフィール。",
    url: "/profile",
    firstName: "聡史",
    lastName: "吉川",
    images: [{ url: "/ogp.png", width: 924, height: 540 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function ProfilePage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "プロフィール" }]} />
      <div dangerouslySetInnerHTML={{ __html: PROFILE_BODY_TOP }} />

      {/* ═══ RECORD ═══
          全件は /record に置き、ここは代表だけ。同じ形式で21件並べると
          7,800pxを超えて、プロフィールの他の情報が全部埋もれるため。 */}
      <section
        id="record"
        style={{
          background: "var(--ink-900)",
          borderTop: "var(--bw-bold) solid var(--ink-900)",
          borderBottom: "var(--bw-bold) solid var(--ink-900)",
          backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1.3px, transparent 1.4px)",
          backgroundSize: "13px 13px",
        }}
      >
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "56px 0 60px" }}>
          {/* 暗い背景なので SectionHead ではなく、profile.css の ink-sec と
              同じ配色（キッカー黄／見出し紙色）で組む */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--yellow-400)", fontWeight: 700, marginBottom: 8 }}>
              RECORD — 登壇・監修
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(24px,3.2vw,34px)", margin: 0, lineHeight: 1.25, color: "var(--paper-50)" }}>
                現場で、話してきたこと。
              </h2>
              <span style={{ fontFamily: "var(--font-hand)", color: "var(--paper-200)", fontSize: 16 }}>
                公開されている記録を{RECORD_COUNT}件
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 26 }}>
            {RECORD_GROUPS.map((g) => (
              <span
                key={g.label}
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: "var(--ink-900)",
                  background: "var(--paper-50)",
                  border: "var(--bw-line) solid var(--paper-50)",
                  borderRadius: "var(--radius-full)",
                  padding: "7px 15px",
                }}
              >
                <i className={"ph-bold " + g.icon} style={{ marginRight: 6, color: "var(--red-500)" }} />
                {g.label} {cardsOf(g).length}
              </span>
            ))}
          </div>
          <RecordGrid>
            {RECORD_GROUPS.slice(0, 3).map((g) => {
              const c = cardsOf(g)[0];
              return c ? <RecordCard key={c.url} card={c} group={g} place="profile-record" /> : null;
            })}
          </RecordGrid>
          <div style={{ marginTop: 30 }}>
            <a href="/record" data-ga="cta_click" data-ga-place="profile-record-all" style={{ textDecoration: "none" }}>
              <Button variant="yellow" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
                実績をすべて見る（{RECORD_COUNT}件）
              </Button>
            </a>
          </div>
        </div>
      </section>

      <div dangerouslySetInnerHTML={{ __html: PROFILE_BODY_BOTTOM }} />
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: PROFILE_JSONLD }} />
    </div>
  );
}
