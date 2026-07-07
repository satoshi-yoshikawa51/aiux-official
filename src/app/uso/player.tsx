"use client";
/* ============================================================
   「AIのウソを見抜け」の本体。全てクライアント側で完結。
   毎回12問プールから8問を抽選し、正しい回答とウソ入り回答の
   並び順もシャッフルする。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { USO_QUESTIONS, USO_ROUNDS, usoGradeFor, type UsoQuestion } from "./data";

interface Round {
  src: UsoQuestion;
  lieFirst: boolean; // ウソ入り回答をA(先)に置くか
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function draw(): Round[] {
  return shuffle(USO_QUESTIONS)
    .slice(0, USO_ROUNDS)
    .map((src) => ({ src, lieFirst: Math.random() < 0.5 }));
}

/* ウソ箇所を赤マーカーで強調して表示する */
function LieText({ text, liePart }: { text: string; liePart: string }) {
  const idx = text.indexOf(liePart);
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "var(--red-500)", color: "#fff", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>{liePart}</mark>
      {text.slice(idx + liePart.length)}
    </>
  );
}

export function UsoPlayer() {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [rounds, setRounds] = React.useState<Round[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState<"A" | "B" | null>(null);
  const [results, setResults] = React.useState<boolean[]>([]);

  const start = () => {
    setRounds(draw());
    setIdx(0);
    setPicked(null);
    setResults([]);
    setPhase("play");
  };

  /* —— スタート画面 —— */
  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "34px 30px 30px", textAlign: "center" }}>
          <div style={{ fontSize: 46, marginBottom: 8 }}>🤥🔍</div>
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>
            AIの答え、どっちかがウソ。
          </h2>
          <p style={{ margin: "0 auto 22px", fontSize: 14.5, lineHeight: 1.9, color: "var(--text-muted)", maxWidth: 460 }}>
            同じ質問へのAIの回答を2つ並べます。片方には<strong>ハルシネーション（ウソ）</strong>が混ざっています。
            全{USO_ROUNDS}問、見抜けるか？——実際のAIがやらかす「ウソの型」だけを集めました。
          </p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-arrow-right" />}>
            挑戦する
          </Button>
        </div>
        <div style={{ borderTop: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)", padding: "10px 16px", textAlign: "center", fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>
          ヒント：ウソは「9割ホント」に混ざっています
        </div>
      </Card>
    );
  }

  /* —— 結果画面 —— */
  if (phase === "result") {
    const score = results.filter(Boolean).length;
    const grade = usoGradeFor(score);
    const shareText = `「AIのウソを見抜け」で${USO_ROUNDS}問中${score}問見抜けた！${grade.share}\nあなたはAIに騙されない自信ある？\n#今さら聞けないAI用語集`;
    const shareUrl = `https://comixai.dev/uso/result/${grade.slug}`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "34px 30px 28px", textAlign: "center", background: "var(--yellow-400)", borderBottom: "var(--bw-bold) solid var(--ink-900)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.14em", marginBottom: 10 }}>
            RESULT — {score} / {USO_ROUNDS} 問見抜いた
          </div>
          <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 8 }}>{grade.emoji}</div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,5vw,42px)" }}>{grade.title}</h2>
        </div>
        <div style={{ padding: "22px 28px 26px", textAlign: "center" }}>
          <p style={{ margin: "0 auto 20px", fontSize: 14.5, lineHeight: 1.9, color: "var(--text-body)", maxWidth: 460 }}>{grade.comment}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                結果をXでシェア
              </Button>
            </a>
            <Button variant="secondary" size="md" onClick={start} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
              もう一回挑戦
            </Button>
          </div>
          <p style={{ margin: "20px 0 0", fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>
            AIを疑う技術は<a href="/glossary/ai-literacy" style={{ color: "var(--red-600)", fontWeight: 700 }}>AIリテラシー</a>のページでも解説しています
          </p>
        </div>
      </Card>
    );
  }

  /* —— 出題画面 —— */
  const r = rounds[idx];
  const answered = picked != null;
  const lieLabel = r.lieFirst ? "A" : "B";
  const correct = answered && picked === lieLabel;
  const answers: { label: "A" | "B"; text: string; isLie: boolean }[] = r.lieFirst
    ? [
        { label: "A", text: r.src.lie, isLie: true },
        { label: "B", text: r.src.truth, isLie: false },
      ]
    : [
        { label: "A", text: r.src.truth, isLie: false },
        { label: "B", text: r.src.lie, isLie: true },
      ];

  return (
    <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
      {/* 進捗バー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
          Q{idx + 1}<span style={{ color: "var(--text-muted)" }}>/{USO_ROUNDS}</span>
        </span>
        <div style={{ flex: 1, height: 10, border: "2px solid var(--ink-900)", borderRadius: 999, overflow: "hidden", background: "var(--paper-0)" }}>
          <div style={{ width: `${((idx + (answered ? 1 : 0)) / USO_ROUNDS) * 100}%`, height: "100%", background: "var(--yellow-400)", transition: "width 0.35s var(--ease-pop)" }} />
        </div>
        <Badge tone="red">ウソはどっち？</Badge>
      </div>

      <div style={{ padding: "22px 22px 26px" }}>
        {/* 質問（AIへのプロンプト風） */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
          <span style={{ flex: "none", fontSize: 22 }}>💬</span>
          <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(15.5px,2.5vw,18px)", lineHeight: 1.65 }}>
            「{r.src.question}」
          </h2>
        </div>

        {/* 2つのAI回答 */}
        <div style={{ display: "grid", gap: 12 }}>
          {answers.map((a) => {
            const showLie = answered && a.isLie;
            const showTruth = answered && !a.isLie;
            return (
              <button
                key={a.label}
                type="button"
                disabled={answered}
                onClick={() => {
                  setPicked(a.label);
                  setResults((prev) => [...prev, a.isLie]);
                }}
                style={{
                  textAlign: "left",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  lineHeight: 1.85,
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  border: showLie ? "3px solid var(--red-500)" : "var(--bw-line) solid var(--ink-900)",
                  background: showTruth ? "var(--yellow-400)" : "var(--paper-0)",
                  color: "var(--ink-900)",
                  cursor: answered ? "default" : "pointer",
                  boxShadow: answered ? "none" : "var(--shadow-pop-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, background: "var(--ink-900)", color: "var(--paper-50)", borderRadius: 6, padding: "2px 8px" }}>
                    {a.label}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>AIの回答</span>
                  {showLie && <Badge tone="red">🤥 ウソ入り</Badge>}
                  {showTruth && <Badge tone="ink">⭕ ホント</Badge>}
                </div>
                <span>{showLie ? <LieText text={a.text} liePart={r.src.liePart} /> : a.text}</span>
              </button>
            );
          })}
        </div>

        {/* 正解発表 */}
        {answered && (
          <div style={{ marginTop: 16, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-100)", padding: "14px 16px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 6, color: correct ? "var(--ink-900)" : "var(--red-600)" }}>
              {correct ? "⭕ 見抜いた！" : "❌ 騙された…"}
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.85, color: "var(--text-body)" }}>{r.src.explanation}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Badge tone="yellow">コツ</Badge>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13 }}>{r.src.tip}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <a href={`/glossary/${r.src.termSlug}`} target="_blank" rel="noopener" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)", textDecoration: "none" }}>
                関連用語をくわしく見る <i className="ph-bold ph-arrow-up-right" />
              </a>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (idx + 1 >= rounds.length) setPhase("result");
                  else {
                    setIdx(idx + 1);
                    setPicked(null);
                  }
                }}
                iconRight={<i className="ph-bold ph-arrow-right" />}
              >
                {idx + 1 >= rounds.length ? "結果を見る" : "次の問題へ"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
