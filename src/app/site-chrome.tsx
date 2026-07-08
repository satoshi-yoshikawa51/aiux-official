"use client";
/* ============================================================
   サイト共通のヘッダー(Nav)とフッター(Footer)。
   トップページ(page.tsx)とプロフィールページ(profile/page.tsx)で
   同じコンポーネントを再利用し、見た目を完全一致させる。
   ============================================================ */
import React from "react";
import { Button } from "./ds";
import { SOCIALS } from "./data";

export const PAGE = "min(1080px, 92vw)";

/* ═══════════════ Nav ═══════════════ */
/* home=true: トップページ内アンカー(#articles 等)
   home=false: サブページからトップへのリンク(/#articles 等) */
export function Nav({ home = true }: { home?: boolean }) {
  const items = [
    { label: "記事", href: "#articles" },
    { label: "マガジン", href: "#magazines" },
    { label: "WORKS", href: "#works" },
    { label: "用語集", href: "/glossary" },
    { label: "絵巻", href: "/history" },
    { label: "プロフィール", href: "/profile" },
    { label: "SNS", href: "#social" },
  ];
  /* #アンカーはトップページ内リンク、/パスはどのページからも共通 */
  const link = (href: string) => (href.startsWith("#") ? (home ? href : "/" + href) : href);
  const [open, setOpen] = React.useState(false);
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "rgba(251,247,239,0.86)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "var(--bw-line) solid var(--ink-900)",
      }}
    >
      <div style={{ maxWidth: PAGE, margin: "0 auto", height: 66, display: "flex", alignItems: "center", gap: 24 }}>
        <a href={home ? "#top" : "/"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 26,
              lineHeight: 1,
              letterSpacing: "0.01em",
              color: "var(--ink-900)",
              whiteSpace: "nowrap",
              flex: "none",
            }}
          >
            CO<span style={{ color: "var(--red-500)" }}>MIX</span>AI
          </span>
          <span style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)", whiteSpace: "nowrap", flex: "none" }}>
            吉川 聡史
          </span>
        </a>
        <nav className="nav-links">
          {items.map((it) => (
            <a
              key={it.href}
              href={link(it.href)}
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--text-strong)",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 8,
              }}
              className="nav-link"
            >
              {it.label}
            </a>
          ))}
          <a href={link("#contact")} style={{ textDecoration: "none", marginLeft: 6 }}>
            <Button variant="primary" size="sm">
              お問い合わせ
            </Button>
          </a>
        </nav>
        <button
          type="button"
          className="hamburger"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          style={{
            marginLeft: "auto",
            background: "none",
            border: 0,
            padding: "6px 8px",
            cursor: "pointer",
            color: "var(--ink-900)",
            fontSize: 30,
            lineHeight: 1,
          }}
        >
          <i className={"ph-bold " + (open ? "ph-x" : "ph-list")} />
        </button>
      </div>
      {open && (
        <nav className="mobile-menu" style={{ borderTop: "var(--bw-line) solid var(--ink-900)", background: "rgba(251,247,239,0.98)", display: "flex", flexDirection: "column" }}>
          {items.map((it) => (
            <a
              key={it.href}
              href={link(it.href)}
              onClick={() => setOpen(false)}
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--ink-900)",
                textDecoration: "none",
                width: PAGE,
                margin: "0 auto",
                padding: "14px 0",
                borderBottom: "1px solid rgba(20,17,15,0.08)",
              }}
            >
              {it.label}
            </a>
          ))}
          <a
            href={link("#contact")}
            onClick={() => setOpen(false)}
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 16,
              color: "#fff",
              background: "var(--red-500)",
              textDecoration: "none",
              textAlign: "center",
              padding: "15px 0",
            }}
          >
            お問い合わせ
          </a>
        </nav>
      )}
    </header>
  );
}

/* ═══════════════ フッター ═══════════════ */
export function Footer() {
  return (
    <footer style={{ background: "var(--ink-900)", color: "var(--paper-200)", borderTop: "var(--bw-heavy) solid var(--ink-900)" }}>
      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "40px 0 34px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 24, color: "var(--paper-50)" }}>
            CO<span style={{ color: "var(--red-500)" }}>MIX</span>AI{" "}
            <span style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--paper-200)" }}>吉川 聡史</span>
          </div>
          <div style={{ fontFamily: "var(--font-hand)", fontSize: 14, marginTop: 6 }}>AIを、面白く。わかりやすく。</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {SOCIALS.filter((s) => s.set).map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--radius-full)",
                border: "var(--bw-line) solid var(--paper-200)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--paper-50)",
                textDecoration: "none",
              }}
            >
              <i className={"ph-bold " + s.icon} style={{ fontSize: 18 }} />
            </a>
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(244,236,221,0.16)" }}>
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-300)" }}>
            © {new Date().getFullYear()} 吉川 聡史 / COMIXAI
          </div>
          {/* あそんだ記録の入り口。隠し部屋の場所は明かさず、静かに置いておく */}
          <a href="/zukan" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-300)", textDecoration: "none" }} className="nav-link">
            🐾 COMIXAI図鑑 — あそんだ記録
          </a>
        </div>
      </div>
    </footer>
  );
}
