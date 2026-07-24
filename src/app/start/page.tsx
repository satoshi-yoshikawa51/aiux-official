import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button } from "../ds";
import { Breadcrumb } from "../site-ui";
import { MANGA_SERIES } from "../manga/data";

export const metadata: Metadata = {
  title: "AIのはじめかた｜誰でも簡単に始められる無料のAI学習コース｜COMIXAI",
  description:
    "「AIを勉強したいけど、何から始めればいいかわからない」人のための学習コース。絵巻で歴史→マンガで全体像→用語を覚えたらすぐ体験ゲーム→診断で腕試し→仕事につなげる。全部無料、順番に進むだけでAIの基礎が身につきます。",
  keywords: ["AI 勉強 何から", "AI 初心者 独学", "生成AI 学び方", "AI 入門", "AI 学習 ロードマップ"],
  alternates: { canonical: "/start" },
  openGraph: {
    type: "article",
    siteName: "COMIXAI",
    title: "AIのはじめかた｜誰でも、今日から始められる。",
    description: "絵巻で歴史→マンガ→用語→体験ゲーム→診断→実践。何から始めるか、もう迷わない。",
    url: "/start",
    locale: "ja_JP",
    images: [{ url: "/og/games/start.png", width: 1200, height: 630, alt: "AIのはじめかた" }],
  },
  twitter: { card: "summary_large_image" },
};

/* noteのエピソード（episodes.json 由来）をURL末尾で引く */
function ep(seriesSlug: string, urlSuffix: string) {
  const s = MANGA_SERIES.find((x) => x.slug === seriesSlug);
  return s?.episodes.find((e) => e.url.endsWith(urlSuffix));
}

interface CourseLink {
  label: string;
  href: string;
  external?: boolean;
}
interface CourseItem {
  thumb: string;
  thumbAlt: string;
  badge: string;
  time: string;
  title: string;
  desc: React.ReactNode;
  descPlain: string; // 構造化データ用
  links: CourseLink[];
}
interface Chapter {
  n: number;
  title: string;
  lead: string;
  items: CourseItem[];
}

export default function StartPage() {
  const ep1 = ep("wakaru", "n39742e82cd30"); // 第1話 生成AIとは？
  const ep3 = ep("wakaru", "n185107973a2f"); // 第3話 RAGとファインチューニング
  const ep6 = ep("wakaru", "n3254dbb5e6b1"); // 第6話 プロンプトを攻略する
  const ep7 = ep("wakaru", "nb9bbe68255bd"); // 第7話 AIワークフロー
  const jissen1 = ep("jissen", "nd8c3cec60650"); // 実践 第1話

  const CHAPTERS: Chapter[] = [
    {
      n: 1,
      title: "まず「わかる」——絵巻とマンガで全体像",
      lead: "最初の一歩は勉強ではなく、絵巻とマンガから。ここだけで、AIニュースの解像度が一段上がります。",
      items: [
        {
          thumb: "/og/games/history.png",
          thumbAlt: "AI歴史絵巻",
          badge: "まずはここから",
          time: "5分",
          title: "AI歴史絵巻で、75年の流れをつかむ",
          descPlain: "最初の一歩は歴史から。AIの75年をスクロールで読む絵巻で、ブームと冬の繰り返しを知ります。",
          desc: <>最初の一歩は、勉強ではなく歴史散歩から。いまのAIブームが<b>3回目の春</b>だと知っていますか？　スクロールするだけで75年が流れる絵巻で、まず背骨を入れましょう。ここを知ると、ニュースに振り回されなくなります。</>,
          links: [{ label: "絵巻を読む", href: "/history" }],
        },
        {
          thumb: ep1?.thumb ?? "/og/glossary/generative-ai.png",
          thumbAlt: "マンガでわかる！AI活用 第1話",
          badge: "マンガを読む",
          time: "5分",
          title: "第1話「生成AIとは？」から始める",
          descPlain: "連載マンガの第1話。生成AIとは何かを、ストーリーで最初に体感します。",
          desc: <>歴史をつかんだら、いまの主役「生成AI」へ。連載「マンガでわかる！AI活用」の第1話で、<b>生成AIが何なのか</b>をストーリーでつかみます。堅い解説より先にマンガ——このサイトの流儀です。</>,
          links: [
            { label: "第1話を読む", href: ep1?.url ?? "https://note.com/aiux_unite", external: true },
            { label: "シリーズ一覧", href: "/manga/wakaru" },
          ],
        },
        {
          thumb: "/og/glossary/generative-ai.png",
          thumbAlt: "生成AIとは",
          badge: "用語で復習",
          time: "5分",
          title: "「生成AI」と「LLM」だけ、用語で固める",
          descPlain: "マンガで読んだ内容を、用語集の2語で復習して土台を作ります。",
          desc: <>マンガの内容を用語で固めます。まずは<b>「生成AI」と「LLM」の2語だけ</b>でOK。図解と一文定義つきなので、読むのに5分かかりません。</>,
          links: [
            { label: "生成AIとは", href: "/glossary/generative-ai" },
            { label: "LLMとは", href: "/glossary/llm" },
          ],
        },
      ],
    },
    {
      n: 2,
      title: "「ことば→体験」で身につける",
      lead: "このサイトの用語ページの下には、その用語を体験できる「黒い扉」が隠れています。読んだら、すぐ遊ぶ。この往復がいちばん記憶に残ります。",
      items: [
        {
          thumb: ep6?.thumb ?? "/og/glossary/prompt-engineering.png",
          thumbAlt: "マンガでわかる！AI活用 第6話 プロンプトを攻略する",
          badge: "マンガ→用語→扉",
          time: "15分",
          title: "プロンプト（AIへの頼み方）を攻略する",
          descPlain: "第6話のマンガでプロンプトを学び、用語ページで整理し、ページ下の扉から指示出しを体験します。",
          desc: <>第6話のマンガで「伝え方」のコツを読んだら、用語ページへ。そして<b>ページのいちばん下にある黒い扉</b>から、AI新人くんへの指示出しを体験。指定し忘れると何が起きるかは……お楽しみ。</>,
          links: [
            { label: "第6話を読む", href: ep6?.url ?? "/glossary/prompt-engineering", external: !!ep6 },
            { label: "プロンプトエンジニアリングとは（扉つき）", href: "/glossary/prompt-engineering" },
          ],
        },
        {
          thumb: "/og/glossary/hallucination.png",
          thumbAlt: "ハルシネーションとは",
          badge: "用語→扉",
          time: "10分",
          title: "AIのウソ（ハルシネーション）を見抜く",
          descPlain: "AIがもっともらしい誤りを出す性質を学び、用語ページ下の道場で見抜く訓練をします。",
          desc: <>AIと付き合う上で<b>いちばん大事な知識</b>がこれ。用語ページで仕組みを理解したら、ページ下の扉の道場で「AIのウソを見抜く」訓練を。実戦形式が一番身につきます。</>,
          links: [{ label: "ハルシネーションとは（扉つき）", href: "/glossary/hallucination" }],
        },
        {
          thumb: "/og/glossary/token.png",
          thumbAlt: "トークンとは",
          badge: "用語→扉",
          time: "10分",
          title: "料金のしくみ（トークン）を体感する",
          descPlain: "AIの料金や文字数制限を決めるトークンを学び、ページ下の実験室で文章が刻まれる様子を見ます。",
          desc: <>「100万トークンあたり◯円」の意味がわかると、AIの料金表が読めるようになります。用語ページの扉の先では、<b>自分の文章がその場で刻まれていく</b>様子を見られます。</>,
          links: [{ label: "トークンとは（扉つき）", href: "/glossary/token" }],
        },
        {
          thumb: ep3?.thumb ?? "/og/glossary/rag.png",
          thumbAlt: "マンガでわかる！AI活用 第3話 RAGとファインチューニング",
          badge: "マンガ→用語→扉",
          time: "15分",
          title: "RAGとファインチューニングを、育てて覚える",
          descPlain: "第3話のマンガで2つの手法の違いを読み、ファインチューニングのページ下の育成ラボで過学習を体験します。",
          desc: <>「カンペを渡す（RAG）」と「特訓する（ファインチューニング）」の違いは第3話のマンガが最速。そのあと<b>ファインチューニングのページ下の扉</b>で、餌やりでAIの人格が変わる育成ゲームをどうぞ。</>,
          links: [
            { label: "第3話を読む", href: ep3?.url ?? "/glossary/rag", external: !!ep3 },
            { label: "RAGとは", href: "/glossary/rag" },
            { label: "ファインチューニングとは（扉つき）", href: "/glossary/fine-tuning" },
          ],
        },
        {
          thumb: "/og/quiz/quiz.png",
          thumbAlt: "AI用語力診断",
          badge: "腕試し",
          time: "3分",
          title: "診断で、何級か測る",
          descPlain: "ここまでの学びを12問の診断で確認します。間違えた問題の解説が次の教材になります。",
          desc: <>ここまで来たら腕試し。毎回変わる12問で<b>何級か判定</b>します。ひっかけ問題入りなので油断は禁物。間違えた問題の解説が、そのまま次の教材になります。</>,
          links: [{ label: "AI用語力診断を受ける", href: "/quiz" }],
        },
      ],
    },
    {
      n: 3,
      title: "仕事につなげる",
      lead: "基礎がついたら、道具選びと実務のルール、そして実践へ。",
      items: [
        {
          thumb: ep7?.thumb ?? "/og/glossary/ai-workflow.png",
          thumbAlt: "マンガでわかる！AI活用 第7話 AIワークフロー",
          badge: "マンガ→用語→扉",
          time: "15分",
          title: "AIに「仕事の流れ」を組み込む",
          descPlain: "第7話でAIワークフローを学び、AIエージェントの用語ページ下の扉で任せ方を体験します。",
          desc: <>単発の質問から卒業。第7話で<b>工程としてAIを組み込む</b>考え方を読み、AIエージェントのページ下の扉で「任せ方しだいで結末が変わる」体験を。エージェント時代の予行演習です。</>,
          links: [
            { label: "第7話を読む", href: ep7?.url ?? "/glossary/ai-workflow", external: !!ep7 },
            { label: "AIエージェントとは（扉つき）", href: "/glossary/ai-agent" },
          ],
        },
        {
          thumb: "/og/games/compare.png",
          thumbAlt: "ChatGPT・Claude・Gemini比較",
          badge: "道具選び",
          time: "5分",
          title: "ChatGPT・Claude・Gemini、どれを使う？",
          descPlain: "3大AIの違いと用途別の使い分けを比較表で確認し、自分の道具を決めます。",
          desc: <>そろそろ自分の道具を決めましょう。3大AIの<b>得意分野と使い分け</b>を比較表にまとめてあります。結論は「1社に忠誠を誓わない」です。</>,
          links: [{ label: "比較ページを見る", href: "/compare" }],
        },
        {
          thumb: "/og/games/faq.png",
          thumbAlt: "AIのよくある質問",
          badge: "実務のルール",
          time: "10分",
          title: "会社で使う前に、FAQで守りを固める",
          descPlain: "会社で使っていい？著作権は？などの実務の疑問をFAQで確認します。",
          desc: <>「会社で勝手に使っていい？」「AI製の画像は仕事で使える？」——<b>事故る前に知っておく系</b>の疑問はFAQに集めました。守りを固めてから使うと、堂々と攻められます。</>,
          links: [{ label: "よくある質問を見る", href: "/faq" }],
        },
        {
          thumb: jissen1?.thumb ?? "/og/games/start.png",
          thumbAlt: "マンガで実践！AI活用",
          badge: "実践編へ",
          time: "連載",
          title: "「マンガで実践！AI活用」で実務に入る",
          descPlain: "実践編の連載マンガで、KPI・ペルソナ・要件定義など実務でのAI活用に進みます。",
          desc: <>仕上げは実践編の連載へ。KPI・ペルソナ・要件定義——<b>実際の仕事の進め方にAIを組み込む</b>話が第1話から順に読めます。ここまで来たら、あなたはもう「AIを使う側」です。</>,
          links: [
            { label: "実践編 第1話を読む", href: jissen1?.url ?? "/manga/jissen", external: !!jissen1 },
            { label: "シリーズ一覧", href: "/manga/jissen" },
          ],
        },
      ],
    },
  ];

  const JSON_LD = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
          { "@type": "ListItem", position: 2, name: "AIのはじめかた", item: "https://comixai.dev/start" },
        ],
      },
      {
        "@type": "HowTo",
        name: "AIのはじめかた——誰でも簡単に始められる無料のAI学習コース",
        description: "AI初心者のための学習コース。絵巻で歴史→マンガ→用語と体験ゲーム→診断→実務、の順で無料で学べます。",
        inLanguage: "ja",
        step: CHAPTERS.flatMap((c) =>
          c.items.map((it, i) => ({
            "@type": "HowToStep",
            name: it.title,
            text: it.descPlain,
            url: it.links[0]?.href.startsWith("http") ? it.links[0].href : `https://comixai.dev${it.links[0]?.href ?? "/start"}`,
          }))
        ),
      },
    ],
  };

  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIのはじめかた" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(0, 480px)", gap: 32, alignItems: "center" }} className="mag-grid">
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
              START — AIのはじめかた
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
              誰でも、今日から始められる。
            </h1>
            <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
              「勉強しなきゃ」と思うと続きません。このコースは<b>絵巻とマンガで入って、用語で固めて、ゲームで体感する</b>順番に組んであります。
              全3章・ぜんぶ無料・登録不要。上から順にどうぞ。
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/start/hero.webp"
            alt="？の山を越えて、赤い道を進んでいくキャラクター"
            className="start-hero-img"
            style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-pop)", transform: "rotate(1.2deg)", display: "block" }}
          />
        </div>
      </section>

      <section style={{ maxWidth: "min(820px, 92vw)", margin: "0 auto", padding: "10px 0 50px" }}>
        {CHAPTERS.map((ch) => (
          <div key={ch.n} style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--red-600)", letterSpacing: "0.1em" }}>
                第{ch.n}章
              </span>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)" }}>{ch.title}</h2>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.9, color: "var(--text-muted)" }}>{ch.lead}</p>
            <div style={{ display: "grid", gap: 14 }}>
              {ch.items.map((it) => (
                <div key={it.title} style={{ display: "flex", gap: 16, border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-lg)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop)", padding: 14, flexWrap: "wrap" }}>
                  {/* サムネイル */}
                  <div style={{ flex: "1 1 200px", maxWidth: 260, minWidth: 180 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.thumb}
                      alt={it.thumbAlt}
                      loading="lazy"
                      style={{ width: "100%", aspectRatio: "1200 / 630", objectFit: "cover", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", display: "block" }}
                    />
                  </div>
                  {/* 本文 */}
                  <div style={{ flex: "3 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <Badge tone="yellow">{it.badge}</Badge>
                      <Badge tone="soft">目安 {it.time}</Badge>
                    </div>
                    <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16.5, lineHeight: 1.5 }}>{it.title}</h3>
                    <p style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.85, color: "var(--text-body)" }}>{it.desc}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {it.links.map((l, i) => (
                        <a key={l.href} href={l.href} target={l.external ? "_blank" : undefined} rel={l.external ? "noopener noreferrer" : undefined} style={{ textDecoration: "none" }}>
                          <Button variant={i === 0 ? "ink" : "secondary"} size="sm" iconRight={<i className={`ph-bold ${l.external ? "ph-arrow-up-right" : "ph-arrow-right"}`} />}>
                            {l.label}
                          </Button>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 修了 */}
        <div style={{ border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-lg)", background: "var(--yellow-400)", padding: "20px 22px", boxShadow: "var(--shadow-pop)" }}>
          <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(18px,2.8vw,24px)" }}>🎓 修了したら</h2>
          <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.95, fontWeight: 500 }}>
            ここまでの冒険の記録は<a href="/zukan" style={{ color: "var(--ink-900)", fontWeight: 900 }}>COMIXAI図鑑</a>に刻まれています。
            そして——このサイトの隠し部屋は全部で<b>18</b>。まだ見つけていない扉は、<a href="/glossary" style={{ color: "var(--ink-900)", fontWeight: 900 }}>用語集</a>のどこかに。
          </p>
          <a href="/zukan" style={{ textDecoration: "none" }}>
            <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-notebook" />}>図鑑をひらく</Button>
          </a>
        </div>

        {/* 職種別ガイドへの導線 */}
        <div style={{ marginTop: 18, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-lg)", background: "var(--paper-0)", padding: "20px 22px", boxShadow: "var(--shadow-pop-sm)" }}>
          <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(18px,2.8vw,24px)" }}>💼 自分の仕事で使うには？</h2>
          <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.95 }}>
            基礎の次は実践。<b>営業・マーケティング・事務・クリエイター</b>の職種ごとに、「どの業務で・どう使い始めるか」をまとめたガイドを用意しました。
          </p>
          <a href="/guide" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>職種別AI活用ガイドへ</Button>
          </a>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
