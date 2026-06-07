import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { BANNER } from "./data";
import "./globals.css";

export const metadata: Metadata = {
  title: "吉川 聡史 | AI＆UX — オフィシャルサイト",
  description:
    "AIクリエイター・漫画家・UXディレクター 吉川聡史のオフィシャルサイト。noteの連載マンガでAI活用を面白く、わかりやすく。",
  openGraph: {
    title: "吉川 聡史 | AI＆UX — オフィシャルサイト",
    description:
      "AIクリエイター・漫画家・UXディレクター 吉川聡史のオフィシャルサイト。noteの連載マンガでAI活用を面白く、わかりやすく。",
    type: "website",
    locale: "ja_JP",
    images: [BANNER],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Yusei+Magic&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css" />
      </head>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-2FVS6MP6GQ" />
    </html>
  );
}
