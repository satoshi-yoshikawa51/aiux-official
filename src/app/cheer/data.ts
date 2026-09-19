/* ============================================================
   きょうの きみに — 気持ち・理由の選択肢データ。
   名言ストックは quotes.ts、ペット定義は pets/ 配下にある。
   ============================================================ */

export interface Choice {
  id: string;
  label: string;
}

export const FEELS: Choice[] = [
  { id: "sad", label: "かなしい" },
  { id: "tired", label: "つかれた" },
  { id: "worry", label: "ふあん" },
  { id: "angry", label: "イライラ" },
  { id: "happy", label: "うれしい" },
];

export const WHYS: Choice[] = [
  { id: "people", label: "ひとづきあい" },
  { id: "work", label: "しごと・がっこう" },
  { id: "self", label: "じぶんのこと" },
  { id: "body", label: "からだ・つかれ" },
  { id: "none", label: "なんとなく" },
];
