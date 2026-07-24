"use client";
/* ============================================================
   講師ガイドレイヤー（モーダル版）

   ページ側: コンテンツ説明のあとに「コース選択カード」を表示。
   コースを選ぶと、シミュレーター＋3D講師のモーダルが開く。
   モーダル内は画面も講師も固定で、ページスクロールとは無縁。

   - コースは courses.ts のデータ駆動（GuideStep[]）
   - target: game.tsx側の data-guide 属性名をハイライト
   - waitFor: ClaudeAppSimのonEventイベントで達成判定
   - skipIf: 状況的に不要なステップは自動スキップ
   - 先回り操作はイベントキューで取りこぼさない
   - 修了コースは localStorage に記録して✓表示
   ============================================================ */
import React from "react";
import { createPortal } from "react-dom";
import { ClaudeAppSim, type SimEvent } from "./game";
import { Sensei, type SenseiHandle } from "./sensei";
import { COURSES, type GuideCtx } from "./courses";

const DONE_KEY = "claude-app-courses-done";

/* ———— ハイライト枠＋矢印 ————
   scope: 検索範囲のセレクタ。プレイ映像(DemoMovie)も同じシミュレーターを
   描画していてdata-guideが重複するため、モーダル内に限定して探す */
function Highlight({ target, scope }: { target: string; scope?: string }) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  React.useEffect(() => {
    const sel = `${scope ? `${scope} ` : ""}[data-guide="${target}"]`;
    const update = () => {
      const el = document.querySelector(sel);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      /* 対象がドロップダウンやダイアログに覆われている間は枠を隠す
         （枠がポップアップの上に重なって挙動がおかしく見えるのを防ぐ）。
         ハイライト自身は pointer-events:none なので elementFromPoint に映らない */
      const probe = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + Math.min(r.height / 2, 24),
      );
      const covered = probe !== null && probe !== el && !el.contains(probe) && !probe.contains(el);
      setRect(covered ? null : r);
    };
    update();
    const timer = setInterval(update, 250); // 要素の出現・内部スクロールに追従
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [target, scope]);

  if (!rect || rect.width === 0) return null;
  const pad = 5;
  const arrowAbove = rect.top > 72;
  return (
    <>
      <div
        style={{
          position: "fixed", zIndex: 95, pointerEvents: "none",
          left: rect.left - pad, top: rect.top - pad,
          width: rect.width + pad * 2, height: rect.height + pad * 2,
          border: "3px solid #FF7A1A", borderRadius: 12,
          boxShadow: "0 0 0 3px rgba(255,122,26,.25), 0 0 18px rgba(255,122,26,.45)",
          animation: "guide-pulse 1.2s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "fixed", zIndex: 95, pointerEvents: "none",
          left: rect.left + rect.width / 2 - 14,
          top: arrowAbove ? rect.top - pad - 34 : rect.top + rect.height + pad + 4,
          fontSize: 26, animation: "guide-bounce .7s ease-in-out infinite alternate",
        }}
      >
        {arrowAbove ? "👇" : "👆"}
      </div>
      <style>{`
        @keyframes guide-pulse { 0%,100% { box-shadow: 0 0 0 3px rgba(255,122,26,.25), 0 0 18px rgba(255,122,26,.45) } 50% { box-shadow: 0 0 0 6px rgba(255,122,26,.12), 0 0 26px rgba(255,122,26,.6) } }
        @keyframes guide-bounce { from { transform: translateY(0) } to { transform: translateY(6px) } }
        @keyframes guide-q { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
      `}</style>
    </>
  );
}

/* ———— 本体 ———— */
export function GuidedClaudeApp() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [courseId, setCourseId] = React.useState<string | null>(null); // nullで自由モード
  const [stepIdx, setStepIdx] = React.useState(0);
  const [typed, setTyped] = React.useState(0);
  const [done, setDone] = React.useState<string[]>([]);
  const senseiRef = React.useRef<SenseiHandle>(null);
  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /* シミュレーターの状況（skipIf判定用） */
  const ctxRef = React.useRef<GuideCtx>({ device: "pc", tab: "chat" });

  const course = COURSES.find((c) => c.id === courseId) ?? null;
  const step = modalOpen && course ? course.steps[stepIdx] : null;
  const stepRef = React.useRef(step);
  stepRef.current = step;

  React.useEffect(() => {
    ctxRef.current.device = window.matchMedia("(max-width: 700px)").matches ? "sp" : "pc";
    try {
      const s = localStorage.getItem(DONE_KEY);
      if (s) setDone(JSON.parse(s));
    } catch { /* noop */ }
  }, []);

  /* モーダル表示中はページのスクロールを止める */
  React.useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [modalOpen]);

  const finishCourse = React.useCallback((id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try { localStorage.setItem(DONE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
    setCourseId(null);
    setStepIdx(0);
    setModalOpen(false);
    /* 総まとめ修了後は「本物をはじめる」コーナーへ案内 */
    if (id === "matome") {
      setTimeout(() => {
        document.getElementById("start-real")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, []);

  const advance = React.useCallback(() => {
    const c = COURSES.find((x) => x.id === courseId);
    if (!c) return;
    setStepIdx((i) => {
      let n = i + 1;
      while (n < c.steps.length && c.steps[n].skipIf?.(ctxRef.current)) n++;
      if (n >= c.steps.length) {
        finishCourse(c.id);
        return 0;
      }
      return n;
    });
  }, [courseId, finishCourse]);

  /* 直近ステップ中の未消化イベント（先回り操作対策） */
  const evQueue = React.useRef<SimEvent[]>([]);

  const achieve = React.useCallback((s: NonNullable<typeof step>) => {
    stepRef.current = null; // 二重判定防止
    if (s.onDone?.motion) senseiRef.current?.play(s.onDone.motion);
    if (s.onDone?.emote) senseiRef.current?.emote(s.onDone.emote);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(advance, s.onDone ? 1000 : 350);
  }, [advance]);

  const onEvent = React.useCallback((e: SimEvent) => {
    if (e.type === "deviceChange") ctxRef.current.device = e.device;
    if (e.type === "tabChange") ctxRef.current.tab = e.tab;
    const s = stepRef.current;
    if (s?.waitFor && s.waitFor(e)) {
      achieve(s);
      return;
    }
    evQueue.current.push(e);
    if (evQueue.current.length > 20) evQueue.current.shift();
  }, [achieve]);

  /* ステップ開始: モーション・エモート・タイプライター（経過時間ベース） */
  React.useEffect(() => {
    if (!step) return;
    setTyped(0);
    if (step.motion) senseiRef.current?.play(step.motion);
    if (step.emote) senseiRef.current?.emote(step.emote);
    const t0 = Date.now();
    const iv = setInterval(() => {
      const n = Math.min(step.text.length, Math.floor((Date.now() - t0) / 26));
      setTyped(n);
      if (n >= step.text.length) clearInterval(iv);
    }, 50);
    /* 前ステップ中に先回りで済ませた操作があれば即時達成 */
    if (step.waitFor) {
      const hit = evQueue.current.find((e) => step.waitFor!(e));
      if (hit) achieve(step);
    }
    evQueue.current = [];
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, courseId, stepIdx]);

  /* モーダルを開くとシミュレーターは初期状態で再マウントされるため、
     ガイド側のコンテキストも毎回リセットする（前回のタブ等を持ち越さない） */
  const resetCtx = () => {
    ctxRef.current = {
      device: window.matchMedia("(max-width: 700px)").matches ? "sp" : "pc",
      tab: "chat",
    };
  };
  const startCourse = (id: string) => {
    const c = COURSES.find((x) => x.id === id);
    if (!c) return;
    evQueue.current = []; // 前回セッションの先回りイベントを持ち越さない
    resetCtx();
    let n = 0;
    while (n < c.steps.length && c.steps[n].skipIf?.(ctxRef.current)) n++;
    setCourseId(id);
    setStepIdx(n);
    setModalOpen(true);
  };
  const startFree = () => {
    evQueue.current = [];
    resetCtx();
    setCourseId(null);
    setStepIdx(0);
    setModalOpen(true);
  };
  const closeModal = () => {
    evQueue.current = [];
    setCourseId(null);
    setStepIdx(0);
    setModalOpen(false);
  };

  const awaiting = !!step?.waitFor;
  const typingDone = step ? typed >= step.text.length : false;
  const isLast = course ? stepIdx === course.steps.length - 1 : false;

  /* ———— 吹き出しが操作対象に被るとき（主にスマホ）の退避 ————
     被りを検知したら吹き出しを自動でしまい、講師の横に「？」バブルを出す。
     ？で再表示 → ×でまたしまえる。ステップが進んだら元に戻る */
  const [bubbleHidden, setBubbleHidden] = React.useState(false);
  const [overlap, setOverlap] = React.useState(false);
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  const autoHidRef = React.useRef(false); // 自動格納はステップにつき1回だけ
  const overlapSinceRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setBubbleHidden(false);
    setOverlap(false);
    autoHidRef.current = false;
    overlapSinceRef.current = null;
  }, [stepIdx, courseId, modalOpen]);

  React.useEffect(() => {
    if (!modalOpen || !step?.target || !awaiting) {
      setOverlap(false);
      return;
    }
    const target = step.target;
    const textLen = step.text.length;
    const timer = setInterval(() => {
      const el = document.querySelector(`#guide-sim-root [data-guide="${target}"]`);
      const bb = bubbleRef.current?.getBoundingClientRect();
      if (!el || !bb) {
        setOverlap(false);
        overlapSinceRef.current = null;
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 10; // オレンジ枠ぶんの余白も被り扱い
      const hit = !(r.right + pad < bb.left || r.left - pad > bb.right || r.bottom + pad < bb.top || r.top - pad > bb.bottom);
      setOverlap(hit);
      if (!hit) {
        overlapSinceRef.current = null;
        return;
      }
      /* 読む時間を確保してから自動でしまう */
      if (!autoHidRef.current && typed >= textLen) {
        if (overlapSinceRef.current === null) overlapSinceRef.current = Date.now();
        else if (Date.now() - overlapSinceRef.current > 1200) {
          autoHidRef.current = true;
          setBubbleHidden(true);
        }
      }
    }, 300);
    return () => clearInterval(timer);
  }, [modalOpen, step, awaiting, typed]);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  /* ———— モーダル本体 ———— */
  const modal = (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 10px 14px" }}>
      <div onClick={closeModal} style={{ position: "absolute", inset: 0, background: "rgba(25,20,12,.6)" }} />
      <div
        style={{
          position: "relative", width: "min(940px, 98vw)", maxHeight: "96vh",
          display: "flex", flexDirection: "column",
          background: "var(--paper-50, #FAF7EF)", border: "var(--bw-bold, 3px) solid var(--ink-900, #222)",
          borderRadius: 18, boxShadow: "0 24px 70px rgba(0,0,0,.4)", overflow: "hidden",
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,.12)" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15 }}>
            {course ? `${course.emoji} ${course.title}` : "🕹️ 自由に触ってみる"}
          </span>
          {course && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted, #888)", fontWeight: 700 }}>
              {stepIdx + 1}/{course.steps.length}
            </span>
          )}
          <button
            onClick={closeModal}
            aria-label="閉じる"
            style={{
              marginLeft: "auto", width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
              border: "2px solid var(--ink-900, #222)", background: "#fff", fontSize: 14, fontWeight: 800, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {/* シミュレーター（収まらない環境ではこの内側だけスクロール） */}
        <div id="guide-sim-root" style={{ overflow: "auto", padding: "14px 16px 16px" }}>
          <ClaudeAppSim onEvent={onEvent} />
        </div>
      </div>

      {/* —— ハイライト（モーダル内のシミュレーターに限定） —— */}
      {step?.target && <Highlight target={step.target} scope="#guide-sim-root" />}

      {/* —— 講師キャラ＋吹き出し（モーダルと一緒に固定） —— */}
      {course && step && (
        <div
          style={{
            position: "fixed", right: 6, bottom: 2, zIndex: 96,
            display: "flex", alignItems: "flex-end", gap: 4, pointerEvents: "none",
          }}
        >
          {/* 吹き出しが操作対象に被ってしまわれている間は「？」バブルで呼び戻せる */}
          {bubbleHidden && (
            <button
              onClick={() => setBubbleHidden(false)}
              aria-label="説明をもう一度見る"
              style={{
                pointerEvents: "auto", marginBottom: 128, cursor: "pointer",
                width: 40, height: 40, borderRadius: "14px 14px 3px 14px",
                border: "2px solid var(--ink-900, #222)", background: "#FFFFFF",
                fontSize: 18, fontWeight: 900, color: "#D97757", lineHeight: 1,
                boxShadow: "0 6px 18px rgba(0,0,0,.25)",
                animation: "guide-q 1.4s ease-in-out infinite",
              }}
            >
              ？
            </button>
          )}
          <div
            ref={bubbleRef}
            style={{
              pointerEvents: "auto", position: "relative", marginBottom: 42,
              maxWidth: "min(300px, calc(100vw - 175px))", background: "#FFFFFF",
              border: "2px solid var(--ink-900, #222)", borderRadius: 14, borderBottomRightRadius: 3,
              padding: "12px 14px 10px", boxShadow: "0 8px 24px rgba(0,0,0,.25)",
              fontSize: 13.5, lineHeight: 1.8,
              display: bubbleHidden ? "none" : undefined,
            }}
          >
            {/* 操作対象に被っているときは、しまうための×を出す */}
            {overlap && awaiting && typingDone && (
              <button
                onClick={() => setBubbleHidden(true)}
                aria-label="吹き出しをしまう"
                style={{
                  position: "absolute", top: -12, right: -8, width: 26, height: 26,
                  borderRadius: "50%", border: "2px solid var(--ink-900, #222)",
                  background: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
            {/* クリックでタイプ表示を全文へスキップ */}
            <div
              onClick={() => step && setTyped(step.text.length)}
              style={{ whiteSpace: "pre-wrap", minHeight: 42, cursor: typingDone ? "default" : "pointer" }}
            >
              {step.text.slice(0, typed)}
              {!typingDone && <span style={{ color: "#D97757" }}>▍</span>}
            </div>
            {typingDone && !awaiting && (
              <div style={{ textAlign: "right", marginTop: 6 }}>
                <button
                  onClick={advance}
                  style={{
                    padding: "6px 18px", borderRadius: 9, border: "none", cursor: "pointer",
                    background: "#D97757", color: "#fff", fontWeight: 800, fontSize: 12.5, fontFamily: "inherit",
                  }}
                >
                  {isLast ? "おわる" : "次へ ▶"}
                </button>
              </div>
            )}
            {typingDone && awaiting && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#999", fontWeight: 700 }}>
                ⬆ オレンジ枠。操作して
              </div>
            )}
          </div>
          <Sensei ref={senseiRef} width={150} height={200} />
        </div>
      )}
    </div>
  );

  /* ———— ページ側: コース選択 ———— */
  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,3.2vw,30px)", margin: "0 0 8px" }}>
        🎓 教習コースで、触りながら覚える
      </h2>
      <p style={{ fontSize: 14, lineHeight: 2, color: "var(--text-body, #444)", margin: "0 0 20px" }}>
        <b>1コース約5分</b>。コースを選ぶと練習画面がひらき、講師が「どこを押すか」を1つずつ案内します。
        修了するころには、本物のClaudeを自分で動かせるようになっています。
        {done.length > 0 && (
          <b style={{ color: "var(--green-700, #3E7B4F)" }}>（{done.length}/{COURSES.length} コース修了）</b>
        )}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12, marginBottom: 12 }}>
        {COURSES.map((c) => (
          <button
            key={c.id}
            onClick={() => startCourse(c.id)}
            style={{
              textAlign: "left", padding: "14px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
              border: "var(--bw-bold, 3px) solid var(--ink-900, #222)",
              background: done.includes(c.id) ? "#EEF6EC" : "var(--paper-0, #fff)",
              boxShadow: "var(--shadow-pop-sm, 3px 3px 0 rgba(0,0,0,.85))",
            }}
          >
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 900 }}>
              {c.emoji} {c.title}
              {done.includes(c.id) && <span style={{ color: "#3E7B4F" }}> ✓</span>}
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--text-muted, #888)", margin: "4px 0 0", lineHeight: 1.7 }}>
              {c.desc}
            </span>
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#D97757", marginTop: 6 }}>
              ▶ はじめる（約{c.minutes}分）
            </span>
          </button>
        ))}
        <button
          onClick={startFree}
          style={{
            textAlign: "left", padding: "14px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
            border: "2px dashed var(--ink-900, #999)", background: "transparent",
          }}
        >
          <span style={{ display: "block", fontSize: 14.5, fontWeight: 900 }}>🕹️ 自由に触ってみる</span>
          <span style={{ display: "block", fontSize: 12, color: "var(--text-muted, #888)", margin: "4px 0 0", lineHeight: 1.7 }}>
            ガイドなしでシミュレーターを操作。APIキーがあれば本物のClaudeとも話せます
          </span>
        </button>
      </div>
      {mounted && modalOpen && createPortal(modal, document.body)}
    </div>
  );
}
