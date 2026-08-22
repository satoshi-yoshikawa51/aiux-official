import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button } from "../ds";
import { Breadcrumb, SectionHead, ShareRow } from "../site-ui";

/* ============================================================
   スマホアプリ「COMIXAI アカデミー」の紹介ページ（宣伝LP）。

   数字（コース数・レッスン本数・バッジ数・舞台数）は
   ComixaiAcademy/ の実装と一対。**アプリ側を増減したらここも直す**。
   出どころは ComixaiAcademy/docs/appstore.md（App Store提出文言）で、
   ストアの説明文とこのページで数字が食い違うのがいちばん恥ずかしい。

   スクリーンショットは public/academy/shots/*.webp。
   審査提出用のPNGから `npm run academy:shots` で焼いたもの。

   ▍配信状況は APP_STORE_URL の1行で切り替える
   審査中はダウンロードボタンを出せないので、URLが null のあいだは
   「審査中」の札に化ける。公開されたらURLを入れるだけでよい
   （CTAが2箇所あるので、定数1個に寄せてある）。
   ============================================================ */

/* App Storeの配信URL。審査を通ったらここに入れる（例:
   "https://apps.apple.com/jp/app/id0000000000"）。null のあいだは
   ページ全体が「まもなく公開」の見え方になる */
const APP_STORE_URL: string | null = null;

const TITLE = "COMIXAI アカデミー｜3Dの相棒と、遊んで学ぶ生成AI（iPhone / iPad）";
const DESC =
  "3Dの相棒キャラクターと一緒に、1日5分で生成AIのきほんが身につく学習アプリ。5コース17レッスン、9種のミニゲーム、AIによるプロンプト添削つき。登録不要・広告なし・完全無料。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: ["COMIXAI アカデミー", "生成AI 学習アプリ", "AI 勉強 アプリ", "プロンプト 練習", "AIリテラシー 研修", "無料"],
  alternates: { canonical: "/academy" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "COMIXAI アカデミー — 3Dの相棒と、遊んで学ぶ生成AI",
    description: "1日5分。相棒を選んで、職種を選んで、あとは遊ぶだけ。登録不要・広告なし・完全無料の学習アプリ。",
    url: "/academy",
    locale: "ja_JP",
    images: [{ url: "/og/academy.png", width: 1200, height: 630, alt: "COMIXAI アカデミー" }],
  },
  twitter: { card: "summary_large_image" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
        { "@type": "ListItem", position: 2, name: "COMIXAI アカデミー", item: "https://comixai.dev/academy" },
      ],
    },
    {
      "@type": "MobileApplication",
      name: "COMIXAI アカデミー",
      applicationCategory: "EducationalApplication",
      operatingSystem: "iOS 16.0以降",
      description: DESC,
      inLanguage: "ja",
      url: "https://comixai.dev/academy",
      image: "https://comixai.dev/academy/icon.webp",
      ...(APP_STORE_URL ? { installUrl: APP_STORE_URL } : {}),
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      author: { "@type": "Person", name: "吉川聡史", url: "https://comixai.dev/profile" },
    },
  ],
};

/* —— 数字バンド。アプリの実装と一対（→ ファイル冒頭のコメント） —— */
const NUMBERS: { n: string; unit: string; label: string }[] = [
  { n: "5", unit: "コース", label: "きほんから、この先の話まで" },
  { n: "17", unit: "レッスン", label: "1本あたり2〜3分" },
  { n: "9", unit: "種のゲーム", label: "読むだけで終わらせない" },
  { n: "25", unit: "個のバッジ", label: "称号は5段階" },
  { n: "20", unit: "枚の舞台", label: "相棒の立つ場所が変わる" },
  { n: "0", unit: "円", label: "広告も課金もなし" },
];

/* —— 特徴。スクショと交互に並べる —— */
interface Feature {
  icon: string;
  kicker: string;
  title: string;
  body: React.ReactNode;
  shot: string;
  shotAlt: string;
}
const FEATURES: Feature[] = [
  {
    icon: "ph-user-focus",
    kicker: "FEATURE 01",
    title: "相棒を選ぶところから始まる",
    body: (
      <>
        最初にやることは、勉強ではなく<b>相棒えらび</b>。選んだ3Dアバターがホーム画面に住みつき、
        続けた日数を数えて声をかけてきます。つぎに<b>職種</b>（営業・マーケ・事務・創作・人事・サポート・企画・経営・情シス）を選ぶと、
        レッスンの例文とプロンプトが<b>その仕事向けに差し替わります</b>。
        「一般論としてのAI」ではなく、明日の自分の仕事の話として読めます。
      </>
    ),
    shot: "/academy/shots/home.webp",
    shotAlt: "ホーム画面。桜並木の舞台に3Dアバターが立ち、連続日数と進捗が表示されている",
  },
  {
    icon: "ph-game-controller",
    kicker: "FEATURE 02",
    title: "読むだけでは終わらせない、9種のミニゲーム",
    body: (
      <>
        レッスンの途中に、その回の内容をそのまま触れるゲームが挟まります。
        文章が<b>トークンに割れる様子</b>をその場で確かめる、あふれた指示を予算内に収める、
        ダメなプロンプトから余計な行を削る——読んで納得した気になる代わりに、手を動かして間違えます。
        章の終わりには修了試験があり、全問正解で花火が上がります。
      </>
    ),
    shot: "/academy/shots/token.webp",
    shotAlt: "AIの目で見てみよう。日本語の文章が1文字ずつトークンに割れ、漢字が2トークンになる様子",
  },
  {
    icon: "ph-pen-nib",
    kicker: "FEATURE 03",
    title: "書いたプロンプトを、AIが添削して返す",
    body: (
      <>
        「プロンプト道場」では、書いた指示文を<b>実際にAIが実行</b>し、
        どこが良くて、何を足すと結果が変わるかまで添削して返します。
        正解の例文を眺めるのではなく、自分の書いた文が直されるので、次に書くときに残ります。
        通信できないときは端末内の簡易採点に自動で切り替わるので、地下鉄でも止まりません。
      </>
    ),
    shot: "/academy/shots/lesson.webp",
    shotAlt: "レッスン画面。コピーして使えるプロンプトのカードが表示されている",
  },
  {
    icon: "ph-shooting-star",
    kicker: "FEATURE 04",
    title: "続けたくなる仕掛けを、課金なしで",
    body: (
      <>
        学習でたまるポイントでガチャを回すと、新しい相棒や<b>舞台の絵</b>が当たります。
        当てた景品にはそれぞれ専用のおまけゲームがついていて、当てたキャラや背景がそのまま出てきます。
        <b>ポイントは学習でしか手に入りません</b>——課金も広告も、一切ありません。
      </>
    ),
    shot: "/academy/shots/gacha.webp",
    shotAlt: "ガチャ画面。ためたポイントで舞台やアバターを引ける",
  },
  {
    icon: "ph-medal",
    kicker: "FEATURE 05",
    title: "まちがえた問題は、そのままにしない",
    body: (
      <>
        まちがえた問題だけを集めて出し直す<b>復習のしくみ</b>が入っています。もう一度正解できたら卒業。
        進み具合はバッジ25種と、<b>AI見習い → AIマスター</b>の称号で見えます。
        「どこまでやったか」が数字で残るので、間があいても戻ってこられます。
      </>
    ),
    shot: "/academy/shots/badges.webp",
    shotAlt: "バッジ画面。獲得したバッジと、次の称号までの残り個数が表示されている",
  },
];

/* —— コース一覧。ComixaiAcademy/src/data/courses/ の desc と揃える —— */
const COURSES: { icon: string; title: string; n: number; desc: string }[] = [
  { icon: "ph-plant", title: "AIのきほん", n: 4, desc: "「なんとなく使ってる」を「わかって使ってる」に変える4本。ここから始める。" },
  { icon: "ph-briefcase", title: "最初の一週間", n: 3, desc: "あなたの職種で、どこから手をつけるか。順番を間違えなければ失敗しにくい。" },
  { icon: "ph-pencil-simple", title: "プロンプト道場", n: 4, desc: "同じAIから、良い答えを引き出す。手を動かして覚える4本。" },
  { icon: "ph-shield-check", title: "事故らないAI", n: 3, desc: "便利さより先に、これを知っておく。3本だけ、真面目な話をする。" },
  { icon: "ph-rocket-launch", title: "これからのAI", n: 3, desc: "一問一答の次に来る話。ここまで来たら、もう詳しい人の側だ。" },
];

/* —— 「安心して使える」の3点。プライバシーポリシーと一対 —— */
const SAFETY: { icon: string; title: string; body: string }[] = [
  {
    icon: "ph-user-circle-dashed",
    title: "登録なし",
    body: "アカウントもメールアドレスも要りません。ひらいた瞬間から始められます。",
  },
  {
    icon: "ph-device-mobile",
    title: "記録は端末の中だけ",
    body: "学習の記録は端末に保存され、サーバーには送られません。機種変更のときは文字列1本で持ち運べます。",
  },
  {
    icon: "ph-prohibit",
    title: "広告なし・課金なし",
    body: "広告SDKも分析SDKも入れていません。アプリ内課金もありません。",
  },
];

/* —— CTAブロック。ページ内で2回使うので部品にしてある —— */
function Cta({ place }: { place: string }) {
  if (APP_STORE_URL) {
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} data-ga="academy_install" data-ga-place={place}>
          <Button variant="primary" size="lg" iconLeft={<i className="ph-bold ph-apple-logo" />} iconRight={<i className="ph-bold ph-arrow-up-right" />}>
            App Store でダウンロード
          </Button>
        </a>
        <span style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>iPhone / iPad・無料</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          fontFamily: "var(--font-heading)",
          fontWeight: 900,
          fontSize: 15,
          padding: "13px 22px",
          borderRadius: "var(--radius-full)",
          background: "var(--yellow-400)",
          color: "var(--ink-900)",
          border: "var(--bw-bold) solid var(--ink-900)",
          boxShadow: "var(--shadow-pop-sm)",
        }}
      >
        <i className="ph-bold ph-hourglass-medium" />
        App Store 審査中 — まもなく公開
      </span>
      <span style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>iPhone / iPad・無料予定</span>
    </div>
  );
}

/* スクリーンショットを黒枠の「端末」に見立てて出す */
function Shot({ src, alt, tilt = 0, max = 260 }: { src: string; alt: string; tilt?: number; max?: number }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={620}
      height={1344}
      style={{
        width: "100%",
        maxWidth: max,
        height: "auto",
        display: "block",
        borderRadius: 22,
        border: "var(--bw-bold) solid var(--ink-900)",
        boxShadow: "var(--shadow-pop)",
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        background: "var(--paper-0)",
      }}
    />
  );
}

export default function AcademyPage() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "COMIXAI アカデミー" }]} />

      {/* ───────── ヒーロー ───────── */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "28px 0 34px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(0, 300px)", gap: 34, alignItems: "center" }} className="mag-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/academy/icon.webp"
                alt="COMIXAI アカデミーのアプリアイコン"
                width={64}
                height={64}
                style={{ width: 64, height: 64, borderRadius: 15, border: "var(--bw-line) solid var(--ink-900)", boxShadow: "var(--shadow-pop-sm)", display: "block" }}
              />
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700 }}>
                  COMIXAI ACADEMY — iPhone / iPad
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, marginTop: 3 }}>COMIXAI アカデミー</div>
              </div>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px,4.6vw,46px)", lineHeight: 1.25, margin: "0 0 16px" }}>
              3Dの相棒と、<br />
              遊んで学ぶ生成AI。
            </h1>
            <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", margin: "0 0 18px" }}>
              「AIって、けっきょく何ができて、何がダメなの？」——その疑問に<b>「読む」ではなく「遊ぶ」で答える</b>学習アプリです。
              相棒を選んで、職種を選んだら、あとは1日5分。通勤のあいだに、AIと働く自分に追いつきます。
            </p>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
              <Badge tone="red">登録不要</Badge>
              <Badge tone="yellow">完全無料</Badge>
              <Badge tone="paper">広告なし</Badge>
              <Badge tone="paper">課金なし</Badge>
              <Badge tone="soft">1日5分</Badge>
            </div>
            <Cta place="hero" />
          </div>

          <Shot src="/academy/shots/home.webp" alt="ホーム画面。桜並木の舞台に3Dアバターが立っている" tilt={1.5} />
        </div>
      </section>

      {/* ───────── 数字バンド ───────── */}
      <section style={{ background: "var(--ink-900)", padding: "26px 0" }}>
        <div
          style={{
            maxWidth: PAGE,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 18,
          }}
        >
          {NUMBERS.map((x) => (
            <div key={x.unit} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "var(--yellow-400)", fontSize: 34, lineHeight: 1 }}>
                {x.n}
                <span style={{ fontSize: 13, color: "var(--paper-50)", marginLeft: 4, fontFamily: "var(--font-heading)" }}>{x.unit}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--paper-50)", opacity: 0.72, marginTop: 6, lineHeight: 1.6 }}>{x.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 特徴 ───────── */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "48px 0 10px" }}>
        <SectionHead kicker="WHAT'S INSIDE" title="このアプリでできること" hand="ぜんぶ、遊んでいるうちに" />
        <div style={{ display: "grid", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                display: "flex",
                gap: 26,
                alignItems: "center",
                flexWrap: "wrap",
                flexDirection: i % 2 === 1 ? "row-reverse" : "row",
                border: "var(--bw-bold) solid var(--ink-900)",
                borderRadius: "var(--radius-lg)",
                background: "var(--paper-0)",
                boxShadow: "var(--shadow-pop)",
                padding: "22px 24px",
              }}
            >
              <div style={{ flex: "0 1 210px", display: "flex", justifyContent: "center", minWidth: 170 }}>
                <Shot src={f.shot} alt={f.shotAlt} max={210} />
              </div>
              <div style={{ flex: "2 1 320px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>
                  {f.kicker}
                </div>
                <h3 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(19px,2.6vw,25px)", lineHeight: 1.4 }}>
                  <i className={`ph-bold ${f.icon}`} style={{ marginRight: 9, color: "var(--red-500)" }} />
                  {f.title}
                </h3>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 2, color: "var(--text-body)" }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── コース一覧 ───────── */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "48px 0 10px" }}>
        <SectionHead kicker="COURSES" title="5コース・全17レッスン" hand="1本2〜3分" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {COURSES.map((c) => (
            <div
              key={c.title}
              style={{
                border: "var(--bw-line) solid var(--ink-900)",
                borderRadius: "var(--radius-lg)",
                background: "var(--paper-0)",
                boxShadow: "var(--shadow-pop-sm)",
                padding: "18px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, flexWrap: "wrap" }}>
                <i className={`ph-bold ${c.icon}`} style={{ fontSize: 22, color: "var(--red-500)" }} />
                <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16.5 }}>{c.title}</h3>
                <Badge tone="soft">{c.n}本</Badge>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.9, color: "var(--text-body)" }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 安心して使えます ───────── */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "48px 0 10px" }}>
        <SectionHead kicker="PRIVACY" title="安心して使えます" hand="集めていないので、漏れません" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {SAFETY.map((s) => (
            <div
              key={s.title}
              style={{
                border: "var(--bw-line) solid var(--ink-900)",
                borderRadius: "var(--radius-lg)",
                background: "var(--paper-0)",
                boxShadow: "var(--shadow-pop-sm)",
                padding: "18px 20px",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16 }}>
                <i className={`ph-bold ${s.icon}`} style={{ marginRight: 8, color: "var(--red-500)" }} />
                {s.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.9, color: "var(--text-body)" }}>{s.body}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.95, color: "var(--text-muted)", margin: "14px 0 0" }}>
          外部と通信するのは「プロンプト道場」のAI添削だけで、送った文章は保存しません。詳しくは
          <a href="/academy/privacy" style={{ color: "var(--red-600)", fontWeight: 700 }}>プライバシーポリシー</a>
          と
          <a href="/academy/support" style={{ color: "var(--red-600)", fontWeight: 700 }}>サポート</a>
          をご覧ください。
        </p>
      </section>

      {/* ───────── 締めのCTA ───────── */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "44px 0 20px" }}>
        <div
          style={{
            border: "var(--bw-bold) solid var(--ink-900)",
            borderRadius: "var(--radius-lg)",
            background: "var(--yellow-400)",
            boxShadow: "var(--shadow-pop)",
            padding: "26px 28px",
          }}
        >
          <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(21px,3vw,30px)", lineHeight: 1.35 }}>
            まずは、相棒えらびから。
          </h2>
          <p style={{ margin: "0 0 18px", fontSize: 14.5, lineHeight: 1.95, fontWeight: 500 }}>
            通勤の5分で、AIと働く自分に追いつく。登録もお金もかかりません。
            {!APP_STORE_URL && <>（いまはApp Storeの審査中です。公開されたら、このページにダウンロードのボタンが出ます）</>}
          </p>
          <Cta place="footer" />
        </div>

        {/* サイト本体への回遊。アプリを待っているあいだにも読めるもの */}
        <div style={{ marginTop: 18, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-lg)", background: "var(--paper-0)", padding: "20px 22px", boxShadow: "var(--shadow-pop-sm)" }}>
          <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(17px,2.6vw,22px)" }}>
            <i className="ph-bold ph-browser" style={{ marginRight: 8, color: "var(--red-500)" }} />
            ブラウザでも学べます
          </h2>
          <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.95 }}>
            このアプリのもとになっている学習コンテンツは、サイト側にもあります。用語集150語、プロンプト集24レシピ、体験ゲーム——全部無料です。
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href="/start" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="sm" iconRight={<i className="ph-bold ph-arrow-right" />}>AIのはじめかた</Button>
            </a>
            <a href="/glossary" style={{ textDecoration: "none" }}>
              <Button variant="secondary" size="sm" iconRight={<i className="ph-bold ph-arrow-right" />}>AI用語集</Button>
            </a>
            <a href="/prompts" style={{ textDecoration: "none" }}>
              <Button variant="secondary" size="sm" iconRight={<i className="ph-bold ph-arrow-right" />}>プロンプト集</Button>
            </a>
          </div>
        </div>

        <div style={{ marginTop: 26 }}>
          <ShareRow path="/academy" text="3Dの相棒と、遊んで学ぶ生成AI。学習アプリ「COMIXAI アカデミー」" label="気になったらシェア→" />
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
