/* ============================================================
   ページ内に4コマを1本出す共通部品（サーバーコンポーネント）。
   registry.ts が返したsrcをそのまま渡す。
   ============================================================ */

export function YonkomaStrip({ src, alt }: { src: string; alt: string }) {
  return (
    <figure style={{ margin: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          border: "var(--bw-heavy) solid var(--ink-900)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-pop)",
          background: "var(--paper-0)",
        }}
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
