"use client";
/* ============================================================
   AI司書 — 検索型UI。
   質問1回ごとに: AIの回答カード + 根拠になったページのカード一覧。
   AI要約が取れないとき（キー未設定・エラー）は検索結果のみ表示。
   ============================================================ */
import React from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, Card } from "../ds";

interface ResultItem {
  id: string;
  type: string;
  title: string;
  url: string;
  external: boolean;
  snippet: string;
}

const EXAMPLES = [
  "ハルシネーションって何？",
  "AIに仕事を奪われる？",
  "ChatGPTとClaudeどっちがいい？",
  "RAGとファインチューニングの違いは？",
  "会社でAIを使っていい？",
  "隠し部屋はどこにある？",
];

const TYPE_TONE: Record<string, "red" | "blue" | "yellow" | "ink" | "green" | "soft" | "paper"> = {
  用語: "yellow",
  FAQ: "blue",
  マンガ: "red",
  記事: "soft",
  作品: "ink",
  歴史: "paper",
  ページ: "green",
  ゲーム: "red",
};

export default function SearchClient() {
  const params = useSearchParams();
  const [input, setInput] = React.useState(params.get("q") || "");
  const [query, setQuery] = React.useState(""); // 実行済みの質問
  const [loading, setLoading] = React.useState(false);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<ResultItem[] | null>(null);
  const [error, setError] = React.useState(false);
  const ranFromUrl = React.useRef(false);

  const run = React.useCallback(async (q: string) => {
    const t = q.trim();
    if (!t) return;
    setLoading(true);
    setError(false);
    setQuery(t);
    setAnswer(null);
    setResults(null);
    window.history.replaceState(null, "", `/search?q=${encodeURIComponent(t)}`);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: t }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setAnswer(typeof data.answer === "string" ? data.answer : null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ?q= 付きで来たら自動実行 */
  React.useEffect(() => {
    const q = params.get("q");
    if (q && !ranFromUrl.current) {
      ranFromUrl.current = true;
      setInput(q);
      void run(q);
    }
  }, [params, run]);

  return (
    <div>
      {/* 検索ボックス */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(input);
        }}
        style={{ display: "flex", gap: 10, maxWidth: 640, margin: "0 auto" }}
      >
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="質問や、探している言葉をどうぞ"
          maxLength={200}
          aria-label="サイト内検索"
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: "var(--font-body)",
            fontSize: 16,
            color: "var(--text-strong)",
            background: "var(--paper-0)",
            border: "var(--bw-bold) solid var(--ink-900)",
            borderRadius: "var(--radius-full)",
            padding: "13px 20px",
            boxSizing: "border-box",
            boxShadow: "var(--shadow-pop-sm)",
          }}
        />
        <Button type="submit" variant="primary" size="lg" disabled={loading || !input.trim()} iconRight={<i className="ph-bold ph-magnifying-glass" />}>
          聞く
        </Button>
      </form>

      {/* 例チップ（初期状態のみ） */}
      {!query && !loading && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", margin: "18px auto 0", maxWidth: 640 }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setInput(ex);
                void run(ex);
              }}
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--ink-900)",
                background: "var(--paper-0)",
                border: "1.5px solid var(--ink-900)",
                borderRadius: "var(--radius-full)",
                padding: "7px 14px",
                cursor: "pointer",
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 30 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/search/shisho.webp" alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--ink-900)", background: "var(--paper-0)" }} />
          <span style={{ fontFamily: "var(--font-hand)", fontSize: 15, color: "var(--text-muted)" }}>書庫を探しています…</span>
        </div>
      )}

      {/* エラー */}
      {error && !loading && (
        <p style={{ marginTop: 30, fontSize: 14, color: "var(--red-600)", fontWeight: 700, textAlign: "center" }}>
          <i className="ph-bold ph-warning" /> 検索に失敗しました。少し待ってからもう一度お試しください。
        </p>
      )}

      {/* AI回答 */}
      {!loading && !error && query && results && (
        <div style={{ margin: "30px auto 0", maxWidth: 720 }}>
          {answer ? (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/search/shisho.webp" alt="AI司書" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--ink-900)", background: "var(--paper-0)", flex: "none", marginTop: 2 }} />
              <Card variant="pop" padding={18} style={{ background: "var(--yellow-400)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>
                  AI司書の答え
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 2, color: "var(--ink-900)", fontWeight: 500 }}>{answer}</p>
                <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "rgba(20,17,15,0.65)" }}>
                  ※ AIによる要約です。番号は下の資料に対応しています。
                </p>
              </Card>
            </div>
          ) : (
            results.length > 0 && (
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>
                「{query}」に関係しそうなページはこちらです。（AIの要約はただいまお休み中）
              </p>
            )
          )}

          {/* 結果カード */}
          {results.length === 0 ? (
            <Card variant="flat" padding={20} style={{ marginTop: 18 }}>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 2 }}>
                「{query}」に合うページが見つかりませんでした。言い換えて聞いてみるか、
                <a href="/glossary" style={{ color: "var(--red-600)", fontWeight: 700 }}>用語集</a>や
                <a href="/faq" style={{ color: "var(--red-600)", fontWeight: 700 }}>よくある質問</a>ものぞいてみてください。
              </p>
            </Card>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              {results.map((r, i) => (
                <a key={r.id} href={r.url} target={r.external ? "_blank" : undefined} rel={r.external ? "noopener noreferrer" : undefined} style={{ textDecoration: "none", color: "inherit" }}>
                  <Card variant="flat" hover padding={16} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--red-600)", flex: "none", marginTop: 2 }}>
                      【{i + 1}】
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Badge tone={TYPE_TONE[r.type] || "ink"} style={{ fontSize: 10.5 }}>{r.type}</Badge>
                        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15 }}>
                          {r.title}
                          {r.external && <i className="ph-bold ph-arrow-up-right" style={{ fontSize: 12, marginLeft: 4, color: "var(--text-muted)" }} />}
                        </span>
                      </span>
                      <span style={{ display: "block", fontSize: 13, lineHeight: 1.8, color: "var(--text-muted)", marginTop: 4 }}>{r.snippet}</span>
                    </span>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
