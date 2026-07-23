"use client";
/* ============================================================
   プレイ映像 — 実物のシミュレーター＋講師を自動操縦して、
   「講師が教えて、ユーザーが操作する」体験をムービーのように
   ループ再生する。録画ではないので常に最新のUIが流れる。
   pointer-events: none で閲覧専用（操作はコースから）。
   ============================================================ */
import React from "react";
import { ClaudeAppSim } from "./game";
import { Sensei, type SenseiHandle, type SenseiMotion } from "./sensei";

interface DemoStep {
  caption?: string;
  motion?: SenseiMotion;
  act?: (root: HTMLElement) => void;
  wait: number;
}

const q = (root: HTMLElement, sel: string) => root.querySelector(sel) as HTMLElement | null;
const byText = (root: HTMLElement, t: string) =>
  [...root.querySelectorAll("button")].find((b) => b.textContent?.includes(t)) as HTMLElement | undefined;

const SCRIPT: DemoStep[] = [
  { caption: "Claudeの画面、さわって覚えよう", motion: "bow", wait: 2800 },
  { caption: "働く場所は上のタブで切り替え", motion: "explain", act: (r) => q(r, '[data-guide="tab-cowork"]')?.click(), wait: 2200 },
  { motion: "explain", act: (r) => q(r, '[data-guide="tab-code"]')?.click(), wait: 2200 },
  { caption: "フォルダを選んで…", motion: "explain", act: (r) => q(r, '[data-guide="folder"]')?.click(), wait: 1600 },
  { act: (r) => byText(r, "my-app")?.click(), wait: 1300 },
  { caption: "アクセスを許可（勝手に触らない）", act: (r) => byText(r, "許可する")?.click(), wait: 2300 },
  { caption: "作りたいものを、日本語で頼むだけ", motion: "explain", act: (r) => q(r, '[data-guide="suggest-0"]')?.click(), wait: 7500 },
  { caption: "変更は Accept で承認", motion: "arms-crossed", act: (r) => q(r, '[data-guide="accept"]')?.click(), wait: 3600 },
  { caption: "コマンドの実行も許可制で安心", motion: "explain", act: (r) => q(r, '[data-guide="approve"]')?.click(), wait: 6500 },
  { caption: "できあがり！実際に動きます", motion: "laugh", act: (r) => q(r, '[data-guide="artifact"]')?.click(), wait: 3600 },
  { caption: "あなたも教習コースでどうぞ🎓", motion: "bow", wait: 2600 },
];

export function DemoMovie() {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const senseiRef = React.useRef<SenseiHandle>(null);
  const [caption, setCaption] = React.useState<string>("");
  const [runId, setRunId] = React.useState(0); // シミュレーターを作り直してループ

  React.useEffect(() => {
    let stopped = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await sleep(1500); // 初期化待ち
      for (const s of SCRIPT) {
        if (stopped) return;
        if (s.caption) setCaption(s.caption);
        if (s.motion) senseiRef.current?.play(s.motion);
        try {
          if (s.act && boxRef.current) s.act(boxRef.current);
        } catch { /* 要素が無ければスキップ */ }
        await sleep(s.wait);
      }
      if (!stopped) {
        setCaption("");
        setRunId((v) => v + 1); // 最初から
      }
    })();
    return () => { stopped = true; };
  }, [runId]);

  /* PC画面(約680x680)を縮小して映す */
  const SCALE = 0.62;
  return (
    <div
      aria-hidden
      style={{
        position: "relative", borderRadius: 16, overflow: "hidden",
        border: "var(--bw-bold, 3px) solid var(--ink-900, #222)",
        boxShadow: "var(--shadow-pop, 6px 6px 0 rgba(0,0,0,.85))",
        background: "#EDEAE0", width: "min(700px, 100%)",
        height: 680 * SCALE + 46,
      }}
    >
      {/* 再生ラベル */}
      <div
        style={{
          position: "absolute", top: 10, left: 12, zIndex: 5,
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(30,26,18,.85)", color: "#fff", borderRadius: 999,
          padding: "5px 12px", fontSize: 11.5, fontWeight: 800,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5A4E", display: "inline-block", animation: "demo-blink 1.2s infinite" }} />
        プレイ映像（自動再生）
      </div>

      {/* 縮小したシミュレーター（閲覧専用） */}
      <div
        ref={boxRef}
        style={{
          pointerEvents: "none", userSelect: "none",
          transform: `scale(${SCALE})`, transformOrigin: "top left",
          width: 700 / SCALE, padding: "46px 10px 0 10px",
        }}
      >
        <ClaudeAppSim key={runId} />
      </div>

      {/* 講師 */}
      <div style={{ position: "absolute", right: 2, bottom: 0, zIndex: 6, pointerEvents: "none" }}>
        <Sensei ref={senseiRef} width={110} height={150} />
      </div>

      {/* 字幕 */}
      {caption && (
        <div
          style={{
            position: "absolute", left: 12, bottom: 12, zIndex: 6, maxWidth: "calc(100% - 140px)",
            background: "#FFFFFF", border: "2px solid var(--ink-900, #222)", borderRadius: 12,
            padding: "8px 14px", fontSize: 13, fontWeight: 800, boxShadow: "0 4px 14px rgba(0,0,0,.2)",
          }}
        >
          {caption}
        </div>
      )}
      <style>{`@keyframes demo-blink { 0%,100% { opacity: 1 } 50% { opacity: .3 } }`}</style>
    </div>
  );
}
