"use client";
/* ============================================================
   「Claudeアプリ・シミュレーター」— Claudeデスクトップアプリの
   画面（PC版・スマホ版）をブラウザ上に再現した体験UI。

   最新（2026年7月）の公式ドキュメントに合わせた構成：
   - ウィンドウ上部中央に「チャット / Cowork / コード」の3タブ
     （code.claude.com/docs/en/desktop-quickstart:
      "Click the Code tab at the top center"）
   - チャット   … claude.ai同等の会話（ファイルアクセスなし）
   - Cowork    … クラウドVMで動く自律エージェント（放置OK）
   - コード     … セッション制。環境(Local/Remote/SSH)・フォルダ・
                  権限モード(Manual/Accept edits/Plan/Auto)を
                  入力欄まわりで設定し、diff（+12 -1）を
                  Accept/Rejectで承認する
   - スマホはサイドバー（ドロワー）からモードを開始

   体験モードは定型応答で完結、APIキーを設定すると本物の
   Claude（Anthropic API）にブラウザから直接つながる。
   ※ COMIXAIによる非公式の再現UI。Anthropic公式とは無関係。

   学習コンテンツの土台となるベース機能（CONTENT_PLAN.md参照）：
   - 体験モードの応答はシナリオ（Step列）でデータ駆動
     （scenarios.ts。`scenarios` propでコース用台本に差し替え可能）
   - 成果物カード＋プレビュー（Webは実際に動くiframe、docは紙面）
   - ファイル編集のdiff承認に加え、コマンド実行の承認カード
   - フォルダ選択メニュー＋アクセス許可（信頼）ダイアログ
   - 主要操作を通知する `onEvent` フック（ミッション達成判定用）
   ============================================================ */
import React from "react";
import Anthropic from "@anthropic-ai/sdk";
import { Badge, Button, Card } from "../ds";
import {
  CHAT_SUGGESTIONS,
  CODE_SUGGESTIONS,
  COWORK_SUGGESTIONS,
  SKILL_NAME,
  DEFAULT_SCENARIOS,
  type ArtifactSpec,
  type ChoiceGroup,
  type DiffSpec,
  type FigureSpec,
  type PermMode,
  type ScenarioSet,
  type Step,
  type Tab,
} from "./scenarios";

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
  input: "#FFFFFF",
  green: "#3E7B4F",
  red: "#B4453A",
  diffAdd: "#EAF3EA",
  diffDel: "#F9ECEA",
};
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/* ———— モデル ———— */
type ModelId = "claude-opus-4-8" | "claude-sonnet-5" | "claude-haiku-4-5";
const MODELS: { id: ModelId; name: string; desc: string }[] = [
  { id: "claude-opus-4-8", name: "Opus 4.8", desc: "最高性能。じっくり考える難しい仕事に" },
  { id: "claude-sonnet-5", name: "Sonnet 5", desc: "バランス型。日常づかいの定番" },
  { id: "claude-haiku-4-5", name: "Haiku 4.5", desc: "軽快・高速。かんたんな作業に" },
];

/* ———— 権限モード（コードタブ） ———— */
const PERM_MODES: { id: PermMode; name: string; desc: string }[] = [
  { id: "manual", name: "Manual", desc: "編集やコマンドの前に毎回確認（初心者向け）" },
  { id: "acceptEdits", name: "Accept edits", desc: "ファイル編集は自動承認、コマンドは確認" },
  { id: "plan", name: "Plan", desc: "まず計画だけ提案。ファイルは変更しない" },
  { id: "auto", name: "Auto", desc: "安全チェックつきで自動実行" },
];

/* ———— 実行環境（コードタブ） ———— */
type EnvId = "local" | "remote" | "ssh";
const ENVS: { id: EnvId; name: string; desc: string }[] = [
  { id: "local", name: "ローカル", desc: "この端末のファイルで作業" },
  { id: "remote", name: "リモート", desc: "クラウドで実行。アプリを閉じても継続" },
  { id: "ssh", name: "SSH", desc: "自分のサーバーに接続して作業" },
];

/* ———— フォルダ候補（フォルダ選択メニュー） ———— */
const FOLDERS: { id: string; name: string; desc: string }[] = [
  { id: "~/デスクトップ/営業資料", name: "営業資料", desc: "~/デスクトップ/営業資料" },
  { id: "~/書類/経費精算", name: "経費精算", desc: "~/書類/経費精算" },
  { id: "~/projects/my-app", name: "my-app", desc: "~/projects/my-app" },
];

/* ———— タブ（上部中央） ———— */
interface TabDef {
  id: Tab;
  icon: string;
  label: string;
  newLabel: string;
  listLabel: string;
  emptyNote: string;
  greet: string;
  sub: string;
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
    sub: "",
    placeholder: "Claudeにメッセージを送る…",
    suggestions: CHAT_SUGGESTIONS,
  },
  {
    id: "cowork",
    icon: "🤝",
    label: "Cowork",
    newLabel: "新しいタスク",
    listLabel: "タスク",
    emptyNote: "まだタスクはありません。仕事をひとつ任せてみよう。",
    greet: "どんな仕事をお任せしますか？",
    sub: "クラウド上の専用マシンで自律的に作業します。アプリを閉じてもOK。",
    placeholder: "Claudeにお願いしたい仕事を伝える…",
    suggestions: COWORK_SUGGESTIONS,
  },
  {
    id: "code",
    icon: "⌨️",
    label: "コード",
    newLabel: "新しいセッション",
    listLabel: "セッション",
    emptyNote: "まだセッションはありません。作りたいものを伝えよう。",
    greet: "今日は何を作りますか？",
    sub: "各セッションが独立したフォルダ・変更履歴を持ちます。",
    placeholder: "作りたいもの・直したいものを伝える…",
    suggestions: CODE_SUGGESTIONS,
  },
];
const tabDef = (t: Tab) => TABS.find((x) => x.id === t)!;

/* ———— メッセージ ———— */
type Diff = DiffSpec & { state: "pending" | "accepted" | "rejected" | "auto" };
interface Approval {
  command: string;
  note?: string;
  state: "pending" | "allowed" | "denied" | "auto";
}
interface Choices {
  groups: ChoiceGroup[];
  state: "pending" | "answered";
  answers?: string[];
}
interface Msg {
  role: "user" | "assistant";
  text: string;
  thinking?: string; // APIモード：思考の要約
  diff?: Diff; // コードタブ：変更提案
  approval?: Approval; // コマンド実行の承認カード
  artifact?: ArtifactSpec; // 成果物カード（プレビュー可能）
  choices?: Choices; // 選択式の質問（AskUserQuestion風）
  figure?: FigureSpec; // チャット内に直接描画する図解ブロック
  error?: boolean;
  raw?: unknown; // APIモード：返答のcontentブロック（再送用にそのまま保持）
}
interface Chat {
  id: number;
  kind: Tab;
  title: string;
  messages: Msg[];
}

/* ———— 学習レイヤー向けイベント（onEventで通知） ———— */
export type SimEvent =
  | { type: "deviceChange"; device: "pc" | "sp" }
  | { type: "tabChange"; tab: Tab }
  | { type: "newChat"; tab: Tab }
  | { type: "openChat"; tab: Tab; chatId: number }
  | { type: "send"; tab: Tab; chatId: number; text: string; api: boolean }
  | { type: "modelChange"; model: ModelId }
  | { type: "permChange"; permMode: PermMode }
  | { type: "envChange"; env: EnvId }
  | { type: "folderChange"; folder: string }
  | { type: "diffResolved"; chatId: number; accepted: boolean }
  | { type: "approvalResolved"; chatId: number; allowed: boolean }
  | { type: "artifactOpen"; title: string }
  | { type: "scenarioDone"; tab: Tab; chatId: number }
  | { type: "apiMode"; on: boolean };

/* ———— APIモードのシステムプロンプト（タブ別） ———— */
const SYSTEM_PROMPTS: Record<Tab, string> = {
  chat:
    "あなたはClaudeです。COMIXAI（comixai.dev）のClaudeアプリ再現UIの中で、ユーザーと会話しています。日本語で、フレンドリーかつ簡潔に（目安300字以内で）答えてください。",
  cowork:
    "あなたはClaudeデスクトップアプリの「Cowork」タブ（クラウドVMで動く自律エージェント）です。依頼された仕事を、①短い計画（箇条書き）→②作業ログ風の経過→③成果物の実際の中身、の順で日本語で出力してください。成果物パートは実際に使える品質で、全体は簡潔に。",
  code:
    "あなたはClaudeデスクトップアプリの「コード」タブ（Claude Code）です。依頼に対して、実行ステップのログ（● Write(ファイル名) のようなツール呼び出し風の短い行）を示したあと、主要なコードを1ブロックだけ提示してください。日本語で簡潔に。",
};

const KEY_STORAGE = "comixai-claude-app-key";

/* ============================================================ */
export function ClaudeAppSim({
  scenarios,
  onEvent,
}: {
  /** 体験モードの台本を差し替える（学習コンテンツ側が使う） */
  scenarios?: Partial<ScenarioSet>;
  /** 主要操作の通知（ミッション達成判定などに使う） */
  onEvent?: (e: SimEvent) => void;
} = {}) {
  /* —— 全体状態 —— */
  const [device, setDevice] = React.useState<"pc" | "sp">("pc");
  const [tab, setTab] = React.useState<Tab>("chat");
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [activeByTab, setActiveByTab] = React.useState<Record<Tab, number | null>>({ chat: null, cowork: null, code: null });
  const [model, setModel] = React.useState<ModelId>("claude-opus-4-8");
  const [permMode, setPermMode] = React.useState<PermMode>("manual");
  const [env, setEnv] = React.useState<EnvId>("local");
  const [folder, setFolder] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [busyChat, setBusyChat] = React.useState<number | null>(null);
  const busy = busyChat !== null;
  const [drawer, setDrawer] = React.useState(false);
  const [menu, setMenu] = React.useState<"model" | "perm" | "env" | "folder" | null>(null);
  const [settings, setSettings] = React.useState(false);
  const [apiKey, setApiKey] = React.useState("");
  const [saveKey, setSaveKey] = React.useState(false);
  const [apiMode, setApiMode] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [trustAsk, setTrustAsk] = React.useState<string | null>(null); // フォルダ許可ダイアログ
  const [viewArtifact, setViewArtifact] = React.useState<ArtifactSpec | null>(null); // 成果物プレビュー
  const [skills, setSkills] = React.useState<string[]>([]); // 作成済みスキル（/で呼び出し）

  const idRef = React.useRef(1);
  const genRef = React.useRef(0); // 体験モードのストリーム世代
  const streamRef = React.useRef<{ abort: () => void } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = React.useRef(new Map<number, { yes: Step[]; no: Step[] }>()); // 承認待ちの続き
  const trustedRef = React.useRef(new Set<string>()); // アクセス許可済みフォルダ
  const onEventRef = React.useRef(onEvent);
  onEventRef.current = onEvent;
  const emit = (e: SimEvent) => onEventRef.current?.(e);
  const scen: ScenarioSet = { ...DEFAULT_SCENARIOS, ...scenarios };

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
  /* 本物のアプリ同様、応答のストリーミング中でもタブや会話の移動は可能。
     進行中のストリームは chatId 宛てに書き込むので、裏でそのまま完了する。 */
  const switchTab = (t: Tab) => {
    setTab(t);
    setMenu(null);
    setDrawer(false);
    emit({ type: "tabChange", tab: t });
  };
  const newChat = () => {
    setActiveByTab((prev) => ({ ...prev, [tab]: null }));
    setDrawer(false);
    emit({ type: "newChat", tab });
  };
  const openChat = (id: number) => {
    setActiveByTab((prev) => ({ ...prev, [tab]: id }));
    setDrawer(false);
    emit({ type: "openChat", tab, chatId: id });
  };
  const pickModel = (id: ModelId) => {
    setMenu(null);
    if (id === model) return;
    setModel(id);
    notify(`🎛️ モデルを ${MODELS.find((m) => m.id === id)?.name} に切り替えました`);
    emit({ type: "modelChange", model: id });
  };
  const pickPerm = (id: PermMode) => {
    setMenu(null);
    if (id === permMode) return;
    setPermMode(id);
    notify(`🛡️ 権限モード：${PERM_MODES.find((m) => m.id === id)?.name}`);
    emit({ type: "permChange", permMode: id });
  };
  const pickEnv = (id: EnvId) => {
    setMenu(null);
    if (id === env) return;
    setEnv(id);
    notify(`🖥️ 実行環境：${ENVS.find((m) => m.id === id)?.name}`);
    emit({ type: "envChange", env: id });
  };
  /* フォルダ選択 → 未許可なら「アクセス許可」ダイアログを挟む（本物の初回体験を再現） */
  const pickFolder = (path: string) => {
    setMenu(null);
    if (trustedRef.current.has(path)) {
      setFolder(path);
      emit({ type: "folderChange", folder: path });
      return;
    }
    setTrustAsk(path);
  };
  const grantFolder = (ok: boolean) => {
    const path = trustAsk;
    setTrustAsk(null);
    if (!ok || !path) return;
    trustedRef.current.add(path);
    setFolder(path);
    notify(`📁 「${path}」へのアクセスを許可しました`);
    emit({ type: "folderChange", folder: path });
  };

  /* —— メッセージ更新ヘルパ —— */
  const patchLast = (chatId: number, patch: (m: Msg) => Msg) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id !== chatId ? c : { ...c, messages: c.messages.map((m, i) => (i === c.messages.length - 1 ? patch(m) : m)) },
      ),
    );
  };
  const pushMsg = (chatId: number, msg: Msg) => {
    setChats((prev) => prev.map((c) => (c.id !== chatId ? c : { ...c, messages: [...c.messages, msg] })));
  };

  /* —— 擬似ストリーミング共通 ——
     経過時間ベースで表示量を決める（バックグラウンドタブでタイマーが
     間引かれても、戻った瞬間に本来の位置まで追いつく） */
  const streamText = async (chatId: number, reply: string, gen: number) => {
    const t0 = Date.now();
    for (;;) {
      if (genRef.current !== gen) return false;
      const n = Math.min(reply.length, Math.floor(((Date.now() - t0) / 17) * 2));
      patchLast(chatId, (m) => ({ ...m, text: reply.slice(0, n) }));
      if (n >= reply.length) return true;
      await new Promise((r) => setTimeout(r, 30));
    }
  };

  /* —— 送信 —— */
  const send = async (textRaw?: string) => {
    const text = (textRaw ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setMenu(null);

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
    emit({ type: "send", tab: kind, chatId, text, api: apiMode && !!apiKey });

    /* 「スキルにして」でスキルを登録（以後は入力欄の「/」から呼び出せる） */
    if (kind === "code" && (text.includes("スキルにして") || text.includes("スキル化"))) {
      setSkills((prev) => (prev.includes(SKILL_NAME) ? prev : [...prev, SKILL_NAME]));
    }

    if (apiMode && apiKey) {
      await sendApi(chatId, kind, [...history, { role: "user", text }]);
      setBusyChat(null);
    } else {
      /* 体験モード：シナリオ（Step列）を再生。承認待ちのときは
         runSteps内でbusyが解除され、続きはresolvePendingが再開する */
      const gen = ++genRef.current;
      const steps = scen[kind]({ text, isFollowup, firstText: history[0]?.text ?? text, permMode, folder });
      await new Promise((r) => setTimeout(r, 500));
      await runSteps(chatId, kind, steps, gen, true);
    }
  };

  /* —— シナリオ実行エンジン：Step列を順に再生 —— */
  const runSteps = async (chatId: number, kind: Tab, steps: Step[], gen: number, seeded = false) => {
    let useSeed = seeded; // send()が積んだ空のassistantメッセージを最初のステップが使い回す
    const place = (msg: Msg) => {
      if (useSeed) {
        useSeed = false;
        patchLast(chatId, () => msg);
      } else {
        pushMsg(chatId, msg);
      }
    };
    for (const step of steps) {
      if (genRef.current !== gen) return;
      if (step.type === "text") {
        place({ role: "assistant", text: "" });
        await new Promise((r) => setTimeout(r, 400));
        if (!(await streamText(chatId, step.text, gen))) return;
      } else if (step.type === "artifact") {
        await new Promise((r) => setTimeout(r, 350));
        place({ role: "assistant", text: "", artifact: step.artifact });
      } else if (step.type === "choices") {
        /* 選択式の質問: 回答が resolveChoices → send() で次のユーザー発言になる */
        await new Promise((r) => setTimeout(r, 350));
        place({ role: "assistant", text: step.text, choices: { groups: step.groups, state: "pending" } });
        setBusyChat(null);
        return;
      } else if (step.type === "figure") {
        /* チャット内図解: 返信の一部としてそのまま描画される */
        await new Promise((r) => setTimeout(r, 350));
        place({ role: "assistant", text: step.text ?? "", figure: step.figure });
      } else if (step.type === "diff") {
        /* Manual / Plan は承認待ち。Accept edits / Auto は自動承認して続行 */
        const wait = permMode === "manual" || permMode === "plan";
        place({ role: "assistant", text: "", diff: { ...step.diff, state: wait ? "pending" : "auto" } });
        if (wait) {
          pendingRef.current.set(chatId, { yes: step.accept, no: step.reject });
          setBusyChat(null);
          return;
        }
        await new Promise((r) => setTimeout(r, 400));
        await runSteps(chatId, kind, step.accept, gen);
        return;
      } else if (step.type === "approval") {
        /* コマンド実行は Auto のみ自動承認（Accept editsでも確認する＝本物と同じ） */
        const wait = permMode !== "auto";
        place({ role: "assistant", text: "", approval: { command: step.command, note: step.note, state: wait ? "pending" : "auto" } });
        if (wait) {
          pendingRef.current.set(chatId, { yes: step.allow, no: step.deny });
          setBusyChat(null);
          return;
        }
        await new Promise((r) => setTimeout(r, 400));
        await runSteps(chatId, kind, step.allow, gen);
        return;
      }
    }
    setBusyChat(null);
    emit({ type: "scenarioDone", tab: kind, chatId });
  };

  /* —— 承認（diff / コマンド実行）のはい・いいえ —— */
  const resolvePending = async (chatId: number, yes: boolean, kind: "diff" | "approval") => {
    if (busy) return;
    const cont = pendingRef.current.get(chatId);
    if (!cont) return;
    pendingRef.current.delete(chatId);
    setChats((prev) =>
      prev.map((c) =>
        c.id !== chatId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) => {
                if (kind === "diff" && m.diff?.state === "pending")
                  return { ...m, diff: { ...m.diff, state: yes ? "accepted" : "rejected" } };
                if (kind === "approval" && m.approval?.state === "pending")
                  return { ...m, approval: { ...m.approval, state: yes ? "allowed" : "denied" } };
                return m;
              }),
            },
      ),
    );
    const tabKind = chats.find((c) => c.id === chatId)?.kind ?? tab;
    setBusyChat(chatId);
    emit(kind === "diff" ? { type: "diffResolved", chatId, accepted: yes } : { type: "approvalResolved", chatId, allowed: yes });
    const gen = ++genRef.current;
    await new Promise((r) => setTimeout(r, 400));
    await runSteps(chatId, tabKind, yes ? cont.yes : cont.no, gen);
  };
  const resolveDiff = (chatId: number, accept: boolean) => resolvePending(chatId, accept, "diff");
  const resolveApproval = (chatId: number, allow: boolean) => resolvePending(chatId, allow, "approval");

  /* —— 選択式質問への回答: 選んだ内容をユーザー発言として送信 —— */
  const resolveChoices = (chatId: number, answers: string[]) => {
    if (busy) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id !== chatId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.choices?.state === "pending" ? { ...m, choices: { ...m.choices, state: "answered", answers } } : m,
              ),
            },
      ),
    );
    send(answers.join("／"));
  };

  /* —— 成果物プレビュー —— */
  const openArtifact = (a: ArtifactSpec) => {
    setViewArtifact(a);
    emit({ type: "artifactOpen", title: a.title });
  };

  /* —— スキル呼び出し（入力欄の「/」ポップアップから） —— */
  const useSkill = (name: string) => {
    setInput("");
    send(`/${name}`);
  };

  /* —— APIモード：Anthropic APIへブラウザから直接ストリーミング —— */
  const sendApi = async (chatId: number, kind: Tab, history: Msg[]) => {
    try {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      const messages: Anthropic.MessageParam[] = history
        .filter((m) => m.text !== "" || m.raw)
        .map((m) =>
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
    emit({ type: "apiMode", on: useApi && key.length > 0 });
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
    permMode,
    env,
    folder,
    menu,
    setMenu,
    pickModel,
    pickPerm,
    pickEnv,
    pickFolder,
    input,
    setInput,
    send,
    resolveDiff,
    resolveApproval,
    resolveChoices,
    openArtifact,
    skills,
    useSkill,
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
              data-guide={`device-${d}`}
              onClick={() => {
                setDevice(d);
                emit({ type: "deviceChange", device: d });
              }}
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
              minWidth: 680, height: 600, display: "flex", flexDirection: "column", background: C.bg, color: C.ink,
              border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 14, boxShadow: "var(--shadow-pop)", overflow: "hidden",
            }}
          >
            {/* —— ウィンドウ上部：タイトルバー＋中央タブ —— */}
            <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.line}`, background: C.panel }}>
              <div style={{ display: "flex", gap: 6, width: 120 }}>
                {["#EC6A5E", "#F4BF4F", "#61C554"].map((c) => (
                  <span key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, display: "inline-block" }} />
                ))}
              </div>
              {/* 上部中央のタブ（Chat / Cowork / Code） */}
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ display: "inline-flex", background: "#E4E1D3", borderRadius: 9, padding: 3, gap: 2 }} role="tablist" aria-label="モード切替">
                  {TABS.map((t) => {
                    const on = t.id === tab;
                    return (
                      <button
                        key={t.id}
                        role="tab"
                        aria-selected={on}
                        data-guide={`tab-${t.id}`}
                        onClick={() => switchTab(t.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "6px 18px", borderRadius: 7,
                          border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: on ? 800 : 600,
                          background: on ? C.bg : "transparent", color: on ? C.ink : C.sub,
                          boxShadow: on ? "0 1px 3px rgba(40,35,25,.15)" : "none",
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ width: 120, textAlign: "right", color: C.sub, fontSize: 13 }}>⊕ ⚙</div>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <Sidebar {...sideProps} width={224} showNav={false} />
              <Main {...mainProps} />
            </div>
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
            <Main {...mainProps} />
            {/* ドロワー（スマホはサイドバーからモードを開始） */}
            {drawer && (
              <>
                <div onClick={() => setDrawer(false)} style={{ position: "absolute", inset: 0, background: "rgba(40,35,25,.4)", zIndex: 5 }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "82%", zIndex: 6, boxShadow: "4px 0 18px rgba(0,0,0,.25)" }}>
                  <Sidebar {...sideProps} width="100%" onClose={() => setDrawer(false)} showNav />
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

      {/* —— フォルダのアクセス許可ダイアログ —— */}
      {trustAsk && <TrustDialog folder={trustAsk} onResolve={grantFolder} />}

      {/* —— 成果物プレビュー —— */}
      {viewArtifact && <ArtifactModal artifact={viewArtifact} onClose={() => setViewArtifact(null)} />}

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
   フォルダのアクセス許可（信頼）ダイアログ
   本物のアプリで初めてフォルダを渡すときの確認を再現
   ============================================================ */
function TrustDialog({ folder, onResolve }: { folder: string; onResolve: (ok: boolean) => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={() => onResolve(false)} style={{ position: "absolute", inset: 0, background: "rgba(30,26,18,.5)" }} />
      <div
        className="game-in"
        style={{ position: "relative", width: "min(400px, 100%)", background: C.bg, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 16, boxShadow: "0 18px 50px rgba(0,0,0,.3)", padding: 22 }}
      >
        <div style={{ fontSize: 30, marginBottom: 8 }}>📁</div>
        <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 8 }}>このフォルダへのアクセスを許可しますか？</div>
        <div style={{ fontFamily: MONO, fontSize: 12.5, background: C.panel, borderRadius: 8, padding: "7px 10px", marginBottom: 10 }}>{folder}</div>
        <p style={{ fontSize: 12, lineHeight: 1.8, color: C.sub, margin: "0 0 16px" }}>
          許可すると、Claudeがこのフォルダの中のファイルを読み取り・作成・編集できるようになります。フォルダの外には触れません。
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onResolve(true)}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: C.accent, color: "#fff", fontWeight: 800, fontSize: 13, fontFamily: "inherit" }}
          >
            許可する
          </button>
          <button
            onClick={() => onResolve(false)}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, cursor: "pointer", background: "transparent", color: C.ink, fontWeight: 800, fontSize: 13, fontFamily: "inherit" }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   成果物プレビュー — webは実際に動くiframe、doc/sheetは紙面風
   ============================================================ */
function ArtifactModal({ artifact, onClose }: { artifact: ArtifactSpec; onClose: () => void }) {
  const icon = artifact.kind === "web" ? "🌐" : artifact.kind === "sheet" ? "📊" : "📄";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(30,26,18,.55)" }} />
      <div
        className="game-in"
        style={{
          position: "relative", width: "min(560px, 100%)", maxHeight: "86vh", display: "flex", flexDirection: "column",
          background: C.bg, border: `1px solid ${C.line}`, borderRadius: 16, boxShadow: "0 18px 50px rgba(0,0,0,.35)", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 16px", borderBottom: `1px solid ${C.line}`, background: C.panel }}>
          <span style={{ fontSize: 17 }}>{icon}</span>
          <span style={{ fontWeight: 800, fontSize: 13.5, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artifact.title}</span>
          {artifact.kind === "web" && <span style={{ fontSize: 10.5, color: C.sub, fontWeight: 700, flexShrink: 0 }}>実際に動きます</span>}
          <button onClick={onClose} aria-label="閉じる" style={{ marginLeft: "auto", border: "none", background: "transparent", fontSize: 20, cursor: "pointer", color: C.sub }}>
            ×
          </button>
        </div>
        {artifact.kind === "web" ? (
          <iframe
            title={artifact.title}
            sandbox="allow-scripts"
            srcDoc={artifact.html ?? ""}
            style={{ border: "none", width: "100%", height: "min(460px, 64vh)", background: "#fff" }}
          />
        ) : (
          <div style={{ overflowY: "auto", padding: "26px 30px", background: "#FFFFFF" }}>
            {(artifact.body ?? "").split("\n").map((line, i) =>
              line.startsWith("# ") ? (
                <h3 key={i} style={{ fontFamily: SERIF, fontSize: 19, margin: "0 0 14px", color: C.ink }}>{line.slice(2)}</h3>
              ) : line.startsWith("## ") ? (
                <h4 key={i} style={{ fontSize: 14, margin: "18px 0 6px", color: C.ink }}>{line.slice(3)}</h4>
              ) : line === "" ? (
                <div key={i} style={{ height: 8 }} />
              ) : (
                <p
                  key={i}
                  style={{ fontSize: 13, lineHeight: 1.9, margin: 0, color: C.ink, fontFamily: artifact.kind === "sheet" ? MONO : "inherit", whiteSpace: "pre-wrap" }}
                >
                  {line}
                </p>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   サイドバー（PC常設／スマホはドロワー）
   PCはタブがウィンドウ上部にあるため、ここは一覧のみ。
   スマホ（ドロワー）はここからモードを開始する（showNav）。
   ============================================================ */
function Sidebar({
  tab, switchTab, chats, activeId, onNew, onOpen, width, onClose, showNav,
}: {
  tab: Tab;
  switchTab: (t: Tab) => void;
  chats: Chat[];
  activeId: number | null;
  onNew: () => void;
  onOpen: (id: number) => void;
  width: number | string;
  onClose?: () => void;
  showNav: boolean;
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

      {/* —— スマホ：モードの開始はサイドバーから —— */}
      {showNav && (
        <nav style={{ padding: "2px 10px 8px", display: "flex", flexDirection: "column", gap: 2 }} aria-label="モード切替">
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                data-guide={`tab-${t.id}`}
                aria-current={on ? "page" : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
                  padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: on ? "#E4E1D3" : "transparent", color: on ? C.accentInk : C.ink,
                  fontSize: 13.5, fontWeight: on ? 800 : 600,
                }}
              >
                <span style={{ fontSize: 15 }}>{t.icon}</span> {t.label}
              </button>
            );
          })}
          <div style={{ height: 1, background: C.line, margin: "6px 4px" }} />
        </nav>
      )}

      <div style={{ padding: showNav ? "0 10px 10px" : "4px 10px 10px" }}>
        <button
          onClick={onNew}
          data-guide="new-chat"
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
   ドロップダウン共通
   ============================================================ */
function Dropdown<T extends string>({
  items, current, onPick, label, align = "right",
}: {
  items: { id: T; name: string; desc: string }[];
  current: T;
  onPick: (id: T) => void;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <div style={{ position: "absolute", ...(align === "right" ? { right: 0 } : { left: 0 }), bottom: "calc(100% + 6px)", zIndex: 9, width: 250, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(40,35,25,.18)", overflow: "hidden" }}>
      <div style={{ padding: "8px 12px 4px", fontSize: 10.5, fontWeight: 700, color: C.sub, letterSpacing: ".05em" }}>{label}</div>
      {items.map((m) => (
        <button
          key={m.id}
          onClick={() => onPick(m.id)}
          style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: m.id === current ? C.panel : "transparent", cursor: "pointer", fontFamily: "inherit" }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
            {m.name} {m.id === current && <span style={{ color: C.accent }}>✓</span>}
          </span>
          <span style={{ display: "block", fontSize: 11, color: C.sub, marginTop: 1 }}>{m.desc}</span>
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   メイン画面（ヘッダー・本文・入力欄）
   ============================================================ */
function Main({
  device, tab, chat, busy, streaming, model, permMode, env, folder, menu, setMenu,
  pickModel, pickPerm, pickEnv, pickFolder, input, setInput, send, resolveDiff, resolveApproval, resolveChoices, openArtifact, skills, useSkill, scrollRef, notify, openDrawer,
}: {
  device: "pc" | "sp";
  tab: Tab;
  chat: Chat | null;
  busy: boolean;
  streaming: boolean;
  model: ModelId;
  permMode: PermMode;
  env: EnvId;
  folder: string | null;
  menu: "model" | "perm" | "env" | "folder" | null;
  setMenu: (v: "model" | "perm" | "env" | "folder" | null) => void;
  pickModel: (m: ModelId) => void;
  pickPerm: (m: PermMode) => void;
  pickEnv: (m: EnvId) => void;
  pickFolder: (path: string) => void;
  input: string;
  setInput: (v: string) => void;
  send: (t?: string) => void;
  resolveDiff: (chatId: number, accept: boolean) => void;
  resolveApproval: (chatId: number, allow: boolean) => void;
  resolveChoices: (chatId: number, answers: string[]) => void;
  openArtifact: (a: ArtifactSpec) => void;
  skills: string[];
  useSkill: (name: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  notify: (m: string) => void;
  openDrawer: () => void;
}) {
  const def = tabDef(tab);
  const modelInfo = MODELS.find((m) => m.id === model)!;
  const permInfo = PERM_MODES.find((m) => m.id === permMode)!;
  const envInfo = ENVS.find((m) => m.id === env)!;
  const empty = !chat || chat.messages.length === 0;
  const isCode = tab === "code";

  const chipStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${C.line}`, background: C.bg,
    borderRadius: 8, padding: "5px 9px", fontSize: 11.5, fontWeight: 700, color: C.ink, cursor: "pointer", fontFamily: "inherit",
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative" }}>
      {/* ヘッダー（会話タイトル） */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: device === "sp" ? "8px 12px" : "10px 16px", borderBottom: `1px solid ${C.line}` }}>
        {device === "sp" && (
          <button onClick={openDrawer} aria-label="メニュー" style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", color: C.ink, padding: "0 2px" }}>
            ☰
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ color: C.sub, fontWeight: 800, fontSize: 11, marginRight: 8, letterSpacing: ".05em" }}>{def.icon} {def.label}</span>
          {chat ? chat.title : def.newLabel}
        </div>
        {isCode && chat && (
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.sub, border: `1px solid ${C.line}`, borderRadius: 6, padding: "3px 7px" }}>
            {envInfo.name} · {folder ?? "フォルダ未選択"}
          </span>
        )}
      </div>

      {/* 本文 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: device === "sp" ? "16px 14px" : "22px 26px" }}>
        {empty ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8 }}>
            <div style={{ fontSize: 34, color: C.accent }}>✳</div>
            <div style={{ fontFamily: SERIF, fontSize: device === "sp" ? 19 : 23, color: C.ink }}>{def.greet}</div>
            {def.sub && <div style={{ fontSize: 11.5, color: C.sub, maxWidth: 300 }}>{def.sub}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10, width: "100%", maxWidth: 320 }}>
              {def.suggestions.map((s, si) => (
                <button
                  key={s}
                  data-guide={`suggest-${si}`}
                  onClick={() => send(s)}
                  disabled={busy}
                  style={{
                    padding: "9px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.input,
                    color: C.ink, fontSize: 12.5, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  💡 {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chat!.messages.map((m, i) => (
            <Bubble
              key={i}
              msg={m}
              last={i === chat!.messages.length - 1}
              busy={streaming}
              sp={device === "sp"}
              kind={chat!.kind}
              onResolve={(accept) => resolveDiff(chat!.id, accept)}
              onResolveApproval={(allow) => resolveApproval(chat!.id, allow)}
              onResolveChoices={(answers) => resolveChoices(chat!.id, answers)}
              onOpenArtifact={openArtifact}
            />
          ))
        )}
      </div>

      {/* 入力欄 */}
      <div style={{ padding: device === "sp" ? "8px 10px 14px" : "10px 18px 14px" }}>
        {/* Cowork / コード：環境・フォルダの設定チップ（本物は入力欄まわりで設定）。
            フォルダは候補メニューから選び、初回はアクセス許可ダイアログを挟む */}
        {tab !== "chat" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 7, flexWrap: "wrap" }}>
            {isCode && (
              <div style={{ position: "relative" }}>
                <button style={chipStyle} data-guide="env" onClick={() => setMenu(menu === "env" ? null : "env")}>
                  🖥 {envInfo.name} <span style={{ fontSize: 8, color: C.sub }}>▼</span>
                </button>
                {menu === "env" && (
                  <>
                    <div onClick={() => setMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 8 }} />
                    <Dropdown items={ENVS} current={env} onPick={pickEnv} label="実行環境" align="left" />
                  </>
                )}
              </div>
            )}
            <div style={{ position: "relative" }}>
              <button style={chipStyle} data-guide="folder" onClick={() => setMenu(menu === "folder" ? null : "folder")}>
                📁 {folder ?? "フォルダを選択"} <span style={{ fontSize: 8, color: C.sub }}>▼</span>
              </button>
              {menu === "folder" && (
                <>
                  <div onClick={() => setMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 8 }} />
                  <Dropdown items={FOLDERS} current={folder ?? ""} onPick={pickFolder} label="フォルダを選択" align="left" />
                </>
              )}
            </div>
          </div>
        )}
        <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 7, border: `1.5px solid ${C.line}`, borderRadius: 18, background: C.input, padding: "8px 10px" }}>
          {/* —— スキル呼び出しポップアップ（「/」と打つと表示） —— */}
          {input.trim() === "/" && skills.length > 0 && (
            <div
              data-guide="skill-pop"
              style={{
                position: "absolute", left: 8, right: 8, bottom: "calc(100% + 8px)", zIndex: 9,
                background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12,
                boxShadow: "0 8px 24px rgba(40,35,25,.18)", overflow: "hidden",
              }}
            >
              <div style={{ padding: "8px 12px 4px", fontSize: 10.5, fontWeight: 700, color: C.sub, letterSpacing: ".05em" }}>スキル</div>
              {skills.map((s) => (
                <button
                  key={s}
                  onClick={() => useSkill(s)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.accentInk }}>/{s}</span>
                  <span style={{ display: "block", fontSize: 11, color: C.sub, marginTop: 1 }}>保存した手順をひと言で実行</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => notify("📎 添付・スキル・コネクタのメニュー。この再現UIでは省略しています")}
            aria-label="添付"
            style={{ border: "none", background: "transparent", fontSize: 17, cursor: "pointer", color: C.sub, padding: "3px 2px" }}
          >
            ＋
          </button>
          <textarea
            value={input}
            data-guide="input"
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
              fontSize: 13.5, lineHeight: 1.6, color: C.ink, fontFamily: "inherit", maxHeight: 90, padding: "4px 0",
            }}
          />
          {/* 権限モード（コードタブ・送信ボタンの隣） */}
          {isCode && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenu(menu === "perm" ? null : "perm")}
                style={{ ...chipStyle, padding: "5px 8px" }}
                title="権限モード"
                data-guide="perm"
              >
                🛡 {permInfo.name} <span style={{ fontSize: 8, color: C.sub }}>▼</span>
              </button>
              {menu === "perm" && (
                <>
                  <div onClick={() => setMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 8 }} />
                  <Dropdown items={PERM_MODES} current={permMode} onPick={pickPerm} label="権限モード" />
                </>
              )}
            </div>
          )}
          {/* モデル（送信ボタンの隣のドロップダウン） */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenu(menu === "model" ? null : "model")}
              style={{ ...chipStyle, padding: "5px 8px" }}
              title="モデルを選択"
              data-guide="model"
            >
              {modelInfo.name} <span style={{ fontSize: 8, color: C.sub }}>▼</span>
            </button>
            {menu === "model" && (
              <>
                <div onClick={() => setMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 8 }} />
                <Dropdown items={MODELS} current={model} onPick={pickModel} label="モデルを選択" />
              </>
            )}
          </div>
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            aria-label="送信"
            data-guide="send"
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
   吹き出し（チャット）／作業ログ（Cowork/コード）／diffカード
   ============================================================ */
function Bubble({
  msg, last, busy, sp, kind, onResolve, onResolveApproval, onResolveChoices, onOpenArtifact,
}: {
  msg: Msg;
  last: boolean;
  busy: boolean;
  sp: boolean;
  kind: Tab;
  onResolve: (accept: boolean) => void;
  onResolveApproval: (allow: boolean) => void;
  onResolveChoices: (answers: string[]) => void;
  onOpenArtifact: (a: ArtifactSpec) => void;
}) {
  /* —— 選択式の質問カード（AskUserQuestion風） —— */
  if (msg.role === "assistant" && msg.choices) {
    return <ChoicesCard msg={msg} sp={sp} onResolve={onResolveChoices} />;
  }

  /* —— チャット内図解ブロック —— */
  if (msg.role === "assistant" && msg.figure) {
    const f = msg.figure;
    return (
      <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
          ✳
        </span>
        <div style={{ minWidth: 0, flex: 1, maxWidth: sp ? "88%" : "84%" }}>
          {msg.text && (
            <div style={{ fontSize: 13.5, lineHeight: 1.85, whiteSpace: "pre-wrap", color: C.ink, marginBottom: 8 }}>{msg.text}</div>
          )}
          <div data-guide="figure" style={{ border: `1px solid ${C.line}`, borderRadius: 12, background: "#FFFFFF", padding: "14px 14px 12px" }}>
            {f.title && (
              <div style={{ fontSize: 12.5, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>{f.title}</div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {f.cards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    flex: "1 1 120px", minWidth: 110, textAlign: "center",
                    border: `1.5px solid ${C.line}`, borderRadius: 10, background: C.bg, padding: "10px 8px",
                  }}
                >
                  <div style={{ fontSize: 22 }}>{card.icon}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, margin: "3px 0 2px" }}>{card.label}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: C.accentInk }}>{card.point}</div>
                  <div style={{ fontSize: 10.5, color: C.sub, marginTop: 3, lineHeight: 1.6 }}>{card.note}</div>
                </div>
              ))}
            </div>
            {f.footer && (
              <div style={{ fontSize: 11, color: C.sub, background: C.panel, borderRadius: 8, padding: "7px 10px", marginTop: 10, textAlign: "center" }}>
                {f.footer}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div style={{ maxWidth: "82%", background: C.user, borderRadius: 14, padding: "9px 13px", fontSize: 13.5, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          {msg.text}
        </div>
      </div>
    );
  }

  /* —— diffカード（コードタブ：+N -N と Accept/Reject） —— */
  if (msg.diff) {
    const d = msg.diff;
    return (
      <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
          ✳
        </span>
        <div style={{ minWidth: 0, flex: 1, maxWidth: sp ? "88%" : "84%" }}>
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden", background: "#FFFFFF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: `1px solid ${C.line}`, background: C.panel }}>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{d.file}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: C.green }}>+{d.add}</span> <span style={{ color: C.red }}>-{d.del}</span>
              </span>
              <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 700, color: d.state === "rejected" ? C.red : d.state === "pending" ? C.sub : C.green }}>
                {d.state === "pending" ? "変更の提案" : d.state === "rejected" ? "✕ 破棄しました" : d.state === "auto" ? "✓ 自動承認（Accept edits）" : "✓ 適用しました"}
              </span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11.5, lineHeight: 1.8, overflowX: "auto" }}>
              {d.lines.map((l, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0 12px", whiteSpace: "pre",
                    background: l.t === "+" ? C.diffAdd : l.t === "-" ? C.diffDel : "transparent",
                    color: l.t === "+" ? C.green : l.t === "-" ? C.red : C.ink,
                    textDecoration: l.t === "-" && d.state !== "rejected" ? "line-through" : "none",
                  }}
                >
                  {l.t} {l.s}
                </div>
              ))}
            </div>
            {d.state === "pending" && (
              <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: `1px solid ${C.line}` }}>
                <button
                  onClick={() => onResolve(true)}
                  data-guide="accept"
                  style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer", background: C.ink, color: "#fff", fontWeight: 800, fontSize: 12.5, fontFamily: "inherit" }}
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() => onResolve(false)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1.5px solid ${C.line}`, cursor: "pointer", background: "transparent", color: C.ink, fontWeight: 800, fontSize: 12.5, fontFamily: "inherit" }}
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
          {d.state === "pending" && (
            <p style={{ margin: "6px 2px 0", fontSize: 10.5, color: C.sub }}>
              Manualモード：変更は承認するまでファイルに書き込まれません
            </p>
          )}
        </div>
      </div>
    );
  }

  /* —— コマンド実行の承認カード —— */
  if (msg.approval) {
    const a = msg.approval;
    return (
      <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
          ✳
        </span>
        <div style={{ minWidth: 0, flex: 1, maxWidth: sp ? "88%" : "84%" }}>
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden", background: "#FFFFFF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: `1px solid ${C.line}`, background: C.panel }}>
              <span style={{ fontSize: 12, fontWeight: 800 }}>⚡ コマンドの実行</span>
              <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 700, color: a.state === "denied" ? C.red : a.state === "pending" ? C.sub : C.green }}>
                {a.state === "pending" ? "許可を待っています" : a.state === "denied" ? "✕ 実行しませんでした" : a.state === "auto" ? "✓ 自動承認（Auto）" : "✓ 実行しました"}
              </span>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontFamily: MONO, fontSize: 12.5, background: "#2A2620", color: "#E8E4D8", borderRadius: 8, padding: "8px 12px", overflowX: "auto", whiteSpace: "pre" }}>
                $ {a.command}
              </div>
              {a.note && <p style={{ margin: "8px 0 0", fontSize: 11.5, color: C.sub }}>{a.note}</p>}
            </div>
            {a.state === "pending" && (
              <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: `1px solid ${C.line}` }}>
                <button
                  onClick={() => onResolveApproval(true)}
                  data-guide="approve"
                  style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer", background: C.ink, color: "#fff", fontWeight: 800, fontSize: 12.5, fontFamily: "inherit" }}
                >
                  ✓ 許可する
                </button>
                <button
                  onClick={() => onResolveApproval(false)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1.5px solid ${C.line}`, cursor: "pointer", background: "transparent", color: C.ink, fontWeight: 800, fontSize: 12.5, fontFamily: "inherit" }}
                >
                  ✕ 拒否
                </button>
              </div>
            )}
          </div>
          {a.state === "pending" && (
            <p style={{ margin: "6px 2px 0", fontSize: 10.5, color: C.sub }}>
              コマンドは許可するまで実行されません
            </p>
          )}
        </div>
      </div>
    );
  }

  /* —— 成果物カード（プレビュー可能） —— */
  if (msg.artifact) {
    const a = msg.artifact;
    const icon = a.kind === "web" ? "🌐" : a.kind === "sheet" ? "📊" : "📄";
    return (
      <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
          ✳
        </span>
        <div style={{ minWidth: 0, maxWidth: sp ? "88%" : "84%" }}>
          <button
            onClick={() => onOpenArtifact(a)}
            data-guide="artifact"
            style={{
              display: "flex", alignItems: "center", gap: 11, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
              border: `1.5px solid ${C.line}`, borderRadius: 12, background: "#FFFFFF", padding: "11px 14px", minWidth: 230,
            }}
          >
            <span style={{ fontSize: 24 }}>{icon}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
              <span style={{ display: "block", fontSize: 11, color: C.sub, marginTop: 2 }}>{a.note ?? "成果物"} · クリックでプレビュー</span>
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 800, color: C.accentInk, flexShrink: 0 }}>プレビュー ↗</span>
          </button>
        </div>
      </div>
    );
  }

  const streaming = last && busy;
  const logStyle = kind !== "chat";
  return (
    <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
        ✳
      </span>
      <div style={{ minWidth: 0, maxWidth: sp ? "88%" : "84%", flex: logStyle ? 1 : undefined }}>
        {msg.thinking && (
          <details style={{ marginBottom: 6 }}>
            <summary style={{ fontSize: 11, color: C.sub, cursor: "pointer", fontWeight: 700 }}>🧠 思考プロセス（要約）</summary>
            <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.7, borderLeft: `2px solid ${C.line}`, padding: "4px 0 4px 10px", margin: "4px 0 2px", whiteSpace: "pre-wrap" }}>
              {msg.thinking}
            </div>
          </details>
        )}
        {msg.text === "" && streaming ? (
          <span style={{ fontSize: 13, color: C.sub, fontFamily: logStyle ? MONO : "inherit" }}>
            {kind === "cowork" ? "段取り中…" : kind === "code" ? "確認中…" : "考え中…"}
          </span>
        ) : logStyle ? (
          <div
            style={{
              fontSize: 12.5, lineHeight: 1.9, whiteSpace: "pre-wrap", fontFamily: MONO,
              color: msg.error ? C.red : C.ink, background: "#FFFFFF",
              border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", overflowX: "auto",
            }}
          >
            {msg.error && "⚠️ "}
            {msg.text}
            {streaming && <span style={{ color: C.accent }}>▍</span>}
          </div>
        ) : (
          <div style={{ fontSize: 13.5, lineHeight: 1.85, whiteSpace: "pre-wrap", color: msg.error ? C.red : C.ink }}>
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
   選択式の質問カード — 本物のClaudeが要件を聞くときに出す
   選択肢UI（AskUserQuestion）の再現。全部選ぶと「回答を送る」が
   有効になり、選んだ内容がユーザー発言として送信される。
   ============================================================ */
function ChoicesCard({ msg, sp, onResolve }: { msg: Msg; sp: boolean; onResolve: (answers: string[]) => void }) {
  const c = msg.choices!;
  const [picks, setPicks] = React.useState<Record<number, string>>({});
  const answered = c.state === "answered";
  const valueOf = (gi: number) => (answered ? c.answers?.[gi] : picks[gi]);
  const allPicked = c.groups.every((_, gi) => !!valueOf(gi));
  return (
    <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
        ✳
      </span>
      <div style={{ minWidth: 0, flex: 1, maxWidth: sp ? "88%" : "84%" }}>
        {msg.text && (
          <div style={{ fontSize: 13.5, lineHeight: 1.85, whiteSpace: "pre-wrap", color: C.ink, marginBottom: 8 }}>{msg.text}</div>
        )}
        <div data-guide="choices" style={{ border: `1px solid ${C.line}`, borderRadius: 12, background: "#FFFFFF", padding: "12px 14px" }}>
          {c.groups.map((g, gi) => (
            <div key={gi} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: C.sub, marginBottom: 5 }}>{g.label}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {g.options.map((o) => {
                  const on = valueOf(gi) === o;
                  return (
                    <button
                      key={o}
                      disabled={answered}
                      onClick={() => setPicks((p) => ({ ...p, [gi]: o }))}
                      style={{
                        padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                        cursor: answered ? "default" : "pointer",
                        border: `1.5px solid ${on ? C.accent : C.line}`,
                        background: on ? "#FBEFE9" : C.bg, color: on ? C.accentInk : C.ink,
                      }}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!answered ? (
            <button
              onClick={() => allPicked && onResolve(c.groups.map((_, gi) => picks[gi]))}
              disabled={!allPicked}
              style={{
                width: "100%", marginTop: 2, padding: "9px 0", borderRadius: 9, border: "none", fontFamily: "inherit",
                cursor: allPicked ? "pointer" : "not-allowed", background: allPicked ? C.accent : C.line,
                color: "#fff", fontWeight: 800, fontSize: 12.5,
              }}
            >
              回答を送る
            </button>
          ) : (
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.green, marginTop: 2 }}>✓ 回答を送りました</div>
          )}
        </div>
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
          AnthropicのAPIキー（sk-ant-…）を入れると、チャット・Cowork・コードの3タブすべてで<b>本物のClaude</b>が応答します。
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
