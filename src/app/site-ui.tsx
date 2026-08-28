/* ============================================================
   サブページ（/manga, /works 配下）で共有する表示部品。
   デザインはトップページ(page.tsx)のトーンをそのまま踏襲する。
   ============================================================ */
import type React from "react";
import { Badge, Button, Card } from "./ds";
import { PAGE } from "./site-chrome";
import { APP_STORE_URL, AppStoreBadge } from "./academy/store";
import type { Tone, Article } from "./data";

/* ============================================================
   ▍アプリへの導線を、記事の中にも置く

   検索から「AIを学びたい人」が入ってくるのは、用語集・ガイド・
   プロンプト集。ところがアプリへの導線はトップの帯とフッターの
   2箇所しかなく、**すでに来ている人に見せていなかった**。
   広告でお金を払って連れてくる前に、ここを繋ぐ。

   `place` はGAの印。「どのページの導線が効いたか」を見るために、
   置く場所ごとに違う名前を渡すこと（例: glossary-side）。
   ============================================================ */
export function AcademyCard({ place, wide = false }: { place: string; wide?: boolean }) {
  return (
    <div
      style={{
        border: "var(--bw-bold) solid var(--ink-900)",
        borderRadius: "var(--radius-lg)",
        background: "var(--ink-900)",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1.2px, transparent 1.3px)",
        backgroundSize: "13px 13px",
        boxShadow: "var(--shadow-pop-sm)",
        padding: wide ? "20px 22px" : "16px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <a href="/academy" data-ga="cta_click" data-ga-place={place} data-ga-path="/academy" style={{ display: "block", textDecoration: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/academy/logo.webp"
          alt="COMIXAI アカデミー"
          width={1120}
          height={403}
          loading="lazy"
          style={{ width: "100%", maxWidth: wide ? 250 : 190, height: "auto", display: "block" }}
        />
      </a>
      <p style={{ margin: 0, fontSize: wide ? 14 : 13, lineHeight: 1.9, color: "var(--paper-200)" }}>
        3Dの相棒と、遊びながら学べるスマホアプリ。
        <b style={{ color: "var(--paper-50)" }}>登録不要・広告なし・完全無料</b>で、1日5分から。
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <a href="/academy" data-ga="cta_click" data-ga-place={place} data-ga-path="/academy" style={{ textDecoration: "none" }}>
          <Button variant="yellow" size="sm" iconRight={<i className="ph-bold ph-arrow-right" />}>
            アプリを見る
          </Button>
        </a>
        {/* 幅のある置き場所でだけ、ストアへの直行も出す。狭い所で
            並べるとバッジが縮んで、Appleの決まり（高さ40px以上）を割る */}
        {wide && APP_STORE_URL ? (
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" data-ga="academy_install" data-ga-place={place} style={{ textDecoration: "none" }}>
            <AppStoreBadge height={42} />
          </a>
        ) : null}
      </div>
    </div>
  );
}

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

export function SectionHead({ kicker, title, hand }: { kicker: React.ReactNode; title: string; hand?: string }) {
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

/* —— サムネイル＋概要つきの横型リンクカード
      （用語集の「もっと深く」等。マガジンの収録エピソードと同デザイン） —— */
export function MediaLinkCard({
  href, title, desc, thumb, badge, tone = "paper", likes, external, place = "media-link",
}: {
  href: string; title: string; desc?: string; thumb?: string;
  badge?: string; tone?: Tone; likes?: number; external: boolean; place?: string;
}) {
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} data-ga="card_click" data-ga-place={place} data-ga-path={href} style={{ textDecoration: "none", color: "inherit" }}>
      <Card variant="pop" hover padding={0} style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {thumb && (
            <div style={{ flex: "0 1 220px", minWidth: 180, background: toneBg(tone) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt={title} loading="lazy" style={{ width: "100%", height: "100%", minHeight: 110, objectFit: "cover", display: "block" }} />
            </div>
          )}
          <div style={{ flex: "1 1 260px", padding: "14px 16px", display: "flex", flexDirection: "column", borderLeft: thumb ? "var(--bw-line) solid var(--ink-900)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              {badge && <Badge tone={tone === "paper" ? "ink" : tone === "ink" ? "ink" : tone}>{badge}</Badge>}
              {likes != null && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                  <i className="ph-bold ph-heart" style={{ color: "var(--red-500)" }} /> {likes}
                </span>
              )}
            </div>
            <h3 style={{ margin: "0 0 5px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15.5, lineHeight: 1.5, textWrap: "pretty" }}>{title}</h3>
            {desc && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: "var(--text-muted)" }}>{desc}</p>}
            <span style={{ marginTop: "auto", paddingTop: 8, alignSelf: "flex-end", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
              {external ? (
                <>noteで読む <i className="ph-bold ph-arrow-up-right" /></>
              ) : (
                <>くわしく見る <i className="ph-bold ph-arrow-right" /></>
              )}
            </span>
          </div>
        </div>
      </Card>
    </a>
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

/* —— シェア導線（X・はてなブックマーク）。
   サーバーコンポーネントのままで動く素のリンク。
   path は先頭スラッシュ付きのサイト内パス —— */
/* label: 誘い文句。記事は「役に立ったら」で合うが、ゲームやマンガは
   「面白かったら」のほうが実態に近いので差し替えられるようにしている */
export function ShareRow({
  path,
  text,
  label = "役に立ったらシェア→",
}: {
  path: string;
  text: string;
  label?: string;
}) {
  const url = `https://comixai.dev${path}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} | COMIXAI`)}&url=${encodeURIComponent(url)}`;
  const hbHref = `https://b.hatena.ne.jp/entry/panel/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
  const btn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    fontSize: 12.5,
    textDecoration: "none",
    border: "var(--bw-line) solid var(--ink-900)",
    borderRadius: "var(--radius-full)",
    padding: "7px 14px",
    background: "var(--paper-0)",
    color: "var(--ink-900)",
    boxShadow: "var(--shadow-pop-sm)",
    whiteSpace: "nowrap",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)", marginRight: 2 }}>{label}</span>
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        style={btn}
        aria-label="Xでシェア"
        data-ga="share_click"
        data-ga-network="x"
        data-ga-path={path}
      >
        <span style={{ fontWeight: 900 }}>𝕏</span> ポスト
      </a>
      <a
        href={hbHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btn, color: "#00A4DE" }}
        aria-label="はてなブックマークに追加"
        data-ga="share_click"
        data-ga-network="hatena"
        data-ga-path={path}
      >
        <span style={{ fontWeight: 900 }}>B!</span> ブックマーク
      </a>
    </div>
  );
}
