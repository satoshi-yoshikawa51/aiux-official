/* ============================================================
   トップの「いま話題」チップを、評価軸で自動的に選ぶしくみ。

   もともとは data.ts の HOT_SLUGS を手で並べ替える運用だったが、
   用語の追加ペースに追いつかず、ニュース波が来ている語がチップに
   載らない状態が続いたため、ビルド時の自動選出に切り替えた。
   （人の判断を捨てたわけではなく、HOT_PINNED / HOT_EXCLUDED で
     上書きできるようにしてある。最終的な拒否権は人間側に残す）

   評価軸は4つ。合計点の上位6語を出す。
     ① ニュース一致（最大42点）… 今朝の見出しに用語名・英語名・
        extraKeywords が出ているか。複数の媒体で出ていれば加点
     ② 鮮度（最大30点）… lastUpdated からの経過日数。新規追加も
        「追記」も lastUpdated を更新するので、手を入れた語が浮く
     ③ 厚み（最大15点）… 図解相当のsection・FAQが揃っているか。
        中身の薄い語をトップに出さないための歯止め
     ④ 日替わりの揺らぎ（±3点）… 同点付近の語が毎日入れ替わる
        ようにする。日付と slug から決まる値なので、同じ日に
        何度ビルドしても結果は変わらない

   入力は news-headlines.json（毎朝6:40 JSTにGitHub Actionsが更新）
   なので、ニュースの更新コミットが入るたびに自動で並びが変わる。
   ============================================================ */

import { TERMS, HOT_SLUGS, type GlossaryTerm } from "./data";
import newsJson from "../calendar/news-headlines.json";

/** 必ずチップに入れたい語（最大2つまで尊重する）。ふだんは空でよい */
export const HOT_PINNED: string[] = [];

/** 評価が高くても出したくない語（事情があって触れたくないときに使う） */
export const HOT_EXCLUDED: string[] = [];

/** チップの数 */
const HOT_COUNT = 6;

/** 同じカテゴリで埋まらないようにする上限 */
const MAX_PER_CATEGORY = 3;

/** 見出し照合に使わない語。短すぎる・一般的すぎて誤爆するもの */
const STOP_KEYS = new Set([
  "ai", "AI", "API", "api", "DX", "dx", "IoT", "iot", "GPU", "gpu",
  "LLM", "llm", "SI", "si", "SaaS", "saas", "MCP", "mcp",
  "AIとは", "生成AI", "AIエージェント",
]);

/* ほぼ毎日どこかの見出しに出る企業名・製品名。見出しに出たこと自体が
   情報にならないので、ニュース点を4割に減衰させる。こちらの用語集で
   実際に書いた・追記したときは②の鮮度が立つので、そのときは浮いてくる */
const ALWAYS_IN_NEWS = new Set([
  "openai", "anthropic", "chatgpt", "claude", "gemini", "gpt", "nvidia",
  "generative-ai", "llm", "ai-agent", "claude-code",
]);

type NewsItem = { title?: string; titleJa?: string; source?: string };

/** 用語ページのURLに出る表記ゆれを吸収して、照合用の鍵を作る */
function matchKeys(t: GlossaryTerm): string[] {
  const keys: string[] = [];
  const push = (s?: string) => {
    if (!s) return;
    const v = s.trim();
    if (v.length < 3) return;
    if (STOP_KEYS.has(v)) return;
    keys.push(v);
  };
  /* 「電子透かし（AIコンテンツの印）」→「電子透かし」も鍵にする */
  push(t.term);
  push(t.term.replace(/[（(].*$/, ""));
  push(t.en);
  for (const k of t.extraKeywords ?? []) {
    /* 「SI とは」のような検索クエリ形は、助詞を落として鍵にする */
    push(k.replace(/\s*(とは|意味|使い方)\s*$/, ""));
  }
  return [...new Set(keys)];
}

/** ①ニュース一致（最大42点） */
function newsScore(t: GlossaryTerm, items: NewsItem[]): number {
  const keys = matchKeys(t).map((k) => k.toLowerCase());
  if (keys.length === 0) return 0;
  const hitSources = new Set<string>();
  let hits = 0;
  for (const it of items) {
    const hay = `${it.title ?? ""} ${it.titleJa ?? ""}`.toLowerCase();
    if (keys.some((k) => hay.includes(k))) {
      hits += 1;
      if (it.source) hitSources.add(it.source);
    }
  }
  if (hits === 0) return 0;
  const raw = Math.min(hits, 3) * 12 + (hitSources.size >= 2 ? 6 : 0);
  return ALWAYS_IN_NEWS.has(t.slug) ? Math.round(raw * 0.4) : raw;
}

/** ②鮮度（最大30点）。lastUpdated が今日なら30点、30日前で0点 */
function freshnessScore(t: GlossaryTerm, today: Date): number {
  const d = new Date(`${t.lastUpdated}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return 0;
  const days = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (days < 0) return 30;
  return Math.max(0, 30 - days);
}

/** ③厚み（最大15点）。薄い語をトップに出さないための歯止め */
function depthScore(t: GlossaryTerm): number {
  let s = 0;
  if ((t.sections?.length ?? 0) >= 1) s += 5;
  if ((t.faq?.length ?? 0) >= 2) s += 5;
  if ((t.sections?.length ?? 0) >= 3 || (t.links?.length ?? 0) >= 3) s += 5;
  return s;
}

/** ④日替わりの揺らぎ（±3点）。同じ日なら何度計算しても同じ値になる */
function jitter(slug: string, dayKey: string): number {
  let h = 0;
  for (const ch of `${slug}:${dayKey}`) h = (h * 31 + ch.charCodeAt(0)) % 100_000;
  return (h % 7) - 3;
}

export interface HotScore {
  term: GlossaryTerm;
  total: number;
  news: number;
  freshness: number;
  depth: number;
  jitter: number;
}

/** 全用語を採点する（デバッグ・検証用に内訳ごと返す） */
export function scoreTerms(
  terms: GlossaryTerm[] = TERMS,
  items: NewsItem[] = (newsJson.items ?? []) as NewsItem[],
  today: Date = new Date(),
): HotScore[] {
  const dayKey = today.toISOString().slice(0, 10);
  return terms
    .filter((t) => !HOT_EXCLUDED.includes(t.slug))
    .map((t) => {
      const news = newsScore(t, items);
      const freshness = freshnessScore(t, today);
      const depth = depthScore(t);
      const j = jitter(t.slug, dayKey);
      return { term: t, news, freshness, depth, jitter: j, total: news + freshness + depth + j };
    })
    .sort((a, b) => b.total - a.total || a.term.slug.localeCompare(b.term.slug));
}

/** 上位から、カテゴリの偏りを避けつつ HOT_COUNT 語を選ぶ */
export function pickHotTerms(
  terms: GlossaryTerm[] = TERMS,
  items: NewsItem[] = (newsJson.items ?? []) as NewsItem[],
  today: Date = new Date(),
): GlossaryTerm[] {
  const picked: GlossaryTerm[] = [];
  const perCategory = new Map<string, number>();

  const take = (t: GlossaryTerm, ignoreCategoryCap = false) => {
    if (picked.length >= HOT_COUNT) return;
    if (picked.some((p) => p.slug === t.slug)) return;
    const used = perCategory.get(t.category) ?? 0;
    if (!ignoreCategoryCap && used >= MAX_PER_CATEGORY) return;
    picked.push(t);
    perCategory.set(t.category, used + 1);
  };

  /* 固定したい語を先に（最大2つまで。全部埋めてしまうと自動化の意味がない） */
  for (const slug of HOT_PINNED.slice(0, 2)) {
    const t = TERMS.find((x) => x.slug === slug);
    if (t && !HOT_EXCLUDED.includes(slug)) take(t, true);
  }

  for (const s of scoreTerms(terms, items, today)) take(s.term);

  /* ここまでで埋まらなければ、従来の手編集リスト→代表用語の順に補う */
  if (picked.length < HOT_COUNT) {
    for (const slug of HOT_SLUGS) {
      const t = TERMS.find((x) => x.slug === slug);
      if (t && !HOT_EXCLUDED.includes(slug)) take(t, true);
    }
  }
  return picked.slice(0, HOT_COUNT);
}

/** トップページが使う「いま話題」の6語 */
export const HOT_TERMS_AUTO: GlossaryTerm[] = pickHotTerms();
