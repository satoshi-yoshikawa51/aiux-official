"use client";
/* ============================================================
   用語集のインクリメンタル検索＋カテゴリ絞り込み。
   全用語データを受け取り、クライアント側だけで絞り込む
   （静的サイトのままでOK、サーバー不要）。
   ============================================================ */
import React from "react";
import { Card } from "../ds";
import type { TermCategory } from "./data";

export interface BrowserTerm {
  slug: string;
  term: string;
  yomi: string;
  en?: string;
  category: TermCategory;
  short: string;
}

/* カタカナ→ひらがな・全角英数→半角・小文字化して検索用に正規化 */
function norm(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

const CATS: ("すべて" | TermCategory)[] = ["すべて", "基礎知識", "しくみ・技術", "開発・活用"];

export function GlossaryBrowser({ terms }: { terms: BrowserTerm[] }) {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<(typeof CATS)[number]>("すべて");

  const nq = norm(q.trim());
  const hits = terms.filter((t) => {
    if (cat !== "すべて" && t.category !== cat) return false;
    if (!nq) return true;
    return norm(`${t.term} ${t.yomi} ${t.en ?? ""} ${t.short}`).includes(nq);
  });

  return (
    <div>
      {/* 検索ボックス */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--paper-0)",
          border: "var(--bw-bold) solid var(--ink-900)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-pop-sm)",
          padding: "2px 16px",
          maxWidth: 560,
        }}
      >
        <i className="ph-bold ph-magnifying-glass" style={{ fontSize: 18, color: "var(--red-500)", flex: "none" }} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="用語をさがす（例：らぐ、token、幻覚…）"
          aria-label="用語を検索"
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: 15.5,
            color: "var(--text-strong)",
            padding: "13px 0",
          }}
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="検索をクリア"
            style={{ border: 0, background: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, padding: 4 }}
          >
            <i className="ph-bold ph-x" />
          </button>
        )}
      </div>

      {/* カテゴリタブ */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0 6px" }}>
        {CATS.map((c) => {
          const on = c === cat;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 13.5,
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                border: "var(--bw-line) solid var(--ink-900)",
                background: on ? "var(--ink-900)" : "var(--paper-0)",
                color: on ? "var(--paper-50)" : "var(--ink-900)",
                cursor: "pointer",
                boxShadow: on ? "none" : "var(--shadow-pop-sm)",
              }}
            >
              {c}
            </button>
          );
        })}
        <span style={{ alignSelf: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>
          {hits.length}語
        </span>
      </div>

      {/* 結果 */}
      {hits.length === 0 ? (
        <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--text-muted)", padding: "26px 4px" }}>
          「{q}」に当てはまる用語はまだありません。リクエストは X などで気軽にどうぞ！
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 14 }} className="articles-grid">
          {hits.map((t) => (
            <a key={t.slug} href={`/glossary/${t.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card variant="pop" hover padding={16} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 3px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16, lineHeight: 1.4 }}>{t.term}</h3>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", marginBottom: 7 }}>
                  {t.yomi}
                  {t.en ? ` / ${t.en}` : ""}
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 12.5, lineHeight: 1.75, color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {t.short}
                </p>
                <span style={{ marginTop: "auto", alignSelf: "flex-end", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12.5, color: "var(--red-600)" }}>
                  くわしく見る <i className="ph-bold ph-arrow-right" />
                </span>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
