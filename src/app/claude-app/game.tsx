"use client";
/* ============================================================
   「Claudeアプリ・シミュレーター」— Claudeアプリの画面
   （PC版・スマホ版）をブラウザ上に再現した体験UI。
   チャット／コワーク／コードの3モードをサイドバーで切替。
   体験モードは定型応答で完結、APIキーを設定すると本物の
   Claude（Anthropic API）にブラウザから直接つながる。
   ゲーム要素は載せていない素の「側」。学習コンテンツは
   この上に後から組める構成にしてある。
   ※ COMIXAIによる非公式の再現UI。Anthropic公式とは無関係。
   ============================================================ */
import React from "react";
import Anthropic from "@anthropic-ai/sdk";
import { Badge, Button, Card } from "../ds";

/* ———— アプリ再現UIの配色（Claude風・サイトDSとは独立） ———— */
const LIGHT = {
  bg: "#FAF9F5",
  panel: "#F0EEE6",
  line: "#E0DDD1",
  ink: "#3D3929",
  sub: "#87826F",
  accent: "#D97757",
  accentInk: "#B4542F",
  user: "#EEEBDF",
  input: "#FFFFFF",
};
/* コードモードはClaude Code風のダークターミナル */
const DARK = {
  bg: "#262521",
  panel: "#F0EEE6", // サイドバーは共通（ライト）
  line: "#403D35",
  ink: "#E9E6DB",
  sub: "#9B968A",
  accent: "#D97757",
  accentInk: "#E8A184",
  user: "#3A382F",
  input: "#1F1E1A",
};
const C = LIGHT; // サイドバー等の共通参照
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/* ———— モデル ———— */
type ModelId = "claude-opus-4-8" | "claude-sonnet-5" | "claude-haiku-4-5";
const MODELS: { id: ModelId; name: string; desc: string }[] = [
  { id: "claude-opus-4-8", name: "Opus 4.8", desc: "最高性能。じっくり考える難しい仕事に" },
  { id: "claude-sonnet-5", name: "Sonnet 5", desc: "バランス型。日常づかいの定番" },
  { id: "claude-haiku-4-5", name: "Haiku 4.5", desc: "軽快・高速。かんたんな作業に" },
];

/* ———— モード（チャット / コワーク / コード） ———— */
type Tab = "chat" | "cowork" | "code";
interface TabDef {
  id: Tab;
  icon: string;
  label: string;
  newLabel: string;
  listLabel: string;
  emptyNote: string;
  greet: string;
  placeholder: string;
  suggestions: string[];
}
const TABS: TabDef[] = [
  {
    id: "chat",
    icon: "💬",
    label: "チャット",
    newLabel: "新しいチャット",
    listLabel: "チャット",
    emptyNote: "まだ履歴はありません。最初のチャットを始めよう。",
    greet: "こんにちは。今日は何をしましょう？",
    placeholder: "Claudeにメッセージを送る…",
    suggestions: ["Claudeには何ができる？", "明日の朝礼の挨拶を考えて", "AIを使いこなすコツを3つ教えて"],
  },
  {
    id: "cowork",
    icon: "🤝",
    label: "コワーク",
    newLabel: "新しいタスク",
    listLabel: "タスク",
    emptyNote: "まだタスクはありません。仕事をひとつ任せてみよう。",
    greet: "どんな仕事をお任せしますか？",
    placeholder: "Claudeにお願いしたい仕事を伝える…",
    suggestions: ["競合3社の調査レポートを作って", "企画書のたたき台を作って", "レシートを経費一覧に整理して"],
  },
  {
    id: "code",
    icon: "⌨️",
    label: "コード",
    newLabel: "新しいセッション",
    listLabel: "セッション",
    emptyNote: "まだセッションはありません。作りたいものを伝えよう。",
    greet: "今日は何を作りますか？",
    placeholder: "作りたいもの・直したいものを伝える…",
    suggestions: ["おみくじアプリを作って", "TODOリストのWebアプリを作って", "ボタンの色をもっと目立たせて"],
  },
];
const tabDef = (t: Tab) => TABS.find((x) => x.id === t)!;

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
  kind: Tab;
  title: string;
  messages: Msg[];
}

/* ———— 体験モードの台本 ———— */
const CHAT_REPLIES: Record<string, string> = {
  "Claudeには何ができる？":
    "こんにちは！Claudeは、文章の作成・要約・翻訳、アイデア出し、表の整理、プログラムを書くことまで、「言葉で頼める仕事」ならたいてい手伝えます。\n\nたとえば——\n・長いメールを3行に要約\n・企画のたたき台を10案\n・ExcelのVLOOKUPの使い方を解説\n\n「こういうことできる？」と気軽に聞いてみるのがいちばんの近道です。",
  "明日の朝礼の挨拶を考えて":
    "いいですね。たとえばこんな挨拶はどうでしょう。\n\n「おはようございます。今週も折り返しですね。今日は午後に締め切りがひとつあるので、午前中は集中タイムでいきましょう。困りごとがあれば早めに共有してください。それでは今日も一日、よろしくお願いします！」\n\n「もっとカジュアルに」「半分の長さに」のような注文も、続けてどうぞ。",
  "AIを使いこなすコツを3つ教えて":
    "コツは3つあります。\n\n1. 背景ごと伝える —「誰向けに・何のために」を添えると精度が上がる\n2. 一度で完璧を求めない — 出てきたものに「もっと短く」「例を足して」と注文を重ねる\n3. 新しい話題は新しいチャットで — 文脈が混ざると答えもぶれる\n\nまずは小さな頼みごとから試してみてください。",
};
const CHAT_FALLBACK =
  "メッセージありがとうございます。いまは体験モードなので返事は定型文ですが、画面の使い方は本物のClaudeアプリと同じです。\n\n・返事はこうして少しずつ流れてきます（ストリーミング）\n・同じチャットなら文脈も引き継がれます\n・⚙️ 設定でAPIキーを入れると、本物のClaudeがここで答えます";
const CHAT_FOLLOWUP =
  "続けての質問ですね。同じチャットの中では、Claudeは前のやりとりを覚えたまま答えます。だから「さっきのをもっと短く」「それを英語で」のような指示が通じるんです。\n\n（体験モードのため定型の返事です。⚙️ 設定からAPIキーを入れると、この画面のまま本物のClaudeにつながります）";

const coworkReply = (task: string) =>
  `かしこまりました。「${task}」ですね。計画を立てて進めます。\n\n📋 計画\n ① 関連する資料・情報を確認\n ② たたき台を作成\n ③ 体裁を整えて仕上げ\n\n▸ ① 資料を確認中…\n   関連フォルダとメモを3件チェックしました\n▸ ② たたき台を作成中…\n   構成（背景 → 本題 → まとめ → 次のアクション）で作成\n▸ ③ 体裁を整えています…\n\n✅ 完了しました！\n📄 成果物：${task.slice(0, 10)}….docx\n\n（体験モードのため、作業と成果物はシミュレーションです。⚙️ 設定でAPIキーを入れると、本物のClaudeが実際の中身まで書きます）`;
const COWORK_FOLLOWUP =
  "追加のご注文ですね。同じタスクの続きとして反映します。\n\n▸ 修正箇所を確認中…\n▸ 反映しています…\n\n✅ 更新しました。コワークでは、こうして同じタスクに注文を重ねながら仕上げていけます。\n\n（体験モードのため定型の応答です）";

const codeReply = (task: string) =>
  `✳ 了解。「${task}」を進めます。\n\n● 計画\n  1. ファイルを作成\n  2. 実装\n  3. 動作確認\n\n● Write(index.html)\n  └ 68行を作成\n● Write(style.css)\n  └ 32行を作成\n● Bash(npx serve .)\n  └ ローカルで起動、表示OK\n\n✅ できました。ブラウザで動作を確認できます。\n\n（体験モードのため実行はシミュレーションです。⚙️ 設定でAPIキーを入れると、本物のClaudeがコードまで書きます）`;
const CODE_FOLLOWUP =
  "✳ 続きの指示ですね。同じセッションの文脈で対応します。\n\n● Edit(index.html)\n  └ ご指示を反映して6行を変更\n● Bash(reload)\n  └ 表示OK\n\n✅ 更新しました。\n\n（体験モードのため定型の応答です）";

/* ———— APIモードのシステムプロンプト（モード別） ———— */
const SYSTEM_PROMPTS: Record<Tab, string> = {
  chat:
    "あなたはClaudeです。COMIXAI（comixai.dev）のClaudeアプリ再現UIの中で、ユーザーと会話しています。日本語で、フレンドリーかつ簡潔に（目安300字以内で）答えてください。",
  cowork:
    "あなたはClaudeアプリの「コワーク」モードです。依頼された仕事を、①短い計画（箇条書き）→②作業ログ風の経過→③成果物の実際の中身、の順で日本語で出力してください。成果物パートは実際に使える品質で、全体は簡潔に。",
  code:
    "あなたはClaude Code（コードモード）です。依頼に対して、実行ステップのログ（● Write(ファイル名) のようなツール呼び出し風の短い行）を示したあと、主要なコードを1ブロックだけ提示してください。日本語で簡潔に。",
};

const KEY_STORAGE = "comixai-claude-app-key";

/* ============================================================ */
export function ClaudeAppSim() {
  /* —— 全体状態 —— */
  const [device, setDevice] = React.useState<"pc" | "sp">("pc");
  const [tab, setTab] = React.useState<Tab>("chat");
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [activeByTab, setActiveByTab] = React.useState<Record<Tab, number | null>>({ chat: null, cowork: null, code: null });
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

  const idRef = React.useRef(1);
  const genRef = React.useRef(0); // 体験モードのストリーム世代
  const streamRef = React.useRef<{ abort: () => void } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeId = activeByTab[tab];
  const active = chats.find((c) => c.id === activeId) ?? null;
  const tabChats = chats.filter((c) => c.kind === tab);

  /* —— 初期化：端末判定・保存済みキー —— */
  React.useEffect(() => {
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

  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  /* —— 操作 —— */
  /* 本物のアプリ同様、応答のストリーミング中でもモードや会話の移動は可能。
     進行中のストリームは chatId 宛てに書き込むので、裏でそのまま完了する。 */
  const switchTab = (t: Tab) => {
    setTab(t);
    setModelMenu(false);
    setDrawer(false);
  };
  const newChat = () => {
    setActiveByTab((prev) => ({ ...prev, [tab]: null }));
    setDrawer(false);
  };
  const openChat = (id: number) => {
    setActiveByTab((prev) => ({ ...prev, [tab]: id }));
    setDrawer(false);
  };
  const pickModel = (id: ModelId) => {
    setModelMenu(false);
    if (id === model) return;
    setModel(id);
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

    /* 会話（チャット/タスク/セッション）を用意（未作成なら新規） */
    let chat = active;
    if (!chat) {
      chat = { id: idRef.current++, kind: tab, title: text.length > 14 ? `${text.slice(0, 14)}…` : text, messages: [] };
      setChats((prev) => [chat as Chat, ...prev]);
      setActiveByTab((prev) => ({ ...prev, [tab]: (chat as Chat).id }));
    }
    const chatId = chat.id;
    const kind = chat.kind;
    const isFollowup = chat.messages.length >= 2;
    const history = chat.messages;

    setChats((prev) =>
      prev.map((c) => (c.id !== chatId ? c : { ...c, messages: [...c.messages, { role: "user", text }, { role: "assistant", text: "" }] })),
    );
    setBusyChat(chatId);

    if (apiMode && apiKey) {
      await sendApi(chatId, kind, [...history, { role: "user", text }]);
    } else {
      await sendDemo(chatId, kind, text, isFollowup);
    }
    setBusyChat(null);
  };

  /* —— 体験モード：定型応答を擬似ストリーミング —— */
  const sendDemo = async (chatId: number, kind: Tab, text: string, isFollowup: boolean) => {
    const gen = ++genRef.current;
    let reply: string;
    if (kind === "cowork") reply = isFollowup ? COWORK_FOLLOWUP : coworkReply(text);
    else if (kind === "code") reply = isFollowup ? CODE_FOLLOWUP : codeReply(text);
    else reply = isFollowup ? CHAT_FOLLOWUP : CHAT_REPLIES[text] ?? CHAT_FALLBACK;
    await new Promise((r) => setTimeout(r, 550));
    for (let i = 0; i < reply.length; i += 2) {
      if (genRef.current !== gen) return;
      const slice = reply.slice(0, i + 2);
      patchLast(chatId, (m) => ({ ...m, text: slice }));
      await new Promise((r) => setTimeout(r, 17));
    }
    if (genRef.current !== gen) return;
    patchLast(chatId, (m) => ({ ...m, text: reply }));
  };

  /* —— APIモード：Anthropic APIへブラウザから直接ストリーミング —— */
  const sendApi = async (chatId: number, kind: Tab, history: Msg[]) => {
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
        system: SYSTEM_PROMPTS[kind],
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

  /* ============================================================
     描画
     ============================================================ */
  const mainProps = {
    device,
    tab,
    chat: active,
    busy,
    streaming: !!active && busyChat === active.id,
    model,
    modelMenu,
    setModelMenu,
    pickModel,
    input,
    setInput,
    send,
    scrollRef,
    notify,
    openDrawer: () => setDrawer(true),
  };
  const sideProps = {
    tab,
    switchTab,
    chats: tabChats,
    activeId,
    onNew: newChat,
    onOpen: openChat,
  };

  return (
    <div style={{ position: "relative" }}>
      {/* —— 操作列：表示切替・モード —— */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 10, overflow: "hidden", background: "var(--paper-0)" }}>
          {(["pc", "sp"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
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
              minWidth: 680, height: 560, display: "flex", background: LIGHT.bg, color: LIGHT.ink,
              border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 14, boxShadow: "var(--shadow-pop)", overflow: "hidden",
            }}
          >
            <Sidebar {...sideProps} width={230} />
            <Main {...mainProps} />
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
          <div
            style={{
              position: "relative", background: tab === "code" ? DARK.bg : LIGHT.bg, color: tab === "code" ? DARK.ink : LIGHT.ink,
              borderRadius: 36, overflow: "hidden", height: 640, display: "flex", flexDirection: "column",
            }}
          >
            {/* ステータスバー */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 22px 4px", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>
              <span>9:41</span>
              <span style={{ letterSpacing: 2 }}>📶 🔋</span>
            </div>
            <Main {...mainProps} />
            {/* ドロワー */}
            {drawer && (
              <>
                <div onClick={() => setDrawer(false)} style={{ position: "absolute", inset: 0, background: "rgba(40,35,25,.4)", zIndex: 5 }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "82%", zIndex: 6, boxShadow: "4px 0 18px rgba(0,0,0,.25)" }}>
                  <Sidebar {...sideProps} width="100%" onClose={() => setDrawer(false)} />
                </div>
              </>
            )}
          </div>
        </div>
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
   モードナビ（チャット/コワーク/コード）＋一覧
   ============================================================ */
function Sidebar({
  tab, switchTab, chats, activeId, onNew, onOpen, width, onClose,
}: {
  tab: Tab;
  switchTab: (t: Tab) => void;
  chats: Chat[];
  activeId: number | null;
  onNew: () => void;
  onOpen: (id: number) => void;
  width: number | string;
  onClose?: () => void;
}) {
  const def = tabDef(tab);
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

      {/* —— モード切替ナビ —— */}
      <nav style={{ padding: "2px 10px 8px", display: "flex", flexDirection: "column", gap: 2 }} aria-label="モード切替">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              aria-current={on ? "page" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
                padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: on ? "#E4E1D3" : "transparent", color: on ? C.accentInk : C.ink,
                fontSize: 13.5, fontWeight: on ? 800 : 600,
                boxShadow: on ? `inset 3px 0 0 ${C.accent}` : "none",
              }}
            >
              <span style={{ fontSize: 15 }}>{t.icon}</span> {t.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "0 10px 10px" }}>
        <button
          onClick={onNew}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10,
            border: `1px solid ${C.line}`, background: C.bg, color: C.accentInk, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> {def.newLabel}
        </button>
      </div>
      <div style={{ padding: "2px 14px 6px", fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: ".06em" }}>{def.listLabel}</div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {chats.length === 0 && (
          <p style={{ fontSize: 12, color: C.sub, padding: "4px 8px", lineHeight: 1.7 }}>{def.emptyNote}</p>
        )}
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => onOpen(c.id)}
            style={{
              width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: c.id === activeId ? "#E4E1D3" : "transparent", color: C.ink, fontSize: 13, fontWeight: c.id === activeId ? 700 : 500,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2, display: "block",
            }}
          >
            {tabDef(c.kind).icon} {c.title}
          </button>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.line}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
          あ
        </span>
        <span style={{ fontSize: 12.5 }}>
          <b>あなた</b>
          <span style={{ color: C.sub }}>（フリープラン）</span>
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   メイン画面（ヘッダー・本文・入力欄）— モードでテーマが変わる
   ============================================================ */
function Main({
  device, tab, chat, busy, streaming, model, modelMenu, setModelMenu, pickModel, input, setInput, send, scrollRef, notify, openDrawer,
}: {
  device: "pc" | "sp";
  tab: Tab;
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
  const def = tabDef(tab);
  const T = tab === "code" ? DARK : LIGHT; // モード別テーマ
  const modelInfo = MODELS.find((m) => m.id === model)!;
  const empty = !chat || chat.messages.length === 0;

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative", background: T.bg, color: T.ink }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: device === "sp" ? "8px 12px" : "12px 16px", borderBottom: `1px solid ${T.line}` }}>
        {device === "sp" && (
          <button onClick={openDrawer} aria-label="メニュー" style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", color: T.ink, padding: "0 2px" }}>
            ☰
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ color: T.sub, fontWeight: 800, fontSize: 11, marginRight: 8, letterSpacing: ".05em" }}>{def.icon} {def.label}</span>
          {chat ? chat.title : def.newLabel}
        </div>
        {/* モデルセレクタ */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setModelMenu(!modelMenu)}
            style={{
              display: "flex", alignItems: "center", gap: 5, border: `1px solid ${T.line}`, background: T.bg,
              borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: T.ink, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {modelInfo.name} <span style={{ fontSize: 9, color: T.sub }}>▼</span>
          </button>
          {modelMenu && (
            <>
              <div onClick={() => setModelMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 8 }} />
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 9, width: 240, background: T.bg, border: `1px solid ${T.line}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(40,35,25,.28)", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px 4px", fontSize: 10.5, fontWeight: 700, color: T.sub, letterSpacing: ".05em" }}>モデルを選択</div>
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => pickModel(m.id)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: m.id === model ? (tab === "code" ? "#33312A" : LIGHT.panel) : "transparent", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>
                      {m.name} {m.id === model && <span style={{ color: T.accent }}>✓</span>}
                    </span>
                    <span style={{ display: "block", fontSize: 11, color: T.sub, marginTop: 1 }}>{m.desc}</span>
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
            <div style={{ fontSize: 34, color: T.accent }}>{tab === "code" ? "✳" : tab === "cowork" ? "🤝" : "✳"}</div>
            <div style={{ fontFamily: tab === "code" ? MONO : SERIF, fontSize: device === "sp" ? 18 : tab === "code" ? 19 : 23, color: T.ink }}>
              {def.greet}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12, width: "100%", maxWidth: 320 }}>
              {def.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={busy}
                  style={{
                    padding: "9px 14px", borderRadius: 12, border: `1px solid ${T.line}`, background: T.input,
                    color: T.ink, fontSize: 12.5, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  💡 {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chat!.messages.map((m, i) => (
            <Bubble key={i} msg={m} last={i === chat!.messages.length - 1} busy={streaming} sp={device === "sp"} kind={chat!.kind} />
          ))
        )}
      </div>

      {/* 入力欄 */}
      <div style={{ padding: device === "sp" ? "8px 10px 14px" : "10px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, border: `1.5px solid ${T.line}`, borderRadius: 18, background: T.input, padding: "8px 10px" }}>
          <button
            onClick={() => notify("📎 添付は本物のアプリの機能。この再現UIでは省略しています")}
            aria-label="添付"
            style={{ border: "none", background: "transparent", fontSize: 17, cursor: "pointer", color: T.sub, padding: "3px 2px" }}
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
            placeholder={def.placeholder}
            rows={1}
            style={{
              flex: 1, resize: "none", border: "none", outline: "none", background: "transparent",
              fontSize: 13.5, lineHeight: 1.6, color: T.ink, fontFamily: "inherit", maxHeight: 90, padding: "4px 0",
            }}
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            aria-label="送信"
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none", cursor: busy || !input.trim() ? "not-allowed" : "pointer",
              background: busy || !input.trim() ? T.line : T.accent, color: "#fff", fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <p style={{ margin: "7px 0 0", textAlign: "center", fontSize: 10, color: T.sub }}>
          Claudeは間違えることがあります。重要な情報はご確認ください。
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   吹き出し（chat）／作業ログ（cowork）／ターミナル行（code）
   ============================================================ */
function Bubble({ msg, last, busy, sp, kind }: { msg: Msg; last: boolean; busy: boolean; sp: boolean; kind: Tab }) {
  const T = kind === "code" ? DARK : LIGHT;
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ maxWidth: "82%", background: T.user, color: T.ink, borderRadius: 14, padding: "9px 13px", fontSize: 13.5, lineHeight: 1.75, whiteSpace: "pre-wrap", fontFamily: kind === "code" ? MONO : "inherit" }}>
          {msg.text}
        </div>
      </div>
    );
  }
  const streaming = last && busy;
  const logStyle = kind !== "chat";
  return (
    <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: T.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
        ✳
      </span>
      <div style={{ minWidth: 0, maxWidth: sp ? "88%" : "84%", flex: logStyle ? 1 : undefined }}>
        {msg.thinking && (
          <details style={{ marginBottom: 6 }}>
            <summary style={{ fontSize: 11, color: T.sub, cursor: "pointer", fontWeight: 700 }}>🧠 思考プロセス（要約）</summary>
            <div style={{ fontSize: 11.5, color: T.sub, lineHeight: 1.7, borderLeft: `2px solid ${T.line}`, padding: "4px 0 4px 10px", margin: "4px 0 2px", whiteSpace: "pre-wrap" }}>
              {msg.thinking}
            </div>
          </details>
        )}
        {msg.text === "" && streaming ? (
          <span style={{ fontSize: 13, color: T.sub, fontFamily: logStyle ? MONO : "inherit" }}>
            {kind === "cowork" ? "段取り中…" : kind === "code" ? "計画中…" : "考え中…"}
          </span>
        ) : logStyle ? (
          /* コワーク＝作業ログカード／コード＝ターミナル */
          <div
            style={{
              fontSize: kind === "code" ? 12.5 : 13,
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
              fontFamily: MONO,
              color: msg.error ? (kind === "code" ? "#F0A9A0" : "#A33") : T.ink,
              background: kind === "code" ? "#1F1E1A" : "#FFFFFF",
              border: `1px solid ${T.line}`,
              borderRadius: 12,
              padding: "12px 14px",
              overflowX: "auto",
            }}
          >
            {msg.error && "⚠️ "}
            {msg.text}
            {streaming && <span style={{ color: T.accent }}>▍</span>}
          </div>
        ) : (
          <div style={{ fontSize: 13.5, lineHeight: 1.85, whiteSpace: "pre-wrap", color: msg.error ? "#A33" : T.ink }}>
            {msg.error && "⚠️ "}
            {msg.text}
            {streaming && <span style={{ color: T.accent }}>▍</span>}
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
          AnthropicのAPIキー（sk-ant-…）を入れると、チャット・コワーク・コードの3モードすべてで<b>本物のClaude</b>が応答します。
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
