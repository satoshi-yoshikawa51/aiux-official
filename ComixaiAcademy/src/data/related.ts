/* ============================================================
   レッスンごとの「COMIXAIでもっと知る」リンク台帳。

   ▍なぜ要るのか
   アプリとサイト（comixai.dev）は同じ主題を別の形で持っている
   （用語集150語・マンガ3シリーズ・プロンプト集・体験ゲーム）のに、
   アプリからの出口が本文中の用語リンクしか無かった。学び終わった
   直後がいちばん「もう少し知りたい」ので、修了画面と持ち帰りに置く。

   ▍リンクは1レッスン2〜3本まで
   並べるほど押されなくなる。そのレッスンの主題に直結するものだけ。

   ▍URLは全部ここに集める
   サイト側の構成が変わったら直すのはこのファイル1枚。
   スラッグはサイトの実データ（glossary/data.ts等）で実在を確認済み。
   ============================================================ */

export interface RelatedLink {
  /** 何の種類のリンクか。行の頭の札になる */
  tag: '用語集' | 'マンガ' | 'あそぶ' | 'レシピ' | '記事';
  label: string;
  url: string;
}

const SITE = 'https://comixai.dev';

export const RELATED: Record<string, RelatedLink[]> = {
  /* ———— AIのきほん ———— */
  'basics-1': [
    { tag: 'あそぶ', label: 'トークナイザー体験（もっと割ってみる）', url: `${SITE}/tokenizer` },
    { tag: '用語集', label: 'トークン', url: `${SITE}/glossary/token` },
    { tag: 'マンガ', label: 'マンガでわかる！AI活用（全7話）', url: `${SITE}/manga/wakaru` },
  ],
  'basics-2': [
    { tag: 'レシピ', label: 'プロンプト集（コピペで使える24本）', url: `${SITE}/prompts` },
    { tag: '用語集', label: 'プロンプト', url: `${SITE}/glossary/prompt` },
  ],
  'basics-3': [
    { tag: 'あそぶ', label: 'AIのウソを見抜けるか？（判定ゲーム）', url: `${SITE}/uso` },
    { tag: '用語集', label: 'ハルシネーション', url: `${SITE}/glossary/hallucination` },
  ],
  'basics-4': [
    { tag: '用語集', label: 'コンテキストウィンドウ', url: `${SITE}/glossary/context-window` },
    { tag: 'マンガ', label: 'マンガでわかる！AI活用（全7話）', url: `${SITE}/manga/wakaru` },
  ],

  /* ———— 最初の一週間 ———— */
  'work-1': [
    { tag: '記事', label: '職種別ガイド（あなたの仕事での使い方）', url: `${SITE}/guide` },
    { tag: 'マンガ', label: 'マンガで実践！AI活用（全6話）', url: `${SITE}/manga/jissen` },
  ],
  'work-2': [
    { tag: 'レシピ', label: 'プロンプト集（型をそのまま持っていく）', url: `${SITE}/prompts` },
    { tag: 'マンガ', label: 'マンガで実践！AI活用（全6話）', url: `${SITE}/manga/jissen` },
  ],
  'work-3': [
    { tag: 'マンガ', label: 'AI時代の「流行」と「本質」（エッセイ）', url: `${SITE}/manga/honshitsu` },
    { tag: '記事', label: 'AIニュースカレンダー（毎朝更新）', url: `${SITE}/calendar` },
  ],

  /* ———— プロンプト道場 ———— */
  'prompt-1': [
    { tag: 'レシピ', label: 'プロンプト集（悪い例と直した例つき）', url: `${SITE}/prompts` },
    { tag: '用語集', label: 'プロンプト', url: `${SITE}/glossary/prompt` },
  ],
  'prompt-2': [
    { tag: 'レシピ', label: 'プロンプト集（追い込みの実例）', url: `${SITE}/prompts` },
    { tag: 'あそぶ', label: 'AI用語クイズ（腕だめし）', url: `${SITE}/quiz` },
  ],
  'prompt-3': [
    { tag: 'レシピ', label: 'プロンプト集（役割の与え方の実例）', url: `${SITE}/prompts` },
    { tag: 'マンガ', label: 'マンガで実践！AI活用（全6話）', url: `${SITE}/manga/jissen` },
  ],
  'prompt-4': [
    { tag: 'レシピ', label: 'プロンプト集（今日の3枚の親戚たち）', url: `${SITE}/prompts` },
    { tag: '記事', label: '職種別ガイド（仕事別のひな形）', url: `${SITE}/guide` },
  ],

  /* ———— 事故らないAI ———— */
  'risk-1': [
    { tag: '用語集', label: 'シャドーAI（会社に隠れて使う話）', url: `${SITE}/glossary/shadow-ai` },
    { tag: '用語集', label: 'AI用語集（ぜんぶで150語）', url: `${SITE}/glossary` },
  ],
  'risk-2': [
    { tag: '用語集', label: 'AIと著作権', url: `${SITE}/glossary/ai-copyright` },
    { tag: 'マンガ', label: 'AI時代の「流行」と「本質」（エッセイ）', url: `${SITE}/manga/honshitsu` },
  ],
  'risk-3': [
    { tag: 'あそぶ', label: 'プロンプトインジェクション体験ゲーム', url: `${SITE}/keibi` },
    { tag: '用語集', label: 'プロンプトインジェクション', url: `${SITE}/glossary/prompt-injection` },
  ],

  /* ———— これからのAI ———— */
  'next-1': [
    { tag: '用語集', label: 'AIエージェント', url: `${SITE}/glossary/ai-agent` },
    { tag: 'あそぶ', label: '速い脳・遅い脳（推論モデル体験）', url: `${SITE}/nou` },
  ],
  'next-2': [
    { tag: '用語集', label: 'RAG', url: `${SITE}/glossary/rag` },
    { tag: 'あそぶ', label: 'AI司書（サイトでRAG検索を体験）', url: `${SITE}/search` },
  ],
  'next-3': [
    { tag: '用語集', label: 'ディープフェイク', url: `${SITE}/glossary/deepfake` },
    { tag: '記事', label: 'AIニュースカレンダー（毎朝更新）', url: `${SITE}/calendar` },
  ],
};

export function getRelated(lessonId: string): RelatedLink[] {
  return RELATED[lessonId] ?? [];
}
