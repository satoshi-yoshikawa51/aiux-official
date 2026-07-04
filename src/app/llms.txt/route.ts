import { MANGA_SERIES } from "../manga/data";
import { WORK_DETAILS } from "../works/data";
import { TERMS } from "../glossary/data";

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
    ...TERMS.map(
      (t) => `- [${t.term}とは](https://comixai.dev/glossary/${t.slug}): ${t.short}`
    ),
    "",
    "## 外部リンク",
    "",
    "- [note「AI-UX UNITE」](https://note.com/aiux_unite): AI活用マンガ・記事の本体はこちらで連載中",
    "- [YouTube @aiux-unite](https://www.youtube.com/@aiux-unite): 動画での発信",
    "- [X @yoshikawa5116](https://x.com/yoshikawa5116): 日々の発信",
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
