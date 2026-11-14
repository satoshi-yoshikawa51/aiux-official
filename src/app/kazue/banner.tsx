"use client";

/* ============================================================
   トップの特設バナー「号外!! 新選組カズエ RE:BOOT」の中身（→ /kazue）。
   防災手帳（bousai/banner.tsx）と同じく、画像ではなく「動く」バナー：
   ・背景の町並みがゆっくり流れ、灰が舞う
   ・五人は影のまま現れて光が当たり、ロゴがあとから着地する
   ・画面に入るたびに最初から再生し、出たら巻き戻す
   外側の <a>（top-banners.tsx の Slide）に .kzb を付けて使う。
   見た目と動きは banner.css。寸法は cqw（バナーの幅基準）で、
   1200×480 の絵をそのまま縮める。

   点滅と揺れは入れない（ティザー本体で外した方針に合わせる）。
   ============================================================ */

import { useEffect, useRef, type CSSProperties } from "react";

export const KAZUE_BANNER = {
  href: "/kazue",
  alt: "新連載マンガ「号外!! 新選組カズエ RE:BOOT」近日連載開始 — ティザーサイトを見る",
  gaPlace: "top-kazue-banner",
};

/* 灰の粒。位置・大きさ・速さは決め打ち（乱数にするとSSRと食い違う）。
   x=左からの%, s=大きさ(cqw), d=1周の秒, w=開始の遅れ(秒), k=濃い色か */
const ASH = [
  { x: 6, s: 0.5, d: 9, w: 0, k: 0 },
  { x: 17, s: 0.3, d: 12, w: 3, k: 1 },
  { x: 28, s: 0.6, d: 8, w: 5, k: 0 },
  { x: 39, s: 0.35, d: 11, w: 1, k: 0 },
  { x: 48, s: 0.45, d: 10, w: 6, k: 1 },
  { x: 58, s: 0.3, d: 13, w: 2, k: 0 },
  { x: 67, s: 0.55, d: 9, w: 7, k: 0 },
  { x: 76, s: 0.4, d: 12, w: 4, k: 1 },
  { x: 85, s: 0.5, d: 10, w: 8, k: 0 },
  { x: 94, s: 0.3, d: 11, w: 2.5, k: 0 },
];

export function KazueBannerBody({ clone }: { clone: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const slide = el?.parentElement; /* 外側の <a>（.kzb） */
    if (!el || !slide) return;
    /* 「登場前は隠す」のはJSが動いたときだけ（動かなければ全部見えたまま） */
    slide.classList.add("kzb-js");
    const io = new IntersectionObserver(
      ([e]) => {
        /* 半分以上見えたら再生。完全に出たら巻き戻して、次に入ったときまた最初から */
        if (e.intersectionRatio >= 0.5) slide.classList.add("kzb-on");
        else if (!e.isIntersecting) slide.classList.remove("kzb-on");
      },
      { threshold: [0, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="kzb-body" aria-hidden={clone || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="kzb-bg" src="/kazue/banner-bg.webp" alt="" width={1320} height={671} loading="lazy" decoding="async" />
      <div className="kzb-cast">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kazue/banner-cast.webp" alt="" width={920} height={660} loading="lazy" decoding="async" />
      </div>
      <div className="kzb-ash" aria-hidden="true">
        {ASH.map((a, i) => (
          <i
            key={i}
            className={a.k ? "kzb-ash-k" : undefined}
            style={{ "--x": `${a.x}%`, "--s": `${a.s}cqw`, "--d": `${a.d}s`, "--w": `${a.w}s` } as CSSProperties}
          />
        ))}
      </div>
      <div className="kzb-shade" />
      <div className="kzb-text">
        <span className="kzb-kicker">新連載</span>
        <div className="kzb-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kazue/banner-logo.webp" alt="" width={720} height={461} loading="lazy" decoding="async" />
        </div>
        <div className="kzb-soon">近日連載開始</div>
      </div>
      <div className="kzb-cta">
        ティザーを見る <i className="ph-bold ph-arrow-right" />
      </div>
    </div>
  );
}
