"use client";
/* ============================================================
   絵巻の演出（クライアント側）。
   ・スクロール進捗バー（上部固定・年号つき）
   ・パネルのスクロール出現（JSが動く環境でだけ隠す→出す）
   ・最後まで読むと図鑑に「読破」を記録
   ============================================================ */
import React from "react";
import { unlock } from "../zukan/store";

export function EmakiFx() {
  const [progress, setProgress] = React.useState(0);
  const [year, setYear] = React.useState("1950");

  React.useEffect(() => {
    const panels = Array.from(document.querySelectorAll<HTMLElement>(".emaki-panel"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* 出現アニメ：JSが動くときだけ隠す（JSオフでも内容は見える） */
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

    /* 進捗バー＋現在の年号＋読破判定 */
    let done = false;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      setProgress(p);
      /* いま画面中央に近いパネルの年号を拾う */
      const mid = window.innerHeight * 0.4;
      let current = "1950";
      for (const el of panels) {
        const r = el.getBoundingClientRect();
        if (r.top < mid) current = el.dataset.year ?? current;
      }
      setYear(current);
      if (!done && p > 0.96) {
        done = true;
        unlock("emaki", "read");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 70, pointerEvents: "none" }}>
      <div style={{ height: 5, background: "rgba(20,17,15,0.12)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--red-500)" }} />
      </div>
      {progress > 0.02 && progress < 0.97 && (
        <div
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
  );
}
