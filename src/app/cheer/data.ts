/* ============================================================
   きょうの きみに — 気持ち・理由の選択肢データ。
   名言ストックは quotes.ts、ペット定義は pets/ 配下にある。
   ============================================================ */

export interface Choice {
  id: string;
  label: string;
}

export const FEELS: Choice[] = [
  { id: "sad", label: "悲しい" },
  { id: "tired", label: "疲れた" },
  { id: "worry", label: "不安" },
  { id: "angry", label: "イライラ" },
  { id: "happy", label: "嬉しい" },
];

export const WHYS: Choice[] = [
  { id: "people", label: "人づきあい" },
  { id: "work", label: "仕事・学校" },
  { id: "self", label: "自分のこと" },
  { id: "body", label: "体・疲れ" },
  { id: "none", label: "なんとなく" },
];
