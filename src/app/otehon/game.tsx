"use client";
/* ============================================================
   「お手本ひとつで」— ゼロショット/フューショット体験ゲーム。
   出力がバラバラなAIに「正しいお手本」を1つ渡すと出力が揃う。
   悪いお手本を渡すと、その悪癖に全出力が染まる——
   例示の威力と怖さを体感する。クライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

interface Round {
  task: string;
  zeroShot: string[]; // お手本なしのバラバラ出力（3件）
  options: { example: string; good: boolean; flaw?: string }[];
  goodOut: string[]; // 良いお手本後の出力
  badOutFn: (flaw: string) => string[]; // 悪癖に染まった出力
}

const ROUNDS: Round[] = [
  {
    task: "商品レビューの返信を、全部同じトーンで書かせたい",
    zeroShot: [
      "この度は貴重なご意見を賜り、誠に恐悦至極に存じます。",
      "レビューあざす！うれしー！",
      "Thank you for your review. We appreciate...",
    ],
    options: [
      { example: "「ご利用ありがとうございます。◯◯の点、うれしく拝見しました。今後とも…」", good: true },
      { example: "「りょ！これからもよろ〜👍」", good: false, flaw: "軽すぎ" },
      { example: "「拝啓 時下ますますご清栄のこととお慶び申し上げます。さて…」", good: false, flaw: "手紙文" },
    ],
    goodOut: [
      "ご利用ありがとうございます。使い心地のお言葉、うれしく拝見しました。",
      "ご利用ありがとうございます。配送の件、うれしく拝見しました。",
      "ご利用ありがとうございます。デザインへのお言葉、うれしく拝見しました。",
    ],
    badOutFn: (flaw) =>
      flaw === "軽すぎ"
        ? ["りょ！配送よかったならなにより〜👍", "りょ！デザイン褒めありがと〜👍", "りょ！また買ってな〜👍"]
        : ["拝啓 時下ますますご清栄のことと…（500字）", "拝啓 貴殿のレビューを拝読し…（480字）", "拝啓 師走の候…（520字）"],
  },
  {
    task: "会議メモから「決定事項だけ」を抜き出させたい",
    zeroShot: [
      "会議は和やかな雰囲気で始まりました。まず田中さんが…",
      "・決定: 予算承認 ・雑談: ランチの話 ・宿題: 未定",
      "【要約】いろいろ話し合われ、有意義な会議でした。",
    ],
    options: [
      { example: "入力:（メモ）→ 出力:「■決定事項\\n1. 予算はA案で承認\\n2. 次回は金曜開催」", good: true },
      { example: "入力:（メモ）→ 出力:「会議の流れ: まず挨拶があり、次に議論があり…」", good: false, flaw: "経過報告" },
      { example: "入力:（メモ）→ 出力:「みんながんばった！ナイス会議！」", good: false, flaw: "感想文" },
    ],
    goodOut: [
      "■決定事項\n1. 新機能は来月リリース\n2. 担当は佐藤さん",
      "■決定事項\n1. 価格は据え置き\n2. 発表は水曜",
      "■決定事項\n1. 外注はB社に決定",
    ],
    badOutFn: (flaw) =>
      flaw === "経過報告"
        ? ["会議の流れ: まず近況共有があり、続いて…", "会議の流れ: 冒頭で資料説明があり…", "会議の流れ: 最初に前回の振り返りが…"]
        : ["みんな真剣だった！いい会議！", "白熱してて最高だった！", "今日もチームが一つになった！"],
  },
  {
    task: "採用スカウトの件名を、開封したくなる形で量産したい",
    zeroShot: [
      "求人のご案内",
      "【急募!!!】エンジニア募集中です!!今すぐ応募!!",
      "こんにちは。突然のご連絡失礼します。弊社は…（件名が本文）",
    ],
    options: [
      { example: "「◯◯の経験を、△△の開発で活かしませんか（週2リモート可）」", good: true },
      { example: "「【必見】【激アツ】【今だけ】神求人きたああああ!!」", good: false, flaw: "煽り" },
      { example: "「お世話になっております。株式会社◯◯人事部採用担当の…」", good: false, flaw: "本文化" },
    ],
    goodOut: [
      "Go言語のご経験を、決済基盤の開発で活かしませんか（フル リモート可）",
      "UIデザインのご経験を、医療アプリの改善で活かしませんか（週3リモート可）",
      "データ分析のご経験を、物流の最適化で活かしませんか（フレックス可）",
    ],
    badOutFn: (flaw) =>
      flaw === "煽り"
        ? ["【必見】【神案件】エンジニア求人きたああ!!", "【激アツ】デザイナー枠、今だけ!!", "【今すぐ】応募しないと損!!損!!"]
        : ["お世話になっております。株式会社Aの採用担当…", "お世話になっております。株式会社Bの人事部…", "お世話になっております。株式会社Cの…"],
  },
  {
    task: "レシピを「材料→手順」の型で整形させたい",
    zeroShot: [
      "まず玉ねぎを切ります。あ、その前に油を熱して…いや先に切って…",
      "肉じゃが。おいしいですよね。作り方は検索してください。",
      "材料と手順は以下のとおりです（以下、白紙）",
    ],
    options: [
      { example: "「■材料（2人分）: … ■手順: 1. … 2. … 3. …」", good: true },
      { example: "「このレシピはですね、僕のおばあちゃんが昔…（思い出話3段落）」", good: false, flaw: "思い出話" },
      { example: "「材料: いい感じの野菜 手順: いい感じに炒める」", good: false, flaw: "雑" },
    ],
    goodOut: [
      "■材料（2人分）: 鶏肉200g、玉ねぎ1個… ■手順: 1. 玉ねぎを切る 2. …",
      "■材料（2人分）: 豚肉150g、キャベツ… ■手順: 1. キャベツをちぎる 2. …",
      "■材料（2人分）: 卵2個、ご飯300g… ■手順: 1. 卵を溶く 2. …",
    ],
    badOutFn: (flaw) =>
      flaw === "思い出話"
        ? ["このカレーは、祖母が戦後まもなく…（続く）", "この餃子には、亡き祖父との思い出が…（続く）", "このシチューを見ると、あの冬の日を…（続く）"]
        : ["材料: いい感じの肉 手順: いい感じに焼く", "材料: それっぽい魚 手順: ほどよく煮る", "材料: 適当な野菜 手順: うまいこと和える"],
  },
];

const GRADES = [
  { id: "meijin", min: 4, emoji: "🎯", name: "例示の名人", comment: "全ラウンドで完璧なお手本を選びました。「良い例をひとつ見せる」が最強のプロンプト技術だと、もう体で理解しています。" },
  { id: "minarai", min: 2, emoji: "📋", name: "お手本見習い", comment: "おおむね良い例示でした。お手本選びのコツは「そのまま量産されても困らないか？」と自問すること。AIは例の悪癖まで律儀に真似します。" },
  { id: "burebure", min: 0, emoji: "🌀", name: "ブレブレ製造機", comment: "渡したお手本の悪癖が、すべての出力に増殖しました。フューショットは強力な武器——だからこそ、悪い例は悪夢を量産します。" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function OtehonGame() {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [rounds, setRounds] = React.useState<Round[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [picked, setPicked] = React.useState<{ good: boolean; outputs: string[] } | null>(null);

  React.useEffect(() => unlock("rooms", "otehon"), []);

  const start = () => {
    setRounds(shuffle(ROUNDS).map((r) => ({ ...r, options: shuffle(r.options) })));
    setIdx(0);
    setScore(0);
    setPicked(null);
    setPhase("play");
  };

  const r = rounds[idx];

  const choose = (o: Round["options"][number]) => {
    if (picked) return;
    const outputs = o.good ? r.goodOut : r.badOutFn(o.flaw!);
    if (o.good) setScore((s) => s + 1);
    setPicked({ good: o.good, outputs });
  };

  const next = () => {
    setPicked(null);
    if (idx + 1 >= rounds.length) setPhase("result");
    else setIdx(idx + 1);
  };

  const grade = phase === "result" ? GRADES.find((g) => score >= g.min)! : null;
  React.useEffect(() => {
    if (grade) unlock("otehon", grade.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "30px 24px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>📋✨</div>
          <h2 style={{ margin: "8px 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,28px)" }}>お手本ひとつで、AIは化ける。</h2>
          <p style={{ margin: "0 auto 8px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>
            お手本なし（ゼロショット）のAIは出力がバラバラ。<b>3つの候補から「正しいお手本」を1つ選んで渡す</b>と、出力がピタッと揃います。
            ただし——悪いお手本を選ぶと、その悪癖が全部の出力に増殖します。
          </p>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>※AIは、例の良いところも悪いところも律儀に真似します</p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-copy" />}>
            お手本を選びにいく
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "result" && grade) {
    const shareText = `フューショット体験ゲーム「お手本ひとつで」の結果は【${grade.name}】${grade.emoji}（${score}/${ROUNDS.length}で完璧な例示）\n悪いお手本は悪夢を量産する——\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/otehon")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>RESULT — 例示おわり</div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            完璧なお手本: {score}/{rounds.length}
          </div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              お手本0個で頼むのがゼロショット、例を見せてから頼むのがフューショット。出力の形式や文体を揃えたいとき、長い説明を書くより「理想の例をひとつ貼る」ほうが速くて確実です。今日から使える、費用対効果最強のプロンプト術。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} data-ga="share_click" data-ga-network="x" data-ga-place="result" data-ga-path="/otehon">
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={start} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一度選ぶ
            </Button>
          </div>
          <ZukanNote />
        </div>
      </Card>
    );
  }

  /* —— プレイ画面 —— */
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
        <span>{idx + 1}/{rounds.length}件目の依頼</span>
        <span>🎯 完璧な例示 {score}</span>
      </div>
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div key={idx} className="game-in" style={{ padding: "20px 20px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textAlign: "center" }}>📥 やらせたいこと</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(15px,2.5vw,18px)", lineHeight: 1.6, textAlign: "center" }}>{r.task}</div>
          <div style={{ marginTop: 12, background: "var(--paper-100)", border: "1px dashed rgba(20,17,15,0.3)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", marginBottom: 6 }}>いまの出力（ゼロショット・バラバラ）</div>
            {r.zeroShot.map((z) => (
              <div key={z} style={{ fontSize: 12, lineHeight: 1.7, color: "var(--text-body)", marginBottom: 3 }}>・{z}</div>
            ))}
          </div>
        </div>
        {picked && (
          <div className="game-in" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "14px 18px 16px", background: picked.good ? "var(--paper-100)" : "#fff2f2" }}>
            <div style={{ fontSize: 14.5, fontWeight: 900 }}>{picked.good ? "✨ 出力が揃いました！" : "🌀 悪癖が増殖した…"}</div>
            <div style={{ margin: "8px 0 10px", background: "var(--paper-0)", border: "1px solid rgba(20,17,15,0.15)", borderRadius: 8, padding: "8px 12px" }}>
              {picked.outputs.map((o) => (
                <div key={o} style={{ fontSize: 12.5, lineHeight: 1.75, marginBottom: 3, whiteSpace: "pre-wrap" }}>・{o}</div>
              ))}
            </div>
            <Button variant="primary" size="sm" onClick={next} iconRight={<i className="ph-bold ph-arrow-right" />}>
              {idx + 1 >= rounds.length ? "結果を見る" : "次の依頼へ"}
            </Button>
          </div>
        )}
      </Card>
      {!picked && (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>どのお手本を渡す？</div>
          {r.options.map((o) => (
            <button
              key={o.example}
              type="button"
              onClick={() => choose(o)}
              className="game-in"
              style={{ textAlign: "left", fontFamily: "var(--font-body)", fontSize: 13.5, lineHeight: 1.75, padding: "13px 16px", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-0)", cursor: "pointer", boxShadow: "var(--shadow-pop-sm)" }}
            >
              {o.example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
