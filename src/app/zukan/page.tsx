import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { ZUKAN_TOTAL } from "./data";
import { ZukanCollection } from "./collection";

export const metadata: Metadata = {
  title: `COMIXAI図鑑｜隠し部屋・称号・エンディングを集めよう【全${ZUKAN_TOTAL}項目】｜COMIXAI`,
  description:
    "このサイトに散らばる隠し部屋6つ、診断の級、ゲームのエンディング——ぜんぶ集めるとどうなる？あなたの冒険の記録が刻まれるコレクション図鑑。",
  robots: { index: false, follow: true },
  alternates: { canonical: "/zukan" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: `COMIXAI図鑑｜全${ZUKAN_TOTAL}項目、集めきれるか`,
    description: "隠し部屋・称号・エンディングのコレクション図鑑。",
    url: "/zukan",
    locale: "ja_JP",
    images: [{ url: "/og/games/zukan.png", width: 1200, height: 630, alt: "COMIXAI図鑑" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function ZukanPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "COMIXAI図鑑" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          ZUKAN — コレクション
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          COMIXAI図鑑
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          このサイトのどこかに、隠し部屋が6つあります。診断の級、ゲームのエンディング、育てたAIモデル——
          遊んだ記録はぜんぶ、この図鑑に刻まれます。全{ZUKAN_TOTAL}項目。コンプした人には、称号を。
        </p>
      </section>
      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "0 0 60px" }}>
        <ZukanCollection />
      </section>
      <Footer />
    </div>
  );
}
