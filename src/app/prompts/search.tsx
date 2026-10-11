"use client";
/* ============================================================
   プロンプト集のインクリメンタル検索。
   入力が空のあいだは children（サーバーレンダリングされた
   カテゴリ別の一覧）をそのまま表示し、入力した瞬間だけ
   絞り込み結果のグリッドに切り替える。
   帯デザインを保ったまま検索を足すためのハイブリッド構成。
   ============================================================ */
import React from "react";
import { Card } from "../ds";

export interface SearchRecipe {
  slug: string;
  title: string;
  catch: string;
  category: string;
  icon: string;
  short: string;
  keywords: string[];
}

/* カタカナ→ひらがな・全角英数→半角・小文字化（glossary/browser.tsxと同じ流儀） */
function norm(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export function PromptSearch({ recipes, children }: { recipes: SearchRecipe[]; children: React.ReactNode }) {
  const [q, setQ] = React.useState("");
  const nq = norm(q.trim());
  const hits = nq
    ? recipes.filter((r) => norm(`${r.title} ${r.catch} ${r.short} ${r.category} ${r.keywords.join(" ")}`).includes(nq))
    : recipes;

  return (
    <>
      <div style={{ maxWidth: 680, margin: "26px auto 0", padding: "0 0 4px" }}>
        <div style={{ position: "relative" }}>
          <i className="ph-bold ph-magnifying-glass" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "var(--text-muted)" }} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="やりたいことで検索（例：メール、要約、翻訳、アイデア）"
            aria-label="プロンプトレシピを検索"
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: "var(--font-heading)",
              fontSize: 15,
              padding: "13px 16px 13px 44px",
              border: "var(--bw-bold) solid var(--ink-900)",
              borderRadius: "var(--radius-full)",
              background: "var(--paper-0)",
              boxShadow: "var(--shadow-pop-sm)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {nq ? (
        <section style={{ maxWidth: "min(1080px, 92vw)", margin: "0 auto", padding: "34px 0 54px" }}>
          <p style={{ margin: "0 0 18px", fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>
            「{q.trim()}」の検索結果：{hits.length}レシピ
          </p>
          {hits.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 2, color: "var(--text-body)" }}>
              見つかりませんでした。言い換え（例：「議事録」→「会議」）を試すか、
              <a href="/search" style={{ color: "var(--red-600)", fontWeight: 700 }}>AI司書に聞く</a>
              と、サイト全体から近いものを探してくれます。
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="articles-grid">
              {hits.map((r) => (
                <a key={r.slug} href={`/prompts/${r.slug}`} data-ga="card_click" data-ga-place="prompts-search" data-ga-path={`/prompts/${r.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <Card variant="pop" hover padding={18} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <i className={"ph-bold " + r.icon} style={{ fontSize: 30, lineHeight: 1, marginBottom: 10, display: "block", color: "var(--red-500)" }} />
                    <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, lineHeight: 1.45 }}>{r.title}</h2>
                    <p style={{ margin: "0 0 14px", fontFamily: "var(--font-hand)", fontSize: 13.5, lineHeight: 1.7, color: "var(--text-muted)" }}>{r.catch}</p>
                    <span style={{ marginTop: "auto", alignSelf: "flex-end", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                      レシピを見る <i className="ph-bold ph-arrow-right" />
                    </span>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </section>
      ) : (
        children
      )}
    </>
  );
}
