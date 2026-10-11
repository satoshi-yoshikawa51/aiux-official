"use client";
/* ============================================================
   プロンプト集のインクリメンタル検索＋カテゴリ絞り込み。
   glossary/browser.tsx を完全踏襲（吸着バー・タブ・正規化・
   モバイルではタブが横スクロール1行）。CSSも .glossary-filterbar /
   .glossary-cats をそのまま共用する。
   ============================================================ */
import React from "react";
import { Card } from "../ds";
import type { RecipeCategory } from "./data";

export interface BrowserRecipe {
  slug: string;
  title: string;
  catch: string;
  category: RecipeCategory;
  icon: string;
  short: string;
  keywords: string[];
}

/* カタカナ→ひらがな・全角英数→半角・小文字化して検索用に正規化 */
function norm(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

const CATS: ("すべて" | RecipeCategory)[] = [
  "すべて",
  "メール・ビジネス文書",
  "会議・報告",
  "企画・マーケティング",
  "営業・顧客対応",
  "事務・効率化",
  "伝える・キャリア",
];

export function PromptBrowser({ recipes }: { recipes: BrowserRecipe[] }) {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<(typeof CATS)[number]>("すべて");
  /* 検索バーがヘッダー下に吸着中かどうか（吸着中だけ影を出す） */
  const [stuck, setStuck] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), {
      rootMargin: "-67px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* 一覧の深い位置で絞り込むと結果がずっと上に行ってしまうので、
     バー吸着中に条件が変わったら結果の先頭まで戻す */
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 66) window.scrollTo({ top: window.scrollY + top - 66 });
  }, [q, cat]);

  const nq = norm(q.trim());
  const hits = recipes.filter((r) => {
    if (cat !== "すべて" && r.category !== cat) return false;
    if (!nq) return true;
    return norm(`${r.title} ${r.catch} ${r.short} ${r.category} ${r.keywords.join(" ")}`).includes(nq);
  });

  return (
    <div>
      {/* 吸着判定用の番兵（高さ0） */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* 検索ボックス＋カテゴリタブ（用語集と同じ吸着バー） */}
      <div
        className="glossary-filterbar"
        style={{
          position: "sticky",
          top: 66,
          zIndex: 40,
          background: "var(--paper-50)",
          paddingTop: 12,
          paddingBottom: 10,
          boxShadow: stuck ? "0 12px 14px -12px rgba(26, 26, 26, 0.4)" : "none",
          transition: "box-shadow 0.25s ease",
        }}
      >
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
            placeholder="レシピをさがす（例：めーる、要約、アイデア…）"
            aria-label="プロンプトレシピを検索"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-body)",
              fontSize: 16, // 16px未満だとiOSがフォーカス時に自動ズームしてしまう
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

        {/* カテゴリタブ（モバイルでは横スクロール1行に収める） */}
        <div className="glossary-cats" style={{ marginTop: 12 }}>
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
                  whiteSpace: "nowrap",
                  flex: "none",
                }}
              >
                {c}
              </button>
            );
          })}
          <span style={{ alignSelf: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginLeft: 4, whiteSpace: "nowrap", flex: "none" }}>
            {hits.length}レシピ
          </span>
        </div>
      </div>
      {/* /sticky */}

      {/* 結果 */}
      {hits.length === 0 ? (
        <p style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "var(--text-muted)", padding: "26px 4px" }}>
          「{q}」に当てはまるレシピはまだありません。
          <a href="/search" style={{ color: "var(--red-600)", fontWeight: 700 }}>AI司書に聞く</a>
          と、サイト全体から近いものを探してくれます。リクエストも X などで気軽にどうぞ！
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 14 }} className="articles-grid">
          {hits.map((r) => (
            <a key={r.slug} href={`/prompts/${r.slug}`} data-ga="card_click" data-ga-place="prompts-browser" data-ga-path={`/prompts/${r.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card variant="pop" hover padding={16} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <i className={"ph-bold " + r.icon} style={{ fontSize: 28, lineHeight: 1, marginBottom: 10, display: "block", color: "var(--red-500)" }} />
                <h3 style={{ margin: "0 0 3px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16, lineHeight: 1.4 }}>{r.title}</h3>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", marginBottom: 7 }}>{r.category}</div>
                <p style={{ margin: "0 0 12px", fontFamily: "var(--font-hand)", fontSize: 13.5, lineHeight: 1.7, color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.catch}
                </p>
                <span style={{ marginTop: "auto", alignSelf: "flex-end", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12.5, color: "var(--red-600)" }}>
                  レシピを見る <i className="ph-bold ph-arrow-right" />
                </span>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
