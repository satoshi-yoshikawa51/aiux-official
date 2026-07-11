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
        /* 幕が開き始めるタイミングでヒーローの登場アニメを解禁 */
        window.setTimeout(() => document.documentElement.classList.remove("splash-hold"), reduced ? 0 : 300);
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
      document.documentElement.classList.remove("splash-hold");
    };
  }, []);

  if (gone) return null;

  return (
    <div className={"splash" + (out ? " splash-out" : "")} aria-hidden="true">
      {/* 再訪セッションでは描画前に即座に隠す。
          初回はヒーローの登場アニメを splash-hold で一時停止しておく */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(sessionStorage.getItem('splashSeen')){document.currentScript.parentElement.style.display='none'}else{document.documentElement.classList.add('splash-hold')}}catch(e){}",
        }}
      />
      <span className="splash-face">
        <svg width="100%" height="100%" viewBox="-32 0 264 190" style={{ display: "block", overflow: "visible" }}>
          {/* キャラの輪郭: 横に広い頭・ぽってり頬・小さめの三角耳 */}
          <path
            fill="var(--paper-50)"
            d="M 28,66 C 25,50 23,28 26,18 C 28,13 32,13 35,17 C 45,21 56,29 62,40 C 73,35 87,33 100,33 C 113,33 127,35 138,40 C 144,29 155,21 165,17 C 168,13 172,13 174,18 C 177,28 175,50 172,66 C 185,81 194,104 194,120 C 194,140 180,154 158,163 C 141,170 120,173 100,173 C 80,173 59,170 42,163 C 20,154 6,140 6,120 C 6,104 15,81 28,66 Z"
          />
          <g stroke="var(--paper-50)" strokeWidth="4.5" strokeLinecap="round">
            <line x1="-8" y1="106" x2="-30" y2="99" />
            <line x1="-8" y1="122" x2="-32" y2="124" />
            <line x1="208" y1="106" x2="230" y2="99" />
            <line x1="208" y1="122" x2="232" y2="124" />
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
