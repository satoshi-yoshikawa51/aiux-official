/* ============================================================
   ページ内に4コマを1本出す共通部品（サーバーコンポーネント）。
   registry.ts が返したsrcをそのまま渡す。
   ============================================================ */

export function YonkomaStrip({ src, alt }: { src: string; alt: string }) {
  return (
    <figure style={{ margin: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {/* 絵の中にコマ枠が描かれているので、ページ側では枠も影も付けない */}
      <img
        src={src}
        alt={alt}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
      <figcaption
        style={{
          fontFamily: "var(--font-hand)",
          fontSize: 12.5,
          color: "var(--text-muted)",
          textAlign: "right",
          marginTop: 8,
        }}
      >
        マンガ：吉川聡史（<a href="/yonkoma" style={{ color: "inherit" }}>ほかの4コマも見る</a>）
      </figcaption>
    </figure>
  );
}
