"use client";

/* ============================================================
   きょうの きみに — 画面まるごとのクライアントコンポーネント。
   結果画面は「犬のループ動画を全画面＋名言をオーバーレイ」。
   名言は下側に1文字ずつゆっくり出し、出終わったら全文（小さめ）と
   シェア導線（サイト共通の ShareRow）に切り替わる。
   AI（/api/cheer）は名言を選ぶだけ。失敗したらこの場でランダム選書。
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { FEELS, WHYS, type Choice } from "./data";
import { kotobaFor, type Kotoba } from "./quotes";
import { PETS, type Pet } from "./pets";

type Screen = "ask" | "result";
type Phase = "thinking" | "play" | "after";

/* 1文字あたりの間隔・行の読ませ時間・行が消えるフェード（ミリ秒） */
const CHAR_MS = 90;
const LINE_HOLD_MS = 1000;
const LINE_FADE_MS = 350;
const START_DELAY_MS = 400;

function pick<T>(arr: T[], avoid?: T | null): T {
  const pool = avoid ? arr.filter((x) => x !== avoid) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((res) => {
    const t = setTimeout(res, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      res();
    });
  });
}

interface Selected {
  id: string;
  who: string;
  lines: string[];
  source: string;
  reason?: string;
}

function creditFor(who: string): string {
  return who === "ことわざ" ? "ことわざ" : `${who}のことば`;
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

/* サイトのフッターと同じ「丸アイコン」のシェア列。
   はてブはやめて主要SNSに。PhosphorにLINEのロゴグリフが無いので
   （商標を描き直さない方針）、LINEだけ文字で出す。 */
function CheerShare({ text, onCopied }: { text: string; onCopied: () => void }) {
  const url = "https://comixai.dev/cheer";
  const full = `${text} ${url}`;
  const links = [
    {
      id: "x",
      label: "X",
      icon: <i className="ph-bold ph-x-logo" />,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      id: "line",
      label: "LINE",
      icon: <span className="line-word">LINE</span>,
      href: `https://line.me/R/share?text=${encodeURIComponent(full)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: <i className="ph-bold ph-facebook-logo" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      id: "threads",
      label: "Threads",
      icon: <i className="ph-bold ph-threads-logo" />,
      href: `https://www.threads.net/intent/post?text=${encodeURIComponent(full)}`,
    },
  ];
  return (
    <div className="share-row">
      {links.map((it) => (
        <a
          key={it.id}
          className="share-btn"
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${it.label}でシェア`}
          data-ga="share_click"
          data-ga-network={it.id}
          data-ga-path="/cheer"
        >
          <span className="share-circle">{it.icon}</span>
          <span className="share-label">{it.label}</span>
        </a>
      ))}
      <button
        type="button"
        className="share-btn"
        aria-label="リンクをコピー"
        data-ga="share_click"
        data-ga-network="copy"
        data-ga-path="/cheer"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(full);
            onCopied();
          } catch {
            /* コピーできない環境では何もしない */
          }
        }}
      >
        <span className="share-circle">
          <i className="ph-bold ph-link" />
        </span>
        <span className="share-label">コピー</span>
      </button>
    </div>
  );
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
  const [phase, setPhase] = useState<Phase>("thinking");
  const [sel, setSel] = useState<Selected | null>(null);
  const [cur, setCur] = useState<{ li: number; out: boolean }>({ li: 0, out: false }); // いま出している行
  const [msg, setMsg] = useState("");

  const ctlRef = useRef<AbortController | null>(null);
  const lastPetRef = useRef<Pet | null>(null);
  const lastQuoteRef = useRef(""); // 直前に出した名言のid（連続で同じものを出さない）
  const selRef = useRef<Selected | null>(null);
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
    setPhase("thinking");
    setSel(null);
    setMsg("");

    const debug = new URLSearchParams(window.location.search).has("debug");
    let picked: Selected | null = null;
    try {
      picked = await askServer(
        { feel, why, note: note.trim(), avoid: lastQuoteRef.current },
        signal,
      );
    } catch {
      if (signal.aborted) return;
    }
    if (signal.aborted) return;
    if (!picked) {
      /* サーバーに届かなかったら、この場でランダム選書（ストックは手元にもある） */
      const k: Kotoba = pick(kotobaFor(feel, lastQuoteRef.current));
      picked = { id: k.id, who: k.who, lines: k.lines, source: "local" };
    }
    lastQuoteRef.current = picked.id;
    selRef.current = picked;
    if (debug) setMsg(`でばっぐ：${picked.source}${picked.reason ? "/" + picked.reason : ""}`);

    setSel(picked);

    /* reduced-motion なら演出を飛ばして全文＋シェアへ */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("after");
      return;
    }

    /* 1行ずつ：1文字ずつ出す → 読ませる → ふっと消す → 次の行 */
    setCur({ li: 0, out: false });
    setPhase("play");
    for (let li = 0; li < picked.lines.length; li++) {
      setCur({ li, out: false });
      const chars = [...picked.lines[li]].length;
      await sleep(START_DELAY_MS + chars * CHAR_MS + LINE_HOLD_MS, signal);
      if (signal.aborted) return;
      setCur({ li, out: true });
      await sleep(LINE_FADE_MS, signal);
      if (signal.aborted) return;
    }
    setPhase("after");
  }

  function restart() {
    ctlRef.current?.abort();
    setScreen("ask");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* いまの動画フレームを背景に、名言を載せた画像を保存する */
  async function saveImage() {
    const p = petRef.current;
    const s = selRef.current;
    const video = videoRef.current;
    if (!p || !s || !video) return;
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
    /* 画面と同じく、下側に白のスクリム＋名言 */
    const grad = g.createLinearGradient(0, H * 0.42, 0, H);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.65)");
    grad.addColorStop(1, "rgba(255,255,255,0.95)");
    g.fillStyle = grad;
    g.fillRect(0, H * 0.42, W, H * 0.58);
    const n = s.lines.length;
    const fontSize = n <= 3 ? 60 : 52;
    const lineH = fontSize * 1.6;
    let y = H - 250 - (n - 1) * lineH;
    g.fillStyle = "#3B3350";
    g.textAlign = "center";
    g.font = `700 ${fontSize}px 'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif`;
    s.lines.forEach((l) => {
      g.fillText(l, W / 2, y);
      y += lineH;
    });
    g.font = "500 32px 'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif";
    g.fillStyle = "#6B6285";
    g.fillText(creditFor(s.who), W / 2, y + 8);
    g.fillText("きょうの きみに", W / 2, H - 60);
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

          {/* 名言：顔より下に、いまの1行だけを1文字ずつ。前の行は消す */}
          {phase !== "after" && (
            <div className="film-body">
              {phase === "thinking" || !sel ? (
                <span className="dots">・・・</span>
              ) : (
                <p key={cur.li} className={`film-lines${cur.out ? " out" : ""}`}>
                  {[...(sel.lines[cur.li] ?? "")].map((ch, ci) => (
                    <span
                      key={ci}
                      className="ch"
                      style={{ animationDelay: `${START_DELAY_MS + ci * CHAR_MS}ms` }}
                    >
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}

          {/* 出し終わり：全文（小さめ）＋シェア */}
          {phase === "after" && sel && (
            <div className="film-after">
              <p className="after-lines">{sel.lines.join("\n")}</p>
              <p className="after-credit">{creditFor(sel.who)}</p>
              <CheerShare
                text={`${sel.lines.join(" ")}（${creditFor(sel.who)}）| きょうの きみに`}
                onCopied={() => setMsg("りんくを こぴーしたよ")}
              />
            </div>
          )}

          {/* 左上：もどる ／ 右上：ダウンロード（出し終わってから） */}
          <button className="film-top-btn left" type="button" onClick={restart} aria-label="はじめにもどる">
            <i className="ph-bold ph-arrow-left" />
          </button>
          {phase === "after" && (
            <button
              className="film-top-btn right"
              type="button"
              onClick={saveImage}
              aria-label="がぞうを ほぞん"
            >
              <i className="ph-bold ph-download-simple" />
            </button>
          )}
          <p className="film-msg">{msg}</p>
        </section>
      )}
    </div>
  );
}
