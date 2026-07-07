"use client";
/* ============================================================
   「AIエージェントに任せてみた」— 見守りシミュレーション。
   エージェントが自律的に作業を進めるログが流れ、要所で
   「介入する？見守る？」の判断を迫られる。判断の積み重ねで
   エンディングが分岐する。すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";

interface LogLine {
  icon: string;
  text: string;
}
interface Choice {
  label: string;
  effect: (f: Flags) => Flags;
  reply: LogLine[]; // 選択後に流れるログ
}
interface Flags {
  trust: number;
  data: "safe" | "assumed" | "fabricated" | null;
  scope: "ok" | "creep" | null;
  abort: "self" | "redo" | null;
}

/* —— シナリオ（ログとふんいき重視） —— */
const SEG1: LogLine[] = [
  { icon: "🧑‍💼", text: "あなた「ライバル3社の調査レポート、まとめておいて」" },
  { icon: "🤖", text: "了解しました。ゴールを分解して計画を立てます" },
  { icon: "📋", text: "計画：①3社の公開情報を収集 → ②比較表に整理 → ③レポート化" },
  { icon: "🔍", text: "A社の公式サイトを読んでいます…" },
  { icon: "📄", text: "プレスリリース12件・決算資料2件を確認" },
  { icon: "🔍", text: "B社のニュース記事を収集中…" },
];
const CHOICE1: { prompt: string; options: Choice[] } = {
  prompt: "順調そう…だけど、ちょっと静かで不安になってきた。どうする？",
  options: [
    {
      label: "「進捗どう？」と聞く",
      effect: (f) => ({ ...f, trust: f.trust - 1 }),
      reply: [
        { icon: "🤖", text: "はい！いま2社目の途中です！（作業の手を止めて振り向いた）" },
        { icon: "⏱️", text: "報告のぶんだけ、すこし作業が遅れた" },
      ],
    },
    {
      label: "黙って見守る",
      effect: (f) => ({ ...f, trust: f.trust + 1 }),
      reply: [{ icon: "🔍", text: "（集中して作業が進んでいる…いいペース）" }],
    },
    {
      label: "不安すぎるので自分でやる",
      effect: (f) => ({ ...f, abort: "self" }),
      reply: [{ icon: "🧑‍💼", text: "あなた「やっぱいい！自分でやる！」" }],
    },
  ],
};
const SEG2: LogLine[] = [
  { icon: "📄", text: "B社・C社の情報収集が完了" },
  { icon: "⚠️", text: "問題発生：C社の売上データが非公開です" },
  { icon: "🤖", text: "どうしましょう？指示をください" },
];
const CHOICE2: { prompt: string; options: Choice[] } = {
  prompt: "C社の売上データが見つからない。エージェントへの指示は？",
  options: [
    {
      label: "「業界紙の推定値でOK。注記してね」",
      effect: (f) => ({ ...f, data: "assumed" }),
      reply: [
        { icon: "🤖", text: "了解です。業界紙の推定値を採用し、「※推定」と注記します" },
        { icon: "✅", text: "出どころが明確なら、推定値も立派なデータ" },
      ],
    },
    {
      label: "「出典が確かなものだけ使って」",
      effect: (f) => ({ ...f, data: "safe" }),
      reply: [
        { icon: "🤖", text: "承知しました。C社の売上欄は「非公開」と明記します" },
        { icon: "✅", text: "レポートは少し薄くなるが、ウソはゼロ" },
      ],
    },
    {
      label: "「うまいことなんとかして」",
      effect: (f) => ({ ...f, data: "fabricated" }),
      reply: [
        { icon: "🤖", text: "……なんとかします！（ゴソゴソ）" },
        { icon: "❓", text: "（何をどうなんとかしたんだろう…）" },
      ],
    },
  ],
};
const SEG3: LogLine[] = [
  { icon: "✍️", text: "3社の比較表を作成中…" },
  { icon: "📊", text: "強み・弱み・価格帯のグラフを生成" },
  { icon: "🤖", text: "提案：ついでに3社のSNS評判分析も追加できますが、やりますか？" },
];
const CHOICE3: { prompt: string; options: Choice[] } = {
  prompt: "エージェントが「ついでにSNS分析もやれる」と言い出した。",
  options: [
    {
      label: "「お、いいね！頼んだ！」",
      effect: (f) => ({ ...f, scope: "creep" }),
      reply: [
        { icon: "🤖", text: "了解です！分析対象を拡大します！" },
        { icon: "🌀", text: "作業量が2倍になった（締切は変わっていない）" },
      ],
    },
    {
      label: "「今回はいらない。仕上げて」",
      effect: (f) => ({ ...f, scope: "ok" }),
      reply: [
        { icon: "🤖", text: "承知しました。レポートの仕上げに入ります" },
        { icon: "✅", text: "ゴールがブレない。えらい" },
      ],
    },
    {
      label: "「そもそも全部やり直して」",
      effect: (f) => ({ ...f, abort: "redo" }),
      reply: [{ icon: "🤖", text: "え……最初から、ですか……（モチベーションの低下を検知）" }],
    },
  ],
};

interface Ending {
  emoji: string;
  title: string;
  stars: number;
  story: string;
  lesson: string;
}
function ending(f: Flags): Ending {
  if (f.abort === "self")
    return {
      emoji: "🫠",
      title: "「結局自分でやる」エンド",
      stars: 1,
      story: "あなたはエージェントを止め、徹夜で自分でレポートを作った。品質は悪くない。ただ、AIに任せた意味は1ミリもなかった。",
      lesson: "任せると決めたら、途中の沈黙に耐えるのも仕事のうち。心配なら「進め方」を最初に細かく指定しておきましょう。",
    };
  if (f.abort === "redo")
    return {
      emoji: "🌀",
      title: "「マイクロマネジメント沼」エンド",
      stars: 1,
      story: "ゴール目前のやり直し指示で、締切までに完成しなかった。エージェントは正しく動いていた。動いていなかったのは、任せる覚悟のほうだった。",
      lesson: "やり直しを命じるなら「何がどうダメか」をセットで。理由なきリテイクは、人間相手でもAI相手でも事故のもとです。",
    };
  if (f.data === "fabricated")
    return {
      emoji: "🔥",
      title: "「それっぽい数字事件」エンド",
      stars: 2,
      story: "レポートは期限内に完成した。だがC社の売上欄には、出どころ不明の「それっぽい数字」が。役員会でツッコまれ、レポート全体の信用が吹き飛んだ。",
      lesson: "「うまいことなんとかして」という曖昧な指示は、ハルシネーションの招待状です。データがないときの振る舞いこそ、具体的に指示しましょう。",
    };
  if (f.scope === "creep")
    return {
      emoji: "📦",
      title: "「風呂敷たたみきれず」エンド",
      stars: 3,
      story: "SNS分析まで広げた結果、本体のレポートが8割の完成度で締切を迎えた。「ついで」は無料に見えて、いちばん高くつく。",
      lesson: "エージェントは頼めば頼むほど働きます。だからこそ、ゴールの線引きは人間の仕事。「今回はここまで」が言えるのも指示力です。",
    };
  if (f.trust >= 1)
    return {
      emoji: "👑",
      title: "「神マネージャー」エンド",
      stars: 5,
      story: "見守るところは見守り、決めるところは即決した。レポートは期限内に、根拠つきで完成。上司の第一声は「これ、誰がまとめたの？」だった。",
      lesson: "任せる勇気と、判断ポイントでの明確な指示。AIエージェント時代のマネジメントは「人に仕事を任せる力」そのものです。",
    };
  return {
    emoji: "🧱",
    title: "「堅実の人」エンド",
    stars: 4,
    story: "こまめに確認しつつも、大きな判断は的確だった。レポートは無事完成。少し時間はかかったが、安心感のある進行だった。",
    lesson: "確認はコストですが、保険でもあります。タスクの重要度で「見守り度」を調整できると、もう一段速くなります。",
  };
}

type Step =
  | { type: "log"; lines: LogLine[] }
  | { type: "choice"; data: { prompt: string; options: Choice[] } };

const SCRIPT: Step[] = [
  { type: "log", lines: SEG1 },
  { type: "choice", data: CHOICE1 },
  { type: "log", lines: SEG2 },
  { type: "choice", data: CHOICE2 },
  { type: "log", lines: SEG3 },
  { type: "choice", data: CHOICE3 },
  { type: "log", lines: [{ icon: "✍️", text: "レポートを最終化しています…" }, { icon: "📦", text: "納品物を出力中…" }] },
];

export function AgentGame() {
  const [started, setStarted] = React.useState(false);
  const [visible, setVisible] = React.useState<LogLine[]>([]);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [lineIdx, setLineIdx] = React.useState(0);
  const [pendingChoice, setPendingChoice] = React.useState<{ prompt: string; options: Choice[] } | null>(null);
  const [flags, setFlags] = React.useState<Flags>({ trust: 0, data: null, scope: null, abort: null });
  const [finished, setFinished] = React.useState(false);
  const logRef = React.useRef<HTMLDivElement>(null);

  /* ログを1行ずつ流す */
  React.useEffect(() => {
    if (!started || pendingChoice || finished) return;
    const step = SCRIPT[stepIdx];
    if (!step) {
      setFinished(true);
      return;
    }
    if (step.type === "choice") {
      const t = setTimeout(() => setPendingChoice(step.data), 500);
      return () => clearTimeout(t);
    }
    if (lineIdx >= step.lines.length) {
      setStepIdx((i) => i + 1);
      setLineIdx(0);
      return;
    }
    const t = setTimeout(() => {
      setVisible((v) => [...v, step.lines[lineIdx]]);
      setLineIdx((i) => i + 1);
    }, 750);
    return () => clearTimeout(t);
  }, [started, stepIdx, lineIdx, pendingChoice, finished]);

  /* 自動スクロール */
  React.useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [visible, pendingChoice, finished]);

  const choose = (c: Choice) => {
    const next = c.effect(flags);
    setFlags(next);
    setPendingChoice(null);
    setVisible((v) => [...v, ...c.reply]);
    if (next.abort) {
      /* 打ち切り：残りのスクリプトを飛ばして終了へ */
      setStepIdx(SCRIPT.length);
      setLineIdx(0);
      setTimeout(() => setFinished(true), 1200);
    } else {
      setStepIdx((i) => i + 1);
      setLineIdx(0);
    }
  };

  const reset = () => {
    setStarted(true);
    setVisible([]);
    setStepIdx(0);
    setLineIdx(0);
    setPendingChoice(null);
    setFlags({ trust: 0, data: null, scope: null, abort: null });
    setFinished(false);
  };

  if (!started) {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "34px 30px 30px", textAlign: "center" }}>
          <div style={{ fontSize: 46, marginBottom: 8 }}>🤖💼</div>
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>
            AIエージェントに、仕事を任せてみよう。
          </h2>
          <p style={{ margin: "0 auto 22px", fontSize: 14.5, lineHeight: 1.9, color: "var(--text-muted)", maxWidth: 460 }}>
            お願いするのは「ライバル3社の調査レポート」。エージェントは勝手に動きます。
            あなたの仕事は、<strong>要所での判断だけ</strong>。任せ方しだいで結末が変わります（エンディング6種類）。
          </p>
          <Button variant="primary" size="lg" onClick={reset} iconRight={<i className="ph-bold ph-arrow-right" />}>
            仕事を頼む
          </Button>
        </div>
        <div style={{ borderTop: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)", padding: "10px 16px", textAlign: "center", fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>
          口を出しすぎても、放置しすぎても、事故ります
        </div>
      </Card>
    );
  }

  const end = finished ? ending(flags) : null;
  const shareText = end
    ? `AIエージェントに仕事を任せたら【${end.title}】${end.emoji}（満足度${"★".repeat(end.stars)}${"☆".repeat(5 - end.stars)}）だった。\nあなたはAIに任せられる派？\n#今さら聞けないAI用語集`
    : "";
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/agent")}`;

  return (
    <div>
      {/* エージェントの作業ログ */}
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: "var(--ink-900)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: finished ? "var(--yellow-400)" : "#3ddc84" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--paper-50)" }}>
            agent — 競合調査タスク {finished ? "（完了）" : "実行中…"}
          </span>
        </div>
        <div ref={logRef} style={{ maxHeight: 320, overflowY: "auto", padding: "14px 18px", background: "var(--paper-50)" }}>
          {visible.map((l, i) => (
            <div key={i} className="game-in" style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "5px 0", fontSize: 13.5, lineHeight: 1.7 }}>
              <span style={{ flex: "none" }}>{l.icon}</span>
              <span style={{ fontFamily: l.icon === "🧑‍💼" ? "var(--font-heading)" : "var(--font-body)", fontWeight: l.icon === "🧑‍💼" ? 700 : 400 }}>{l.text}</span>
            </div>
          ))}
          {!finished && !pendingChoice && (
            <div style={{ padding: "5px 0", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-muted)" }}>
              <i className="ph-bold ph-circle-notch tok-spin" /> …
            </div>
          )}
        </div>
      </Card>

      {/* 判断ポイント */}
      {pendingChoice && (
        <Card variant="pop" padding={18} className="game-in" style={{ marginTop: 16, borderColor: "var(--red-500)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Badge tone="red">あなたの判断</Badge>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14 }}>{pendingChoice.prompt}</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {pendingChoice.options.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => choose(o)}
                style={{
                  textAlign: "left",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "11px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "var(--bw-line) solid var(--ink-900)",
                  background: "var(--paper-0)",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-pop-sm)",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* エンディング */}
      {end && (
        <Card variant="pop" padding={0} className="game-in" style={{ marginTop: 18, overflow: "hidden" }}>
          <div style={{ padding: "26px 26px 22px", textAlign: "center", background: "var(--yellow-400)", borderBottom: "var(--bw-bold) solid var(--ink-900)" }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>{end.emoji}</div>
            <h2 style={{ margin: "8px 0 4px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.8vw,30px)" }}>{end.title}</h2>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15 }}>
              満足度 {"★".repeat(end.stars)}
              <span style={{ opacity: 0.35 }}>{"★".repeat(5 - end.stars)}</span>
            </div>
          </div>
          <div style={{ padding: "20px 24px 24px" }}>
            <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.95, color: "var(--text-body)" }}>{end.story}</p>
            <div style={{ border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-100)", padding: "12px 16px", marginBottom: 18 }}>
              <Badge tone="ink">まなび</Badge>
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>{end.lesson}</p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                  結末をXでシェア
                </Button>
              </a>
              <Button variant="secondary" size="md" onClick={reset} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
                別の任せ方を試す
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
