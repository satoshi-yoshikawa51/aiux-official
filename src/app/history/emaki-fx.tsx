"use client";
/* ============================================================
   絵巻の演出エンジン（クライアント側）。
   ・スクロール進捗バー＋現在年号チップ
   ・パネルのスクロール出現
   ・時代ごとのパーティクル（塵・雪・碁石・光のネットワーク・
     紙吹雪・コードの雨・金の煌めき…）と画面全体の色調変化
   ・最後まで読むと図鑑に「読破」を記録
   prefers-reduced-motion では演出をすべて省略する。
   ============================================================ */
import React from "react";
import { unlock } from "../zukan/store";

/* —— パーティクルのモード定義 —— */
type FxMode = "dust" | "snow" | "pixel" | "stones" | "spark" | "network" | "confetti" | "code" | "sparkle" | "none";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  char?: string;
  phase: number;
  mode: FxMode;
}

const PALETTE: Record<FxMode, string[]> = {
  dust: ["rgba(176,148,96,0.5)", "rgba(140,120,90,0.4)", "rgba(200,180,140,0.45)"],
  snow: ["rgba(255,255,255,0.9)", "rgba(210,228,255,0.85)", "rgba(180,205,255,0.7)"],
  pixel: ["rgba(26,108,255,0.7)", "rgba(57,210,255,0.6)", "rgba(20,17,15,0.5)"],
  stones: ["#14110f", "#ffffff"],
  spark: ["rgba(255,210,63,0.9)", "rgba(230,0,18,0.75)", "rgba(255,150,40,0.8)"],
  network: ["rgba(120,90,255,0.8)", "rgba(57,210,255,0.8)", "rgba(230,0,18,0.6)"],
  confetti: ["#e60012", "#ffd23f", "#1a6cff", "#3ddc84", "#ff8ab5"],
  code: ["rgba(26,108,255,0.8)", "rgba(20,180,140,0.7)", "rgba(20,17,15,0.55)"],
  sparkle: ["rgba(255,210,63,0.95)", "rgba(255,240,180,0.9)", "rgba(230,180,40,0.8)"],
  none: [],
};

const CODE_CHARS = "アイウエオカキクケコ01<>/{}=+";

function spawn(mode: FxMode, w: number, h: number): Particle | null {
  const color = PALETTE[mode][Math.floor(Math.random() * PALETTE[mode].length)];
  const base: Particle = { x: Math.random() * w, y: -20, vx: 0, vy: 0, size: 3, life: 0, maxLife: 400, color, phase: Math.random() * Math.PI * 2, mode };
  switch (mode) {
    case "dust":
      return { ...base, y: Math.random() * h, vx: 0.15 + Math.random() * 0.2, vy: -0.08 - Math.random() * 0.1, size: 1.5 + Math.random() * 2.5, maxLife: 600 };
    case "snow":
      return { ...base, vy: 0.55 + Math.random() * 0.9, size: 2 + Math.random() * 3.5, maxLife: 900, char: Math.random() < 0.12 ? "❄" : undefined };
    case "pixel":
      return { ...base, vy: 1.4 + Math.random() * 2, size: 3 + Math.random() * 4, maxLife: 500 };
    case "stones":
      return { ...base, vy: 0.8 + Math.random() * 1.1, size: 5 + Math.random() * 4, maxLife: 600 };
    case "spark":
      return { ...base, y: h + 10, vy: -(1.1 + Math.random() * 1.6), vx: (Math.random() - 0.5) * 0.6, size: 2 + Math.random() * 3, maxLife: 350 };
    case "network":
      return { ...base, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, size: 2.5, maxLife: 700 };
    case "confetti":
      return { ...base, vy: 1.2 + Math.random() * 1.8, vx: (Math.random() - 0.5) * 1.4, size: 4 + Math.random() * 4, maxLife: 600 };
    case "code":
      return { ...base, vy: 1.8 + Math.random() * 2.4, size: 12 + Math.random() * 4, maxLife: 500, char: CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)] };
    case "sparkle":
      return { ...base, y: Math.random() * h, vy: -0.15, size: 1.5 + Math.random() * 2.5, maxLife: 260, char: Math.random() < 0.2 ? "✦" : undefined };
    default:
      return null;
  }
}

export function EmakiFx() {
  const [progress, setProgress] = React.useState(0);
  const [year, setYear] = React.useState("1950");
  const [tint, setTint] = React.useState("transparent");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const panels = Array.from(document.querySelectorAll<HTMLElement>(".emaki-panel"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* —— 出現アニメ（JSが動く環境でだけ隠す） —— */
    if (!reduced) {
      panels.forEach((el) => el.classList.add("emaki-hide"));
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("emaki-in");
              io.unobserve(e.target);
            }
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );
      panels.forEach((el) => io.observe(el));
    }

    /* —— スクロール：進捗・年号・現在の時代（fx/tint）・読破 —— */
    let mode: FxMode = "dust";
    let done = false;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      setProgress(p);
      const mid = window.innerHeight * 0.45;
      let current: HTMLElement | null = null;
      for (const el of panels) {
        if (el.getBoundingClientRect().top < mid) current = el;
      }
      setYear(current?.dataset.year ?? "1950");
      mode = (current?.dataset.fx as FxMode) ?? "dust";
      setTint(current?.dataset.tint ?? "transparent");
      if (!done && p > 0.96) {
        done = true;
        unlock("emaki", "read");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* —— パーティクルエンジン —— */
    let raf = 0;
    const canvas = canvasRef.current;
    if (canvas && !reduced) {
      const ctx = canvas.getContext("2d")!;
      let particles: Particle[] = [];
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener("resize", resize);
      const maxCount = window.innerWidth < 600 ? 38 : 80;

      const tick = () => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        /* 追加スポーン（現在のモードのぶんだけ） */
        const alive = particles.filter((pt) => pt.mode === mode).length;
        if (mode !== "none" && alive < maxCount && Math.random() < 0.5) {
          const pt = spawn(mode, w, h);
          if (pt) particles.push(pt);
        }

        /* ネットワークモードは点同士を線でつなぐ */
        if (mode === "network") {
          const nodes = particles.filter((pt) => pt.mode === "network");
          ctx.lineWidth = 1;
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const d2 = dx * dx + dy * dy;
              if (d2 < 110 * 110) {
                ctx.strokeStyle = `rgba(120,90,255,${(1 - Math.sqrt(d2) / 110) * 0.28})`;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
              }
            }
          }
        }

        particles = particles.filter((pt) => {
          pt.life++;
          pt.phase += 0.02;
          pt.x += pt.vx + (pt.mode === "snow" || pt.mode === "confetti" ? Math.sin(pt.phase) * 0.6 : 0);
          pt.y += pt.vy;
          /* 現在と違うモードの粒は早めにフェードアウト */
          const fadeBoost = pt.mode === mode ? 1 : 4;
          const fade = Math.min(pt.life / 30, 1) * Math.max(1 - (pt.life * fadeBoost) / pt.maxLife, 0);
          if (fade <= 0 || pt.y > h + 30 || pt.y < -40 || pt.x < -30 || pt.x > w + 30) return false;

          ctx.globalAlpha = fade * (pt.mode === "sparkle" ? 0.5 + 0.5 * Math.sin(pt.phase * 6) : 1);
          if (pt.char) {
            ctx.font = `${Math.max(pt.size * 3, 12)}px monospace`;
            ctx.fillStyle = pt.color;
            ctx.fillText(pt.char, pt.x, pt.y);
          } else if (pt.mode === "pixel" || pt.mode === "confetti") {
            ctx.fillStyle = pt.color;
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.phase * 2);
            ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size * 0.7);
            ctx.restore();
          } else if (pt.mode === "stones") {
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(20,17,15,0.7)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          return true;
        });

        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(raf);
      };
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* 時代の色ガラス（コンテンツの上に薄く乗る） */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: tint,
          opacity: 0.16,
          mixBlendMode: "multiply",
          transition: "background 1.1s ease",
        }}
      />
      {/* パーティクル */}
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none" }} />
      {/* 進捗バー＋年号チップ */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 70, pointerEvents: "none" }}>
        <div style={{ height: 5, background: "rgba(20,17,15,0.12)" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--red-500)" }} />
        </div>
        {progress > 0.02 && progress < 0.97 && (
          <div
            key={year}
            className="game-in"
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 13,
              background: "var(--ink-900)",
              color: "var(--yellow-400)",
              border: "2px solid var(--ink-900)",
              borderRadius: 8,
              padding: "4px 10px",
            }}
          >
            {year}年
          </div>
        )}
      </div>
    </>
  );
}
