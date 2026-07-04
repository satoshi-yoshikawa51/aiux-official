/* ============================================================
   サブページ（/manga, /works 配下）で共有する表示部品。
   デザインはトップページ(page.tsx)のトーンをそのまま踏襲する。
   ============================================================ */
import { Badge, Card } from "./ds";
import { PAGE } from "./site-chrome";
import type { Tone, Article } from "./data";

export const toneBg = (tone: Tone): string =>
  ({
    yellow: "var(--yellow-400)",
    red: "var(--red-500)",
    ink: "var(--ink-900)",
    blue: "var(--blue-500)",
    paper: "var(--paper-100)",
  }[tone] || "var(--paper-100)");

/* —— パンくず。表示とJSON-LD(BreadcrumbList)の内容を一致させる —— */
export function Breadcrumb({ trail }: { trail: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="パンくず" style={{ maxWidth: PAGE, margin: "0 auto", padding: "16px 0 0" }}>
      <ol style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, listStyle: "none", margin: 0, padding: 0, fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--text-muted)" }}>
        {trail.map((t, i) => (
          <li key={t.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <i className="ph-bold ph-caret-right" style={{ fontSize: 11 }} />}
            {t.href ? (
              <a href={t.href} style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                {t.name}
              </a>
            ) : (
              <span style={{ color: "var(--text-strong)", fontWeight: 700 }}>{t.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHead({ kicker, title, hand }: { kicker: string; title: string; hand?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>
        {kicker}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(24px,3.2vw,34px)", margin: 0, lineHeight: 1.25 }}>{title}</h2>
        {hand && <span style={{ fontFamily: "var(--font-hand)", color: "var(--text-muted)", fontSize: 16 }}>{hand}</span>}
      </div>
    </div>
  );
}

/* —— あわせて読みたい note 記事カード —— */
export function RelatedArticleCard({ a }: { a: Article }) {
  return (
    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
      <Card variant="pop" hover padding={0} style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", aspectRatio: "800/419", borderBottom: "var(--bw-bold) solid var(--ink-900)", overflow: "hidden", background: toneBg(a.tone) }}>
          {a.thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.thumb} alt={a.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
          <span style={{ position: "absolute", top: 10, left: 10 }}>
            <Badge tone="ink">{a.badge}</Badge>
          </span>
        </div>
        <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
          <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15.5, lineHeight: 1.5, textWrap: "pretty" }}>{a.title}</h3>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
              <i className="ph-bold ph-heart" style={{ color: "var(--red-500)" }} /> {a.likes}
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
              noteで読む <i className="ph-bold ph-arrow-up-right" />
            </span>
          </div>
        </div>
      </Card>
    </a>
  );
}
