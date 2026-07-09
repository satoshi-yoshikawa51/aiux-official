import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { Breadcrumb } from "../site-ui";
import { EmakiFx } from "./emaki-fx";

export const metadata: Metadata = {
  title: "AIの歴史75年をわかりやすく｜チューリングからエージェント時代までの絵巻｜COMIXAI",
  description:
    "1950年のチューリングテストから、AI冬の時代、ディープラーニング革命、ChatGPT、そしてAIエージェント時代まで——AIの75年の歴史を、スクロールで読める1本の絵巻にしました。各時代の用語解説つき。",
  keywords: ["AI 歴史", "人工知能 歴史 わかりやすく", "AI 年表", "ディープラーニング 歴史", "ChatGPT 歴史"],
  alternates: { canonical: "/history" },
  openGraph: {
    type: "article",
    siteName: "COMIXAI",
    title: "AIの75年を、ひと巻きに。｜AI歴史絵巻",
    description: "チューリングからエージェント時代まで。スクロールで読むAIの歴史。",
    url: "/history",
    locale: "ja_JP",
    images: [{ url: "/og/games/history.png", width: 1200, height: 630, alt: "AI歴史絵巻" }],
  },
  twitter: { card: "summary_large_image" },
};

interface Era {
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

const ERAS: Era[] = [
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

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
        { "@type": "ListItem", position: 2, name: "AI歴史絵巻", item: "https://comixai.dev/history" },
      ],
    },
    {
      "@type": "Article",
      headline: "AIの歴史75年をわかりやすく——チューリングからエージェント時代まで",
      url: "https://comixai.dev/history",
      inLanguage: "ja",
      dateModified: "2026-07-08",
      author: { "@type": "Person", name: "吉川 聡史", alternateName: "COMIXAI", url: "https://comixai.dev/profile" },
    },
  ],
};

export default function HistoryPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <EmakiFx />
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AI歴史絵巻" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 30px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          EMAKI — AI歴史絵巻
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIの75年を、ひと巻きに。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          1950年の「機械は考えられるか？」から、AI冬の時代、ディープラーニング革命、ChatGPT、そしてエージェント時代まで。
          下にスクロールすると、時代が進みます。ぜんぶ読むと、いまのAIブームが「何度目の春」なのかがわかります。
        </p>
      </section>

      {/* リビール由来のtransformがこのsectionをスタッキングコンテキスト化するため、
          section自体をz2に上げて演出レイヤー(z1)より前面で描画させる。
          カード間の余白は透明なので、背面のパーティクル・年号・ティントはそこから見える */}
      <section style={{ maxWidth: "min(720px, 92vw)", margin: "0 auto", padding: "10px 0 40px", position: "relative", zIndex: 2 }}>
        <div className="emaki-wrap">
          {ERAS.map((era) => (
            <article key={era.year} className="emaki-panel" data-year={era.year.slice(0, 4)} data-fx={era.fx} data-tint={era.tint}>
              <span className="emaki-dot" style={{ background: era.tone === "winter" ? "#dbe9ff" : era.tone === "boom" ? "var(--red-500)" : "var(--yellow-400)" }} />
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: era.tone === "winter" ? "var(--blue-500)" : "var(--red-600)", marginBottom: 6 }}>
                {era.year}
                {era.tone === "winter" && <Badge tone="blue" style={{ marginLeft: 10 }}>AIの冬</Badge>}
              </div>
              <Card variant="pop" padding={0} style={{ overflow: "hidden", background: era.tone === "winter" ? "#f3f7ff" : "var(--paper-0)" }}>
                {era.video ? (
                  /* ReactはSSRでmuted属性を出力しないため、rawタグで埋め込む（クイズバナーと同じ手法） */
                  <div
                    style={{ borderBottom: "var(--bw-line) solid var(--ink-900)", aspectRatio: "720 / 544", background: era.tone === "winter" ? "#f3f7ff" : "var(--paper-100)" }}
                    dangerouslySetInnerHTML={{
                      __html: `<video src="${era.video}" poster="${era.image ?? ""}" autoplay muted loop playsinline preload="metadata" aria-label="${era.title}" style="width:100%;height:100%;object-fit:cover;display:block;"></video>`,
                    }}
                  />
                ) : era.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={era.image} alt={era.title} loading="lazy" style={{ width: "100%", display: "block", borderBottom: "var(--bw-line) solid var(--ink-900)" }} />
                ) : (
                  <div style={{ textAlign: "center", fontSize: 44, letterSpacing: "0.15em", padding: "22px 10px 14px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: era.tone === "boom" ? "var(--yellow-400)" : undefined }}>
                    {era.scene}
                  </div>
                )}
                <div style={{ padding: "16px 20px 18px" }}>
                  <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 18.5, lineHeight: 1.5 }}>{era.title}</h2>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 2, color: "var(--text-body)" }}>{era.body}</p>
                  {era.hand && (
                    <p style={{ margin: "10px 0 0", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--text-muted)" }}>{era.hand}</p>
                  )}
                  {era.terms && (
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                      {era.terms.map((t) => (
                        <a
                          key={t.slug}
                          href={`/glossary/${t.slug}`}
                          style={{
                            textDecoration: "none",
                            fontFamily: "var(--font-heading)",
                            fontWeight: 700,
                            fontSize: 12,
                            color: "var(--ink-900)",
                            background: "var(--paper-0)",
                            border: "var(--bw-line) solid var(--ink-900)",
                            borderRadius: "var(--radius-full)",
                            padding: "6px 12px",
                            boxShadow: "var(--shadow-pop-sm)",
                          }}
                        >
                          {t.label} <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)" }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </article>
          ))}
        </div>

        {/* 読了エリア */}
        <Card variant="pop" padding={0} style={{ overflow: "hidden", marginTop: 10 }}>
          <div style={{ padding: "28px 26px 24px", textAlign: "center", background: "var(--yellow-400)", borderBottom: "var(--bw-bold) solid var(--ink-900)" }}>
            <div style={{ fontSize: 40, lineHeight: 1 }}>📜</div>
            <h2 style={{ margin: "8px 0 0", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.8vw,28px)" }}>読破！75年、おつかれさまでした。</h2>
          </div>
          <div style={{ padding: "20px 24px 26px", textAlign: "center" }}>
            <p style={{ margin: "0 auto 18px", fontSize: 14, lineHeight: 1.95, color: "var(--text-body)", maxWidth: 480 }}>
              AIの歴史は「ブームと冬」の繰り返しでした。いまの春を上手に使う側になるために——用語と体験は、このサイトにそろえてあります。
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("AIの75年史、1本の絵巻で読めるページが面白かった。いまが「何度目の春」か知ってる？\n#今さら聞けないAI用語集")}&url=${encodeURIComponent("https://comixai.dev/history")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                  この絵巻をXでシェア
                </Button>
              </a>
              <a href="/quiz" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
                  AI用語力診断に挑戦
                </Button>
              </a>
            </div>
            <p style={{ margin: "16px 0 0", textAlign: "center", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--text-muted)" }}>
              📖 図鑑に「AI75年史・読破」を記録しました —{" "}
              <a href="/zukan" style={{ color: "var(--red-600)", fontWeight: 700 }}>
                コレクションを見る
              </a>
            </p>
          </div>
        </Card>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
