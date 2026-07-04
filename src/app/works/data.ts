/* ============================================================
   作品個別ページ（/works/[slug]）のデータ。
   トップの WORKS カード（data.ts の WORKS）より詳しい紹介文・
   特徴・制作ストーリー（note記事）を持つ。
   slug を増やしたら sitemap にも自動で反映される。
   ============================================================ */
import type { Tone } from "../data";

export interface WorkFeature {
  icon: string;
  title: string;
  text: string;
}

export interface WorkDetail {
  slug: string;
  category: "ゲーム" | "ニュース";
  title: string;
  /** 一覧カードやヒーローで使う短いキャッチ */
  tagline: string;
  /** 実際に遊ぶ・使うためのURL（内部/外部） */
  appUrl: string;
  /** CTAの動詞（あそぶ／ひらく） */
  cta: string;
  image: string;
  imageFit?: "cover" | "contain";
  tone: Tone;
  badge?: string;
  /** ページ内容を更新したら日付を上げる（sitemap の lastModified 用） */
  lastUpdated: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** 独自紹介文（2段落程度） */
  intro: string[];
  features: WorkFeature[];
  /** つかった技術・ツール */
  tech: string[];
  /** JSON-LD の @type */
  schemaType: "VideoGame" | "WebApplication";
  /** 制作ストーリー（note記事URL。data.ts の記事プールから解決） */
  storyUrls: string[];
}

export const WORK_DETAILS: WorkDetail[] = [
  {
    slug: "claude-code-quest",
    category: "ゲーム",
    title: "Claude Code Quest",
    tagline: "Claude Codeを、遊びながら学べるRPG。",
    appUrl: "https://claude-code-quest.vercel.app/",
    cta: "あそぶ",
    image: "/works/ccq.png",
    tone: "red",
    badge: "通常版",
    lastUpdated: "2026-07-04",
    metaTitle: "Claude Code Quest｜Claude Codeを遊びながら学べるRPG",
    metaDescription:
      "Claude Codeの使い方を、RPGの冒険を通じて学べるブラウザゲーム。Webディレクターが主人公となり、実際にコマンドを打ちながらAIコーディングの基本を体験。新規事業開発の手法で企画し、GA計測とClaudeによる分析でアップデートを重ねています。ブラウザですぐ遊べます。",
    keywords: [
      "Claude Code 学習",
      "Claude Code 入門",
      "Claude Code ゲーム",
      "AIコーディング 学び方",
      "Claude Code 使い方",
      "プログラミング学習 ゲーム",
    ],
    intro: [
      "「Claude Codeに興味はあるけど、黒い画面がこわい」——そんな人のために作った、遊びながらClaude Codeを学べるRPGです。主人公はWebディレクター。冒険のなかで実際にコマンドを打ちながら進むので、ゲームをクリアするころには、Claude Codeとの対話のしかたが自然と身についています。",
      "企画には新規事業開発の手法を使い、公開後もGoogle Analyticsの計測データをClaudeで分析して大幅アップデートを実施。「作って終わり」ではなく、データドリブンに磨き続けている作品です。インストール不要、ブラウザですぐ遊べます。",
    ],
    features: [
      {
        icon: "ph-terminal-window",
        title: "実際にコマンドを打って学ぶ",
        text: "RPGの進行にあわせてClaude Codeのコマンドを入力。手を動かすから身につく。",
      },
      {
        icon: "ph-sword",
        title: "Webディレクターが主人公",
        text: "非エンジニア目線の主人公だから、エンジニアじゃなくても感情移入して進められる。",
      },
      {
        icon: "ph-chart-line-up",
        title: "データドリブンに進化中",
        text: "GA計測 → Claudeで分析 → Claude Codeで改善のループで、遊びやすさを更新し続けている。",
      },
    ],
    tech: ["Claude Code", "Claude", "Google Analytics", "Vercel"],
    schemaType: "VideoGame",
    storyUrls: [
      "https://note.com/aiux_unite/n/n09103ac67356",
      "https://note.com/aiux_unite/n/nac0fe6e0679f",
    ],
  },
  {
    slug: "claude-code-quest-lite",
    category: "ゲーム",
    title: "Claude Code Quest ライト版",
    tagline: "コマンド入力なし。選ぶだけでClaude Codeがわかる。",
    appUrl: "https://claude-code-quest-v2.vercel.app/",
    cta: "あそぶ",
    image: "/works/ccq-lite.png",
    tone: "ink",
    badge: "ライト版",
    lastUpdated: "2026-07-04",
    metaTitle: "Claude Code Quest ライト版｜選択式でかんたんに学べるClaude Code入門ゲーム",
    metaDescription:
      "コマンドを入力せず、選択肢から選ぶだけで進められるClaude Code入門ゲーム。通常版よりさらに気軽に、Claude Codeでできること・基本の流れをつかめます。スキマ時間に、スマホからでも。ブラウザですぐ遊べます。",
    keywords: [
      "Claude Code 入門",
      "Claude Code 初心者",
      "Claude Code とは",
      "AIツール 学習 ゲーム",
      "非エンジニア AI学習",
    ],
    intro: [
      "「Claude Code Quest」の、もっと気軽なライト版。コマンド入力は一切なし、選択肢から選ぶだけで物語が進みます。まずはClaude Codeで何ができるのか、どんな流れで使うのかの全体像をつかみたい人にぴったりです。",
      "通常版で「コマンド入力はまだハードルが高い」と感じた人の入口としても、逆にライト版で興味が湧いたら通常版へステップアップする流れでも。どちらもブラウザだけで遊べます。",
    ],
    features: [
      {
        icon: "ph-cursor-click",
        title: "選択肢を選ぶだけ",
        text: "コマンド入力なしで進むから、スマホでもスキマ時間でもサクサク遊べる。",
      },
      {
        icon: "ph-steps",
        title: "通常版へのステップに",
        text: "ライト版で全体像をつかんでから通常版へ。無理のない学習ルートを用意。",
      },
      {
        icon: "ph-users",
        title: "非エンジニアにやさしい",
        text: "専門知識ゼロを前提に設計。チームへのAI布教の最初の一歩にも使える。",
      },
    ],
    tech: ["Claude Code", "Claude", "Vercel"],
    schemaType: "VideoGame",
    storyUrls: [
      "https://note.com/aiux_unite/n/nac0fe6e0679f",
      "https://note.com/aiux_unite/n/n09103ac67356",
    ],
  },
  {
    slug: "manga-3d-game",
    category: "ゲーム",
    title: "マンガから作る！3Dゲーム",
    tagline: "手描きのイラストが、そのまま3Dゲームになった。",
    appUrl: "/game",
    cta: "あそぶ",
    image: "/game/ogp.png",
    tone: "yellow",
    badge: "3D",
    lastUpdated: "2026-07-04",
    metaTitle: "マンガから作る！3Dゲーム｜手描きイラストからClaudeで作ったブラウザ3Dアクション",
    metaDescription:
      "漫画家の手描きイラストから、Claudeを使って3Dゲームを制作。そらとびマスコットを操作してコインを集める、ブラウザですぐ遊べる3Dアクションゲームです。制作の一部始終はnoteで公開中。",
    keywords: [
      "Claude 3Dゲーム",
      "AI ゲーム制作",
      "イラスト 3D化",
      "ブラウザゲーム 3D",
      "Claude Code ゲーム開発",
    ],
    intro: [
      "漫画家が描いた手描きのイラストを、Claudeの力で3Dゲームにしてしまった作品。そらとびマスコットを操作して、空を飛びながらコインを集める3Dアクションです。インストール不要、ブラウザを開けばすぐ遊べます。",
      "「絵は描けるけどプログラミングはできない」という人にこそ見てほしい実験作。手描きの絵がゲームのキャラクターとして動き出すまでの制作過程は、note記事で一部始終を公開しています。",
    ],
    features: [
      {
        icon: "ph-pen-nib",
        title: "手描きイラストが原作",
        text: "キャラクターの原点は紙に描いたイラスト。マンガ家の絵がそのまま3Dの世界へ。",
      },
      {
        icon: "ph-cube",
        title: "ブラウザで動く3Dアクション",
        text: "そらとびマスコットでコインを集める。インストール不要ですぐ遊べる。",
      },
      {
        icon: "ph-magic-wand",
        title: "制作過程を全公開",
        text: "イラストからゲーム完成までの一部始終をnoteで公開。真似すれば自分でも作れる。",
      },
    ],
    tech: ["Claude", "Claude Code", "3D"],
    schemaType: "VideoGame",
    storyUrls: ["https://note.com/aiux_unite/n/ndd10e1acf1b1"],
  },
  {
    slug: "prism",
    category: "ニュース",
    title: "Prism",
    tagline: "AIニュースを、やさしく届けるニュースリーダー。",
    appUrl: "/news",
    cta: "ひらく",
    image: "/prism-icon-512.png",
    imageFit: "contain",
    tone: "blue",
    badge: "アプリ",
    lastUpdated: "2026-07-04",
    metaTitle: "Prism｜AIニュースをやさしく届けるシンプルなニュースリーダー",
    metaDescription:
      "AI関連のニュースをシンプルなUIで読める、Webベースのニュースリーダー「Prism」。Claude Codeのスマホアプリ版を使い、通勤時間だけで開発した実験的プロダクトです。開発の記録はnoteで公開中。",
    keywords: [
      "AIニュース アプリ",
      "ニュースリーダー",
      "Claude Code アプリ開発",
      "スマホだけで アプリ開発",
    ],
    intro: [
      "毎日大量に流れてくるAIニュースを、シンプルなUIでやさしく読めるニュースリーダーです。情報過多の時代に「必要なぶんだけ、気持ちよく読む」ことを大事に設計しました。",
      "開発に使ったのはClaude Codeのスマホアプリ版。PCを開かず、通勤時間だけで作り上げた実験的プロダクトでもあります。「スマホしか触れない時間」がアプリ開発の時間に変わる——そんなAI時代の開発スタイルの実例です。",
    ],
    features: [
      {
        icon: "ph-newspaper",
        title: "AIニュースをやさしく",
        text: "AI関連のニュースを、シンプルで読みやすいUIでチェックできる。",
      },
      {
        icon: "ph-device-mobile",
        title: "通勤時間だけで開発",
        text: "Claude Codeのスマホアプリ版を使い、スキマ時間だけで作ったプロダクト。",
      },
      {
        icon: "ph-sparkle",
        title: "AI時代の開発スタイル",
        text: "「作りたい」と思ったら、PCがなくても作れる。その実例としてのアプリ。",
      },
    ],
    tech: ["Claude Code", "Next.js", "Vercel"],
    schemaType: "WebApplication",
    storyUrls: ["https://note.com/aiux_unite/n/n750de90c0668"],
  },
];

export function getWork(slug: string): WorkDetail | undefined {
  return WORK_DETAILS.find((w) => w.slug === slug);
}
