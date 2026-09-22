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

/* 「何があった？」の選択肢。ここはAIが名言を選ぶときの手がかりに
   なるので、関係性はまとめずに分けておく（家族と恋人では響く言葉が違う） */
export const WHYS: Choice[] = [
  { id: "family", label: "家族のこと" },
  { id: "partner", label: "恋人のこと" },
  { id: "friend", label: "友だちのこと" },
  { id: "work", label: "仕事・学校" },
  { id: "self", label: "自分のこと" },
  { id: "body", label: "体・疲れ" },
  { id: "money", label: "お金のこと" },
  { id: "future", label: "将来のこと" },
  { id: "none", label: "なんとなく" },
];
