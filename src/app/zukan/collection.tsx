"use client";
/* ============================================================
   COMIXAI図鑑の表示本体。localStorageの進捗を読み、
   解除済み／シルエット（❓＋ヒント）で一覧表示する。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { ZUKAN_SECTIONS, ZUKAN_TOTAL } from "./data";
import { isUnlocked, loadZukan, resetZukan, type ZukanData } from "./store";

export function ZukanCollection() {
  const [data, setData] = React.useState<ZukanData | null>(null); // null = 読み込み前（SSR一致用）

  React.useEffect(() => {
    setData(loadZukan());
    const onUnlock = () => setData(loadZukan());
    window.addEventListener("zukan-unlock", onUnlock);
    return () => window.removeEventListener("zukan-unlock", onUnlock);
  }, []);

  const d = data ?? {};
  const count = ZUKAN_SECTIONS.reduce((n, s) => n + s.items.filter((i) => isUnlocked(d, i.category, i.id)).length, 0);
  const pct = Math.round((count / ZUKAN_TOTAL) * 100);
  const complete = count === ZUKAN_TOTAL;

  const shareText = complete
    ? `COMIXAI図鑑、全${ZUKAN_TOTAL}項目コンプリートして【COMIXAI皆伝】🏅の称号をもらった。\n隠し部屋18こ、全部見つけられる？\n#今さら聞けないAI用語集`
    : `COMIXAI図鑑、いま${count}/${ZUKAN_TOTAL}項目（${pct}%）。隠し部屋、あと何個あるんだ…\n#今さら聞けないAI用語集`;
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/zukan")}`;

  return (
    <div>
      {/* 進捗サマリー */}
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "24px 26px 20px", textAlign: "center", background: complete ? "var(--yellow-400)" : "var(--paper-0)", borderBottom: "var(--bw-line) solid var(--ink-900)" }}>
          {complete ? (
            <>
              <div style={{ fontSize: 46, lineHeight: 1 }}>🏅</div>
              <h2 style={{ margin: "8px 0 4px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(24px,4vw,32px)" }}>称号「COMIXAI皆伝」</h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-body)" }}>全{ZUKAN_TOTAL}項目コンプリート。あなたはこのサイトの全てを見た…！</p>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 6 }}>
                COLLECTION — あなたの図鑑
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 42, lineHeight: 1.2 }}>
                {data === null ? "…" : count}
                <span style={{ fontSize: 20, color: "var(--text-muted)" }}> / {ZUKAN_TOTAL}</span>
              </div>
              <div style={{ maxWidth: 380, margin: "10px auto 0", height: 14, border: "2px solid var(--ink-900)", borderRadius: 999, overflow: "hidden", background: "var(--paper-50)" }}>
                <div className="tok-gauge-fill" style={{ width: `${pct}%`, height: "100%", background: "var(--yellow-400)" }} />
              </div>
              <p style={{ margin: "10px 0 0", fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>
                {count === 0 ? "まだ白紙。まずは用語集のどこかにある「扉」を探そう" : `コンプまであと${ZUKAN_TOTAL - count}個`}
              </p>
            </>
          )}
        </div>
        <div style={{ padding: "12px 16px", textAlign: "center", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} data-ga="share_click" data-ga-network="x" data-ga-place="result" data-ga-path="/zukan">
            <Button variant="ink" size="sm" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
              進捗をXでシェア
            </Button>
          </a>
          <a href="/glossary" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="sm" iconRight={<i className="ph-bold ph-arrow-right" />}>
              扉をさがしに行く
            </Button>
          </a>
        </div>
      </Card>

      {/* セクション別 */}
      {ZUKAN_SECTIONS.map((sec) => {
        const got = sec.items.filter((i) => isUnlocked(d, i.category, i.id)).length;
        return (
          <div key={sec.category} style={{ marginTop: 30 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 18 }}>{sec.title}</h2>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: got === sec.items.length ? "var(--red-600)" : "var(--text-muted)" }}>
                {got}/{sec.items.length}
                {got === sec.items.length && " ✔"}
              </span>
            </div>
            <p style={{ margin: "0 0 12px", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--text-muted)" }}>{sec.sub}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {sec.items.map((item) => {
                const on = isUnlocked(d, item.category, item.id);
                return (
                  <div
                    key={`${item.category}-${item.id}`}
                    style={{
                      border: "var(--bw-line) solid var(--ink-900)",
                      borderRadius: "var(--radius-md)",
                      background: on ? "var(--paper-0)" : "var(--paper-100)",
                      boxShadow: on ? "var(--shadow-pop-sm)" : "none",
                      padding: "14px 12px",
                      textAlign: "center",
                      opacity: on ? 1 : 0.75,
                    }}
                  >
                    <div style={{ fontSize: 30, lineHeight: 1, filter: on ? "none" : "grayscale(1)" }}>{on ? item.emoji : "❓"}</div>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>
                      {on ? item.name : "？？？"}
                    </div>
                    {!on && (
                      <div style={{ fontFamily: "var(--font-hand)", fontSize: 11.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.6 }}>{item.hint}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 注記と白紙化 */}
      <div style={{ marginTop: 34, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.9 }}>
          図鑑はこのブラウザの中にだけ記録されます（サーバーには何も送信されません）。
          <br />
          端末やブラウザを変えると、図鑑は白紙から始まります。
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("図鑑を白紙に戻します。いいですか？")) {
              resetZukan();
              setData({});
            }
          }}
          style={{ border: 0, background: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", textDecoration: "underline" }}
        >
          図鑑を白紙に戻す
        </button>
      </div>
    </div>
  );
}

/* ゲームの結果画面に置く「図鑑に記録した」ノート */
export function ZukanNote() {
  return (
    <p style={{ margin: "14px 0 0", textAlign: "center", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--text-muted)" }}>
      📖 図鑑に記録しました —{" "}
      <a href="/zukan" style={{ color: "var(--red-600)", fontWeight: 700 }}>
        コレクションを見る
      </a>
    </p>
  );
}
