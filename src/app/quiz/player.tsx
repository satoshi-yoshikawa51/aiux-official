"use client";
/* ============================================================
   AI用語力診断クイズの本体。全てクライアント側で完結する
   （静的サイトのまま動く。サーバー・DB不要）。
   出題：各レベルから4問ずつ計12問をランダム抽選し、
   選択肢の並びもシャッフルする。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { GRADES, QUESTIONS, QUIZ_SIZE, gradeFor, type QuizQuestion } from "./data";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

interface DrawnQuestion {
  src: QuizQuestion;
  choices: { text: string; correct: boolean }[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function draw(): DrawnQuestion[] {
  const perLevel = QUIZ_SIZE / 3;
  /* 同じ用語に複数の問題（通常＋ひっかけ）があるため、1回の診断では
     同じ用語から1問までしか出さない */
  const usedSlugs = new Set<string>();
  const picked = ([1, 2, 3] as const).flatMap((lv) => {
    const pool = shuffle(QUESTIONS.filter((q) => q.level === lv));
    const taken: typeof pool = [];
    for (const q of pool) {
      if (taken.length >= perLevel) break;
      if (usedSlugs.has(q.termSlug)) continue;
      usedSlugs.add(q.termSlug);
      taken.push(q);
    }
    return taken;
  });
  return picked.map((src) => ({
    src,
    choices: shuffle(src.choices.map((text, i) => ({ text, correct: i === src.answer }))),
  }));
}

const LEVEL_LABEL = { 1: "基礎", 2: "しくみ", 3: "活用" } as const;

export function QuizPlayer({ termNames }: { termNames: Record<string, string> }) {
  const [phase, setPhase] = React.useState<"start" | "play" | "result">("start");
  const [qs, setQs] = React.useState<DrawnQuestion[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [chosen, setChosen] = React.useState<number | null>(null); // 選択した選択肢のindex
  const [results, setResults] = React.useState<boolean[]>([]);

  const start = () => {
    setQs(draw());
    setIdx(0);
    setChosen(null);
    setResults([]);
    setPhase("play");
  };

  /* —— スタート画面 —— */
  if (phase === "start") {
    return (
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "34px 30px 30px", textAlign: "center" }}>
          {/* 表紙動画（テレビのワイプ風の丸窓・ループ再生）
              ReactはSSRでmuted属性を出力しないため、rawタグで埋め込む */}
          <div
            style={{
              width: 190,
              height: 190,
              margin: "0 auto 18px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "var(--bw-bold) solid var(--ink-900)",
              boxShadow: "var(--shadow-pop)",
              background: "var(--yellow-400)",
              transform: "rotate(-2deg)",
            }}
            dangerouslySetInnerHTML={{
              __html:
                '<video src="/quiz/top.mp4" autoplay muted loop playsinline preload="metadata" aria-hidden="true" style="width:100%;height:100%;object-fit:cover;display:block;"></video>',
            }}
          />
          {/* 5つの級キャラ */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            {GRADES.map((g) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={g.slug}
                src={g.image}
                alt={g.title}
                width={52}
                height={52}
                style={{ borderRadius: "50%", border: "2.5px solid var(--ink-900)", background: "#fff", objectFit: "cover" }}
              />
            ))}
          </div>
          <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.6vw,30px)" }}>
            あなたのAI用語力は、何級？
          </h2>
          <p style={{ margin: "0 auto 22px", fontSize: 14.5, lineHeight: 1.9, color: "var(--text-muted)", maxWidth: 440 }}>
            用語集の主要50語から毎回ランダムに<strong>12問</strong>を出題。
            1問ごとに解説つきだから、遊び終わるころには少し詳しくなっています。所要3分。
          </p>
          <Button variant="primary" size="lg" onClick={start} iconRight={<i className="ph-bold ph-arrow-right" />}>
            診断をはじめる
          </Button>
        </div>
        <div style={{ borderTop: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)", padding: "10px 16px", textAlign: "center", fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>
          全問正解の「AI賢者級」は出題プールが毎回変わるのでガチです
        </div>
      </Card>
    );
  }

  /* —— 結果画面 —— */
  if (phase === "result") {
    const score = results.filter(Boolean).length;
    const grade = gradeFor(score);
    unlock("quiz", grade.slug);
    const wrong = qs.filter((_, i) => !results[i]);
    const shareText = `AI用語力診断（全${QUIZ_SIZE}問）で${score}問正解！${grade.share}\nあなたのAI用語力は何級？\n#今さら聞けないAI用語集`;
    const shareUrl = `https://comixai.dev/quiz/result/${grade.slug}`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    return (
      <div>
        <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "34px 30px 28px", textAlign: "center", background: "var(--yellow-400)", borderBottom: "var(--bw-bold) solid var(--ink-900)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.14em", marginBottom: 10 }}>
              RESULT — {score} / {QUIZ_SIZE} 問正解
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={grade.image}
              alt={grade.title}
              width={150}
              height={150}
              style={{ margin: "0 auto 10px", borderRadius: "50%", border: "var(--bw-bold) solid var(--ink-900)", background: "#fff", objectFit: "cover", boxShadow: "var(--shadow-pop-sm)" }}
            />
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
            <ZukanNote />
          </div>
        </Card>

        {wrong.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <h3 style={{ margin: "0 0 12px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17 }}>
              <i className="ph-bold ph-book-open-text" style={{ color: "var(--red-600)" }} /> 間違えた{wrong.length}問は、用語集で復習
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {wrong.map((w) => (
                <a key={w.src.termSlug} href={`/glossary/${w.src.termSlug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <Card variant="flat" hover padding={14}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15 }}>{termNames[w.src.termSlug] ?? w.src.termSlug}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{w.src.explanation}</div>
                      </div>
                      <span style={{ flex: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                        解説へ <i className="ph-bold ph-arrow-right" />
                      </span>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* —— 出題画面 —— */
  const q = qs[idx];
  const answered = chosen != null;
  const correct = answered && q.choices[chosen].correct;
  return (
    <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
      {/* 進捗バー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
          Q{idx + 1}<span style={{ color: "var(--text-muted)" }}>/{QUIZ_SIZE}</span>
        </span>
        <div style={{ flex: 1, height: 10, border: "2px solid var(--ink-900)", borderRadius: 999, overflow: "hidden", background: "var(--paper-0)" }}>
          <div style={{ width: `${((idx + (answered ? 1 : 0)) / QUIZ_SIZE) * 100}%`, height: "100%", background: "var(--yellow-400)", transition: "width 0.35s var(--ease-pop)" }} />
        </div>
        <Badge tone="ink">{LEVEL_LABEL[q.src.level]}</Badge>
      </div>

      <div style={{ padding: "24px 24px 26px" }}>
        <h2 style={{ margin: "0 0 18px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(16.5px,2.6vw,19px)", lineHeight: 1.7 }}>{q.src.q}</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {q.choices.map((c, i) => {
            const isChosen = chosen === i;
            const showCorrect = answered && c.correct;
            const showWrong = answered && isChosen && !c.correct;
            return (
              <button
                key={c.text}
                type="button"
                disabled={answered}
                onClick={() => {
                  setChosen(i);
                  setResults((r) => [...r, c.correct]);
                }}
                style={{
                  textAlign: "left",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  padding: "13px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "var(--bw-line) solid var(--ink-900)",
                  background: showCorrect ? "var(--yellow-400)" : showWrong ? "var(--red-500)" : "var(--paper-0)",
                  color: showWrong ? "#fff" : "var(--ink-900)",
                  cursor: answered ? "default" : "pointer",
                  boxShadow: answered ? "none" : "var(--shadow-pop-sm)",
                  opacity: answered && !showCorrect && !showWrong ? 0.55 : 1,
                  transition: "background 0.15s ease, opacity 0.15s ease",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginRight: 10 }}>{"ABCD"[i]}</span>
                {c.text}
                {showCorrect && <i className="ph-bold ph-check-circle" style={{ marginLeft: 8 }} />}
                {showWrong && <i className="ph-bold ph-x-circle" style={{ marginLeft: 8 }} />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={{ marginTop: 18, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-100)", padding: "14px 16px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 6, color: correct ? "var(--ink-900)" : "var(--red-600)" }}>
              {correct ? "⭕ 正解！" : "❌ ざんねん…"}
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8, color: "var(--text-body)" }}>{q.src.explanation}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <a href={`/glossary/${q.src.termSlug}`} target="_blank" rel="noopener" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)", textDecoration: "none" }}>
                「{termNames[q.src.termSlug] ?? q.src.termSlug}」をくわしく見る <i className="ph-bold ph-arrow-up-right" />
              </a>
              {/* 折り返しても常に右端に固定する */}
              <span style={{ marginLeft: "auto" }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (idx + 1 >= qs.length) setPhase("result");
                  else {
                    setIdx(idx + 1);
                    setChosen(null);
                  }
                }}
                iconRight={<i className="ph-bold ph-arrow-right" />}
              >
                {idx + 1 >= qs.length ? "結果を見る" : "次の問題へ"}
              </Button>
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
