"use client";
/* ============================================================
   講師ガイドレイヤー — 3D講師キャラ「そら先生」がシミュレーターの
   実UIをハイライト＋矢印で指しながら、セリフで操作を案内する。

   仕組み:
   - ガイドは GuideStep[] のデータ駆動。target に game.tsx 側の
     data-guide 属性名を指定するとその要素をハイライトする
   - waitFor を指定したステップは「次へ」を出さず、ClaudeAppSimの
     onEvent から流れてくる操作イベントで達成判定する
   - 達成時は onDone のモーション/エモートで褒めてから次のステップへ
   ============================================================ */
import React from "react";
import { createPortal } from "react-dom";
import { ClaudeAppSim, type SimEvent } from "./game";
import { Sensei, type SenseiHandle, type SenseiMotion } from "./sensei";

export interface GuideStep {
  text: string;
  motion?: SenseiMotion;
  emote?: string;
  target?: string; // data-guide属性名
  waitFor?: (e: SimEvent) => boolean;
  onDone?: { motion?: SenseiMotion; emote?: string };
}

/* ———— 体験ガイド（コース0のダイジェスト版） ———— */
const DEMO_GUIDE: GuideStep[] = [
  {
    motion: "bow",
    text: "こんにちは！Claude教習所の講師、そらです。このシミュレーターの使い方を、実際に触りながら案内しますね。",
  },
  {
    motion: "explain",
    target: "tab-cowork",
    text: "Claudeは「どこで働かせるか」を上のタブで切り替えます。まずは「Cowork」タブをクリックしてみてください。",
    waitFor: (e) => e.type === "tabChange" && e.tab === "cowork",
    onDone: { motion: "laugh", emote: "✨" },
  },
  {
    motion: "explain",
    target: "tab-code",
    text: "いいですね！Coworkは“あなたのPCの中”で働くモード。続いて「コード」タブに切り替えましょう。",
    waitFor: (e) => e.type === "tabChange" && e.tab === "code",
    onDone: { motion: "laugh", emote: "✨" },
  },
  {
    motion: "explain",
    target: "folder",
    emote: "💡",
    text: "コードは“フォルダを選ぶ”ところから始まります。GitHubは無くてOK！ 📁チップをクリックして、候補からフォルダを選んでください。",
    waitFor: (e) => e.type === "folderChange",
    onDone: { motion: "laugh", emote: "💮" },
  },
  {
    motion: "explain",
    target: "suggest-0",
    text: "準備完了！最初の提案「おみくじアプリを作って」をクリックして、Claudeに任せてみましょう。",
    waitFor: (e) => e.type === "send" && e.tab === "code",
  },
  {
    motion: "arms-crossed",
    target: "accept",
    text: "Claudeがファイルの変更を提案してきます。内容を確認して「✓ Accept」で承認してください。承認するまでファイルは書き換わりません。",
    waitFor: (e) => e.type === "diffResolved",
    onDone: { motion: "laugh", emote: "✨" },
  },
  {
    motion: "explain",
    target: "approve",
    text: "コマンドの実行にも許可を求めてきます。「✓ 許可する」を押しましょう。勝手に実行しないのがClaudeの安心ポイントです。",
    waitFor: (e) => e.type === "approvalResolved",
  },
  {
    motion: "explain",
    target: "artifact",
    emote: "🎁",
    text: "できあがり！成果物カードをクリックして、実際に動くおみくじをプレビューしてみてください。",
    waitFor: (e) => e.type === "artifactOpen",
    onDone: { motion: "laugh", emote: "🎉" },
  },
  {
    motion: "bow",
    text: "初めての開発、完了です🎉 これが「作る・動かす」＝コードモード。ほかのタブも自由に触ってみてくださいね。",
  },
];

/* ———— ハイライト枠＋矢印 ———— */
function Highlight({ target }: { target: string }) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  React.useEffect(() => {
    let raf = 0;
    let timer: ReturnType<typeof setInterval> | null = null;
    const update = () => {
      const el = document.querySelector(`[data-guide="${target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    timer = setInterval(update, 250); // 要素の出現・スクロール・レイアウト変化を追従
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      if (timer) clearInterval(timer);
      cancelAnimationFrame(raf);
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

/* ———— 本体: シミュレーター＋ガイド ———— */
export function GuidedClaudeApp() {
  const [running, setRunning] = React.useState(false);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [typed, setTyped] = React.useState(0); // 表示済み文字数
  const [awaiting, setAwaiting] = React.useState(false); // 操作待ち中
  const senseiRef = React.useRef<SenseiHandle>(null);
  const stepRef = React.useRef<GuideStep | null>(null);
  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = DEMO_GUIDE;
  const step = running ? steps[stepIdx] : null;
  stepRef.current = step;

  /* ステップ開始: モーション・エモート・タイプライターをリセット */
  React.useEffect(() => {
    if (!step) return;
    setTyped(0);
    setAwaiting(!!step.waitFor);
    if (step.motion) senseiRef.current?.play(step.motion);
    if (step.emote) senseiRef.current?.emote(step.emote);
    const iv = setInterval(() => {
      setTyped((t) => {
        if (t >= step.text.length) { clearInterval(iv); return t; }
        return t + 1;
      });
    }, 26);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, stepIdx]);

  const advance = React.useCallback(() => {
    setStepIdx((i) => {
      if (i + 1 >= steps.length) {
        setRunning(false);
        return 0;
      }
      return i + 1;
    });
  }, [steps.length]);

  /* シミュレーター操作イベント → 達成判定 */
  const onEvent = React.useCallback((e: SimEvent) => {
    const s = stepRef.current;
    if (!s?.waitFor || !s.waitFor(e)) return;
    stepRef.current = null; // 二重判定防止
    if (s.onDone?.motion) senseiRef.current?.play(s.onDone.motion);
    if (s.onDone?.emote) senseiRef.current?.emote(s.onDone.emote);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(advance, s.onDone ? 1000 : 350);
  }, [advance]);

  const start = () => {
    setStepIdx(0);
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
    setStepIdx(0);
  };

  const typingDone = step ? typed >= step.text.length : false;
  const isLast = running && stepIdx === steps.length - 1;

  /* サイト側の親にCSS transformがあると position:fixed が効かないため、
     オーバーレイ類は body 直下にポータルで描画する */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const overlay = (
    <>
      {/* —— ハイライト —— */}
      {running && step?.target && <Highlight target={step.target} />}

      {/* —— 右下: 講師キャラ＋吹き出し —— */}
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
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "#D97757", marginBottom: 3 }}>そら先生</div>
            <div style={{ whiteSpace: "pre-wrap", minHeight: 42 }}>
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
        {running ? (
          <Sensei ref={senseiRef} width={150} height={200} />
        ) : (
          <button
            onClick={start}
            style={{
              pointerEvents: "auto", display: "flex", alignItems: "center", gap: 8,
              padding: "11px 18px", borderRadius: 999, cursor: "pointer",
              border: "2px solid var(--ink-900, #222)", background: "#FFF",
              fontWeight: 800, fontSize: 13.5, fontFamily: "inherit",
              boxShadow: "0 6px 18px rgba(0,0,0,.18)",
            }}
          >
            🎓 先生に教わる
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
