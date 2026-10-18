"use client";
/* ============================================================
   トップの特設バナー（防災手帳・スマホアプリ・Claude教習所）のカルーセル。

   ・1枚のバナー＝1枚の横長画像（1200×480）＋リンク1つ。
     画像は scripts/generate-top-banners.mjs（npm run banners:top）で
     生成する。デザインツールで作った絵に差し替えるときは、
     public/top-banners/<name>.webp を置き換えるだけでよい。
   ・PC（>900px）：2枚が見える横スクロール。3枚目からは矢印か
     ドットで送る（3枚になったので、2枚並べから変えた）。
   ・スマホ（≤900px）：1枚ずつの横スワイプ。
   ・どちらも左右の矢印と下の●○ドットで「まだ隣にある」ことを示す。
   ・端で止まらない無限ループ。トラックの末尾に先頭バナーのクローンを
     「1画面に見える枚数」ぶん置き、右端からさらに右へ進んでクローンに
     着地した瞬間、アニメなしで本物へ差し替える——ずっと右へ進んで
     いるように見せる定石。PCは2枚見えるのでクローンも2枚、スマホは
     1枚だけ出す（CSSで出し分け）。左矢印は前へ、1枚目では最後の
     バナーへ回り込む。
   ・5秒ごとの自動送りつき（スマホのみ・常に右方向）。数え始めるのは
     バナーが画面に入ってから。ページ読み込み時から数えると、MVを
     読んでいる間に進んでしまい、スクロールして来た人には1枚目が
     一瞬で切り替わったように見える。
   ・バナーを増やすときは SLIDES に1件足すだけ。ドット・矢印・
     ループは枚数から自動で追従する。

   GAの計測名（data-ga-place）は縦積み時代のバナーから引き継ぐ。
   変えると過去のデータと繋がらなくなるので、ここは動かさない。
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from "react";

/* site-chrome の PAGE と同じ値。クライアント側に Nav/Footer まで
   引き込まないよう、定数だけ書き写している */
const PAGE = "min(1080px, 92vw)";

/* 自動送りの間隔。速い＝読み終わる前に切り替わる、遅い＝2枚目に気づかない */
const AUTO_MS = 5000;

const SLIDES: { key: string; href: string; img: string; alt: string; gaPlace: string }[] = [
  {
    key: "bousai",
    href: "/bousai",
    img: "/top-banners/bousai.webp",
    alt: "サイバー攻撃防災手帳 — 5問で、あなた専用のセキュリティ手順書。回答はどこにも送らない",
    gaPlace: "top-bousai-banner",
  },
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

const COUNT = SLIDES.length;
/* PCで1画面に見える枚数。クローンをこの数だけ末尾に置く */
const VISIBLE_PC = 2;
const CLONES = Math.min(COUNT, VISIBLE_PC);
/* トラック上の並びは [本物×COUNT, 先頭のクローン×CLONES]。
   child番号（raw）0..COUNT-1 が本物、COUNT 以降がクローン */
const rawToReal = (raw: number) => raw % COUNT;

function Slide({ s, clone }: { s: (typeof SLIDES)[number]; clone?: number }) {
  const isClone = clone !== undefined;
  return (
    <a
      className={isClone ? `top-banner-slide top-banner-clone top-banner-clone-${clone}` : "top-banner-slide"}
      href={s.href}
      data-ga="cta_click"
      data-ga-place={s.gaPlace}
      aria-hidden={isClone || undefined}
      tabIndex={isClone ? -1 : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.img} alt={isClone ? "" : s.alt} width={1200} height={480} style={{ width: "100%", height: "auto", display: "block" }} />
    </a>
  );
}

export function TopBanners() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0); // 本物の番号（0..COUNT-1）
  const [inView, setInView] = useState(false); // バナーが画面に入っているか
  const pausedRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* いまどのchildに一番近いか。幅やgapを決め打ちすると
     CSSを触った瞬間にずれるので実測で出す */
  const nearestRaw = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).offsetLeft - el.scrollLeft);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }, []);

  const scrollToRaw = useCallback((raw: number, smooth = true) => {
    const el = trackRef.current;
    const target = el?.children[raw] as HTMLElement | undefined;
    if (el && target) el.scrollTo({ left: target.offsetLeft, behavior: smooth ? "smooth" : "auto" });
  }, []);

  /* スクロールのたびにドットを追従させ、止まったあと（150ms静止）に
     クローンへ着地していたら、アニメなしで本物の1枚目へ差し替える */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const raw = nearestRaw();
      setIndex(rawToReal(raw));
      if (settleRef.current) clearTimeout(settleRef.current);
      settleRef.current = setTimeout(() => {
        const r = nearestRaw();
        if (r >= COUNT) scrollToRaw(r - COUNT, false);
      }, 150);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (settleRef.current) clearTimeout(settleRef.current);
    };
  }, [nearestRaw, scrollToRaw]);

  /* 次へ＝常に右方向（最後のバナーからはクローンへ進み、着地後に差し替え） */
  const goNext = useCallback(() => {
    const raw = nearestRaw();
    scrollToRaw(Math.min(raw + 1, COUNT));
  }, [nearestRaw, scrollToRaw]);

  /* 前へ＝1枚目では最後のバナーへ回り込む（消さずにずっと押せる） */
  const goPrev = useCallback(() => {
    const raw = nearestRaw();
    scrollToRaw(raw === 0 ? COUNT - 1 : raw - 1);
  }, [nearestRaw, scrollToRaw]);

  /* バナーが画面に入っているかを見る。6割以上見えたら「入った」。
     入ったり出たりで inView が変わるたびに、下の自動送りが数え直す */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ── 自動送り ──
     AUTO_MS ごとに右へ。動くのはカルーセルになるスマホ幅（≤900px）だけ。
     数えるのはバナーが画面に入っている間だけ（入った瞬間から5秒）。
     指で触っている間は止め、手で動かしたら（indexが変わるので）数え直し。
     タブが裏の間と、OSの「動きを減らす」設定では動かさない */
  useEffect(() => {
    if (COUNT < 2 || !inView) return;
    const iv = setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      if (!window.matchMedia("(max-width: 900px)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      goNext();
    }, AUTO_MS);
    return () => clearInterval(iv);
  }, [index, inView, goNext]);

  const arrowStyle: React.CSSProperties = {
    position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 3,
    width: 32, height: 32, borderRadius: "50%",
    border: "var(--bw-line) solid var(--ink-900)", background: "rgba(255,255,255,0.94)",
    boxShadow: "var(--shadow-pop-sm)", cursor: "pointer",
    placeItems: "center", fontSize: 15, color: "var(--ink-900)", padding: 0,
  };

  return (
    <section ref={sectionRef} aria-label="特設バナー" style={{ maxWidth: PAGE, margin: "0 auto", padding: "36px 0 40px" }}>
      <div
        style={{ position: "relative" }}
        onPointerDown={() => { pausedRef.current = true; }}
        onPointerUp={() => { pausedRef.current = false; }}
        onPointerCancel={() => { pausedRef.current = false; }}
        onPointerLeave={() => { pausedRef.current = false; }}
      >
        <div ref={trackRef} className="top-banner-track">
          {SLIDES.map((s) => (
            <Slide key={s.key} s={s} />
          ))}
          {COUNT > 1 && SLIDES.slice(0, CLONES).map((s, i) => <Slide key={`clone-${s.key}`} s={s} clone={i} />)}
        </div>
        <button type="button" className="top-banner-arrow" aria-label="前のバナー" onClick={goPrev} style={{ ...arrowStyle, left: 4 }}>
          <i className="ph-bold ph-caret-left" />
        </button>
        <button type="button" className="top-banner-arrow" aria-label="次のバナー" onClick={goNext} style={{ ...arrowStyle, right: 4 }}>
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
            onClick={() => scrollToRaw(i)}
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
