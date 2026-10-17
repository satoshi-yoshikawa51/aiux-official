"use client";

/* ============================================================
   見出しの登場モーション。
   背景のコードの雨と同じ文字（カナ・英数・記号）が上から落ちてきて、
   その場でスクランブルしながら1文字ずつ本当の文字に確定していく。
   確定の瞬間だけ白く光り、全部そろうと通常のグリッチ演出に引き継ぐ。

   順番: キッカーをタイプ打ち → タイトルを解読 → リード文がせり上がる
   SSRでは本当の文字をそのまま出しておき（SEO・JSなし対策）、
   マウント後に演出へ差し替える。prefers-reduced-motion では動かさない。
   ============================================================ */

import React from "react";

const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEFGHJKLMNPQRSTUVWXYZ<>=/:;+*#$%&";
const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/* タイミング（ミリ秒） */
const KICKER_START = 150;
const KICKER_SPEED = 26;
const TITLE_START = 650;
const CHAR_STAGGER = 110; /* 文字ごとの開始のずれ */
const FALL_MS = 260; /* 落ちてくる時間 */
const SCRAMBLE_MS = 520; /* スクランブルしている時間 */
const FLASH_MS = 220; /* 確定時の光 */
const LEAD_DELAY = 700; /* 最後の文字が確定してからリード文が出るまで */

export function Hero({ kicker, title, lead }: { kicker: string; title: string; lead: string }) {
  const chars = React.useMemo(() => Array.from(title), [title]);
  const refs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const kickerRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLElement>(null);
  const [phase, setPhase] = React.useState<"static" | "run" | "done">("static");
  const [leadOn, setLeadOn] = React.useState(true);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    setPhase("run");
    setLeadOn(false);
    /* ハイドレーション前の仮隠し（下のインラインscript）を解除。以降はJSが文字ごとに制御する */
    headerRef.current?.style.removeProperty("--tk-pre");
    const kEl = kickerRef.current;
    const t0 = performance.now();
    const total = TITLE_START + (chars.length - 1) * CHAR_STAGGER + FALL_MS + SCRAMBLE_MS + FLASH_MS;
    let raf = 0;
    let lastScramble = 0;
    let finished = false;

    const frame = (now: number) => {
      const t = now - t0;

      /* キッカー: タイプ打ち */
      if (kEl) {
        const n = Math.max(0, Math.min(kicker.length, Math.floor((t - KICKER_START) / KICKER_SPEED)));
        const done = n >= kicker.length;
        kEl.textContent = kicker.slice(0, n) + (done ? "" : "▌");
      }

      /* タイトル: 文字ごとに 落下 → スクランブル → 確定 */
      const scrambleTick = now - lastScramble > 45;
      if (scrambleTick) lastScramble = now;
      chars.forEach((ch, i) => {
        const el = refs.current[i];
        if (!el) return;
        const local = t - TITLE_START - i * CHAR_STAGGER;
        if (local < 0) {
          el.style.opacity = "0";
          el.style.transform = "translateY(-0.9em)";
          return;
        }
        if (local < FALL_MS) {
          /* 落ちてくる間も文字は入れ替わり続ける */
          const p = local / FALL_MS;
          const ease = 1 - Math.pow(1 - p, 3);
          el.style.opacity = String(0.35 + 0.65 * ease);
          el.style.transform = `translateY(${(-0.9 + 0.9 * ease).toFixed(3)}em)`;
          el.className = "tk-ch scr";
          if (scrambleTick || !el.textContent) el.textContent = ch === " " ? " " : rnd();
          return;
        }
        const s = local - FALL_MS;
        if (s < SCRAMBLE_MS) {
          el.style.opacity = "1";
          el.style.transform = "none";
          el.className = "tk-ch scr";
          /* 終盤ほど本当の文字が混じる確率を上げる */
          if (scrambleTick) el.textContent = Math.random() < (s / SCRAMBLE_MS) * 0.5 ? ch : rnd();
          return;
        }
        const f = s - SCRAMBLE_MS;
        el.textContent = ch;
        el.style.opacity = "1";
        el.style.transform = "none";
        el.className = f < FLASH_MS ? "tk-ch hit" : "tk-ch";
      });

      if (t < total) {
        raf = requestAnimationFrame(frame);
      } else if (!finished) {
        finished = true;
        setPhase("done");
        setTimeout(() => setLeadOn(true), LEAD_DELAY - FLASH_MS);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [chars, kicker]);

  return (
    <header className="tk-hero" ref={headerRef}>
      {/* ハイドレーション前に本当の文字が一瞬見えないよう、パース直後に隠す。
          JSが無効ならこのscriptも動かないので、静的な見出しがそのまま出る */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var h=document.currentScript.parentElement;h.style.setProperty('--tk-pre','0')}catch(e){}})();",
        }}
      />
      <div className="tk-kicker" ref={kickerRef} aria-label={kicker}>
        {kicker}
      </div>
      {/* 解読中はグリッチ（data-text）を付けない。確定後に引き継ぐ */}
      <h1 className={"tk-title" + (phase === "run" ? " decoding" : "")} data-text={phase === "done" ? title : undefined} aria-label={title}>
        {chars.map((ch, i) => (
          <span
            key={i}
            className="tk-ch"
            aria-hidden="true"
            ref={(el) => {
              refs.current[i] = el;
            }}
          >
            {ch}
          </span>
        ))}
      </h1>
      <p className={"tk-lead" + (leadOn ? " on" : "")}>{lead}</p>
    </header>
  );
}
