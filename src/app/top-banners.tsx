"use client";
/* ============================================================
   トップの特設バナー（スマホアプリ＋Claude教習所）のカルーセル。

   ・PC（>900px）：2枚を横に並べるだけ。矢印もドットも出さない
     （枚数が増えてPCでも入り切らなくなったら、そのとき考える）。
   ・スマホ（≤900px）：1枚ずつの横スワイプ。左右の矢印と
     下の●○ドットで「まだ隣にある」ことを示す。
   ・バナーを増やすときは SLIDES に1枚足すだけ。ドットと矢印は
     枚数から自動で追従する。

   GAの計測名（data-ga-place）は縦積み時代のバナーから引き継ぐ。
   変えると過去のデータと繋がらなくなるので、ここは動かさない。
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ds";
import { APP_STORE_URL, AppStoreBadge } from "./academy/store";

/* site-chrome の PAGE と同じ値。クライアント側に Nav/Footer まで
   引き込まないよう、定数だけ書き写している */
const PAGE = "min(1080px, 92vw)";

/* ── スライド1：スマホアプリの帯（黒地・ドット模様） ── */
function AcademySlide() {
  return (
    <div
      style={{
        height: "100%",
        display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", alignItems: "stretch",
        border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 18, overflow: "hidden",
        background: "var(--ink-900)", boxShadow: "var(--shadow-pop)",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1.3px, transparent 1.4px)",
        backgroundSize: "14px 14px",
      }}
    >
      <div style={{ padding: "18px 4px 18px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
        <a href="/academy" data-ga="cta_click" data-ga-place="top-academy-banner" style={{ display: "block", textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/academy/logo.webp"
            alt="COMIXAI アカデミー"
            width={1120}
            height={403}
            style={{ width: "100%", maxWidth: 175, height: "auto", display: "block", filter: "drop-shadow(0 5px 12px rgba(0,0,0,.55))" }}
          />
        </a>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(15.5px, 1.7vw, 19px)", lineHeight: 1.45, color: "var(--paper-50)" }}>
          AIを遊んで学べるアプリ、<wbr />リリース！
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.8, color: "var(--paper-200)", margin: 0 }}>
          <b style={{ color: "var(--paper-50)" }}>登録不要・広告なし・完全無料</b>で、1日5分から。
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {APP_STORE_URL ? (
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
              data-ga="academy_install"
              data-ga-place="top-academy-banner"
            >
              <AppStoreBadge height={40} />
            </a>
          ) : (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--yellow-400)", fontWeight: 700 }}>
              iPhone / iPad — まもなく公開
            </span>
          )}
          <a
            href="/academy"
            data-ga="cta_click"
            data-ga-place="top-academy-banner"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 12.5, color: "var(--yellow-400)", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            アプリを見る <i className="ph-bold ph-arrow-right" style={{ verticalAlign: "-1px" }} />
          </a>
        </div>
      </div>
      {/* 実画面は1枚だけ。下端をカードの底に食い込ませてproduct感を出す */}
      <a href="/academy" data-ga="cta_click" data-ga-place="top-academy-banner" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/academy/shots/home.webp"
          alt="COMIXAI アカデミーのホーム画面。桜並木の舞台に3Dアバターが立っている"
          style={{ width: "100%", maxWidth: 132, height: "auto", objectFit: "contain", display: "block", margin: "16px 12px -2px", borderRadius: "14px 14px 0 0", border: "var(--bw-line) solid var(--paper-50)", borderBottom: "none", boxShadow: "0 10px 24px rgba(0,0,0,.5)" }}
        />
      </a>
    </div>
  );
}

/* ── スライド2：Claude教習所（紙地） ── */
function KyoshujoSlide() {
  return (
    <a
      href="/claude-app"
      style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
      data-ga="cta_click"
      data-ga-place="top-kyoshujo-banner"
    >
      <div
        style={{
          height: "100%",
          display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", alignItems: "stretch",
          border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 18, overflow: "hidden",
          background: "var(--paper-0)", boxShadow: "var(--shadow-pop)",
        }}
      >
        <div style={{ padding: "18px 6px 18px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700 }}>
              さわって覚えるClaude入門
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(16.5px, 1.9vw, 21px)", lineHeight: 1.4 }}>
            5分で覚える！Claude教習所
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.8, color: "var(--text-body)", margin: 0 }}>
            本物そっくりの練習画面を講師が案内。<b>1コース約5分・登録不要</b>の無料コース。
          </p>
          <div>
            <Button variant="primary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
              無料ではじめる
            </Button>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/claude-app/banner.webp"
          alt="5分で覚える！Claude教習所 — 練習画面を講師が案内"
          style={{ width: "100%", height: "100%", minHeight: 180, objectFit: "cover", display: "block" }}
        />
      </div>
    </a>
  );
}

const SLIDES: { key: string; label: string; node: React.ReactNode }[] = [
  { key: "academy", label: "スマホアプリ COMIXAI アカデミー", node: <AcademySlide /> },
  { key: "kyoshujo", label: "5分で覚える！Claude教習所", node: <KyoshujoSlide /> },
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

  const arrowStyle: React.CSSProperties = {
    position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 3,
    width: 32, height: 32, borderRadius: "50%",
    border: "var(--bw-line) solid var(--ink-900)", background: "rgba(255,255,255,0.94)",
    boxShadow: "var(--shadow-pop-sm)", cursor: "pointer",
    placeItems: "center", fontSize: 15, color: "var(--ink-900)", padding: 0,
  };

  return (
    <section aria-label="特設バナー" style={{ maxWidth: PAGE, margin: "0 auto", padding: "36px 0 40px" }}>
      <div style={{ position: "relative" }}>
        <div ref={trackRef} className="top-banner-track">
          {SLIDES.map((s) => (
            <div key={s.key} className="top-banner-slide" aria-label={s.label}>
              {s.node}
            </div>
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
            aria-label={`${i + 1}枚目：${s.label}`}
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
