/* ============================================================
   連載シリーズ（noteマガジン）ハブページのデータ。
   /manga/[slug] のコンテンツはすべてここから生成される。

   ・収録エピソードは episodes.json から読み込む。
     episodes.json は scripts/fetch-manga-episodes.mjs がnoteから
     自動生成する（手動追記も可）。更新日はsitemapに反映される。
   ・slug は data.ts の MAGAZINES.id と一致させる。
   ============================================================ */
import type { Tone } from "../data";
import EPISODES_JSON from "./episodes.json";

export interface MangaEpisode {
  /** 話数（第n話）。エッセイなど話数のないシリーズでは省略 */
  no?: number;
  title: string;
  desc: string;
  url: string;
  date?: string;
  thumb?: string;
  likes?: number;
}

export interface SeriesPoint {
  icon: string;
  title: string;
  text: string;
}

export interface MangaSeries {
  slug: string;
  title: string;
  /** 「全7話・入門編」のような短いラベル */
  label: string;
  noteUrl: string;
  cover: string;
  tone: Tone;
  /** episodes.json の updatedAt（sitemap の lastModified 用） */
  lastUpdated: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** シリーズの独自紹介文（noteの説明文の複製ではなく、このサイトのオリジナル） */
  intro: string[];
  points: SeriesPoint[];
  recommendedFor: string[];
  /** 収録話数（未公開・未確認分も含めた総数）。連載中なら undefined */
  totalEpisodes?: number;
  episodes: MangaEpisode[];
  /** あわせて読みたい note 記事（data.ts の記事URLで指定） */
  relatedUrls: string[];
}

type SeriesBase = Omit<MangaSeries, "episodes" | "lastUpdated">;

const SERIES_BASE: SeriesBase[] = [
  {
    slug: "wakaru",
    title: "マンガでわかる！AI活用",
    label: "全7話・入門編",
    noteUrl: "https://note.com/aiux_unite/m/m92e0de4e5627",
    cover:
      "https://assets.st-note.com/production/uploads/images/153723212/magazine_cover_landscape_74e4cd3b836dcf9092fc5631a2048ad8.png?width=900",
    tone: "yellow",
    metaTitle: "マンガでわかる！AI活用（全7話）｜生成AI入門をマンガで学ぶ",
    metaDescription:
      "「生成AIとは？」から、RAGとファインチューニング、プロンプトのコツ、AIアプリ制作まで。Web制作の現場で本当に使っているAI活用術を、漫画家・AIクリエイター吉川聡史がマンガでわかりやすく解説する入門シリーズ（全7話）。",
    keywords: [
      "マンガでわかる AI活用",
      "生成AI 入門",
      "生成AIとは",
      "AI活用 マンガ",
      "RAG ファインチューニング 違い",
      "プロンプト コツ",
      "AIアプリ制作",
      "吉川聡史",
    ],
    intro: [
      "「生成AIって、結局なに？」——そんな疑問に、解説書ではなくマンガで答える入門シリーズです。週刊少年チャンピオンで連載経験のある漫画家・吉川聡史が、Web制作の現場で実際に使っているAI活用術を、全7話のマンガで描きます。",
      "むずかしい専門用語もキャラクターの掛け合いで自然に頭に入るので、「AIはこわい・むずかしそう」と感じている人こそ楽しめる内容。生成AIの基本から、RAGとファインチューニング、プロンプトの書き方、AIアプリ制作の流れまで、このシリーズだけでAI活用の全体像がつかめます。",
    ],
    points: [
      {
        icon: "ph-sparkle",
        title: "生成AIの基礎がわかる",
        text: "「生成AIとは何か」「何ができるのか」を、マンガのストーリーでゼロから理解できる。",
      },
      {
        icon: "ph-brain",
        title: "RAGとファインチューニング",
        text: "混同しがちな2つの手法の違いと使いどころを、たとえ話でやさしく整理。",
      },
      {
        icon: "ph-chat-circle-text",
        title: "プロンプトのコツ",
        text: "思いどおりの答えを引き出す「伝え方」を、現場で効くテクニックとして習得。",
      },
      {
        icon: "ph-app-window",
        title: "AIアプリ制作の流れ",
        text: "アイデアからAIアプリができるまでの工程を、わずか7ページのマンガで俯瞰。",
      },
    ],
    recommendedFor: [
      "これから生成AIを学びはじめる人",
      "文章だけの解説書で挫折したことがある人",
      "チームにAI活用を広めたいWeb制作・企画職の人",
    ],
    totalEpisodes: 7,
    relatedUrls: [
      "https://note.com/aiux_unite/n/n24dc19c0ff2d",
      "https://note.com/aiux_unite/n/n3d980b7ca111",
      "https://note.com/aiux_unite/n/n169ba6bd6c1e",
    ],
  },
  {
    slug: "jissen",
    title: "マンガで実践！AI活用",
    label: "全6話・実践編",
    noteUrl: "https://note.com/aiux_unite/m/m0b7bcbd79d18",
    cover:
      "https://assets.st-note.com/production/uploads/images/187520549/magazine_cover_landscape_6bdb11f606659c04533285cbee28805d.png?width=900",
    tone: "red",
    metaTitle: "マンガで実践！AI活用（全6話）｜Web制作現場のAIテクニック",
    metaDescription:
      "「マンガでわかる！AI活用」の続編となる実践編。実際に「売れる」WebサイトをAIツールを駆使して作る過程を全6話のマンガで公開。Web制作の現場でそのまま使えるAI活用テクニックを、AIクリエイター・漫画家の吉川聡史が実践形式で解説します。",
    keywords: [
      "AI活用 実践",
      "Web制作 AI",
      "AI Webサイト制作",
      "AIツール 使い方",
      "AI活用 マンガ",
      "生成AI 業務活用",
      "吉川聡史",
    ],
    intro: [
      "「マンガでわかる！AI活用」の続編となる実践編。今度は、知識ではなく手を動かす番です。実際に「売れる」WebサイトをAIツールを駆使して作り上げていく過程を、全6話のマンガで公開します。",
      "ツールの紹介にとどまらず、Web制作のワークフローにAIをどう組み込むかまで踏み込むのが本シリーズ。デザイン・ディレクション・実装に関わる人なら、明日からそのまま真似できるテクニックが見つかります。",
    ],
    points: [
      {
        icon: "ph-storefront",
        title: "「売れる」サイトをAIで作る",
        text: "実際のWebサイトをAIツールで作り上げる過程を、企画から公開まで実況形式で。",
      },
      {
        icon: "ph-flow-arrow",
        title: "ワークフローへの組み込み方",
        text: "単発のツール紹介ではなく、制作フローのどこでAIを使うと効くのかがわかる。",
      },
      {
        icon: "ph-rocket-launch",
        title: "明日から使えるテクニック",
        text: "Web制作・デザインの現場でそのまま真似できる、実践的なAI活用術を厳選。",
      },
    ],
    recommendedFor: [
      "入門編を読み終えて、次の一歩を探している人",
      "AIをWeb制作の実務に組み込みたい人",
      "ツールは触ったけれど、業務の成果につながっていない人",
    ],
    totalEpisodes: 6,
    relatedUrls: [
      "https://note.com/aiux_unite/n/n480de3323d7d",
      "https://note.com/aiux_unite/n/n09103ac67356",
      "https://note.com/aiux_unite/n/naac3d48a3258",
    ],
  },
  {
    slug: "honshitsu",
    title: "AI時代の「流行」と「本質」",
    label: "連載中・エッセイ",
    noteUrl: "https://note.com/aiux_unite/m/m19a44a319753",
    cover:
      "https://assets.st-note.com/production/uploads/images/241594001/magazine_cover_landscape_a3a3e13d093dbc63f86cda7838bec694.png?width=900",
    tone: "ink",
    metaTitle: "AI時代の「流行」と「本質」｜IT業界目線のAI考察エッセイ",
    metaDescription:
      "新しいAIツールの使い方という「流行」と、仕事を通じて見えてきたAI活用の「本質」。その両方を届ける連載エッセイ。AIクリエイター・UXディレクターの吉川聡史が、IT業界目線でAI時代を生き延びる術を綴ります。",
    keywords: [
      "AI エッセイ",
      "AI活用 本質",
      "AI時代 働き方",
      "生成AI 考察",
      "AIツール トレンド",
      "吉川聡史",
    ],
    intro: [
      "毎週のように新しいAIツールが登場する時代。「流行」を追いかけるだけでも、「本質」を語るだけでも、現場では戦えません。本シリーズは、その両方をひとつの連載で届けるエッセイです。",
      "株式会社ニジボックスの室長としてWeb制作の現場に立つ吉川聡史が、仕事を通じて感じているAI活用の本質と、最新ツールの使いどころを、IT業界目線で率直に綴ります。",
    ],
    points: [
      {
        icon: "ph-compass",
        title: "流行に振り回されない",
        text: "次々に現れる新ツールとどう付き合うか。追うべきもの・流すものの見極め方。",
      },
      {
        icon: "ph-anchor",
        title: "現場発のAI活用の本質",
        text: "Web制作の現場経験から導いた、ツールが変わっても揺らがない考え方。",
      },
      {
        icon: "ph-binoculars",
        title: "AI時代を生き延びる術",
        text: "IT業界の内側から見た、AI時代のキャリアと働き方へのヒント。",
      },
    ],
    recommendedFor: [
      "AIニュースの速さに疲れはじめている人",
      "ツール紹介より一段深い考察を読みたい人",
      "AI時代のキャリアに漠然とした不安がある人",
    ],
    relatedUrls: [
      "https://note.com/aiux_unite/n/n169ba6bd6c1e",
      "https://note.com/aiux_unite/n/ndae7f58601fc",
      "https://note.com/aiux_unite/n/nac0fe6e0679f",
    ],
  },
];

/* episodes.json（自動生成）の収録エピソードと更新日をマージする */
interface EpisodesFile {
  generatedAt: string;
  series: Record<string, { updatedAt: string; episodes: MangaEpisode[] }>;
}
const EPISODES = EPISODES_JSON as unknown as EpisodesFile;

export const MANGA_SERIES: MangaSeries[] = SERIES_BASE.map((s) => {
  const entry = EPISODES.series[s.slug];
  return {
    ...s,
    episodes: entry?.episodes ?? [],
    lastUpdated: entry?.updatedAt ?? EPISODES.generatedAt,
  };
});

export function getSeries(slug: string): MangaSeries | undefined {
  return MANGA_SERIES.find((s) => s.slug === slug);
}
