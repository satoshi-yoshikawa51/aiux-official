import type { Metadata } from "next";
/* まる文字フォントはこのページ専用。他ページのLCPに影響しないようここでimportする */
import "@fontsource/zen-maru-gothic/400.css";
import "@fontsource/zen-maru-gothic/500.css";
import "@fontsource/zen-maru-gothic/700.css";
import "./inugatari.css";
import { InugatariApp } from "./app";

const TITLE = "いぬがたり 〜あなたの「想い」にこたえます〜";
const DESC = "いまの気持ちを選ぶと、ちいさな犬が偉人のことばをひらがなでそっと届けてくれる。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  /* プロトタイプなので検索には載せない（sitemapにも入れていない） */
  robots: { index: false },
  alternates: { canonical: "/inugatari" },
  openGraph: {
    title: TITLE,
    description: DESC,
    siteName: "いぬがたり",
    type: "website",
    url: "/inugatari",
    /* 手描きのカード（1200×630）。差し替えるときは同名で上書きする */
    images: [{ url: "/inugatari/og-top.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function InugatariPage() {
  return <InugatariApp />;
}
