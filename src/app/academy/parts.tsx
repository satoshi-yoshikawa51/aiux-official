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

/* ============================================================
   ▍MVのスマホの中で、本物のWeb版を触らせる

   中身は宣伝用の作りものではなく、**アプリと同じビルド**を
   `?demo=1` で読んでいる（→ ComixaiAcademy/src/lib/demo.ts）。
   体験モードでは 1本目のレッスンとガチャだけが開いていて、
   記録は見た人のブラウザに残らない。

   ▍最初は静止画で、押されてから読む
   Expo製のWeb版はJSも3Dも重い。MVに最初から iframe を置くと、
   **LPがまだ何も出ていないうちに**その読み込みが始まって、
   いちばん見せたい1画面目が遅れる。押した人にだけ読ませる。

   ▍中は 390px の画面として描かせて、あとから縮める
   枠に合わせて iframe を細くすると、アプリ側が「とても細い端末」
   として崩れた形で組む。**中はふつうのスマホの幅で組ませて、
   出来上がりを transform で縮める**ほうが、実機と同じ絵になる。
   ============================================================ */

/* ============================================================
   ▍MVの背景動画を、PCとスマホで出し分ける

   横長の動画を縦画面に `cover` で敷くと、**幅の4分の1しか映らない**。
   人物が真ん中に立っていても顔の大アップになってしまうので、
   縦持ち用に撮った別の動画へ差し替える。

   ▍`<source media="...">` は使えない
   `<picture>` と違って、`<video>` の中の source の media は
   **Chromiumが見てくれない**（1280pxでもスマホ用が選ばれることを
   手元で確認した）。当てにすると、PCで縦動画が出る。
   なので matchMedia で選ぶ。

   JSが動くまでは何も出さない。節の地色（黒）がそのまま見えるだけで、
   その上には暗幕を敷いているので、絵が入れ替わってもちらつかない。
   **向きの違う静止画を先に出すほうが目立つ**ので、あえて出さない。
   ============================================================ */
export function MvVideo({
  pc,
  sp,
  posterPc,
  posterSp,
  breakpoint = 900,
}: {
  pc: string;
  sp: string;
  posterPc: string;
  posterSp: string;
  breakpoint?: number;
}) {
  const [narrow, setNarrow] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setNarrow(mq.matches);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);

  if (narrow === null) return null;
  const src = narrow ? sp : pc;

  return (
    <video
      /* 幅をまたいだら作り直す。src を差し替えるだけだと、
         端末によっては前の絵が residual で残る */
      key={src}
      src={src}
      poster={narrow ? posterSp : posterPc}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        /* 少しぼかして拡大しているのは、文字の下敷きにするのと、
           端のにじみを画面外へ逃がすため */
        filter: "blur(2px) saturate(0.92)",
        transform: "scale(1.05)",
      }}
    />
  );
}

/** 中に描かせる画面の幅（＝ふつうのスマホ） */
const PHONE_VW = 390;

export function TryPhone({
  src,
  poster,
  posterAlt,
}: {
  src: string;
  poster: string;
  posterAlt: string;
}) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [live, setLive] = React.useState(false);
  const [box, setBox] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box.w > 0 ? box.w / PHONE_VW : 0;

  return (
    <div style={{ width: "100%", maxWidth: 288, margin: "0 auto" }}>
      <div
        ref={boxRef}
        style={{
          position: "relative",
          width: "100%",
          /* 静止画（620×1344）と同じ縦横比。押した前後で枠が動かないように */
          aspectRatio: "620 / 1344",
          boxSizing: "border-box",
          borderRadius: 26,
          border: "6px solid var(--paper-50)",
          boxShadow: "0 24px 60px rgba(0,0,0,.55)",
          background: "var(--paper-0)",
          overflow: "hidden",
        }}
      >
        {live && scale > 0 ? (
          <iframe
            src={src}
            title="COMIXAI アカデミー（体験版）"
            /* 音は鳴らさない作りだが、効果音のために許しておく */
            allow="autoplay"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: PHONE_VW,
              height: box.h / scale,
              border: 0,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              display: "block",
            }}
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster}
              alt={posterAlt}
              width={620}
              height={1344}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <button
              type="button"
              onClick={() => setLive(true)}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                /* ▍真ん中に置く
                   下に寄せると、写っているアプリ自身の赤いボタンの上に
                   もう1つ赤いボタンが重なって、どちらを押す絵なのか
                   分からなくなる */
                justifyContent: "center",
                gap: 8,
                padding: "0 12px",
                border: 0,
                cursor: "pointer",
                background: "rgba(20,17,15,.46)",
                font: "inherit",
                color: "var(--paper-50)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 15px",
                  borderRadius: 999,
                  background: "var(--red-500)",
                  border: "var(--bw-line) solid var(--ink-900)",
                  boxShadow: "var(--shadow-pop-sm)",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 900,
                  fontSize: 13.5,
                  color: "var(--paper-50)",
                }}
              >
                <i className="ph-bold ph-hand-tap" />
                さわってみる
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  lineHeight: 1.5,
                  textAlign: "center",
                  /* 下は舞台の絵（明るい桜のことも暗い夜のこともある）なので、
                     影を敷いておかないと日によって読めなくなる */
                  textShadow: "0 1px 6px rgba(0,0,0,.85)",
                }}
              >
                ブラウザで動く体験版
              </span>
            </button>
          </>
        )}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 10.5,
          lineHeight: 1.6,
          textAlign: "center",
          color: "rgba(251,247,239,.7)",
        }}
      >
        体験版で遊べるのは1本目のレッスンとガチャ（かんばん）だけ。記録は残りません。
      </p>
    </div>
  );
}

/* ============================================================
   ▍横から滑り込ませる

   特徴カードは左右に振ってあるので、**寄せた側から**入ってくると
   「そっちに置きに来た」ように見える。逆から入れると、通り過ぎて
   戻ってきたように見えて落ち着かない。

   ▍隠すのはJSが動きだしてから（idle → hidden → shown）

   最初これを「初期状態＝隠す」で書いたら、**一度も動かなかった**。
   サーバーには IntersectionObserver が無いので、素直に書くと
   サーバー側では「出す」になる。Reactは受け取ったHTMLをそのまま
   使う（hydrationでは属性を突き合わせない）ので、**opacity:1 が
   DOMに焼き付いたまま**になり、あとから「出す」に切り替えても
   見た目が何も変わらない。

   なので順番を逆にした。まず素のまま（idle＝見えている）で描き、
   JSが動いた瞬間に、まだ画面の下にあるものだけ hidden にして、
   窓に入ったら shown へ戻す。hidden へ移るときだけ transition を
   切ってある——切らないと、そこで1→0のフェードが再生されてしまう。
   画面より下でやるので、この一瞬は誰にも見えない。

   一度出したら、もう戻さない（observer を切る）。行ったり来たりの
   たびに動くと、読み返すときに邪魔になるだけ。
   ============================================================ */

/* 描く前に隠したいので layout effect。サーバーでは呼ばれないよう分ける */
const useBeforePaint =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export function Reveal({
  from,
  style,
  children,
}: {
  from: "left" | "right";
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [phase, setPhase] = React.useState<"idle" | "hidden" | "shown">("idle");

  useBeforePaint(() => {
    const el = ref.current;
    if (!el) return;
    /* 対応していない／動きを減らす設定なら、動かさずそのまま出す */
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setPhase("shown");
      return;
    }
    /* すでに画面に入っているものは動かさない。目の前で消えて出直す */
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
      setPhase("shown");
      return;
    }
    setPhase("hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPhase("shown");
        io.disconnect();
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden = phase === "hidden";
  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translateX(${from === "right" ? 72 : -72}px)` : "none",
        /* hidden へ移る一瞬だけ切る（→ 上のメモ） */
        transition: hidden
          ? "none"
          : "opacity .42s ease-out, transform .55s cubic-bezier(.16,1,.3,1)",
        willChange: phase === "shown" ? "auto" : "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   ▍下に貼りつくダウンロードの帯

   MVを読み終えて下へ進んだ人の手元に、入口を残しておくための帯。
   **MVが見えているあいだは出さない**——MVに同じボタンがあるので、
   同じものが画面に2つ並ぶことになる。締めのカードが見えたら引っ込める
   ——こちらも同じボタンで、本命の大きいほうを隠してしまう。

   隠している間は visibility も落とす。透明なだけだと、見えない
   ボタンにキーボードのフォーカスが入ってしまう。
   ============================================================ */
export function StickyCta({ children }: { children: React.ReactNode }) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const mv = document.getElementById("academy-mv");
    const end = document.getElementById("academy-end");
    if (!mv) return;
    /* 2つの窓の状態をまとめて見る。片方ずつ setState すると、
       同じフレームで2回来たときに古いほうで上書きされる */
    const seen = { mv: true, end: false };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === mv) seen.mv = e.isIntersecting;
          else seen.end = e.isIntersecting;
        }
        setShow(!seen.mv && !seen.end);
      },
      { threshold: 0 }
    );
    io.observe(mv);
    if (end) io.observe(end);
    return () => io.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!show}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        transform: show ? "none" : "translateY(115%)",
        visibility: show ? "visible" : "hidden",
        transition: show
          ? "transform .34s cubic-bezier(.22,1,.36,1), visibility 0s"
          : "transform .28s ease, visibility 0s .28s",
      }}
    >
      {children}
    </div>
  );
}
