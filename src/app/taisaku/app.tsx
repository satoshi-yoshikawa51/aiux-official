"use client";

/* ============================================================
   対策書（/taisaku）の本体。質問 → 手順書まで全部ブラウザ内で完結する。

   ・回答も進捗もサーバーに送らない。localStorage だけ
     （セキュリティ不安を扱うコンテンツが、不安の源になってはいけない）
   ・手順カードの本文は data.ts に固定で持つ。AIは関与しない
   ・共有は回答をURLハッシュに埋め込む（#s=..&d=..&r=..&v=..&p=..）。
     開いた側は質問なしで手順書が出て、チェックは開いた端末に保存される
   ・印刷は window.print()。印刷スタイルは taisaku.css
   ============================================================ */

import React from "react";
import { Badge, Button } from "../ds";
import { track } from "../ga";
import {
  QUESTIONS,
  CARDS,
  CARDS_REVISED,
  DEVICE_NAME,
  DEVICE_ICON,
  LABEL,
  PHASES,
  SIT_TITLE,
  buildPlan,
  minutes,
  preface,
  encodeAnswers,
  decodeAnswers,
  type Answers,
  type Card,
  type Device,
  type PhaseKey,
  type Step,
} from "./data";

/* 回答途中の形。全部埋まったら Answers になる */
interface Draft {
  sit: Answers["sit"] | null;
  dev: Device[];
  role: Answers["role"] | null;
  svc: Answers["svc"];
  pw: Answers["pw"] | null;
}
const EMPTY: Draft = { sit: null, dev: [], role: null, svc: [], pw: null };

function complete(d: Draft): Answers | null {
  if (!d.sit || !d.role || !d.pw || !d.dev.length) return null;
  return { sit: d.sit, dev: d.dev, role: d.role, svc: d.svc, pw: d.pw };
}

/* —— 進捗（やった✓）の保存。キーは回答のエンコード文字列なので、
      同じ回答なら進捗を引き継ぐ —— */
type Done = Record<string, true>;
const storageKey = (a: Answers) => "taisaku:" + encodeAnswers(a);
function loadDone(a: Answers): Done {
  try {
    return JSON.parse(localStorage.getItem(storageKey(a)) || "{}") as Done;
  } catch {
    return {};
  }
}
function saveDone(a: Answers, d: Done) {
  try {
    localStorage.setItem(storageKey(a), JSON.stringify(d));
  } catch {
    /* プライベートモード等。保存できなくても手順書は使える */
  }
}

/* 「設定 → 自分の名前 → …」の矢印をアイコンに置き換えて描く */
function PathText({ path }: { path: string }) {
  const parts = path.split("→");
  return (
    <>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-500)", margin: "0 5px", fontSize: 13 }} />}
          {p.trim()}
        </React.Fragment>
      ))}
    </>
  );
}

/* 選択端末の手順が無いカードは、他の選択端末 → 先頭キーの順で代わりを出す */
function stepsFor(card: Card, dev: Device, chosen: Device[]): { dev: Device | "any"; list: Step[]; fallback: boolean } {
  const s = card.steps;
  if (s.any) return { dev: "any", list: s.any, fallback: false };
  if (s[dev]) return { dev, list: s[dev]!, fallback: false };
  const alt = chosen.find((d) => s[d]);
  if (alt) return { dev: alt, list: s[alt]!, fallback: true };
  const first = (Object.keys(s) as Device[])[0];
  return { dev: first, list: s[first]!, fallback: true };
}

/* ============================================================ */

export function TaisakuApp() {
  const [screen, setScreen] = React.useState<"ask" | "result">("ask");
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [qi, setQi] = React.useState(0);
  const [fresh, setFresh] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<Answers | null>(null);
  const [shared, setShared] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = (m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  /* 共有URLで開かれたら、質問を飛ばして手順書を出す */
  React.useEffect(() => {
    const a = decodeAnswers(location.hash);
    if (a) {
      setAnswers(a);
      setShared(true);
      setScreen("result");
      track("taisaku_open_shared", { sit: a.sit });
    }
  }, []);

  const finish = (a: Answers) => {
    setAnswers(a);
    setShared(false);
    setScreen("result");
    track("taisaku_result", { sit: a.sit, role: a.role, devices: a.dev.length, services: a.svc.length });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = () => {
    history.replaceState(null, "", location.pathname);
    setDraft(EMPTY);
    setQi(0);
    setFresh(null);
    setAnswers(null);
    setShared(false);
    setScreen("ask");
    window.scrollTo({ top: 0 });
  };

  return (
    <div style={{ position: "relative" }}>
      {screen === "ask" || !answers ? (
        <Ask
          draft={draft}
          qi={qi}
          fresh={fresh}
          onChange={(d, key) => {
            setDraft(d);
            setFresh(key);
          }}
          onNav={(i) => setQi(i)}
          onFinish={finish}
        />
      ) : (
        <Result answers={answers} shared={shared} onRestart={restart} say={say} />
      )}
      {/* トースト */}
      <div
        aria-live="polite"
        className="tk-noprint"
        style={{
          position: "fixed",
          left: "50%",
          bottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
          transform: "translateX(-50%)",
          background: "var(--ink-900)",
          color: "var(--paper-50)",
          border: "var(--bw-line) solid var(--ink-900)",
          boxShadow: "var(--shadow-pop-sm)",
          padding: "10px 18px",
          borderRadius: "var(--radius-full)",
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: 14,
          opacity: toast ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity var(--dur-base)",
          zIndex: 20,
          whiteSpace: "nowrap",
          maxWidth: "92vw",
        }}
      >
        {toast}
      </div>
    </div>
  );
}

/* ============================================================
   質問画面
   ============================================================ */
function Ask({
  draft,
  qi,
  fresh,
  onChange,
  onNav,
  onFinish,
}: {
  draft: Draft;
  qi: number;
  fresh: string | null;
  onChange: (d: Draft, key: string) => void;
  onNav: (i: number) => void;
  onFinish: (a: Answers) => void;
}) {
  const q = QUESTIONS[qi];
  const opts = q.opts.filter((o) => !o.onlyWork || draft.role === "work");
  const sel = draft[q.id] as string | string[] | null;
  const answered = Array.isArray(sel) ? sel.length > 0 : !!sel;
  const last = qi === QUESTIONS.length - 1;

  const pick = (v: string) => {
    const d: Draft = { ...draft, dev: [...draft.dev], svc: [...draft.svc] };
    if (q.type === "single") {
      (d as unknown as Record<string, unknown>)[q.id] = v;
    } else {
      const arr = d[q.id] as string[];
      const i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(v);
    }
    /* 個人に戻したら、仕事限定の選択肢（会社のクラウド）は外す */
    if (q.id === "role" && v === "personal") d.svc = d.svc.filter((s) => s !== "cloud");
    if (qi === 0 && !draft.sit) track("taisaku_start");
    onChange(d, q.id);
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* —— 回答の控え —— */}
      <div
        className="tk-sheet"
        style={{
          background: "var(--paper-0)",
          border: "var(--bw-bold) solid var(--ink-900)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-pop)",
          padding: "18px 20px 6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <i className="ph-bold ph-clipboard-text" style={{ fontSize: 18, color: "var(--red-500)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15 }}>あなたの回答</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
            {qi + 1} / {QUESTIONS.length}
          </span>
        </div>
        <div className="tk-lines" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20 }}>
          {QUESTIONS.map((qq) => {
            const v = draft[qq.id] as string | string[] | null;
            const txt = Array.isArray(v) ? v.map((x) => LABEL[x]).join("・") : v ? LABEL[v] : "";
            return (
              <div
                key={qq.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "5.5em 1fr",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: "var(--bw-hair) solid var(--paper-200)",
                  minHeight: 44,
                  alignItems: "start",
                }}
              >
                <span style={{ color: "var(--text-muted)", fontSize: 13, paddingTop: 2, fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                  <i className={"ph-bold " + qq.icon} style={{ marginRight: 5 }} />
                  {qq.key}
                </span>
                <span
                  className={txt && qq.id === fresh ? "tk-line-fresh" : undefined}
                  style={{ fontWeight: txt ? 700 : 400, fontSize: 14.5, lineHeight: 1.6, color: txt ? "var(--ink-900)" : "var(--text-disabled)" }}
                >
                  {txt || "　"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* —— 質問 —— */}
      <div
        style={{
          background: "var(--paper-100)",
          border: "var(--bw-line) solid var(--ink-900)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 20px 18px",
          backgroundImage: "var(--tone-dots)",
          backgroundSize: "var(--tone-dots-size)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700 }}>
          Q{qi + 1}
          {q.hint && <span style={{ marginLeft: 10, color: "var(--text-muted)", letterSpacing: 0, fontFamily: "var(--font-body)" }}>{q.hint}</span>}
        </div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "clamp(18px,2.6vw,22px)", lineHeight: 1.4, margin: "4px 0 14px" }}>{q.title}</h2>
        <div role={q.type === "single" ? "radiogroup" : "group"} style={{ display: "grid", gap: 10 }}>
          {opts.map((o) => {
            const on = q.type === "single" ? sel === o.v : (sel as string[]).includes(o.v);
            return (
              <button
                key={o.v}
                type="button"
                className="tk-opt"
                role={q.type === "single" ? "radio" : "checkbox"}
                aria-checked={on}
                onClick={() => pick(o.v)}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 22,
                    height: 22,
                    flex: "none",
                    marginTop: 1,
                    border: "var(--bw-line) solid var(--ink-900)",
                    borderRadius: q.type === "single" ? "50%" : "var(--radius-xs)",
                    background: on ? "var(--red-500)" : "var(--paper-0)",
                    color: "var(--paper-0)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                  }}
                >
                  {on && <i className="ph-bold ph-check" />}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, lineHeight: 1.5 }}>{o.l}</span>
                  {o.h && <span style={{ display: "block", color: "var(--text-muted)", fontSize: 12.5, lineHeight: 1.6, marginTop: 2 }}>{o.h}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 16 }}>
          <Button variant="ghost" size="sm" onClick={() => onNav(qi - 1)} style={{ visibility: qi === 0 ? "hidden" : "visible" }} iconLeft={<i className="ph-bold ph-arrow-left" />}>
            戻る
          </Button>
          <Button
            variant="primary"
            disabled={!answered}
            onClick={() => {
              if (!last) {
                onNav(qi + 1);
                return;
              }
              const a = complete(draft);
              if (a) onFinish(a);
            }}
            iconRight={<i className={"ph-bold " + (last ? "ph-file-text" : "ph-arrow-right")} />}
          >
            {last ? "対策書をつくる" : "次へ"}
          </Button>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.8, color: "var(--text-muted)", textAlign: "center" }}>
        <i className="ph-bold ph-lock-key" style={{ marginRight: 4 }} />
        回答はこの端末の中だけで処理されます。サーバーには送られません。
      </p>
    </div>
  );
}

/* ============================================================
   手順書画面
   ============================================================ */
function Result({ answers, shared, onRestart, say }: { answers: Answers; shared: boolean; onRestart: () => void; say: (m: string) => void }) {
  const plan = React.useMemo(() => buildPlan(answers), [answers]);
  const all = React.useMemo(() => [...plan.today, ...plan.week, ...plan.inc], [plan]);
  const [curDev, setCurDev] = React.useState<Device>(answers.dev[0]);
  const [done, setDone] = React.useState<Done>({});
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const [today, setToday] = React.useState("");

  /* 進捗はブラウザ内から（初回描画のあとで読む。SSRと食い違わないように） */
  React.useEffect(() => {
    setDone(loadDone(answers));
    setToday(new Date().toLocaleDateString("ja-JP"));
  }, [answers]);

  const nDone = all.filter((id) => done[id]).length;
  const pct = all.length ? Math.round((nDone / all.length) * 100) : 0;

  const toggleDone = (id: string) => {
    const d: Done = { ...done };
    if (d[id]) delete d[id];
    else d[id] = true;
    setDone(d);
    saveDone(answers, d);
    const n = all.filter((x) => d[x]).length;
    if (n === all.length) say("全部終わりました。あなたは、もう狙われにくい人です。");
    else if (d[id]) say("チェックしました");
  };

  const share = async () => {
    const url = location.origin + location.pathname + "#" + encodeAnswers(answers);
    const text = "あなた用のセキュリティ手順書を作りました。開いて、上から順にやってみて。";
    track("taisaku_share");
    try {
      if (navigator.share) {
        await navigator.share({ title: "対策書｜COMIXAI", text, url });
        return;
      }
    } catch {
      return; /* キャンセル */
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      say("リンクをコピーしました");
    } catch {
      prompt("このリンクを送ってください", url);
    }
  };

  const print = () => {
    track("taisaku_print");
    /* 印刷時は全カード展開（CSS側でも display:block にしているが、aria状態も揃える） */
    setOpen(Object.fromEntries(all.map((id) => [id, true])));
    setTimeout(() => window.print(), 50);
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {shared && (
        <div
          className="tk-noprint"
          style={{
            background: "var(--yellow-200)",
            border: "var(--bw-line) solid var(--ink-900)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            fontSize: 13.5,
            lineHeight: 1.7,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <i className="ph-bold ph-envelope-open" style={{ fontSize: 18, marginTop: 2, flex: "none" }} />
          <span>
            共有された対策書です。チェックはこの端末に保存されます。自分の状況で作り直すなら、下の「答え直す」から。
          </span>
        </div>
      )}

      {/* —— 表紙 —— */}
      <div
        className="tk-sheet"
        style={{
          background: "var(--paper-0)",
          border: "var(--bw-bold) solid var(--ink-900)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-pop)",
          padding: "22px 22px 20px",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <Badge tone="red">{LABEL[answers.sit]}</Badge>
          {answers.role === "work" && <Badge tone="ink">仕事で個人情報を扱う</Badge>}
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{today}</span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(24px,3.4vw,32px)", lineHeight: 1.3, margin: "0 0 8px" }}>
          {SIT_TITLE[answers.sit]}
        </h2>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {answers.dev.map((d) => (
            <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <i className={"ph-bold " + DEVICE_ICON[d]} />
              {DEVICE_NAME[d]}
            </span>
          ))}
          <span aria-hidden="true">｜</span>
          <span>{answers.svc.map((s) => LABEL[s]).join("・")}</span>
        </div>

        {/* 前書き */}
        <div
          style={{
            marginTop: 16,
            padding: "14px 16px",
            background: "var(--paper-100)",
            borderLeft: "var(--bw-heavy) solid var(--ink-900)",
            borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
            fontSize: 15,
            lineHeight: 1.9,
            color: "var(--text-body)",
          }}
        >
          {preface(answers, plan).map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : "6px 0 0" }}>
              {p}
            </p>
          ))}
        </div>

        {/* 進捗 */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, fontSize: 13.5 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, whiteSpace: "nowrap" }}>
            {nDone} / {all.length} 完了
          </span>
          <div
            role="progressbar"
            aria-valuenow={nDone}
            aria-valuemin={0}
            aria-valuemax={all.length}
            style={{ flex: 1, height: 12, border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-full)", background: "var(--paper-0)", overflow: "hidden" }}
          >
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--green-500)", transition: "width var(--dur-slow) var(--ease-out)" }} />
          </div>
        </div>

        {/* 端末タブ */}
        {answers.dev.length > 1 && (
          <div className="tk-noprint" style={{ marginTop: 16 }}>
            <div role="tablist" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {answers.dev.map((d) => (
                <button key={d} type="button" role="tab" className="tk-devtab" aria-selected={d === curDev} onClick={() => setCurDev(d)}>
                  <i className={"ph-bold " + DEVICE_ICON[d]} />
                  {DEVICE_NAME[d]}で見る
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>手順は端末ごとに違います。今手に持っている方を選んでください。</div>
          </div>
        )}
      </div>

      {/* —— 3段階 —— */}
      {(Object.keys(PHASES) as PhaseKey[]).map((ph) => (
        <section key={ph} aria-labelledby={`tk-${ph}`}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 4, marginTop: 10 }}>
            <h3 id={`tk-${ph}`} style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(20px,2.8vw,24px)", margin: 0, lineHeight: 1.3 }}>
              <i className={"ph-bold " + PHASES[ph].icon} style={{ color: "var(--red-500)", marginRight: 8 }} />
              <span style={ph === "today" ? { background: "linear-gradient(transparent 60%, var(--yellow-400) 60%)" } : undefined}>{PHASES[ph].t}</span>
            </h3>
            {ph !== "inc" && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)" }}>
                {plan[ph].length}枚・約{minutes(plan[ph])}分
              </span>
            )}
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--text-muted)", fontFamily: "var(--font-hand)" }}>{PHASES[ph].lead}</p>
          <div style={{ display: "grid", gap: 12 }}>
            {plan[ph].map((id) => (
              <StepCard
                key={id}
                card={CARDS[id]}
                dev={curDev}
                chosen={answers.dev}
                done={!!done[id]}
                open={!!open[id]}
                onOpen={() => setOpen((o) => ({ ...o, [id]: true }))}
                onToggleDone={() => toggleDone(id)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* —— 操作 —— */}
      <div className="tk-noprint" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 10 }}>
        <Button variant="primary" onClick={share} iconLeft={<i className="ph-bold ph-paper-plane-tilt" />}>
          この対策書を送る（家族・親へ）
        </Button>
        <Button variant="secondary" onClick={print} iconLeft={<i className="ph-bold ph-printer" />}>
          印刷・PDF
        </Button>
        <Button variant="ghost" onClick={onRestart} iconLeft={<i className="ph-bold ph-arrow-counter-clockwise" />}>
          答え直す
        </Button>
      </div>

      <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.8, color: "var(--text-muted)", borderTop: "var(--bw-hair) solid var(--paper-200)", paddingTop: 12 }}>
        手順の項目名は、OSやアプリの更新で変わることがあります。見つからない時は、「設定」の中の検索欄に項目名を入れると出てきます。
        <span className="tk-noprint"> 回答とチェックはこの端末の中だけに保存され、サーバーには送られません。</span>
      </p>
    </div>
  );
}

/* ============================================================
   手順カード1枚
   ============================================================ */
function StepCard({
  card,
  dev,
  chosen,
  done,
  open,
  onOpen,
  onToggleDone,
}: {
  card: Card;
  dev: Device;
  chosen: Device[];
  done: boolean;
  open: boolean;
  onOpen: () => void;
  onToggleDone: () => void;
}) {
  const st = stepsFor(card, dev, chosen);
  const devName = st.dev === "any" ? "" : DEVICE_NAME[st.dev];
  const verified = card.verified
    ? `実機確認：${card.verified.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, y, m, d) => `${y}年${Number(m)}月${Number(d)}日`)}`
    : `手順カード更新：${CARDS_REVISED}`;

  return (
    <article
      className="tk-card"
      style={{
        background: "var(--paper-0)",
        border: "var(--bw-line) solid var(--ink-900)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-pop-sm)",
        opacity: done ? 0.72 : 1,
        transition: "opacity var(--dur-base)",
      }}
    >
      {/* 頭：閉じていれば開く、開いていれば✓の切り替え */}
      <button
        type="button"
        className="tk-card-head"
        aria-expanded={open}
        aria-pressed={done}
        onClick={() => (open ? onToggleDone() : onOpen())}
      >
        <span
          aria-hidden="true"
          style={{
            width: 26,
            height: 26,
            marginTop: 1,
            border: "var(--bw-line) solid var(--ink-900)",
            borderRadius: "var(--radius-xs)",
            background: done ? "var(--green-500)" : "var(--paper-0)",
            color: "var(--paper-0)",
            display: "grid",
            placeItems: "center",
            fontSize: 16,
          }}
        >
          {done && <i className="ph-bold ph-check" />}
        </span>
        <span>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-heading)",
              fontWeight: 900,
              fontSize: 16,
              lineHeight: 1.45,
              textDecoration: done ? "line-through" : "none",
              textDecorationColor: "var(--red-500)",
              color: done ? "var(--text-muted)" : "var(--ink-900)",
            }}
          >
            {card.t}
          </span>
          {card.why && <span style={{ display: "block", color: "var(--text-muted)", fontSize: 13.5, lineHeight: 1.6, marginTop: 3 }}>{card.why}</span>}
        </span>
        <span className="tk-card-meta" style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", textAlign: "right", fontFamily: "var(--font-mono)" }}>
          <b style={{ display: "block", color: "var(--ink-900)" }}>{card.time}</b>
          {card.lv}
        </span>
      </button>

      {!open && (
        <button type="button" className="tk-card-toggle" onClick={onOpen}>
          手順を見る{devName ? `（${devName}）` : ""} <i className="ph-bold ph-caret-down" />
        </button>
      )}

      <div className="tk-body" style={{ display: open ? "block" : "none", padding: "0 18px 16px 18px" }}>
        {card.danger && (
          <div
            style={{
              background: "var(--red-50)",
              borderLeft: "var(--bw-bold) solid var(--red-500)",
              padding: "10px 12px",
              fontSize: 14,
              lineHeight: 1.7,
              margin: "0 0 12px",
              borderRadius: "0 var(--radius-xs) var(--radius-xs) 0",
              color: "var(--red-700)",
            }}
          >
            <i className="ph-bold ph-warning" style={{ marginRight: 5 }} />
            {card.danger}
          </div>
        )}
        {st.fallback && devName && (
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", padding: "8px 12px", background: "var(--paper-100)", borderRadius: "var(--radius-xs)", marginBottom: 10 }}>
            <i className={"ph-bold " + DEVICE_ICON[st.dev as Device]} style={{ marginRight: 5 }} />
            この手順は {devName} で行います。
          </div>
        )}
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {st.list.map((s, i) => (
            <li
              key={i}
              style={{
                position: "relative",
                padding: "9px 0 9px 34px",
                fontSize: 15,
                lineHeight: 1.7,
                borderBottom: i < st.list.length - 1 ? "var(--bw-hair) dashed var(--paper-200)" : "none",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 11,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--ink-900)",
                  color: "var(--paper-50)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12.5,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {i + 1}
              </span>
              <span style={{ display: "block", fontWeight: 700 }}>
                <PathText path={s.path} />
              </span>
              {s.tip && <span style={{ display: "block", color: "var(--text-muted)", fontSize: 13.5, lineHeight: 1.65, marginTop: 2 }}>{s.tip}</span>}
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--text-muted)", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span>
            <i className="ph-bold ph-clock-counter-clockwise" style={{ marginRight: 4 }} />
            {verified}
          </span>
          {card.src ? (
            <a className="tk-src" href={card.src} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", fontWeight: 700 }}>
              {card.srcn || "参考"} <i className="ph-bold ph-arrow-up-right" />
            </a>
          ) : card.srcn ? (
            <span>参考：{card.srcn}</span>
          ) : null}
          <button
            type="button"
            className="tk-noprint"
            onClick={onToggleDone}
            style={{
              marginLeft: "auto",
              font: "inherit",
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 13,
              color: done ? "var(--text-muted)" : "var(--green-500)",
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <i className={"ph-bold " + (done ? "ph-arrow-counter-clockwise" : "ph-check-circle")} style={{ marginRight: 4 }} />
            {done ? "やってない に戻す" : "やった"}
          </button>
        </div>
      </div>
    </article>
  );
}
