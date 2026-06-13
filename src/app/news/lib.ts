// 記事・好みプロファイルの型と、パーソナライズ（学習・スコアリング）ロジック。
// 学習データはすべて localStorage（端末内）に保存され、外部には送信しない。

export type Category =
  | "top"
  | "domestic"
  | "world"
  | "business"
  | "entertainment"
  | "sports"
  | "it"
  | "science"
  | "local"
  | "search"; // キーワード検索（Google News）の結果用。タブ・興味選択には出さない

export const CATEGORIES: { id: Category; name: string }[] = [
  { id: "top", name: "主要" },
  { id: "domestic", name: "国内" },
  { id: "world", name: "国際" },
  { id: "business", name: "経済" },
  { id: "entertainment", name: "エンタメ" },
  { id: "sports", name: "スポーツ" },
  { id: "it", name: "IT" },
  { id: "science", name: "科学" },
  { id: "local", name: "地域" },
];

export const CATEGORY_NAME = {
  ...(Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name])) as Record<Category, string>),
  search: "Web",
} as Record<Category, string>;

export type Article = {
  id: string;
  title: string;
  link: string;
  category: Category;
  source: string;
  publishedAt: string | null;
  imageURL?: string | null; // RSSに画像が含まれる場合（Bing検索結果など）
};

export type Profile = {
  hasOnboarded: boolean;
  interests: Category[];
  followedKeywords: string[];
  categoryWeights: Record<string, number>;
  keywordWeights: Record<string, number>;
  readIDs: string[];
  likedIDs: string[];
  hiddenIDs: string[];
  bookmarks: Article[];
};

export function emptyProfile(): Profile {
  return {
    hasOnboarded: false,
    interests: [],
    followedKeywords: [],
    categoryWeights: {},
    keywordWeights: {},
    readIDs: [],
    likedIDs: [],
    hiddenIDs: [],
    bookmarks: [],
  };
}

const STORAGE_KEY = "prism-profile-v1";

export function loadProfile(): Profile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    return { ...emptyProfile(), ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ストレージ満杯などは無視（次回保存で再試行される）
  }
}

// ---- 日本語トークナイズ ----
// Intl.Segmenterの分かち書きで記事タイトルをキーワードに分解し、
// 「いいね」した記事から興味キーワードを学習できるようにする。

const STOP_WORDS = new Set([
  "こと", "もの", "ため", "よう", "など", "これ", "それ", "あれ",
  "さん", "氏", "について", "から", "まで", "する", "した", "して",
  "です", "ます", "ない", "れる", "られる", "という", "ニュース",
]);

let segmenter: Intl.Segmenter | null | undefined;
const tokenCache = new Map<string, string[]>();

export function tokenize(text: string): string[] {
  const cached = tokenCache.get(text);
  if (cached) return cached;

  if (segmenter === undefined) {
    try {
      segmenter = new Intl.Segmenter("ja", { granularity: "word" });
    } catch {
      segmenter = null;
    }
  }

  let tokens: string[];
  if (segmenter) {
    tokens = [];
    for (const seg of segmenter.segment(text)) {
      const t = seg.segment;
      if (seg.isWordLike && t.length >= 2 && /\p{L}/u.test(t) && !STOP_WORDS.has(t)) {
        tokens.push(t);
      }
    }
  } else {
    // 古いブラウザ向けフォールバック：記号区切りの粗い分割
    tokens = text
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
  }

  if (tokenCache.size > 1000) tokenCache.clear();
  tokenCache.set(text, tokens);
  return tokens;
}

// ---- スコアリング・学習 ----

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 記事の「好みスコア」。おすすめフィードの並び順を決める。 */
export function scoreArticle(profile: Profile, article: Article): number {
  let score = profile.categoryWeights[article.category] ?? 0;

  if (profile.interests.includes(article.category)) score += 1.5;

  for (const token of tokenize(article.title)) {
    score += clamp(profile.keywordWeights[token] ?? 0, -3, 3) * 0.5;
  }

  for (const keyword of profile.followedKeywords) {
    if (article.title.toLowerCase().includes(keyword.toLowerCase())) score += 2.5;
  }

  // 新しい記事ほど少し優遇（約24時間で減衰）
  if (article.publishedAt) {
    const hours = Math.max(0, (Date.now() - new Date(article.publishedAt).getTime()) / 3.6e6);
    score += Math.max(0, 1.5 - hours / 16);
  }

  // 既読は下げる
  if (profile.readIDs.includes(article.id)) score -= 1.5;

  return score;
}

/** いいね(+1) / 閲覧(+0.3) / 興味なし(-1) のシグナルで重みを更新した新しいプロファイルを返す */
export function learn(profile: Profile, article: Article, weight: number): Profile {
  const categoryWeights = { ...profile.categoryWeights };
  categoryWeights[article.category] = clamp(
    (categoryWeights[article.category] ?? 0) + 0.25 * weight,
    -2,
    2
  );

  const keywordWeights = { ...profile.keywordWeights };
  for (const token of tokenize(article.title)) {
    keywordWeights[token] = clamp((keywordWeights[token] ?? 0) + 0.8 * weight, -5, 5);
  }

  // 肥大化防止：影響の小さいキーワードから間引く
  const keys = Object.keys(keywordWeights);
  if (keys.length > 2000) {
    keys
      .sort((a, b) => Math.abs(keywordWeights[a]) - Math.abs(keywordWeights[b]))
      .slice(0, keys.length - 2000)
      .forEach((k) => delete keywordWeights[k]);
  }

  return { ...profile, categoryWeights, keywordWeights };
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}
