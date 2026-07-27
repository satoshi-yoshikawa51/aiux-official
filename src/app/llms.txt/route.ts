import { MANGA_SERIES } from "../manga/data";
import { WORK_DETAILS } from "../works/data";
import { TERMS } from "../glossary/data";
import { RECIPES } from "../prompts/data";
import { FAQ_TOTAL } from "../faq/data";

/* llms.txt — AI検索・LLMクローラー向けのサイト案内（llmstxt.org 形式）。
   マンガ連載・作品データから自動生成するので、ページを増やせば追従する。 */
export const dynamic = "force-static";

export function GET() {
  const lines = [
    "# COMIXAI — 吉川聡史 オフィシャルサイト",
    "",
    "> AIクリエイター・漫画家・UXディレクター 吉川聡史（よしかわさとし）のオフィシャルサイト。週刊少年チャンピオンで連載経験のある漫画家が、生成AIの活用を「マンガで面白く、わかりやすく」伝える。note でAI活用マンガを連載し、Claude / Claude Code で作ったゲームやアプリも公開している。",
    "",
    "サイト運営者: 吉川 聡史（株式会社ニジボックス室長 / 週刊少年チャンピオンで漫画連載経験 / note「AI-UX UNITE」でAI活用マンガを連載）",
    "",
    "## 主要ページ",
    "",
    "- [トップページ](https://comixai.dev/): サイト全体の入り口。新着・人気のnote記事、連載マガジン、作品を紹介",
    "- [プロフィール](https://comixai.dev/profile): 吉川聡史の経歴・専門領域・実績",
    "",
    "## マンガ連載シリーズ",
    "",
    "- [連載シリーズ一覧](https://comixai.dev/manga): AI活用を学べる3つのマンガ連載",
    ...MANGA_SERIES.map(
      (s) => `- [${s.title}](https://comixai.dev/manga/${s.slug}): ${s.metaDescription}`
    ),
    "",
    "## つくったもの（AIで作ったゲーム・アプリ）",
    "",
    "- [つくったもの一覧](https://comixai.dev/works): Claude / Claude Code で作ったプロダクト",
    ...WORK_DETAILS.map(
      (w) => `- [${w.title}](https://comixai.dev/works/${w.slug}): ${w.metaDescription}`
    ),
    "",
    "## AI用語集",
    "",
    "- [AI用語集トップ](https://comixai.dev/glossary): 生成AIの頻出用語を現場目線でわかりやすく解説",
    "- [AI用語力診断](https://comixai.dev/quiz): AI用語の理解度を12問・3分で5段階判定するクイズ（解説つき）",
    "- [トークナイザー体験](https://comixai.dev/tokenizer): 文章がAIのトークンに刻まれる様子をその場で体験できるラボ",
    "- [AIのウソを見抜け](https://comixai.dev/uso): AIの回答に混ざったハルシネーションを見抜く体験ゲーム（全8問・解説つき）",
    "- [3分バイブコーディング](https://comixai.dev/vibe): 雑な一言でミニアプリが変形していくバイブコーディング体験",
    "- [AIエージェントに任せてみた](https://comixai.dev/agent): 任せ方で結末が分岐するエージェント見守りシミュレーション",
    "- [AI新人くんに指示を出せ](https://comixai.dev/shinjin): 指示の抜けが事故になるプロンプトエンジニアリング体験",
    "- [AIを育てよう](https://comixai.dev/sodate): 学習データでAIの人格が変わる、過学習体験の育成ゲーム",
    "- [スロップ・スワイプ](https://comixai.dev/slop): 低品質AIコンテンツを見抜くスワイプ鑑定ゲーム",
    "- [インジェクション・ディフェンス](https://comixai.dev/keibi): プロンプトインジェクションの手口を体験する防衛ゲーム",
    "- [AI社長](https://comixai.dev/shacho): マルチエージェントの分業設計を体験する経営ゲーム",
    "- [AIの作業机](https://comixai.dev/tsukue): コンテキストエンジニアリングを体験する資料選びパズル",
    "- [速い脳・遅い脳](https://comixai.dev/nou): 推論モデルの使い分けを体験する仕分けゲーム",
    "- [楽屋の台本](https://comixai.dev/gakuya): システムプロンプト設計を体験する接客シミュレーション",
    "- [AI調教師](https://comixai.dev/shitsuke): 人間の好みでAIを調教するRLHF体験ゲーム",
    "- [魔神AIの願い方](https://comixai.dev/majin): 字義どおりに願いを叶える魔神で学ぶアライメント体験ゲーム",
    "- [AIダイエット](https://comixai.dev/diet): 量子化の容量・品質・速度のトレードオフを体験する圧縮ゲーム",
    "- [お手本ひとつで](https://comixai.dev/otehon): ゼロショット・フューショットの例示を体験するお手本選びゲーム",
    "- [AI運動会](https://comixai.dev/undokai): ベンチマークスコアと実務のギャップを体験する勝者予想ゲーム",
    "- [ご褒美で導け](https://comixai.dev/gohobi): 報酬設計だけでAIを導く強化学習体験ゲーム",
    "- [Claudeアプリ・シミュレーター](https://comixai.dev/claude-app): PC・スマホのClaudeアプリ画面をブラウザ上に再現した体験シミュレーター（チャット・コワーク・コードの3モード、APIキーで本物のClaudeとも会話可能）",
    "- [AIのはじめかた](https://comixai.dev/start): 歴史→用語→診断→ゲーム→実践の初心者向け学習ロードマップ",
    `- [AIのよくある質問](https://comixai.dev/faq): 仕事を奪われる？会社で使っていい？著作権は？——不安・使い方・料金・セキュリティ・法律・教育・開発まで全${FAQ_TOTAL}問に一問一答`,
    "- [ChatGPT・Claude・Gemini比較](https://comixai.dev/compare): 3大AIの違いと用途別の使い分け",
    "- [AIイベントカレンダー](https://comixai.dev/calendar): OpenAI DevDayなど世界と日本のAI主要イベントの日程一覧と、毎朝自動更新の今日のAIニュース見出し",
    "- [AI歴史絵巻](https://comixai.dev/history): 1950年から2026年まで、AIの75年史をスクロールで読める年表絵巻",
    "- [COMIXAI AI受付](https://comixai.dev/uketsuke): AIが用件をヒアリングし、お問い合わせ内容を自動で要約して届けるチャット型の受付窓口",
    "- [AI司書に聞く](https://comixai.dev/search): サイト内の用語・FAQ・マンガ・ゲームからAIが答えを探して案内するサイト内検索",
    ...TERMS.map(
      (t) => `- [${t.term}とは](https://comixai.dev/glossary/${t.slug}): ${t.short}`
    ),
    "",
    "## 仕事で使えるAIプロンプト集",
    "",
    "- [プロンプト集トップ](https://comixai.dev/prompts): 仕事のタスク別プロンプトを「ダメな指示→事故る出力→直した指示」の実演つきで解説するレシピ集",
    ...RECIPES.map(
      (r) => `- [${r.title}のプロンプト](https://comixai.dev/prompts/${r.slug}): ${r.short}`
    ),
    "",
    "## 外部リンク",
    "",
    "- [note「AI-UX UNITE」](https://note.com/aiux_unite): AI活用マンガ・記事の本体はこちらで連載中",
    "- [YouTube @comixai-dev](https://www.youtube.com/@comixai-dev): 動画での発信",
    "- [X @yoshikawa5116](https://x.com/yoshikawa5116): 日々の発信",
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
