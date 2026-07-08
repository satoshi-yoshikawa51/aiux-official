"use client";
/* ============================================================
   絵巻の演出エンジン（クライアント側・豪華版）。
   ・スクロール進捗バー＋現在年号チップ
   ・パネルのスクロール出現
   ・時代ごとの演出：
     - パーティクル（発光つき9モード＋時代の主役キャラ演出）
     - 空のグラデーション（multiply合成で時代の空気に染める）
     - 巨大な年号の透かしがクロスフェード
     - 時代が切り替わる瞬間のフラッシュ
   ・最後まで読むと図鑑に「読破」を記録
   prefers-reduced-motion では演出をすべて省略する。
   ============================================================ */
import React from "react";
import { unlock } from "../zukan/store";

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
  ribbon?: boolean; // 紙テープ（confetti用）
  phase: number;
  mode: FxMode;
  hero?: boolean; // 時代の主役（大きく画面を横切る）
}

const PALETTE: Record<FxMode, string[]> = {
  dust: ["rgba(176,148,96,0.55)", "rgba(140,120,90,0.45)", "rgba(210,190,150,0.5)"],
  snow: ["rgba(255,255,255,0.95)", "rgba(215,230,255,0.9)", "rgba(185,208,255,0.8)"],
  pixel: ["rgba(26,108,255,0.75)", "rgba(57,210,255,0.65)", "rgba(20,17,15,0.5)"],
  stones: ["#14110f", "#ffffff"],
  spark: ["rgba(255,210,63,0.95)", "rgba(230,0,18,0.8)", "rgba(255,150,40,0.9)"],
  network: ["rgba(120,90,255,0.9)", "rgba(57,210,255,0.85)", "rgba(230,0,18,0.6)"],
  confetti: ["#e60012", "#ffd23f", "#1a6cff", "#3ddc84", "#ff8ab5", "#9b6cff"],
  code: ["rgba(26,108,255,0.85)", "rgba(20,180,140,0.75)", "rgba(20,17,15,0.55)"],
  sparkle: ["rgba(255,210,63,1)", "rgba(255,240,180,0.95)", "rgba(230,180,40,0.85)"],
  none: [],
};

const CODE_CHARS = "アイウエオカキクケコ01<>/{}=+";
/* 時代の主役キャラ：その時代に入った瞬間、大きく画面を横切る */
const HEROES: Record<string, string[]> = {
  "1950": ["💭"],
  "1966": ["💬"],
  "1997": ["♟️"],
  "2012": ["⚡"],
  "2016": ["⚫", "⚪"],
  "2022": ["🚀"],
  "2023": ["🎨"],
  "2026": ["🌅"],
};

function spawn(mode: FxMode, w: number, h: number): Particle | null {
  const color = PALETTE[mode][Math.floor(Math.random() * PALETTE[mode].length)];
  const base: Particle = { x: Math.random() * w, y: -20, vx: 0, vy: 0, size: 3, life: 0, maxLife: 400, color, phase: Math.random() * Math.PI * 2, mode };
  switch (mode) {
    case "dust":
      return { ...base, y: Math.random() * h, vx: 0.15 + Math.random() * 0.25, vy: -0.08 - Math.random() * 0.12, size: 1.5 + Math.random() * 3, maxLife: 600 };
    case "snow":
      return { ...base, vy: 0.6 + Math.random() * 1.1, size: 2 + Math.random() * 4.5, maxLife: 900, char: Math.random() < 0.16 ? "❄" : undefined };
    case "pixel":
      return { ...base, vy: 1.4 + Math.random() * 2, size: 3 + Math.random() * 4, maxLife: 500 };
    case "stones":
      return { ...base, vy: 0.9 + Math.random() * 1.3, size: 5 + Math.random() * 5, maxLife: 600 };
    case "spark":
      return { ...base, y: h + 10, vy: -(1.2 + Math.random() * 2), vx: (Math.random() - 0.5) * 0.8, size: 2 + Math.random() * 3.5, maxLife: 380 };
    case "network":
      return { ...base, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, size: 2.5 + Math.random() * 1.5, maxLife: 700 };
    case "confetti":
      return { ...base, vy: 1.3 + Math.random() * 2, vx: (Math.random() - 0.5) * 1.6, size: 4 + Math.random() * 5, maxLife: 650, ribbon: Math.random() < 0.35 };
    case "code": {
      const col = Math.floor((Math.random() * w) / 18) * 18;
      return { ...base, x: col, vy: 2 + Math.random() * 2.6, size: 12 + Math.random() * 5, maxLife: 520, char: CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)] };
    }
    case "sparkle":
      return { ...base, y: Math.random() * h, vy: -0.18, size: 1.5 + Math.random() * 3, maxLife: 280, char: Math.random() < 0.25 ? "✦" : undefined };
    default:
      return null;
  }
}

function spawnHero(char: string, w: number, h: number): Particle {
  const fromLeft = Math.random() < 0.5;
  return {
    x: fromLeft ? -60 : w + 60,
    y: h * (0.25 + Math.random() * 0.4),
    vx: (fromLeft ? 1 : -1) * (3.2 + Math.random() * 1.5),
    vy: -(0.8 + Math.random() * 0.8),
    size: 15,
    life: 0,
    maxLife: 600,
    color: "#fff",
    char,
    phase: 0,
    mode: "none",
    hero: true,
  };
}

export function EmakiFx() {
  const [progress, setProgress] = React.useState(0);
  const [year, setYear] = React.useState("1950");
  const [tint, setTint] = React.useState("transparent");
  const [flashKey, setFlashKey] = React.useState(0);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reducedRef = React.useRef(false);

  React.useEffect(() => {
    const panels = Array.from(document.querySelectorAll<HTMLElement>(".emaki-panel"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reduced;

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
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      panels.forEach((el) => io.observe(el));
    }

    let mode: FxMode = "dust";
    let currentYear = "1950";
    let heroQueue: string[] = [];
    let done = false;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      setProgress(p);
      const mid = window.innerHeight * 0.55;
      /* 時代の切り替えは「前のカセットの下端を過ぎたすぐ後（ギャップの18%地点）」が
         判定線を越えた瞬間に発火する */
      let current: HTMLElement | null = null;
      let prevBottom: number | null = null;
      for (const el of panels) {
        const r = el.getBoundingClientRect();
        const switchAt = prevBottom === null ? r.top : prevBottom + (r.top - prevBottom) * 0.18;
        if (switchAt < mid) current = el;
        prevBottom = r.bottom;
      }
      const y = current?.dataset.year ?? "1950";
      if (y !== currentYear) {
        currentYear = y;
        setYear(y);
        if (!reduced) {
          setFlashKey((k) => k + 1); // 時代ジャンプのフラッシュ
          heroQueue.push(...(HEROES[y] ?? []));
        }
      }
      mode = (current?.dataset.fx as FxMode) ?? "dust";
      setTint(current?.dataset.tint ?? "transparent");
      if (!done && p > 0.96) {
        done = true;
        unlock("emaki", "read");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

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
      const maxCount = window.innerWidth < 600 ? 70 : 150;

      const tick = () => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        /* 主役キャラの投入 */
        while (heroQueue.length) {
          const c = heroQueue.pop()!;
          particles.push(spawnHero(c, w, h));
        }

        /* 通常スポーン（1フレームに最大2個） */
        const alive = particles.filter((pt) => pt.mode === mode).length;
        for (let i = 0; i < 2; i++) {
          if (mode !== "none" && alive + i < maxCount && Math.random() < 0.8) {
            const pt = spawn(mode, w, h);
            if (pt) particles.push(pt);
          }
        }

        /* ネットワーク：点同士を線でつなぐ */
        if (mode === "network") {
          const nodes = particles.filter((pt) => pt.mode === "network");
          ctx.lineWidth = 1.2;
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const d2 = dx * dx + dy * dy;
              if (d2 < 130 * 130) {
                ctx.strokeStyle = `rgba(120,90,255,${(1 - Math.sqrt(d2) / 130) * 0.35})`;
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
          pt.x += pt.vx + (pt.mode === "snow" || pt.mode === "confetti" ? Math.sin(pt.phase) * 0.7 : 0);
          pt.y += pt.vy;
          const fadeBoost = pt.hero || pt.mode === mode ? 1 : 4;
          const fade = Math.min(pt.life / 30, 1) * Math.max(1 - (pt.life * fadeBoost) / pt.maxLife, 0);
          if (fade <= 0 || pt.y > h + 60 || pt.y < -80 || pt.x < -80 || pt.x > w + 80) return false;

          ctx.globalAlpha = fade * (pt.mode === "sparkle" ? 0.5 + 0.5 * Math.sin(pt.phase * 6) : 1);

          if (pt.hero && pt.char) {
            /* 時代の主役：大きく発光しながら横切る */
            ctx.font = "52px sans-serif";
            ctx.shadowColor = "rgba(255,210,63,0.9)";
            ctx.shadowBlur = 22;
            ctx.fillText(pt.char, pt.x, pt.y);
            ctx.shadowBlur = 0;
          } else if (pt.char) {
            ctx.font = `${Math.max(pt.size * 3, 12)}px monospace`;
            ctx.fillStyle = pt.color;
            if (pt.mode === "code") {
              ctx.shadowColor = pt.color;
              ctx.shadowBlur = 6;
            }
            ctx.fillText(pt.char, pt.x, pt.y);
            ctx.shadowBlur = 0;
          } else if (pt.mode === "pixel" || pt.mode === "confetti") {
            ctx.fillStyle = pt.color;
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.phase * 2.4);
            if (pt.ribbon) {
              ctx.fillRect(-pt.size * 0.25, -pt.size * 1.4, pt.size * 0.5, pt.size * 2.8);
            } else {
              ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size * 0.7);
            }
            ctx.restore();
          } else if (pt.mode === "stones") {
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(20,17,15,0.75)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            /* 碁石のツヤ */
            ctx.fillStyle = pt.color === "#14110f" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.9)";
            ctx.beginPath();
            ctx.arc(pt.x - pt.size * 0.3, pt.y - pt.size * 0.35, pt.size * 0.22, 0, Math.PI * 2);
            ctx.fill();
          } else {
            /* 発光する粒（雪・火花・ネットワーク・煌めき・塵） */
            ctx.fillStyle = pt.color;
            if (pt.mode === "spark" || pt.mode === "sparkle" || pt.mode === "network" || pt.mode === "snow") {
              ctx.shadowColor = pt.color;
              ctx.shadowBlur = pt.mode === "snow" ? 5 : 10;
            }
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
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
      {/* 時代の空（グラデーションをmultiplyで重ねる）。カセット(z2)の背面で背景紙だけを染める */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: tint,
          opacity: 0.28,
          mixBlendMode: "multiply",
          transition: "background 1.2s ease",
        }}
      />
      {/* 巨大な年号の透かし */}
      {!reducedRef.current && (
        <div
          key={`wm-${year}`}
          aria-hidden="true"
          className="emaki-watermark"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "min(30vw, 260px)",
            color: "rgba(20,17,15,0.07)",
            letterSpacing: "-0.04em",
            userSelect: "none",
          }}
        >
          {year}
        </div>
      )}
      {/* 時代ジャンプのフラッシュ */}
      {flashKey > 0 && <div key={`fl-${flashKey}`} aria-hidden="true" className="emaki-flash" />}
      {/* パーティクル（透かしと同じくカセットの背面。DOM順で透かしより前に描画される） */}
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }} />
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
