/* ============================================================
   /manga 配下で共有する表示部品（サーバーコンポーネント）。
   汎用部品は site-ui.tsx にあり、ここから再エクスポートする。
   ============================================================ */
import { Badge, Card } from "../ds";
import { toneBg } from "../site-ui";
import type { MangaSeries } from "./data";

export { toneBg, Breadcrumb, SectionHead, RelatedArticleCard } from "../site-ui";

/* —— シリーズ紹介カード（/manga 一覧・「ほかのシリーズ」で使用） —— */
export function SeriesCard({ series }: { series: MangaSeries }) {
  return (
    <Card variant="pop" hover padding={0} style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      <a href={`/manga/${series.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ position: "relative", aspectRatio: "900/300", borderBottom: "var(--bw-bold) solid var(--ink-900)", overflow: "hidden", background: toneBg(series.tone) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={series.cover} alt={series.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <span style={{ position: "absolute", top: 10, left: 10 }}>
            <Badge tone="red">{series.label}</Badge>
          </span>
        </div>
        <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
          <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 19, lineHeight: 1.4, textWrap: "pretty" }}>{series.title}</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13.5, lineHeight: 1.8, color: "var(--text-muted)" }}>{series.intro[0]}</p>
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
              シリーズ紹介を見る <i className="ph-bold ph-arrow-right" />
            </span>
          </div>
        </div>
      </a>
    </Card>
  );
}
