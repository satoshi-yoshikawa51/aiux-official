import type { Metadata } from "next";
import { Footer, PAGE } from "../site-chrome";
import { Badge, Button } from "../ds";
import { ShareRow } from "../site-ui";
import { Reveal, ScrollStage, StickyCta, TryPhone } from "./parts";

/* ============================================================
   スマホアプリ「COMIXAI アカデミー」の紹介ページ（宣伝LP）。

   ▍ここだけヘッダーとパンくずを出さない
   サイトの他のページと違い、これは**1本で完結させる宣伝ページ**。
   上にナビを置くと、読み始めた人がすぐ他所へ逃げられる導線になって
   しまう。回遊はページの終わりでまとめて出す。フッターは、
   プライバシーポリシーとサポートへの動線が要るので残す。

   ▍背景の動画は2本ある
   - MV … ヒーローの中だけで回る。暗く落として文字の下敷きにする
   - 途中の動画 … **画面に貼りつけて**おき、本文のあいだに1か所だけ
     床を抜いた帯を作って、そこから覗かせる（→ parts.tsx）。
     そのため**本文のセクションは全部、背景色を持たせて不透明にする**。
     1つでも背景を忘れると、そこから動画が透ける。

   数字（コース数・レッスン本数・バッジ数・舞台数）は
   ComixaiAcademy/ の実装と一対。**アプリ側を増減したらここも直す**。
   出どころは ComixaiAcademy/docs/appstore.md（App Store提出文言）で、
   ストアの説明文とこのページで数字が食い違うのがいちばん恥ずかしい。

   ▍配信状況は APP_STORE_URL の1行で切り替える
   審査中はダウンロードボタンを出せないので、URLが null のあいだは
   「審査中」の札に化ける。公開されたらURLを入れるだけでよい
   （CTAが2箇所あるので、定数1個に寄せてある）。
   ============================================================ */

/* App Storeの配信URL。審査を通ったらここに入れる（例:
   "https://apps.apple.com/jp/app/id0000000000"）。null のあいだは
   ページ全体が「まもなく公開」の見え方になる */
const APP_STORE_URL: string | null = null;

/* ▍MVのスマホの中に入れる、さわれるWeb版

   アプリのWeb版は**別のVercelプロジェクト**（root＝ComixaiAcademy/）で、
   本番はこのURL。`?demo=1` が体験モードの旗で、1本目のレッスンと
   ガチャだけが開く（→ ComixaiAcademy/src/lib/demo.ts）。

   **プレビューでもここは本番を読む。** ブランチごとのプレビューURLは
   ビルドされるまで存在せず、名前も毎回変わるので、埋め込み先としては
   当てにできない。体験モードそのものを見るときは、PRのコメントに
   Vercelが貼る comixai-academy のプレビューURLに ?demo=1 を付けて開く。 */
const ACADEMY_WEB_DEMO = "https://comixai-academy.vercel.app/?demo=1";

/* ▍ロゴは背景の透けたWebP

   字に白い縁取りが入っているので、暗いMVの上にそのまま置いても読める。
   地に溶けないよう、影だけ下に敷いてある。

   外周の透明な余白は落としてある（1708x921 → 1474x530 → 1120x403）。
   余白を残したまま置くと、**枠に対して絵だけが小さく浮いて見える**。 */
const LOGO = { src: "/academy/logo.webp", w: 1120, h: 403 };

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

/* 節の上下。ここを1か所で持たないと、節ごとに余白がばらつく */
const SECTION_PAD = "clamp(48px, 6vw, 76px) 0";

/* —— 数字バンド。アプリの実装と一対（→ ファイル冒頭のコメント） —— */
const NUMBERS: { n: string; unit: string; label: string }[] = [
  { n: "5", unit: "コース", label: "きほんから この先の話まで" },
  { n: "17", unit: "レッスン", label: "1本あたり2〜3分" },
  { n: "9", unit: "種のゲーム", label: "読むだけで終わらせない" },
  { n: "25", unit: "個のバッジ", label: "称号は5段階" },
  { n: "20", unit: "枚の舞台", label: "相棒の立つ場所が変わる" },
  { n: "0", unit: "円", label: "広告も課金もなし" },
];

/* —— 特徴。実画面と交互に並べる —— */
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
        続けた日数を数えて声をかけてきます。つぎに<b>職種</b>を選ぶと、レッスンの例文とプロンプトが
        <b>その仕事向けに差し替わります</b>。「一般論としてのAI」ではなく、明日の自分の仕事の話として読めます。
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
        ダメなプロンプトから余計な行を削る。章の終わりには修了試験があり、全問正解で花火が上がります。
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
        当てた景品にはそれぞれ専用のおまけゲームつき。
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
        まちがえた問題だけを集めて出し直す<b>復習のしくみ</b>入り。もう一度正解できたら卒業です。
        進み具合はバッジ25種と、<b>AI見習い → AIマスター</b>の称号で見えます。
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
  { icon: "ph-user-circle-dashed", title: "登録なし", body: "アカウントもメールアドレスも要りません。ひらいた瞬間から始められます。" },
  { icon: "ph-device-mobile", title: "記録は端末の中だけ", body: "学習の記録は端末に保存され、サーバーには送られません。機種変更のときは文字列1本で持ち運べます。" },
  { icon: "ph-prohibit", title: "広告なし・課金なし", body: "広告SDKも分析SDKも入れていません。アプリ内課金もありません。" },
];

/* —— CTAブロック。ページ内で2回使うので部品にしてある —— */
function Cta({ place, dark = false }: { place: string; dark?: boolean }) {
  const note = dark ? "rgba(251,247,239,.72)" : "var(--text-muted)";
  if (APP_STORE_URL) {
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} data-ga="academy_install" data-ga-place={place}>
          <Button variant={dark ? "yellow" : "primary"} size="lg" iconLeft={<i className="ph-bold ph-apple-logo" />} iconRight={<i className="ph-bold ph-arrow-up-right" />}>
            App Store でダウンロード
          </Button>
        </a>
        <span style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: note }}>iPhone / iPad・無料</span>
        <AndroidNote tone={note} />
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
      <span style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: note }}>iPhone / iPad・無料予定</span>
      <AndroidNote tone={note} />
    </div>
  );
}

/* ▍Androidは「準備中」とだけ言う
   何も書かないと「iPhoneしか無いアプリ」に見えて、Androidの人が
   そこで帰る。日付は書かない——守れない約束になる */
function AndroidNote({ tone }: { tone: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: tone }}>
      <i className="ph-bold ph-android-logo" />
      Google Play は準備中
    </span>
  );
}

/* 節の見出し。site-ui の SectionHead より余白を詰めたLP用 */
function Head({ kicker, title, hand }: { kicker: string; title: string; hand?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 6 }}>
        {kicker}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3vw,32px)", margin: 0, lineHeight: 1.25 }}>{title}</h2>
        {hand && <span style={{ fontFamily: "var(--font-hand)", color: "var(--text-muted)", fontSize: 15 }}>{hand}</span>}
      </div>
    </div>
  );
}

export default function AcademyPage() {
  return (
    <div style={{ position: "relative" }}>
      {/* ═══════════ MV ═══════════ */}
      {/* id は、下に貼りつく帯が「MVが見えているか」を見るための目印
          （→ parts.tsx の StickyCta） */}
      <section
        id="academy-mv"
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--ink-900)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          minHeight: "min(100svh, 940px)",
        }}
      >
        {/* 背景のループ動画。少しぼかして拡大しているのは、
            文字の下敷きにするのと、端のにじみを画面外へ逃がすため */}
        <video
          src="/academy/mv.mp4"
          poster="/academy/mv-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(2px) saturate(0.92)",
            transform: "scale(1.05)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(105deg, rgba(20,17,15,.92) 0%, rgba(20,17,15,.80) 42%, rgba(20,17,15,.42) 78%, rgba(20,17,15,.55) 100%)",
          }}
        />

        <div
          className="academy-mv"
          style={{
            position: "relative",
            width: PAGE,
            margin: "0 auto",
            padding: "clamp(84px, 9vw, 110px) 0 clamp(56px, 7vw, 84px)",
            display: "grid",
            gridTemplateColumns: "1fr minmax(0, 320px)",
            gap: "clamp(28px, 4vw, 52px)",
            alignItems: "center",
          }}
        >
          <div>
            {/* ▍ロゴ＋キャッチの2段。ここがこのページの看板
                アプリアイコンと「COMIXAI アカデミー」の小さな名札は外した
                ——ロゴが名前を言っているので、同じ名前が2つ並ぶだけになる */}
            <h1 style={{ margin: "0 0 clamp(12px, 1.7vw, 18px)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO.src}
                alt="COMIXAI アカデミー"
                width={LOGO.w}
                height={LOGO.h}
                /* MVのいちばん上の絵なので、後回しにしない */
                fetchPriority="high"
                style={{
                  width: "100%",
                  maxWidth: "clamp(300px, 47vw, 560px)",
                  height: "auto",
                  display: "block",
                  /* 後ろが動画なので、影が無いと絵の縁が地に溶ける */
                  filter: "drop-shadow(0 10px 26px rgba(0,0,0,.6))",
                }}
              />
            </h1>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(24px,3.8vw,42px)",
                lineHeight: 1.25,
                margin: "0 0 clamp(12px, 1.8vw, 18px)",
                color: "var(--paper-50)",
                textShadow: "0 2px 20px rgba(0,0,0,.5)",
              }}
            >
              遊んで学ぶ生成AI
            </p>
            <p style={{ fontSize: 15.5, lineHeight: 1.95, color: "rgba(251,247,239,.86)", margin: "0 0 18px", maxWidth: 520 }}>
              「AIって、けっきょく何ができて、何がダメなの？」——その疑問に<b style={{ color: "var(--paper-50)" }}>「読む」ではなく「遊ぶ」で答える</b>
              学習アプリです。相棒を選んで、職種を選んだら、あとは1日5分。
              <b style={{ color: "var(--paper-50)" }}>一緒に学ぶ相棒も、その相棒が立つステージも、遊びながら増えていきます。</b>
            </p>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
              <Badge tone="red">登録不要</Badge>
              <Badge tone="yellow">完全無料</Badge>
              <Badge tone="paper">広告なし</Badge>
              <Badge tone="paper">課金なし</Badge>
            </div>
            <Cta place="hero" dark />
          </div>

          {/* さわれる実物（→ parts.tsx の TryPhone） */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <TryPhone
              src={ACADEMY_WEB_DEMO}
              poster="/academy/shots/home.webp"
              posterAlt="ホーム画面。桜並木の舞台に3Dアバターが立っている"
            />
          </div>
        </div>
      </section>

      {/* ═══════════ 数字 ═══════════ */}
      <section style={{ position: "relative", zIndex: 1, background: "var(--ink-900)", borderTop: "var(--bw-line) solid rgba(251,247,239,.14)", padding: "22px 0 24px" }}>
        <div style={{ width: PAGE, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: 14 }}>
          {NUMBERS.map((x) => (
            <div key={x.unit} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "var(--yellow-400)", fontSize: 32, lineHeight: 1 }}>
                {x.n}
                <span style={{ fontSize: 12.5, color: "var(--paper-50)", marginLeft: 4, fontFamily: "var(--font-heading)" }}>{x.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--paper-50)", opacity: 0.7, marginTop: 5, lineHeight: 1.55 }}>{x.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ できること ═══════════ */}
      {/* overflow を切っておく。カードが横56pxずれた位置から入ってくるので、
          切らないと**その瞬間だけ横スクロールが出る** */}
      <section style={{ position: "relative", zIndex: 1, background: "var(--paper-50)", padding: SECTION_PAD, overflow: "hidden" }}>
        <div style={{ width: PAGE, margin: "0 auto" }}>
          <Head kicker="WHAT'S INSIDE" title="このアプリでできること" hand="ぜんぶ、遊んでいるうちに" />
          {/* ▍カードは横幅を2/3にして、左右へ振る

              前は横いっぱいのカードに、**上から切った画面**をはめていた。
              高さを本文に合わせるための処理だったが、いちばん見せたい所
              （相棒・ガチャの台・トークンの粒）がその切り口の下に隠れた。

              いまは**絵をまるごと出す**。そのぶん縦に伸びるので、カードを
              2/3幅にして左右へ寄せた。本文の列が狭くなって行数が増えるので、
              絵の高さとの差も詰まる。寄せた側から滑り込ませて、
              左右に振ってあること自体を意味のある動きにしている。 */}
          <div style={{ display: "grid", gap: 16 }}>
            {FEATURES.map((f, i) => {
              /* 1枚目が右、2枚目が左。絵はカードの外側の端に置く */
              const right = i % 2 === 0;
              return (
                <Reveal
                  key={f.title}
                  from={right ? "right" : "left"}
                  style={{ display: "flex", justifyContent: right ? "flex-end" : "flex-start" }}
                >
                  <div
                    className="academy-feat"
                    style={{
                      width: "min(100%, 720px)",
                      display: "flex",
                      gap: 20,
                      alignItems: "center",
                      flexDirection: right ? "row-reverse" : "row",
                      border: "var(--bw-bold) solid var(--ink-900)",
                      borderRadius: "var(--radius-lg)",
                      background: "var(--paper-0)",
                      boxShadow: "var(--shadow-pop)",
                      padding: 18,
                    }}
                  >
                    <div style={{ flex: "0 0 auto", width: "clamp(112px, 13.5vw, 142px)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.shot}
                        alt={f.shotAlt}
                        width={620}
                        height={1344}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                          borderRadius: 14,
                          border: "var(--bw-line) solid var(--ink-900)",
                          background: "var(--paper-0)",
                        }}
                      />
                    </div>
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 6 }}>
                        {f.kicker}
                      </div>
                      {/* 本文の列が狭いので、見出しは特徴カードだけ一段小さく。
                          もとの大きさだと「9種のミニゲー／ム」で折れる */}
                      <h3 style={{ margin: "0 0 9px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(17px,2.1vw,21px)", lineHeight: 1.45 }}>
                        <i className={`ph-bold ${f.icon}`} style={{ marginRight: 9, color: "var(--red-500)" }} />
                        {f.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.9, color: "var(--text-body)" }}>{f.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 床を抜いた帯（後ろの動画が見える） ═══════════ */}
      <ScrollStage
        src="/academy/scroll.mp4"
        poster="/academy/scroll-poster.jpg"
        lines={["通勤の5分が、", "AIに追いつく時間になる。"]}
      />

      {/* ═══════════ コース ═══════════ */}
      <section style={{ position: "relative", zIndex: 1, background: "var(--paper-100)", borderTop: "var(--bw-line) solid var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)", padding: SECTION_PAD }}>
        <div style={{ width: PAGE, margin: "0 auto" }}>
          {/* ▍本数を見出しに書かない
              コースもレッスンも足していくので、書いた瞬間から古くなる。
              数は下の数字バンドが持っている（あちらはアプリと一対で直す） */}
          <Head kicker="COURSES" title="基本から、応用まで" hand="1本2〜3分" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(228px, 1fr))", gap: 12 }}>
            {COURSES.map((c) => (
              <div
                key={c.title}
                style={{
                  border: "var(--bw-line) solid var(--ink-900)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--paper-0)",
                  boxShadow: "var(--shadow-pop-sm)",
                  padding: "16px 18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                  <i className={`ph-bold ${c.icon}`} style={{ fontSize: 20, color: "var(--red-500)" }} />
                  <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16 }}>{c.title}</h3>
                  <Badge tone="soft">{c.n}本</Badge>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, color: "var(--text-body)" }}>{c.desc}</p>
              </div>
            ))}
          </div>

          {/* ▍「ここで終わり」に見せない
              全部やり終えた画面が終点に見えると、その日に消される
              （アプリ側の実機フィードバック）。増えていくことを、
              始める前から見えるところに置いておく */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              border: "var(--bw-line) dashed var(--ink-900)",
              borderRadius: "var(--radius-lg)",
              background: "var(--paper-0)",
              padding: "15px 18px",
            }}
          >
            <i className="ph-bold ph-sparkle" style={{ fontSize: 21, color: "var(--red-500)", flex: "none", marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.9, color: "var(--text-body)" }}>
              レッスンの合間にたまるポイントで<b>ガチャ</b>を回すと、相棒が立つ<b>追加ステージ</b>と、
              新しい<b>相棒</b>が手に入ります。当てたものには、それぞれ専用のおまけゲームつき。
              <b>ステージも相棒も、これからも増やしていきます。</b>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ 安心して使えます ═══════════ */}
      <section style={{ position: "relative", zIndex: 1, background: "var(--paper-50)", padding: SECTION_PAD }}>
        <div style={{ width: PAGE, margin: "0 auto" }}>
          <Head kicker="PRIVACY" title="安心して使えます" hand="集めていないので、漏れません" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(228px, 1fr))", gap: 12 }}>
            {SAFETY.map((s) => (
              <div
                key={s.title}
                style={{
                  border: "var(--bw-line) solid var(--ink-900)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--paper-0)",
                  boxShadow: "var(--shadow-pop-sm)",
                  padding: "16px 18px",
                }}
              >
                <h3 style={{ margin: "0 0 7px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15.5 }}>
                  <i className={`ph-bold ${s.icon}`} style={{ marginRight: 8, color: "var(--red-500)" }} />
                  {s.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, color: "var(--text-body)" }}>{s.body}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.9, color: "var(--text-muted)", margin: "12px 0 0" }}>
            外部と通信するのは「プロンプト道場」のAI添削だけで、送った文章は保存しません。詳しくは
            <a href="/academy/privacy" style={{ color: "var(--red-600)", fontWeight: 700 }}>プライバシーポリシー</a>
            と
            <a href="/academy/support" style={{ color: "var(--red-600)", fontWeight: 700 }}>サポート</a>
            をご覧ください。
          </p>
        </div>
      </section>

      {/* ═══════════ 締め ═══════════ */}
      <section id="academy-end" style={{ position: "relative", zIndex: 1, background: "var(--paper-50)", padding: "0 0 clamp(44px, 6vw, 68px)" }}>
        <div style={{ width: PAGE, margin: "0 auto" }}>
          <div
            style={{
              border: "var(--bw-bold) solid var(--ink-900)",
              borderRadius: "var(--radius-lg)",
              background: "var(--yellow-400)",
              boxShadow: "var(--shadow-pop)",
              padding: "24px 26px",
            }}
          >
            <h2 style={{ margin: "0 0 9px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(21px,3vw,30px)", lineHeight: 1.35 }}>
              まずは、相棒えらびから。
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 14.5, lineHeight: 1.9, fontWeight: 500 }}>
              通勤の5分で、AIと働く自分に追いつく。登録もお金もかかりません。
              {!APP_STORE_URL && <>（いまはApp Storeの審査中です。公開されたら、このページにダウンロードのボタンが出ます）</>}
            </p>
            <Cta place="footer" />
          </div>

          {/* サイト本体への回遊は、ここでまとめて出す（→ 冒頭の覚え書き） */}
          <div style={{ marginTop: 16, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-lg)", background: "var(--paper-0)", padding: "18px 20px", boxShadow: "var(--shadow-pop-sm)" }}>
            <h2 style={{ margin: "0 0 7px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(16px,2.4vw,21px)" }}>
              <i className="ph-bold ph-browser" style={{ marginRight: 8, color: "var(--red-500)" }} />
              ブラウザでも学べます
            </h2>
            <p style={{ margin: "0 0 11px", fontSize: 13.5, lineHeight: 1.9 }}>
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
              <a href="/" style={{ textDecoration: "none" }}>
                <Button variant="ghost" size="sm" iconRight={<i className="ph-bold ph-house" />}>COMIXAI トップ</Button>
              </a>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <ShareRow path="/academy" text="3Dの相棒と、遊んで学ぶ生成AI。学習アプリ「COMIXAI アカデミー」" label="気になったらシェア→" />
          </div>
        </div>
      </section>

      {/* フッターも不透明にしておく（→ 冒頭の覚え書き） */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Footer />
      </div>

      {/* ═══════════ 下に貼りつくダウンロードの帯 ═══════════ */}
      <StickyCta>
        <div
          className="academy-bar"
          style={{
            background: "var(--ink-900)",
            borderTop: "var(--bw-bold) solid var(--ink-900)",
            boxShadow: "0 -8px 30px rgba(0,0,0,.35)",
            /* iPhoneのホームバーのぶんを空ける。空けないとボタンの下半分が
               画面の縁に噛む */
            padding: "11px 0 calc(11px + env(safe-area-inset-bottom))",
          }}
        >
          <div
            style={{
              width: PAGE,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/academy/icon.webp"
                alt=""
                width={38}
                height={38}
                style={{ width: 38, height: 38, borderRadius: 9, border: "var(--bw-line) solid var(--paper-50)", display: "block", flex: "none" }}
              />
              <div className="academy-bar-name" style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14, color: "var(--paper-50)", whiteSpace: "nowrap" }}>
                  COMIXAI アカデミー
                </div>
                <div style={{ fontSize: 11, color: "rgba(251,247,239,.66)", whiteSpace: "nowrap" }}>
                  {APP_STORE_URL ? "iPhone / iPad・無料" : "iPhone / iPad・無料予定"}
                  {" ／ Google Play は準備中"}
                </div>
              </div>
            </div>

            {APP_STORE_URL ? (
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", flex: "none" }}
                data-ga="academy_install"
                data-ga-place="sticky"
              >
                <Button variant="yellow" size="md" iconLeft={<i className="ph-bold ph-apple-logo" />}>
                  ダウンロード
                </Button>
              </a>
            ) : (
              <span
                style={{
                  flex: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--font-heading)",
                  fontWeight: 900,
                  fontSize: 13.5,
                  padding: "10px 17px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--yellow-400)",
                  color: "var(--ink-900)",
                  border: "var(--bw-line) solid var(--ink-900)",
                  whiteSpace: "nowrap",
                }}
              >
                <i className="ph-bold ph-hourglass-medium" />
                App Store 審査中
              </span>
            )}
          </div>
        </div>
      </StickyCta>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </div>
  );
}
