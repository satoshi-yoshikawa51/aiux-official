"use client";
/* ============================================================
   トップの特設バナー（スマホアプリ＋Claude教習所）のカルーセル。

   ・1枚のバナー＝1枚の横長画像（1200×480）＋リンク1つ。
     画像は scripts/generate-top-banners.mjs（npm run banners:top）で
     生成する。デザインツールで作った絵に差し替えるときは、
     public/top-banners/<name>.webp を置き換えるだけでよい。
   ・PC（>900px）：2枚を横に並べるだけ。矢印もドットも出さない
     （枚数が増えてPCでも入り切らなくなったら、そのとき考える）。
   ・スマホ（≤900px）：1枚ずつの横スワイプ。左右の矢印と
     下の●○ドットで「まだ隣にある」ことを示す。
   ・バナーを増やすときは SLIDES に1件足すだけ。ドットと矢印は
     枚数から自動で追従する。

   GAの計測名（data-ga-place）は縦積み時代のバナーから引き継ぐ。
   変えると過去のデータと繋がらなくなるので、ここは動かさない。
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from "react";

/* site-chrome の PAGE と同じ値。クライアント側に Nav/Footer まで
   引き込まないよう、定数だけ書き写している */
const PAGE = "min(1080px, 92vw)";

const SLIDES: { key: string; href: string; img: string; alt: string; gaPlace: string }[] = [
  {
    key: "academy",
    href: "/academy",
    img: "/top-banners/academy.webp",
    alt: "AIを遊んで学べる、無料アプリ。COMIXAI アカデミー — 登録不要・広告なし・1日5分から",
    gaPlace: "top-academy-banner",
  },
  {
    key: "kyoshujo",
    href: "/claude-app",
    img: "/top-banners/kyoshujo.webp",
    alt: "5分で覚える！Claude教習所 — 練習画面を講師が案内。登録不要・無料",
    gaPlace: "top-kyoshujo-banner",
  },
];

export function TopBanners() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  /* いま何枚目か＝トラックのスクロール位置から一番近いスライドを探す。
     幅やgapを決め打ちすると、CSSを触った瞬間にずれるので実測で出す */
  const syncIndex = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).offsetLeft - el.scrollLeft);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setIndex(best);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncIndex, { passive: true });
    return () => el.removeEventListener("scroll", syncIndex);
  }, [syncIndex]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
    const target = el.children[clamped] as HTMLElement | undefined;
    if (target) el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  };

  /* ── 自動送り ──
     AUTO_MS ごとに次へ進み、最後まで行ったら先頭へ戻る。
     ・動くのはカルーセルになるスマホ幅（≤900px）だけ。PCは2枚とも
       見えているので送る意味がない
     ・指で触っている間は止める。手で動かしたら（スワイプ・矢印・ドット
       いずれも index が変わるので）そこから数え直し
     ・タブが裏にある間と、OSの「動きを減らす」設定では動かさない */
  const AUTO_MS = 5000;
  const pausedRef = useRef(false);
  useEffect(() => {
    if (SLIDES.length < 2) return;
    const iv = setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      if (!window.matchMedia("(max-width: 900px)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = trackRef.current;
      if (!el) return;
      const next = (index + 1) % SLIDES.length;
      const target = el.children[next] as HTMLElement | undefined;
      if (target) el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
    }, AUTO_MS);
    return () => clearInterval(iv);
  }, [index]);

  const arrowStyle: React.CSSProperties = {
    position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 3,
    width: 32, height: 32, borderRadius: "50%",
    border: "var(--bw-line) solid var(--ink-900)", background: "rgba(255,255,255,0.94)",
    boxShadow: "var(--shadow-pop-sm)", cursor: "pointer",
    placeItems: "center", fontSize: 15, color: "var(--ink-900)", padding: 0,
  };

  return (
    <section aria-label="特設バナー" style={{ maxWidth: PAGE, margin: "0 auto", padding: "36px 0 40px" }}>
      <div
        style={{ position: "relative" }}
        onPointerDown={() => { pausedRef.current = true; }}
        onPointerUp={() => { pausedRef.current = false; }}
        onPointerCancel={() => { pausedRef.current = false; }}
        onPointerLeave={() => { pausedRef.current = false; }}
      >
        <div ref={trackRef} className="top-banner-track">
          {SLIDES.map((s) => (
            <a
              key={s.key}
              className="top-banner-slide"
              href={s.href}
              data-ga="cta_click"
              data-ga-place={s.gaPlace}
              style={{ display: "block" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img} alt={s.alt} width={1200} height={480} style={{ width: "100%", height: "auto", display: "block" }} />
            </a>
          ))}
        </div>
        <button type="button" className="top-banner-arrow" aria-label="前のバナー" onClick={() => goTo(index - 1)} disabled={index === 0} style={{ ...arrowStyle, left: 4, opacity: index === 0 ? 0.35 : 1 }}>
          <i className="ph-bold ph-caret-left" />
        </button>
        <button type="button" className="top-banner-arrow" aria-label="次のバナー" onClick={() => goTo(index + 1)} disabled={index === SLIDES.length - 1} style={{ ...arrowStyle, right: 4, opacity: index === SLIDES.length - 1 ? 0.35 : 1 }}>
          <i className="ph-bold ph-caret-right" />
        </button>
      </div>
      <div className="top-banner-dots" style={{ justifyContent: "center", gap: 8, marginTop: 12 }}>
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            aria-label={`${i + 1}枚目のバナーへ`}
            aria-current={i === index}
            onClick={() => goTo(i)}
            style={{
              width: 9, height: 9, borderRadius: "50%", padding: 0, cursor: "pointer",
              border: "2px solid var(--ink-900)",
              background: i === index ? "var(--ink-900)" : "transparent",
            }}
          />
        ))}
      </div>
    </section>
  );
}
