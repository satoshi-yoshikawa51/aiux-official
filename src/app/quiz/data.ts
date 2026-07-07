/* ============================================================
   AI用語力診断クイズのデータ。
   ・問題は用語集(glossary)の30語と1対1対応。termSlugで用語
     ページにリンクし、クイズ→用語集の導線を作る。
   ・毎回 各レベルから4問ずつ計12問を出題（player.tsxで抽選）。
   ・選択肢の並びは出題時にシャッフルされるので、answerは
     choices配列のインデックスで指定する。
   ============================================================ */

export interface QuizQuestion {
  termSlug: string;
  level: 1 | 2 | 3; // 1=基礎 2=しくみ 3=活用
  q: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
}

export const QUESTIONS: QuizQuestion[] = [
  /* —— レベル1：基礎知識 —— */
  {
    termSlug: "generative-ai",
    level: 1,
    q: "「生成AI」が、それまでのAIと決定的に違う点は？",
    choices: [
      "計算スピードが速い",
      "文章や画像を「新しく作り出せる」",
      "電気をほとんど使わない",
      "答えが必ず正しい",
    ],
    answer: 1,
    explanation: "従来のAIは「分類・予測」が主戦場。生成AIは文章・画像・音声などを新しく生み出せるのが革命でした。",
  },
  {
    termSlug: "llm",
    level: 1,
    q: "ChatGPTやClaudeの頭脳にあたる「LLM」。日本語で言うと？",
    choices: ["大規模言語モデル", "論理学習マシン", "長文読解メモリ", "軽量ローカルモジュール"],
    answer: 0,
    explanation: "Large Language Model＝大規模言語モデル。膨大なテキストを学習し、言葉を理解・生成するAIモデルです。",
  },
  {
    termSlug: "prompt-engineering",
    level: 1,
    q: "AIへの指示（プロンプト）で、答えの精度が一番上がるのはどれ？",
    choices: [
      "「いい感じにやって」と男気で任せる",
      "役割・目的・条件・出力形式を具体的に伝える",
      "同じ質問を10回連続で送る",
      "すべて大文字の英語で書く",
    ],
    answer: 1,
    explanation: "これがプロンプトエンジニアリング。「新人に仕事を頼むときの伝え方」と同じで、具体的なほど精度が上がります。",
  },
  {
    termSlug: "hallucination",
    level: 1,
    q: "AIが実在しない判例や論文を、自信満々に答えてしまう現象は？",
    choices: ["オーバーフロー", "シンギュラリティ", "ハルシネーション", "ファインチューニング"],
    answer: 2,
    explanation: "ハルシネーション（幻覚）。AIは「それらしい続き」を作る仕組みなので、堂々とウソをつくことがあります。事実確認は人間の仕事。",
  },
  {
    termSlug: "machine-learning",
    level: 1,
    q: "「機械学習」が従来のプログラミングと違うのは？",
    choices: [
      "人間がルールを全部書く代わりに、データからパターンを学ぶ",
      "プログラムを書く必要が一切ない",
      "電卓より計算が遅くなる",
      "必ず人間より賢くなる",
    ],
    answer: 0,
    explanation: "「もし◯◯なら△△」を人間が書き切れない問題でも、大量のデータから機械が自分でパターンを見つけるのが機械学習です。",
  },
  {
    termSlug: "deep-learning",
    level: 1,
    q: "ディープラーニングの「ディープ（深い）」が指しているものは？",
    choices: [
      "思考の哲学的な深さ",
      "ニューラルネットワークの層の深さ",
      "海底データセンターの深度",
      "学習にかける時間の長さ",
    ],
    answer: 1,
    explanation: "入力と出力のあいだに「層」を何段も重ねるほど複雑なパターンを学べる。この層の深さが「ディープ」の由来です。",
  },
  {
    termSlug: "multimodal-ai",
    level: 1,
    q: "「マルチモーダルAI」ができることは？",
    choices: [
      "テキストだけを超高速で処理する",
      "複数のアプリを同時に起動する",
      "複数言語の翻訳だけに特化する",
      "テキスト・画像・音声などをまとめて理解・生成する",
    ],
    answer: 3,
    explanation: "モーダル＝情報の種類。スクショを見せて「これ直して」が通じるのは、テキストと画像をまとめて扱えるからです。",
  },
  {
    termSlug: "agi",
    level: 1,
    q: "AGI（汎用人工知能）の説明として正しいのは？",
    choices: [
      "特定のタスク専用に作られたAI",
      "農業（Agriculture）専用のAI",
      "人間のように未知の課題にも柔軟に対応できるAI",
      "画像の生成だけが得意なAI",
    ],
    answer: 2,
    explanation: "いまのAIは「得意分野が決まっている」特化型。初めての課題にも人間のように対応できる汎用型がAGIです。",
  },
  {
    termSlug: "singularity",
    level: 1,
    q: "「シンギュラリティ」とは何のこと？",
    choices: [
      "AIの知能が人間を超えるとされる転換点",
      "AIが一斉に停止する現象",
      "AI同士の対戦イベント",
      "1台のPCで動く最小のAI",
    ],
    answer: 0,
    explanation: "技術的特異点。AIが自分より賢いAIを作れるようになると進化が一気に加速する——その転換点を指す言葉です。",
  },
  {
    termSlug: "ai-literacy",
    level: 1,
    q: "「AIリテラシーがある人」の行動として正しいのは？",
    choices: [
      "AIの答えはすべて信じてそのまま使う",
      "AIの答えを事実確認してから使う",
      "間違いが怖いのでAIには一切触れない",
      "機密情報もどんどん入力して効率化する",
    ],
    answer: 1,
    explanation: "任せる・確かめる・配慮する、のバランスが取れているのがAIリテラシー。鵜呑みも拒絶も、どちらも不正解です。",
  },
  /* —— レベル2：しくみ・技術 —— */
  {
    termSlug: "rag",
    level: 2,
    q: "社内規程について正確に答えるAIがほしい。AIに資料を検索させて、根拠つきで答えさせるしくみは？",
    choices: ["OCR", "VPN", "RAG", "OJT"],
    answer: 2,
    explanation: "RAG（検索拡張生成）。AIに「カンニングペーパー」を渡すイメージで、ハルシネーション対策の定番です。",
  },
  {
    termSlug: "fine-tuning",
    level: 2,
    q: "自社データでAIモデル自体を追加学習させて、口調や専門知識を身につけさせる手法は？",
    choices: ["ファインチューニング", "プロンプトエンジニアリング", "スクリーンショット", "インストール"],
    answer: 0,
    explanation: "モデルそのものを追加学習で調整するのがファインチューニング。資料を検索させるRAGとの使い分けが定番の論点です。",
  },
  {
    termSlug: "ai-agent",
    level: 2,
    q: "「ゴールだけ伝えると、計画→ツール操作→修正まで自分で進めてくれるAI」を指す言葉は？",
    choices: ["チャットボット", "AIエージェント", "スクリーンセーバー", "ウィジェット"],
    answer: 1,
    explanation: "1問1答で終わるチャットボットと違い、自律的にタスクを進めるのがエージェント。「代理人」という意味です。",
  },
  {
    termSlug: "mcp",
    level: 2,
    q: "AIと外部ツール（デザインツールやデータベースなど）をつなぐ共通規格「MCP」。何に例えられる？",
    choices: ["AI界の冷却ファン", "AI界の電源ボタン", "AI界の液晶画面", "AI界のUSB端子"],
    answer: 3,
    explanation: "どのツールも同じ差し込み口でAIにつながる——という意味で「AI界のUSB」と呼ばれます。Anthropicが提唱した規格です。",
  },
  {
    termSlug: "neural-network",
    level: 2,
    q: "ニューラルネットワークが仕組みを真似しているものは？",
    choices: ["蟻の行列", "脳の神経細胞のつながり", "電話の交換機", "蜘蛛の巣の形"],
    answer: 1,
    explanation: "ニューロン＝神経細胞。信号が神経のつながりを伝わっていく様子を数式で再現したのがニューラルネットワークです。",
  },
  {
    termSlug: "transformer",
    level: 2,
    q: "ChatGPTの「T」の由来でもある「トランスフォーマー」。その中核のしくみは？",
    choices: [
      "変圧器による省エネ設計",
      "ロボットへの変形機構",
      "単語同士の関係に「注目」するアテンション",
      "超高速の四則演算",
    ],
    answer: 2,
    explanation: "文中のどの単語同士が関係するかに注目（アテンション）して意味を掴む。2017年の論文以来、生成AIの土台です。",
  },
  {
    termSlug: "token",
    level: 2,
    q: "AIの料金表にある「100万トークンあたり◯円」。この「トークン」とは？",
    choices: [
      "AI専用の仮想通貨",
      "ログイン用の合言葉",
      "ゲーム内で使えるコイン",
      "AIが文章を処理するときの分割単位",
    ],
    answer: 3,
    explanation: "AIは文章をトークンという細かい単位に刻んで処理します。料金も文字数制限も、すべてトークン数で決まります。",
  },
  {
    termSlug: "context-window",
    level: 2,
    q: "長い会話の終盤、AIが序盤の指示を忘れてしまった。関係しているのは？",
    choices: [
      "コンテキストウィンドウの上限",
      "Wi-Fiの電波状況",
      "モニターの解像度",
      "キーボードの電池残量",
    ],
    answer: 0,
    explanation: "AIが一度に覚えていられる量（＝作業机の広さ）には上限があり、あふれた分は「忘れた」ように振る舞います。",
  },
  {
    termSlug: "embedding",
    level: 2,
    q: "「経費精算」と「立て替えの申請」が“意味が近い”と、数値の距離で測れるようにする技術は？",
    choices: ["圧縮", "埋め込み（エンベディング）", "暗号化", "コピー＆ペースト"],
    answer: 1,
    explanation: "言葉の意味を数値（ベクトル）に変換するのが埋め込み。RAGの検索も「意味が近い資料を探す」ことで動いています。",
  },
  {
    termSlug: "local-llm",
    level: 2,
    q: "自分のPCやサーバー上でAIを動かす「ローカルLLM」。一番のメリットは？",
    choices: [
      "クラウドより必ず高性能になる",
      "電気代がかからない",
      "データを外部に送らず手元で完結できる",
      "インターネットが速くなる",
    ],
    answer: 2,
    explanation: "機密データを外に出せない現場での選択肢。性能はクラウドの最上位モデルに劣ることが多いので、使い分けが大事です。",
  },
  /* —— レベル3：開発・活用 —— */
  {
    termSlug: "claude-code",
    level: 3,
    q: "「Claude Code」の説明として正しいのは？",
    choices: [
      "画像を生成するサービス",
      "日本語で指示すると、アプリの実装からデプロイまで進めてくれるコーディングエージェント",
      "パスワードを管理するツール",
      "動画を編集するアプリ",
    ],
    answer: 1,
    explanation: "このサイト自体もClaude Codeで作られています。非エンジニアでも「作りたいもの」を言葉で伝えれば形になる時代です。",
  },
  {
    termSlug: "vibe-coding",
    level: 3,
    q: "2025年ごろから流行した「バイブコーディング」とは？",
    choices: [
      "音楽を聴きながらコードを書くこと",
      "振動デバイスのアプリを開発すること",
      "深夜テンションでハッカソンに出ること",
      "細かい実装はAIに任せ、ノリと会話でアプリを作るスタイル",
    ],
    answer: 3,
    explanation: "vibe＝ノリ・雰囲気。仕様書よりも「こんな感じで」の対話でものを作る、AI時代の開発スタイルです。",
  },
  {
    termSlug: "image-generation-ai",
    level: 3,
    q: "「夕焼けの海辺を歩く猫」と入力すると絵ができる。このようなAIの総称は？",
    choices: ["画像生成AI", "OCR", "画像圧縮AI", "顔認証AI"],
    answer: 0,
    explanation: "テキスト（プロンプト）から画像を生み出すAI。Midjourney、DALL·E、Stable Diffusionなどが代表格です。",
  },
  {
    termSlug: "ai-workflow",
    level: 3,
    q: "「AIワークフロー」の説明として一番近いのは？",
    choices: [
      "AIに1回だけ質問して終わること",
      "AIの電源を入れる手順書のこと",
      "複数の工程をAIと役割分担して、流れ作業として組むこと",
      "AI搭載の勤怠管理システムのこと",
    ],
    answer: 2,
    explanation: "「情報収集はA、下書きはB、チェックは人間」のように工程を設計するとAIの真価が出ます。単発質問との一番の違いです。",
  },
  {
    termSlug: "chatgpt",
    level: 3,
    q: "ChatGPTを開発・提供している会社は？",
    choices: ["OpenAI", "Anthropic", "Google", "Meta"],
    answer: 0,
    explanation: "2022年11月のChatGPT公開が、いまの生成AIブームの起点。開発元はOpenAI社です。",
  },
  {
    termSlug: "claude",
    level: 3,
    q: "Claudeの特徴としてよく挙げられるのは？",
    choices: [
      "自然で丁寧な文章力と長文読解、開発向けエコシステムの充実",
      "画像しか扱えないこと",
      "日本語に対応していないこと",
      "オフライン専用であること",
    ],
    answer: 0,
    explanation: "Anthropic社の対話型AI。文章の自然さと長い資料の読解に定評があり、Claude Codeなど開発ツールも充実しています。",
  },
  {
    termSlug: "gemini",
    level: 3,
    q: "Geminiを開発・提供している会社は？",
    choices: ["Google", "OpenAI", "Apple", "Amazon"],
    answer: 0,
    explanation: "Google製。検索やGmail、スプレッドシートなどGoogleのサービス群と連携できるのが強みです。",
  },
  {
    termSlug: "notebooklm",
    level: 3,
    q: "「NotebookLM」の特徴として正しいのは？",
    choices: [
      "インターネット全体を検索して答える",
      "渡した資料の中身だけを根拠に、出典つきで答える",
      "動画を自動で生成する",
      "作曲ができる",
    ],
    answer: 1,
    explanation: "資料の外のことは答えないので、ハルシネーションが起きにくい。議事録・規程・PDFの読み込み相棒として優秀です。",
  },
  {
    termSlug: "midjourney",
    level: 3,
    q: "画像生成AI「Midjourney」が特に得意とするのは？",
    choices: [
      "表計算の自動化",
      "音声の文字起こし",
      "アート性の高い美しい画像の生成",
      "ウイルスの検出と除去",
    ],
    answer: 2,
    explanation: "「絵としての美しさ」で頭ひとつ抜けた存在。プロンプト次第で水彩画からアニメ調、実写風まで出し分けられます。",
  },
  {
    termSlug: "video-generation-ai",
    level: 3,
    q: "「動画生成AI」の説明として正しいのは？",
    choices: [
      "テキストや画像から、動く映像を生成する",
      "動画の再生速度を自動で上げる",
      "DVDをダビングする",
      "画面を録画して保存する",
    ],
    answer: 0,
    explanation: "SoraやRunwayなどが代表格。1枚の絵からアニメーションPVを作る、といった使い方が現実になっています。",
  },
];

/* —— 判定（12問中の正解数で決まる） —— */
export interface QuizGrade {
  slug: string;
  min: number; // この正解数以上でこの級
  emoji: string;
  image: string; // 級キャラのイラスト（public/quiz/grades/）
  title: string;
  comment: string;
  share: string; // シェア文言のベース
}

export const GRADES: QuizGrade[] = [
  {
    slug: "hiyoko",
    image: "/quiz/grades/hiyoko.webp",
    min: 0,
    emoji: "🐣",
    title: "AIヒヨコ級",
    comment: "これから伸びしろMAX！ニュースでよく見る言葉から、マンガと用語集でゆっくり覚えていきましょう。",
    share: "判定は【AIヒヨコ級】🐣 でした。これから伸びしろMAX！",
  },
  {
    slug: "minarai",
    image: "/quiz/grades/minarai.webp",
    min: 4,
    emoji: "📖",
    title: "AI見習い級",
    comment: "基礎はもう身についています。ニュースの見出しはこわくないはず。しくみ系の用語を覚えると一気に景色が変わります。",
    share: "判定は【AI見習い級】📖 でした。基礎はばっちり！",
  },
  {
    slug: "tsukaite",
    image: "/quiz/grades/tsukaite.webp",
    min: 7,
    emoji: "⚡",
    title: "AI使い級",
    comment: "現場でAIを使いこなし始めているレベル。RAGやエージェントを語れれば、社内のAI推進役はあなたです。",
    share: "判定は【AI使い級】⚡ でした。現場で使いこなすレベル！",
  },
  {
    slug: "master",
    image: "/quiz/grades/master.webp",
    min: 10,
    emoji: "🔥",
    title: "AIマスター級",
    comment: "職場で「AIといえばあなた」と呼ばれているのでは？あと一歩で全問正解。間違えた用語だけ復習すれば完璧です。",
    share: "判定は【AIマスター級】🔥 でした。あと一歩で全問正解！",
  },
  {
    slug: "kenja",
    image: "/quiz/grades/kenja.webp",
    min: 12,
    emoji: "👑",
    title: "AI賢者級",
    comment: "全問正解！もはや解説する側です。このサイトの用語集より詳しいかもしれない…連載を手伝ってほしいくらいです。",
    share: "まさかの全問正解で【AI賢者級】👑 でした。解説する側です。",
  },
];

export const QUIZ_SIZE = 12; // 各レベルから4問ずつ

export function gradeFor(score: number): QuizGrade {
  return [...GRADES].reverse().find((g) => score >= g.min) ?? GRADES[0];
}

export function getGrade(slug: string): QuizGrade | undefined {
  return GRADES.find((g) => g.slug === slug);
}
