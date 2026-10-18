"use client";

/* ============================================================
   /bousai の見出しの登場モーション。
   順番: キッカーをタイプ打ち → タイトルを解読（decode.ts） → リード文がせり上がる
   解読が終わると data-text を付けて、通常のグリッチ演出（cyber.css）に引き継ぐ。
   SSRでは本当の文字をそのまま出しておき（SEO・JSなし対策）、
   マウント後に演出へ差し替える。prefers-reduced-motion では動かさない。
   ============================================================ */

import React from "react";
import { DECODE_TIMING, startDecode } from "./decode";

/* バナー（banner.tsx）と同じスピード感。キッカーはタイトルと並走で打つ */
const KICKER_START = 0;
const KICKER_SPEED = 14;
const LEAD_DELAY = 350; /* 最後の文字が確定してからリード文が出るまで */

export function Hero({ kicker, title, lead }: { kicker: string; title: string; lead: string }) {
  const chars = React.useMemo(() => Array.from(title), [title]);
  const refs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const kickerRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLElement>(null);
  const [phase, setPhase] = React.useState<"static" | "run" | "done">("static");
  const [leadOn, setLeadOn] = React.useState(true);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    setPhase("run");
    setLeadOn(false);
    /* ハイドレーション前の仮隠し（下のインラインscript）を解除。以降はJSが文字ごとに制御する */
    headerRef.current?.style.removeProperty("--tk-pre");
    let lead: ReturnType<typeof setTimeout> | undefined;
    const stop = startDecode({
      chars,
      els: refs.current,
      timing: DECODE_TIMING,
      kicker: { el: kickerRef.current, text: kicker, start: KICKER_START, speed: KICKER_SPEED },
      onDone: () => {
        setPhase("done");
        lead = setTimeout(() => setLeadOn(true), LEAD_DELAY - DECODE_TIMING.flashMs);
      },
    });
    return () => {
      stop();
      if (lead) clearTimeout(lead);
    };
  }, [chars, kicker]);

  return (
    <header className="tk-hero" ref={headerRef}>
      {/* ハイドレーション前に本当の文字が一瞬見えないよう、パース直後に隠す。
          JSが無効ならこのscriptも動かないので、静的な見出しがそのまま出る */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var h=document.currentScript.parentElement;h.style.setProperty('--tk-pre','0')}catch(e){}})();",
        }}
      />
      <div className="tk-kicker" ref={kickerRef} aria-label={kicker}>
        {kicker}
      </div>
      {/* 解読中はグリッチ（data-text）を付けない。確定後に引き継ぐ */}
      <h1 className={"tk-title tk-glitch" + (phase === "run" ? " decoding" : "")} data-text={phase === "done" ? title : undefined} aria-label={title}>
        {chars.map((ch, i) => (
          <span
            key={i}
            className="tk-ch"
            aria-hidden="true"
            ref={(el) => {
              refs.current[i] = el;
            }}
          >
            {ch}
          </span>
        ))}
      </h1>
      <p className={"tk-lead" + (leadOn ? " on" : "")}>{lead}</p>
    </header>
  );
}
