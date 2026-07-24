/* ============================================================
   /compare の比較表データ。AI司書（/api/search）のコーパスとしても使う。
   ============================================================ */

export const ROWS: { label: string; gpt: string; claude: string; gemini: string }[] = [
  { label: "提供元", gpt: "OpenAI", claude: "Anthropic", gemini: "Google" },
  { label: "ひとことで", gpt: "機能の百貨店", claude: "文章の職人", gemini: "Google連携の申し子" },
  {
    label: "最新モデル",
    gpt: "GPT-5.6（Sol/Terra/Lunaの3階級）＋自律エージェント「ChatGPT Work」",
    claude: "Claude Fable 5（最上位）／Opus 4.8／Sonnet 5",
    gemini: "Gemini Omni（動画まで作れるネイティブマルチモーダル）／3.5 Flash",
  },
  {
    label: "得意なこと",
    gpt: "画像生成・音声・検索など機能の幅広さ。情報も事例も一番多い",
    claude: "自然で丁寧な日本語、長文読解、コーディング支援（Claude Code）",
    gemini: "検索・Gmail・スプレッドシートなどGoogleサービスとの連携、動画生成",
  },
  {
    label: "スタイル",
    gpt: "何でも屋の万能ナイフ",
    claude: "落ち着いた文体と長い文脈の理解が持ち味",
    gemini: "普段の仕事道具に溶け込むタイプ",
  },
  {
    label: "個人の有料プラン",
    gpt: "Go 約1,500円／Plus 約3,000円／Pro 上位",
    claude: "Pro 約3,000円／Max 上位（Fable 5標準搭載）",
    gemini: "AI Plus 1,200円／AI Pro 2,900円／Ultra 上位",
  },
  {
    label: "こんな人に",
    gpt: "まず1つ選ぶならこれ、という定番が欲しい人",
    claude: "文章の質にこだわる人、長い資料を扱う人、開発者",
    gemini: "仕事がGoogle Workspace中心の人、動画も作りたい人",
  },
];

/* 料金プラン一覧（2026年7月時点・税込目安）。
   為替・改定で変わるため「目安」表記を崩さないこと */
export const PRICING: { service: string; color: string; plans: { name: string; price: string; note: string }[] }[] = [
  {
    service: "ChatGPT",
    color: "var(--ink-900)",
    plans: [
      { name: "Free", price: "0円", note: "GPT-5.6系を回数制限つきで。まず触るならここから" },
      { name: "Go", price: "約1,500円/月", note: "低価格プラン。日常使いの入口" },
      { name: "Plus", price: "約3,000円/月", note: "個人の定番。画像生成・音声・上位モデルの利用枠拡大" },
      { name: "Pro", price: "上位（数万円/月）", note: "ヘビーユーザー・プロ向けの最上位" },
    ],
  },
  {
    service: "Claude",
    color: "var(--red-600)",
    plans: [
      { name: "Free", price: "0円", note: "回数制限つき。文章の質はここでも体感できる" },
      { name: "Pro", price: "約3,000円/月", note: "個人の定番。Fable 5は利用クレジット制で追加利用" },
      { name: "Max", price: "上位（数万円/月）", note: "最上位モデルClaude Fable 5を標準搭載。Claude Codeを使い込むならここ" },
    ],
  },
  {
    service: "Gemini",
    color: "var(--blue-600)",
    plans: [
      { name: "無料版", price: "0円", note: "Gemini本体＋Google検索のAIモードの一部" },
      { name: "AI Plus", price: "1,200円/月", note: "低価格の入口プラン" },
      { name: "AI Pro", price: "2,900円/月", note: "個人の定番。Gemini上位モデル＋Workspace連携強化" },
      { name: "AI Ultra", price: "14,500円〜/月", note: "Gemini Omniの動画生成などを使い込む人向け" },
    ],
  },
];

/* 「どっちがいい？」FAQ（FAQPage構造化データにも使う） */
export const COMPARE_FAQ: { q: string; a: string }[] = [
  {
    q: "ChatGPTとClaude、結局どっちがいい？",
    a: "機能の幅と情報量ならChatGPT、日本語の文章品質と長文読解ならClaude、が2026年7月時点の大きな構図です。メール・資料など「書く仕事」が中心ならClaude、画像・音声など何でも1つで済ませたいならChatGPTから試すのがおすすめです。",
  },
  {
    q: "無料版だけでも仕事に使えますか？",
    a: "使えます。3サービスとも無料枠があり、メール下書き・要約・Excel数式などの定番用途は無料版で十分に体感できます。毎日使うようになって回数制限が邪魔になったら、月1,200〜3,000円の有料プランを検討すれば遅くありません。",
  },
  {
    q: "有料にするならどのプランが定番？",
    a: "個人なら各社の月3,000円前後のプラン（ChatGPT Plus／Claude Pro／Gemini AI Pro）が定番です。まず無料で3つを触り比べて、一番よく使うものだけ課金するのが失敗しないパターン。低価格帯（ChatGPT Go・Gemini AI Plus）から入る手もあります。",
  },
  {
    q: "料金や性能はすぐ変わるのでは？",
    a: "変わります。実際、モデルもプランも数か月単位で更新されています。だからこそ「1社に忠誠を誓わず、いつでも乗り換えられる状態にしておく」のが最強の戦略。道具の操作ではなく、プロンプトの書き方やAIの性質という共通スキルを身につけておけば、乗り換えコストはほぼゼロです。",
  },
];

export const COMPARE_UPDATED = "2026-07-22";

export const USES: { emoji: string; use: string; pick: string; why: string }[] = [
  { emoji: "✍️", use: "メール・記事・企画書などの文章", pick: "Claude", why: "日本語の自然さと文体の安定感。長文の読み込みにも強い" },
  { emoji: "📊", use: "Gmail・スプレッドシートと連携した作業", pick: "Gemini", why: "Googleのサービス群にそのまま入り込める" },
  { emoji: "🎨", use: "画像も音声も、ぜんぶ1つで済ませたい", pick: "ChatGPT", why: "機能の幅と情報量。困ったとき事例が見つかりやすい" },
  { emoji: "🔍", use: "最新情報の調べもの", pick: "Perplexity（番外）", why: "出典つきで答えるAI検索の代表格" },
  { emoji: "📚", use: "手元の資料だけから正確に答えてほしい", pick: "NotebookLM（番外）", why: "渡した資料の外を見ないからハルシネーションが起きにくい" },
  { emoji: "💻", use: "コードを書く・アプリを作る", pick: "Claude（Claude Code）", why: "コーディングエージェントの完成度。このサイトもこれ製" },
];
