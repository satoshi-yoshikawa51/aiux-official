"use client";
/* ============================================================
   COMIXAI AI受付 — 全画面チャット型お問い合わせ。
   通常時: /api/uketsuke（Claude）が用件をヒアリング → 要約
   API未設定/エラー時: スクリプト受付モード（選択式）に自動切替
   要約確定後: お名前+メールを入力して Formspree で送信
   レイアウトは一般的なAIチャットアプリ風:
   中央カラム・下部固定入力・会話前はセンターの空状態
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

const COL = "min(760px, 94vw)"; // チャットカラム幅

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

  /* 空状態のキャラを透過アニメで動かす。
     透過webm(VP9)対応ブラウザは動画、Safari等はアニメWebPに切替 */
  const [alphaVideo, setAlphaVideo] = React.useState(false);
  React.useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const v = document.createElement("video");
    if (!isSafari && v.canPlayType('video/webm; codecs="vp9"')) setAlphaVideo(true);
  }, []);

  const started = messages.some((m) => m.role === "user");

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
    return started ? [] : CATEGORY_CHIPS;
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

  const avatar = (size: number) => (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/uketsuke/char.webp"
      alt=""
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 4%", border: "1.5px solid var(--ink-900)", background: "var(--paper-0)", flex: "none" }}
    />
  );

  const chipBtn = (c: string, big = false) => (
    <button
      key={c}
      type="button"
      onClick={() => send(c)}
      className="uke-chip"
      style={{
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: big ? 14 : 13,
        color: "var(--ink-900)",
        background: "var(--paper-0)",
        border: "1.5px solid var(--ink-900)",
        borderRadius: "var(--radius-full)",
        padding: big ? "10px 18px" : "7px 14px",
        cursor: "pointer",
        boxShadow: big ? "2px 2px 0 rgba(20,17,15,0.85)" : "none",
      }}
    >
      {c}
    </button>
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* ═══ 会話ログ（空状態はセンター表示） ═══ */}
      <div ref={logRef} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {!started && phase === "chat" ? (
          /* —— 空状態: AIチャットアプリの初期画面風 —— */
          <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" }}>
            <div style={{ width: COL, textAlign: "center" }}>
              {/* Reactはmuted属性をSSRで落とすためvideoは生HTMLで埋め込む */}
              <span
                role="img"
                aria-label="COMIXAI AI受付のキャラクター"
                style={{ display: "block", width: 124, aspectRatio: "488 / 522", margin: "0 auto 16px", filter: "drop-shadow(3px 4px 0 rgba(20,17,15,0.22))" }}
                dangerouslySetInnerHTML={{
                  __html: alphaVideo
                    ? '<video src="/uketsuke/char-alpha.webm" autoplay muted loop playsinline preload="auto" aria-hidden="true" style="width:100%;height:100%;object-fit:contain;display:block;"></video>'
                    : '<img src="/uketsuke/char-anim.webp" alt="" style="width:100%;height:100%;object-fit:contain;display:block;">',
                }}
              />
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(24px,4vw,34px)", lineHeight: 1.4, margin: "0 0 10px" }}>
                ご用件をどうぞ。
              </h1>
              <p style={{ fontSize: 14.5, lineHeight: 2, color: "var(--text-body)", margin: "0 0 26px" }}>
                COMIXAI AI受付です。講演・寄稿・制作・取材などのご相談をチャットでヒアリングして、そのまま吉川本人にお届けします。
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {CATEGORY_CHIPS.map((c) => chipBtn(c, true))}
              </div>
            </div>
          </div>
        ) : (
          /* —— 会話ビュー —— */
          <div style={{ width: COL, margin: "0 auto", padding: "22px 0 16px", display: "grid", gap: 14 }}>
            {messages.map((m, i) =>
              m.role === "assistant" ? (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", maxWidth: "88%" }}>
                  {avatar(30)}
                  <div
                    style={{
                      background: m.localOnly ? "transparent" : "var(--paper-0)",
                      border: m.localOnly ? "1.5px dashed rgba(20,17,15,0.3)" : "var(--bw-line) solid var(--ink-900)",
                      borderRadius: "14px 14px 14px 4px",
                      padding: "11px 15px",
                      fontSize: 15,
                      lineHeight: 1.9,
                      color: m.localOnly ? "var(--text-muted)" : "var(--text-body)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} style={{ justifySelf: "end", maxWidth: "82%" }}>
                  <div style={{ background: "var(--red-500)", color: "#fff", borderRadius: "14px 14px 4px 14px", border: "var(--bw-line) solid var(--ink-900)", padding: "11px 15px", fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </div>
                </div>
              )
            )}
            {sending && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                {avatar(30)}
                <div style={{ background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "14px 14px 14px 4px", padding: "11px 15px", fontSize: 14, color: "var(--text-muted)" }}>
                  考え中…
                </div>
              </div>
            )}

            {/* 確認カード */}
            {phase === "confirm" && summary && (
              <Card variant="pop" padding={20} style={{ marginTop: 4 }}>
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
              <Card variant="pop" padding={22} style={{ background: "var(--yellow-400)", textAlign: "center", marginTop: 4 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, marginBottom: 8 }}>送信できました！</div>
                <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.9, color: "var(--ink-900)" }}>
                  お問い合わせありがとうございます。
                  <br />
                  内容を確認のうえ、吉川本人よりメールでご返信します。
                </p>
                <a href="/" style={{ textDecoration: "none" }}>
                  <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-house" />}>
                    トップへ戻る
                  </Button>
                </a>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* ═══ 下部固定の入力バー ═══ */}
      <div style={{ borderTop: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-50)" }}>
        <div style={{ width: COL, margin: "0 auto", padding: "12px 0 10px" }}>
          {/* クイック返信チップ（会話中のみ。空状態はセンターに出す） */}
          {started && chips.length > 0 && phase === "chat" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>{chips.map((c) => chipBtn(c))}</div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            style={{ display: "flex", gap: 10 }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={phase === "chat" ? "メッセージを入力…" : "上のカードから送信できます"}
              maxLength={800}
              disabled={phase !== "chat"}
              aria-label="メッセージ"
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: "var(--font-body)",
                fontSize: 16,
                color: "var(--text-strong)",
                background: "var(--paper-0)",
                border: "var(--bw-line) solid var(--ink-900)",
                borderRadius: "var(--radius-full)",
                padding: "12px 18px",
                boxSizing: "border-box",
                opacity: phase === "chat" ? 1 : 0.55,
              }}
            />
            <Button type="submit" variant="primary" size="md" disabled={phase !== "chat" || sending || !input.trim()} iconRight={<i className="ph-bold ph-paper-plane-tilt" />}>
              送信
            </Button>
          </form>
          <p style={{ margin: "8px 2px 0", fontFamily: "var(--font-mono)", fontSize: 10.5, lineHeight: 1.7, color: "var(--text-muted)" }}>
            AIによる一次受付です。お名前・連絡先は最後の確認画面で入力してください。
            <a href="/#contact" style={{ color: "var(--red-600)" }}>通常フォーム</a>／
            <a href="/works/uketsuke" style={{ color: "var(--red-600)" }}>この作品について</a>
          </p>
        </div>
      </div>
    </div>
  );
}
