"use client";
/* ============================================================
   スクロール出現演出。視界に入ったセクションに .rv-in を付け、
   グリッドの子カードには時間差用のインデックス(--rv-i)を振る。
   ・JSが無効な環境では何も隠さない（.rv はここでしか付けない）
   ・prefers-reduced-motion: reduce では演出しない
   ============================================================ */
import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("section, footer"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("rv-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    for (const el of els) {
      el.querySelectorAll<HTMLElement>(
        ".articles-grid > *, .mag-grid > *"
      ).forEach((c, i) => c.style.setProperty("--rv-i", String(Math.min(i, 8))));
      const r = el.getBoundingClientRect();
      const inView = r.top < window.innerHeight && r.bottom > 0;
      if (inView) continue; // 初期表示分は隠さない（ロード時のriseに任せる）
      el.classList.add("rv");
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return null;
}
