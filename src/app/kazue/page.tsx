import type { Metadata } from "next";
import { Footer } from "../site-chrome";
import "./kazue.css";
import { KazueTeaser } from "./teaser";

/* 「号外!! 新選組カズエ RE:BOOT」連載開始前のティザー。
   全画面で見せたいページなので、共通のNavとパンくずは置かない
   （左上の「COMIXAI」でトップへ戻れる）。構造化データのパンくずは残す。 */

const TITLE = "号外!! 新選組カズエ RE:BOOT｜近日連載開始｜COMIXAI";
const DESC =
  "「貴様、それでも男か」——約20年前に新人賞に入選し、週刊連載された作品を、AIといっしょにRE:BOOT（創りなおす）。吉川聡史の新連載マンガ『号外!! 新選組カズエ RE:BOOT』ティザーサイト。描きながら、そのノウハウも惜しみなく公開していきます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: ["新選組カズエ", "新選組カズエ RE:BOOT", "AIマンガ研究所", "AI 漫画 連載", "吉川聡史"],
  alternates: { canonical: "/kazue" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "号外!! 新選組カズエ RE:BOOT｜近日連載開始",
    description: "「貴様、それでも男か」——新人賞入選、そして週刊連載。その作品をAIといっしょにRE:BOOT（創りなおす）。",
    url: "/kazue",
    locale: "ja_JP",
    images: [{ url: "/og/kazue.png", width: 1200, height: 630, alt: "号外!! 新選組カズエ RE:BOOT" }],
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
        { "@type": "ListItem", position: 2, name: "号外!! 新選組カズエ RE:BOOT", item: "https://comixai.dev/kazue" },
      ],
    },
    {
      "@type": "ComicSeries",
      name: "号外!! 新選組カズエ RE:BOOT",
      url: "https://comixai.dev/kazue",
      description: DESC,
      image: "https://comixai.dev/og/kazue.png",
      author: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
      inLanguage: "ja",
    },
  ],
};

export default function KazuePage() {
  return (
    <>
      <KazueTeaser />
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </>
  );
}
