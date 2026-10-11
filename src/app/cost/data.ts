/* ============================================================
   AI API料金計算機（/cost）のモデル・価格データ。
   【重要】価格は変動が速い。ここは自動タスクには触らせず、
   人間（またはこのセッション）が出典を確認して手で更新する。
   単位はUSドル／100万トークン。
   ============================================================ */

export interface CostModel {
  id: string;
  /** 表示名 */
  name: string;
  vendor: "OpenAI" | "Anthropic" | "Google";
  /** 入力単価（$ / 100万トークン） */
  inputPerM: number;
  /** 出力単価（$ / 100万トークン） */
  outputPerM: number;
  /** ひとこと（どんな位置づけのモデルか） */
  note: string;
}

/* 価格の確認日。変更したら必ず更新する（ページに表示される） */
export const COST_UPDATED = "2026-10-11";

export const COST_MODELS: CostModel[] = [
  { id: "gpt-6-astra", name: "GPT-6 Astra", vendor: "OpenAI", inputPerM: 10, outputPerM: 50, note: "OpenAIの最上位。数学・PC操作に強い" },
  { id: "gpt-6-1-sol", name: "GPT-6.1 Sol", vendor: "OpenAI", inputPerM: 2, outputPerM: 10, note: "OpenAIの主力バランス型" },
  { id: "gpt-6-luna", name: "GPT-6 Luna", vendor: "OpenAI", inputPerM: 0.1, outputPerM: 0.5, note: "OpenAIの軽量・最安クラス" },
  { id: "claude-fable-5-1", name: "Claude Fable 5.1", vendor: "Anthropic", inputPerM: 10, outputPerM: 50, note: "Anthropicの最上位。エージェント型コーディング首位級" },
  { id: "claude-opus-5-5", name: "Claude Opus 5.5", vendor: "Anthropic", inputPerM: 4, outputPerM: 20, note: "高性能と価格のバランス" },
  { id: "claude-sonnet-5", name: "Claude Sonnet 5", vendor: "Anthropic", inputPerM: 2, outputPerM: 10, note: "Anthropicの主力バランス型" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", vendor: "Anthropic", inputPerM: 1, outputPerM: 5, note: "高速・低価格" },
  { id: "gemini-3-1-pro", name: "Gemini 3.1 Pro", vendor: "Google", inputPerM: 2, outputPerM: 12, note: "Googleの主力（20万トークン超は割増）" },
  { id: "gemini-3-8-flash", name: "Gemini 3.8 Flash", vendor: "Google", inputPerM: 0.75, outputPerM: 3.75, note: "高速・低価格（2026年内の導入価格）" },
];

/* 公式の料金ページ（ページ下部に出典として表示する） */
export const COST_SOURCES = [
  { label: "OpenAI の料金ページ", href: "https://openai.com/api/pricing/" },
  { label: "Anthropic の料金ページ", href: "https://www.anthropic.com/pricing" },
  { label: "Google AI（Gemini API）の料金ページ", href: "https://ai.google.dev/pricing" },
];
