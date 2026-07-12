/* ============================================================
   AI司書（/search）の検索コーパス。
   サイト内の構造化データをそのまま束ねるので、
   用語・FAQ・マンガ等を更新すれば検索側も自動で追従する。
   ============================================================ */
import { TERMS } from "../../glossary/data";
import { SECTIONS } from "../../faq/data";
import { ERAS } from "../../history/eras";
import { ROWS, USES } from "../../compare/data";
import { WORK_DETAILS } from "../../works/data";
import { MANGA_SERIES } from "../../manga/data";
import { ARTICLES, ARTICLES_POPULAR } from "../../data";

export interface SearchDoc {
  id: string;
  /** 表示バッジ用の種別 */
  type: "用語" | "FAQ" | "マンガ" | "記事" | "作品" | "歴史" | "ページ" | "ゲーム";
  title: string;
  url: string;
  /** 検索対象＆AIに渡す本文 */
  text: string;
  /** 外部リンク（note等）か */
  external?: boolean;
}

/* 遊べるページ・機能ページ（説明は llms.txt と揃える） */
const PAGES: SearchDoc[] = [
  { id: "page:start", type: "ページ", title: "AIのはじめかた", url: "/start", text: "誰でも今日から始められる無料のAI学習コース。絵巻で歴史→マンガで全体像→用語→体験ゲーム→診断→実践の順に、全3章で構成した初心者向け学習ロードマップ。何から始めればいいかわからない人はここから。" },
  { id: "page:compare", type: "ページ", title: "ChatGPT・Claude・Gemini比較", url: "/compare", text: "3大AIの違いと用途別の使い分けを比較表で整理。どれを使えばいいか迷ったら。結論は1社に忠誠を誓わない使い分け。" },
  { id: "page:glossary", type: "ページ", title: "AI用語集", url: "/glossary", text: "生成AI・LLM・RAG・AIエージェントなど、いまさら聞けないAI用語80語を図解つき・現場目線で解説する用語集。" },
  { id: "page:history", type: "ページ", title: "AI歴史絵巻", url: "/history", text: "1950年のチューリングテストから2026年のエージェント時代まで、AIの75年史をスクロールで読める年表絵巻。ブームと冬の時代の繰り返しがわかる。" },
  { id: "page:zukan", type: "ページ", title: "COMIXAI図鑑", url: "/zukan", text: "サイト内のゲームや診断で解放した項目が記録されるコレクション図鑑。全58項目。隠し部屋は全部で18ある。各ゲームの級・称号は最高位だけが図鑑に載る。" },
  { id: "page:uketsuke", type: "ページ", title: "COMIXAI AI受付", url: "/uketsuke", text: "AIが用件をヒアリングして、お問い合わせ内容を自動で要約して届けるチャット型の受付窓口。講演・寄稿・制作・取材の相談はここから。" },
  { id: "page:profile", type: "ページ", title: "プロフィール", url: "/profile", text: "吉川聡史のプロフィール。AIクリエイター・漫画家・UXディレクター・映像ディレクター・ゲームプランナー。株式会社ニジボックス室長。週刊少年チャンピオンで漫画連載経験。noteでAI活用マンガを連載中。" },
  { id: "page:quiz", type: "ゲーム", title: "AI用語力診断", url: "/quiz", text: "AI用語の理解度を12問・3分で5段階判定するクイズ。ヒヨコ級から賢者級まで。ひっかけ問題入り、1問ごとに解説つき。" },
  { id: "page:tokenizer", type: "ゲーム", title: "トークナイザー体験", url: "/tokenizer", text: "文章がAIのトークンに刻まれる様子をその場で体験できるラボ。AIの料金や文字数制限の仕組みがわかる。" },
  { id: "page:uso", type: "ゲーム", title: "AIのウソを見抜け", url: "/uso", text: "AIの回答に混ざったハルシネーション（もっともらしいウソ）を見抜く体験ゲーム。全8問・解説つき。" },
  { id: "page:vibe", type: "ゲーム", title: "3分バイブコーディング", url: "/vibe", text: "雑な一言でミニアプリが変形していくバイブコーディング体験ゲーム。" },
  { id: "page:agent", type: "ゲーム", title: "AIエージェントに任せてみた", url: "/agent", text: "任せ方で結末が分岐するAIエージェント見守りシミュレーションゲーム。" },
  { id: "page:shinjin", type: "ゲーム", title: "AI新人くんに指示を出せ", url: "/shinjin", text: "指示の抜けが事故になるプロンプトエンジニアリング体験ゲーム。" },
  { id: "page:sodate", type: "ゲーム", title: "AIを育てよう", url: "/sodate", text: "学習データでAIの人格が変わる、過学習・ファインチューニング体験の育成ゲーム。" },
  { id: "page:slop", type: "ゲーム", title: "スロップ・スワイプ", url: "/slop", text: "低品質AIコンテンツ（AIスロップ）を見抜くスワイプ鑑定ゲーム。" },
  { id: "page:keibi", type: "ゲーム", title: "インジェクション・ディフェンス", url: "/keibi", text: "プロンプトインジェクションの手口を体験する防衛ゲーム。" },
  { id: "page:shacho", type: "ゲーム", title: "AI社長", url: "/shacho", text: "マルチエージェントの分業設計を体験する経営ゲーム。" },
  { id: "page:tsukue", type: "ゲーム", title: "AIの作業机", url: "/tsukue", text: "コンテキストエンジニアリングを体験する資料選びパズルゲーム。" },
  { id: "page:nou", type: "ゲーム", title: "速い脳・遅い脳", url: "/nou", text: "推論モデルの使い分けを体験する仕分けゲーム。" },
  { id: "page:gakuya", type: "ゲーム", title: "楽屋の台本", url: "/gakuya", text: "システムプロンプト設計を体験する接客シミュレーションゲーム。" },
  { id: "page:shitsuke", type: "ゲーム", title: "AI調教師", url: "/shitsuke", text: "人間の好みでAIを調教するRLHF体験ゲーム。選び方しだいで硬派AIにもゴマすりAIにも育つ。" },
  { id: "page:majin", type: "ゲーム", title: "魔神AIの願い方", url: "/majin", text: "字義どおりに願いを叶える魔神AIで、アライメントの重要性を体験するゲーム。" },
  { id: "page:diet", type: "ゲーム", title: "AIダイエット", url: "/diet", text: "量子化によるAIモデル圧縮の容量・品質・速度のトレードオフを体験するゲーム。" },
  { id: "page:otehon", type: "ゲーム", title: "お手本ひとつで", url: "/otehon", text: "ゼロショット・フューショットの例示テクニックを体験するお手本選びゲーム。" },
  { id: "page:undokai", type: "ゲーム", title: "AI運動会", url: "/undokai", text: "ベンチマークスコアと実務の実力のギャップを体験する勝者予想ゲーム。" },
  { id: "page:gohobi", type: "ゲーム", title: "ご褒美で導け", url: "/gohobi", text: "報酬の置き方だけでAIの行動を設計する、強化学習の報酬設計体験ゲーム。" },
  { id: "page:claude-app", type: "ページ", title: "Claudeアプリ・シミュレーター", url: "/claude-app", text: "Claudeアプリの画面（PC・スマホ）をブラウザ上に再現した体験シミュレーター。チャット・コワーク・コードの3モード切替、新規チャット・モデル切替・履歴・ストリーミング応答を操作でき、Anthropic APIキーを設定すると本物のClaudeとも会話できる。" },
];

function buildDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [...PAGES];

  for (const t of TERMS) {
    docs.push({
      id: `term:${t.slug}`,
      type: "用語",
      title: t.en && !t.term.includes(t.en) ? `${t.term}（${t.en}）` : t.term,
      url: `/glossary/${t.slug}`,
      text: [
        t.yomi,
        t.short,
        ...t.body,
        ...(t.sections?.flatMap((s) => [s.heading, ...s.body]) ?? []),
        ...(t.faq?.flatMap((f) => [f.q, f.a]) ?? []),
      ].join(" "),
    });
  }

  SECTIONS.forEach((sec, si) =>
    sec.items.forEach((qa, qi) => {
      docs.push({
        id: `faq:${si}-${qi}`,
        type: "FAQ",
        title: qa.q,
        url: "/faq",
        text: qa.a,
      });
    })
  );

  ERAS.forEach((e, i) => {
    docs.push({
      id: `era:${i}`,
      type: "歴史",
      title: `${e.year}年 ${e.title}`,
      url: "/history",
      text: e.body,
    });
  });

  docs.push({
    id: "compare:rows",
    type: "ページ",
    title: "ChatGPT・Claude・Geminiの違い（比較表）",
    url: "/compare",
    text: ROWS.map((r) => `${r.label}: ChatGPTは${r.gpt}。Claudeは${r.claude}。Geminiは${r.gemini}。`).join(" "),
  });
  docs.push({
    id: "compare:uses",
    type: "ページ",
    title: "用途別のおすすめAI",
    url: "/compare",
    text: USES.map((u) => `${u.use}なら${u.pick}。理由: ${u.why}。`).join(" "),
  });

  for (const w of WORK_DETAILS) {
    docs.push({
      id: `work:${w.slug}`,
      type: "作品",
      title: w.title,
      url: `/works/${w.slug}`,
      text: [w.tagline, w.metaDescription, ...w.intro].join(" "),
    });
  }

  for (const s of MANGA_SERIES) {
    docs.push({
      id: `manga:${s.slug}`,
      type: "マンガ",
      title: s.title,
      url: `/manga/${s.slug}`,
      text: [s.metaDescription, ...s.intro, s.episodes.map((e) => e.title).join("、")].join(" "),
    });
    for (const e of s.episodes) {
      docs.push({
        id: `ep:${s.slug}:${e.url.slice(-8)}`,
        type: "マンガ",
        title: e.title,
        url: e.url,
        external: true,
        text: e.desc || e.title,
      });
    }
  }

  for (const a of [...ARTICLES, ...ARTICLES_POPULAR]) {
    if (docs.some((d) => d.url === a.url)) continue;
    docs.push({
      id: `article:${a.url.slice(-8)}`,
      type: "記事",
      title: a.title,
      url: a.url,
      external: true,
      text: [a.excerpt, a.tags.join(" ")].join(" "),
    });
  }

  return docs;
}

export const DOCS: SearchDoc[] = buildDocs();
