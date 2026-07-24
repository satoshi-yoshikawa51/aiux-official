"use client";
/* イベントカード上部のバナー（公式サイトのOGP画像）。
   外部CDNの画像なので、読み込み失敗時は枠ごと消える */
import React from "react";

export function EventBanner({ src }: { src: string }) {
  const [ok, setOk] = React.useState(true);
  if (!ok) return null;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setOk(false)}
      style={{
        display: "block",
        width: "calc(100% + 36px)",
        height: 118,
        objectFit: "cover",
        margin: "-18px -18px 14px",
        borderBottom: "var(--bw-line) solid var(--ink-900)",
        borderRadius: "var(--radius-md) var(--radius-md) 0 0",
        background: "var(--paper-100)",
      }}
    />
  );
}
