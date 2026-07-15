/* ============================================================
   /faq の共通部品。QA型とリンクヘルパーを sections-*.tsx から使う。
   ============================================================ */
import React from "react";

export interface QA {
  q: string;
  a: string; // 構造化データ・AI司書コーパス用のプレーン文
  body: React.ReactNode; // 表示用（リンク入り）
}

export interface FaqSection {
  /** ページ内アンカー用ID（目次から飛ぶ） */
  id: string;
  title: string;
  emoji: string;
  items: QA[];
}

export const L = (href: string, label: string) => (
  <a key={href + label} href={href} style={{ color: "var(--red-600)", fontWeight: 700 }}>
    {label}
  </a>
);
