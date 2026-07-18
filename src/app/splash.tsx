"use client";
/* ============================================================
   トップページの初回ローディング演出。
   キャラの顔シルエットが呼吸しながら待機 → 読み込み完了で
   画面にダイブして消える。同一セッション2回目以降は出さない。
   prefers-reduced-motion では短いフェードのみ。
   ============================================================ */
import React from "react";

/* SSRとCSRで一致する決定的な疑似乱数（粒子の散らばりに使う） */
const prand = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const P_CHARS = ["✦", "✧", "●", "✦"];
const P_COLORS = ["var(--yellow-400)", "var(--paper-50)", "var(--red-500)", "var(--yellow-200)"];

/* 退場時に弾け飛ぶキラキラ粒子 */
const EXIT_PARTICLES = Array.from({ length: 26 }, (_, i) => {
  const angle = (i / 26) * Math.PI * 2 + (prand(i, 1) - 0.5) * 0.5;
  const dist = 110 + prand(i, 2) * 190;
  return {
    char: P_CHARS[i % P_CHARS.length],
    color: P_COLORS[i % P_COLORS.length],
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist * 0.82,
    rot: (prand(i, 3) - 0.5) * 440,
    sz: 0.7 + prand(i, 4) * 1.1,
    dl: prand(i, 5) * 0.16,
    fs: 11 + Math.round(prand(i, 6) * 9),
  };
});

/* 登場の着地で散る小さな火花 */
const ENTER_SPARKS = Array.from({ length: 8 }, (_, i) => {
  const angle = Math.PI + (i / 7) * Math.PI; /* 上半分に扇状 */
  const dist = 46 + prand(i, 7) * 52;
  return {
    color: P_COLORS[i % P_COLORS.length],
    dx: Math.cos(angle) * dist,
    dy: -Math.abs(Math.sin(angle)) * dist - 8,
    dl: prand(i, 8) * 0.08,
  };
});

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
        window.setTimeout(() => document.documentElement.classList.remove("splash-hold"), reduced ? 0 : 460);
        exitTimer = window.setTimeout(() => setGone(true), reduced ? 260 : 1060);
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
          <g className="splash-whisk splash-whisk-l" stroke="var(--paper-50)" strokeWidth="9" strokeLinecap="round">
            <line x1="42" y1="185" x2="-4" y2="172" />
            <line x1="44" y1="215" x2="-8" y2="220" />
          </g>
          <g className="splash-whisk splash-whisk-r" stroke="var(--paper-50)" strokeWidth="9" strokeLinecap="round">
            <line x1="458" y1="185" x2="504" y2="172" />
            <line x1="456" y1="215" x2="508" y2="220" />
          </g>
        </svg>
        <span className="splash-spark" style={{ top: -14, left: -8 }}>✦</span>
        <span className="splash-spark" style={{ top: -4, right: -16, animationDelay: "0.8s", fontSize: 15 }}>✦</span>
        {/* たまに走る流れ星 */}
        <span className="splash-shoot" aria-hidden="true" />
        {/* 着地の衝撃波リングと火花 */}
        <span className="splash-ring" aria-hidden="true" />
        {ENTER_SPARKS.map((p, i) => (
          <span
            key={i}
            className="splash-ep"
            style={{
              color: p.color,
              animationDelay: `${(0.46 + p.dl).toFixed(2)}s`,
              ["--dx" as string]: `${p.dx.toFixed(0)}px`,
              ["--dy" as string]: `${p.dy.toFixed(0)}px`,
            }}
          >
            ✦
          </span>
        ))}
      </span>
      <div className="splash-logo">
        <span className="splash-ch">CO</span>
        <span className="splash-ch splash-mix" style={{ color: "var(--red-500)", animationDelay: "0.42s" }}>MIX</span>
        <span className="splash-ch" style={{ animationDelay: "0.54s" }}>AI</span>
      </div>
      <div className="splash-dots">
        <span />
        <span style={{ animationDelay: "0.15s" }} />
        <span style={{ animationDelay: "0.3s" }} />
      </div>
      {/* 退場：拡大の途中で弾け飛ぶキラキラ粒子（splash-out時のみ動く） */}
      <span className="splash-pwrap" aria-hidden="true">
        {EXIT_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="splash-p"
            style={{
              color: p.color,
              fontSize: p.fs,
              ["--dx" as string]: `${p.dx.toFixed(0)}px`,
              ["--dy" as string]: `${p.dy.toFixed(0)}px`,
              ["--rot" as string]: `${p.rot.toFixed(0)}deg`,
              ["--sz" as string]: p.sz.toFixed(2),
              ["--dl" as string]: `${p.dl.toFixed(2)}s`,
            }}
          >
            {p.char}
          </span>
        ))}
      </span>
      {/* 退場ダイブの着弾で爆ぜるマンガ的バースト（splash-out時のみ動く） */}
      <svg className="splash-burst" viewBox="-100 -100 200 200" aria-hidden="true">
        <g stroke="var(--yellow-400)" strokeWidth="7" strokeLinecap="round">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI * 2) / 12 + 0.26;
            const r1 = i % 2 === 0 ? 34 : 46;
            const r2 = i % 2 === 0 ? 88 : 72;
            return (
              <line
                key={i}
                x1={(Math.cos(a) * r1).toFixed(1)}
                y1={(Math.sin(a) * r1).toFixed(1)}
                x2={(Math.cos(a) * r2).toFixed(1)}
                y2={(Math.sin(a) * r2).toFixed(1)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
