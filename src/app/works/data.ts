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
  category: "ゲーム" | "ニュース" | "ツール";
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
  /** schemaType が WebApplication のときの applicationCategory（省略時 NewsApplication） */
  appCategory?: string;
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
  {
    slug: "uketsuke",
    category: "ツール",
    title: "COMIXAI AI受付",
    tagline: "AIと話すだけで、お問い合わせが完成する。",
    appUrl: "/uketsuke",
    cta: "つかう",
    image: "/works/uketsuke.jpg",
    tone: "yellow",
    badge: "AI",
    lastUpdated: "2026-07-11",
    metaTitle: "COMIXAI AI受付｜Claude APIで作ったチャット型お問い合わせ窓口",
    metaDescription:
      "フォームの空欄に固まらなくていい、チャット型のお問い合わせ窓口。AI（Claude API）があなたの用件をヒアリングして内容を自動で要約し、整理された状態で本人に届きます。AI活用の実例としても体験できるWORKS作品です。",
    keywords: [
      "AI 問い合わせフォーム",
      "チャットボット 受付",
      "Claude API 活用事例",
      "AIヒアリング",
      "問い合わせ 自動要約",
    ],
    intro: [
      "お問い合わせフォームの「ご相談内容」欄を前に、何をどう書けばいいか固まってしまう——その体験そのものをAIで作り変えた作品です。チャットでAIがあなたの用件をヒアリングし、話し終わるころにはお問い合わせ内容がきれいに要約されています。あとは名前とメールを入れて送信するだけ。",
      "中身はAnthropicのClaude APIで、このサイト初のサーバー連携機能。AIは受付と要約だけを担当し、判断や返信はすべて本人が行う設計です。「AIに仕事をどう任せるか」の等身大の実例として、ぜひ触ってみてください。",
    ],
    features: [
      {
        icon: "ph-chats-circle",
        title: "書く前に、話せる",
        text: "文章を組み立てるのはAIの仕事。あなたは質問に答えるだけで、伝わる問い合わせ文ができあがる。",
      },
      {
        icon: "ph-list-checks",
        title: "自動で要約、確認してから送信",
        text: "会話の内容をAIが要点整理。送信前に確認・修正できるから、言った内容がそのまま正しく届く。",
      },
      {
        icon: "ph-shield-check",
        title: "AIは受付だけ、判断は人間",
        text: "日程や条件の約束はAIには任せない設計。個人情報も会話ではなく最後の確認画面でだけ入力。",
      },
    ],
    tech: ["Claude API", "Claude Code", "Next.js", "Vercel"],
    schemaType: "WebApplication",
    appCategory: "BusinessApplication",
    storyUrls: [],
  },
  {
    slug: "shisho",
    category: "ツール",
    title: "COMIXAI AI司書",
    tagline: "探すより、聞くほうが早い。サイト内AI検索。",
    appUrl: "/search",
    cta: "つかう",
    image: "/works/shisho.jpg",
    tone: "blue",
    badge: "AI",
    lastUpdated: "2026-07-11",
    metaTitle: "COMIXAI AI司書｜Claude APIで作ったサイト内RAG検索",
    metaDescription:
      "「ハルシネーションって何？」と質問文のまま聞くと、サイト内の用語集・FAQ・マンガ・ゲーム約230ドキュメントからAIが答えを探して出典つきで案内。ベクトルDBを使わない軽量RAGの実装例として体験できるWORKS作品です。",
    keywords: [
      "RAG 実装例",
      "サイト内検索 AI",
      "Claude API 活用事例",
      "AI検索 作り方",
      "軽量RAG",
    ],
    intro: [
      "サイトが80ページを超えて、「どこに何があるか」を探すのが大変になってきた——そこで作った、質問文のまま聞けるサイト内検索です。AI司書がサイトの中身だけを根拠に2〜4文で答えて、出典ページに案内します。サイトにない情報は「ない」と正直に言うのがポイント。",
      "しくみは、用語集80語・FAQ・マンガ・絵巻など約230ドキュメントをキーワード検索（BM25）で絞り込み、上位の資料だけをClaudeに渡す軽量RAG。ベクトルDBなし・追加インフラゼロで動く、いちばん身近なRAGの実装例です。",
    ],
    features: [
      {
        icon: "ph-magnifying-glass",
        title: "質問文のまま聞ける",
        text: "キーワードに変換しなくていい。「会社でAI使っていい？」のような聞き方でそのまま探せる。",
      },
      {
        icon: "ph-books",
        title: "サイトの中身だけが根拠",
        text: "回答は必ず出典番号つき。資料にないことは答えない設計だから、ハルシネーションが起きにくい。",
      },
      {
        icon: "ph-feather",
        title: "ベクトルDBなしの軽量RAG",
        text: "BM25のキーワード検索＋Claudeの要約だけで構成。RAGは大げさな仕組みがなくても作れる、の実例。",
      },
    ],
    tech: ["Claude API", "BM25", "Claude Code", "Next.js", "Vercel"],
    schemaType: "WebApplication",
    appCategory: "UtilitiesApplication",
    storyUrls: [],
  },
];

export function getWork(slug: string): WorkDetail | undefined {
  return WORK_DETAILS.find((w) => w.slug === slug);
}
