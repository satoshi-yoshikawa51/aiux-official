"use client";
/* ============================================================
   「ご褒美で導け」— 強化学習体験ゲーム。
   AIを直接操作はできない。できるのは迷路にご褒美を置くことだけ。
   AIは「近くのご褒美」にしか反応しない（視野4マス）ので、
   おやつの点線でゴールまで誘導する——報酬設計を体感する。
   すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

const N = 5; // 5x5
const SIGHT = 4; // AIがご褒美を感知できるBFS距離
type Cell = { x: number; y: number };
const key = (c: Cell) => `${c.x},${c.y}`;

interface Round {
  start: Cell;
  goal: Cell;
  walls: string[]; // "x,y"
  tokens: number;
  maxSteps: number;
  tip: string;
}

const ROUNDS: Round[] = [
  {
    start: { x: 0, y: 2 },
    goal: { x: 4, y: 2 },
    walls: [],
    tokens: 2,
    maxSteps: 8,
    tip: "AIはご褒美にしか興味がありません。ゴールに置けば…？",
  },
  {
    start: { x: 0, y: 2 },
    goal: { x: 4, y: 2 },
    walls: ["2,0", "2,1", "2,2", "2,3"],
    tokens: 3,
    maxSteps: 12,
    tip: "壁の向こうのご褒美は「遠すぎて」見えません。おやつの点線でつないで",
  },
  {
    start: { x: 0, y: 0 },
    goal: { x: 4, y: 4 },
    walls: ["1,1", "1,2", "1,3", "3,1", "3,2", "3,3"],
    tokens: 3,
    maxSteps: 12,
    tip: "中央突破はご褒美が足りなくなるかも。遠回りが近道のことも",
  },
];

const GRADES = [
  { id: "sekkeishi", min: 3, emoji: "🏆", name: "報酬設計士", comment: "全ラウンドでAIをゴールまで導きました。直接操作せず、報酬の置き方だけで行動を作る——これがまさに強化学習の「報酬設計」です。" },
  { id: "kainushi", min: 2, emoji: "🦴", name: "見習い飼い主", comment: "おおむね導けました。コツは「AIの視野」を意識すること。遠すぎるご褒美は存在しないのと同じです。" },
  { id: "hack", min: 0, emoji: "🌀", name: "ハック誘発者", comment: "AIはご褒美を食べ尽くして昼寝したり、届かないご褒美の前で立ち尽くしたり。報酬の設計がズレると、賢いAIほど変な行動を学びます。現実の強化学習でも起きる「報酬ハッキング」です。" },
];

/* BFS: fromから各マスへの距離と経路復元用の親 */
function bfs(from: Cell, walls: Set<string>) {
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const q: Cell[] = [from];
  dist.set(key(from), 0);
  while (q.length) {
    const c = q.shift()!;
    const d = dist.get(key(c))!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = { x: c.x + dx, y: c.y + dy };
      if (n.x < 0 || n.y < 0 || n.x >= N || n.y >= N) continue;
      if (walls.has(key(n)) || dist.has(key(n))) continue;
      dist.set(key(n), d + 1);
      prev.set(key(n), key(c));
      q.push(n);
    }
  }
  return { dist, prev };
}

export function GohobiGame() {
  const [phase, setPhase] = React.useState<"start" | "plan" | "run" | "verdict" | "result">("start");
  const [round, setRound] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [rewards, setRewards] = React.useState<Set<string>>(new Set());
  const [ai, setAi] = React.useState<Cell>({ x: 0, y: 0 });
  const [steps, setSteps] = React.useState(0);
  const [verdict, setVerdict] = React.useState<{ ok: boolean; title: string; note: string } | null>(null);
  const simRef = React.useRef<number>(0);

  React.useEffect(() => unlock("rooms", "gohobi"), []);
  React.useEffect(() => () => window.clearInterval(simRef.current), []);

  const r = ROUNDS[round];
  const walls = React.useMemo(() => new Set(r?.walls ?? []), [r]);

  const start = () => {
    setRound(0);
    setScore(0);
    beginPlan(0);
    setPhase("plan");
  };

  const beginPlan = (ri: number) => {
    const rr = ROUNDS[ri];
    setRewards(new Set());
    setAi(rr.start);
    setSteps(0);
    setVerdict(null);
  };

  const toggleReward = (c: Cell) => {
    if (phase !== "plan") return;
    const k = key(c);
    if (walls.has(k) || k === key(r.start)) return;
    setRewards((prev) => {
      const nxt = new Set(prev);
      if (nxt.has(k)) nxt.delete(k);
      else if (nxt.size < r.tokens) nxt.add(k);
      return nxt;
    });
  };

  /* シミュレーション実行 */
  const run = () => {
    if (rewards.size === 0) return;
    setPhase("run");
    let pos = { ...r.start };
    let left = new Set(rewards);
    let used = 0;
    simRef.current = window.setInterval(() => {
      /* 視野内の最寄りご褒美を探す */
      const { dist, prev } = bfs(pos, walls);
      let target: string | null = null;
      let best = Infinity;
      for (const k of left) {
        const d = dist.get(k);
        if (d !== undefined && d <= SIGHT && d < best) {
          best = d;
          target = k;
        }
      }
      if (!target) {
        window.clearInterval(simRef.current);
        const anyLeft = left.size > 0;
        finish(false, anyLeft ? "🙈 ご褒美が見えない…" : "😴 ご褒美が尽きて昼寝を始めた", anyLeft ? `残りのご褒美はAIの視野（${SIGHT}マス）の外。AIにとって、見えない報酬は存在しないのと同じです。` : "ご褒美を食べ尽くしたAIは、ゴール目前でも動く理由がありません。報酬が尽きれば行動も止まる——それが強化学習。");
        return;
      }
      if (best === 0) {
        /* いま立っているマスのご褒美を食べる */
        left.delete(target);
        left = new Set(left);
        setRewards(new Set(left));
        if (target === key(r.goal)) {
          window.clearInterval(simRef.current);
          finish(true, "🎉 ゴールのご褒美をぱくり！", "おやつの点線が完璧でした。AIは最後まで「ご褒美を追っただけ」——でも結果として、あなたの思うとおりに動きました。");
          return;
        }
        return;
      }
      /* targetへ1歩（経路復元して最初の一歩） */
      let cur = target;
      while (prev.get(cur) !== key(pos) && prev.has(cur)) cur = prev.get(cur)!;
      const [nx, ny] = cur.split(",").map(Number);
      pos = { x: nx, y: ny };
      used += 1;
      setAi(pos);
      setSteps(used);
      if (used >= r.maxSteps) {
        window.clearInterval(simRef.current);
        finish(false, "🥵 歩数切れでバテた", `${r.maxSteps}歩以内にたどり着けませんでした。ご褒美の順番が遠回りを生んだかも。配置は行動の設計図です。`);
      }
    }, 340);
  };

  const finish = (ok: boolean, title: string, note: string) => {
    if (ok) setScore((s) => s + 1);
    setVerdict({ ok, title, note });
    setPhase("verdict");
  };

  const next = () => {
    if (round + 1 >= ROUNDS.length) setPhase("result");
    else {
      const ri = round + 1;
      setRound(ri);
      beginPlan(ri);
      setPhase("plan");
    }
  };

  const grade = phase === "result" ? GRADES.find((g) => score >= g.min)! : null;
  React.useEffect(() => {
    if (grade) unlock("gohobi", grade.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "30px 24px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🍖🤖</div>
          <h2 style={{ margin: "8px 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,28px)" }}>操作禁止。置けるのは、ご褒美だけ。</h2>
          <p style={{ margin: "0 auto 8px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>
            迷路のAIはあなたの指示を聞きません。でも<b>ご褒美🍖には逆らえません</b>。
            マスをタップしてご褒美を配置し、AIをゴール🚩まで誘導してください。
          </p>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>※AIの視野は{SIGHT}マス。遠くのご褒美は見えません</p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-bone" />}>
            誘導をはじめる
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "result" && grade) {
    const shareText = `強化学習体験ゲーム「ご褒美で導け」で【${grade.name}】${grade.emoji}でした（${score}/${ROUNDS.length}ラウンド成功）\n操作禁止、置けるのはご褒美だけ。\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/gohobi")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>RESULT — 飼育記録</div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            誘導成功: {score}/{ROUNDS.length}ラウンド
          </div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              強化学習では、AIの行動を直接プログラムせず「報酬」で導きます。囲碁のAlphaGoも、ChatGPTの調教（RLHF）も原理は今日のご褒美と同じ。そして報酬の置き方がズレると、AIは平気で変な行動を学ぶ——「何にご褒美を出すか」は、AI時代の超重要スキルです。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                飼育結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={start} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一度導く
            </Button>
          </div>
          <ZukanNote />
        </div>
      </Card>
    );
  }

  /* —— 盤面（plan / run / verdict 共通） —— */
  const cells: Cell[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) cells.push({ x, y });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
        <span>ラウンド {round + 1}/{ROUNDS.length}</span>
        <span>🍖 残り{r.tokens - rewards.size}個　👣 {steps}/{r.maxSteps}歩</span>
      </div>
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 16px 8px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>💡 {r.tip}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`, gap: 5, padding: "8px 16px 16px", maxWidth: 360, margin: "0 auto" }}>
          {cells.map((c) => {
            const k = key(c);
            const isWall = walls.has(k);
            const isAi = k === key(ai);
            const isGoal = k === key(r.goal);
            const hasReward = rewards.has(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleReward(c)}
                disabled={phase !== "plan" || isWall}
                aria-label={`マス${c.x},${c.y}`}
                style={{
                  aspectRatio: "1",
                  borderRadius: 8,
                  border: "2px solid var(--ink-900)",
                  background: isWall ? "var(--ink-900)" : isGoal ? "var(--yellow-400)" : "var(--paper-0)",
                  fontSize: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: phase === "plan" && !isWall ? "pointer" : "default",
                  padding: 0,
                }}
              >
                {isAi ? "🤖" : hasReward ? "🍖" : isGoal ? "🚩" : ""}
              </button>
            );
          })}
        </div>
        {phase === "verdict" && verdict && (
          <div className="game-in" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "14px 18px 16px", background: verdict.ok ? "var(--paper-100)" : "#fff2f2" }}>
            <div style={{ fontSize: 14.5, fontWeight: 900 }}>{verdict.title}</div>
            <p style={{ margin: "6px 0 10px", fontSize: 13.5, lineHeight: 1.85 }}>{verdict.note}</p>
            <div style={{ display: "flex", gap: 8 }}>
              {!verdict.ok && (
                <Button variant="secondary" size="sm" onClick={() => { beginPlan(round); setPhase("plan"); }} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
                  同じ迷路をやり直す
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={next} iconRight={<i className="ph-bold ph-arrow-right" />}>
                {round + 1 >= ROUNDS.length ? "結果を見る" : "次の迷路へ"}
              </Button>
            </div>
          </div>
        )}
      </Card>
      {phase === "plan" && (
        <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "center" }}>
          <Button variant="primary" size="md" onClick={run} disabled={rewards.size === 0} iconRight={<i className="ph-bold ph-play" />}>
            AIを放つ
          </Button>
          <Button variant="secondary" size="md" onClick={() => setRewards(new Set())}>
            置き直す
          </Button>
        </div>
      )}
      {phase === "run" && (
        <div style={{ marginTop: 14, textAlign: "center", fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>
          🤖 AIがご褒美を探しています…
        </div>
      )}
    </div>
  );
}
