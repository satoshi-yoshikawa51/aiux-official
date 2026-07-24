"use client";
/* ニュースのサムネイル（OGP画像）。外部CDNの画像なので、
   読み込みに失敗したら枠ごと消してテキストだけの行に戻す */
import React from "react";

export function NewsThumb({ src }: { src: string }) {
  const [ok, setOk] = React.useState(true);
  if (!ok) return null;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setOk(false)}
      className="news-thumb"
      style={{
        flex: "none",
        width: 104,
        height: 64,
        objectFit: "cover",
        borderRadius: 8,
        border: "var(--bw-line) solid var(--ink-900)",
        background: "var(--paper-100)",
        alignSelf: "center",
      }}
    />
  );
}
