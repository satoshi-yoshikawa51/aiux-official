/* ============================================================
   /compare の比較表データ。AI司書（/api/search）のコーパスとしても使う。
   方針：特定ベンダーを持ち上げない。強みも制約も事実ベースで書く。
   ============================================================ */

export const ROWS: { label: string; gpt: string; claude: string; gemini: string }[] = [
  { label: "提供元", gpt: "OpenAI", claude: "Anthropic", gemini: "Google" },
  { label: "ひとことで", gpt: "機能の百貨店", claude: "文章の職人", gemini: "Google連携の申し子" },
  {
    label: "最新モデル",
    gpt: "GPT-6 Astra（9月登場の最上位。チャットでは「GPT-6 Pro」としてPro以上）／普段使いはGPT-5.6系",
    claude: "Claude Fable 5.1（9月登場の最上位）／Opus 4.8／Sonnet 5",
    gemini: "Gemini 3.8 Flash（無料でも触れる新型）／3.1 Pro（プレビュー）／動画のOmni 1.1",
  },
  {
    label: "得意なこと",
    gpt: "数学・科学系ベンチマークとPC自動操作は現在最高峰。画像・音声など機能の幅も一番",
    claude: "自然で丁寧な日本語、長文読解、コーディング支援（Claude Code。独立系指標で首位級）",
    gemini: "動画生成（Omni）は3社で頭ひとつ抜けている。検索・Gmail・スプレッドシートとの連携",
  },
  {
    label: "スタイル",
    gpt: "何でも屋の万能ナイフ",
    claude: "落ち着いた文体と長い文脈の理解が持ち味",
    gemini: "普段の仕事道具に溶け込むタイプ",
  },
  {
    label: "個人の有料プラン",
    gpt: "Go 約1,400円／Plus 約3,000円／Pro 上位（GPT-6 Proはここから）",
    claude: "Pro 約3,000円／Max 上位（Fable 5.1はクレジット制・枠制限つき）",
    gemini: "AI Plus 1,200円／AI Pro 2,900円／Ultra 上位（Omniの動画はここが本番）",
  },
  {
    label: "こんな人に",
    gpt: "まず1つ選ぶならこれ、という定番が欲しい人。最高峰の推論を試したい人",
    claude: "文章の質にこだわる人、長い資料を扱う人、開発者",
    gemini: "仕事がGoogle Workspace中心の人、動画を作りたい人",
  },
];

/* 料金プラン一覧（2026年9月時点・税込目安）。
   為替・改定で変わるため「目安」表記を崩さないこと */
export const PRICING: { service: string; color: string; plans: { name: string; price: string; note: string }[] }[] = [
  {
    service: "ChatGPT",
    color: "var(--ink-900)",
    plans: [
      { name: "Free", price: "0円", note: "GPT-5.6系を回数制限つきで。まず触るならここから" },
      { name: "Go", price: "約1,400円/月", note: "低価格プラン。広告つきで利用枠を拡大、日常使いの入口" },
      { name: "Plus", price: "約3,000円/月", note: "個人の定番。GPT-6 AstraはChatGPT Work・Codex経由で利用可（チャット画面のGPT-6 Proは対象外）" },
      { name: "Pro", price: "上位（数万円/月）", note: "最上位。チャットでGPT-6 Proを週あたり回数制限つきで利用できる" },
    ],
  },
  {
    service: "Claude",
    color: "var(--red-600)",
    plans: [
      { name: "Free", price: "0円", note: "回数制限つき。文章の質はここでも体感できる（Fable系は対象外）" },
      { name: "Pro", price: "約3,000円/月", note: "個人の定番。Fable 5.1は使った分だけのクレジット制で追加利用" },
      { name: "Max", price: "上位（数万円/月）", note: "Fable 5.1を標準搭載（週間上限の50%まで。超えたらクレジット制）。Claude Codeを使い込むならここ" },
    ],
  },
  {
    service: "Gemini",
    color: "var(--blue-600)",
    plans: [
      { name: "無料版", price: "0円", note: "Gemini本体（3.8 Flash系）＋Google検索のAIモードの一部" },
      { name: "AI Plus", price: "1,200円/月", note: "低価格の入口プラン" },
      { name: "AI Pro", price: "2,900円/月", note: "個人の定番。Gemini上位モデル＋Workspace連携強化" },
      { name: "AI Ultra", price: "14,500円〜/月", note: "Gemini Omni 1.1の動画生成（4Kアップスケール等）を使い込む人向け" },
    ],
  },
];

/* 「どっちがいい？」FAQ（FAQPage構造化データにも使う） */
export const COMPARE_FAQ: { q: string; a: string }[] = [
  {
    q: "ChatGPTとClaude、結局どっちがいい？",
    a: "機能の幅と情報量ならChatGPT、日本語の文章品質と長文読解ならClaude、が2026年9月時点でも大きな構図です。メール・資料など「書く仕事」が中心ならClaude、画像・音声など何でも1つで済ませたいならChatGPTから試すのがおすすめです。最上位モデル同士（GPT-6 AstraとClaude Fable 5.1）は分野で勝ち負けが分かれる接戦で、日常用途では差を体感しにくい水準です。",
  },
  {
    q: "GPT-6 AstraとClaude Fable 5.1は、どっちが賢い？",
    a: "分野によります。両社が共通で公表したベンチマーク（数学・科学・PC自動操作など）ではGPT-6 Astraが優勢、エージェント型コーディングの独立系指標（Artificial Analysis）ではClaude Code上のFable 5.1が僅差の首位——ただし実行環境が異なるため、この差は割り引いて読むべきです。API価格は両者同じで、どちらも上位プラン中心・回数やクレジットの制限つき。「用途で選ぶ」が正解で、勝者を1つ決める必要はありません。",
  },
  {
    q: "無料版だけでも仕事に使えますか？",
    a: "使えます。3サービスとも無料枠があり、メール下書き・要約・Excel数式などの定番用途は無料版で十分に体感できます。ただしGPT-6 AstraやClaude Fable 5.1といった最上位モデルは無料枠の対象外です。毎日使うようになって回数制限が邪魔になったら、月1,200〜3,000円の有料プランを検討すれば遅くありません。",
  },
  {
    q: "有料にするならどのプランが定番？",
    a: "個人なら各社の月3,000円前後のプラン（ChatGPT Plus／Claude Pro／Gemini AI Pro）が定番です。まず無料で3つを触り比べて、一番よく使うものだけ課金するのが失敗しないパターン。ただし最上位モデルを目当てにするなら注意——GPT-6 Pro（チャット）はPro以上、Fable 5.1はクレジット制が基本で、定番プランだけでは使い放題になりません。",
  },
  {
    q: "料金や性能はすぐ変わるのでは？",
    a: "変わります。実際2026年9月の第1週だけで、Claude Fable 5.1とGPT-6 Astraが相次いで登場しました。道具の操作ではなく、プロンプトの書き方やAIの性質という共通スキルを身につけておけば、モデルやプランが変わっても対応できますし、乗り換えのコストもほぼゼロで済みます。",
  },
];

export const COMPARE_UPDATED = "2026-09-06";

export const USES: {
  /** Phosphorのアイコン名（例: ph-pencil-simple-line） */
  icon: string;
  use: string;
  pick: string;
  why: string;
}[] = [
  { icon: "ph-pencil-simple-line", use: "メール・記事・企画書などの文章", pick: "Claude", why: "日本語の自然さと文体の安定感。長文の読み込みにも強い" },
  { icon: "ph-chart-bar", use: "Gmail・スプレッドシートと連携した作業", pick: "Gemini", why: "Googleのサービス群にそのまま入り込める" },
  { icon: "ph-palette", use: "画像も音声も、ぜんぶ1つで済ませたい", pick: "ChatGPT", why: "機能の幅と情報量。困ったとき事例が見つかりやすい" },
  { icon: "ph-film-slate", use: "動画を作りたい", pick: "Gemini（Omni）", why: "4Kアップスケールや続きの生成など、動画では現状いちばん先を走る" },
  { icon: "ph-magnifying-glass", use: "最新情報の調べもの", pick: "Perplexity（番外）", why: "出典つきで答えるAI検索の代表格" },
  { icon: "ph-books", use: "手元の資料だけから正確に答えてほしい", pick: "NotebookLM（番外）", why: "渡した資料の外を見ないからハルシネーションが起きにくい" },
  { icon: "ph-laptop", use: "コードを書く・アプリを作る", pick: "Claude（Claude Code）", why: "独立系のエージェント指標で首位級。このサイトもこれ製。数学寄りの難問はGPT-6も有力" },
];
