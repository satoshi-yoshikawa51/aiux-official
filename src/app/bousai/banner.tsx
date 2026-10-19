"use client";

/* ============================================================
   トップの特設バナー「サイバー攻撃防災手帳」の中身（→ /bousai）。
   画像ではなく、ページ本体と同じ部品で「動く」バナーにしている：
   ・背景はコードの雨の廊下（cyber.css の .tk-rain）がずっと流れる
   ・タイトルは画面に入るたびに解読モーション（decode.ts）で登場し、
     確定後はグリッチ（.tk-glitch）がときどき走る
   外側の <a>（top-banners.tsx の Slide）に .bb と .tk-theme を付けて使う。
   文字の大きさは cqw（バナーの幅基準）で、1200×480 の絵をそのまま縮める。

   雨の描画はモジュールで1つだけ持ち、本物とクローンの両方に貼る
   （無限ループ用にクローンがもう1枚出るため）。画面に入っている
   バナーが1枚もなければ止める。
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { DECODE_TIMING, GLYPHS, resetChars, startDecode } from "./decode";

export const BOUSAI_BANNER = {
  href: "/bousai",
  alt: "サイバー攻撃防災手帳 — 5問で、あなた専用のセキュリティ手順書",
  gaPlace: "top-bousai-banner",
};

const KICKER = "> CYBER ATTACK — DISASTER KIT";
const TITLE = "サイバー攻撃防災手帳";

/* ── 雨の描き手（1つだけ） ──
   rain.tsx と同じ描き方。バナーは小さいので元canvasも小さくして軽くする */
const W = 640;
const H = 900;
const FONT = 10;
const COLS = Math.floor(W / FONT);
type Consumer = { faces: HTMLCanvasElement[]; visible: boolean };
const consumers = new Set<Consumer>();
let src: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let drops: number[] = [];
let speed: number[] = [];
let raf = 0;
let last = 0;

function ensureSource() {
  if (src) return;
  src = document.createElement("canvas");
  src.width = W;
  src.height = H;
  ctx = src.getContext("2d");
  if (!ctx) return;
  const N = COLS * 2;
  drops = Array.from({ length: N }, () => Math.random() * -H * 1.5);
  speed = Array.from({ length: N }, () => 0.5 + Math.random() * 1.2);
  ctx.fillStyle = "#040806";
  ctx.fillRect(0, 0, W, H);
  /* 最初の1フレームから廊下が埋まっているように、先に回しておく */
  for (let i = 0; i < 90; i++) step();
}
function step() {
  if (!ctx) return;
  ctx.fillStyle = "rgba(4,8,6,0.06)";
  ctx.fillRect(0, 0, W, H);
  ctx.font = `${FONT}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = "top";
  for (let i = 0; i < drops.length; i++) {
    const x = (i % COLS) * FONT;
    const y = drops[i];
    ctx.fillStyle = "#39ff8a";
    ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y - FONT);
    ctx.fillStyle = "#d9ffe6";
    ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y);
    drops[i] = y > H + FONT * 2 ? Math.random() * -H * 0.8 : y + FONT * speed[i];
  }
}
function blit(c: Consumer) {
  if (!src) return;
  for (const f of c.faces) f.getContext("2d")?.drawImage(src, 0, 0, f.width, f.height);
}
function loop(t: number) {
  raf = requestAnimationFrame(loop);
  /* 24fps 程度で十分 */
  if (t - last < 42) return;
  last = t;
  step();
  for (const c of consumers) if (c.visible) blit(c);
}
/* 見えているバナーがあるときだけ回す */
function syncLoop() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const any = !document.hidden && !reduce && Array.from(consumers).some((c) => c.visible);
  if (any && !raf) raf = requestAnimationFrame(loop);
  if (!any && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

/* トップの開幕ローディング（splash.tsx）が幕を開けるまで待つ。
   その間は html に .splash-hold が付いている。幕の裏で解読が
   終わってしまうと、見えたときにはもう普通の見出しになっているため */
function afterSplash(cb: () => void): () => void {
  const html = document.documentElement;
  if (!html.classList.contains("splash-hold")) {
    cb();
    return () => {};
  }
  const mo = new MutationObserver(() => {
    if (html.classList.contains("splash-hold")) return;
    mo.disconnect();
    cb();
  });
  mo.observe(html, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

export function BousaiBannerBody({ clone }: { clone: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const kickerRef = useRef<HTMLDivElement>(null);
  const chars = Array.from(TITLE);
  const [phase, setPhase] = useState<"static" | "run" | "done">("static");

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const slide = el.parentElement; /* 外側の <a>（.bb） */
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* 雨：登録して、まず1枚貼る */
    ensureSource();
    const consumer: Consumer = { faces: Array.from(el.querySelectorAll<HTMLCanvasElement>("canvas")), visible: false };
    for (const f of consumer.faces) {
      f.width = W;
      f.height = H;
    }
    blit(consumer);
    consumers.add(consumer);

    /* 見出し：JSが動いたので仮隠しを解除し、画面に入るまでは自分で隠す */
    slide?.style.removeProperty("--tk-pre");
    if (reduce) setPhase("done");
    else resetChars(chars, refs.current, true);

    let stop: (() => void) | null = null;
    let cancelWait: (() => void) | null = null;
    let shown = false;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        consumer.visible = e.isIntersecting;
        syncLoop();
        if (reduce) return;
        /* 6割以上見えたら解読を始める。いちど出て戻ってきたら、また最初から */
        if (e.intersectionRatio >= 0.6 && !shown) {
          shown = true;
          stop?.();
          cancelWait?.();
          cancelWait = afterSplash(() => {
            setPhase("run");
            stop = startDecode({
              chars,
              els: refs.current,
              timing: DECODE_TIMING,
              kicker: { el: kickerRef.current, text: KICKER, start: 0, speed: 14 },
              onDone: () => setPhase("done"),
            });
          });
        } else if (!e.isIntersecting && shown) {
          shown = false;
          cancelWait?.();
          cancelWait = null;
          stop?.();
          stop = null;
          setPhase("static");
          resetChars(chars, refs.current, true);
          if (kickerRef.current) kickerRef.current.textContent = KICKER;
        }
      },
      { threshold: [0, 0.6] },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", syncLoop);
    return () => {
      io.disconnect();
      cancelWait?.();
      stop?.();
      consumers.delete(consumer);
      document.removeEventListener("visibilitychange", syncLoop);
      syncLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrap} className="bb-body" aria-hidden={clone || undefined}>
      {/* ハイドレーション前に本当の文字が一瞬見えないよう、パース直後に隠す（hero.tsx と同じ） */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var h=document.currentScript.parentElement.parentElement;h.style.setProperty('--tk-pre','0')}catch(e){}})();",
        }}
      />
      <div className="tk-rain bb-rain" aria-hidden="true">
        <div className="tk-rain-stage">
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
      <div className="bb-shade" />
      <div className="bb-frame">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="bb-text">
        <div className="bb-kicker" ref={kickerRef}>
          {KICKER}
        </div>
        <div className={"bb-title tk-glitch" + (phase === "run" ? " decoding" : "")} data-text={phase === "done" ? TITLE : undefined}>
          {chars.map((ch, i) => (
            <span
              key={i}
              className="tk-ch"
              ref={(el) => {
                refs.current[i] = el;
              }}
            >
              {ch}
            </span>
          ))}
        </div>
        <div className="bb-sub">
          5問で、<b>あなた専用</b>のセキュリティ手順書。
        </div>
        <div className="bb-cta">
          防災手帳をつくる <i className="ph-bold ph-arrow-right" />
        </div>
      </div>
    </div>
  );
}
