"use client";
/* ============================================================
   /academy（アプリの宣伝LP）のうち、JSが要る部分だけ。

   ▍ページの床を抜いて、後ろの動画を見せる
   ScrollStage は「画面に貼りつけた動画」と「床を抜いた帯」の2つを出す。
   本文のセクションはすべて不透明な背景を持っているので、動画は
   **帯のところだけ**窓のように見える。スクロールで帯が通ると、
   そこに動画が現れて流れる、という見え方になる。

   動画は帯が画面に入ったときだけ再生する。出しっぱなしにすると、
   見えていない間もデコードが走り続けてスマホが熱くなる。
   ============================================================ */
import React from "react";

export function ScrollStage({
  src,
  poster,
  lines,
}: {
  src: string;
  poster: string;
  lines: string[];
}) {
  const holeRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const hole = holeRef.current;
    const video = videoRef.current;
    if (!hole || !video) return;

    const io = new IntersectionObserver(
      ([e]) => {
        setOpen(e.isIntersecting);
        if (e.isIntersecting) {
          /* 窓に入るたびに頭から。通り過ぎて戻ってきた人にも、
             途中の絵ではなく最初から見せる */
          video.currentTime = 0;
          void video.play().catch(() => {
            /* 自動再生が拒まれる端末がある。ポスター画像のままでも
               意味は通るので、ここでは黙って諦める */
          });
        } else {
          video.pause();
        }
      },
      /* 帯の3割が見えたら開始。端に少し掛かっただけで鳴り出すと、
         スクロール中にちらつく */
      { threshold: 0.3 }
    );
    io.observe(hole);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* 画面に貼りつけた動画。本文より後ろ（z-index 0）に居る */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="metadata"
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
          /* 窓の外に居るあいだは止めているので、絵が固まって見えないよう
             合わせて透明にする */
          opacity: open ? 1 : 0,
          transition: "opacity .45s ease",
        }}
      />
      {/* 床を抜いた帯。背景を敷かないので、後ろの動画が見える */}
      <section
        ref={holeRef}
        style={{
          position: "relative",
          zIndex: 1,
          height: "min(78vh, 560px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        {/* 文字を読ませるぶんだけ暗くする。全面に掛けると動画が死ぬ */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, rgba(20,17,15,0.62) 0%, rgba(20,17,15,0.18) 62%, transparent 85%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          {lines.map((l, i) => (
            <div
              key={l}
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: i === 0 ? "clamp(26px,4.4vw,44px)" : "clamp(20px,3.2vw,32px)",
                lineHeight: 1.4,
                color: "#fff",
                textShadow: "0 2px 18px rgba(0,0,0,.55)",
                marginTop: i === 0 ? 0 : 10,
                /* 窓に入ってから遅れて上がってくる */
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(14px)",
                transition: `opacity .5s ease ${0.15 + i * 0.12}s, transform .5s ease ${0.15 + i * 0.12}s`,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
