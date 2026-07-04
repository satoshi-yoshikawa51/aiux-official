import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
/* フォントとアイコンはセルフホスト（npmパッケージからバンドル）。
   外部CDNへのレンダーブロッキング読み込みをなくし、LCPを改善する。 */
import "@fontsource/zen-kaku-gothic-new/400.css";
import "@fontsource/zen-kaku-gothic-new/500.css";
import "@fontsource/zen-kaku-gothic-new/700.css";
import "@fontsource/zen-kaku-gothic-new/900.css";
import "@fontsource/yusei-magic/400.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@phosphor-icons/web/bold";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://comixai.dev"),
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/feed.xml" },
  },
  title: "吉川 聡史 | COMIXAI — オフィシャルサイト",
  description:
    "AIクリエイター・漫画家・UXディレクター 吉川聡史のオフィシャルサイト。noteの連載マンガでAI活用を面白く、わかりやすく。",
  openGraph: {
    title: "吉川 聡史 | COMIXAI",
    description: "AIを、面白く。わかりやすく。マンガ×UXでAI活用を伝える。",
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "COMIXAI — 吉川聡史 オフィシャルサイト",
    images: [
      {
        url: "/ogp.png",
        width: 924,
        height: 540,
        alt: "COMIXAI 吉川聡史 — AIを、面白く。わかりやすく。",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@yoshikawa5116",
    creator: "@yoshikawa5116",
  },
};

/* SNS・検索でのプロフィール認識を高める構造化データ（Person + WebSite）。
   sameAs で各SNSを紐づけ、Googleに同一人物として理解させる。 */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      name: "吉川 聡史",
      alternateName: "COMIXAI",
      url: "https://comixai.dev",
      image: "https://comixai.dev/ogp.png",
      jobTitle: "AIクリエイター / 漫画家 / UXディレクター",
      description:
        "マンガとUXの力で、むずかしいAIを「現場で使える武器」に変えるAIクリエイター・漫画家・UXディレクター。株式会社ニジボックス室長。",
      worksFor: { "@type": "Organization", name: "株式会社ニジボックス" },
      sameAs: [
        "https://note.com/aiux_unite",
        "https://www.youtube.com/@aiux-unite",
        "https://x.com/yoshikawa5116",
        "https://www.facebook.com/profile.php?id=100008552592871",
        "https://jp.linkedin.com/in/%E8%81%A1%E5%8F%B2-%E5%90%89%E5%B7%9D-7b121a255",
        "https://www.threads.com/@ai_baystars",
        "https://youtrust.jp/users/yoshikawa51",
      ],
    },
    {
      "@type": "WebSite",
      name: "COMIXAI — 吉川聡史 オフィシャルサイト",
      url: "https://comixai.dev",
      inLanguage: "ja",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-2FVS6MP6GQ" />
    </html>
  );
}
