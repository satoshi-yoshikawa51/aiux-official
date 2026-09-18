import type { Metadata } from "next";
/* まる文字フォントはこのページ専用。他ページのLCPに影響しないようここでimportする */
import "@fontsource/zen-maru-gothic/400.css";
import "@fontsource/zen-maru-gothic/500.css";
import "@fontsource/zen-maru-gothic/700.css";
import "./cheer.css";
import { CheerApp } from "./app";

export const metadata: Metadata = {
  title: "きょうの きみに",
  description:
    "いまの気持ちを選ぶと、ちいさなペットが偉人のことばをひらがなでそっと言い換えてくれる。",
  /* プロトタイプなので検索には載せない（sitemapにも入れていない） */
  robots: { index: false },
};

export default function CheerPage() {
  return <CheerApp />;
}
