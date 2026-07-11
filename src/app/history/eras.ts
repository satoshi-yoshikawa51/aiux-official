/* ============================================================
   AI歴史絵巻の年表データ。AI司書（/api/search）のコーパスとしても使う。
   ============================================================ */

export interface Era {
  year: string;
  title: string;
  scene: string; // 絵文字のコマ（画像が来るまでのプレースホルダ）
  image?: string; // 主人公キャラのシーン画像（public/history/ に置いたら差し替わる）
  video?: string; // シーン動画（あれば画像より優先。imageはposter兼フォールバックに使う）
  body: string;
  hand?: string; // 手書きふうツッコミ
  terms?: { label: string; slug: string }[];
  tone?: "winter" | "boom";
  fx: string; // パーティクルのモード（emaki-fx.tsx参照）
  tint: string; // 時代の色ガラス
}

export const ERAS: Era[] = [
  {
    year: "1950",
    image: "/history/1950.webp",
    video: "/history/1950.mp4",
    fx: "dust", tint: "linear-gradient(180deg,#ead9b8,#c0a878)",
    title: "「機械は考えられるか？」",
    scene: "🤔💭🖥️",
    body: "数学者アラン・チューリングが論文で問いかけます。「機械が人間と区別がつかない会話をできたら、それは“考えている”と言えるのではないか」——のちに「チューリングテスト」と呼ばれる、AIのはじまりの問いです。",
    hand: "※この時点でコンピュータはまだ部屋サイズ",
  },
  {
    year: "1956",
    image: "/history/1956.webp",
    video: "/history/1956.mp4",
    fx: "dust", tint: "linear-gradient(180deg,#ead9b8,#c0a878)",
    title: "「人工知能」という言葉が生まれる",
    scene: "🎓🤝📛",
    body: "米ダートマス大学に研究者たちが集まり、この分野に「Artificial Intelligence（人工知能）」という名前がつきました。世界は「20年もあれば人間並みの機械ができる」と本気で信じていました。",
    hand: "※できませんでした（70年かかってもまだ）",
  },
  {
    year: "1966",
    image: "/history/1966.webp",
    video: "/history/1966.mp4",
    fx: "dust", tint: "linear-gradient(180deg,#eaddc0,#cdbb90)",
    title: "はじめてのおしゃべりAI「ELIZA」",
    scene: "💬🤖👩‍⚕️",
    body: "カウンセラーのまねをする対話プログラムELIZAが登場。仕組みは単純なオウム返しなのに、本気で心を開く人が続出しました。「人はAIに人格を感じてしまう」という発見は、いまのチャットAI時代の伏線です。",
  },
  {
    year: "1974",
    image: "/history/1974.webp",
    video: "/history/1974.mp4",
    fx: "snow", tint: "linear-gradient(180deg,#cfe0ff,#84a8e8)",
    title: "第1次AI冬、到来",
    scene: "❄️🥶📉",
    body: "「すぐ人間並みになる」という約束が果たされず、期待は失望に変わり、研究資金が凍りつきます。AIの歴史は、ブームと冬の繰り返し。この最初の冬は10年近く続きました。",
    tone: "winter",
    hand: "※AI業界、一度目の氷河期",
  },
  {
    year: "1980s",
    image: "/history/1980s.webp",
    video: "/history/1980s.mp4",
    fx: "snow", tint: "linear-gradient(180deg,#cfe0ff,#84a8e8)",
    title: "エキスパートシステムと、2度目の冬",
    scene: "🏭📚❄️",
    body: "「専門家の知識をぜんぶルールとして書き込めば賢くなるはず」というエキスパートシステムが第2次ブームを起こします。しかしルールを人間が書き切れるはずもなく、ブームは再び冬へ。日本の「第五世代コンピュータ」計画もこの時代でした。",
    tone: "winter",
  },
  {
    year: "1997",
    image: "/history/1997.webp",
    video: "/history/1997.mp4",
    fx: "stones", tint: "linear-gradient(180deg,#dde4f0,#9fb2d0)",
    title: "チェス王者、機械に敗れる",
    scene: "♟️🤖🏆",
    body: "IBMのディープ・ブルーが、チェス世界王者カスパロフに勝利。「機械が人間の知性の象徴を破った」と世界に衝撃が走りました。ただしこれは力まかせの探索の勝利で、「学習するAI」の時代はまだ先です。",
  },
  {
    year: "2012",
    image: "/history/2012.webp",
    video: "/history/2012.mp4",
    fx: "spark", tint: "linear-gradient(180deg,#ffedb8,#eec25e)",
    title: "ディープラーニング革命",
    scene: "🧠⚡📸",
    body: "画像認識コンテストで、ヒントン教授らのチームが深層学習（ディープラーニング）を使って圧勝。「データから特徴を自分で学ぶ」この技術が、長い冬を終わらせました。ここから現代AIの直系の歴史が始まります。",
    terms: [
      { label: "ディープラーニングとは", slug: "deep-learning" },
      { label: "ニューラルネットワークとは", slug: "neural-network" },
    ],
    tone: "boom",
  },
  {
    year: "2016",
    image: "/history/2016.webp",
    video: "/history/2016.mp4",
    fx: "stones", tint: "linear-gradient(180deg,#e4ece4,#b0c4b0)",
    title: "AlphaGo、囲碁で人間を超える",
    scene: "⚫⚪😱",
    body: "「囲碁だけは、あと10年は人間が勝つ」——その予想を裏切り、Google DeepMindのAlphaGoがトップ棋士イ・セドルに勝利。人間が思いつかない一手「37手目」は、AIが人間の直感を超えうることを見せつけました。",
  },
  {
    year: "2017",
    image: "/history/2017.webp",
    video: "/history/2017.mp4",
    fx: "network", tint: "linear-gradient(180deg,#ded2ff,#a390e8)",
    title: "運命の論文「Attention Is All You Need」",
    scene: "📄✨🔮",
    body: "Googleの研究者たちが「トランスフォーマー」という新しい仕組みを発表。単語同士の関係に“注目”するこの設計が、のちのChatGPTもClaudeもGeminiも、ぜんぶの土台になりました。タイトルの意味は「注目こそすべて」。",
    terms: [{ label: "トランスフォーマーとは", slug: "transformer" }],
    tone: "boom",
  },
  {
    year: "2020",
    image: "/history/2020.webp",
    video: "/history/2020.mp4",
    fx: "spark", tint: "linear-gradient(180deg,#ffedb8,#eec25e)",
    title: "GPT-3——「デカくしたら、賢くなった」",
    scene: "📈🐘💬",
    body: "モデルとデータをとにかく巨大にしたGPT-3が登場し、翻訳も作文も雑談もこなす汎用性で研究者を驚かせます。「スケールさせるほど賢くなる」という発見が、その後の大規模言語モデル（LLM）競争の号砲になりました。",
    terms: [{ label: "LLMとは", slug: "llm" }],
  },
  {
    year: "2022",
    image: "/history/2022.webp",
    video: "/history/2022.mp4",
    fx: "confetti", tint: "linear-gradient(180deg,#ffe4c0,#ffb870)",
    title: "ChatGPT、世界を変えた2ヶ月",
    scene: "🚀🌍💥",
    body: "11月30日、OpenAIがChatGPTを公開。誰でも無料で試せるAIチャットは、わずか2ヶ月で月間ユーザー1億人に到達しました。AIが研究室から、世界中の日常へ。「生成AI」という言葉が一気に広まります。",
    terms: [
      { label: "ChatGPTとは", slug: "chatgpt" },
      { label: "生成AIとは", slug: "generative-ai" },
    ],
    tone: "boom",
    hand: "※人類史上最速で普及したアプリと言われた",
  },
  {
    year: "2023",
    image: "/history/2023.webp",
    video: "/history/2023.mp4",
    fx: "confetti", tint: "linear-gradient(180deg,#ffdce8,#ffa8c4)",
    title: "生成AI元年——絵も動画も",
    scene: "🎨🎬🎵",
    body: "MidjourneyやStable Diffusionが「言葉から絵を生む」を当たり前にし、GPT-4やClaudeが長文読解・推論で人間の仕事に食い込み始めます。世界中の企業が「AIをどう使うか」を真剣に考え始めた年です。",
    terms: [
      { label: "画像生成AIとは", slug: "image-generation-ai" },
      { label: "Midjourneyとは", slug: "midjourney" },
    ],
  },
  {
    year: "2024-25",
    image: "/history/2024-25.webp",
    video: "/history/2024-25.mp4",
    fx: "code", tint: "linear-gradient(180deg,#cdeef8,#7cc4dd)",
    title: "エージェント時代のはじまり",
    scene: "🤖🛠️🏃",
    body: "AIは「聞けば答える」から「任せれば働く」へ。自分で計画してツールを使うAIエージェント、会話でアプリを作るバイブコーディング、AIとツールをつなぐMCP——働き方の前提が変わり始めました。",
    terms: [
      { label: "AIエージェントとは", slug: "ai-agent" },
      { label: "バイブコーディングとは", slug: "vibe-coding" },
      { label: "MCPとは", slug: "mcp" },
    ],
    tone: "boom",
  },
  {
    year: "2026",
    image: "/history/2026.webp",
    video: "/history/2026.mp4",
    fx: "sparkle", tint: "linear-gradient(180deg,#fff2c8,#ffd268)",
    title: "そして、いま。",
    scene: "🧑‍💻🤝🤖",
    body: "75年前の「機械は考えられるか？」という問いは、「機械と、どう働くか？」に変わりました。この絵巻の続きを描くのは、いまAIを学び、使い、ツッコミを入れているあなたです。",
    hand: "※ちなみにこのサイトも、人間とAIの共作です",
  },
];
