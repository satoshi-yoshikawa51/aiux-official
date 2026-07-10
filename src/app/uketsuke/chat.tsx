"use client";
/* ============================================================
   COMIXAI AI受付 — チャット型お問い合わせ。
   通常時: /api/uketsuke（Claude）が用件をヒアリング → 要約
   API未設定/エラー時: スクリプト受付モード（選択式）に自動切替
   要約確定後: お名前+メールを入力して Formspree で送信
   ============================================================ */
import React from "react";
import { Badge, Button, Card, Input } from "../ds";
import { FORMSPREE_ENDPOINT, CONTACT_EMAIL } from "../data";

/* —— 型 —— */
interface Msg {
  role: "user" | "assistant";
  text: string;
  /** 表示専用（システム案内など）。APIには送らない */
  localOnly?: boolean;
}
interface Summary {
  category: string;
  summary: string;
  details: string;
}

const GREETING =
  "こんにちは！COMIXAI AI受付です。講演・寄稿・制作・取材などのご相談の一次受付を担当しています。まずは、どんなご用件か教えてください。";

const CATEGORY_CHIPS = ["講演のご相談", "記事・寄稿の依頼", "制作のご相談", "取材・メディア", "コラボの提案", "その他"];
const TIMING_CHIPS = ["できるだけ早く", "1ヶ月以内をめどに", "2〜3ヶ月以内をめどに", "時期は未定"];

/* チップ表示テキスト → 要約カテゴリ */
function chipToCategory(chip: string): string {
  if (chip.startsWith("講演")) return "講演";
  if (chip.startsWith("記事")) return "寄稿";
  if (chip.startsWith("制作")) return "制作";
  if (chip.startsWith("取材")) return "取材";
  if (chip.startsWith("コラボ")) return "コラボ";
  return "その他";
}

/* —— スクリプト受付モードの進行 —— */
type ScriptStep = "category" | "detail" | "timing" | "extra" | "done";

export default function UketsukeChat() {
  const [messages, setMessages] = React.useState<Msg[]>([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [mode, setMode] = React.useState<"ai" | "scripted">("ai");
  const [script, setScript] = React.useState<{ step: ScriptStep; category: string; detail: string; timing: string }>({
    step: "category",
    category: "",
    detail: "",
    timing: "",
  });
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [phase, setPhase] = React.useState<"chat" | "confirm" | "done">("chat");
  const [sendState, setSendState] = React.useState<"idle" | "sending" | "error">("idle");
  const [sendErr, setSendErr] = React.useState("");
  const logRef = React.useRef<HTMLDivElement>(null);
  const modeRef = React.useRef(mode);
  modeRef.current = mode;

  /* 新しい発言が増えたらログ末尾へスクロール */
  React.useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, phase]);

  function push(msg: Msg) {
    setMessages((prev) => [...prev, msg]);
  }

  /* —— スクリプト受付モード —— */
  function scriptedRespond(userText: string, state = script) {
    if (state.step === "category") {
      const category = chipToCategory(userText);
      setScript({ ...state, step: "detail", category });
      push({
        role: "assistant",
        text: `「${category}」のご相談ですね、ありがとうございます。内容をできるだけ具体的に教えてください。（例: テーマ、対象、規模、参考リンクなど）`,
      });
    } else if (state.step === "detail") {
      setScript({ ...state, step: "timing", detail: userText });
      push({ role: "assistant", text: "ありがとうございます。ご希望の時期はありますか？" });
    } else if (state.step === "timing") {
      setScript({ ...state, step: "extra", timing: userText });
      push({
        role: "assistant",
        text: "承知しました。最後に、補足しておきたいことがあればどうぞ。（なければ「特になし」でOKです）",
      });
    } else if (state.step === "extra") {
      const extra = userText.trim() === "特になし" ? "" : userText;
      const s: Summary = {
        category: state.category,
        summary: `${state.category}のご相談（${state.timing}）`,
        details:
          `・ご相談内容: ${state.detail}\n・ご希望時期: ${state.timing}` + (extra ? `\n・補足: ${extra}` : ""),
      };
      setScript({ ...state, step: "done" });
      setSummary(s);
      push({ role: "assistant", text: "ありがとうございます。内容をまとめました。確認のうえ、送信にお進みください。" });
      setPhase("confirm");
    }
  }

  /* —— AI受付モード —— */
  async function aiRespond(history: Msg[]) {
    setSending(true);
    try {
      const res = await fetch("/api/uketsuke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.filter((m) => !m.localOnly).map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.fallback || (!data.reply && !data.summary)) {
        switchToScripted(history);
        return;
      }
      if (data.reply) push({ role: "assistant", text: String(data.reply) });
      if (data.summary) {
        setSummary(data.summary as Summary);
        setPhase("confirm");
      }
    } catch {
      switchToScripted(history);
    } finally {
      setSending(false);
    }
  }

  /* AI→スクリプトへの切替。すでに聞けている内容は引き継ぐ */
  function switchToScripted(history: Msg[]) {
    setMode("scripted");
    push({
      role: "assistant",
      localOnly: true,
      text: "（ただいまAI受付が混み合っているため、かんたん受付モードに切り替えました。このまま続けられます）",
    });
    const firstUser = history.find((m) => m.role === "user");
    if (firstUser) {
      /* 最初の発言をカテゴリ回答として流用し、次の質問へ */
      scriptedRespond(firstUser.text, { step: "category", category: "", detail: "", timing: "" });
    } else {
      push({ role: "assistant", text: "ご用件の種類を選んでください。" });
    }
  }

  function send(text: string) {
    const t = text.trim();
    if (!t || sending || phase !== "chat") return;
    setInput("");
    const userMsg: Msg = { role: "user", text: t };
    const history = [...messages, userMsg];
    push(userMsg);
    if (modeRef.current === "scripted") {
      scriptedRespond(t);
    } else {
      void aiRespond(history);
    }
  }

  /* いま表示すべきクイック返信チップ */
  function currentChips(): string[] {
    if (phase !== "chat" || sending) return [];
    if (mode === "scripted") {
      if (script.step === "category") return CATEGORY_CHIPS;
      if (script.step === "timing") return TIMING_CHIPS;
      if (script.step === "extra") return ["特になし"];
      return [];
    }
    /* AIモードは最初の一言だけチップで補助 */
    return messages.some((m) => m.role === "user") ? [] : CATEGORY_CHIPS;
  }

  /* —— Formspree 送信 —— */
  async function onConfirmSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!summary) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const transcript = messages
      .filter((m) => !m.localOnly)
      .map((m) => `[${m.role === "user" ? "訪問者" : "AI受付"}] ${m.text}`)
      .join("\n");
    const message = [
      `■ 種別: ${summary.category}`,
      `■ 要約: ${summary.summary}`,
      "■ 詳細:",
      summary.details,
      "",
      "—— AI受付の会話ログ ——",
      transcript,
    ].join("\n");
    const data = new FormData();
    data.set("_subject", `【AI受付】お問い合わせ（${summary.category}）`);
    data.set("name", String(fd.get("name") || ""));
    data.set("email", String(fd.get("email") || ""));
    data.set("message", message);

    const configured = !FORMSPREE_ENDPOINT.includes("REPLACE_WITH_FORM_ID");
    if (!configured) {
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("【AI受付】お問い合わせ")}&body=${encodeURIComponent(message)}`;
      return;
    }
    setSendState("sending");
    setSendErr("");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (res.ok) {
        setSendState("idle");
        setPhase("done");
      } else {
        const j = await res.json().catch(() => ({}));
        setSendErr((j.errors && j.errors.map((x: { message: string }) => x.message).join(" / ")) || "送信に失敗しました。");
        setSendState("error");
      }
    } catch {
      setSendErr("通信エラーが発生しました。");
      setSendState("error");
    }
  }

  /* 確認画面から会話に戻る */
  function backToChat() {
    setPhase("chat");
    if (mode === "scripted") {
      /* スクリプトモードは補足ステップに戻して追記してもらう */
      setScript((s) => ({ ...s, step: "extra" }));
      push({ role: "assistant", text: "追加・修正したい内容をどうぞ。（この内容で補足として反映します）" });
    } else {
      push({ role: "assistant", localOnly: true, text: "（修正したい点をそのまま伝えてください。要約を作り直します）" });
    }
  }

  const chips = currentChips();

  return (
    <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "var(--ink-900)", borderBottom: "var(--bw-bold) solid var(--ink-900)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/quiz/grades/minarai.webp" alt="AI受付のキャラクター" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--paper-0)", background: "var(--paper-0)" }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15.5, color: "var(--paper-50)" }}>COMIXAI AI受付</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--paper-200)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            {mode === "ai" ? "AIがヒアリング中" : "かんたん受付モード"}
          </div>
        </div>
      </div>

      {/* 会話ログ */}
      <div ref={logRef} style={{ padding: "18px 16px", display: "grid", gap: 12, maxHeight: 440, overflowY: "auto", background: "var(--paper-100)" }}>
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end", maxWidth: "88%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/quiz/grades/minarai.webp" alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--ink-900)", background: "var(--paper-0)", flex: "none" }} />
              <div
                style={{
                  background: m.localOnly ? "transparent" : "var(--paper-0)",
                  border: m.localOnly ? "1.5px dashed rgba(20,17,15,0.3)" : "var(--bw-line) solid var(--ink-900)",
                  borderRadius: "12px 12px 12px 4px",
                  padding: "10px 14px",
                  fontSize: 14.5,
                  lineHeight: 1.85,
                  color: m.localOnly ? "var(--text-muted)" : "var(--text-body)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} style={{ justifySelf: "end", maxWidth: "82%" }}>
              <div style={{ background: "var(--red-500)", color: "#fff", borderRadius: "12px 12px 4px 12px", border: "var(--bw-line) solid var(--ink-900)", padding: "10px 14px", fontSize: 14.5, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
                {m.text}
              </div>
            </div>
          )
        )}
        {sending && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/quiz/grades/minarai.webp" alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--ink-900)", background: "var(--paper-0)", flex: "none" }} />
            <div style={{ background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", fontSize: 14, color: "var(--text-muted)" }}>
              考え中…
            </div>
          </div>
        )}

        {/* 確認カード */}
        {phase === "confirm" && summary && (
          <Card variant="flat" padding={18} style={{ background: "var(--paper-0)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Badge tone="red">{summary.category}</Badge>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15 }}>お問い合わせ内容の確認</span>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1.8 }}>{summary.summary}</p>
            <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.9, color: "var(--text-body)", whiteSpace: "pre-wrap", background: "var(--paper-100)", border: "1px solid rgba(20,17,15,0.12)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
              {summary.details}
            </p>
            <form onSubmit={onConfirmSubmit} style={{ display: "grid", gap: 12 }}>
              <Input label="お名前" name="name" placeholder="山田 太郎" required />
              <Input label="メールアドレス" name="email" type="email" placeholder="you@example.com" hint="ご返信先になります" required />
              {sendState === "error" && (
                <div style={{ fontSize: 13, color: "var(--red-600)", fontWeight: 700 }}>
                  <i className="ph-bold ph-warning" /> {sendErr}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button type="submit" variant="primary" size="md" disabled={sendState === "sending"} iconRight={<i className="ph-bold ph-paper-plane-tilt" />}>
                  {sendState === "sending" ? "送信中…" : "この内容で送信する"}
                </Button>
                <Button variant="secondary" size="md" onClick={backToChat}>
                  内容を追加・修正する
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 送信完了 */}
        {phase === "done" && (
          <Card variant="flat" padding={20} style={{ background: "var(--yellow-400)", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, marginBottom: 8 }}>送信できました！</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: "var(--ink-900)" }}>
              お問い合わせありがとうございます。
              <br />
              内容を確認のうえ、吉川本人よりメールでご返信します。
            </p>
          </Card>
        )}
      </div>

      {/* クイック返信チップ */}
      {chips.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 16px 0", background: "var(--paper-0)" }}>
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => send(c)}
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--ink-900)",
                background: "var(--paper-100)",
                border: "1.5px solid var(--ink-900)",
                borderRadius: "var(--radius-full)",
                padding: "7px 14px",
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* 入力欄 */}
      {phase === "chat" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          style={{ display: "flex", gap: 10, padding: 14, background: "var(--paper-0)", borderTop: "var(--bw-line) solid var(--ink-900)", marginTop: chips.length > 0 ? 12 : 0 }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力…"
            maxLength={800}
            aria-label="メッセージ"
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: "var(--font-body)",
              fontSize: 16,
              color: "var(--text-strong)",
              background: "var(--paper-100)",
              border: "var(--bw-line) solid var(--ink-900)",
              borderRadius: "var(--radius-full)",
              padding: "11px 18px",
              boxSizing: "border-box",
            }}
          />
          <Button type="submit" variant="primary" size="md" disabled={sending || !input.trim()} iconRight={<i className="ph-bold ph-paper-plane-tilt" />}>
            送信
          </Button>
        </form>
      )}

      {/* 注意書き */}
      <div style={{ padding: "10px 16px 14px", background: "var(--paper-0)", fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.8, color: "var(--text-muted)", borderTop: "1px solid rgba(20,17,15,0.08)" }}>
        ※ 会話内容はお問い合わせの整理のためAI（Anthropic API）で処理されます。お名前・連絡先などの個人情報は、チャットには書かず最後の確認画面で入力してください。
        じっくり書きたい方は <a href="/#contact" style={{ color: "var(--red-600)" }}>通常のお問い合わせフォーム</a> もどうぞ。
      </div>
    </Card>
  );
}
