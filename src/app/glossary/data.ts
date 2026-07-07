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
  /** 手描きイラスト（設定するとSVG図解の代わりに表示される）。
      public/glossary/ に画像を置いて { src: "/glossary/rag.png", alt: "..." } を指定 */
  image?: { src: string; alt: string };
  /** 隠しコンテンツへの扉（黒いバナーで表示される）。ctaはボタン文言（省略時「ラボに入る」） */
  secret?: { href: string; title: string; desc: string; cta?: string };
}

export const GLOSSARY_UPDATED = "2026-07-05";

/* トップページのチップと一覧の「まずはこの12語」に出す代表用語 */
export const FEATURED_SLUGS = [
  "generative-ai", "llm", "prompt-engineering", "hallucination",
  "rag", "fine-tuning", "ai-agent", "mcp",
  "claude-code", "vibe-coding", "image-generation-ai", "ai-workflow",
];

const TERMS_BATCH1: GlossaryTerm[] = [
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
    secret: {
      href: "/uso",
      title: "AIのウソを、見抜け。",
      desc: "2つのAI回答、片方にウソが混ざっています。実際のAIの“やらかし”だけを集めた全8問——騙されずにいられるか。",
      cta: "挑戦する",
    },
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


/* ============================================================
   第2バッチ（+18語 / 2026-07-05）。図解は主要語のみの方針のため
   このバッチはテキスト＋関連リンク構成。
   ============================================================ */
const TERMS_BATCH2: GlossaryTerm[] = [
  {
    slug: "machine-learning",
    term: "機械学習",
    yomi: "きかいがくしゅう",
    en: "Machine Learning",
    category: "基礎知識",
    short:
      "人間がルールを1つずつ教え込むのではなく、大量のデータからコンピュータ自身にパターンを学ばせる技術。現代のAIのほぼすべての土台。",
    body: [
      "「猫の写真とは何か」をルールで定義するのは至難の業ですが、猫の写真を大量に見せて特徴を学ばせることはできます。これが機械学習の基本的な発想で、迷惑メール判定からレコメンド、生成AIまで、いま「AI」と呼ばれるものの大半はこの仕組みの上に成り立っています。",
      "現場で覚えておきたいのは「機械学習のAIは、学習したデータの範囲でしか賢くない」ということ。データにない状況には弱く、データの偏りはそのまま結果の偏りになります。AIの得意・不得意を見極める出発点になる考え方です。",
    ],
    links: [
      { label: "マンガでわかる！AI活用 第1話：「生成AIとは？」", href: "https://note.com/aiux_unite/n/n39742e82cd30" },
      { label: "連載「マンガでわかる！AI活用」シリーズ紹介", href: "/manga/wakaru" },
    ],
    relatedSlugs: ["deep-learning", "neural-network", "generative-ai"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "deep-learning",
    term: "ディープラーニング",
    yomi: "でぃーぷらーにんぐ",
    en: "Deep Learning",
    category: "基礎知識",
    short:
      "人間の脳の神経回路を参考にした「ニューラルネットワーク」を何層にも深く重ねた機械学習の手法。画像認識や生成AIの爆発的進化を生んだ立役者。",
    body: [
      "従来の機械学習では「どこに注目するか（特徴）」を人間が設計する必要がありましたが、ディープラーニングはデータから特徴そのものを自動で見つけ出します。層が深いほど複雑なパターンを捉えられるため「ディープ（深い）」と呼ばれます。",
      "2012年ごろの画像認識ブレイクスルーから、ChatGPTなどの大規模言語モデルまで、この10年のAIの進化はほぼディープラーニングの進化です。生成AIを理解する上での前提知識として、名前と位置づけだけでも押さえておくと役立ちます。",
    ],
    links: [
      { label: "連載「マンガでわかる！AI活用」シリーズ紹介", href: "/manga/wakaru" },
    ],
    relatedSlugs: ["machine-learning", "neural-network", "transformer"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "multimodal-ai",
    term: "マルチモーダルAI",
    yomi: "まるちもーだるエーアイ",
    en: "Multimodal AI",
    category: "基礎知識",
    short:
      "テキストだけでなく、画像・音声・動画など複数の種類（モード）の情報をまとめて理解・生成できるAI。「画像を見せて質問する」が当たり前になった背景の技術。",
    body: [
      "スクリーンショットを貼って「このエラー何？」と聞く、手描きのラフを見せて「これをWebデザインにして」と頼む——こうした使い方ができるのは、AIがマルチモーダル化したからです。ChatGPTもClaudeもGeminiも、いまや標準で画像を理解します。",
      "現場での意味は大きく、「言葉で説明しづらいものは、見せればいい」が成立します。デザインのフィードバック、資料の読み取り、ホワイトボードの清書など、テキスト入力の手間を飛ばせる場面から試すのがおすすめです。",
    ],
    links: [
      { label: "手書きイラストを3Dゲームに！Claudeで作った一部始終", href: "https://note.com/aiux_unite/n/ndd10e1acf1b1" },
    ],
    relatedSlugs: ["generative-ai", "image-generation-ai", "llm"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "agi",
    term: "AGI（汎用人工知能）",
    yomi: "エージーアイ",
    en: "Artificial General Intelligence",
    category: "基礎知識",
    short:
      "特定のタスク専用ではなく、人間のように幅広い知的作業を自律的にこなせるAIの概念。現在のAIはまだ「特化型」で、AGIは各社が目指す到達点とされる。",
    body: [
      "いまのAIは驚くほど賢く見えますが、原理的には「学習したパターンの再構成」が得意な特化型です。AGIは、初めての課題にも人間のように柔軟に対応できる汎用性を持つAIを指し、OpenAIやAnthropicなどが公言する長期目標でもあります。",
      "「いつ実現するか」は専門家の間でも数年〜数十年と意見が割れています。現場の私たちにとって大事なのは時期の予想より、「AIが汎用化していく方向にある」前提で、自分の仕事のどこをAIと分担するかを考え続けることです。",
    ],
    links: [
      { label: "連載「AI時代の流行と本質」シリーズ紹介", href: "/manga/honshitsu" },
    ],
    relatedSlugs: ["singularity", "ai-agent", "llm"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "singularity",
    term: "シンギュラリティ",
    yomi: "しんぎゅらりてぃ",
    en: "Singularity",
    category: "基礎知識",
    short:
      "AIが人間の知能を超え、AI自身がAIを改良し始めることで、技術進化が予測不能なスピードに達するとされる転換点。「技術的特異点」とも呼ばれる。",
    body: [
      "未来学者レイ・カーツワイルが「2045年に訪れる」と予言したことで広く知られるようになった概念です。生成AIの急速な進化により、この言葉が再び現実味を帯びて語られるようになりました。",
      "ただし、シンギュラリティが来るかどうかを議論するより、「AIの進化スピードが人間の学習スピードを超えつつある」いまの状況にどう向き合うかのほうが実務的です。流行を追いかけるだけでなく本質を掴む——連載エッセイで扱っているテーマそのものです。",
    ],
    links: [
      { label: "AI時代の「流行」と「本質」：AIの先にあるべきもの", href: "https://note.com/aiux_unite/n/na87618c2923d" },
      { label: "連載「AI時代の流行と本質」シリーズ紹介", href: "/manga/honshitsu" },
    ],
    relatedSlugs: ["agi", "generative-ai"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "ai-literacy",
    term: "AIリテラシー",
    yomi: "エーアイりてらしー",
    en: "AI Literacy",
    category: "基礎知識",
    short:
      "AIの得意・不得意を理解し、適切に使いこなし、結果を鵜呑みにせず判断できる能力。「使えるか」ではなく「正しく付き合えるか」を指す言葉。",
    body: [
      "AIリテラシーはプログラミング能力のことではありません。①AIに何を任せられるかを見極める、②的確に指示する（プロンプト）、③出てきた結果の真偽や品質を判断する、④著作権や情報漏えいなどのリスクに配慮する——この4つがそろって初めて「AIを使える人」です。",
      "チームにAIを広めるときも、ツールの操作方法より先にこの考え方を共有するのが近道。マンガ連載「マンガでわかる！AI活用」は、まさにこのAIリテラシーを楽しく身につけてもらうために描いています。",
    ],
    links: [
      { label: "連載「マンガでわかる！AI活用」シリーズ紹介", href: "/manga/wakaru" },
      { label: "マンガでわかる！AI活用 第6話：「プロンプトを攻略する」", href: "https://note.com/aiux_unite/n/n3254dbb5e6b1" },
    ],
    relatedSlugs: ["prompt-engineering", "hallucination", "ai-workflow"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "neural-network",
    term: "ニューラルネットワーク",
    yomi: "にゅーらるねっとわーく",
    en: "Neural Network",
    category: "しくみ・技術",
    short:
      "脳の神経細胞（ニューロン）のつながりを数式で模した仕組み。大量の「重み」を調整しながら学習する、ディープラーニングの基本構造。",
    body: [
      "入力（例：画像のピクセル）を受け取り、無数の計算ノードを経由して出力（例：「猫である確率」）を出す——この計算の網がニューラルネットワークです。学習とは、正解に近づくように網の中の「重み」を少しずつ調整していく作業を指します。",
      "ChatGPTのパラメータ数が「数千億」と言われるのは、この重みの数のこと。仕組みの詳細を覚える必要はありませんが、「AIの中身は膨大な調整済みの数値のかたまり」というイメージを持っておくと、AIの振る舞いへの理解がぐっと現実的になります。",
    ],
    links: [
      { label: "連載「マンガでわかる！AI活用」シリーズ紹介", href: "/manga/wakaru" },
    ],
    relatedSlugs: ["deep-learning", "machine-learning", "transformer"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "transformer",
    term: "トランスフォーマー",
    yomi: "とらんすふぉーまー",
    en: "Transformer",
    category: "しくみ・技術",
    short:
      "2017年にGoogleが発表した、文中の単語同士の関係性（どこに注目すべきか）を効率よく捉えるAIの構造。ChatGPTの「T」であり、生成AIブームの技術的な源流。",
    body: [
      "文章を理解するには「その単語が文中の何と関係しているか」を掴む必要があります。トランスフォーマーは「アテンション（注意機構）」という仕組みでこれを並列に高速処理できるようにし、大規模な言語モデルの学習を現実的にしました。",
      "GPTは「Generative Pre-trained Transformer」の略。つまりChatGPTの名前には、この技術がそのまま入っています。LLMの性能競争は、突き詰めればこのトランスフォーマーをどれだけ大きく・賢く育てられるかの競争から始まりました。",
    ],
    links: [
      { label: "連載「マンガでわかる！AI活用」シリーズ紹介", href: "/manga/wakaru" },
    ],
    relatedSlugs: ["llm", "neural-network", "token"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "token",
    term: "トークン",
    yomi: "とーくん",
    en: "Token",
    category: "しくみ・技術",
    short:
      "AIが文章を処理するときの最小単位。単語より少し細かい「文字のかたまり」で、AIの料金や入力できる文章量はこのトークン数で数えられる。",
    body: [
      "AIは文章をそのまま読むのではなく、トークンという単位に刻んでから処理します。日本語はおおよそ1文字＝1〜2トークン程度。「このモデルは20万トークンまで扱える」「API料金は100万トークンあたり◯円」のように、AIの世界の“通貨”のような存在です。",
      "実務では「長い資料を渡したら途中で切れた」「APIの請求が思ったより高い」といった場面で必ずこの概念に出会います。文章量＝トークン数がコストと限界を決める、と覚えておけば十分です。",
    ],
    links: [
      { label: "ノンエンジニアが挑むChatGPT APIを使ったPythonアプリ構築", href: "https://note.com/aiux_unite/n/n3d980b7ca111" },
    ],
    secret: {
      href: "/tokenizer",
      title: "AIは、文章をこう読む。",
      desc: "文章を打つと、その場でトークンに刻まれていく隠しラボ。料金の目安も「作業机」の使用量も、触ればわかります。",
    },
    relatedSlugs: ["llm", "context-window"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "context-window",
    term: "コンテキストウィンドウ",
    yomi: "こんてきすとうぃんどう",
    en: "Context Window",
    category: "しくみ・技術",
    short:
      "AIが一度に覚えていられる情報量の上限。会話の履歴や渡した資料はすべてこの「作業机の広さ」の中に収まっている必要がある。",
    body: [
      "長く会話していると、AIが最初のほうの指示を忘れたように振る舞うことがあります。これはコンテキストウィンドウ（文脈の窓）から古い情報があふれたため。AIの記憶力ではなく「机の広さ」の問題です。",
      "対策はシンプルで、①大事な前提は要所で言い直す、②長い作業は区切って新しい会話で始める、③資料は必要な部分だけ渡す、の3つ。最近のモデルは窓がかなり広くなりましたが、「無限ではない」と知っているだけでAIとの付き合い方が変わります。",
    ],
    links: [
      { label: "マンガでわかる！AI活用 第6話：「プロンプトを攻略する」", href: "https://note.com/aiux_unite/n/n3254dbb5e6b1" },
    ],
    relatedSlugs: ["token", "llm", "rag"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "embedding",
    term: "埋め込み（エンベディング）",
    yomi: "うめこみ",
    en: "Embedding",
    category: "しくみ・技術",
    short:
      "文章や画像の「意味」を数値の並び（ベクトル）に変換する技術。意味が近いものは近い数値になるため、キーワードが一致しなくても「似た内容」を探せるようになる。",
    body: [
      "「経費精算のやり方」と「立て替えたお金の申請方法」は言葉こそ違いますが意味は近い——埋め込みを使うと、この2つが数値空間上で近くに配置されるため、意味ベースの検索ができます。",
      "RAG（検索拡張生成）の裏側で資料を探しているのは、たいていこの技術です。「AIが意味で検索できるのはなぜ？」の答えがこれ、と覚えておくと、社内ナレッジ検索などの仕組みを検討するときに話が早くなります。",
    ],
    links: [
      { label: "マンガでわかる！AI活用 第3話：「RAGとファインチューニング」", href: "https://note.com/aiux_unite/n/n185107973a2f" },
    ],
    relatedSlugs: ["rag", "llm"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "local-llm",
    term: "ローカルLLM",
    yomi: "ろーかるエルエルエム",
    en: "Local LLM",
    category: "しくみ・技術",
    short:
      "クラウドのAPIではなく、自分のPCや自社サーバー上で動かすLLM。データを外部に送らずに済むため、機密情報を扱う用途で注目されている。",
    body: [
      "ChatGPTやClaudeは基本的にクラウド上のAIに文章を送って使いますが、オープンなモデル（Llama、Gemmaなど）を手元のマシンで動かすのがローカルLLMです。データが社外に出ない、通信費がかからない、カスタマイズしやすいのが利点です。",
      "一方で、最高性能のクラウドモデルには賢さで及ばないこと、動かすためのマシンスペックが必要なことがトレードオフ。「機密データはローカル、それ以外はクラウド」のような使い分けが現実的な落としどころです。",
    ],
    links: [
      { label: "連載「AI時代の流行と本質」シリーズ紹介", href: "/manga/honshitsu" },
    ],
    relatedSlugs: ["llm", "fine-tuning"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "chatgpt",
    term: "ChatGPT",
    yomi: "ちゃっとじーぴーてぃー",
    en: "ChatGPT",
    category: "開発・活用",
    short:
      "OpenAI社が提供する対話型AI。2022年11月の公開をきっかけに生成AIブームが始まった、いちばん有名なAIサービス。",
    body: [
      "文章作成・要約・翻訳・企画出し・コード生成まで、チャット形式で何でも頼める汎用AIです。生成AIという言葉が一般に広まったのは間違いなくChatGPTの功績で、「AI＝ChatGPT」と認識している人も多いはず。",
      "開発者向けにはAPIも提供されており、自分のアプリにAIを組み込めます。ノンエンジニアがChatGPT APIでPythonアプリ開発に挑戦した実践録を下の記事で公開しているので、「使う側」から「作る側」への一歩を踏み出したい人はどうぞ。",
    ],
    links: [
      { label: "ノンエンジニアが挑むChatGPT APIを使ったPythonアプリ構築", href: "https://note.com/aiux_unite/n/n3d980b7ca111" },
    ],
    relatedSlugs: ["llm", "claude", "gemini"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "claude",
    term: "Claude",
    yomi: "くろーど",
    en: "Claude",
    category: "開発・活用",
    short:
      "Anthropic社が提供する対話型AI。自然で丁寧な文章力と、長い文書の読解力に定評があり、開発向けの「Claude Code」などのエコシステムも充実している。",
    body: [
      "ChatGPTと並ぶ代表的なAIアシスタントで、特に日本語の文章の自然さ、長い資料の読み込み、コーディング支援の評価が高いモデルです。このサイトのコンテンツ制作や、掲載しているゲーム・アプリの開発でも、Claudeを中心に使っています。",
      "コーディングエージェント「Claude Code」、デザイン生成、エージェント機能など周辺ツールの進化も速く、「AIに作業を任せる」体験を先取りしたい人に向いています。まずは遊びながら体感できるClaude Code Questからどうぞ。",
    ],
    links: [
      { label: "Claude Code とは（用語解説）", href: "/glossary/claude-code" },
      { label: "Claude Code Quest（遊びながら学べるRPG）", href: "/works/claude-code-quest" },
    ],
    relatedSlugs: ["claude-code", "chatgpt", "llm"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "gemini",
    term: "Gemini",
    yomi: "じぇみに",
    en: "Gemini",
    category: "開発・活用",
    short:
      "Google社が提供する対話型AI。検索やGmail、スプレッドシートなどGoogleのサービス群と連携しやすいのが最大の強み。",
    body: [
      "Googleアカウントがあればすぐ使える身近さと、Googleドキュメント・スプレッドシート・Gmailとの連携が魅力のAIです。仕事のデータがGoogleワークスペースに集まっている職場なら、最有力の選択肢になります。",
      "NotebookLMと組み合わせた業務フロー改善（DX）は、実際に現場で効果があった鉄板の組み合わせ。企画の承認フローを通すためのAI活用術など、実践例を下の記事で公開しています。",
    ],
    links: [
      { label: "賀正🎍「Gemini」×「NotebookLM」で出来るDX（業務フロー改善）", href: "https://note.com/aiux_unite/n/n24dc19c0ff2d" },
      { label: "企画(施策)の「承認フロー」を通すAI活用術", href: "https://note.com/aiux_unite/n/ndae7f58601fc" },
    ],
    relatedSlugs: ["notebooklm", "chatgpt", "ai-workflow"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "notebooklm",
    term: "NotebookLM",
    yomi: "のーとぶっくエルエム",
    en: "NotebookLM",
    category: "開発・活用",
    short:
      "Googleが提供する「自分の資料専用のAI」。アップロードした資料の内容だけにもとづいて回答するため、社内文書の理解や要約に強い。",
    body: [
      "普通のチャットAIとの違いは、「渡した資料の中身だけを根拠に答える」こと。出典も示してくれるため、ハルシネーションが起きにくく、規程集・議事録・マニュアルの読み込みといった業務用途で真価を発揮します。",
      "Geminiで作業し、NotebookLMで資料を裏取りする——この組み合わせによる業務フロー改善の実践例を下の記事で公開しています。「AIに社内のことを答えさせたい」と思ったら、まず試すべきツールです。",
    ],
    links: [
      { label: "賀正🎍「Gemini」×「NotebookLM」で出来るDX（業務フロー改善）", href: "https://note.com/aiux_unite/n/n24dc19c0ff2d" },
    ],
    relatedSlugs: ["gemini", "rag", "ai-workflow"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "midjourney",
    term: "Midjourney",
    yomi: "みっどじゃーにー",
    en: "Midjourney",
    category: "開発・活用",
    short:
      "テキストから高品質なイラスト・画像を生成できる代表的な画像生成AIサービス。アート性の高い仕上がりに定評がある。",
    body: [
      "画像生成AIの中でも、Midjourneyは「絵としての美しさ」で頭ひとつ抜けた存在です。プロンプトの書き方次第で、水彩画からアニメ調、実写風まで幅広いスタイルを出し分けられます。",
      "動画生成AIと組み合わせれば、静止画からアニメーションPVまで制作可能。Midjourneyで生成した絵を動かして漫画風動画やプロモーション映像を作る実践例を、下の記事で一部始終公開しています。",
    ],
    links: [
      { label: "【完全解説！】Midjourneyで作るアニメーションPV", href: "https://note.com/aiux_unite/n/nc925996d0652" },
      { label: "漫画風の動画を生成する！（RunwayGen-3×Midjourney×DomoAI）", href: "https://note.com/aiux_unite/n/ndc6365524f2a" },
    ],
    relatedSlugs: ["image-generation-ai", "video-generation-ai", "prompt-engineering"],
    lastUpdated: "2026-07-05",
  },
  {
    slug: "video-generation-ai",
    term: "動画生成AI",
    yomi: "どうがせいせいエーアイ",
    en: "Video Generation AI",
    category: "開発・活用",
    short:
      "テキストや画像から動画を生成するAI。SoraやRunway、Veoなどが代表例で、静止画に動きを与えるところから本格的な映像制作まで進化が続く領域。",
    body: [
      "「一枚の絵が動き出す」体験は、画像生成AIとはまた別の衝撃があります。プロンプトから直接動画を作る方法と、画像生成AIで作った絵を動かす方法があり、後者のほうがイメージをコントロールしやすいのが現状です。",
      "映像ディレクターの視点で言うと、絵コンテやストーリーボードの段階で「動くイメージ」を共有できるのが実務での最大の価値。漫画風動画やアニメーションPVを作った実践録を下の記事で公開しています。",
    ],
    links: [
      { label: "漫画風の動画を生成する！（RunwayGen-3×Midjourney×DomoAI）", href: "https://note.com/aiux_unite/n/ndc6365524f2a" },
      { label: "【AIで作る】動くストーリーボード", href: "https://note.com/aiux_unite/n/n759b5bbfe9e2" },
    ],
    relatedSlugs: ["image-generation-ai", "midjourney", "generative-ai"],
    lastUpdated: "2026-07-05",
  },
];

export const TERMS: GlossaryTerm[] = [...TERMS_BATCH1, ...TERMS_BATCH2];

export const FEATURED_TERMS = FEATURED_SLUGS.map((sl) => TERMS.find((t) => t.slug === sl)!).filter(Boolean);

export const TERM_CATEGORIES: TermCategory[] = ["基礎知識", "しくみ・技術", "開発・活用"];

export const ALL_TERMS_COUNT = TERMS.length;

export function getTerm(slug: string): GlossaryTerm | undefined {
  return TERMS.find((t) => t.slug === slug);
}
