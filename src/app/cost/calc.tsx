"use client";
/* ============================================================
   AI API料金計算機の本体。使い方・単価はdata.tsを参照。
   トークン数・回数・為替を入れると、全モデルの月額を並べ替えて出す。
   ============================================================ */
import React from "react";
import { COST_MODELS, COST_UPDATED } from "./data";

function Field({ label, suffix, value, onChange, step = 1, hint }: { label: string; suffix: string; value: number; onChange: (n: number) => void; step?: number; hint?: string }) {
  return (
    <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper-0)", border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-pop-sm)", padding: "2px 14px" }}>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, minWidth: 0, width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text-strong)", padding: "11px 0" }}
        />
        <span style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)", flex: "none" }}>{suffix}</span>
      </span>
      {hint && <span style={{ fontFamily: "var(--font-hand)", fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
    </label>
  );
}

export function CostCalculator() {
  const [inTok, setInTok] = React.useState(2000);
  const [outTok, setOutTok] = React.useState(800);
  const [calls, setCalls] = React.useState(1000);
  const [rate, setRate] = React.useState(150);

  const rows = COST_MODELS.map((m) => {
    const perCall = (inTok / 1_000_000) * m.inputPerM + (outTok / 1_000_000) * m.outputPerM;
    const monthlyUsd = perCall * calls;
    return { ...m, perCall, monthlyUsd, monthlyJpy: monthlyUsd * rate };
  }).sort((a, b) => a.monthlyUsd - b.monthlyUsd);

  const fmtUsd = (n: number) => (n >= 100 ? `$${Math.round(n).toLocaleString("ja-JP")}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`);
  const fmtJpy = (n: number) => `${Math.round(n).toLocaleString("ja-JP")}円`;

  const thStyle: React.CSSProperties = { fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 13, padding: "11px 12px", borderBottom: "var(--bw-bold) solid var(--ink-900)", textAlign: "left", whiteSpace: "nowrap" };
  const tdStyle: React.CSSProperties = { fontSize: 13, lineHeight: 1.7, padding: "11px 12px", borderBottom: "var(--bw-line) solid rgba(20,17,15,0.14)", verticalAlign: "top", whiteSpace: "nowrap" };

  return (
    <div>
      {/* 入力欄 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, maxWidth: 880 }}>
        <Field label="1回の入力" suffix="トークン" value={inTok} onChange={setInTok} step={100} hint="日本語はだいたい1文字＝1〜2トークン" />
        <Field label="1回の出力" suffix="トークン" value={outTok} onChange={setOutTok} step={100} hint="返ってくる文章のぶん" />
        <Field label="月の回数" suffix="回" value={calls} onChange={setCalls} step={100} hint="1日30回なら月900回くらい" />
        <Field label="為替" suffix="円/$" value={rate} onChange={setRate} hint="概算用。自由に変えてOK" />
      </div>

      {/* 結果 */}
      <div style={{ marginTop: 22, overflowX: "auto", border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop)" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 680 }}>
          <thead>
            <tr style={{ background: "var(--paper-50)" }}>
              <th style={thStyle}>モデル</th>
              <th style={thStyle}>単価（入力/出力）</th>
              <th style={thStyle}>1回あたり</th>
              <th style={thStyle}>月額（ドル）</th>
              <th style={thStyle}>月額（円換算）</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={m.id} style={i === 0 ? { background: "var(--yellow-400)" } : undefined}>
                <td style={{ ...tdStyle, whiteSpace: "normal", minWidth: 180 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 13.5 }}>{m.name}</span>
                  {i === 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--red-600)", marginLeft: 6 }}>最安</span>}
                  <div style={{ fontFamily: "var(--font-hand)", fontSize: 11.5, color: "var(--text-muted)" }}>{m.vendor}・{m.note}</div>
                </td>
                <td style={tdStyle}>${m.inputPerM} / ${m.outputPerM}</td>
                <td style={tdStyle}>{fmtUsd(m.perCall)}</td>
                <td style={tdStyle}>{fmtUsd(m.monthlyUsd)}</td>
                <td style={{ ...tdStyle, fontFamily: "var(--font-heading)", fontWeight: 900 }}>{fmtJpy(m.monthlyJpy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: "12px 2px 0", fontFamily: "var(--font-hand)", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.8 }}>
        単価は100万トークンあたりのUSドル（{COST_UPDATED.replace(/(\d+)-0?(\d+)-0?(\d+)/, "$1年$2月$3日")}時点・各社の発表と報道に基づく目安）。
        キャッシュ割引・バッチ割引・長文割増は含みません。正確な料金は各社の公式ページでご確認ください。
      </p>
    </div>
  );
}
