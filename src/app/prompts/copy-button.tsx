"use client";
/* プロンプト全文をクリップボードにコピーするボタン。
   コピー後2秒だけ「コピーしました」表示に切り替わる。 */
import React from "react";

export function CopyPromptButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* クリップボードAPIが使えない環境ではテキスト選択で代替 */
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      style={{
        fontFamily: "var(--font-heading)",
        fontWeight: 900,
        fontSize: 13.5,
        color: copied ? "var(--paper-50)" : "var(--ink-900)",
        background: copied ? "var(--ink-900)" : "var(--yellow-400)",
        border: "var(--bw-line) solid var(--ink-900)",
        borderRadius: "var(--radius-full)",
        boxShadow: "var(--shadow-pop-sm)",
        padding: "9px 18px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        transition: "background 0.15s, color 0.15s",
      }}
    >
      <i className={"ph-bold " + (copied ? "ph-check" : "ph-copy")} style={{ fontSize: 15 }} />
      {copied ? "コピーしました" : "プロンプトをコピー"}
    </button>
  );
}
