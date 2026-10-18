"use client";

/* ============================================================
   サイバー攻撃防災手帳（/bousai）の本体。質問 → 生成演出 → 手順書まで、
   全部ブラウザ内で完結する。

   ・回答も進捗もサーバーに送らない。localStorage だけ
     （セキュリティ不安を扱うコンテンツが、不安の源になってはいけない）
   ・手順カードの本文は data.ts に固定で持つ。AIは関与しない
   ・共有は回答をURLハッシュに埋め込む（#s=..&d=..&r=..&v=..&p=..）。
     開いた側は質問なしで手順書が出て、チェックは開いた端末に保存される
   ・印刷は window.print()。印刷時は白地・黒字に戻す（bousai.css）
   見た目のクラスは bousai.css。色は --tk-* に集めてある。
   ============================================================ */

import React from "react";
import { track } from "../ga";
import {
  QUESTIONS,
  SERVICE_CATEGORIES,
  SERVICE_ORDER,
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
const storageKey = (a: Answers) => "bousai:" + encodeAnswers(a);
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

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* 1文字ずつ打ち出す。reduced-motion なら一気に出す */
function useTypewriter(text: string, speed = 28): { shown: string; typing: boolean } {
  const [shown, setShown] = React.useState(text);
  const [typing, setTyping] = React.useState(false);
  React.useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(text);
      setTyping(false);
      return;
    }
    let i = 0;
    setShown("");
    setTyping(true);
    const t = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(t);
        setTyping(false);
      }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return { shown, typing };
}

/* 「設定 → 自分の名前 → …」の矢印をアイコンに置き換えて描く */
function PathText({ path }: { path: string }) {
  const parts = path.split("→");
  return (
    <>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <i className="ph-bold ph-arrow-right tk-ar" />}
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

type Screen = "ask" | "build" | "result";

export function TaisakuApp() {
  const [screen, setScreen] = React.useState<Screen>("ask");
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
      track("bousai_open_shared", { sit: a.sit });
    }
  }, []);

  const finish = (a: Answers) => {
    setAnswers(a);
    setShared(false);
    track("bousai_result", { sit: a.sit, role: a.role, devices: a.dev.length, services: a.svc.length });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setScreen(prefersReducedMotion() ? "result" : "build");
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
    <div>
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
      ) : screen === "build" ? (
        <Build answers={answers} onDone={() => setScreen("result")} />
      ) : (
        <Result answers={answers} shared={shared} onRestart={restart} say={say} />
      )}
      <div aria-live="polite" className={"tk-toast" + (toast ? " show" : "")}>
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
  const { shown, typing } = useTypewriter(q.title);

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
    if (qi === 0 && !draft.sit) track("bousai_start");
    onChange(d, q.id);
  };

  return (
    <div className="tk-enter">
      {/* —— 回答の控え —— */}
      <div className="tk-panel">
        <span className="tk-corner" />
        <div className="tk-panel-head">
          <i className="ph-bold ph-clipboard-text" style={{ fontSize: 16 }} />
          INPUT
          <span className="tk-spacer" />
          <span className="tk-count">
            {qi + 1} / {QUESTIONS.length}
          </span>
        </div>
        <div className="tk-lines">
          {QUESTIONS.map((qq) => {
            const v = draft[qq.id] as string | string[] | null;
            const txt = Array.isArray(v) ? v.map((x) => LABEL[x]).join("・") : v ? LABEL[v] : "";
            return (
              <div key={qq.id} className="tk-line">
                <span className="tk-k">
                  <i className={"ph-bold " + qq.icon} style={{ marginRight: 5 }} />
                  {qq.key}
                </span>
                <span className={"tk-v" + (txt ? " on" : "") + (txt && qq.id === fresh ? " fresh" : "")}>{txt || "--"}</span>
              </div>
            );
          })}
        </div>

        {/* —— 質問 —— */}
        <div className="tk-q" key={q.id}>
          <div className="tk-q-num">
            Q{qi + 1}
            {q.hint && <span className="tk-hint">{q.hint}</span>}
          </div>
          <h2 className="tk-q-title">
            {shown}
            {typing && <span className="tk-caret" aria-hidden="true" />}
          </h2>
          {q.id === "svc" ? (
            <ServicePicker selected={draft.svc} work={draft.role === "work"} onPick={pick} />
          ) : (
          <div className="tk-opts" role={q.type === "single" ? "radiogroup" : "group"}>
            {opts.map((o) => {
              const on = q.type === "single" ? sel === o.v : (sel as string[]).includes(o.v);
              return (
                <button
                  key={o.v}
                  type="button"
                  className={"tk-opt" + (q.type === "single" ? " radio" : "")}
                  role={q.type === "single" ? "radio" : "checkbox"}
                  aria-checked={on}
                  onClick={() => pick(o.v)}
                >
                  <span className="tk-box" aria-hidden="true">
                    {on && <i className="ph-bold ph-check" />}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span className="tk-l">{o.l}</span>
                    {o.h && <span className="tk-h">{o.h}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          )}
          <div className="tk-nav">
            <button type="button" className="tk-btn quiet sm" onClick={() => onNav(qi - 1)} style={{ visibility: qi === 0 ? "hidden" : "visible" }}>
              <i className="ph-bold ph-arrow-left" />
              戻る
            </button>
            <button
              type="button"
              className="tk-btn"
              disabled={!answered}
              onClick={() => {
                if (!last) {
                  onNav(qi + 1);
                  return;
                }
                const a = complete(draft);
                if (a) onFinish(a);
              }}
            >
              {last ? "防災手帳を生成" : "次へ"}
              <i className={"ph-bold " + (last ? "ph-lightning" : "ph-arrow-right")} />
            </button>
          </div>
        </div>
      </div>

      <p className="tk-note">
        <i className="ph-bold ph-lock-key" style={{ marginRight: 4 }} />
        LOCAL ONLY — 回答はこの端末の中だけで処理され、サーバーには送られません。
      </p>
    </div>
  );
}

/* ============================================================
   使うもの：カテゴリのチップを開くと、その中のサービスを選べる。
   選んだ数をチップに出すので、閉じても選んだことが分かる
   ============================================================ */
function ServicePicker({ selected, work, onPick }: { selected: string[]; work: boolean; onPick: (v: string) => void }) {
  const cats = SERVICE_CATEGORIES.filter((c) => !c.onlyWork || work);
  const [open, setOpen] = React.useState<string>(cats[0].id);
  const cur = cats.find((c) => c.id === open) ?? cats[0];
  return (
    <div>
      <div className="tk-cats" role="tablist" aria-label="分類">
        {cats.map((c) => {
          const n = c.services.filter((o) => selected.includes(o.v)).length;
          return (
            <button key={c.id} type="button" role="tab" className="tk-cat" aria-selected={c.id === cur.id} onClick={() => setOpen(c.id)}>
              <i className={"ph-bold " + c.icon} />
              {c.label}
              {n > 0 && <span className="tk-cat-n">{n}</span>}
            </button>
          );
        })}
      </div>
      <div className="tk-opts tk-cat-body" role="group" aria-label={cur.label} key={cur.id}>
        {cur.services.map((o) => {
          const on = selected.includes(o.v);
          return (
            <button key={o.v} type="button" className="tk-opt" role="checkbox" aria-checked={on} onClick={() => onPick(o.v)}>
              <span className="tk-box" aria-hidden="true">
                {on && <i className="ph-bold ph-check" />}
              </span>
              <span style={{ flex: 1 }}>
                <span className="tk-l">{o.l}</span>
                {o.h && <span className="tk-h">{o.h}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <div className="tk-cat-note">
        {selected.length ? `${selected.length}個 選択中` : "使っているものにチェック。使っていない分類は飛ばしてOK"}
      </div>
    </div>
  );
}

/* ============================================================
   生成演出（ターミナル風に1行ずつ）。中身は buildPlan の結果そのもの
   ============================================================ */
function Build({ answers, onDone }: { answers: Answers; onDone: () => void }) {
  const lines = React.useMemo(() => {
    const plan = buildPlan(answers);
    return [
      { t: `> 端末: ${answers.dev.map((d) => DEVICE_NAME[d]).join(", ")}`, c: "dim" },
      { t: `> 対象: ${answers.svc.length > 4 ? answers.svc.slice(0, 4).map((s) => LABEL[s]).join(", ") + ` ほか${answers.svc.length - 4}` : answers.svc.map((s) => LABEL[s]).join(", ") || "共通のみ"}`, c: "dim" },
      { t: `手順カード ${Object.keys(CARDS).length} 枚を照合`, c: "ok" },
      { t: `今日の15分: ${plan.today.length} 枚（約${minutes(plan.today)}分）`, c: "ok" },
      { t: `今週中に: ${plan.week.length} 枚`, c: "ok" },
      { t: `もしもの時に: ${plan.inc.length} 枚`, c: "ok" },
      { t: `${SIT_TITLE[answers.sit]} を生成しました`, c: "ok" },
    ];
  }, [answers]);
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (n >= lines.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN(n + 1), n < 2 ? 220 : 330);
    return () => clearTimeout(t);
  }, [n, lines.length, onDone]);
  return (
    <div className="tk-panel tk-enter" aria-live="polite">
      <span className="tk-corner" />
      <div className="tk-panel-head">
        <i className="ph-bold ph-terminal-window" style={{ fontSize: 16 }} />
        GENERATING
      </div>
      <div className="tk-term">
        {lines.slice(0, n).map((l, i) => (
          <div key={i} className={l.c}>
            {l.t}
          </div>
        ))}
        {n < lines.length && <span className="tk-caret" aria-hidden="true" />}
      </div>
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

  /* 選んだサービスごとに、手帳の中で最初に出るカード */
  const svcIndex = React.useMemo(
    () =>
      SERVICE_ORDER.filter((s) => answers.svc.includes(s))
        .map((s) => ({ s, id: all.find((id) => CARDS[id].svc === s) }))
        .filter((x): x is { s: (typeof SERVICE_ORDER)[number]; id: string } => !!x.id),
    [answers.svc, all],
  );
  const jump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setOpen((o) => ({ ...o, [id]: true }));
    document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleDone = (id: string) => {
    const d: Done = { ...done };
    if (d[id]) delete d[id];
    else d[id] = true;
    setDone(d);
    saveDone(answers, d);
    const n = all.filter((x) => d[x]).length;
    if (n === all.length) say("ALL CLEAR — あなたは、もう狙われにくい人です。");
    else if (d[id]) say("チェックしました");
  };

  const share = async () => {
    const url = location.origin + location.pathname + "#" + encodeAnswers(answers);
    const text = "あなた用のセキュリティ手順書を作りました。開いて、上から順にやってみて。";
    track("bousai_share");
    try {
      if (navigator.share) {
        await navigator.share({ title: "サイバー攻撃防災手帳｜COMIXAI", text, url });
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
    track("bousai_print");
    /* 印刷時は全カード展開（CSS側でも display:block にしているが、aria状態も揃える） */
    setOpen(Object.fromEntries(all.map((id) => [id, true])));
    setTimeout(() => window.print(), 50);
  };

  return (
    <div className="tk-enter">
      {shared && (
        <div className="tk-banner tk-noprint">
          <i className="ph-bold ph-envelope-open" style={{ fontSize: 18, marginTop: 2, flex: "none" }} />
          <span>共有された防災手帳です。チェックはこの端末に保存されます。自分の状況で作り直すなら、下の「答え直す」から。</span>
        </div>
      )}

      {/* —— 表紙 —— */}
      <div className="tk-panel">
        <span className="tk-corner" />
        <div className="tk-tags">
          <span className="tk-tag red">{LABEL[answers.sit]}</span>
          {answers.role === "work" && <span className="tk-tag">仕事で個人情報を扱う</span>}
          <span className="tk-date">{today}</span>
        </div>
        <h2 className="tk-doc-title">{SIT_TITLE[answers.sit]}</h2>
        <div className="tk-doc-sub">
          {answers.dev.map((d) => (
            <span key={d}>
              <i className={"ph-bold " + DEVICE_ICON[d]} />
              {DEVICE_NAME[d]}
            </span>
          ))}
          <span aria-hidden="true">｜</span>
          <span>{answers.svc.map((s) => LABEL[s]).join("・")}</span>
        </div>

        <div className="tk-preface">
          {preface(answers, plan).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="tk-progress">
          <span>
            {nDone} / {all.length} 完了
          </span>
          <div className="tk-bar" role="progressbar" aria-valuenow={nDone} aria-valuemin={0} aria-valuemax={all.length}>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* サービス別の目次：そのサービスの最初のカードへ飛ぶ */}
        {svcIndex.length > 1 && (
          <nav className="tk-noprint tk-svcidx" aria-label="サービス別の目次">
            {svcIndex.map(({ s, id }) => (
              <a key={s} href={`#card-${id}`} onClick={(e) => jump(e, id)}>
                {LABEL[s]}
              </a>
            ))}
          </nav>
        )}

        {answers.dev.length > 1 && (
          <div className="tk-noprint">
            <div className="tk-devtabs" role="tablist">
              {answers.dev.map((d) => (
                <button key={d} type="button" role="tab" className="tk-devtab" aria-selected={d === curDev} onClick={() => setCurDev(d)}>
                  <i className={"ph-bold " + DEVICE_ICON[d]} />
                  {DEVICE_NAME[d]}で見る
                </button>
              ))}
            </div>
            <div className="tk-devnote">手順は端末ごとに違います。今手に持っている方を選んでください。</div>
          </div>
        )}
      </div>

      {/* —— 3段階 —— */}
      {(Object.keys(PHASES) as PhaseKey[]).map((ph) => (
        <section key={ph} className="tk-phase" aria-labelledby={`tk-${ph}`}>
          <div className="tk-phase-head">
            <h3 id={`tk-${ph}`}>
              <i className={"ph-bold " + PHASES[ph].icon} />
              <span className={ph === "today" ? "tk-today" : undefined}>{PHASES[ph].t}</span>
            </h3>
            {ph !== "inc" && (
              <span className="tk-meta">
                {plan[ph].length}枚・約{minutes(plan[ph])}分
              </span>
            )}
          </div>
          <p className="tk-phase-lead">{PHASES[ph].lead}</p>
          <div className="tk-cards">
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

      <div className="tk-actions tk-noprint">
        <button type="button" className="tk-btn" onClick={share}>
          <i className="ph-bold ph-paper-plane-tilt" />
          この手帳を送る（家族・親へ）
        </button>
        <button type="button" className="tk-btn ghost" onClick={print}>
          <i className="ph-bold ph-printer" />
          印刷・PDF
        </button>
        <button type="button" className="tk-btn quiet" onClick={onRestart}>
          <i className="ph-bold ph-arrow-counter-clockwise" />
          答え直す
        </button>
      </div>

      <p className="tk-foot">
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
    <article id={`card-${card.id}`} className={"tk-card" + (done ? " done" : "") + (open ? " open" : "")} style={{ scrollMarginTop: 16 }}>
      {/* 頭：閉じていれば開く、開いていれば✓の切り替え */}
      <button type="button" className="tk-card-head" aria-expanded={open} aria-pressed={done} onClick={() => (open ? onToggleDone() : onOpen())}>
        <span className="tk-chk" aria-hidden="true">
          {done && <i className="ph-bold ph-check" />}
        </span>
        <span>
          <span className="tk-ttl">{card.t}</span>
          {card.why && <span className="tk-why">{card.why}</span>}
        </span>
        <span className="tk-card-meta">
          <b>{card.time}</b>
          {card.lv}
        </span>
      </button>

      {!open && (
        <button type="button" className="tk-card-toggle" onClick={onOpen}>
          ▶ 手順を見る{devName ? `（${devName}）` : ""}
        </button>
      )}

      <div className="tk-body" style={{ display: open ? "block" : "none" }}>
        {card.danger && (
          <div className="tk-danger">
            <i className="ph-bold ph-warning" style={{ marginRight: 5 }} />
            {card.danger}
          </div>
        )}
        {st.fallback && devName && (
          <div className="tk-nodev">
            <i className={"ph-bold " + DEVICE_ICON[st.dev as Device]} style={{ marginRight: 5 }} />
            この手順は {devName} で行います。
          </div>
        )}
        <ol className="tk-steps">
          {st.list.map((s, i) => (
            <li key={i}>
              <span className="tk-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="tk-path">
                <PathText path={s.path} />
              </span>
              {s.tip && <span className="tk-tip">{s.tip}</span>}
            </li>
          ))}
        </ol>
        <div className="tk-cardfoot">
          <span>
            <i className="ph-bold ph-clock-counter-clockwise" style={{ marginRight: 4 }} />
            {verified}
          </span>
          {card.src ? (
            <a href={card.src} target="_blank" rel="noopener noreferrer">
              {card.srcn || "参考"} <i className="ph-bold ph-arrow-up-right" />
            </a>
          ) : card.srcn ? (
            <span>参考：{card.srcn}</span>
          ) : null}
          <button type="button" className={"tk-donebtn tk-noprint" + (done ? " undo" : "")} onClick={onToggleDone}>
            <i className={"ph-bold " + (done ? "ph-arrow-counter-clockwise" : "ph-check-circle")} style={{ marginRight: 4 }} />
            {done ? "やってない に戻す" : "やった"}
          </button>
        </div>
      </div>
    </article>
  );
}
