"use client";
/* ============================================================
   画面に入るまで読み込まない、装飾用のループ動画。

   トップやセクション見出しに置いている小さなサムネ動画は、その場に
   あるだけでページを開いた瞬間に本体がダウンロードされる（autoplay が
   あると preload の指定に関わらず取りにいく）。折りたたみの下にある
   ものまで最初に落とすのは無駄なので、IntersectionObserver で
   近づいてから src を与えるようにした。

   ReactはSSRでmuted属性を出力しない（＝自動再生がブロックされる）ため、
   video タグは従来どおり raw HTML で埋め込んでいる。
   ============================================================ */
import React from "react";

const esc = (s: string) => s.replace(/"/g, "&quot;");

export function LazyLoopVideo({
  src,
  poster,
  style,
  className,
}: {
  src: string;
  poster?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const v = ref.current?.querySelector("video");
    if (!v) return;

    const load = () => {
      if (v.getAttribute("src")) return;
      v.setAttribute("src", src);
      v.muted = true;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    /* 非対応環境では素直に即読み込む */
    if (typeof IntersectionObserver === "undefined") {
      load();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        load();
        io.disconnect();
      },
      /* 少し手前から読み始めて、見えたときには動いている状態にする */
      { rootMargin: "300px" }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src]);

  const tag =
    `<video ${poster ? `poster="${esc(poster)}" ` : ""}` +
    `autoplay muted loop playsinline preload="none" aria-hidden="true" ` +
    `style="width:100%;height:100%;object-fit:cover;display:block;"></video>`;

  return (
    <div ref={ref} className={className} style={style} dangerouslySetInnerHTML={{ __html: tag }} />
  );
}
