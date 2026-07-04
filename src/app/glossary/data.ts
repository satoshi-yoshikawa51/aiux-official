/* ============================================================
   AI用語集（/glossary）のデータ。
   ・用語を増やすときは TERMS に1件追加し、lastUpdated を更新する
     （sitemap・一覧・関連用語チップに自動反映される）。
   ・short は検索結果やAI検索にそのまま引用されうる「一文定義」。
     body は現場目線の補足解説（2〜3段落）。
   ============================================================ */

export type TermCategory = "基礎知識" | "しくみ・技術" | "開発・活用";

export interface TermLink {
  label: string;
  href: string;
}

export interface GlossaryTerm {
  slug: string;
  /** 用語（表示名） */
  term: string;
  yomi: string;
  en?: string;
  category: TermCategory;
  /** 一文定義（60〜120字目安） */
  short: string;
  /** 補足解説の段落 */
  body: string[];
  /** あわせて読みたいマンガ・記事・作品 */
  links: TermLink[];
  relatedSlugs: string[];
  lastUpdated: string;
}

export const GLOSSARY_UPDATED = "2026-07-04";

export const TERMS: GlossaryTerm[] = [
  {
    slug: "generative-ai",
    term: "生成AI",
    yomi: "せいせいエーアイ",
    en: "Generative AI",
    category: "基礎知識",
    short:
      "文章・画像・音声・動画・プログラムなどのコンテンツを、指示にもとづいて新しく「生成」できるAIの総称。ChatGPTやClaude、Midjourneyなどが代表例。",
    body: [
      "従来のAIが「分類する・予測する」ことを得意としてきたのに対し、生成AIは大量のデータから学んだパターンをもとに、新しいアウトプットそのものを作り出せるのが特徴です。文章の下書き、企画のたたき台、イラスト、コード——「ゼロから作る」時間を大幅に短縮してくれます。",
      "現場で使うコツは、生成AIを「正解を出す機械」ではなく「たたき台を量産してくれる相棒」と捉えること。出てきたものを人間が目利きして磨く前提で使うと、いちばん力を発揮します。",
    ],
    links: [
      { label: "マンガでわかる！AI活用 第1話：「生成AIとは？」", href: "https://note.com/aiux_unite/n/n39742e82cd30" },
      { label: "連載「マンガでわかる！AI活用」シリーズ紹介", href: "/manga/wakaru" },
    ],
    relatedSlugs: ["llm", "prompt-engineering", "image-generation-ai"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "llm",
    term: "LLM（大規模言語モデル）",
    yomi: "エルエルエム",
    en: "Large Language Model",
    category: "基礎知識",
    short:
      "膨大なテキストデータで学習し、人間の言葉を理解・生成できるAIモデル。ChatGPTやClaude、Geminiなど、対話型AIの中核となる技術。",
    body: [
      "LLMは「次に来る言葉を予測する」というシンプルな仕組みを、膨大な規模で積み上げたものです。その結果、要約・翻訳・企画出し・コード生成など、言葉で指示できる幅広い仕事をこなせるようになりました。",
      "ただし、LLMは「もっともらしい言葉の並び」を作るのが本質なので、事実と異なる内容を自信満々に答えることもあります（ハルシネーション）。得意・不得意を知って任せる範囲を決めるのが、現場でうまく付き合う第一歩です。",
    ],
    links: [
      { label: "マンガでわかる！AI活用 第1話：「生成AIとは？」", href: "https://note.com/aiux_unite/n/n39742e82cd30" },
    ],
    relatedSlugs: ["generative-ai", "hallucination", "rag", "fine-tuning"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "prompt-engineering",
    term: "プロンプトエンジニアリング",
    yomi: "ぷろんぷとえんじにありんぐ",
    en: "Prompt Engineering",
    category: "基礎知識",
    short:
      "AIへの指示文（プロンプト）を工夫して、思いどおりの答えを引き出す技術。役割・目的・条件・出力形式を具体的に伝えるほど、精度が上がる。",
    body: [
      "同じAIでも、聞き方ひとつで答えの質は大きく変わります。「いい感じにして」ではなく、「誰向けに・何のために・どんな形式で・どんな条件で」を伝える——人間の新人に仕事を頼むときと同じ要領です。",
      "現場で効く基本は3つ。①役割を与える（あなたはWeb制作のディレクターです）②具体例を見せる（この記事のトーンに合わせて）③出力形式を指定する（表で、3案、それぞれ100字以内）。この3つだけで、体感の精度は一段変わります。",
    ],
    links: [
      { label: "マンガでわかる！AI活用 第6話：「プロンプトを攻略する」", href: "https://note.com/aiux_unite/n/n3254dbb5e6b1" },
      { label: "連載「マンガでわかる！AI活用」シリーズ紹介", href: "/manga/wakaru" },
    ],
    relatedSlugs: ["generative-ai", "llm", "ai-workflow"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "hallucination",
    term: "ハルシネーション",
    yomi: "はるしねーしょん",
    en: "Hallucination",
    category: "基礎知識",
    short:
      "AIが事実と異なる内容を、もっともらしく生成してしまう現象。「幻覚」の意。存在しない出典や数字を自信満々に答えることもあるため、事実確認が欠かせない。",
    body: [
      "LLMは「正しい情報を検索して答える」のではなく「自然な言葉の続きを予測する」仕組みなので、知らないことでも、それらしい答えを作ってしまうことがあります。これがハルシネーションです。",
      "対策の基本は、①事実・数字・出典は必ず人間が確認する、②RAGなどで根拠となる資料を渡してから答えさせる、③「わからない場合はわからないと答えて」と指示する、の3つ。AIの答えを鵜呑みにしない運用ルールが、AI活用の信頼性を支えます。",
    ],
    links: [
      { label: "連載「AI時代の流行と本質」シリーズ紹介", href: "/manga/honshitsu" },
    ],
    relatedSlugs: ["llm", "rag"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "rag",
    term: "RAG（検索拡張生成）",
    yomi: "らぐ",
    en: "Retrieval-Augmented Generation",
    category: "しくみ・技術",
    short:
      "AIが答える前に、社内資料やデータベースなど外部の情報源を検索し、その内容を根拠にして回答を生成するしくみ。AIに「カンニングペーパー」を渡すイメージ。",
    body: [
      "LLMは学習した時点までの知識しか持たず、社内の最新資料も知りません。RAGは、質問に関係する資料をその場で検索してAIに渡し、「この資料にもとづいて答えて」と生成させる方法です。根拠が明示できるため、ハルシネーション対策としても有効です。",
      "モデル自体を作り替えるファインチューニングと違い、資料を差し替えるだけで知識を更新できるのが実務上の強み。「社内ナレッジをAIに答えさせたい」といった用途では、まずRAGから検討するのが定石です。",
    ],
    links: [
      { label: "マンガでわかる！AI活用 第3話：「RAGとファインチューニング」", href: "https://note.com/aiux_unite/n/n185107973a2f" },
      { label: "連載「マンガでわかる！AI活用」シリーズ紹介", href: "/manga/wakaru" },
    ],
    relatedSlugs: ["fine-tuning", "llm", "hallucination"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "fine-tuning",
    term: "ファインチューニング",
    yomi: "ふぁいんちゅーにんぐ",
    en: "Fine-tuning",
    category: "しくみ・技術",
    short:
      "学習済みのAIモデルに追加のデータを学習させて、特定の用途や口調・スタイルに合わせて調整する手法。モデルそのものの「ふるまい」を変える。",
    body: [
      "RAGが「資料をその場で渡す」方法なのに対し、ファインチューニングは「モデル自体を追加学習で作り替える」方法です。ブランド独自の文体を一貫して守らせたい、特定の形式の出力を安定させたい、といった場面で力を発揮します。",
      "ただし、学習データの準備やコスト、更新のたびの再学習といった手間がかかるため、「最新情報を答えさせたい」だけならRAGのほうが向いています。使いどころの違いは、マンガ第3話でたとえ話つきで解説しています。",
    ],
    links: [
      { label: "マンガでわかる！AI活用 第3話：「RAGとファインチューニング」", href: "https://note.com/aiux_unite/n/n185107973a2f" },
    ],
    relatedSlugs: ["rag", "llm"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "ai-agent",
    term: "AIエージェント",
    yomi: "エーアイえーじぇんと",
    en: "AI Agent",
    category: "しくみ・技術",
    short:
      "目標を与えると、必要な手順を自分で考え、ツールを使いながら複数のステップを自律的に実行するAI。「一問一答」から「仕事を任せる」への進化形。",
    body: [
      "チャットAIが「聞かれたら答える」のに対し、AIエージェントは「調べる→整理する→作る→確認する」といった一連の流れを自分で計画して進めます。ファイル操作・Web検索・コード実行などのツールを使い分けながら、人間の細かい指示なしにタスクを完了させるのが特徴です。",
      "たとえば毎朝のニュース収集から業務改善の提案までを自動でこなす、複数のAIがチームを組んで開発する——そんな使い方がすでに現場レベルで動き始めています。実際に試した記録は下のnote記事でどうぞ。",
    ],
    links: [
      { label: "Claude Coworkで業務改善を半自動化してみた", href: "https://note.com/aiux_unite/n/n169ba6bd6c1e" },
      { label: "Claude Codeの「Agent Teams」をゼロから実践してみた", href: "https://note.com/aiux_unite/n/ndfbcb2825479" },
    ],
    relatedSlugs: ["claude-code", "ai-workflow", "mcp"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "mcp",
    term: "MCP（Model Context Protocol）",
    yomi: "エムシーピー",
    en: "Model Context Protocol",
    category: "しくみ・技術",
    short:
      "AIと外部ツール・データをつなぐための共通規格。FigmaやデータベースなどをAIから直接操作できるようにする「AI界のUSB規格」のような存在。",
    body: [
      "AIに仕事を任せようとすると、「デザインはFigmaに、データはDBに、資料はドライブにある」という壁に当たります。MCPは、こうした外部ツールをAIに安全に接続するための共通プロトコルで、対応ツールならAIが直接読み書きできるようになります。",
      "たとえばFigmaとClaudeをMCPでつなぐと、デザインシステムに沿ったワイヤーフレームの自動生成といった連携が実現できます。実際のワークフローは下の記事で公開しています。",
    ],
    links: [
      { label: "【Figma × Claude】MCPでつなぐワイヤーフレーム自動生成フロー", href: "https://note.com/aiux_unite/n/naac3d48a3258" },
    ],
    relatedSlugs: ["ai-agent", "claude-code"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "claude-code",
    term: "Claude Code",
    yomi: "クロードコード",
    en: "Claude Code",
    category: "開発・活用",
    short:
      "Anthropic社のAI「Claude」を使ったコーディングエージェント。日本語で指示するだけで、アプリやサイトの実装・修正・デプロイまで自律的に進めてくれる。",
    body: [
      "「こういうアプリを作りたい」と伝えると、Claude Codeがファイルを作り、コードを書き、動作を確認しながら実装を進めます。エンジニアの相棒としてはもちろん、コードを書けない企画職・デザイナーが「自分のアイデアを形にする」道具としても強力です。",
      "このサイト自体も、掲載しているゲームやアプリも、Claude Codeで作られています。どんな感覚で使えるのかは、遊びながら学べるRPG「Claude Code Quest」で体験するのが早いはずです。",
    ],
    links: [
      { label: "Claude Code Quest（遊びながら学べるRPG）", href: "/works/claude-code-quest" },
      { label: "Claude Code Quest ライト版（選択式のかんたん版）", href: "/works/claude-code-quest-lite" },
      { label: "スマホのClaude Codeだけでニュースアプリを作った記録", href: "https://note.com/aiux_unite/n/n750de90c0668" },
    ],
    relatedSlugs: ["vibe-coding", "ai-agent", "mcp"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "vibe-coding",
    term: "バイブコーディング",
    yomi: "ばいぶこーでぃんぐ",
    en: "Vibe Coding",
    category: "開発・活用",
    short:
      "コードの細部を自分で書かず、AIとの対話で「こう動いてほしい」というイメージ（バイブ）を伝えながらソフトウェアを作る開発スタイル。",
    body: [
      "「関数を書く」のではなく「やりたいことを日本語で伝えて、動いたら次へ進む」。バイブコーディングは、AIコーディングツールの進化で生まれた新しい作り方で、プログラミング未経験でもアプリやゲームを形にできるのが最大の特徴です。",
      "手描きイラストから3Dゲームを作る、通勤時間だけでニュースアプリを作る——このサイトの作品は、いずれもバイブコーディングの実例です。「自分にも作れるかも」と思ったら、制作の一部始終を公開しているnote記事からどうぞ。",
    ],
    links: [
      { label: "手書きイラストを3Dゲームに！Claudeで作った一部始終", href: "https://note.com/aiux_unite/n/ndd10e1acf1b1" },
      { label: "マンガから作る！3Dゲーム（作品ページ）", href: "/works/manga-3d-game" },
      { label: "Prism — 通勤時間だけで作ったニュースアプリ", href: "/works/prism" },
    ],
    relatedSlugs: ["claude-code", "generative-ai"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "image-generation-ai",
    term: "画像生成AI",
    yomi: "がぞうせいせいエーアイ",
    en: "Image Generation AI",
    category: "開発・活用",
    short:
      "テキストの指示（プロンプト）から画像やイラストを生成するAI。MidjourneyやDALL·E、Stable Diffusionなどが代表例で、動画生成AIへと進化が続いている。",
    body: [
      "「夕焼けの街を走る猫、アニメ風」と打てば数十秒で絵が出てくる——画像生成AIは、ビジュアル制作の最初の一歩を劇的に速くしました。企画のイメージ共有、ストーリーボード、PR素材のたたき台など、制作現場での使いどころは豊富です。",
      "さらにRunwayなどの動画生成AIと組み合わせると、静止画からアニメーションPVまで作れる時代になっています。漫画風動画の生成やプロモーション動画づくりの実践例は、下の記事で公開しています。",
    ],
    links: [
      { label: "漫画風の動画を生成する！（Runway×Midjourney×DomoAI）", href: "https://note.com/aiux_unite/n/ndc6365524f2a" },
      { label: "【AIで作る】動くストーリーボード", href: "https://note.com/aiux_unite/n/n759b5bbfe9e2" },
    ],
    relatedSlugs: ["generative-ai", "prompt-engineering"],
    lastUpdated: "2026-07-04",
  },
  {
    slug: "ai-workflow",
    term: "AIワークフロー",
    yomi: "エーアイわーくふろー",
    en: "AI Workflow",
    category: "開発・活用",
    short:
      "複数の作業ステップにAIを組み込み、一連の業務の流れとして設計したもの。単発の「AIに聞く」から、仕事のプロセス全体をAIと分担する段階への進化。",
    body: [
      "AI活用が単発の質問で終わっている間は、効果も単発です。効くのは「情報収集→整理→たたき台作成→人間がレビュー→仕上げ」のような流れ全体を設計して、どこをAIに任せ、どこに人間が入るかを決めること。これがAIワークフローの考え方です。",
      "Web制作の現場なら、KPI設計・ペルソナ・カスタマージャーニー・要件定義といった各工程にAIを組み込んでいく形になります。その実践過程は連載「マンガで実践！AI活用」で全話公開しています。",
    ],
    links: [
      { label: "マンガでわかる！AI活用 第7話：「AIワークフロー」", href: "https://note.com/aiux_unite/n/nb9bbe68255bd" },
      { label: "連載「マンガで実践！AI活用」シリーズ紹介", href: "/manga/jissen" },
    ],
    relatedSlugs: ["ai-agent", "prompt-engineering", "claude-code"],
    lastUpdated: "2026-07-04",
  },
];

export const TERM_CATEGORIES: TermCategory[] = ["基礎知識", "しくみ・技術", "開発・活用"];

export function getTerm(slug: string): GlossaryTerm | undefined {
  return TERMS.find((t) => t.slug === slug);
}
