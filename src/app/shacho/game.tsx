"use client";
/* ============================================================
   「AI社長」— マルチエージェント経営ゲーム。
   6枚のタスクカードを、3体の部下エージェント × 3フェーズの
   マス目に配置して段取りを設計 → 実行するとシミュレーションが
   ログで流れ、段取りの良し悪しで結末が変わる。
   すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

type AgentKey = "chosa" | "shippitsu" | "check";
const AGENTS: { key: AgentKey; emoji: string; name: string; forte: string }[] = [
  { key: "chosa", emoji: "🔎", name: "調査猫", forte: "調べもの担当" },
  { key: "shippitsu", emoji: "✍️", name: "執筆猫", forte: "書きもの担当" },
  { key: "check", emoji: "🧐", name: "チェック猫", forte: "検品担当" },
];

interface Task {
  id: string;
  label: string;
  icon: string;
  best: AgentKey; // 適性のある担当
  kind: "research" | "write" | "review";
}
const TASKS: Task[] = [
  { id: "shiryo", label: "資料しらべ", icon: "📚", best: "chosa", kind: "research" },
  { id: "data", label: "データ集計", icon: "📊", best: "chosa", kind: "research" },
  { id: "kiji", label: "レポート執筆", icon: "📝", best: "shippitsu", kind: "write" },
  { id: "zuhyo", label: "図表づくり", icon: "📈", best: "shippitsu", kind: "write" },
  { id: "fact", label: "ファクトチェック", icon: "🔍", best: "check", kind: "review" },
  { id: "review", label: "最終レビュー", icon: "✅", best: "check", kind: "review" },
];

interface Placement {
  agent: AgentKey;
  phase: number; // 0..2
}

interface SimResult {
  logs: { icon: string; text: string; bad?: boolean }[];
  quality: number;
  time: number;
  ending: { id: string; emoji: string; name: string; story: string; lesson: string };
}

function simulate(place: Record<string, Placement>): SimResult {
  const logs: SimResult["logs"] = [];
  let quality = 100;
  let depFails = 0;
  let overloadTotal = 0;

  const phaseOf = (id: string) => place[id].phase;
  const researchDone = (before: number) => TASKS.filter((t) => t.kind === "research").every((t) => phaseOf(t.id) < before);
  const writeDone = (before: number) => TASKS.filter((t) => t.kind === "write").every((t) => phaseOf(t.id) < before);

  /* フェーズごとに進行ログを作る */
  for (let p = 0; p < 3; p++) {
    const inPhase = TASKS.filter((t) => phaseOf(t.id) === p);
    if (inPhase.length === 0) continue;
    logs.push({ icon: "🕘", text: `—— フェーズ${p + 1}、開始 ——` });
    /* 過負荷チェック */
    for (const a of AGENTS) {
      const load = inPhase.filter((t) => place[t.id].agent === a.key).length;
      if (load >= 2) {
        overloadTotal += load - 1;
        logs.push({ icon: a.emoji, text: `${a.name}「${load}件同時はさすがに…（残業が確定した）」`, bad: true });
        quality -= 5 * (load - 1);
      }
    }
    for (const t of inPhase) {
      const agent = AGENTS.find((a) => a.key === place[t.id].agent)!;
      /* 適性ミスマッチ */
      if (agent.key !== t.best) {
        quality -= 12;
        logs.push({ icon: agent.emoji, text: `${agent.name}、慣れない「${t.label}」に挑戦中…（本職じゃないので時間がかかる）`, bad: true });
      }
      /* 依存関係 */
      if (t.kind === "write" && !researchDone(p)) {
        quality -= 25;
        depFails++;
        logs.push({ icon: "🔥", text: `${agent.name}「調査まだですか？…もういいや、それっぽく書いちゃえ」（${t.label}に捏造の気配）`, bad: true });
      } else if (t.kind === "review" && !writeDone(p)) {
        quality -= 20;
        depFails++;
        logs.push({ icon: "💨", text: `${agent.name}「レビューする原稿が、まだ存在しないんですが…」（${t.label}が空振り）`, bad: true });
      } else {
        logs.push({ icon: agent.emoji, text: `${agent.name}が「${t.label}」を完了！${agent.key === t.best ? "さすが本職。" : ""}` });
      }
    }
  }

  const phasesUsed = new Set(Object.values(place).map((pl) => pl.phase)).size;
  const time = phasesUsed + Math.min(2, overloadTotal);
  if (time > 3) {
    quality -= 10;
    logs.push({ icon: "⏰", text: "残業のせいで納期を1日オーバー…（クライアントの目が冷たい）", bad: true });
  }
  quality = Math.max(0, quality);

  /* ワンオペ判定 */
  const usedAgents = new Set(Object.values(place).map((pl) => pl.agent));

  let ending: SimResult["ending"];
  if (usedAgents.size === 1) {
    ending = {
      id: "wanope",
      emoji: "🫠",
      name: "ワンオペ社長",
      story: "1体のエージェントに全部を任せた結果、その子は燃え尽き、他の2体は暇を持て余しました。成果物は…出ました。魂と引き換えに。",
      lesson: "マルチエージェントの意味は「分業」。1体に全部任せるなら、それはただの過労です。",
    };
  } else if (depFails >= 2) {
    ending = {
      id: "dengon",
      emoji: "🌀",
      name: "伝言ゲーム地獄",
      story: "調査の前に執筆が走り、原稿の前にレビューが空振り。それっぽい数字と空のレビューが合体した怪文書が納品されました。",
      lesson: "エージェントは指示どおり「並列」に動きます。依存関係の設計を間違えると、間違いも並列で量産されます。",
    };
  } else if (overloadTotal >= 3) {
    ending = {
      id: "zangyo",
      emoji: "🔥",
      name: "残業まみれの現場",
      story: "同じ猫に仕事が集中し、オフィスの灯りは消えませんでした。品質はギリギリ、猫はヘトヘト。労基署ならぬ猫基署が来ます。",
      lesson: "並列化の敵は「偏り」。負荷を分散させてこそ、マルチエージェントは速くなります。",
    };
  } else if (quality >= 90 && time <= 3) {
    ending = {
      id: "kanpeki",
      emoji: "👑",
      name: "完璧な分業",
      story: "調査→執筆→チェックが美しく流れ、全員が本職で輝きました。納期どおり、品質満点。部下の猫たちから尊敬の目で見られています。",
      lesson: "適材適所×正しい順序×並列。これがマルチエージェント設計の教科書です。あなたには才能があります。",
    };
  } else if (quality >= 70) {
    ending = {
      id: "kenjitsu",
      emoji: "🧱",
      name: "堅実な中間管理職",
      story: "多少のもたつきはあれど、ちゃんと成果物は納品されました。派手さはないが、破綻もない。現実のプロジェクトはだいたいこれです。",
      lesson: "80点の段取りを安定して出せるのは、実はすごいこと。あとは適性と依存関係を磨けば90点が見えます。",
    };
  } else {
    ending = {
      id: "kaigi",
      emoji: "😵",
      name: "会議だけで一日が終わった",
      story: "段取りの混乱を収拾するための会議が3回開かれ、気づけば夕方。成果物は「明日から本気出す」という決意表明でした。",
      lesson: "エージェントが働けるかは、リーダーの設計次第。次はタスクの順序と適性を見直してみましょう。",
    };
  }
  return { logs, quality, time, ending };
}

export function ShachoGame() {
  const [place, setPlace] = React.useState<Record<string, Placement>>({});
  const [selected, setSelected] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const [shownLogs, setShownLogs] = React.useState<SimResult["logs"]>([]);
  const [result, setResult] = React.useState<SimResult | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => unlock("rooms", "shacho"), []);

  const unplaced = TASKS.filter((t) => !place[t.id]);
  const allPlaced = unplaced.length === 0;

  const putTask = (agent: AgentKey, phase: number) => {
    if (!selected || running) return;
    setPlace((p) => ({ ...p, [selected]: { agent, phase } }));
    setSelected(null);
  };
  const removeTask = (id: string) => {
    if (running) return;
    setPlace((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
  };

  const run = () => {
    if (!allPlaced || running) return;
    const sim = simulate(place);
    setResult(sim);
    setRunning(true);
    setShownLogs([]);
    setDone(false);
    sim.logs.forEach((log, i) => {
      setTimeout(() => {
        setShownLogs((l) => [...l, log]);
        if (i === sim.logs.length - 1) setTimeout(() => setDone(true), 600);
      }, 550 * (i + 1));
    });
  };

  React.useEffect(() => {
    if (done && result) unlock("shacho", result.ending.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const reset = () => {
    setPlace({});
    setSelected(null);
    setRunning(false);
    setShownLogs([]);
    setResult(null);
    setDone(false);
  };

  const cellStyle: React.CSSProperties = {
    minHeight: 52,
    border: "1.5px dashed rgba(20,17,15,0.25)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    cursor: "pointer",
    background: "var(--paper-0)",
    padding: 4,
  };

  return (
    <div>
      {!running && (
        <>
          {/* タスクトレイ */}
          <Card variant="pop" padding={0} style={{ overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: "12px 16px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14 }}>
              📋 今日の仕事：「AI市場調査レポート」を作る（納期：3フェーズ）
            </div>
            <div style={{ padding: "12px 14px", display: "flex", gap: 8, flexWrap: "wrap", minHeight: 56 }}>
              {unplaced.length === 0 ? (
                <span style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>全タスク配置ずみ。「実行」でシミュレーション開始！</span>
              ) : (
                unplaced.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(selected === t.id ? null : t.id)}
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: 13,
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "var(--bw-line) solid var(--ink-900)",
                      background: selected === t.id ? "var(--yellow-400)" : "var(--paper-0)",
                      cursor: "pointer",
                      boxShadow: selected === t.id ? "none" : "var(--shadow-pop-sm)",
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))
              )}
            </div>
            {selected && (
              <div style={{ padding: "0 16px 10px", fontFamily: "var(--font-hand)", fontSize: 12.5, color: "var(--red-600)" }}>
                ↓ 下の表の置きたいマスをタップ
              </div>
            )}
          </Card>

          {/* 配置ボード：3フェーズ × 3エージェント */}
          <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 16px", overflowX: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "92px repeat(3, 1fr)", gap: 6, minWidth: 430 }}>
                <div />
                {[0, 1, 2].map((p) => (
                  <div key={p} style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12 }}>
                    フェーズ{p + 1}
                  </div>
                ))}
                {AGENTS.map((a) => (
                  <React.Fragment key={a.key}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", fontSize: 12, fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                      <span style={{ fontSize: 20 }}>{a.emoji}</span>
                      {a.name}
                      <span style={{ fontFamily: "var(--font-hand)", fontWeight: 400, fontSize: 10.5, color: "var(--text-muted)" }}>{a.forte}</span>
                    </div>
                    {[0, 1, 2].map((p) => {
                      const here = TASKS.filter((t) => place[t.id]?.agent === a.key && place[t.id]?.phase === p);
                      return (
                        <div key={p} style={{ ...cellStyle, background: selected ? "#fffbe8" : "var(--paper-0)", flexDirection: "column", gap: 4 }} onClick={() => putTask(a.key, p)}>
                          {here.length === 0 ? (
                            <span style={{ color: "rgba(20,17,15,0.25)" }}>＋</span>
                          ) : (
                            here.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTask(t.id);
                                }}
                                style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11.5, padding: "4px 8px", borderRadius: 999, border: "var(--bw-line) solid var(--ink-900)", background: "var(--yellow-400)", cursor: "pointer", whiteSpace: "nowrap" }}
                                title="タップで戻す"
                              >
                                {t.icon} {t.label}
                              </button>
                            ))
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ padding: "0 16px 16px", textAlign: "center" }}>
              <Button variant="primary" size="lg" onClick={run} iconRight={<i className="ph-bold ph-play" />} style={{ opacity: allPlaced ? 1 : 0.5 }}>
                {allPlaced ? "実行！（社長の腕の見せどころ）" : `あと${unplaced.length}枚を配置してください`}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* 実行ログ */}
      {running && (
        <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: "var(--ink-900)", color: "var(--paper-50)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
            ▶ PROJECT RUNNING…
          </div>
          <div style={{ padding: "14px 16px", minHeight: 200 }}>
            {shownLogs.map((log, i) => (
              <div key={i} className="game-in" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8, fontSize: 13.5, lineHeight: 1.7, color: log.bad ? "var(--red-600)" : "var(--text-body)", fontWeight: log.bad ? 700 : 400 }}>
                <span style={{ flex: "none" }}>{log.icon}</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>

          {done && result && (
            <div className="game-in" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "20px 20px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>PROJECT REPORT — 結果発表</div>
              <div style={{ fontSize: 44, lineHeight: 1 }}>{result.ending.emoji}</div>
              <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{result.ending.name}</h2>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                品質 {result.quality}点　納期 {result.time <= 3 ? "セーフ" : "オーバー"}
              </div>
              <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 480 }}>{result.ending.story}</p>
              <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
                <Badge tone="ink">まなび</Badge>
                <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>{result.ending.lesson}</p>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`AI社長をやったら【${result.ending.name}】${result.ending.emoji}になった（品質${result.quality}点）\nあなたの段取り力は？\n#今さら聞けないAI用語集`)}&url=${encodeURIComponent("https://comixai.dev/shacho")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                    経営成績をXでシェア
                  </Button>
                </a>
                <Button variant="secondary" size="md" onClick={reset} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
                  段取りを組み直す
                </Button>
              </div>
              <ZukanNote />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
