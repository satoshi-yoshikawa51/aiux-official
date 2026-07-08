"use client";
/* ============================================================
   「3分バイブコーディング」— vibe coding体験シミュレーター。
   雑な一言を選ぶたびに、目の前でミニアプリが本当に変形していく。
   4ターンで完成。組み合わせは81通り。すべてクライアント完結。
   ============================================================ */
import React from "react";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";
import { ZukanNote } from "../zukan/collection";

/* —— 選択肢が変えるアプリの状態 —— */
type AppKey = "neko" | "ramen" | "oshi";
type ThemeKey = "pop" | "chic" | "future";
type FeatureKey = "button" | "gallery" | "ticker";
type FinishKey = "don" | "kawaii" | "pro";

interface VibeState {
  app: AppKey | null;
  theme: ThemeKey | null;
  feature: FeatureKey | null;
  finish: FinishKey | null;
}

const APPS: Record<AppKey, { name: string; short: string; emoji: string; tagline: string; gallery: string[]; cta: string; ticker: string }> = {
  neko: {
    name: "ねこカフェ にゃおん",
    short: "ねこカフェ",
    emoji: "🐱",
    tagline: "ねこと、ひと息。",
    gallery: ["😺", "😸", "😻", "🐈", "🐾", "☕"],
    cta: "もふもふ予約する",
    ticker: "本日、子ねこ3匹デビュー！ ／ ひざ乗り率98% ／ 爪とぎ研修実施中",
  },
  ramen: {
    name: "ラーメン道場 豚骨タイフーン",
    short: "ラーメン屋",
    emoji: "🍜",
    tagline: "スープは、嵐だ。",
    gallery: ["🍜", "🥟", "🍥", "🧄", "🌶️", "🍺"],
    cta: "替え玉を注文する",
    ticker: "本日のスープ濃度：台風級 ／ 替え玉無料タイム 17-18時 ／ にんにくマシマシ歓迎",
  },
  oshi: {
    name: "推し活手帳 OshiLog",
    short: "推し活アプリ",
    emoji: "✨",
    tagline: "今日も、尊い。",
    gallery: ["💖", "🎤", "🪩", "📸", "🎫", "🌟"],
    cta: "今日の尊さを記録",
    ticker: "本日の供給：多め ／ 遠征資金：がんばろう ／ 次の現場まであと12日",
  },
};

const THEMES: Record<ThemeKey, { label: string; bg: string; fg: string; accent: string; font: string; headerBg: string }> = {
  pop: { label: "ポップ", bg: "#fff8e1", fg: "#14110f", accent: "#e60012", font: "var(--font-display)", headerBg: "#ffd23f" },
  chic: { label: "シック", bg: "#1c1a17", fg: "#fbf7ef", accent: "#c9a86a", font: "var(--font-heading)", headerBg: "#14110f" },
  future: { label: "近未来", bg: "#0b1026", fg: "#dff3ff", accent: "#39d2ff", font: "var(--font-mono)", headerBg: "#101a45" },
};

const FINISHES: Record<FinishKey, { label: string }> = {
  don: { label: "ドン盛り" },
  kawaii: { label: "かわいい" },
  pro: { label: "プロ仕上げ" },
};

/* —— 会話の台本 —— */
const ROUNDS: {
  ai: string;
  key: keyof VibeState;
  options: { value: string; label: string; reply: string }[];
}[] = [
  {
    ai: "よし、作ろう。今日は何つくる？",
    key: "app",
    options: [
      { value: "neko", label: "ねこカフェのサイト", reply: "ねこカフェね。もう完成が見える。土台置きます🐱" },
      { value: "ramen", label: "ラーメン屋のサイト", reply: "豚骨の匂いがしてきた。まず器から作ります🍜" },
      { value: "oshi", label: "推し活アプリ", reply: "尊みを記録するやつね。任せて✨" },
    ],
  },
  {
    ai: "土台できた！見た目、どんな気分？",
    key: "theme",
    options: [
      { value: "pop", label: "もっとポップに", reply: "原色いきます。元気出していこう🎨" },
      { value: "chic", label: "シックにきめて", reply: "大人の配色にします。照明を落として…🕯️" },
      { value: "future", label: "近未来っぽく", reply: "ネオン起動。2049年からこんにちは🌌" },
    ],
  },
  {
    ai: "いい感じ。なんか機能ほしくない？",
    key: "feature",
    options: [
      { value: "button", label: "押せるボタンほしい", reply: "押したくなるボタン置きました。押してみて（完成後のお楽しみ）" },
      { value: "gallery", label: "写真ならべたい", reply: "ギャラリー展開します。ずらっと🖼️" },
      { value: "ticker", label: "お知らせ流したい", reply: "電光掲示板つけます。流れます📡" },
    ],
  },
  {
    ai: "ラスト！仕上げはどうする？",
    key: "finish",
    options: [
      { value: "don", label: "なんかこう、ドン！って", reply: "ドンね。はいドン！💥" },
      { value: "kawaii", label: "とにかくかわいく", reply: "角を丸めてハート追加。かわいいは正義💕" },
      { value: "pro", label: "プロっぽく整えて", reply: "余白を整えてバッジを追加。納品クオリティです📐" },
    ],
  },
];

/* —— プレビュー（ミニアプリ本体） —— */
function Preview({ s, interactive }: { s: VibeState; interactive: boolean }) {
  const [confetti, setConfetti] = React.useState<number[]>([]);
  const app = s.app ? APPS[s.app] : null;
  const th = THEMES[s.theme ?? "pop"];
  const kawaii = s.finish === "kawaii";
  const pro = s.finish === "pro";
  const don = s.finish === "don";

  const burst = () => {
    if (!interactive) return;
    const ids = Array.from({ length: 8 }, (_, i) => Date.now() + i);
    setConfetti((c) => [...c, ...ids]);
    setTimeout(() => setConfetti((c) => c.filter((id) => !ids.includes(id))), 950);
  };

  return (
    <div style={{ border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-pop)" }}>
      {/* 疑似ブラウザ */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "var(--paper-100)", borderBottom: "var(--bw-line) solid var(--ink-900)" }}>
        {["#e60012", "#ffd23f", "#3ddc84"].map((c) => (
          <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, border: "1.5px solid var(--ink-900)" }} />
        ))}
        <span style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", background: "var(--paper-0)", border: "1px solid var(--border-soft, #ddd)", borderRadius: 999, padding: "2px 10px" }}>
          comixai.dev/your-app
        </span>
      </div>
      {/* 画面 */}
      <div
        className="vibe-preview"
        style={{
          background: app ? th.bg : "var(--paper-0)",
          color: app ? th.fg : "var(--text-muted)",
          minHeight: 260,
          padding: app ? 0 : 20,
          position: "relative",
          borderRadius: kawaii ? "0 0 22px 22px" : 0,
        }}
      >
        {!app ? (
          <div style={{ textAlign: "center", paddingTop: 90, fontFamily: "var(--font-hand)", fontSize: 15 }}>（まっさらなページ。ここに、あなたのバイブが形になります）</div>
        ) : (
          <>
            {/* ヘッダー */}
            <div className="game-in" style={{ background: th.headerBg, color: s.theme === "pop" ? "#14110f" : "#fff", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `2px solid ${th.accent}` }}>
              <span style={{ fontSize: 18 }}>{app.emoji}</span>
              <span style={{ fontFamily: th.font, fontWeight: 900, fontSize: 14, letterSpacing: kawaii ? "0.06em" : undefined }}>
                {app.name}
                {kawaii && " ♡"}
              </span>
              {pro && <Badge tone="yellow" style={{ marginLeft: "auto" }}>OFFICIAL</Badge>}
            </div>
            {/* ヒーロー */}
            <div style={{ textAlign: "center", padding: don ? "26px 16px 18px" : "24px 16px 16px" }}>
              <div className="game-in" style={{ fontSize: don ? 54 : 40, lineHeight: 1.1 }}>
                {app.emoji}
                {don && "💥"}
              </div>
              <div
                className="game-in"
                style={{
                  fontFamily: th.font,
                  fontWeight: 900,
                  fontSize: don ? 26 : 19,
                  marginTop: 6,
                  color: don ? th.accent : undefined,
                  textShadow: s.theme === "future" ? `0 0 12px ${th.accent}` : undefined,
                }}
              >
                {app.tagline}
                {kawaii && " ♡"}
              </div>
              {pro && (
                <div className="game-in" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, opacity: 0.7, marginTop: 4 }}>
                  EST. 2026 — designed with vibes
                </div>
              )}
            </div>
            {/* 機能ブロック */}
            {s.feature === "button" && (
              <div className="game-in" style={{ textAlign: "center", padding: "0 16px 18px", position: "relative" }}>
                <button
                  type="button"
                  onClick={burst}
                  style={{
                    fontFamily: th.font,
                    fontWeight: 900,
                    fontSize: 14,
                    padding: "11px 26px",
                    borderRadius: kawaii ? 999 : 10,
                    border: "2.5px solid " + (s.theme === "chic" ? th.accent : "#14110f"),
                    background: th.accent,
                    color: s.theme === "pop" ? "#fff" : "#0b1026",
                    cursor: interactive ? "pointer" : "default",
                    boxShadow: "3px 3px 0 rgba(0,0,0,0.35)",
                  }}
                >
                  {app.cta}
                  {kawaii && "♡"}
                </button>
                {confetti.map((id, i) => (
                  <span key={id} className="vibe-confetti" style={{ left: `${38 + ((i * 7) % 28)}%`, bottom: 30, fontSize: 20, ["--cx" as string]: `${(i % 2 ? 1 : -1) * (10 + i * 6)}px` }}>
                    {[app.emoji, "🎉", "✨", "💥"][i % 4]}
                  </span>
                ))}
              </div>
            )}
            {s.feature === "gallery" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, padding: "0 16px 18px" }}>
                {app.gallery.map((g, i) => (
                  <div key={i} className="game-in" style={{ animationDelay: `${i * 60}ms`, textAlign: "center", fontSize: 24, background: "rgba(255,255,255,0.12)", border: `1.5px solid ${th.accent}`, borderRadius: kawaii ? 14 : 6, padding: "8px 0" }}>
                    {g}
                  </div>
                ))}
              </div>
            )}
            {s.feature === "ticker" && (
              <div className="vibe-marquee game-in" style={{ borderTop: `2px solid ${th.accent}`, borderBottom: `2px solid ${th.accent}`, margin: "0 0 16px", padding: "6px 0", fontFamily: "var(--font-mono)", fontSize: 12, color: th.accent }}>
                <span className="vibe-marquee-inner">📢 {app.ticker} ／ 📢 {app.ticker}</span>
              </div>
            )}
            {kawaii && (
              <div style={{ textAlign: "center", paddingBottom: 12, fontSize: 14, letterSpacing: "0.4em" }}>💕🎀💕</div>
            )}
            {pro && (
              <div style={{ borderTop: "1px solid rgba(128,128,128,0.4)", padding: "8px 16px", fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.65, display: "flex", justifyContent: "space-between" }}>
                <span>© your-app</span>
                <span>privacy / contact</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function VibeGame() {
  const [state, setState] = React.useState<VibeState>({ app: null, theme: null, feature: null, finish: null });
  const [round, setRound] = React.useState(0);
  const [chat, setChat] = React.useState<{ from: "ai" | "you"; text: string }[]>([{ from: "ai", text: ROUNDS[0].ai }]);
  const [thinking, setThinking] = React.useState(false);
  const done = round >= ROUNDS.length;

  /* 図鑑：隠し部屋の発見＋完成した作品を記録 */
  React.useEffect(() => unlock("rooms", "vibe"), []);
  React.useEffect(() => {
    if (done && state.app) unlock("vibe", state.app);
  }, [done, state.app]);

  const pickOption = (opt: { value: string; label: string; reply: string }) => {
    if (thinking) return;
    const r = ROUNDS[round];
    setChat((c) => [...c, { from: "you", text: opt.label }]);
    setThinking(true);
    setTimeout(() => {
      setState((s) => ({ ...s, [r.key]: opt.value }));
      setChat((c) => [...c, { from: "ai", text: opt.reply }]);
      setTimeout(() => {
        const nextRound = round + 1;
        setRound(nextRound);
        if (nextRound < ROUNDS.length) {
          setChat((c) => [...c, { from: "ai", text: ROUNDS[nextRound].ai }]);
        } else {
          setChat((c) => [...c, { from: "ai", text: "……できた！🎉 これが、あなたのバイブです。ボタンがあったら押してみて。" }]);
        }
        setThinking(false);
      }, 700);
    }, 550);
  };

  const reset = () => {
    setState({ app: null, theme: null, feature: null, finish: null });
    setRound(0);
    setChat([{ from: "ai", text: ROUNDS[0].ai }]);
  };

  const appName = state.app && state.theme && state.finish
    ? `${THEMES[state.theme].label}な${APPS[state.app].short}・${FINISHES[state.finish].label}エディション`
    : "";
  const shareText = done
    ? `3分バイブコーディングで【${appName}】が完成した。\n仕様書ゼロ、雑な一言×4回でアプリができる時代。\nあなたのバイブも形にしてみて👇\n#今さら聞けないAI用語集`
    : "";
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/vibe")}`;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* プレビュー */}
      <Preview s={state} interactive={done} />

      {/* 会話エリア */}
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", maxHeight: 220, overflowY: "auto", display: "grid", gap: 8 }}>
          {chat.slice(-4).map((m, i) => (
            <div key={`${chat.length}-${i}`} className="game-in" style={{ display: "flex", justifyContent: m.from === "you" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "85%",
                  fontSize: 13.5,
                  lineHeight: 1.75,
                  padding: "9px 13px",
                  borderRadius: "var(--radius-md)",
                  border: "var(--bw-line) solid var(--ink-900)",
                  background: m.from === "you" ? "var(--yellow-400)" : "var(--paper-0)",
                  fontWeight: m.from === "you" ? 700 : 400,
                }}
              >
                {m.from === "ai" && <span style={{ marginRight: 6 }}>🤖</span>}
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
              <i className="ph-bold ph-circle-notch tok-spin" /> 実装中…
            </div>
          )}
        </div>

        {/* 選択肢 or 完成メニュー */}
        <div style={{ borderTop: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)", padding: "14px 18px" }}>
          {!done ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ROUNDS[round].options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={thinking}
                  onClick={() => pickOption(o)}
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: 13.5,
                    padding: "10px 16px",
                    borderRadius: "var(--radius-full)",
                    border: "var(--bw-line) solid var(--ink-900)",
                    background: "var(--paper-0)",
                    cursor: thinking ? "wait" : "pointer",
                    boxShadow: "var(--shadow-pop-sm)",
                    opacity: thinking ? 0.6 : 1,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700, marginBottom: 4 }}>
                DEPLOY COMPLETE — 完成
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(17px,2.8vw,21px)", marginBottom: 12 }}>「{appName}」</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
                    完成品をXで自慢する
                  </Button>
                </a>
                <Button variant="secondary" size="md" onClick={reset} iconRight={<i className="ph-bold ph-arrows-clockwise" />}>
                  別のバイブで作り直す
                </Button>
              </div>
              <p style={{ margin: "14px 0 0", fontFamily: "var(--font-hand)", fontSize: 13.5, color: "var(--text-muted)" }}>
                ちなみに、このサイト自体もこのノリ（＋本物のAI）で作られています
              </p>
              <ZukanNote />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
