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
export const YOUTUBE = "https://www.youtube.com/@aiux-unite";

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

/* —— 記事カセット（note RSSから取得した実データ） ——
   新着タブは date の降順で自動的に並びます。 */
export const ARTICLES: Article[] = [
  {
    badge: "Claude Code",
    tone: "ink",
    title:
      "「Claude Code を学べるAIゲームアプリ」をClaude Codeで分析し大幅アップデート！より学びやすくしてみた",
    excerpt:
      "GAで計測→Claudeで分析→Claude Codeで改善。データドリブンにLPとゲーム体験を磨き直した実践録。",
    tags: ["ClaudeCode", "生成AI"],
    date: "2026-05-06",
    likes: 31,
    thumb:
      "https://assets.st-note.com/production/uploads/images/273544530/rectangle_large_type_2_c801524d39d9f5a29d87d2b0ea2307dc.png?width=800",
    url: "https://note.com/aiux_unite/n/nac0fe6e0679f",
  },
  {
    badge: "AI実践",
    tone: "blue",
    title:
      "Claude Coworkで業務改善を半自動化してみた〜毎朝のAIニュース収集から改善提案まで〜",
    excerpt:
      "毎朝のAIニュース収集から、自分の業務をどう改善できるかの提案までを自動でCoworkにやってもらう試み。",
    tags: ["Claude", "業務効率化"],
    date: "2026-04-17",
    likes: 24,
    thumb:
      "https://assets.st-note.com/production/uploads/images/268115959/rectangle_large_type_2_248be67915a76bf17d40201d5d7563b5.png?width=800",
    url: "https://note.com/aiux_unite/n/n169ba6bd6c1e",
  },
  {
    badge: "Claude Code",
    tone: "yellow",
    title:
      "「Claude Codeを学べるAIゲームアプリ」を、新規事業開発の手法を駆使し、Claudeで作ってみた",
    excerpt:
      "新規事業開発の手法を使って、Claude Codeを遊びながら学べるゲームをゼロから企画・実装した記録。",
    tags: ["ClaudeCode", "新規事業"],
    date: "2026-03-24",
    likes: 42,
    thumb:
      "https://assets.st-note.com/production/uploads/images/261705593/rectangle_large_type_2_13fb73c997f2fa76331922a9966a1fcb.png?width=800",
    url: "https://note.com/aiux_unite/n/n09103ac67356",
  },
  {
    badge: "Claude Code",
    tone: "paper",
    title:
      "【非エンジニア向け】Claude Codeの「Agent Teams」を、Claude Opus 4.6に学習ガイドを作らせ、ゼロから実践してみた",
    excerpt:
      "複数のClaudeがチームで協力して実装する「Agent Teams」を、非エンジニア目線でゼロから試した。",
    tags: ["ClaudeCode", "AgentTeams"],
    date: "2026-02-08",
    likes: 38,
    thumb:
      "https://assets.st-note.com/production/uploads/images/250039831/rectangle_large_type_2_61e3df240b684fa7895b994ce5d0e4d7.png?width=800",
    url: "https://note.com/aiux_unite/n/ndfbcb2825479",
  },
  {
    badge: "業務DX",
    tone: "red",
    title: "企画(施策)の「承認フロー」を通すAI活用術｜Gemini × NotebookLM",
    excerpt:
      "企画・施策の承認フローをスムーズに通すためのAI活用術を、Gemini × NotebookLMの組み合わせで。",
    tags: ["Gemini", "NotebookLM"],
    date: "2026-01-11",
    likes: 29,
    thumb:
      "https://assets.st-note.com/production/uploads/images/243019553/rectangle_large_type_2_0bea8a3fa731421fb2a817982eb7e19f.png?width=800",
    url: "https://note.com/aiux_unite/n/ndae7f58601fc",
  },
  {
    badge: "エッセイ",
    tone: "ink",
    title: "AI時代の「流行」と「本質」：AIの先にあるべきもの",
    excerpt:
      "AIの活用の「本質」と「流行」の両方を、AIの先にあるべきものという視点で読み解くエッセイ。",
    tags: ["AI", "考察"],
    date: "2026-01-05",
    likes: 47,
    thumb:
      "https://assets.st-note.com/production/uploads/images/241595402/rectangle_large_type_2_a064de6ee4a40431b78183268d658ed0.png?width=800",
    url: "https://note.com/aiux_unite/n/na87618c2923d",
  },
  {
    badge: "業務DX",
    tone: "blue",
    title: "賀正🎍「Gemini」×「NotebookLM」で出来るDX（業務フロー改善）",
    excerpt:
      "「Gemini」×「NotebookLM」で出来る業務フロー改善（DX）を、つまりAIでの業務改善について。",
    tags: ["Gemini", "DX"],
    date: "2026-01-01",
    likes: 33,
    thumb:
      "https://assets.st-note.com/production/uploads/images/240496348/rectangle_large_type_2_19012b56a59ec7acb4afd7bf47dd6330.png?width=800",
    url: "https://note.com/aiux_unite/n/n24dc19c0ff2d",
  },
  {
    badge: "デザイン",
    tone: "yellow",
    title: "Figma Makeで「デザインを再現」させる技",
    excerpt:
      "AIで元のデザインやデザインシステムを使って新しいページを作る。Figma Makeでデザインを再現させる方法。",
    tags: ["FigmaMake", "デザイン"],
    date: "2025-12-07",
    likes: 51,
    thumb:
      "https://assets.st-note.com/production/uploads/images/234495412/rectangle_large_type_2_0c02fd6033e2bd0296ce3d6d5dc873e0.png?width=800",
    url: "https://note.com/aiux_unite/n/n2abeb7d9d9b5",
  },
  {
    badge: "画像生成",
    tone: "red",
    title: "【完全解説！】Midjourneyで作るアニメーションPV",
    excerpt:
      "Midjourneyでアニメーション動画を作る過程を完全解説。V1 Video Modelで一貫して作る方法。",
    tags: ["Midjourney", "動画生成"],
    date: "2025-10-04",
    likes: 45,
    thumb:
      "https://assets.st-note.com/production/uploads/images/219870591/rectangle_large_type_2_53fff199eee0a728ba07bb3187dcba1d.png?width=800",
    url: "https://note.com/aiux_unite/n/nc925996d0652",
  },
];

/* 新着＝公開日の降順 */
export const ARTICLES_NEW: Article[] = [...ARTICLES].sort((a, b) =>
  (a.date || "") < (b.date || "") ? 1 : -1
);

/* —— 人気記事（note「人気」タブの実ランキング・実スキ数） ——
   すべて実記事URL／スキ数を反映済み。並びは likes 降順。 */
export const ARTICLES_POPULAR: Article[] = [
  {
    likes: 388,
    badge: "入門編",
    tone: "yellow",
    title: "マンガでわかる！AI活用　第1話：「生成AIとは？」",
    excerpt:
      "「生成AIって、結局なに？」をマンガで解説。AIを“こわい存在”ではなく現場の相棒として迎える第一歩。",
    tags: ["生成AI", "入門"],
    url: "https://note.com/aiux_unite/n/n39742e82cd30",
  },
  {
    likes: 337,
    badge: "業務DX",
    tone: "blue",
    title: "賀正🎍「Gemini」×「NotebookLM」で出来るDX（業務フロー改善）",
    excerpt:
      "「Gemini」×「NotebookLM」で出来る業務フロー改善（DX）。AIでの業務改善について。",
    tags: ["Gemini", "DX"],
    thumb:
      "https://assets.st-note.com/production/uploads/images/240496348/rectangle_large_type_2_19012b56a59ec7acb4afd7bf47dd6330.png?width=800",
    url: "https://note.com/aiux_unite/n/n24dc19c0ff2d",
  },
  {
    likes: 243,
    badge: "入門編",
    tone: "ink",
    title: "マンガでわかる！AI活用　第4話：「7ページで解説！AIアプリ制作」",
    excerpt: "AIアプリ制作の流れを、わずか7ページのマンガでわかりやすく解説。",
    tags: ["AIアプリ", "入門"],
    url: "https://note.com/aiux_unite/n/nbbdec3944965",
  },
  {
    likes: 239,
    badge: "入門編",
    tone: "red",
    title: "マンガでわかる！AI活用　第5話：「AI時代のものづくり」",
    excerpt: "AI時代に“ものづくり”はどう変わる？　現場目線でマンガ解説。",
    tags: ["ものづくり", "入門"],
    url: "https://note.com/aiux_unite/n/n9e20c3906cec",
  },
  {
    likes: 235,
    badge: "Claude Code",
    tone: "yellow",
    title:
      "「Claude Codeを学べるAIゲームアプリ」を、新規事業開発の手法を駆使し、Claudeで作ってみた",
    excerpt:
      "新規事業開発の手法を使い、Claude Codeを遊びながら学べるゲームをゼロから企画・実装した記録。",
    tags: ["ClaudeCode", "新規事業"],
    thumb:
      "https://assets.st-note.com/production/uploads/images/261705593/rectangle_large_type_2_13fb73c997f2fa76331922a9966a1fcb.png?width=800",
    url: "https://note.com/aiux_unite/n/n09103ac67356",
  },
  {
    likes: 222,
    badge: "AI実践",
    tone: "blue",
    title: "ノンエンジニアが挑むChatGPT APIを使ったPythonアプリ構築",
    excerpt: "非エンジニアがChatGPT APIを使って、Pythonアプリの構築に挑戦した実践録。",
    tags: ["ChatGPT", "Python"],
    url: "https://note.com/aiux_unite/n/n3d980b7ca111",
  },
  {
    likes: 220,
    badge: "入門編",
    tone: "paper",
    title: "マンガでわかる！AI活用　第6話：「プロンプトを攻略する」",
    excerpt: "思いどおりの答えを引き出すには？　現場で効く“伝え方”のコツをマンガで。",
    tags: ["プロンプト", "コツ"],
    url: "https://note.com/aiux_unite/n/n3254dbb5e6b1",
  },
  {
    likes: 219,
    badge: "動画生成",
    tone: "red",
    title:
      "【Canvaだけで作るプロモーション動画！】「AI試着カメラ」PR動画制作の軌跡",
    excerpt: "Canvaだけで「AI試着カメラ」のPR動画を作った制作の軌跡。",
    tags: ["Canva", "動画"],
    url: "https://note.com/aiux_unite/n/n5d028f1932ed",
  },
  {
    likes: 214,
    badge: "デザイン",
    tone: "ink",
    title:
      "【Figma × Claude】MCPでつなぐ、デザインシステムに沿ったワイヤーフレーム自動生成＆編集フロー！",
    excerpt:
      "FigmaとClaudeをMCPでつなぎ、デザインシステムに沿ったワイヤー〜実装を自動生成するフロー。",
    tags: ["Figma", "Claude"],
    thumb:
      "https://assets.st-note.com/production/uploads/images/193686050/rectangle_large_type_2_539e9f4779406da36984937b9a62e6a6.png?width=800",
    url: "https://note.com/aiux_unite/n/naac3d48a3258",
  },
  {
    likes: 211,
    badge: "動画生成",
    tone: "yellow",
    title: "【AIで作る】動くストーリーボード",
    excerpt: "AIを使って“動く”ストーリーボードを作る方法を解説。",
    tags: ["AI", "動画"],
    url: "https://note.com/aiux_unite/n/n759b5bbfe9e2",
  },
  {
    likes: 208,
    badge: "動画生成",
    tone: "blue",
    title: "漫画風の動画を生成する！(RunwayGen-3×Midjourney×DomoAI)",
    excerpt: "RunwayGen-3 × Midjourney × DomoAIで、漫画風の動画を生成する手順。",
    tags: ["Runway", "Midjourney"],
    url: "https://note.com/aiux_unite/n/ndc6365524f2a",
  },
  {
    likes: 202,
    badge: "入門編",
    tone: "red",
    title: "マンガでわかる！AI活用　第3話：「RAGとファインチューニング」",
    excerpt: "RAGとファインチューニングの違いと使いどころを、マンガでやさしく。",
    tags: ["RAG", "入門"],
    url: "https://note.com/aiux_unite/n/n185107973a2f",
  },
];

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

/* メインビジュアル */
export const HERO_VIDEO_ID = "Uj3RYBLWK6c";
export const BANNER =
  "https://assets.st-note.com/production/uploads/images/116614836/d720e6e55c16e9db7b376cf5c6c7990a.png?width=1200&quality=92";
