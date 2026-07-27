/* ============================================================
   吉川聡史 オフィシャルサイト — content & links
   noteから取得した実データ。
   ・新着記事を増やすときは ARTICLES 配列の先頭に1件足すだけ。
   ・人気記事は ARTICLES_POPULAR を likes 降順で編集。
   ============================================================ */

export type Tone = "yellow" | "red" | "ink" | "blue" | "paper";

export interface Article {
  badge: string;
  tone: Tone;
  title: string;
  excerpt: string;
  tags: string[];
  date?: string;
  likes: number;
  thumb?: string;
  url: string;
}

export interface Magazine {
  id: string;
  title: string;
  count: number;
  label: string;
  desc: string;
  url: string;
  cover: string;
  tone: Tone;
}

export interface Role {
  jp: string;
  en: string;
  note?: string;
  icon: string;
}

export interface Social {
  name: string;
  handle: string;
  icon: string;
  url: string;
  set: boolean;
}

export const NOTE = "https://note.com/aiux_unite";
export const NOTE_ALL = "https://note.com/aiux_unite/all";
export const YOUTUBE = "https://www.youtube.com/@comixai-dev";

/* —— note マガジン（実データ・カバー画像つき） —— */
export const MAGAZINES: Magazine[] = [
  {
    id: "wakaru",
    title: "マンガでわかる！AI活用",
    count: 7,
    label: "全7話・入門編",
    desc: "AIクリエイター兼漫画家の吉川聡史が描く、AI活用マンガ。実際にWeb制作の現場で使っているAI活用術を、わかりやすく紹介します！",
    url: "https://note.com/aiux_unite/m/m92e0de4e5627",
    cover:
      "https://assets.st-note.com/production/uploads/images/153723212/magazine_cover_landscape_74e4cd3b836dcf9092fc5631a2048ad8.png?width=900",
    tone: "yellow",
  },
  {
    id: "jissen",
    title: "マンガで実践！AI活用",
    count: 6,
    label: "全6話・実践編",
    desc: "「マンガでわかる！AI活用」の続編！Web制作の現場で実践して使えるAI活用テクニックを紹介。実際に「売れる」WebサイトをAIツールを駆使して作る実践録！",
    url: "https://note.com/aiux_unite/m/m0b7bcbd79d18",
    cover:
      "https://assets.st-note.com/production/uploads/images/187520549/magazine_cover_landscape_6bdb11f606659c04533285cbee28805d.png?width=900",
    tone: "red",
  },
  {
    id: "honshitsu",
    title: "AI時代の「流行」と「本質」",
    count: 2,
    label: "連載中・エッセイ",
    desc: "仕事を通じて感じているAI活用の「本質」と、最新ツールの使い方など「流行」の両方をお届け。吉川流のAI時代に生き延びる術を、IT業界目線でお伝えします。",
    url: "https://note.com/aiux_unite/m/m19a44a319753",
    cover:
      "https://assets.st-note.com/production/uploads/images/241594001/magazine_cover_landscape_a3a3e13d093dbc63f86cda7838bec694.png?width=900",
    tone: "ink",
  },
];

/* —— 記事カセット（noteから自動取得） ——
   一覧は scripts/fetch-note-articles.mjs が毎週更新する
   note-articles.json から自動生成される（手で足す必要はない）。
   badge / tone / tags / excerpt を整えたい記事は、
   note-article-meta.json に記事URLごとのエントリを登録する
   （未登録の記事はデフォルトの見た目で表示される）。 */
import noteArticlesJson from "./note-articles.json";
import articleMetaJson from "./note-article-meta.json";

interface NoteArticle {
  url: string;
  title: string;
  date?: string;
  likes?: number;
  thumb?: string;
  excerpt?: string;
}

interface CuratedMeta {
  badge?: string;
  tone?: Tone;
  excerpt?: string;
  tags?: string[];
}

const NOTE_ARTICLES = (noteArticlesJson as { articles: NoteArticle[] }).articles;
const CURATED = articleMetaJson as Record<string, CuratedMeta | string>;

const TONE_CYCLE: Tone[] = ["yellow", "blue", "red", "ink", "paper"];

export const ARTICLES: Article[] = NOTE_ARTICLES.map((n, i) => {
  const c = CURATED[n.url];
  const meta: CuratedMeta = typeof c === "object" && c !== null ? c : {};
  return {
    badge: meta.badge ?? "note",
    tone: meta.tone ?? TONE_CYCLE[i % TONE_CYCLE.length],
    title: n.title,
    excerpt: meta.excerpt ?? n.excerpt ?? "",
    tags: meta.tags ?? [],
    ...(n.date ? { date: n.date } : {}),
    likes: n.likes ?? 0,
    thumb: n.thumb,
    url: n.url,
  };
});

/* 新着＝公開日の降順（トップの表示は9件） */
export const ARTICLES_NEW: Article[] = [...ARTICLES]
  .filter((a) => a.date)
  .sort((a, b) => ((a.date || "") < (b.date || "") ? 1 : -1))
  .slice(0, 9);

/* 人気＝スキ数の降順（トップの表示は12件） */
export const ARTICLES_POPULAR: Article[] = [...ARTICLES]
  .sort((a, b) => b.likes - a.likes)
  .slice(0, 12);

/* —— 5つの顔 —— */
export const ROLES: Role[] = [
  { jp: "AIクリエイター", en: "AI Creator", icon: "ph-sparkle" },
  { jp: "漫画家", en: "Manga Artist", note: "週刊少年チャンピオン連載", icon: "ph-pen-nib" },
  { jp: "UXディレクター", en: "UX Director", icon: "ph-compass" },
  { jp: "映像ディレクター", en: "Film Director", icon: "ph-film-slate" },
  { jp: "ゲームプランナー", en: "Game Planner", icon: "ph-game-controller" },
];

/* —— 経歴・実績 —— */
export const FACTS: { k: string; v: string }[] = [
  { k: "現職", v: "株式会社ニジボックス（NIJIBOX）室長" },
  { k: "連載", v: "週刊少年チャンピオンにて漫画連載" },
  { k: "発信", v: "note「AI＆UX」でAI活用マンガを連載" },
  { k: "領域", v: "生成AI × Web制作・UXデザイン" },
];

/* —— SNS —— */
export const SOCIALS: Social[] = [
  { name: "X", handle: "@yoshikawa5116", icon: "ph-x-logo", url: "https://x.com/yoshikawa5116", set: true },
  {
    name: "Facebook",
    handle: "Satoshi Yoshikawa",
    icon: "ph-facebook-logo",
    url: "https://www.facebook.com/profile.php?id=100008552592871",
    set: true,
  },
  {
    name: "LinkedIn",
    handle: "聡史 吉川",
    icon: "ph-linkedin-logo",
    url: "https://jp.linkedin.com/in/%E8%81%A1%E5%8F%B2-%E5%90%89%E5%B7%9D-7b121a255",
    set: true,
  },
  { name: "Threads", handle: "@ai_baystars", icon: "ph-threads-logo", url: "https://www.threads.com/@ai_baystars", set: true },
  { name: "mixi2", handle: "@yoshikawa5116", icon: "ph-chats-circle", url: "https://mixi.social/@yoshikawa5116", set: true },
  { name: "YOUTRUST", handle: "yoshikawa51", icon: "ph-handshake", url: "https://youtrust.jp/users/yoshikawa51", set: true },
];

/* お問い合わせ（Formspree → comixai@outlook.jp） */
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mgobakjb";
export const CONTACT_EMAIL = "comixai@outlook.jp";

