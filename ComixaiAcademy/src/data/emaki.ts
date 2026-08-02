/* ============================================================
   AI歴史絵巻。起動時のオープニングで1コマずつ見せる。

   **このファイルは tools/sync-emaki.mjs が作る。手で編集しない。**
   直したいときはサイト側の src/app/history/eras.ts を直して、
   npm run emaki を実行すること。

   絵は assets/images/emaki/ に置いてある（サイトの public/history から
   コピーしたもの）。動画は重いので取り込んでいない。
   ============================================================ */

export interface EmakiPanel {
  /** 年（"2024-25" のような表記もある） */
  year: string;
  title: string;
  body: string;
  /** 手書きふうのツッコミ */
  hand?: string;
  /** 冬の時代か、ブームか。コマの色みを変えるのに使う */
  tone?: 'winter' | 'boom';
  /** require したコマ絵 */
  image: number;
}

export const EMAKI: EmakiPanel[] = [
  {
    year: "1950",
    title: "「機械は考えられるか？」",
    body: "数学者アラン・チューリングが論文で問いかけます。「機械が人間と区別がつかない会話をできたら、それは“考えている”と言えるのではないか」——のちに「チューリングテスト」と呼ばれる、AIのはじまりの問いです。",
    hand: "※この時点でコンピュータはまだ部屋サイズ",
    image: require('@/assets/images/emaki/1950.webp'),
  },
  {
    year: "1956",
    title: "「人工知能」という言葉が生まれる",
    body: "米ダートマス大学に研究者たちが集まり、この分野に「Artificial Intelligence（人工知能）」という名前がつきました。世界は「20年もあれば人間並みの機械ができる」と本気で信じていました。",
    hand: "※できませんでした（70年かかってもまだ）",
    image: require('@/assets/images/emaki/1956.webp'),
  },
  {
    year: "1966",
    title: "はじめてのおしゃべりAI「ELIZA」",
    body: "カウンセラーのまねをする対話プログラムELIZAが登場。仕組みは単純なオウム返しなのに、本気で心を開く人が続出しました。「人はAIに人格を感じてしまう」という発見は、いまのチャットAI時代の伏線です。",
    image: require('@/assets/images/emaki/1966.webp'),
  },
  {
    year: "1974",
    title: "第1次AI冬、到来",
    body: "「すぐ人間並みになる」という約束が果たされず、期待は失望に変わり、研究資金が凍りつきます。AIの歴史は、ブームと冬の繰り返し。この最初の冬は10年近く続きました。",
    hand: "※AI業界、一度目の氷河期",
    tone: 'winter',
    image: require('@/assets/images/emaki/1974.webp'),
  },
  {
    year: "1980s",
    title: "エキスパートシステムと、2度目の冬",
    body: "「専門家の知識をぜんぶルールとして書き込めば賢くなるはず」というエキスパートシステムが第2次ブームを起こします。しかしルールを人間が書き切れるはずもなく、ブームは再び冬へ。日本の「第五世代コンピュータ」計画もこの時代でした。",
    tone: 'winter',
    image: require('@/assets/images/emaki/1980s.webp'),
  },
  {
    year: "1997",
    title: "チェス王者、機械に敗れる",
    body: "IBMのディープ・ブルーが、チェス世界王者カスパロフに勝利。「機械が人間の知性の象徴を破った」と世界に衝撃が走りました。ただしこれは力まかせの探索の勝利で、「学習するAI」の時代はまだ先です。",
    image: require('@/assets/images/emaki/1997.webp'),
  },
  {
    year: "2012",
    title: "ディープラーニング革命",
    body: "画像認識コンテストで、ヒントン教授らのチームが深層学習（ディープラーニング）を使って圧勝。「データから特徴を自分で学ぶ」この技術が、長い冬を終わらせました。ここから現代AIの直系の歴史が始まります。",
    tone: 'boom',
    image: require('@/assets/images/emaki/2012.webp'),
  },
  {
    year: "2016",
    title: "AlphaGo、囲碁で人間を超える",
    body: "「囲碁だけは、あと10年は人間が勝つ」——その予想を裏切り、Google DeepMindのAlphaGoがトップ棋士イ・セドルに勝利。人間が思いつかない一手「37手目」は、AIが人間の直感を超えうることを見せつけました。",
    image: require('@/assets/images/emaki/2016.webp'),
  },
  {
    year: "2017",
    title: "運命の論文「Attention Is All You Need」",
    body: "Googleの研究者たちが「トランスフォーマー」という新しい仕組みを発表。単語同士の関係に“注目”するこの設計が、のちのChatGPTもClaudeもGeminiも、ぜんぶの土台になりました。タイトルの意味は「注目こそすべて」。",
    tone: 'boom',
    image: require('@/assets/images/emaki/2017.webp'),
  },
  {
    year: "2020",
    title: "GPT-3——「デカくしたら、賢くなった」",
    body: "モデルとデータをとにかく巨大にしたGPT-3が登場し、翻訳も作文も雑談もこなす汎用性で研究者を驚かせます。「スケールさせるほど賢くなる」という発見が、その後の大規模言語モデル（LLM）競争の号砲になりました。",
    image: require('@/assets/images/emaki/2020.webp'),
  },
  {
    year: "2022",
    title: "ChatGPT、世界を変えた2ヶ月",
    body: "11月30日、OpenAIがChatGPTを公開。誰でも無料で試せるAIチャットは、わずか2ヶ月で月間ユーザー1億人に到達しました。AIが研究室から、世界中の日常へ。「生成AI」という言葉が一気に広まります。",
    hand: "※人類史上最速で普及したアプリと言われた",
    tone: 'boom',
    image: require('@/assets/images/emaki/2022.webp'),
  },
  {
    year: "2023",
    title: "生成AI元年——絵も動画も",
    body: "MidjourneyやStable Diffusionが「言葉から絵を生む」を当たり前にし、GPT-4やClaudeが長文読解・推論で人間の仕事に食い込み始めます。世界中の企業が「AIをどう使うか」を真剣に考え始めた年です。",
    image: require('@/assets/images/emaki/2023.webp'),
  },
  {
    year: "2024-25",
    title: "エージェント時代のはじまり",
    body: "AIは「聞けば答える」から「任せれば働く」へ。自分で計画してツールを使うAIエージェント、会話でアプリを作るバイブコーディング、AIとツールをつなぐMCP——働き方の前提が変わり始めました。",
    tone: 'boom',
    image: require('@/assets/images/emaki/2024-25.webp'),
  },
  {
    year: "2026",
    title: "そして、いま。",
    body: "75年前の「機械は考えられるか？」という問いは、「機械と、どう働くか？」に変わりました。この絵巻の続きを描くのは、いまAIを学び、使い、ツッコミを入れているあなたです。",
    hand: "※ちなみにこのサイトも、人間とAIの共作です",
    image: require('@/assets/images/emaki/2026.webp'),
  },
];
