"use client";

/* ============================================================
   コードの雨（背景）。
   1枚のオフスクリーンcanvasに「落ちてくる文字列」を描き、それを
   床・天井・左右の壁・奥の5面に貼ってCSSの3D変形で廊下にする。
   描画は1回、貼り付けは drawImage だけなので軽い。
   prefers-reduced-motion の人には動かさず1フレームだけ描く。
   ============================================================ */

import { useEffect, useRef } from "react";

const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEFGHJKLMNPQRSTUVWXYZ<>=/:;+*#$%&";
/* 文字を小さく・列を多く取るほど、奥行きが出たときに「雨」に見える */
const W = 1280;
const H = 1800;
const FONT = 14;
const COLS = Math.floor(W / FONT);

export function CyberRain() {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const faces = Array.from(el.querySelectorAll<HTMLCanvasElement>("canvas"));
    /* スマホは貼り付け先を半分の解像度にして負荷を抑える（見た目は変えない） */
    const small = window.innerWidth < 640;
    for (const f of faces) {
      f.width = small ? W / 2 : W;
      f.height = small ? H / 2 : H;
    }
    const src = document.createElement("canvas");
    src.width = W;
    src.height = H;
    const ctx = src.getContext("2d");
    if (!ctx) return;

    /* 列ごとに2本の雨を落とす。先頭だけ明るく、尾は残像で薄くなる。
       見た目の密度は「1列あたりの本数 × 残像の長さ（fade）」で決まる */
    const N = COLS * 2;
    const drops = Array.from({ length: N }, () => Math.random() * -H * 1.5);
    const speed = Array.from({ length: N }, () => 0.5 + Math.random() * 1.2);
    ctx.fillStyle = "#040806";
    ctx.fillRect(0, 0, W, H);

    const step = () => {
      ctx.fillStyle = "rgba(4,8,6,0.06)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${FONT}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";
      for (let i = 0; i < N; i++) {
        const x = (i % COLS) * FONT;
        const y = drops[i];
        ctx.fillStyle = "#39ff8a";
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y - FONT);
        ctx.fillStyle = "#d9ffe6";
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y);
        drops[i] = y > H + FONT * 2 ? Math.random() * -H * 0.8 : y + FONT * speed[i];
      }
      for (const f of faces) {
        const c = f.getContext("2d");
        if (c) c.drawImage(src, 0, 0, f.width, f.height);
      }
    };
    /* 最初の1フレームから廊下が埋まっているように、先に回しておく */
    for (let i = 0; i < 90; i++) step();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      /* 24fps 程度で十分。それ以上回すと文字が流れすぎて読めない */
      if (t - last < 42) return;
      last = t;
      step();
    };
    raf = requestAnimationFrame(loop);
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={wrap} className="tk-rain" aria-hidden="true">
      <div className="tk-rain-stage">
        {/* 廊下ごと奥へ押し込む。手前の面がカメラに近すぎると文字が巨大化して雨に見えない */}
        <div className="tk-rain-corridor">
          <canvas className="tk-face tk-face-back" />
          <canvas className="tk-face tk-face-floor" />
          <canvas className="tk-face tk-face-ceil" />
          <canvas className="tk-face tk-face-left" />
          <canvas className="tk-face tk-face-right" />
        </div>
      </div>
      <div className="tk-rain-vignette" />
      <div className="tk-scanlines" />
    </div>
  );
}
