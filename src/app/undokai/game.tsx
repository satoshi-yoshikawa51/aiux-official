"use client";
/* ============================================================
   「AI運動会」— ベンチマーク体験ゲーム。
   ベンチマークスコアを見て、種目ごとにどのAI選手が勝つか予想。
   最終種目「実務」でベンチ王者がコケる——スコアと実力の
   ギャップを体感する。クライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

/* 3選手のプロフィール（ベンチスコア） */
const PLAYERS = [
  { id: "sugaku", emoji: "🤖", name: "カリキュラ君", desc: "数学98・コード70・知識65。理系エリート。", math: 98, code: 70, knowledge: 65 },
  { id: "kodo", emoji: "🦾", name: "コンパイラ先輩", desc: "数学72・コード97・知識60。コードの鬼。", math: 72, code: 97, knowledge: 60 },
  { id: "banji", emoji: "🧸", name: "そこそこ丸", desc: "数学80・コード78・知識82。全部そこそこ。", math: 80, code: 78, knowledge: 82 },
];

interface Event {
  name: string;
  emoji: string;
  desc: string;
  winner: string; // PLAYERSのid
  reveal: string;
}

const EVENTS: Event[] = [
  {
    name: "数学リレー",
    emoji: "🧮",
    desc: "微積分と確率の計算スピード勝負",
    winner: "sugaku",
    reveal: "数学98のカリキュラ君が圧勝。ここはスコアどおりの結果です。",
  },
  {
    name: "コーディング障害物走",
    emoji: "💻",
    desc: "バグだらけのコードを直して完走せよ",
    winner: "kodo",
    reveal: "コード97のコンパイラ先輩が独走。これもスコアが正直に出ました。",
  },
  {
    name: "雑学玉入れ",
    emoji: "🏀",
    desc: "歴史・地理・カルチャーの知識問題ラッシュ",
    winner: "banji",
    reveal: "知識82のそこそこ丸が接戦を制しました。平均型、意外とあなどれない。",
  },
  {
    name: "最終種目: 実務総合",
    emoji: "💼",
    desc: "「お客様への謝罪メールを、事情を汲んで書く」",
    winner: "banji",
    reveal: "ベンチ王者2人は正確だけど冷たい文面に…。空気の読める、そこそこ丸が優勝！ベンチマークにない種目で、順位はひっくり返りました。",
  },
];

const GRADES = [
  { id: "yosoya", min: 4, emoji: "🔮", name: "AI予想屋の神", comment: "全種目的中。スコアが効く種目と、スコアに出ない種目——その両方が見えています。モデル選びで迷わないタイプです。" },
  { id: "kansen", min: 2, emoji: "🎌", name: "目の肥えた観客", comment: "いい線いってました。ベンチマークは「種目別の成績表」。最後の種目のように、表にない実力が勝負を決めることもあります。" },
  { id: "oana", min: 0, emoji: "🎫", name: "大穴ハンター", comment: "予想は外れましたが、大事なことがわかったはず。スコアの数字だけでは、実務の勝者は当てられないのです。" },
];

export function UndokaiGame() {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [idx, setIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [picked, setPicked] = React.useState<{ ok: boolean; reveal: string; winner: (typeof PLAYERS)[number] } | null>(null);

  React.useEffect(() => unlock("rooms", "undokai"), []);

  const start = () => {
    setIdx(0);
    setScore(0);
    setPicked(null);
    setPhase("play");
  };

  const ev = EVENTS[idx];

  const bet = (playerId: string) => {
    if (picked) return;
    const ok = playerId === ev.winner;
    if (ok) setScore((s) => s + 1);
    setPicked({ ok, reveal: ev.reveal, winner: PLAYERS.find((p) => p.id === ev.winner)! });
  };

  const next = () => {
    setPicked(null);
    if (idx + 1 >= EVENTS.length) setPhase("result");
    else setIdx(idx + 1);
  };

  const grade = phase === "result" ? GRADES.find((g) => score >= g.min)! : null;
  React.useEffect(() => {
    if (grade) unlock("undokai", grade.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "30px 24px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🏃💨</div>
          <h2 style={{ margin: "8px 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,28px)" }}>スコアで、勝者を当てられるか。</h2>
          <p style={{ margin: "0 auto 12px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>
            AI選手3体が全{EVENTS.length}種目で激突。<b>ベンチマークスコアを頼りに、各種目の勝者を予想</b>してください。
            スコアは正直……とは限らないのが、この運動会の見どころです。
          </p>
          <div style={{ display: "grid", gap: 8, maxWidth: 420, margin: "0 auto 18px", textAlign: "left" }}>
            {PLAYERS.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", padding: "8px 12px", background: "var(--paper-0)" }}>
                <span style={{ fontSize: 26 }}>{p.emoji}</span>
                <span>
                  <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14 }}>{p.name}</span>
                  <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)" }}>{p.desc}</span>
                </span>
              </div>
            ))}
          </div>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-flag" />}>
            開会式へ
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "result" && grade) {
    const shareText = `ベンチマーク体験ゲーム「AI運動会」で【${grade.name}】${grade.emoji}でした（${score}/${EVENTS.length}種目的中）\nスコア最強のAIが、実務でコケる瞬間を見た\n#今さら聞けないAI用語集`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/undokai")}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "26px 24px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>RESULT — 閉会式</div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{grade.emoji}</div>
          <h2 style={{ margin: "6px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>{grade.name}</h2>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            予想的中: {score}/{EVENTS.length}種目
          </div>
          <p style={{ margin: "0 auto 14px", fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ textAlign: "left", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--yellow-400)", padding: "12px 16px", margin: "0 0 18px" }}>
            <Badge tone="ink">まなび</Badge>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.85, fontWeight: 700 }}>
              ベンチマークは「AIの共通テスト」。得意種目の比較には超便利ですが、実務は最後の種目のように「テストにない力」で決まることも多い。新モデルの最高スコア速報に振り回されず、最後は自分の用途で試す——それが正しいスコアとの付き合い方です。
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                予想結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={start} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一度予想する
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
        <span>{idx + 1}/{EVENTS.length}種目</span>
        <span>🔮 的中 {score}</span>
      </div>
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div key={idx} className="game-in" style={{ padding: "22px 20px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 34 }}>{ev.emoji}</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(17px,2.8vw,21px)" }}>{ev.name}</div>
          <div style={{ fontSize: 13.5, color: "var(--text-body)", marginTop: 6 }}>{ev.desc}</div>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>勝つのはどの選手？</div>
        </div>
        {picked && (
          <div className="game-in" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "14px 18px 16px", background: picked.ok ? "var(--paper-100)" : "#fff2f2" }}>
            <div style={{ fontSize: 14.5, fontWeight: 900 }}>
              {picked.ok ? "🎯 的中！" : "😵 はずれ…"} 優勝は {picked.winner.emoji} {picked.winner.name}
            </div>
            <p style={{ margin: "6px 0 10px", fontSize: 13.5, lineHeight: 1.85 }}>{picked.reveal}</p>
            <Button variant="primary" size="sm" onClick={next} iconRight={<i className="ph-bold ph-arrow-right" />}>
              {idx + 1 >= EVENTS.length ? "閉会式へ" : "次の種目へ"}
            </Button>
          </div>
        )}
      </Card>
      {!picked && (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {PLAYERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => bet(p.id)}
              className="game-in"
              style={{ textAlign: "left", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-0)", cursor: "pointer", boxShadow: "var(--shadow-pop-sm)", display: "flex", gap: 12, alignItems: "center" }}
            >
              <span style={{ fontSize: 26, flex: "none" }}>{p.emoji}</span>
              <span>
                <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14.5 }}>{p.name}</span>
                <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)" }}>{p.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
