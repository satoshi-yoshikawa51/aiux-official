"use client";
/* ============================================================
   スクロール出現演出。
   ・セクションは視界に入ったらふわっと表示（.rv → .rv-in）
   ・カード/チップは1枚ずつ監視し、視界に入った瞬間に
     ポヨンと登場（.rv-card → .rv-card-in）。モバイル(1カラム)でも
     1枚ごとに動きが見えるように、セクション単位ではなく個別発火。
   ・JSが無効な環境では何も隠さない（隠すクラスはここでしか付けない）
   ・prefers-reduced-motion: reduce では演出しない
   ============================================================ */
import { useEffect } from "react";

const CARD_SELECTOR = ".articles-grid > *, .mag-grid > *, .rv-stagger > *";

export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const inView = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    /* —— セクション: ふわっと —— */
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section, footer"));
    const ioSection = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("rv-in");
            ioSection.unobserve(e.target);
          }
        }
      },
      /* threshold は0にする。割合指定だとビューポートより背の高いセクション
         （例: モバイル1カラムの用語集150枚グリッド）では「5%が画面内」に
         一生ならず、永遠にopacity:0のまま残ってしまう */
      { rootMargin: "0px 0px -6% 0px", threshold: 0 }
    );
    for (const el of sections) {
      if (inView(el)) continue;
      el.classList.add("rv");
      ioSection.observe(el);
    }

    /* —— カード/チップ: 1枚ずつポヨン —— */
    const cards = Array.from(document.querySelectorAll<HTMLElement>(CARD_SELECTOR));
    const ioCard = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.classList.remove("rv-card");
            el.classList.add("rv-card-in");
            ioCard.unobserve(el);
          }
        }
      },
      { rootMargin: "0px 0px -4% 0px", threshold: 0.12 }
    );
    cards.forEach((el, i) => {
      /* 同時に入ってくる横並び分だけ軽く時間差をつける */
      el.style.setProperty("--rv-i", String(i % 3));
      if (inView(el)) return;
      el.classList.add("rv-card");
      ioCard.observe(el);
    });

    return () => {
      ioSection.disconnect();
      ioCard.disconnect();
    };
  }, []);
  return null;
}
