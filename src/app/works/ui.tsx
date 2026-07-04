/* ============================================================
   /works 配下で共有する表示部品。
   汎用部品は site-ui.tsx にあり、ここから再エクスポートする。
   ============================================================ */
import { Badge, Card } from "../ds";
import { toneBg } from "../site-ui";
import type { WorkDetail } from "./data";

export { toneBg, Breadcrumb, SectionHead, RelatedArticleCard } from "../site-ui";

/* —— 作品紹介カード（/works 一覧・「ほかの作品」で使用） —— */
export function WorkCard({ work }: { work: WorkDetail }) {
  return (
    <Card variant="pop" hover padding={0} style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      <a href={`/works/${work.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ position: "relative", height: 150, background: toneBg(work.tone), borderBottom: "var(--bw-bold) solid var(--ink-900)", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={work.image}
            alt={work.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: work.imageFit || "cover", objectPosition: "center", padding: work.imageFit === "contain" ? 20 : 0, display: "block" }}
          />
          {work.badge && (
            <span style={{ position: "absolute", top: 0, left: 0 }}>
              <Badge tone="ink" style={{ borderRadius: "0 0 var(--radius-sm) 0", fontSize: 11 }}>
                {work.badge}
              </Badge>
            </span>
          )}
        </div>
        <div style={{ padding: "16px 16px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
          <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16.5, lineHeight: 1.4, textWrap: "pretty" }}>{work.title}</h3>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: "var(--text-muted)" }}>{work.tagline}</p>
        </div>
      </a>
      <div style={{ padding: "0 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <a href={`/works/${work.slug}`} style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
          くわしく見る <i className="ph-bold ph-arrow-right" />
        </a>
        <a
          href={work.appUrl}
          {...(work.appUrl.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-muted)" }}
        >
          {work.cta} <i className="ph-bold ph-arrow-up-right" />
        </a>
      </div>
    </Card>
  );
}
