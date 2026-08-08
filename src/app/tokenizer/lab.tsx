"use client";
/* ============================================================
   トークナイザー体験ラボの本体。
   ・本物のBPEトークナイザー（o200k_base＝GPT-4o系と同じ）を
     ブラウザ上で動かし、入力した瞬間にトークン分割を可視化する。
   ・トークナイザー本体（数MB）は初回操作前に動的importして
     ページ本体のバンドルを軽く保つ。
   ・すべてクライアント側で完結（入力文がサーバーに送られる
     ことはない）。
   ============================================================ */
import React from "react";
import { createPortal } from "react-dom";
import { Badge, Button, Card } from "../ds";
import { unlock } from "../zukan/store";

/* —— 料金・コンテキストの参考値（2026年7月時点・入力単価） —— */
const JPY_PER_USD = 155;
const MODELS = [
  { name: "Claude Sonnet", vendor: "Anthropic", usdPerM: 3.0, ctx: 200_000, color: "var(--yellow-400)" },
  { name: "GPT-4o", vendor: "OpenAI", usdPerM: 2.5, ctx: 128_000, color: "var(--red-500)" },
  { name: "Gemini 2.5 Flash", vendor: "Google", usdPerM: 0.3, ctx: 1_000_000, color: "var(--blue-500)" },
];

const PRESETS: { label: string; icon: string; text: string }[] = [
  {
    label: "桃太郎",
    icon: "🍑",
    text: "むかしむかし、あるところに、おじいさんとおばあさんが住んでいました。おじいさんは山へしばかりに、おばあさんは川へせんたくに行きました。",
  },
  {
    label: "ビジネスメール",
    icon: "💼",
    text: "お世話になっております。COMIXAIの吉川です。先日の打ち合わせの議事録をお送りします。ご確認のほど、よろしくお願いいたします。",
  },
  {
    label: "English",
    icon: "🌍",
    text: "The quick brown fox jumps over the lazy dog. AI reads text as tokens, not characters.",
  },
  {
    label: "絵文字",
    icon: "🍣",
    text: "今日のランチは🍣と🍜で迷ってます😂どっちがいい？",
  },
];

/* トークン列を「表示できる最小単位」のチップにまとめる。
   日本語や絵文字は1文字が複数トークンに割れることがあり、
   その場合は複数トークンで1チップ（×n表示）になる。

   ▍decode に「�が出るか」で判定してはいけない
   かつては1トークンずつ足しながら decode して、置換文字（U+FFFD）が
   消えたところで区切っていた。ところが gpt-tokenizer の decode は
   **末尾の半端なバイトを黙って捨てて返す**。そのため「まだ途中」なのに
   文字として成立したように見え、区切りが1つ後ろへずれて、次の文字を
   巻き込んでいた（合計トークン数は合うが、×n の内訳が違う）。

   decodeGenerator は半端なバイトを内部に持ち越し、**読めた瞬間**にだけ
   文字を返す。1トークンずつ流し込んで、返ってきた時点までに何トークン
   使ったかを数える。アプリ側（ComixaiAcademy/src/lib/tokenizer.ts）も同じ。 */
interface Chip {
  text: string;
  n: number; // このチップを構成するトークン数
  ids: number[];
}
function toChips(tokens: number[], enc: Encoder): Chip[] {
  const chips: Chip[] = [];
  /* いま generator に渡し終えた位置と、直前に文字が確定した位置 */
  let at = -1;
  let last = -1;

  function* feed(): Generator<number> {
    for (let i = 0; i < tokens.length; i++) {
      at = i;
      yield tokens[i];
    }
  }

  for (const piece of enc.decodeGenerator(feed())) {
    if (!piece) continue;
    if (at === last && chips.length) {
      /* 1トークンから2回に分けて返ってきた場合。
         新しいチップにすると0トークンの塊ができるので、前にくっつける */
      chips[chips.length - 1].text += piece;
      continue;
    }
    chips.push({ text: piece, n: at - last, ids: tokens.slice(last + 1, at + 1) });
    last = at;
  }

  if (last < tokens.length - 1) {
    chips.push({ text: "…", n: tokens.length - 1 - last, ids: tokens.slice(last + 1) });
  }
  return chips;
}

/* 数字がスプリングで気持ちよく追いつくカウンター */
function useSpringNumber(target: number): number {
  const [value, setValue] = React.useState(target);
  const raf = React.useRef<number | null>(null);
  React.useEffect(() => {
    const tick = () => {
      setValue((prev) => {
        const d = target - prev;
        if (Math.abs(d) < 0.6) return target;
        raf.current = requestAnimationFrame(tick);
        return prev + d * 0.22;
      });
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target]);
  return Math.round(value);
}

const CHIP_COLORS = ["var(--yellow-200, #ffe9a8)", "#dbe9ff", "#ffdcdc", "var(--paper-100)"];

function fmtYen(yen: number): string {
  if (yen === 0) return "0円";
  if (yen < 0.01) return `約${(yen * 100).toFixed(2)}銭`; // 遊び心
  if (yen < 1) return `約${yen.toFixed(2)}円`;
  if (yen < 100) return `約${yen.toFixed(1)}円`;
  return `約${Math.round(yen).toLocaleString()}円`;
}

type Encoder = {
  encode: (s: string) => number[];
  decode: (t: number[]) => string;
  /* 途中で切れたバイト列を内部に持ち越しながら、読めたぶんだけ返す */
  decodeGenerator: (t: Iterable<number>) => Generator<string>;
};

export function TokenizerLab() {
  const [text, setText] = React.useState("");
  const [enc, setEnc] = React.useState<Encoder | null>(null);
  const [chips, setChips] = React.useState<Chip[]>([]);
  const [tokenCount, setTokenCount] = React.useState(0);
  const prevChipCount = React.useRef(0);
  const typingTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const debounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [focused, setFocused] = React.useState(false);
  const [kbInset, setKbInset] = React.useState(0);

  /* スマホのソフトキーボードで分割結果が隠れる問題への対策：
     visualViewportでキーボードの高さを検知し、キーボードの
     すぐ上に「ライブ帯」（トークン数＋直近チップ）を浮かせる。
     ?debugkb=1 でPCでも帯を強制表示できる（動作確認用） */
  const debugKb = typeof window !== "undefined" && window.location.search.includes("debugkb");
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbInset(inset);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  const showLiveBar = debugKb || (focused && kbInset > 120);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  /* 図鑑：隠し部屋の発見を記録 */
  React.useEffect(() => unlock("rooms", "tokenizer"), []);

  /* トークナイザーは重いので、マウント後に裏で読み込む */
  React.useEffect(() => {
    let alive = true;
    import("gpt-tokenizer").then((m) => {
      if (alive) setEnc({ encode: m.encode, decode: m.decode, decodeGenerator: m.decodeGenerator });
    });
    return () => {
      alive = false;
    };
  }, []);

  /* 入力→トークン化（軽いデバウンス） */
  React.useEffect(() => {
    if (!enc) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const tokens = enc.encode(text);
      prevChipCount.current = chips.length;
      setTokenCount(tokens.length);
      setChips(toChips(tokens, enc));
      setSelected(null);
    }, 90);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enc]);

  /* お手本ボタン：タイプライター演出で自動入力 */
  const typePreset = (preset: string) => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    setText("");
    const chars = [...preset];
    let i = 0;
    typingTimer.current = setInterval(() => {
      i += 1 + Math.floor(Math.random() * 2); // 1〜2文字ずつ、人間っぽく
      setText(chars.slice(0, i).join(""));
      if (i >= chars.length && typingTimer.current) {
        clearInterval(typingTimer.current);
        typingTimer.current = null;
      }
    }, 34);
  };
  React.useEffect(
    () => () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
    },
    []
  );

  const springCount = useSpringNumber(tokenCount);
  const charCount = [...text].length;
  const efficiency = tokenCount > 0 ? (charCount / tokenCount).toFixed(1) : "—";

  const shareText = `この文章、AIには ${tokenCount} トークンに見えているらしい。\nあなたの文章は何トークン？\n#今さら聞けないAI用語集`;
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://comixai.dev/tokenizer")}`;

  return (
    <div>
      {/* ═══ 入力エリア ═══ */}
      <Card variant="pop" padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "22px 24px 18px" }}>
          <label htmlFor="tok-input" style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 10 }}>
            <i className="ph-bold ph-pencil-simple" style={{ color: "var(--red-600)" }} /> 好きな文章を打ってみてください
          </label>
          <textarea
            id="tok-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="例：吾輩は猫である。名前はまだ無い。"
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: "var(--font-body)",
              fontSize: 16.5,
              lineHeight: 1.9,
              color: "var(--text-strong)",
              background: "var(--paper-50)",
              border: "var(--bw-line) solid var(--ink-900)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)" }}>お手本：</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => typePreset(p.text)}
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "7px 14px",
                  borderRadius: "var(--radius-full)",
                  border: "var(--bw-line) solid var(--ink-900)",
                  background: "var(--paper-0)",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-pop-sm)",
                }}
              >
                {p.icon} {p.label}
              </button>
            ))}
            {text && (
              <button
                type="button"
                onClick={() => setText("")}
                style={{ border: 0, background: "none", cursor: "pointer", color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, marginLeft: "auto" }}
              >
                <i className="ph-bold ph-x" /> クリア
              </button>
            )}
          </div>
        </div>

        {/* ═══ 分割結果 ═══ */}
        <div style={{ borderTop: "var(--bw-line) solid var(--ink-900)", background: "var(--paper-100)", padding: "18px 24px 22px", minHeight: 120 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <i className="ph-bold ph-scissors" style={{ fontSize: 17, color: "var(--red-600)" }} />
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14.5 }}>AIにはこう見えている</span>
            {!enc && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                <i className="ph-bold ph-circle-notch tok-spin" /> トークナイザーを準備中…
              </span>
            )}
          </div>
          {chips.length === 0 ? (
            <p style={{ margin: 0, fontFamily: "var(--font-hand)", fontSize: 15.5, color: "var(--text-muted)" }}>
              {enc ? "↑ 文字を打つと、AIが文章を刻む様子がここに出ます" : "初回だけ少し時間がかかります（数MBの辞書を読み込み中）"}
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, lineHeight: 1 }}>
              {chips.map((c, i) => {
                const isNew = i >= prevChipCount.current;
                const on = selected === i;
                return (
                  <button
                    key={`${i}-${c.text}`}
                    type="button"
                    onClick={() => setSelected(on ? null : i)}
                    className={isNew ? "tok-chip" : undefined}
                    style={{
                      animationDelay: isNew ? `${Math.min((i - prevChipCount.current) * 28, 400)}ms` : undefined,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 15,
                      whiteSpace: "pre",
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1.5px solid var(--ink-900)",
                      background: on ? "var(--ink-900)" : CHIP_COLORS[i % CHIP_COLORS.length],
                      color: on ? "var(--paper-50)" : "var(--ink-900)",
                      cursor: "pointer",
                      position: "relative",
                    }}
                    title={`トークンID: ${c.ids.join(", ")}`}
                  >
                    {c.text.replace(/ /g, "␣").replace(/\n/g, "⏎")}
                    {c.n > 1 && (
                      <span style={{ fontSize: 10, marginLeft: 4, color: on ? "var(--yellow-400)" : "var(--red-600)" }}>×{c.n}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {selected != null && chips[selected] && (
            <div style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)" }}>
              「{chips[selected].text}」= トークンID {chips[selected].ids.join(" + ")}
              {chips[selected].n > 1 && "（1文字がバイト単位で複数トークンに分かれています）"}
            </div>
          )}
        </div>
      </Card>

      {/* ═══ 統計タイル ═══ */}
      <div className="articles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
        {[
          { label: "トークン数", value: springCount.toLocaleString(), sub: "AIが読む単位", accent: true },
          { label: "文字数", value: charCount.toLocaleString(), sub: "人間が読む単位" },
          { label: "1トークンあたり", value: tokenCount ? `${efficiency}文字` : "—", sub: "日本語は英語より少なめ" },
        ].map((s) => (
          <Card key={s.label} variant="pop" padding={18} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: "0.12em", color: "var(--text-muted)", fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 38, lineHeight: 1.3, color: s.accent ? "var(--red-600)" : "var(--ink-900)" }}>
              {s.value}
            </div>
            <div style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)" }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* ═══ 料金にすると？ ═══ */}
      <h2 style={{ margin: "40px 0 4px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 19 }}>
        <i className="ph-bold ph-coins" style={{ color: "var(--red-600)" }} /> この文章、料金にすると？
      </h2>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)" }}>
        AIの料金は「トークン数 × 単価」。1回では小さくても、業務で1万回送ると差が出ます。
      </p>
      <div className="articles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {MODELS.map((m) => {
          const once = (tokenCount * m.usdPerM * JPY_PER_USD) / 1_000_000;
          return (
            <Card key={m.name} variant="pop" padding={0} style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "var(--bw-line) solid var(--ink-900)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: m.color, border: "2px solid var(--ink-900)", flex: "none" }} />
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14.5 }}>{m.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", marginLeft: "auto" }}>{m.vendor}</span>
              </div>
              <div style={{ padding: "14px 16px 16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 25 }}>{tokenCount ? fmtYen(once) : "—"}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>/ 1回</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>
                  1万回なら {tokenCount ? fmtYen(once * 10_000) : "—"}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>
        ※2026年7月時点の入力単価の参考値（1ドル155円換算）。実際の料金は各社の最新の料金表をご確認ください。
      </p>

      {/* ═══ 作業机ゲージ ═══ */}
      <h2 style={{ margin: "40px 0 4px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 19 }}>
        <i className="ph-bold ph-desk" style={{ color: "var(--red-600)" }} /> AIの「作業机」をどれだけ使う？
      </h2>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)" }}>
        AIが一度に覚えていられる上限が<a href="/glossary/context-window" style={{ color: "var(--red-600)", fontWeight: 700 }}>コンテキストウィンドウ</a>。この文章が机をどれだけ占めるか見てみましょう。
      </p>
      <Card variant="pop" padding={20}>
        <div style={{ display: "grid", gap: 16 }}>
          {MODELS.map((m) => {
            const pct = Math.min((tokenCount / m.ctx) * 100, 100);
            return (
              <div key={m.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5 }}>
                    {m.name}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                      机の広さ {Math.round(m.ctx / 1000).toLocaleString()}Kトークン
                    </span>
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: "var(--red-600)" }}>
                    {tokenCount === 0 ? "0%" : pct < 0.01 ? "0.01%未満" : `${pct.toFixed(2)}%`}
                  </span>
                </div>
                <div style={{ height: 14, border: "2px solid var(--ink-900)", borderRadius: 999, overflow: "hidden", background: "var(--paper-50)" }}>
                  <div
                    className="tok-gauge-fill"
                    style={{ width: `${Math.max(pct, tokenCount > 0 ? 1.2 : 0)}%`, height: "100%", background: m.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ margin: "16px 0 0", fontFamily: "var(--font-hand)", fontSize: 14.5, color: "var(--text-muted)" }}>
          {tokenCount === 0
            ? "何か打つと、机の埋まり具合が動きます"
            : tokenCount < 500
              ? `この調子なら、Claudeの机にはこの文章があと約${Math.floor(200_000 / Math.max(tokenCount, 1)).toLocaleString()}回ぶん載ります。広い。`
              : `長文になってきました。それでもまだ机はスカスカです。`}
        </p>
      </Card>

      {/* ═══ シェア ═══ */}
      {tokenCount > 0 && (
        <div style={{ textAlign: "center", marginTop: 30 }}>
          <a href={intent} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} data-ga="share_click" data-ga-network="x" data-ga-place="result" data-ga-path="/tokenizer">
            <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
              「{tokenCount.toLocaleString()}トークンだった」とXでシェア
            </Button>
          </a>
        </div>
      )}

      {/* ═══ 豆知識 ═══ */}
      <div style={{ marginTop: 40, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", background: "var(--paper-0)", padding: "18px 22px" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, marginBottom: 8 }}>
          <i className="ph-bold ph-lightbulb" style={{ color: "var(--red-600)" }} /> 触ってわかる3つのこと
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 2, color: "var(--text-body)" }}>
          <li>「ある」「ところ」のようなよく出る並びは<strong>まとめて1トークン</strong>になる（頻出パターンほどお得）</li>
          <li>絵文字や珍しい漢字は<strong>1文字で2〜3トークン</strong>使うことがある（<Badge tone="red">×2</Badge> がつくチップ）</li>
          <li>同じ内容でも<strong>英語のほうがトークン効率が良い</strong>ことが多い。日本語は少し贅沢な言語</li>
        </ul>
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { href: "/glossary/token", label: "トークンとは？" },
            { href: "/glossary/context-window", label: "コンテキストウィンドウとは？" },
            { href: "/quiz", label: "AI用語力診断に挑戦" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                textDecoration: "none",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--ink-900)",
                background: "var(--paper-0)",
                border: "var(--bw-line) solid var(--ink-900)",
                borderRadius: "var(--radius-full)",
                padding: "8px 16px",
                boxShadow: "var(--shadow-pop-sm)",
              }}
            >
              {l.label} <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)" }} />
            </a>
          ))}
        </div>
      </div>

      {/* ═══ キーボード上のライブ帯（スマホ入力中だけ表示）。
           祖先のtransform（スクロール出現アニメ）にfixed基準を
           壊されないよう、Portalでbody直下に描画する ═══ */}
      {mounted && showLiveBar && createPortal(
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: 10,
            right: 10,
            bottom: kbInset + 10,
            zIndex: 60,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "var(--ink-900)",
              border: "2.5px solid var(--ink-900)",
              borderRadius: 14,
              boxShadow: "var(--shadow-pop-sm)",
              padding: "9px 12px",
              overflow: "hidden",
            }}
          >
            <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--yellow-400)" }}>
              {tokenCount.toLocaleString()}<span style={{ fontSize: 10.5 }}>トークン</span>
            </span>
            <span style={{ flex: "none", width: 2, height: 20, background: "rgba(251,247,239,0.25)", borderRadius: 2 }} />
            <div style={{ display: "flex", gap: 5, overflow: "hidden", justifyContent: "flex-end", flex: 1 }}>
              {chips.slice(-7).map((c, i, arr) => (
                <span
                  key={`${chips.length - arr.length + i}-${c.text}`}
                  className="tok-chip"
                  style={{
                    flex: "none",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 13,
                    whiteSpace: "pre",
                    padding: "4px 7px",
                    borderRadius: 6,
                    border: "1.5px solid var(--ink-900)",
                    background: CHIP_COLORS[(chips.length - arr.length + i) % CHIP_COLORS.length],
                    color: "var(--ink-900)",
                  }}
                >
                  {c.text.replace(/ /g, "␣").replace(/\n/g, "⏎")}
                  {c.n > 1 && <span style={{ fontSize: 9, marginLeft: 3, color: "var(--red-600)" }}>×{c.n}</span>}
                </span>
              ))}
              {chips.length === 0 && (
                <span style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "rgba(251,247,239,0.7)" }}>
                  打つと、ここに刻まれていきます
                </span>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
