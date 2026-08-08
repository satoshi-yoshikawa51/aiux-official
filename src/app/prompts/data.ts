/* ============================================================
   プロンプトレシピ大全（/prompts）のデータ。
   ・レシピを増やすときは recipes-*.ts のいずれかに1件追加し、
     lastUpdated を更新する（sitemap・一覧・関連レシピに自動反映）。
   ・「量産テンプレ」に見えないよう、1レシピごとに
     失敗例（badPrompt/badResult/badWhy）と現場の注意（pitfalls）を
     必ず固有の内容で書くこと。ここがこのコーナーの独自価値。
   ============================================================ */

export type RecipeCategory =
  | "メール・ビジネス文書"
  | "会議・報告"
  | "企画・マーケティング"
  | "営業・顧客対応"
  | "事務・効率化"
  | "伝える・キャリア";

export interface RecipePoint {
  /** プロンプトのどの部分が効いているか（例：「役割を与える」） */
  label: string;
  desc: string;
}

export interface RecipeArrange {
  title: string;
  desc: string;
}

export interface RecipePitfall {
  title: string;
  desc: string;
}

export interface RecipeFaq {
  q: string;
  a: string;
}

export interface Recipe {
  slug: string;
  /** 表示タイトル（h1）。「営業メール（アポ依頼）」など */
  title: string;
  /** 検索クエリを踏んだSEOタイトル（〜32字目安。末尾の｜COMIXAIは自動付与） */
  seoTitle: string;
  /** 一覧カード・OGP用の一言キャッチ */
  catch: string;
  category: RecipeCategory;
  /** Phosphorのアイコン名（例: ph-rocket-launch） */
  icon: string;
  /** meta description（80〜120字目安） */
  short: string;
  keywords: string[];
  /** 導入（このタスクをAIに任せるとどうなるか。2段落目安） */
  intro: string[];
  /** ダメな指示の例 */
  badPrompt: string;
  /** それで実際に返ってくるもの（事故の再現） */
  badResult: string;
  /** なぜ事故るのか */
  badWhy: string[];
  /** コピペ用プロンプト。埋める場所は【】で示す */
  goodPrompt: string;
  /** プロンプトの構成要素の解説（なぜ効くか） */
  points: RecipePoint[];
  /** アレンジレシピ（一言足すとこう変わる） */
  arrange: RecipeArrange[];
  /** 現場のつまずき・注意（機密・確認など） */
  pitfalls: RecipePitfall[];
  faq: RecipeFaq[];
  /** 関連するAI用語集のslug */
  relatedGlossary: string[];
  /** 関連する体験ゲーム */
  game?: { href: string; title: string; desc: string };
  /** 関連レシピのslug */
  relatedRecipes: string[];
  lastUpdated: string;
}

import { RECIPES_BASICS } from "./recipes-basics";
import { RECIPES_BIZ } from "./recipes-biz";
import { RECIPES_WORK } from "./recipes-work";

export const RECIPES: Recipe[] = [
  ...RECIPES_BASICS,
  ...RECIPES_BIZ,
  ...RECIPES_WORK,
];

export const PROMPTS_UPDATED = "2026-08-01";

/** カテゴリの表示順と説明（一覧ページで使う） */
export const RECIPE_CATEGORIES: {
  category: RecipeCategory;
  /** Phosphorのアイコン名（例: ph-rocket-launch） */
  icon: string;
  desc: string;
}[] = [
  {
    category: "メール・ビジネス文書",
    icon: "ph-envelope-simple",
    desc: "毎日書くものこそ、AIの出番。書き出しで固まる時間をゼロにする。",
  },
  {
    category: "会議・報告",
    icon: "ph-note-pencil",
    desc: "議事録・要約・週報。「まとめる仕事」はAIがいちばん得意な領域。",
  },
  {
    category: "企画・マーケティング",
    icon: "ph-lightbulb",
    desc: "たたき台とコピー案は数が命。AIに量を出させて、人間が目利きする。",
  },
  {
    category: "営業・顧客対応",
    icon: "ph-handshake",
    desc: "提案・想定問答・お客様対応。相手がいる文章は、準備の質で決まる。",
  },
  {
    category: "事務・効率化",
    icon: "ph-folders",
    desc: "Excel関数・データ整形・マニュアル化。手作業の反復をAIに引き取らせる。",
  },
  {
    category: "伝える・キャリア",
    icon: "ph-microphone",
    desc: "職務経歴書・自己PR・スピーチ。自分のことを言葉にする作業を手伝わせる。",
  },
];

/* トップページのチップに出す代表レシピ（検索需要と間口の広さで選定） */
export const FEATURED_RECIPE_SLUGS = [
  "sales-email",
  "meeting-minutes",
  "summary",
  "plan-draft",
  "catch-copy",
  "excel-formula",
  "resume",
  "speech",
];

export function getRecipe(slug: string): Recipe | undefined {
  return RECIPES.find((r) => r.slug === slug);
}

export const FEATURED_RECIPES: Recipe[] = FEATURED_RECIPE_SLUGS.map(getRecipe).filter(
  (r): r is Recipe => Boolean(r)
);

export function recipesByCategory(category: RecipeCategory): Recipe[] {
  return RECIPES.filter((r) => r.category === category);
}
