"use client";
/* ============================================================
   講師ガイドレイヤー — 3D講師キャラ「そら先生」がシミュレーターの
   実UIをハイライト＋矢印で指しながら、セリフで操作を案内する。

   - コースは courses.ts のデータ駆動（GuideStep[]）
   - target: game.tsx側の data-guide 属性名をハイライト
   - waitFor: ClaudeAppSimのonEventイベントで達成判定
   - skipIf: 状況的に不要なステップは自動スキップ（例: すでにPC表示）
   - 修了コースは localStorage に記録して✓表示
   ============================================================ */
import React from "react";
import { createPortal } from "react-dom";
import { ClaudeAppSim, type SimEvent } from "./game";
import { Sensei, type SenseiHandle } from "./sensei";
import { COURSES, type GuideCtx } from "./courses";

const DONE_KEY = "claude-app-courses-done";

/* ———— ハイライト枠＋矢印 ———— */
function Highlight({ target }: { target: string }) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const scrolledRef = React.useRef(false);
  React.useEffect(() => {
    scrolledRef.current = false;
    const update = () => {
      const el = document.querySelector(`[data-guide="${target}"]`);
      if (el && !scrolledRef.current) {
        /* 対象が画面外なら一度だけスクロールして見せる。
           smoothが動かない環境向けに、少し後に位置を再確認して即時ジャンプ */
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight - 40) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          setTimeout(() => {
            const r2 = el.getBoundingClientRect();
            if (r2.bottom < 0 || r2.top > window.innerHeight - 40) el.scrollIntoView({ block: "center" });
          }, 900);
        }
        scrolledRef.current = true;
      }
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    const timer = setInterval(update, 250); // 要素の出現・スクロールに追従
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [target]);

  if (!rect || rect.width === 0) return null;
  const pad = 5;
  const arrowAbove = rect.top > 72;
  return (
    <>
      <div
        style={{
          position: "fixed", zIndex: 74, pointerEvents: "none",
          left: rect.left - pad, top: rect.top - pad,
          width: rect.width + pad * 2, height: rect.height + pad * 2,
          border: "3px solid #FF7A1A", borderRadius: 12,
          boxShadow: "0 0 0 3px rgba(255,122,26,.25), 0 0 18px rgba(255,122,26,.45)",
          animation: "guide-pulse 1.2s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "fixed", zIndex: 74, pointerEvents: "none",
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
      `}</style>
    </>
  );
}

/* ———— 本体: シミュレーター＋講師ガイド ———— */
export function GuidedClaudeApp() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [courseId, setCourseId] = React.useState<string | null>(null);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [typed, setTyped] = React.useState(0);
  const [done, setDone] = React.useState<string[]>([]);
  const senseiRef = React.useRef<SenseiHandle>(null);
  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /* シミュレーターの状況（skipIf判定用）。イベントから追従する */
  const ctxRef = React.useRef<GuideCtx>({ device: "pc", tab: "chat" });

  const course = COURSES.find((c) => c.id === courseId) ?? null;
  const step = course ? course.steps[stepIdx] : null;
  const stepRef = React.useRef(step);
  stepRef.current = step;

  /* 修了記録の読み込み */
  React.useEffect(() => {
    ctxRef.current.device = window.matchMedia("(max-width: 700px)").matches ? "sp" : "pc";
    try {
      const s = localStorage.getItem(DONE_KEY);
      if (s) setDone(JSON.parse(s));
    } catch { /* noop */ }
  }, []);

  const finishCourse = React.useCallback((id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try { localStorage.setItem(DONE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
    setCourseId(null);
    setStepIdx(0);
  }, []);

  const advance = React.useCallback(() => {
    const c = COURSES.find((x) => x.id === courseId);
    if (!c) return;
    setStepIdx((i) => {
      /* skipIf該当ステップを飛ばしながら次へ */
      let n = i + 1;
      while (n < c.steps.length && c.steps[n].skipIf?.(ctxRef.current)) n++;
      if (n >= c.steps.length) {
        finishCourse(c.id);
        return 0;
      }
      return n;
    });
  }, [courseId, finishCourse]);

  /* ステップ開始: モーション・エモート・タイプライター
     経過時間ベースで表示文字数を計算する（バックグラウンドタブで
     タイマーが間引かれても、戻った瞬間に追いつく） */
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
    /* 前ステップ中に先回りで済ませた操作があれば即時に達成扱いにする */
    if (step.waitFor) {
      const hit = evQueue.current.find((e) => step.waitFor!(e));
      if (hit) achieve(step);
    }
    evQueue.current = [];
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, stepIdx]);

  /* 直近のステップ中に発生した「未消化」イベント。
     ユーザーが褒め演出の最中などに先回りして次の操作をしても、
     次ステップ開始時にここから自動消化して詰まらないようにする */
  const evQueue = React.useRef<SimEvent[]>([]);

  const achieve = React.useCallback((s: NonNullable<typeof step>) => {
    stepRef.current = null; // 二重判定防止
    if (s.onDone?.motion) senseiRef.current?.play(s.onDone.motion);
    if (s.onDone?.emote) senseiRef.current?.emote(s.onDone.emote);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(advance, s.onDone ? 1000 : 350);
  }, [advance]);

  /* シミュレーター操作イベント → コンテキスト追従＆達成判定 */
  const onEvent = React.useCallback((e: SimEvent) => {
    if (e.type === "deviceChange") ctxRef.current.device = e.device;
    if (e.type === "tabChange") ctxRef.current.tab = e.tab;
    const s = stepRef.current;
    if (s?.waitFor && s.waitFor(e)) {
      achieve(s);
      return;
    }
    /* 現ステップの対象外イベントは先回り操作の可能性があるので保持 */
    evQueue.current.push(e);
    if (evQueue.current.length > 20) evQueue.current.shift();
  }, [achieve]);

  const startCourse = (id: string) => {
    const c = COURSES.find((x) => x.id === id);
    if (!c) return;
    setMenuOpen(false);
    setCourseId(id);
    /* 先頭のskipIf該当ステップを飛ばす */
    let n = 0;
    while (n < c.steps.length && c.steps[n].skipIf?.(ctxRef.current)) n++;
    setStepIdx(n);
  };
  const stop = () => {
    setCourseId(null);
    setStepIdx(0);
  };

  const running = !!course && !!step;
  const awaiting = !!step?.waitFor;
  const typingDone = step ? typed >= step.text.length : false;
  const isLast = course ? stepIdx === course.steps.length - 1 : false;

  /* サイト側の親にCSS transformがあると position:fixed が効かないため、
     オーバーレイ類は body 直下にポータルで描画する */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const overlay = (
    <>
      {running && step?.target && <Highlight target={step.target} />}

      {/* —— 右下: 講師キャラ＋吹き出し／コースメニュー —— */}
      <div
        style={{
          position: "fixed", right: 6, bottom: 4, zIndex: 80,
          display: "flex", alignItems: "flex-end", gap: 4, pointerEvents: "none",
        }}
      >
        {running && step && (
          <div
            style={{
              pointerEvents: "auto", position: "relative", marginBottom: 46,
              maxWidth: "min(300px, calc(100vw - 180px))", background: "#FFFFFF",
              border: "2px solid var(--ink-900, #222)", borderRadius: 14, borderBottomRightRadius: 3,
              padding: "12px 14px 10px", boxShadow: "0 8px 24px rgba(0,0,0,.18)",
              fontSize: 13.5, lineHeight: 1.8,
            }}
          >
            <button
              onClick={stop}
              aria-label="ガイドを終了"
              style={{
                position: "absolute", top: -11, right: -11, width: 24, height: 24, borderRadius: "50%",
                border: "2px solid var(--ink-900, #222)", background: "#fff", cursor: "pointer",
                fontSize: 12, fontWeight: 800, lineHeight: 1, padding: 0,
              }}
            >
              ×
            </button>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "#D97757", marginBottom: 3 }}>
              そら先生 <span style={{ color: "#bbb" }}>｜ {course!.emoji} {course!.title}（{stepIdx + 1}/{course!.steps.length}）</span>
            </div>
            {/* クリックでタイプ表示を全文へスキップ（せっかちな人向け） */}
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
                ⬆ 画面のオレンジ枠を操作してみよう
              </div>
            )}
          </div>
        )}

        {!running && menuOpen && (
          <div
            style={{
              pointerEvents: "auto", marginBottom: 4, width: "min(320px, calc(100vw - 24px))",
              background: "#FFFFFF", border: "2px solid var(--ink-900, #222)", borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,.22)", overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", padding: "12px 14px 8px" }}>
              <span style={{ fontWeight: 900, fontSize: 14 }}>🎓 そら先生の教習コース</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="閉じる"
                style={{ marginLeft: "auto", border: "none", background: "transparent", fontSize: 17, cursor: "pointer", color: "#999" }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "0 10px 10px" }}>
              {COURSES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => startCourse(c.id)}
                  style={{
                    display: "block", width: "100%", textAlign: "left", margin: "0 0 6px",
                    padding: "9px 11px", borderRadius: 11, border: "1.5px solid #e5e2d8",
                    background: done.includes(c.id) ? "#F4F9F2" : "#FCFBF7", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800 }}>
                    {c.emoji} {c.title}
                    <span style={{ color: "#999", fontWeight: 700 }}>（約{c.minutes}分）</span>
                    {done.includes(c.id) && <span style={{ color: "#3E7B4F" }}> ✓修了</span>}
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "#888", marginTop: 2, lineHeight: 1.6 }}>{c.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {running ? (
          <Sensei ref={senseiRef} width={150} height={200} />
        ) : (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              pointerEvents: "auto", display: "flex", alignItems: "center", gap: 8,
              padding: "11px 18px", borderRadius: 999, cursor: "pointer",
              border: "2px solid var(--ink-900, #222)", background: "#FFF",
              fontWeight: 800, fontSize: 13.5, fontFamily: "inherit",
              boxShadow: "0 6px 18px rgba(0,0,0,.18)",
            }}
          >
            🎓 先生に教わる
            {done.length > 0 && (
              <span style={{ fontSize: 11, color: "#3E7B4F", fontWeight: 800 }}>
                {done.length}/{COURSES.length}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div style={{ position: "relative" }}>
      <ClaudeAppSim onEvent={onEvent} />
      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
