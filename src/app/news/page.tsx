import type { Metadata, Viewport } from "next";
import "./news.css";
import NewsApp from "./NewsApp";

export const metadata: Metadata = {
  title: "Prism | あなた専用ニュース",
  description:
    "読むほどに賢くなる、あなた専用のニュースフィード。Yahoo!ニュース全カテゴリから、好みに合わせて自動で厳選します。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prism",
  },
  icons: {
    apple: "/prism-icon-180.png",
  },
  robots: { index: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0d12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function NewsPage() {
  return <NewsApp />;
}
