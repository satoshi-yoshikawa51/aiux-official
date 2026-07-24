/* ============================================================
   /faq のQ&Aデータ。AI司書（/api/search）のコーパスとしても使う。
   ・質問を増やすときは sections-*.tsx の該当カテゴリに1件追加するだけ
     （FAQPage構造化データ・目次・件数表記・AI司書に自動反映される）。
   ・用語集の各用語ページにあるFAQと質問が重複しないように書くこと。
   ============================================================ */
export type { QA, FaqSection } from "./parts";

import type { FaqSection } from "./parts";
import { FAQ_SECTIONS_1 } from "./sections-1";
import { FAQ_SECTIONS_2 } from "./sections-2";
import { FAQ_SECTIONS_3 } from "./sections-3";

export const SECTIONS: FaqSection[] = [
  ...FAQ_SECTIONS_1,
  ...FAQ_SECTIONS_2,
  ...FAQ_SECTIONS_3,
];

/** 総質問数（タイトルや本文の「◯問」表記に使う） */
export const FAQ_TOTAL = SECTIONS.reduce((n, s) => n + s.items.length, 0);

export const FAQ_UPDATED = "2026-07-15";
