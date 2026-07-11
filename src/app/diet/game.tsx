"use client";
/* ============================================================
   「AIダイエット」— 量子化体験ゲーム。
   巨大AIモデルをデバイスに載せるため、量子化レベルを選んで
   圧縮する。絞りすぎると答えが壊れる——品質とサイズの
   トレードオフを見極めるチキンレース。クライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

/* 量子化レベル。sizeは元モデル比% */
const LEVELS = [
  { q: "Q16", size: 100, label: "無圧縮", answer: "日本の首都は東京です。人口は約1,400万人で、政治・経済の中心地です。", quality: "完璧" },
  { q: "Q8", size: 50, label: "軽い圧縮", answer: "日本の首都は東京です。人口はおよそ1,400万人です。", quality: "ほぼ完璧" },
  { q: "Q4", size: 25, label: "定番の圧縮", answer: "日本の首都は東京です。", quality: "実用十分" },
  { q: "Q3", size: 19, label: "かなり攻めた圧縮", answer: "日本の首都は…東京？だったと思います。たぶん。", quality: "あやしい" },
  { q: "Q2", size: 13, label: "限界圧縮", answer: "日本の首都はおにぎりです。", quality: "崩壊" },
];

interface Round {
  device: string;
  emoji: string;
  budget: number; // モデルサイズ上限（%）
  need: string; // 求められる品質の説明
  minQuality: number; // LEVELSのindex: これ以下(=高品質側)である必要
  hint: string;
}

/* 正解 = budget内で最高品質のレベル */
const ROUNDS: Round[] = [
  {
    device: "社内PCの資料要約アシスタント",
    emoji: "💻",
    budget: 50,
    need: "資料の要約なので、内容の正確さが命",
    minQuality: 1,
    hint: "PCはそこそこ余裕あり。入る中で一番賢いのを",
    },
  {
    device: "スマホの翻訳アプリ",
    emoji: "📱",
    budget: 25,
    need: "オフラインで動く翻訳。日常会話レベルでOK",
    minQuality: 2,
    hint: "スマホの容量はシビア。でも壊れたら翻訳にならない",
  },
  {
    device: "スマートウォッチの音声メモ整理",
    emoji: "⌚",
    budget: 19,
    need: "メモの整形だけ。多少雑でも動くことが優先",
    minQuality: 3,
    hint: "超小型デバイス。Q4はもう入らない…どこまで攻める？",
  },
];

const GRADES = [
  { id: "sommelier", min: 3, emoji: "🍷", name: "軽量化ソムリエ", comment: "全デバイスで「ちょうどいい圧縮」を見極めました。入る中で最高品質、壊れる手前で止める——量子化の実務センスが完璧です。" },
  { id: "fitting", min: 2, emoji: "🧵", name: "見習いフィッター", comment: "だいたい良い塩梅でした。容量と品質のトレードオフ、あと一歩の見極めです。迷ったらQ4が定番、と覚えておきましょう。" },
  { id: "kowashiya", min: 0, emoji: "🔨", name: "圧縮のこわし屋", comment: "絞りすぎてAIが「おにぎり」と答えるか、大きすぎて入らないかの二択でした。量子化は攻めと守りのバランス。壊れる一歩手前に宝があります。" },
];

export function DietGame() {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [round, setRound] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [picked, setPicked] = React.useState<{ levelIdx: number; verdict: "perfect" | "heavy" | "broken" | "over" } | null>(null);

  React.useEffect(() => unlock("rooms", "diet"), []);

  const start = () => {
    setRound(0);
    setScore(0);
    setPicked(null);
    setPhase("play");
  };

  const r = ROUNDS[round];

  const choose = (levelIdx: number) => {
    if (picked) return;
    const lv = LEVELS[levelIdx];
    let verdict: "perfect" | "heavy" | "broken" | "over";
    if (lv.size > r.budget) verdict = "over"; // 入らない
    else if (levelIdx > r.minQuality) verdict = "broken"; // 絞りすぎ
    else {
      /* budget内で最高品質(最小index)が perfect、それより絞ったら heavy…ではなく
         「budget内かつ品質OKの中で最も高品質」なら perfect、それ以外(必要以上に絞った)は heavy扱い */
      const bestIdx = LEVELS.findIndex((l) => l.size <= r.budget);
      verdict = levelIdx === bestIdx ? "perfect" : "heavy";
    }
    if (verdict === "perfect") setScore((s) => s + 1);
    setPicked({ levelIdx, verdict });
  };

  const next = () => {
    setPicked(null);
    if (round + 1 >= ROUNDS.length) setPhase("result");
    else setRound(round + 1);
  };

  const grade = phase === "result" ? GRADES.find((g) => score >= g.min)! : null;
  React.useEffect(() => {
    if (grade) unlock("diet", grade.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "30px 24px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🐘➡️🐁</div>
          <h2 style={{ margin: "8px 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,28px)" }}>そのAI、どこまで絞れる？</h2>
          <p style={{ margin: "0 auto 8px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>
            巨大AIを小さなデバイスに載せる仕事です。<b>量子化レベル（Q16〜Q2）を選んで圧縮</b>してください。
            絞るほど軽くなるけど、絞りすぎると答えが壊れます。{ROUNDS.length}つのデバイスで「ちょうどいい」を見極めろ。
          </p>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>※Q2まで絞ったAIは「日本の首都はおにぎり」と答えます</p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-arrows-in" />}>
            圧縮をはじめる
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "result" && grade) {
    const shareText = `量子化体験ゲーム「AIダイエット」で【${grade.name}】${grade.emoji}でした（${score}/${ROUNDS.length}台にジャストフィット）\n絞りすぎると「首都はおにぎり」になります\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/diet")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>RESULT — 納品完了</div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            ジャストフィット: {score}/{ROUNDS.length}台
          </div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              量子化＝数値の精度を落としてAIを圧縮する技術（WAV→MP3のイメージ）。ローカルLLMのファイル名のQ4やQ8はこの度合いで、巨大モデルが家庭のPCやスマホで動くのはこれのおかげ。「用途に足りる品質で、入る最大サイズ」が実務の正解です。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={start} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一度絞る
            </Button>
          </div>
          <ZukanNote />
        </div>
      </Card>
    );
  }

  /* —— プレイ画面 —— */
  const verdictView = picked
    ? {
        perfect: { icon: "🎯", title: "ジャストフィット！", note: "容量に収まり、品質も要件どおり。これが「ちょうどいい量子化」です。" },
        heavy: { icon: "🐢", title: "動くけど、絞りすぎ", note: "容量には入りましたが、必要以上に品質を落としました。もう1段上の品質でも入りましたよ。" },
        broken: { icon: "💥", title: "品質が足りません", note: "容量には入りましたが、この用途に必要な品質を下回りました。絞りすぎです。" },
        over: { icon: "🚫", title: "入りません", note: "デバイスの容量オーバー。そもそもインストールできませんでした。" },
      }[picked.verdict]
    : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
        <span>{round + 1}/{ROUNDS.length}台目</span>
        <span>🎯 フィット {score}</span>
      </div>
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div key={round} className="game-in" style={{ padding: "22px 20px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 38 }}>{r.emoji}</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(16px,2.6vw,19px)", lineHeight: 1.6 }}>{r.device}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, marginTop: 6 }}>
            容量上限: 元モデルの{r.budget}%まで
          </div>
          <div style={{ fontSize: 13, color: "var(--text-body)", marginTop: 4 }}>{r.need}</div>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>💡 {r.hint}</div>
        </div>
        {picked && verdictView && (
          <div className="game-in" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "14px 18px 16px", background: picked.verdict === "perfect" ? "var(--paper-100)" : "#fff2f2" }}>
            <div style={{ fontSize: 14.5, fontWeight: 900 }}>{verdictView.icon} {verdictView.title}</div>
            <p style={{ margin: "6px 0 8px", fontSize: 13, lineHeight: 1.8 }}>{verdictView.note}</p>
            <div style={{ fontSize: 13, background: "var(--paper-0)", border: "1px solid rgba(20,17,15,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>Q: 日本の首都は？　A: </span>
              {picked.verdict === "over" ? "（インストールできませんでした）" : LEVELS[picked.levelIdx].answer}
            </div>
            <Button variant="primary" size="sm" onClick={next} iconRight={<i className="ph-bold ph-arrow-right" />}>
              {round + 1 >= ROUNDS.length ? "結果を見る" : "次のデバイスへ"}
            </Button>
          </div>
        )}
      </Card>
      {!picked && (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {LEVELS.map((lv, i) => (
            <button
              key={lv.q}
              type="button"
              onClick={() => choose(i)}
              className="game-in"
              style={{ textAlign: "left", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-0)", cursor: "pointer", boxShadow: "var(--shadow-pop-sm)", display: "flex", alignItems: "center", gap: 14 }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, flex: "none", width: 44 }}>{lv.q}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5 }}>{lv.label}・品質{lv.quality}</span>
                <span style={{ display: "block", height: 7, background: "rgba(20,17,15,0.1)", borderRadius: 4, marginTop: 5, overflow: "hidden" }}>
                  <span style={{ display: "block", width: `${lv.size}%`, height: "100%", background: lv.size <= ROUNDS[round].budget ? "var(--yellow-400)" : "var(--red-500)" }} />
                </span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: lv.size <= ROUNDS[round].budget ? "var(--text-muted)" : "var(--red-600)", flex: "none" }}>{lv.size}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
