/* ============================================================
   /compare の比較表データ。AI司書（/api/search）のコーパスとしても使う。
   ============================================================ */

export const ROWS: { label: string; gpt: string; claude: string; gemini: string }[] = [
  { label: "提供元", gpt: "OpenAI", claude: "Anthropic", gemini: "Google" },
  { label: "ひとことで", gpt: "機能の百貨店", claude: "文章の職人", gemini: "Google連携の申し子" },
  {
    label: "得意なこと",
    gpt: "画像生成・音声・検索など機能の幅広さ。情報も事例も一番多い",
    claude: "自然で丁寧な日本語、長文読解、コーディング支援",
    gemini: "検索・Gmail・スプレッドシートなどGoogleサービスとの連携",
  },
  {
    label: "スタイル",
    gpt: "何でも屋の万能ナイフ",
    claude: "落ち着いた文体と長い文脈の理解が持ち味",
    gemini: "普段の仕事道具に溶け込むタイプ",
  },
  {
    label: "こんな人に",
    gpt: "まず1つ選ぶならこれ、という定番が欲しい人",
    claude: "文章の質にこだわる人、長い資料を扱う人、開発者",
    gemini: "仕事がGoogle Workspace中心の人",
  },
];

export const USES: { emoji: string; use: string; pick: string; why: string }[] = [
  { emoji: "✍️", use: "メール・記事・企画書などの文章", pick: "Claude", why: "日本語の自然さと文体の安定感。長文の読み込みにも強い" },
  { emoji: "📊", use: "Gmail・スプレッドシートと連携した作業", pick: "Gemini", why: "Googleのサービス群にそのまま入り込める" },
  { emoji: "🎨", use: "画像も音声も、ぜんぶ1つで済ませたい", pick: "ChatGPT", why: "機能の幅と情報量。困ったとき事例が見つかりやすい" },
  { emoji: "🔍", use: "最新情報の調べもの", pick: "Perplexity（番外）", why: "出典つきで答えるAI検索の代表格" },
  { emoji: "📚", use: "手元の資料だけから正確に答えてほしい", pick: "NotebookLM（番外）", why: "渡した資料の外を見ないからハルシネーションが起きにくい" },
  { emoji: "💻", use: "コードを書く・アプリを作る", pick: "Claude（Claude Code）", why: "コーディングエージェントの完成度。このサイトもこれ製" },
];
