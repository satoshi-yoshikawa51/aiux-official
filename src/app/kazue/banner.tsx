"use client";

/* ============================================================
   トップの特設バナー「号外!! 新選組カズエ RE:BOOT」の中身（→ /kazue）。
   防災手帳（bousai/banner.tsx）と同じく、画像ではなく「動く」バナー：
   ・背景の町並みがゆっくり流れ、灰が下から舞い上がる（ティザーのヒーローと同じ）
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

/* 灰の粒。ティザー本体のヒーローで舞っているものと同じ見え方にする。
   乱数は種を固定した擬似乱数で作る（Math.random だとSSRと食い違う）。
   x=左からの%, s=大きさ(cqw), d=1周の秒, w=開始の遅れ(秒), k=濃い色か。
   w を負にして、表示した瞬間から画面じゅうに散っているようにする。
   CSSへ渡す名前は --delay（--w はバナーの白色なので使わない） */
const ASH_COUNT = 36;
const ASH = (() => {
  let seed = 51;
  const rnd = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return Array.from({ length: ASH_COUNT }, () => ({
    x: r2(rnd() * 112),
    s: r2(0.45 + rnd() * 0.95),
    d: r2(4.5 + rnd() * 5),
    w: r2(-rnd() * 9.5),
    a: r2(0.35 + rnd() * 0.55),
    k: rnd() < 0.3,
  }));
})();

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
      <div className="kzb-shade" />
      <div className="kzb-ash" aria-hidden="true">
        {ASH.map((a, i) => (
          <i
            key={i}
            className={a.k ? "kzb-ash-k" : undefined}
            style={{ "--x": `${a.x}%`, "--s": `${a.s}cqw`, "--d": `${a.d}s`, "--delay": `${a.w}s`, "--a": a.a } as CSSProperties}
          />
        ))}
      </div>
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
