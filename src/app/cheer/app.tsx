"use client";

/* ============================================================
   きょうの きみに — 画面まるごとのクライアントコンポーネント。
   結果画面は「犬のループ動画を全画面＋名言をオーバーレイ」。
   名言は quotes.ts の手書きストックそのままで、AI（/api/cheer）は
   選ぶだけ。通信に失敗したらこの場でランダム選書する。
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { FEELS, WHYS, type Choice } from "./data";
import { kotobaFor, type Kotoba } from "./quotes";
import { PETS, type Pet } from "./pets";

type Screen = "ask" | "result";

function pick<T>(arr: T[], avoid?: T | null): T {
  const pool = avoid ? arr.filter((x) => x !== avoid) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface Selected {
  id: string;
  who: string;
  lines: string[];
  source: string;
  reason?: string;
}

/* /api/cheer に選書してもらう。返事が変なら null（→ローカル選書へ） */
async function askServer(
  payload: { feel: string; why: string; note: string; avoid: string },
  signal: AbortSignal,
): Promise<Selected | null> {
  const res = await fetch("/api/cheer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Partial<Selected>;
  if (
    typeof data.id === "string" &&
    typeof data.who === "string" &&
    Array.isArray(data.lines) &&
    data.lines.length > 0 &&
    data.lines.every((l) => typeof l === "string")
  ) {
    return {
      id: data.id,
      who: data.who,
      lines: data.lines,
      source: typeof data.source === "string" ? data.source : "unknown",
      reason: typeof data.reason === "string" ? data.reason : undefined,
    };
  }
  return null;
}

function creditFor(who: string): string {
  return who === "ことわざ" ? "ことわざ" : `${who}のことば`;
}

function Chips({
  items,
  value,
  onPick,
}: {
  items: Choice[];
  value: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="chips">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className="chip"
          aria-pressed={value === it.id}
          onClick={() => onPick(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function CheerApp() {
  const [screen, setScreen] = useState<Screen>("ask");
  const [feel, setFeel] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const [pet, setPet] = useState<Pet | null>(null);
  const [thinking, setThinking] = useState(false);
  const [lines, setLines] = useState<string[] | null>(null);
  const [shown, setShown] = useState(0); // 何行目までフェードインしたか
  const [credit, setCredit] = useState("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false); // 全行出たら保存ボタンを出す

  const ctlRef = useRef<AbortController | null>(null);
  const lastPetRef = useRef<Pet | null>(null);
  const lastQuoteRef = useRef(""); // 直前に出した名言のid（連続で同じものを出さない）
  const linesRef = useRef<string[] | null>(null);
  const creditRef = useRef("");
  const petRef = useRef<Pet | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => () => ctlRef.current?.abort(), []);

  async function start() {
    if (!feel || !why) return;
    ctlRef.current?.abort();
    const ctl = new AbortController();
    ctlRef.current = ctl;
    const signal = ctl.signal;

    const p = pick(PETS, lastPetRef.current);
    lastPetRef.current = p;
    petRef.current = p;

    setScreen("result");
    setPet(p);
    setThinking(true);
    setLines(null);
    setShown(0);
    setCredit("");
    setMsg("");
    setDone(false);

    const debug = new URLSearchParams(window.location.search).has("debug");
    let sel: Selected | null = null;
    try {
      sel = await askServer(
        { feel, why, note: note.trim(), avoid: lastQuoteRef.current },
        signal,
      );
    } catch {
      if (signal.aborted) return;
    }
    if (signal.aborted) return;
    if (!sel) {
      /* サーバーに届かなかったら、この場でランダム選書（ストックは手元にもある） */
      const k: Kotoba = pick(kotobaFor(feel, lastQuoteRef.current));
      sel = { id: k.id, who: k.who, lines: k.lines, source: "local" };
    }
    lastQuoteRef.current = sel.id;
    if (debug) setMsg(`でばっぐ：${sel.source}${sel.reason ? "/" + sel.reason : ""}`);

    setThinking(false);
    setLines(sel.lines);
    linesRef.current = sel.lines;
    await playLines(sel.lines, signal);
    if (signal.aborted) return;
    const c = creditFor(sel.who);
    setCredit(c);
    creditRef.current = c;
    setDone(true);
  }

  /* 1行ずつふわっと出す。reduced-motion なら全部すぐ出す */
  function playLines(ls: string[], signal: AbortSignal): Promise<void> {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(ls.length);
      return Promise.resolve();
    }
    return new Promise((res) => {
      let i = 0;
      const tick = () => {
        if (signal.aborted) return res();
        if (i >= ls.length) return void setTimeout(res, 300);
        i += 1;
        setShown(i);
        setTimeout(tick, 850);
      };
      setTimeout(tick, 500);
    });
  }

  function restart() {
    ctlRef.current?.abort();
    setScreen("ask");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* いまの動画フレームを背景に、名言を載せた画像を保存する */
  async function saveImage() {
    const p = petRef.current;
    const ls = linesRef.current;
    const video = videoRef.current;
    if (!p || !ls || !video) return;
    const W = 1080;
    const H = 1350;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const g = cv.getContext("2d");
    if (!g) return;
    try {
      await document.fonts.load("700 60px 'Zen Maru Gothic'");
    } catch {
      /* 読めなくてもフォールバックフォントで描く */
    }
    /* 動画フレームを cover でトリミングして敷く。動画がまだ読めていなければポスターで代用 */
    let frame: CanvasImageSource = video;
    let vw = video.videoWidth;
    let vh = video.videoHeight;
    if (video.readyState < 2 || !vw || !vh) {
      const img = new Image();
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
        img.src = p.poster;
      });
      frame = img;
      vw = img.naturalWidth || 9;
      vh = img.naturalHeight || 16;
    }
    const scale = Math.max(W / vw, H / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    g.drawImage(frame, (W - dw) / 2, (H - dh) / 2, dw, dh);
    /* 上部に白のスクリムをかけて文字を読みやすく */
    const grad = g.createLinearGradient(0, 0, 0, H * 0.62);
    grad.addColorStop(0, "rgba(255,255,255,0.92)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H * 0.62);
    /* 名言 */
    const n = ls.length;
    const fontSize = n <= 3 ? 64 : 56;
    const lineH = fontSize * 1.55;
    let y = 170;
    g.fillStyle = "#3B3350";
    g.textAlign = "center";
    g.font = `700 ${fontSize}px 'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif`;
    ls.forEach((l) => {
      g.fillText(l, W / 2, y);
      y += lineH;
    });
    g.font = "500 34px 'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif";
    g.fillStyle = "#6B6285";
    g.fillText(creditRef.current, W / 2, y + 20);
    /* 下部のクレジット */
    const gradB = g.createLinearGradient(0, H - 200, 0, H);
    gradB.addColorStop(0, "rgba(255,255,255,0)");
    gradB.addColorStop(1, "rgba(255,255,255,0.85)");
    g.fillStyle = gradB;
    g.fillRect(0, H - 200, W, 200);
    g.fillStyle = "#6B6285";
    g.fillText("きょうの きみに", W / 2, H - 50);
    const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, "image/png"));
    if (!blob) {
      setMsg("ほぞん できなかった");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kyou-no-kimini-${p.id}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setMsg("ほぞんしたよ");
  }

  return (
    <div className="cheer-root">
      {screen === "ask" && (
        <main className="cheer-main">
          <h1>きょうの きみに</h1>
          <section>
            <p className="q">いまの きもち は？</p>
            <Chips items={FEELS} value={feel} onPick={setFeel} />
            <p className="q">なにが あった？</p>
            <Chips items={WHYS} value={why} onPick={setWhy} />
            <input
              className="note"
              type="text"
              maxLength={60}
              placeholder="ひとこと あれば（かかなくても だいじょうぶ）"
              autoComplete="off"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="hint">かいたことは、この こだけが よみます</p>
            <button className="go" type="button" disabled={!(feel && why)} onClick={start}>
              きいてもらう
            </button>
          </section>
        </main>
      )}

      {screen === "result" && pet && (
        <section className="film">
          <video
            ref={videoRef}
            key={pet.id}
            className="film-video"
            src={pet.video}
            poster={pet.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="film-scrim" />
          <div className="film-body">
            <p className="film-lines">
              {lines ? (
                lines.map((l, i) => (
                  <span key={`${l}-${i}`} className={i < shown ? "in" : ""}>
                    {l}
                  </span>
                ))
              ) : (
                <span className="dots in">・・・</span>
              )}
            </p>
            <p className={`film-credit${credit ? " in" : ""}`}>{credit}</p>
          </div>
          <p className="film-petname">{pet.name}</p>
          <p className="film-msg">{msg}</p>
          <div className="film-actions">
            {done && (
              <button className="film-btn" type="button" onClick={saveImage}>
                がぞうを ほぞん
              </button>
            )}
            <button className="film-btn primary" type="button" onClick={restart}>
              はじめから
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
