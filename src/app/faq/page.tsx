import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Breadcrumb } from "../site-ui";

export const metadata: Metadata = {
  title: "AIのよくある質問20選｜不安と疑問に現場目線で答える｜COMIXAI",
  description:
    "AIに仕事を奪われる？会社でChatGPTを使っていい？答えは信用できる？——AIを使う前の不安から実務の疑問まで、よくある質問20個に漫画家・AIクリエイターが現場目線で一問一答。",
  keywords: ["AI よくある質問", "AI 仕事 奪われる", "ChatGPT 会社 使っていい", "AI 信用できる", "生成AI 不安"],
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "article",
    siteName: "COMIXAI",
    title: "AIのよくある質問20選｜不安と疑問に、一問一答。",
    description: "仕事を奪われる？会社で使っていい？信用できる？——現場目線で答えます。",
    url: "/faq",
    locale: "ja_JP",
    images: [{ url: "/og/games/faq.png", width: 1200, height: 630, alt: "AIのよくある質問" }],
  },
  twitter: { card: "summary_large_image" },
};

interface QA {
  q: string;
  a: string; // 構造化データ用のプレーン文
  body: React.ReactNode; // 表示用（リンク入り）
}

const L = (href: string, label: string) => (
  <a key={href + label} href={href} style={{ color: "var(--red-600)", fontWeight: 700 }}>
    {label}
  </a>
);

const SECTIONS: { title: string; emoji: string; items: QA[] }[] = [
  {
    title: "はじめる前の不安",
    emoji: "😟",
    items: [
      {
        q: "AIに仕事を奪われますか？",
        a: "「AIが仕事を丸ごと奪う」より「AIを使う人が、使わない人の仕事を引き受けていく」変化が現実的です。仕事の中の作業単位で置き換わるので、AIに任せる部分と人間が判断する部分の切り分けができる人ほど強くなります。",
        body: (
          <>
            「AIが仕事を丸ごと奪う」より、<b>「AIを使う人が、使わない人の仕事を引き受けていく」</b>変化のほうが現実的です。仕事はタスクの束なので、置き換わるのは作業単位。任せる部分と人間が判断する部分を切り分けられる人ほど強くなります。まずは{L("/start", "AIのはじめかた")}から。
          </>
        ),
      },
      {
        q: "今からAIを学んで、もう遅くないですか？",
        a: "遅くありません。ChatGPTの登場は2022年末で、実務での使いこなしはまだ世界中が試行錯誤の途中です。基本用語と体験があれば数週間で会話に追いつけます。",
        body: (
          <>
            まったく遅くありません。ChatGPTの登場は2022年末。<b>実務での使いこなしは、世界中がまだ試行錯誤の途中</b>です。基本用語と少しの体験があれば、数週間で職場の会話には追いつけます。75年の流れは{L("/history", "AI歴史絵巻")}で5分でつかめます。
          </>
        ),
      },
      {
        q: "何から始めればいいですか？",
        a: "順番は、歴史の流れをつかむ→基本用語12語→診断で腕試し→体験ゲーム→実践記事、がおすすめです。いきなりツールの契約から入る必要はありません。",
        body: (
          <>
            {L("/start", "遊びながら覚える5ステップ")}にまとめました。歴史 → 基本用語12語 → {L("/quiz", "診断")} → 体験ゲーム → 実践、の順です。いきなり有料契約から入る必要はありません。
          </>
        ),
      },
      {
        q: "AIの勉強に資格は必要ですか？",
        a: "業務でAIを使うだけなら資格は不要です。資格より「実際に触った時間」と「事故のパターンを知っていること」が評価されます。学び直しの体系が欲しい人には検定も選択肢になります。",
        body: (
          <>
            使うだけなら<b>資格は不要</b>です。現場で評価されるのは「実際に触った時間」と「事故のパターンを知っていること」。体系立てて学び直したい人には検定類も悪くないですが、まずは触るのが先です。
          </>
        ),
      },
      {
        q: "子どもにAIを使わせても大丈夫ですか？",
        a: "各サービスには年齢制限があり、多くは13歳以上（未成年は保護者の同意つき）です。使わせる場合は、AIは間違えることと、個人情報を入力しないことを最初に教えるのが大切です。",
        body: (
          <>
            各サービスに年齢制限があり、多くは13歳以上・未成年は保護者同意つきです。使わせるなら最初に教えたいのは2つだけ：<b>「AIは間違える」</b>（{L("/glossary/hallucination", "ハルシネーション")}）と<b>「個人情報は入れない」</b>。この2つは大人も同じです。
          </>
        ),
      },
    ],
  },
  {
    title: "使い方の疑問",
    emoji: "🤔",
    items: [
      {
        q: "無料版と有料版、どっちを使えばいいですか？",
        a: "まず無料版で「自分の仕事のどこで使えるか」を見つけるのが先です。毎日使う場面が見つかってから有料版にすると、月額の元は簡単に取れます。",
        body: (
          <>
            まず無料版で「自分の仕事のどこで使えるか」を見つけるのが先。<b>毎日使う場面が見つかってから課金</b>すれば、月額の元はすぐ取れます。逆に、使い道が決まる前の課金はだいたい寝かせて終わります。
          </>
        ),
      },
      {
        q: "ChatGPT・Claude・Gemini、どれを使えばいいですか？",
        a: "正解は用途による使い分けです。文章と長文読解ならClaude、Googleサービスとの連携ならGemini、機能の幅広さならChatGPTが定番です。全部無料で試せるので触り比べるのが早道です。",
        body: (
          <>
            正解は「使い分け」。ざっくり、文章・長文読解なら{L("/glossary/claude", "Claude")}、Google連携なら{L("/glossary/gemini", "Gemini")}、機能の幅広さなら{L("/glossary/chatgpt", "ChatGPT")}。くわしくは{L("/compare", "比較ページ")}にまとめました。
          </>
        ),
      },
      {
        q: "プロンプトって、何を書けばいいですか？",
        a: "役割・目的・条件・出力形式の4点を具体的に書くのが基本です。「いい感じにして」ではなく、新人に仕事を頼むときと同じ伝え方をすると精度が上がります。",
        body: (
          <>
            基本は4点セット：<b>役割・目的・条件・出力形式</b>。「いい感じにして」ではなく、新人に仕事を頼む要領で（{L("/glossary/prompt-engineering", "プロンプトエンジニアリング")}）。指定し忘れると何が起きるかは……{L("/glossary/prompt-engineering", "用語ページ")}の下の方にある扉で体験できます。
          </>
        ),
      },
      {
        q: "同じ質問なのに、毎回答えが違うのはなぜ？",
        a: "AIは答えを確率的に組み立てているためです。故障ではなく仕様で、表現の揺れを抑えたい場合は出力形式を細かく指定すると安定します。",
        body: (
          <>
            AIは答えを<b>確率的に組み立てている</b>からです（{L("/glossary/generative-ai", "生成AIのしくみ")}）。故障ではなく仕様。答えを安定させたいときは、出力形式や条件を細かく指定すると揺れが減ります。
          </>
        ),
      },
      {
        q: "長い資料を読ませるには、どうすればいいですか？",
        a: "AIが一度に扱える量（コンテキストウィンドウ)には上限があり、大量に詰め込むと精度も落ちます。要点版を渡す、資料を絞る、資料専用のツールを使うのが実務的な対処です。",
        body: (
          <>
            AIの「作業机」（{L("/glossary/context-window", "コンテキストウィンドウ")}）には上限があり、<b>詰め込むほど良いわけでもありません</b>。要点版を渡す・資料を絞るのが基本。資料専用なら{L("/glossary/notebooklm", "NotebookLM")}が便利です。机の整理術は{L("/glossary/context-engineering", "コンテキストエンジニアリング")}で。
          </>
        ),
      },
      {
        q: "AIをオフラインやスマホだけで使えますか？",
        a: "ローカルLLMという選択肢があり、PCやスマホ上でAIを動かせます。クラウドの最上位モデルより性能は落ちますが、データを外部に送らない点が強みです。",
        body: (
          <>
            {L("/glossary/local-llm", "ローカルLLM")}という選択肢があります。クラウド最上位より性能は落ちますが、<b>データが手元から出ない</b>のが強み。機密を扱う現場で選ばれています。
          </>
        ),
      },
      {
        q: "AIの料金はなぜ「トークン」で決まるのですか？",
        a: "AIは文章をトークンという細かい単位に分割して処理しており、その処理量が計算コストに比例するためです。文字数とトークン数は一致しません。",
        body: (
          <>
            AIは文章を{L("/glossary/token", "トークン")}という単位に刻んで処理していて、その量が計算コストに比例するからです。<b>文字数＝トークン数ではない</b>のが落とし穴。実際に刻まれる様子は「トークン」の用語ページの奥で体験できます。
          </>
        ),
      },
    ],
  },
  {
    title: "会社・仕事での利用",
    emoji: "💼",
    items: [
      {
        q: "会社で勝手にChatGPTを使ってもいいですか？",
        a: "会社のルールを確認するのが先です。無許可の利用はシャドーAIと呼ばれ、情報漏えい事故の典型パターンです。ルールがない場合は、入力してよい情報の線引きを確認・提案するところから始めましょう。",
        body: (
          <>
            まず会社のルール確認が先です。無許可利用は{L("/glossary/shadow-ai", "シャドーAI")}と呼ばれ、<b>情報漏えい事故の典型パターン</b>。ルールが無いなら「入力していい情報の線引き」を確認・提案するのが正解です（{L("/glossary/ai-governance", "AIガバナンス")}）。
          </>
        ),
      },
      {
        q: "顧客情報や社外秘をAIに入力してもいいですか？",
        a: "原則NGです。一般向けのAIサービスに入力した情報は社外に出ます。会社が契約した法人向け環境か、入力を匿名化するのが基本です。",
        body: (
          <>
            原則<b>NG</b>です。一般向けサービスへの入力は「社外にデータを渡す」行為。会社契約の法人向け環境を使うか、固有名詞や数値を匿名化してから使うのが基本動作です。
          </>
        ),
      },
      {
        q: "AIで作った文章や画像は、仕事で使っていいですか？",
        a: "使えますが、既存の作品と似ていれば著作権侵害になりえます。特定の作家名を指示に使わない、公開前に類似を確認する、社内の利用条件を決めておくのが実務の基本です。",
        body: (
          <>
            使えます。ただし既存作品と似ていれば<b>AI製でも著作権侵害になりえます</b>（{L("/glossary/ai-copyright", "生成AIと著作権")}）。作家名を指示に使わない・公開前に類似チェック・社内の利用条件を決める、の3点セットで。
          </>
        ),
      },
      {
        q: "AIの答えをそのまま資料に載せていいですか？",
        a: "事実・数字・出典は必ず確認してから使ってください。AIは実在しない出典をつけた、もっともらしい誤りを出すことがあります。最終責任は使った人間にあります。",
        body: (
          <>
            <b>事実・数字・出典の確認は人間の仕事</b>です。AIは実在しない出典つきのもっともらしい誤りを出すことがあります（{L("/glossary/hallucination", "ハルシネーション")}）。見抜く訓練は{L("/glossary/hallucination", "ハルシネーション")}のページの奥にある道場でどうぞ。
          </>
        ),
      },
      {
        q: "AIエージェントは、ふつうのAIと何が違うのですか？",
        a: "聞けば答えるチャットに対し、エージェントはゴールを伝えると計画・実行・修正まで自分で進めます。そのぶん権限の渡しすぎに注意が必要です。",
        body: (
          <>
            チャットが「聞けば答える」なのに対し、{L("/glossary/ai-agent", "AIエージェント")}は<b>「任せれば働く」</b>。ゴールを伝えると計画→実行→修正まで進めます。そのぶん権限の渡しすぎは事故のもと（{L("/glossary/prompt-injection", "プロンプトインジェクション")}）。
          </>
        ),
      },
    ],
  },
  {
    title: "AIの限界と、ちょっと先の話",
    emoji: "🔭",
    items: [
      {
        q: "AIの答えは信用できますか？",
        a: "得意分野では非常に有能ですが、もっともらしい誤りが混ざるため全面的な信用は禁物です。要約や下書きは得意、最新情報や正確な数字は苦手、と覚えておくと使いどころを外しません。",
        body: (
          <>
            「有能だが、全面的には信用しない」が正解です。<b>要約・下書き・アイデア出しは得意。最新情報・正確な数字・出典は苦手</b>。この得意不得意さえ覚えれば、AIは最高の相棒になります。見抜く力は{L("/quiz", "診断")}で測れます。
          </>
        ),
      },
      {
        q: "AIは何でも知っているのですか？",
        a: "知りません。学習データにはいつまでの情報かという区切り（知識のカットオフ）があり、それ以降の出来事は知りません。最新情報は検索機能つきのAIやAI検索を使います。",
        body: (
          <>
            知りません。学習データには「いつまでの情報か」という区切り（知識のカットオフ）があり、それ以降は知らないのです。最新情報が欲しいときは{L("/glossary/perplexity", "AI検索")}や{L("/glossary/deep-research", "ディープリサーチ")}系の機能を使いましょう。
          </>
        ),
      },
      {
        q: "AIが「わかりません」と言わないのはなぜですか？",
        a: "AIは正解を検索しているのではなく、自然な続きの文章を予測しているためです。わからない場合はわからないと答えて、と指示すると改善します。",
        body: (
          <>
            AIは正解を検索しているのではなく、<b>「自然な続き」を予測している</b>から（{L("/glossary/llm", "LLMのしくみ")}）。プロンプトに「わからない場合は正直にわからないと答えて」と書くだけでかなり改善します。
          </>
        ),
      },
      {
        q: "このサイトの隠し部屋は、どこにあるんですか？",
        a: "AI用語集の中のどこかに、12個の扉が隠れています。見つけた部屋や遊んだ記録はCOMIXAI図鑑に刻まれます。ヒント：扉がありそうな用語を思い浮かべてみてください。",
        body: (
          <>
            それは自分で見つけるから楽しいんです……が、ヒントだけ：{L("/glossary", "用語集")}の中の<b>12個の用語ページ</b>のどこかに黒い扉があります。見つけた記録は{L("/zukan", "COMIXAI図鑑")}に刻まれます。全部見つけたら、あなたはこのサイトの卒業生です🎓
          </>
        ),
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
        { "@type": "ListItem", position: 2, name: "AIのよくある質問", item: "https://comixai.dev/faq" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: SECTIONS.flatMap((s) =>
        s.items.map((qa) => ({
          "@type": "Question",
          name: qa.q,
          acceptedAnswer: { "@type": "Answer", text: qa.a },
        }))
      ),
    },
  ],
};

export default function FaqPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIのよくある質問" }]} />
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 26px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          FAQ — AIのよくある質問
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          その不安、一問一答で。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          仕事を奪われる？会社で使っていい？信用できる？——AIを使う前の不安から実務の疑問まで、よくある質問20個に現場目線で答えます。
          気になるところだけ、つまみ食いでどうぞ。
        </p>
      </section>

      <section style={{ maxWidth: "min(760px, 92vw)", margin: "0 auto", padding: "6px 0 50px" }}>
        {SECTIONS.map((sec) => (
          <div key={sec.title} style={{ marginBottom: 34 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,3vw,26px)", margin: "0 0 16px" }}>
              {sec.emoji} {sec.title}
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {sec.items.map((qa) => (
                <details key={qa.q} style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop-sm)", overflow: "hidden" }}>
                  <summary style={{ cursor: "pointer", padding: "14px 18px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, lineHeight: 1.6, listStyle: "none" }}>
                    <span style={{ color: "var(--red-600)", marginRight: 8 }}>Q.</span>
                    {qa.q}
                  </summary>
                  <div style={{ padding: "0 18px 16px", fontSize: 14, lineHeight: 2, color: "var(--text-body)", borderTop: "1.5px dashed rgba(20,17,15,0.15)", paddingTop: 12 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, color: "var(--red-600)", marginRight: 8 }}>A.</span>
                    {qa.body}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}

        <div style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "16px 20px" }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 2, fontWeight: 700 }}>
            解決しなかった疑問は、<a href="/glossary" style={{ color: "var(--ink-900)" }}>全50語のAI用語集</a>か、<a href="/start" style={{ color: "var(--ink-900)" }}>AIのはじめかた</a>へ。
            用語そのものを覚えたい人は<a href="/quiz" style={{ color: "var(--ink-900)" }}>診断</a>が近道です。
          </p>
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
