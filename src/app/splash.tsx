"use client";
/* ============================================================
   トップページの初回ローディング演出。
   キャラの顔シルエットが呼吸しながら待機 → 読み込み完了で
   画面にダイブして消える。同一セッション2回目以降は出さない。
   prefers-reduced-motion では短いフェードのみ。
   ============================================================ */
import React from "react";

export default function Splash() {
  const [gone, setGone] = React.useState(false);
  const [out, setOut] = React.useState(false);

  React.useEffect(() => {
    if (window.sessionStorage.getItem("splashSeen")) {
      setGone(true);
      return;
    }
    window.sessionStorage.setItem("splashSeen", "1");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MIN_SHOW = reduced ? 200 : 1150; // 最低表示時間（一瞬で消えるとチラつくため）
    const start = performance.now();
    let done = false;
    let exitTimer = 0;
    let minTimer = 0;
    const finish = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, MIN_SHOW - (performance.now() - start));
      minTimer = window.setTimeout(() => {
        setOut(true);
        exitTimer = window.setTimeout(() => setGone(true), reduced ? 260 : 680);
      }, wait);
    };
    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }
    const failsafe = window.setTimeout(finish, 2600); // 読み込みが長引いても最大2.6秒で開く
    return () => {
      window.clearTimeout(failsafe);
      window.clearTimeout(exitTimer);
      window.clearTimeout(minTimer);
      window.removeEventListener("load", finish);
    };
  }, []);

  if (gone) return null;

  return (
    <div className={"splash" + (out ? " splash-out" : "")} aria-hidden="true">
      {/* 再訪セッションではハイドレーション前に即座に隠す */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(sessionStorage.getItem('splashSeen'))document.currentScript.parentElement.style.display='none'}catch(e){}",
        }}
      />
      <span className="splash-face">
        <svg width="100%" height="100%" viewBox="-26 0 252 185" style={{ display: "block", overflow: "visible" }}>
          <path
            fill="var(--ink-900)"
            d="M 42,60 C 34,38 30,20 34,10 C 37,3 44,2 52,7 C 60,12 70,22 76,30 C 84,27 92,25 100,25 C 108,25 116,27 124,30 C 130,22 140,12 148,7 C 156,2 163,3 166,10 C 170,20 166,38 158,60 C 168,74 174,90 174,106 C 174,148 141,178 100,178 C 59,178 26,148 26,106 C 26,90 32,74 42,60 Z"
          />
          <g stroke="var(--ink-900)" strokeWidth="4.5" strokeLinecap="round">
            <line x1="8" y1="100" x2="-16" y2="93" />
            <line x1="8" y1="116" x2="-18" y2="118" />
            <line x1="192" y1="100" x2="216" y2="93" />
            <line x1="192" y1="116" x2="218" y2="118" />
          </g>
        </svg>
        <span className="splash-spark" style={{ top: -14, left: -8 }}>✦</span>
        <span className="splash-spark" style={{ top: -4, right: -16, animationDelay: "0.8s", fontSize: 15 }}>✦</span>
      </span>
      <div className="splash-logo">
        CO<span style={{ color: "var(--red-500)" }}>MIX</span>AI
      </div>
      <div className="splash-dots">
        <span />
        <span style={{ animationDelay: "0.15s" }} />
        <span style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}
