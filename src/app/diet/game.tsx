"use client";
/* ============================================================
   「AIダイエット」— 量子化体験ゲーム。
   巨大AIモデルをデバイスに載せるため、量子化レベルを選んで
   圧縮する。絞るほど軽く・速くなるが、答えが壊れる。
   容量・品質・速度の三すくみを現場の要件から読み解く。
   「入る中で最高品質」が正解とは限らないのがミソ。
   クライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

/* 量子化レベル。sizeは元モデル比%。indexが大きいほど軽く・速く・粗い */
const LEVELS = [
  { q: "Q16", size: 100, label: "無圧縮", quality: "完璧", speed: "🐢 激遅" },
  { q: "Q8", size: 50, label: "軽い圧縮", quality: "ほぼ完璧", speed: "🚶 遅め" },
  { q: "Q4", size: 25, label: "定番の圧縮", quality: "実用十分", speed: "🚴 ふつう" },
  { q: "Q3", size: 19, label: "攻めた圧縮", quality: "あやしい", speed: "🏎️ 速い" },
  { q: "Q2", size: 13, label: "限界圧縮", quality: "崩壊", speed: "⚡ 爆速" },
];

interface Round {
  device: string;
  emoji: string;
  budget: number; // モデルサイズ上限（%）
  need: string; // 現場の要件（品質・速度のヒントはここに書く）
  qMax: number; // 品質要件: このindex以下（=これ以上の品質）が必要
  sMin: number; // 速度要件: このindex以上（=これ以上の速さ）が必要
  hint: string;
  q: string; // 検収テストの質問
  samples: string[]; // LEVELS順の回答サンプル（over時は未使用）
}

/* 正解 = 容量に入り、品質・速度の両要件を満たす中で最高品質のレベル */
const ROUNDS: Round[] = [
  {
    device: "社内PCの資料要約アシスタント",
    emoji: "💻",
    budget: 50,
    need: "夜のうちに要約できればいいので速さは不問。ただし数字の正確さが命",
    qMax: 1,
    sMin: 0,
    hint: "急ぎじゃない仕事なら、入る中で一番賢いのを",
    q: "この30ページの企画書を3行で",
    samples: [
      "要点は3つ。①市場規模120億円 ②3年目に黒字化 ③必要投資2.4億円",
      "①市場規模120億円 ②3年目に黒字化 ③投資2.4億円",
      "新規事業の企画書です。市場は大きめで、投資が必要です。",
      "たぶん新規事業の話です。数字は…どこかに書いてありました。",
      "企画書はおにぎりです。",
    ],
  },
  {
    device: "同時通訳イヤホン",
    emoji: "🎧",
    budget: 25,
    need: "日常会話レベルの品質でOK。ただし会話のテンポに1秒でも遅れたら使い物にならない",
    qMax: 3,
    sMin: 3,
    hint: "賢さより、会話に食らいつく速さ。でも壊れたら通訳にならない",
    q: "“Nice to meet you!” を通訳して",
    samples: [
      "「はじめまして、お会いできて光栄です」",
      "「はじめまして、よろしくお願いします」",
      "「はじめまして！」（…2秒遅れ。会話はもう次の話題へ）",
      "「はじめまして！」",
      "「こんにちは、おにぎりです」",
    ],
  },
  {
    device: "スマートウォッチの音声メモ整理",
    emoji: "⌚",
    budget: 19,
    need: "メモの整形だけ。多少雑でも、動くことが最優先",
    qMax: 3,
    sMin: 0,
    hint: "超小型デバイス。Q4はもう入らない…どこまで攻める？",
    q: "「あした10時 田中さん 資料」を整理して",
    samples: [
      "📝 明日10:00 田中様へ資料をお渡し",
      "📝 明日10:00 田中さんに資料",
      "📝 明日10時 田中さん・資料",
      "📝 明日10:00 田中さんに資料",
      "📝 おにぎり 10個",
    ],
  },
  {
    device: "ゲームのNPC会話エンジン",
    emoji: "🎮",
    budget: 100,
    need: "容量はたっぷり。ただし会話のテンポが没入感の命。セリフの品質はそこそこでOK",
    qMax: 2,
    sMin: 2,
    hint: "全部入る…からこそ罠がある。デカいモデルは賢いけど、もっさり",
    q: "勇者「この村に魔物は出るか？」",
    samples: [
      "「夜の森にはウルフが出る。気をつけな」（…返事まで5秒。勇者はもう森の中）",
      "「夜の森にはウルフが出る」（3秒の沈黙。会話のテンポが死んだ）",
      "「ああ、夜の森にウルフが出るぞ。気をつけな！」",
      "「魔物？ああ…この村は宇宙ステーションだからな」",
      "「いらっしゃいませ、おにぎりです」",
    ],
  },
  {
    device: "病院の問診票 下書きAI",
    emoji: "🏥",
    budget: 100,
    need: "院内サーバーで容量は無制限。夜間バッチで速さも不問。ただし記載ミスは絶対に許されない",
    qMax: 0,
    sMin: 0,
    hint: "圧縮は手段であって目的じゃない。絞る必要、ある？",
    q: "患者メモから問診票の下書きを作成",
    samples: [
      "主訴: 3日前からの頭痛。随伴症状: 軽度の吐き気。既往歴: なし",
      "主訴: 頭痛（3日前から）。吐き気あり——随伴症状の詳細が漏れた",
      "頭が痛いそうです",
      "どこか痛いみたいです。たぶん頭",
      "診断: おにぎり",
    ],
  },
];

const GRADES = [
  { id: "sommelier", min: 5, emoji: "🍾", name: "軽量化ソムリエ", comment: "全5つの現場で「ちょうどいい圧縮」を見極めました。容量・品質・速度の三すくみを要件から読み切る——量子化の実務センスが完璧です。" },
  { id: "fitting", min: 3, emoji: "🧵", name: "見習いフィッター", comment: "だいたい良い塩梅でした。コツは数字合わせではなく「この現場は何が命か」を読むこと。迷ったらQ4が定番、と覚えておきましょう。" },
  { id: "kowashiya", min: 0, emoji: "🔨", name: "圧縮のこわし屋", comment: "絞りすぎて「おにぎり」と答えるか、大きすぎてもっさりするか。量子化は容量・品質・速度の綱引きです。壊れる一歩手前に宝があります。" },
];

type Verdict = "perfect" | "broken" | "slow" | "over";

export function DietGame() {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [round, setRound] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [picked, setPicked] = React.useState<{ levelIdx: number; verdict: Verdict } | null>(null);

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
    let verdict: Verdict;
    if (lv.size > r.budget) verdict = "over"; // 入らない
    else if (levelIdx > r.qMax) verdict = "broken"; // 品質不足
    else if (levelIdx < r.sMin) verdict = "slow"; // 速度不足
    else verdict = "perfect"; // 制約設計上、ここに来るのは正解のみ
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
            巨大AIを現場のデバイスに載せる仕事です。<b>量子化レベル（Q16〜Q2）を選んで圧縮</b>してください。
            絞るほど軽く・速くなるけど、答えが壊れます。デカいままだと賢いけど、もっさり。
            {ROUNDS.length}つの現場の<b>容量・品質・速度</b>の要件を読んで、「ちょうどいい」を見極めろ。
          </p>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>※Q2まで絞ったAIは、何を聞いても「おにぎり」と答えがちです</p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-arrows-in" />}>
            圧縮をはじめる
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "result" && grade) {
    const shareText = `量子化体験ゲーム「AIダイエット」で【${grade.name}】${grade.emoji}でした（${score}/${ROUNDS.length}の現場にジャストフィット）\n絞りすぎると答えが「おにぎり」になります\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/diet")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>RESULT — 納品完了</div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            ジャストフィット: {score}/{ROUNDS.length}件
          </div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              量子化＝数値の精度を落としてAIを圧縮する技術（WAV→MP3のイメージ）。ローカルLLMのQ4やQ8はこの度合いで、絞るほど軽く・速く・粗くなります。だから「大きいほど良い」でも「入れば良い」でもなく、正解は用途しだい。「その現場は正確さとテンポ、どっちが命か」を読むのが軽量化の腕の見せどころです。
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
        perfect: { icon: "🎯", title: "ジャストフィット！", note: "容量・品質・速度、すべて要件どおり。これが「ちょうどいい量子化」です。" },
        broken: { icon: "💥", title: "品質が足りません", note: "容量には入りましたが、この用途に必要な品質を下回りました。絞りすぎです。" },
        slow: { icon: "🐢", title: "遅すぎます", note: "賢さは十分。でもこの用途にはテンポが命でした。大きいモデルは賢いぶん、もっさりなのです。" },
        over: { icon: "🚫", title: "入りません", note: "デバイスの容量オーバー。そもそもインストールできませんでした。" },
      }[picked.verdict]
    : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
        <span>{round + 1}/{ROUNDS.length}件目</span>
        <span>🎯 フィット {score}</span>
      </div>
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div key={round} className="game-in" style={{ padding: "22px 20px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 38 }}>{r.emoji}</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(16px,2.6vw,19px)", lineHeight: 1.6 }}>{r.device}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, marginTop: 6 }}>
            容量上限: 元モデルの{r.budget}%まで
          </div>
          <div style={{ fontSize: 13, color: "var(--text-body)", marginTop: 6, lineHeight: 1.8 }}>📋 {r.need}</div>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>💡 {r.hint}</div>
        </div>
        {picked && verdictView && (
          <div className="game-in" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "14px 18px 16px", background: picked.verdict === "perfect" ? "var(--paper-100)" : "#fff2f2" }}>
            <div style={{ fontSize: 14.5, fontWeight: 900 }}>{verdictView.icon} {verdictView.title}</div>
            <p style={{ margin: "6px 0 8px", fontSize: 13, lineHeight: 1.8 }}>{verdictView.note}</p>
            <div style={{ fontSize: 13, background: "var(--paper-0)", border: "1px solid rgba(20,17,15,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, textAlign: "left" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>検収テスト「{r.q}」→ </span>
              {picked.verdict === "over" ? "（インストールできませんでした）" : r.samples[picked.levelIdx]}
            </div>
            <Button variant="primary" size="sm" onClick={next} iconRight={<i className="ph-bold ph-arrow-right" />}>
              {round + 1 >= ROUNDS.length ? "結果を見る" : "次の現場へ"}
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
                <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5 }}>
                  {lv.label}・品質{lv.quality}・{lv.speed}
                </span>
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
