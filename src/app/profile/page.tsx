import type { Metadata } from "next";
import { Nav, Footer } from "../site-chrome";
import { Breadcrumb } from "../site-ui";
import { PROFILE_BODY } from "./body";
import { PROFILE_JSONLD } from "./jsonld";
import "./profile.css";

export const metadata: Metadata = {
  title: "吉川聡史（COMIXAI）プロフィール｜AIクリエイター・漫画家",
  description:
    "吉川聡史（よしかわさとし）のプロフィール。週刊少年チャンピオン連載の漫画家であり、株式会社ニジボックスの室長／UXディレクター。生成AI活用をマンガで伝えるAIクリエイターです。経歴・専門領域・実績を紹介します。",
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
      <div dangerouslySetInnerHTML={{ __html: PROFILE_BODY }} />
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: PROFILE_JSONLD }} />
    </div>
  );
}
