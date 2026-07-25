"use client";
/* ============================================================
   「速い脳・遅い脳」— 推論モデル仕分けゲーム。
   流れてくる仕事を、反射AI（速い・安い・浅い）と熟考AI（遅い・
   高い・深い）に振り分けるリアルタイム資源管理。
   簡単そうで深い「ひっかけ仕事」が混ざっている。
   すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

interface Job {
  label: string;
  sub?: string;
  deep: boolean; // 熟考が必要か
  note: string; // 判定後の一言
}

const JOBS: Job[] = [
  { label: "あいさつメールの下書き", deep: false, note: "反射で十分。3秒で返してもらう仕事" },
  { label: "契約書2社分の矛盾チェック", sub: "添付：計28ページ", deep: true, note: "条文の突き合わせは深い推論の出番" },
  { label: "「LGTMって何？」", deep: false, note: "一言の意味調べに熟考はオーバーキル" },
  { label: "障害ログから原因を推定", sub: "再現条件が不明", deep: true, note: "仮説と検証の繰り返し＝熟考の本領" },
  { label: "会議メモを箇条書きに整形", deep: false, note: "形式変換は反射の得意技" },
  { label: "「この値引き、利益出る？」", sub: "原価構造が複雑", deep: true, note: "一見ひと言、実は多段の計算。ひっかけでした" },
  { label: "英語メールを日本語に翻訳", deep: false, note: "定型の翻訳は速い脳で" },
  { label: "新機能の技術選定の比較", sub: "候補は4つ", deep: true, note: "トレードオフの比較検討は深い仕事" },
  { label: "プレスリリースの誤字チェック", deep: false, note: "表層チェックは反射向き" },
  { label: "「明日の大阪出張、傘いる？」", sub: "予定表と天気の合わせ技", deep: true, note: "予定×場所×天気の推論。単純な天気質問に見せかけたひっかけ" },
  { label: "SNS投稿のハッシュタグ提案", deep: false, note: "ノリと速さが命。反射で正解" },
  { label: "赤字案件の立て直しプラン", sub: "制約が多い", deep: true, note: "制約付きの計画立案は熟考マター" },
];

const COIN_START = 30;
const COST_FAST = 1;
const COST_SLOW = 4;
const TIME_PER_JOB = 6.0;

const GRADES = [
  { id: "shirei", min: 12, emoji: "🎖️", name: "司令塔マスター", comment: "全問正しい脳に振り分けました。速い思考と遅い思考の使い分け——あなたはもうAI時代のディスパッチャーです。" },
  { id: "balance", min: 9, emoji: "⚖️", name: "バランス派", comment: "ほぼ適切な采配でした。「一見simple、実はdeep」なひっかけ仕事だけ、もう一歩の見極めを。" },
  { id: "noukin", min: 0, emoji: "💪", name: "脳筋ディスパッチャ", comment: "とりあえず全部同じ脳に投げていませんでしたか？適材適所を覚えると、コストも事故も激減します。" },
];

function gradeFor(score: number) {
  return GRADES.find((g) => score >= g.min) ?? GRADES[GRADES.length - 1];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function NouGame() {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [coins, setCoins] = React.useState(COIN_START);
  const [lives, setLives] = React.useState(3);
  const [score, setScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(TIME_PER_JOB);
  const [feedback, setFeedback] = React.useState<{ ok: boolean; text: string; icon: string } | null>(null);

  React.useEffect(() => unlock("rooms", "nou"), []);

  const start = () => {
    setJobs(shuffle(JOBS));
    setIdx(0);
    setCoins(COIN_START);
    setLives(3);
    setScore(0);
    setTimeLeft(TIME_PER_JOB);
    setFeedback(null);
    setPhase("play");
  };

  /* タイマー */
  React.useEffect(() => {
    if (phase !== "play" || feedback) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 0.05)), 50);
    return () => clearInterval(t);
  }, [phase, feedback, idx]);

  /* 時間切れ → あわてて反射AIに流れる */
  React.useEffect(() => {
    if (phase === "play" && !feedback && timeLeft <= 0) assign("fast", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const job = jobs[idx];

  const assign = (brain: "fast" | "slow", timeout = false) => {
    if (feedback || phase !== "play" || !job) return;
    const cost = brain === "fast" ? COST_FAST : COST_SLOW;
    const affordable = coins >= cost;
    const usedBrain: "fast" | "slow" = affordable ? brain : "fast"; // 金欠なら強制反射
    setCoins((c) => Math.max(0, c - (usedBrain === "fast" ? COST_FAST : COST_SLOW)));

    if (job.deep && usedBrain === "fast") {
      setLives((l) => l - 1);
      setFeedback({ ok: false, icon: "💥", text: `${timeout ? "時間切れで反射AIに流れた！" : ""}反射AIが浅い答えで事故…。${job.note}` });
    } else if (!job.deep && usedBrain === "slow") {
      setScore((s) => s + 0); // オーバーキルはノーカウント（コインだけ減る）
      setFeedback({ ok: false, icon: "🐢", text: `熟考AIが3分考えて「こんにちは」と返しました。正解だけどコストが…。${job.note}` });
    } else {
      setScore((s) => s + 1);
      setFeedback({ ok: true, icon: usedBrain === "fast" ? "⚡" : "🧠", text: `${usedBrain === "fast" ? "反射AIが秒で処理！" : "熟考AIがじっくり解決！"}${job.note}` });
    }
  };

  const next = () => {
    setFeedback(null);
    if (lives <= 0 || idx + 1 >= jobs.length) setPhase("result");
    else {
      setIdx(idx + 1);
      setTimeLeft(TIME_PER_JOB);
    }
  };

  React.useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(next, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  const grade = phase === "result" ? gradeFor(score) : null;
  React.useEffect(() => {
    if (grade) unlock("nou", grade.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "30px 24px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>⚡🧠</div>
          <h2 style={{ margin: "8px 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,28px)" }}>その仕事、どっちの脳に任せる？</h2>
          <p style={{ margin: "0 auto 8px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>
            流れてくる仕事{JOBS.length}件を、<b>反射AI⚡（{COST_FAST}コイン・速いが浅い）</b>と<b>熟考AI🧠（{COST_SLOW}コイン・遅いが深い）</b>に振り分けてください。予算は{COIN_START}コイン、ミスは3回まで。
          </p>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>※「一見カンタン、実は深い」ひっかけ仕事が混ざっています</p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-lightning" />}>
            仕分けをはじめる
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "result" && grade) {
    const shareText = `推論モデル仕分けゲームで【${grade.name}】${grade.emoji}でした（${score}/${JOBS.length}件を正しく采配・残${coins}コイン）\n速い脳と遅い脳、使い分けられる？\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/nou")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>RESULT — 営業終了</div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            {score}/{jobs.length} 件を正しく采配　残り{coins}コイン
          </div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              推論モデル（考えてから答えるAI）は賢いぶん遅くて高い。実務の腕の見せどころは「どの仕事にどっちを使うか」です。見た目の単純さに騙されず、裏にある推論の深さで選ぶ——それがAI時代の采配力。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} data-ga="share_click" data-ga-network="x" data-ga-place="result" data-ga-path="/nou">
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                采配結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={start} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一度仕分ける
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
        <span>
          {idx + 1}/{jobs.length}件目　✅{score}
        </span>
        <span>
          🪙{coins}　{"❤️".repeat(Math.max(0, lives))}
        </span>
      </div>
      <div style={{ height: 8, background: "rgba(20,17,15,0.12)", borderRadius: 4, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ width: `${(timeLeft / TIME_PER_JOB) * 100}%`, height: "100%", background: timeLeft / TIME_PER_JOB < 0.3 ? "var(--red-500)" : "var(--yellow-400)", borderRadius: 4 }} />
      </div>

      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div key={idx} className="game-in" style={{ padding: "26px 20px 24px", textAlign: "center", minHeight: 130 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>📥 新しい依頼</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(17px,2.8vw,21px)", lineHeight: 1.5 }}>{job?.label}</div>
          {job?.sub && <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{job.sub}</div>}
        </div>

        {feedback && (
          <div className="game-in" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "12px 18px 14px", background: feedback.ok ? "var(--paper-100)" : "#fff2f2" }}>
            <div style={{ fontSize: 14, lineHeight: 1.8, fontWeight: 700 }}>
              {feedback.icon} {feedback.text}
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button
          type="button"
          onClick={() => assign("fast")}
          disabled={!!feedback}
          style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, padding: "16px 10px", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-0)", cursor: "pointer", boxShadow: "var(--shadow-pop-sm)" }}
        >
          ⚡ 反射AI
          <span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{COST_FAST}コイン・秒で返す</span>
        </button>
        <button
          type="button"
          onClick={() => assign("slow")}
          disabled={!!feedback || coins < COST_SLOW}
          style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, padding: "16px 10px", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: coins < COST_SLOW ? "var(--paper-100)" : "var(--yellow-400)", cursor: coins < COST_SLOW ? "not-allowed" : "pointer", boxShadow: "var(--shadow-pop-sm)", opacity: coins < COST_SLOW ? 0.55 : 1 }}
        >
          🧠 熟考AI
          <span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{COST_SLOW}コイン・じっくり考える</span>
        </button>
      </div>
    </div>
  );
}
