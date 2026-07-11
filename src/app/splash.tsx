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
        <svg width="100%" height="100%" viewBox="-15 0 530 310" style={{ display: "block", overflow: "visible" }}>
          {/* キャラの輪郭（実物シルエットのトレース。potrace座標のためy反転transform付き） */}
          <g transform="translate(0,500) scale(0.1,-0.1)" fill="var(--paper-50)" stroke="none">
            <path d="M1258 4925 c-82 -46 -123 -406 -84 -734 l13 -113 -40 -67 c-92 -151 -147 -294 -212 -551 -40 -160 -51 -191 -87 -244 -253 -370 -91 -780 383 -967 422 -166 1811 -186 2315 -34 485 147 707 594 474 954 -41 63 -60 119 -110 324 -53 220 -117 381 -207 529 l-36 57 14 83 c29 185 9 616 -32 704 -68 144 -300 57 -590 -222 l-77 -74 -43 16 c-211 74 -666 81 -947 14 -112 -27 -104 -29 -190 50 -230 215 -452 327 -544 275z" />
          </g>
          <g stroke="var(--paper-50)" strokeWidth="9" strokeLinecap="round">
            <line x1="42" y1="185" x2="-4" y2="172" />
            <line x1="44" y1="215" x2="-8" y2="220" />
            <line x1="458" y1="185" x2="504" y2="172" />
            <line x1="456" y1="215" x2="508" y2="220" />
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
