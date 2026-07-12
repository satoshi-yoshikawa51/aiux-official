"use client";
/* ============================================================
   「Claudeアプリ教習所」— Claudeアプリ（PC/スマホ）の画面を
   再現した操作トレーニング。ミッションをこなして基本操作を
   身につける。体験モードは定型応答で完結、APIキーを設定すると
   本物のClaude（Anthropic API）にブラウザから直接つながる。
   ※ COMIXAIによる非公式の再現UI。Anthropic公式とは無関係。
   ============================================================ */
import React from "react";
import Anthropic from "@anthropic-ai/sdk";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

/* ———— アプリ再現UIの配色（Claude風・サイトDSとは独立） ———— */
const C = {
  bg: "#FAF9F5",
  panel: "#F0EEE6",
  line: "#E0DDD1",
  ink: "#3D3929",
  sub: "#87826F",
  accent: "#D97757",
  accentInk: "#B4542F",
  user: "#EEEBDF",
};
const SERIF = "Georgia, 'Times New Roman', serif";

/* ———— モデル ———— */
type ModelId = "claude-opus-4-8" | "claude-sonnet-5" | "claude-haiku-4-5";
const MODELS: { id: ModelId; name: string; desc: string }[] = [
  { id: "claude-opus-4-8", name: "Opus 4.8", desc: "最高性能。じっくり考える難しい仕事に" },
  { id: "claude-sonnet-5", name: "Sonnet 5", desc: "バランス型。日常づかいの定番" },
  { id: "claude-haiku-4-5", name: "Haiku 4.5", desc: "軽快・高速。かんたんな作業に" },
];

/* ———— メッセージ ———— */
interface Msg {
  role: "user" | "assistant";
  text: string;
  thinking?: string; // APIモード：思考の要約
  error?: boolean;
  raw?: unknown; // APIモード：返答のcontentブロック（再送用にそのまま保持）
}
interface Chat {
  id: number;
  title: string;
  messages: Msg[];
}

/* ———— ミッション ———— */
const MISSIONS = [
  { id: "newchat", icon: "✏️", title: "「新しいチャット」を開く", desc: "サイドバー（スマホは ☰ メニュー）の「新しいチャット」を押そう。" },
  { id: "send", icon: "📨", title: "メッセージを送る", desc: "入力欄に書いて送信。迷ったら候補ボタンからでOK。" },
  { id: "reply", icon: "📖", title: "返事を最後まで受け取る", desc: "Claudeの返事は少しずつ流れてくる（ストリーミング）。" },
  { id: "followup", icon: "🔁", title: "同じチャットで続けて質問する", desc: "前のやりとりは覚えている。「さっきのを短く」が通じる。" },
  { id: "model", icon: "🎛️", title: "モデルを切り替える", desc: "画面上部のモデル名を押すと選べる。用途で使い分けよう。" },
  { id: "newchat2", icon: "🆕", title: "新しい話題は新しいチャットで", desc: "もう一度「新しいチャット」。文脈を混ぜないのがコツ。" },
  { id: "history", icon: "🗂️", title: "履歴から前のチャットに戻る", desc: "サイドバーの一覧から、最初のチャットを開き直そう。" },
  { id: "device", icon: "📱", title: "PC⇄スマホ表示を切り替える", desc: "枠の上の切替ボタンで。どちらでも同じように使える。" },
] as const;
type MissionId = (typeof MISSIONS)[number]["id"] | "real";

/* ———— 体験モードの台本 ———— */
const SUGGESTIONS = [
  "Claudeには何ができる？",
  "明日の朝礼の挨拶を考えて",
  "AIを使いこなすコツを3つ教えて",
];
const DEMO_REPLIES: Record<string, string> = {
  [SUGGESTIONS[0]]:
    "こんにちは！Claudeは、文章の作成・要約・翻訳、アイデア出し、表の整理、プログラムを書くことまで、「言葉で頼める仕事」ならたいてい手伝えます。\n\nたとえば——\n・長いメールを3行に要約\n・企画のたたき台を10案\n・ExcelのVLOOKUPの使い方を解説\n\n「こういうことできる？」と気軽に聞いてみるのがいちばんの近道です。",
  [SUGGESTIONS[1]]:
    "いいですね。たとえばこんな挨拶はどうでしょう。\n\n「おはようございます。今週も折り返しですね。今日は午後に締め切りがひとつあるので、午前中は集中タイムでいきましょう。困りごとがあれば早めに共有してください。それでは今日も一日、よろしくお願いします！」\n\n「もっとカジュアルに」「半分の長さに」のような注文も、続けてどうぞ。",
  [SUGGESTIONS[2]]:
    "コツは3つあります。\n\n1. 背景ごと伝える —「誰向けに・何のために」を添えると精度が上がる\n2. 一度で完璧を求めない — 出てきたものに「もっと短く」「例を足して」と注文を重ねる\n3. 新しい話題は新しいチャットで — 文脈が混ざると答えもぶれる\n\nじつはこの教習所のミッション、まさにこの3つの練習になっています。",
};
const DEMO_FALLBACK =
  "メッセージありがとうございます。いまは体験モードなので返事は定型文ですが、画面の使い方は本物のClaudeアプリと同じです。\n\n・返事はこうして少しずつ流れてきます（ストリーミング）\n・同じチャットなら文脈も引き継がれます\n・⚙️ 設定でAPIキーを入れると、本物のClaudeがここで答えます\n\nまずはミッションを進めてみましょう！";
const DEMO_FOLLOWUP =
  "続けての質問、いいですね。同じチャットの中では、Claudeは前のやりとりを覚えたまま答えます。だから「さっきのをもっと短く」「それを英語で」のような指示が通じるんです。\n\n（体験モードのため定型の返事です。⚙️ 設定からAPIキーを入れると、この画面のまま本物のClaudeにつながります）";

const SYSTEM_PROMPT =
  "あなたはClaudeです。COMIXAI（comixai.dev）の学習ゲーム「Claudeアプリ教習所」の中で、Claudeアプリの操作を練習しているユーザーと会話しています。日本語で、フレンドリーかつ簡潔に（目安300字以内で）答えてください。";

const KEY_STORAGE = "comixai-claude-app-key";

/* ============================================================ */
export function ClaudeAppGame() {
  /* —— 全体状態 —— */
  const [device, setDevice] = React.useState<"pc" | "sp">("pc");
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [model, setModel] = React.useState<ModelId>("claude-opus-4-8");
  const [input, setInput] = React.useState("");
  const [busyChat, setBusyChat] = React.useState<number | null>(null);
  const busy = busyChat !== null;
  const [drawer, setDrawer] = React.useState(false);
  const [modelMenu, setModelMenu] = React.useState(false);
  const [settings, setSettings] = React.useState(false);
  const [apiKey, setApiKey] = React.useState("");
  const [saveKey, setSaveKey] = React.useState(false);
  const [apiMode, setApiMode] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<Set<MissionId>>(new Set());
  const [celebrated, setCelebrated] = React.useState(false);

  const idRef = React.useRef(1);
  const genRef = React.useRef(0); // 体験モードのストリーム世代
  const streamRef = React.useRef<{ abort: () => void } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = chats.find((c) => c.id === activeId) ?? null;
  const coreDone = MISSIONS.filter((m) => done.has(m.id)).length;
  const graduated = coreDone === MISSIONS.length;

  /* —— 初期化：部屋の解錠・端末判定・保存済みキー —— */
  React.useEffect(() => {
    unlock("rooms", "claude-app");
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches) setDevice("sp");
    try {
      const k = localStorage.getItem(KEY_STORAGE);
      if (k) {
        setApiKey(k);
        setSaveKey(true);
        setApiMode(true);
      }
    } catch {
      /* noop */
    }
    return () => streamRef.current?.abort();
  }, []);

  /* —— 自動スクロール —— */
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.messages, busy]);

  /* —— 卒業判定 —— */
  React.useEffect(() => {
    if (graduated && !celebrated) {
      setCelebrated(true);
      unlock("claudeapp", "sotsugyo");
    }
  }, [graduated, celebrated]);

  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const clearMission = React.useCallback(
    (id: MissionId) => {
      setDone((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        const m = MISSIONS.find((x) => x.id === id);
        notify(id === "real" ? "⭐ ボーナス達成：本物のClaudeと話した！" : `✅ ミッション達成：${m?.title ?? id}`);
        if (id === "real") unlock("claudeapp", "honmono");
        return next;
      });
    },
    [],
  );

  /* —— 操作イベント —— */
  /* 本物のアプリ同様、応答のストリーミング中でもチャットの移動・新規作成は可能。
     進行中のストリームは chatId 宛てに書き込むので、裏でそのまま完了する。 */
  const newChat = () => {
    const hadConversation = chats.some((c) => c.messages.length > 0);
    setActiveId(null);
    setDrawer(false);
    clearMission("newchat");
    if (hadConversation) clearMission("newchat2");
  };
  const openChat = (id: number) => {
    if (id === activeId) {
      setDrawer(false);
      return;
    }
    setActiveId(id);
    setDrawer(false);
    clearMission("history");
  };
  const toggleDevice = (d: "pc" | "sp") => {
    if (d === device) return;
    setDevice(d);
    clearMission("device");
  };
  const pickModel = (id: ModelId) => {
    setModelMenu(false);
    if (id === model) return;
    setModel(id);
    clearMission("model");
    notify(`🎛️ モデルを ${MODELS.find((m) => m.id === id)?.name} に切り替えました`);
  };

  /* —— メッセージ更新ヘルパ —— */
  const patchLast = (chatId: number, patch: (m: Msg) => Msg) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id !== chatId ? c : { ...c, messages: c.messages.map((m, i) => (i === c.messages.length - 1 ? patch(m) : m)) },
      ),
    );
  };

  /* —— 送信 —— */
  const send = async (textRaw?: string) => {
    const text = (textRaw ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setModelMenu(false);

    /* チャットを用意（未作成なら新規） */
    let chat = active;
    if (!chat) {
      chat = { id: idRef.current++, title: text.length > 14 ? `${text.slice(0, 14)}…` : text, messages: [] };
      setChats((prev) => [chat as Chat, ...prev]);
      setActiveId(chat.id);
    }
    const chatId = chat.id;
    const isFollowup = chat.messages.length >= 2;
    const history = chat.messages;

    clearMission("send");
    if (isFollowup) clearMission("followup");

    setChats((prev) =>
      prev.map((c) => (c.id !== chatId ? c : { ...c, messages: [...c.messages, { role: "user", text }, { role: "assistant", text: "" }] })),
    );
    setBusyChat(chatId);

    if (apiMode && apiKey) {
      await sendApi(chatId, [...history, { role: "user", text }]);
    } else {
      await sendDemo(chatId, text, isFollowup);
    }
    setBusyChat(null);
  };

  /* —— 体験モード：定型応答を擬似ストリーミング —— */
  const sendDemo = async (chatId: number, text: string, isFollowup: boolean) => {
    const gen = ++genRef.current;
    const reply = isFollowup ? DEMO_FOLLOWUP : DEMO_REPLIES[text] ?? DEMO_FALLBACK;
    await new Promise((r) => setTimeout(r, 550));
    for (let i = 0; i < reply.length; i += 2) {
      if (genRef.current !== gen) return;
      const slice = reply.slice(0, i + 2);
      patchLast(chatId, (m) => ({ ...m, text: slice }));
      await new Promise((r) => setTimeout(r, 17));
    }
    if (genRef.current !== gen) return;
    patchLast(chatId, (m) => ({ ...m, text: reply }));
    clearMission("reply");
  };

  /* —— APIモード：Anthropic APIへブラウザから直接ストリーミング —— */
  const sendApi = async (chatId: number, history: Msg[]) => {
    try {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      const messages: Anthropic.MessageParam[] = history.map((m) =>
        m.role === "assistant" && m.raw
          ? { role: "assistant" as const, content: m.raw as Anthropic.ContentBlockParam[] }
          : { role: m.role, content: m.text },
      );
      const stream = client.messages.stream({
        model,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages,
        /* Haiku 4.5 はadaptive thinking非対応のため無指定（=思考オフ） */
        ...(model === "claude-haiku-4-5" ? {} : { thinking: { type: "adaptive", display: "summarized" } as Anthropic.ThinkingConfigParam }),
      });
      streamRef.current = stream;
      for await (const event of stream) {
        if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            const t = event.delta.text;
            patchLast(chatId, (m) => ({ ...m, text: m.text + t }));
          } else if (event.delta.type === "thinking_delta") {
            const t = event.delta.thinking;
            patchLast(chatId, (m) => ({ ...m, thinking: (m.thinking ?? "") + t }));
          }
        }
      }
      const final = await stream.finalMessage();
      patchLast(chatId, (m) => ({ ...m, raw: final.content }));
      clearMission("reply");
      clearMission("real");
    } catch (err) {
      if (err instanceof Anthropic.APIUserAbortError) return;
      let msg = "エラーが発生しました。時間をおいて再度お試しください。";
      if (err instanceof Anthropic.AuthenticationError) msg = "APIキーが無効です。⚙️ 設定でキーを確認してください。";
      else if (err instanceof Anthropic.PermissionDeniedError) msg = "このAPIキーでは利用できません（権限またはクレジット残高をご確認ください）。";
      else if (err instanceof Anthropic.RateLimitError) msg = "レート制限にかかりました。少し待ってから送り直してください。";
      else if (err instanceof Anthropic.BadRequestError) msg = `リクエストエラー：${err.message}`;
      else if (err instanceof Anthropic.APIConnectionError) msg = "Anthropic APIに接続できませんでした。ネットワークをご確認ください。";
      else if (err instanceof Anthropic.APIError) msg = `APIエラー（${err.status}）：${err.message}`;
      patchLast(chatId, (m) => ({ ...m, text: msg, error: true }));
    } finally {
      streamRef.current = null;
    }
  };

  /* —— 設定の保存 —— */
  const applySettings = (key: string, save: boolean, useApi: boolean) => {
    setApiKey(key);
    setSaveKey(save);
    setApiMode(useApi && key.length > 0);
    try {
      if (save && key) localStorage.setItem(KEY_STORAGE, key);
      else localStorage.removeItem(KEY_STORAGE);
    } catch {
      /* noop */
    }
    setSettings(false);
    if (useApi && key) notify("🔑 APIモードをオンにしました。本物のClaudeが応答します");
  };

  const currentMission = MISSIONS.find((m) => !done.has(m.id)) ?? null;
  const shareText = `Claudeアプリ教習所、全${MISSIONS.length}ミッションクリアで卒業した🎓${done.has("real") ? "（本物のClaudeとの対話つき）" : ""}\nPC/スマホの画面そのままで操作を練習できる。\n#今さら聞けないAI用語集`;
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/claude-app")}`;

  /* ============================================================
     描画
     ============================================================ */
  return (
    <div style={{ position: "relative" }}>
      {/* —— ミッションボード —— */}
      <Card variant="pop" padding={0} style={{ overflow: "hidden", marginBottom: 18 }}>
        <div style={{ padding: "14px 18px 12px", borderBottom: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Badge tone="red">研修中</Badge>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15 }}>
            ミッション {coreDone}/{MISSIONS.length}
            {done.has("real") && <span style={{ marginLeft: 6 }}>＋⭐</span>}
          </div>
          <div style={{ flex: 1, minWidth: 120, height: 10, border: "2px solid var(--ink-900)", borderRadius: 99, overflow: "hidden", background: "var(--paper-0)" }}>
            <div style={{ width: `${(coreDone / MISSIONS.length) * 100}%`, height: "100%", background: "var(--yellow-400)", transition: "width .4s var(--ease-pop)" }} />
          </div>
        </div>
        <div style={{ padding: "12px 18px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 6 }}>
            {MISSIONS.map((m, i) => {
              const ok = done.has(m.id);
              const now = currentMission?.id === m.id;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 9px", borderRadius: 8,
                    border: now ? "2px solid var(--red-500)" : "2px solid " + (ok ? "var(--ink-900)" : "var(--paper-300)"),
                    background: ok ? "var(--yellow-100, #FFF7D6)" : now ? "var(--red-50)" : "var(--paper-0)",
                    opacity: ok || now ? 1 : 0.62, fontSize: 12, fontWeight: 700, lineHeight: 1.35,
                  }}
                >
                  <span style={{ fontSize: 15 }}>{ok ? "✅" : m.icon}</span>
                  <span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginRight: 4 }}>{i + 1}</span>
                    {m.title}
                  </span>
                </div>
              );
            })}
          </div>
          {currentMission ? (
            <p style={{ margin: "10px 2px 0", fontSize: 13.5, lineHeight: 1.7 }}>
              <b>👉 いまのミッション：{currentMission.title}</b>
              <span style={{ color: "var(--text-muted)" }}> — {currentMission.desc}</span>
            </p>
          ) : (
            <p style={{ margin: "10px 2px 0", fontSize: 13.5, lineHeight: 1.7 }}>
              <b>🎓 全ミッションクリア！</b>
              {!done.has("real") && (
                <span style={{ color: "var(--text-muted)" }}> ボーナス：⚙️ 設定でAPIキーを入れると、本物のClaudeとこの画面で話せます。</span>
              )}
            </p>
          )}
        </div>
      </Card>

      {/* —— 操作列：表示切替・モード —— */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 10, overflow: "hidden", background: "var(--paper-0)" }}>
          {(["pc", "sp"] as const).map((d) => (
            <button
              key={d}
              onClick={() => toggleDevice(d)}
              style={{
                padding: "8px 16px", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, cursor: "pointer",
                border: "none", background: device === d ? "var(--ink-900)" : "transparent", color: device === d ? "var(--paper-50)" : "var(--ink-900)",
              }}
            >
              {d === "pc" ? "💻 PC" : "📱 スマホ"}
            </button>
          ))}
        </div>
        <Badge tone={apiMode ? "green" : "soft"}>{apiMode ? "🔑 APIモード（本物のClaude）" : "🎬 体験モード（定型応答）"}</Badge>
        <Button variant="secondary" size="sm" onClick={() => setSettings(true)} style={{ marginLeft: "auto" }}>
          ⚙️ 設定
        </Button>
      </div>

      {/* —— アプリ再現フレーム —— */}
      <p style={{ margin: "0 0 8px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        ⚠️ 学習用にCOMIXAIが再現した非公式の画面です（Anthropic公式アプリではありません）
      </p>
      {device === "pc" ? (
        <div style={{ overflowX: "auto" }}>
          <div
            className="game-in"
            style={{
              minWidth: 640, height: 560, display: "flex", background: C.bg, color: C.ink,
              border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 14, boxShadow: "var(--shadow-pop)", overflow: "hidden",
            }}
          >
            <Sidebar chats={chats} activeId={activeId} onNew={newChat} onOpen={openChat} width={224} />
            <Main
              device="pc"
              chat={active}
              busy={busy}
              streaming={!!active && busyChat === active.id}
              model={model}
              modelMenu={modelMenu}
              setModelMenu={setModelMenu}
              pickModel={pickModel}
              input={input}
              setInput={setInput}
              send={send}
              scrollRef={scrollRef}
              notify={notify}
              openDrawer={() => setDrawer(true)}
            />
          </div>
        </div>
      ) : (
        <div
          className="game-in"
          style={{
            width: "min(380px, 100%)", margin: "0 auto", background: "var(--ink-900)", borderRadius: 44,
            padding: 8, boxShadow: "var(--shadow-pop)", border: "var(--bw-bold) solid var(--ink-900)",
          }}
        >
          <div style={{ position: "relative", background: C.bg, color: C.ink, borderRadius: 36, overflow: "hidden", height: 640, display: "flex", flexDirection: "column" }}>
            {/* ステータスバー */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 22px 4px", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>
              <span>9:41</span>
              <span style={{ letterSpacing: 2 }}>📶 🔋</span>
            </div>
            <Main
              device="sp"
              chat={active}
              busy={busy}
              streaming={!!active && busyChat === active.id}
              model={model}
              modelMenu={modelMenu}
              setModelMenu={setModelMenu}
              pickModel={pickModel}
              input={input}
              setInput={setInput}
              send={send}
              scrollRef={scrollRef}
              notify={notify}
              openDrawer={() => setDrawer(true)}
            />
            {/* ドロワー */}
            {drawer && (
              <>
                <div onClick={() => setDrawer(false)} style={{ position: "absolute", inset: 0, background: "rgba(40,35,25,.4)", zIndex: 5 }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "80%", zIndex: 6, boxShadow: "4px 0 18px rgba(0,0,0,.25)" }}>
                  <Sidebar chats={chats} activeId={activeId} onNew={newChat} onOpen={openChat} width="100%" onClose={() => setDrawer(false)} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* —— 卒業証書 —— */}
      {graduated && (
        <Card variant="pop" padding={22} style={{ marginTop: 20, textAlign: "center", background: "var(--yellow-100, #FFF7D6)" }} className="game-in">
          <div style={{ fontSize: 44 }}>🎓</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, margin: "6px 0 4px" }}>
            Claudeアプリ教習所　卒業！
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-body)", margin: "0 0 6px" }}>
            新規チャット・送信・文脈の継続・モデル切替・履歴・表示切替——基本操作はぜんぶ体験しました。
            {done.has("real") ? "しかも本物のClaudeとの対話つき。あとは実物で使うだけ！" : "次は本物のClaudeアプリで、同じ操作を試してみてください。"}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 10 }}>
            <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="sm">🕊️ 結果をシェア</Button>
            </a>
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="secondary" size="sm">本物のClaudeを開く ↗</Button>
            </a>
          </div>
          <ZukanNote />
        </Card>
      )}

      {/* —— トースト —— */}
      {toast && (
        <div
          className="game-in"
          style={{
            position: "fixed", left: "50%", bottom: 26, transform: "translateX(-50%)", zIndex: 60,
            background: "var(--ink-900)", color: "var(--paper-50)", padding: "10px 18px", borderRadius: 12,
            fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5, boxShadow: "var(--shadow-pop-sm)", maxWidth: "92vw",
          }}
        >
          {toast}
        </div>
      )}

      {/* —— 設定モーダル —— */}
      {settings && (
        <SettingsModal
          initialKey={apiKey}
          initialSave={saveKey}
          initialUse={apiMode}
          onClose={() => setSettings(false)}
          onApply={applySettings}
        />
      )}
    </div>
  );
}

/* ============================================================
   サイドバー（PC常設／スマホはドロワー）
   ============================================================ */
function Sidebar({
  chats, activeId, onNew, onOpen, width, onClose,
}: {
  chats: Chat[];
  activeId: number | null;
  onNew: () => void;
  onOpen: (id: number) => void;
  width: number | string;
  onClose?: () => void;
}) {
  return (
    <div style={{ width, minWidth: typeof width === "number" ? width : undefined, height: "100%", background: C.panel, borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px 8px" }}>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, color: C.ink }}>
          <span style={{ color: C.accent, marginRight: 5 }}>✳</span>Claude
        </span>
        {onClose && (
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: C.sub }} aria-label="閉じる">
            ×
          </button>
        )}
      </div>
      <div style={{ padding: "4px 10px 10px" }}>
        <button
          onClick={onNew}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10,
            border: `1px solid ${C.line}`, background: C.bg, color: C.accentInk, fontWeight: 700, fontSize: 13.5, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> 新しいチャット
        </button>
      </div>
      <div style={{ padding: "2px 14px 6px", fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: ".06em" }}>チャット</div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {chats.length === 0 && (
          <p style={{ fontSize: 12, color: C.sub, padding: "4px 8px", lineHeight: 1.7 }}>まだ履歴はありません。最初のチャットを始めよう。</p>
        )}
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => onOpen(c.id)}
            style={{
              width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              background: c.id === activeId ? "#E4E1D3" : "transparent", color: C.ink, fontSize: 13, fontWeight: c.id === activeId ? 700 : 500,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2,
            }}
          >
            💬 {c.title}
          </button>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.line}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
          あ
        </span>
        <span style={{ fontSize: 12.5 }}>
          <b>あなた</b>
          <span style={{ color: C.sub }}>（研修生）</span>
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   メイン画面（ヘッダー・メッセージ・入力欄）
   ============================================================ */
function Main({
  device, chat, busy, streaming, model, modelMenu, setModelMenu, pickModel, input, setInput, send, scrollRef, notify, openDrawer,
}: {
  device: "pc" | "sp";
  chat: Chat | null;
  busy: boolean;
  streaming: boolean;
  model: ModelId;
  modelMenu: boolean;
  setModelMenu: (v: boolean) => void;
  pickModel: (m: ModelId) => void;
  input: string;
  setInput: (v: string) => void;
  send: (t?: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  notify: (m: string) => void;
  openDrawer: () => void;
}) {
  const modelInfo = MODELS.find((m) => m.id === model)!;
  const empty = !chat || chat.messages.length === 0;

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: device === "sp" ? "8px 12px" : "12px 16px", borderBottom: `1px solid ${C.line}` }}>
        {device === "sp" && (
          <button onClick={openDrawer} aria-label="メニュー" style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", color: C.ink, padding: "0 2px" }}>
            ☰
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {chat ? chat.title : "新しいチャット"}
        </div>
        {/* モデルセレクタ */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setModelMenu(!modelMenu)}
            style={{
              display: "flex", alignItems: "center", gap: 5, border: `1px solid ${C.line}`, background: C.bg,
              borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: C.ink, cursor: "pointer",
            }}
          >
            {modelInfo.name} <span style={{ fontSize: 9, color: C.sub }}>▼</span>
          </button>
          {modelMenu && (
            <>
              <div onClick={() => setModelMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 8 }} />
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 9, width: 240, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(40,35,25,.18)", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px 4px", fontSize: 10.5, fontWeight: 700, color: C.sub, letterSpacing: ".05em" }}>モデルを選択</div>
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => pickModel(m.id)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: m.id === model ? C.panel : "transparent", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                      {m.name} {m.id === model && <span style={{ color: C.accent }}>✓</span>}
                    </span>
                    <span style={{ display: "block", fontSize: 11, color: C.sub, marginTop: 1 }}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 本文 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: device === "sp" ? "16px 14px" : "22px 26px" }}>
        {empty ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8 }}>
            <div style={{ fontSize: 34, color: C.accent }}>✳</div>
            <div style={{ fontFamily: SERIF, fontSize: device === "sp" ? 19 : 23, color: C.ink }}>こんにちは。今日は何をしましょう？</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12, width: "100%", maxWidth: 320 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={busy}
                  style={{
                    padding: "9px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: "#FFFFFF",
                    color: C.ink, fontSize: 12.5, cursor: "pointer", textAlign: "left",
                  }}
                >
                  💡 {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chat!.messages.map((m, i) => <Bubble key={i} msg={m} last={i === chat!.messages.length - 1} busy={streaming} sp={device === "sp"} />)
        )}
      </div>

      {/* 入力欄 */}
      <div style={{ padding: device === "sp" ? "8px 10px 14px" : "10px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, border: `1.5px solid ${C.line}`, borderRadius: 18, background: "#FFFFFF", padding: "8px 10px" }}>
          <button
            onClick={() => notify("📎 添付は本物のアプリの機能。この教習所では省略しています")}
            aria-label="添付"
            style={{ border: "none", background: "transparent", fontSize: 17, cursor: "pointer", color: C.sub, padding: "3px 2px" }}
          >
            ＋
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Claudeにメッセージを送る…"
            rows={1}
            style={{
              flex: 1, resize: "none", border: "none", outline: "none", background: "transparent",
              fontSize: 13.5, lineHeight: 1.6, color: C.ink, fontFamily: "inherit", maxHeight: 90, padding: "4px 0",
            }}
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            aria-label="送信"
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none", cursor: busy || !input.trim() ? "not-allowed" : "pointer",
              background: busy || !input.trim() ? C.line : C.accent, color: "#fff", fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <p style={{ margin: "7px 0 0", textAlign: "center", fontSize: 10, color: C.sub }}>
          Claudeは間違えることがあります。重要な情報はご確認ください。
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   吹き出し
   ============================================================ */
function Bubble({ msg, last, busy, sp }: { msg: Msg; last: boolean; busy: boolean; sp: boolean }) {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ maxWidth: "82%", background: C.user, borderRadius: 14, padding: "9px 13px", fontSize: 13.5, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          {msg.text}
        </div>
      </div>
    );
  }
  const streaming = last && busy;
  return (
    <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
        ✳
      </span>
      <div style={{ minWidth: 0, maxWidth: sp ? "88%" : "84%" }}>
        {msg.thinking && (
          <details style={{ marginBottom: 6 }}>
            <summary style={{ fontSize: 11, color: C.sub, cursor: "pointer", fontWeight: 700 }}>🧠 思考プロセス（要約）</summary>
            <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.7, borderLeft: `2px solid ${C.line}`, padding: "4px 0 4px 10px", margin: "4px 0 2px", whiteSpace: "pre-wrap" }}>
              {msg.thinking}
            </div>
          </details>
        )}
        {msg.text === "" && streaming ? (
          <span style={{ fontSize: 13, color: C.sub }}>考え中…</span>
        ) : (
          <div style={{ fontSize: 13.5, lineHeight: 1.85, whiteSpace: "pre-wrap", color: msg.error ? "#A33" : C.ink }}>
            {msg.error && "⚠️ "}
            {msg.text}
            {streaming && <span style={{ color: C.accent }}>▍</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   設定モーダル（APIキー）
   ============================================================ */
function SettingsModal({
  initialKey, initialSave, initialUse, onClose, onApply,
}: {
  initialKey: string;
  initialSave: boolean;
  initialUse: boolean;
  onClose: () => void;
  onApply: (key: string, save: boolean, use: boolean) => void;
}) {
  const [key, setKey] = React.useState(initialKey);
  const [save, setSave] = React.useState(initialSave);
  const [use, setUse] = React.useState(initialUse || initialKey.length > 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(30,26,18,.5)" }} />
      <Card variant="pop" padding={22} style={{ position: "relative", width: "min(460px, 100%)", background: "var(--paper-0)" }} className="game-in">
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, marginBottom: 4 }}>⚙️ APIモード設定</div>
        <p style={{ fontSize: 12.5, lineHeight: 1.8, color: "var(--text-body)", margin: "0 0 12px" }}>
          AnthropicのAPIキー（sk-ant-…）を入れると、この再現画面のまま<b>本物のClaude</b>が応答します。
          キーは<b>あなたのブラウザからAnthropicに直接送信</b>され、COMIXAIのサーバーには一切送られません。
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (v && !key) setUse(true); // キーを入れた＝使いたい、とみなして自動ON
            if (!v) setUse(false);
            setKey(v);
          }}
          placeholder="sk-ant-api03-…"
          autoComplete="off"
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 13,
            border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 10, marginBottom: 10, background: "var(--paper-50)",
          }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={use} onChange={(e) => setUse(e.target.checked)} disabled={!key} />
          APIモードを有効にする（オフなら体験モードのまま）
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} disabled={!key} />
          この端末に保存する（localStorage）
        </label>
        <div style={{ fontSize: 11.5, lineHeight: 1.8, color: "var(--text-muted)", background: "var(--paper-100)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
          ・キーは <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red-600)" }}>console.anthropic.com</a> で発行できます（従量課金）<br />
          ・会話のたびにAPI利用料がかかります。1回の返答は通常数円以下です<br />
          ・共用PCでは「端末に保存」を外すのがおすすめです
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={onClose}>キャンセル</Button>
          <Button variant="primary" size="sm" onClick={() => onApply(key, save, use)}>保存する</Button>
        </div>
      </Card>
    </div>
  );
}
