"use client";

/* ============================================================
   きょうの きみに — 画面まるごとのクライアントコンポーネント。
   結果画面は「犬のループ動画を全画面＋名言をオーバーレイ」。
   名言は下側に1文字ずつゆっくり出し、出終わったら全文（小さめ）と
   シェア導線（サイト共通の ShareRow）に切り替わる。
   AI（/api/cheer）は名言を選ぶだけ。失敗したらこの場でランダム選書。
   犬は名言ごとに決まる（dogFor）。シェアしたときのOGPカードと
   同じ子が出るようにするため。
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { FEELS, WHYS, type Choice } from "./data";
import { kotobaFor, type Kotoba } from "./quotes";
import { dogFor, type Pet } from "./pets";

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
   （商標を描き直さない方針）、LINEだけ文字で出す。
   アイコンは各SNSの投稿画面へワンタップ直行（投稿には
   /cheer/k/ のOGPカードが付く）。動画ファイルを載せたい人は
   「どうがで シェア」からシェアシートで */
function CheerShare({
  text,
  url,
  onCopied,
}: {
  text: string;
  url: string;
  onCopied: () => void;
}) {
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
  const [videoBusy, setVideoBusy] = useState(false); // シェアシート表示中の二度押しよけ

  const ctlRef = useRef<AbortController | null>(null);
  const lastPetRef = useRef<Pet | null>(null);
  const lastQuoteRef = useRef(""); // 直前に出した名言のid（連続で同じものを出さない）
  const selRef = useRef<Selected | null>(null);
  const petRef = useRef<Pet | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /* シェア用動画：行アニメの裏で先に録っておく。null=作成中 / "error"=不可 */
  const videoFileRef = useRef<File | null | "error">(null);

  useEffect(() => () => ctlRef.current?.abort(), []);

  async function start() {
    if (!feel || !why) return;
    ctlRef.current?.abort();
    const ctl = new AbortController();
    ctlRef.current = ctl;
    const signal = ctl.signal;

    /* 犬は名言が決まってから（カードと同じ子にするため）。
       それまでは背景色に「・・・」だけ出して待つ */
    petRef.current = null;
    setScreen("result");
    setPet(null);
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
      /* サーバーに届かなかったら、この場でランダム選書（ストックは手元にもある）。
         直前と同じ犬が続かないよう、別の子の言葉を優先する */
      const all = kotobaFor(feel, lastQuoteRef.current);
      const other = all.filter((k) => dogFor(k.id).id !== lastPetRef.current?.id);
      const k: Kotoba = pick(other.length ? other : all);
      picked = { id: k.id, who: k.who, lines: k.lines, source: "local" };
    }
    lastQuoteRef.current = picked.id;
    selRef.current = picked;
    if (debug) setMsg(`でばっぐ：${picked.source}${picked.reason ? "/" + picked.reason : ""}`);

    const p = dogFor(picked.id);
    lastPetRef.current = p;
    petRef.current = p;
    setPet(p);
    setSel(picked);

    /* シェア用動画を裏で先に録りはじめる（ボタンを押したら即渡せるように）。
       <video> が生えるのを1フレーム待ってから */
    videoFileRef.current = null;
    await sleep(60, signal);
    if (signal.aborted) return;
    renderShareVideo(p, picked, signal).then((f) => {
      if (!signal.aborted) videoFileRef.current = f ?? "error";
    });

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

  /* ポスター（動画の1フレーム目＝正面カット）を背景に、名言を載せた画像を保存する */
  async function saveImage() {
    const p = petRef.current;
    const s = selRef.current;
    if (!p || !s) return;
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
    const img = new Image();
    await new Promise((res) => {
      img.onload = res;
      img.onerror = res;
      img.src = p.poster;
    });
    const vw = img.naturalWidth || 9;
    const vh = img.naturalHeight || 16;
    const scale = Math.max(W / vw, H / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
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

  /* 名言アニメーション付きの縦動画（9:16）を、画面の行アニメと並行して
     ブラウザ内で録画しておく（リアルタイム録画＝画面とほぼ同じ時間で完成）。
     Safariは mp4、Chrome系は WebM系 になる（MediaRecorderの仕様） */
  async function renderShareVideo(
    p: Pet,
    s: Selected,
    signal: AbortSignal,
  ): Promise<File | null> {
    const video = videoRef.current;
    if (!video || typeof MediaRecorder === "undefined") return null;
    const mime = [
      "video/mp4;codecs=avc1.42E01E",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ].find((c) => MediaRecorder.isTypeSupported(c));
    if (!mime) return null;
    try {
      await document.fonts.load("700 46px 'Zen Maru Gothic'");
    } catch {
      /* フォールバックフォントで描く */
    }
    video.play().catch(() => {});
    /* 最初のフレームが黒抜けしないよう、動画が読めるまで少しだけ待つ */
    const waitFrom = performance.now();
    while (video.readyState < 2 && performance.now() - waitFrom < 2000 && !signal.aborted) {
      await sleep(100, signal);
    }
    if (signal.aborted) return null;

    const W = 720;
    const H = 1280;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const g = cv.getContext("2d")!;

    /* 各行の表示スケジュール（画面のアニメーションと同じリズム） */
    const CHAR_FADE = 550;
    const lines = s.lines.map((line) => [...line]);
    let t0 = 0;
    const sched = lines.map((chars) => {
      const start = t0;
      const charsEnd = start + START_DELAY_MS + chars.length * CHAR_MS;
      const holdEnd = charsEnd + LINE_HOLD_MS;
      const fadeEnd = holdEnd + LINE_FADE_MS;
      t0 = fadeEnd;
      return { start, holdEnd, fadeEnd };
    });
    const TAIL = 1600; // 最後にクレジットを見せる時間
    const total = t0 + TAIL;

    const drawFrame = (t: number) => {
      /* 背景：動画（読めない環境ではそのまま何も出ないがポスター色で埋める） */
      g.fillStyle = "#F2ECFF";
      g.fillRect(0, 0, W, H);
      const vw = video.videoWidth || 0;
      const vh = video.videoHeight || 0;
      if (vw && vh) {
        const scale = Math.max(W / vw, H / vh);
        g.drawImage(video, (W - vw * scale) / 2, (H - vh * scale) / 2, vw * scale, vh * scale);
      }
      /* 下側スクリム */
      const grad = g.createLinearGradient(0, H * 0.6, 0, H);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.7, "rgba(255,255,255,0.55)");
      grad.addColorStop(1, "rgba(255,255,255,0.85)");
      g.fillStyle = grad;
      g.fillRect(0, H * 0.6, W, H * 0.4);
      /* いまの行を1文字ずつ */
      g.textAlign = "center";
      const li = sched.findIndex((sc) => t < sc.fadeEnd);
      if (li >= 0 && t >= sched[li].start) {
        const sc = sched[li];
        const chars = lines[li];
        const fontSize = 46;
        g.font = `700 ${fontSize}px 'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif`;
        const lineAlpha = t > sc.holdEnd ? Math.max(0, 1 - (t - sc.holdEnd) / LINE_FADE_MS) : 1;
        const lineRise = t > sc.holdEnd ? ((t - sc.holdEnd) / LINE_FADE_MS) * fontSize * 0.3 : 0;
        const widths = chars.map((ch) => g.measureText(ch === " " ? " " : ch).width);
        const totalW = widths.reduce((a, b) => a + b, 0);
        let x = (W - totalW) / 2;
        const y = H - 270 - lineRise;
        chars.forEach((ch, ci) => {
          const born = sc.start + START_DELAY_MS + ci * CHAR_MS;
          const a = Math.min(1, Math.max(0, (t - born) / CHAR_FADE));
          if (a > 0) {
            g.globalAlpha = a * lineAlpha;
            g.fillStyle = "#3B3350";
            g.fillText(ch === " " ? " " : ch, x + widths[ci] / 2, y + (1 - a) * fontSize * 0.35);
          }
          x += widths[ci];
        });
        g.globalAlpha = 1;
      }
      /* 最後：クレジット */
      if (t > t0) {
        const a = Math.min(1, (t - t0) / 500);
        g.globalAlpha = a;
        g.fillStyle = "#3B3350";
        g.font = "700 34px 'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif";
        g.fillText(creditFor(s.who), W / 2, H - 210);
        g.globalAlpha = 1;
      }
      /* 常時の小さなロゴ */
      g.globalAlpha = 0.85;
      g.fillStyle = "#6B6285";
      g.font = "500 24px 'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif";
      g.fillText("きょうの きみに", W / 2, H - 46);
      g.globalAlpha = 1;
    };

    const stream = cv.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const stopped = new Promise<void>((res) => {
      rec.onstop = () => res();
    });
    rec.start(500);
    const begin = performance.now();
    await new Promise<void>((res) => {
      const tick = () => {
        if (signal.aborted) return res();
        const t = performance.now() - begin;
        drawFrame(t);
        if (t >= total) return res();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    rec.stop();
    await stopped;
    if (signal.aborted) return null;

    const type = mime.startsWith("video/mp4") ? "video/mp4" : "video/webm";
    const ext = type === "video/mp4" ? "mp4" : "webm";
    const blob = new Blob(chunks, { type });
    return new File([blob], `kyou-no-kimini-${p.id}.${ext}`, { type });
  }

  /* シェアボタン：裏で録っておいた動画をその場でシェアシートに渡す */
  async function shareVideo() {
    const s = selRef.current;
    if (!s || videoBusy) return;
    const f = videoFileRef.current;
    if (f === null) {
      setMsg("どうがを じゅんびちゅう…… すこししたら もういちど おしてね");
      return;
    }
    if (f === "error") {
      setMsg("この ぶらうざでは どうがを つくれなかった");
      return;
    }
    setVideoBusy(true);
    const shareText = `${s.lines.join(" ")}（${creditFor(s.who)}）| きょうの きみに https://comixai.dev/cheer/k/${s.id}`;
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      try {
        await navigator.share({ files: [f], text: shareText });
        setMsg("");
      } catch {
        setMsg(""); /* シェアシートを閉じただけ */
      }
    } else {
      const url = URL.createObjectURL(f);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setMsg("どうがを ほぞんしたよ");
    }
    setVideoBusy(false);
  }

  return (
    <div className="cheer-root">
      {screen === "ask" && (
        <div className="ask">
          {/* 背景：白いポメラニアンのお手。文字が読めるよう上に白のベールを重ねる */}
          <div className="ask-bg" />
          <main className="cheer-main">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ask-logo" src="/cheer/logo.png" alt="いぬがたり — あなたの「想い」にこたえます" />
            <section>
              <p className="q">いまの気持ちは？</p>
              <Chips items={FEELS} value={feel} onPick={setFeel} />
              <p className="q">何があった？</p>
              <Chips items={WHYS} value={why} onPick={setWhy} />
              <input
                className="note"
                type="text"
                maxLength={60}
                placeholder="ひとことあれば（書かなくても大丈夫）"
                autoComplete="off"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="hint">書いたことは、この子だけが読みます</p>
              <button className="go" type="button" disabled={!(feel && why)} onClick={start}>
                聞いてもらう
              </button>
            </section>
          </main>
        </div>
      )}

      {screen === "result" && (
        <section className="film">
          {/* 動画の左右に余るところは、ぼかした風景で埋める */}
          <div className="film-bg" />
          <div className="film-stage">
          {pet && (
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
          )}
          <div className="film-scrim" />

          {/* 名言：顔より下に、いまの1行だけを1文字ずつ。前の行は消す */}
          {phase !== "after" && (
            <div className={`film-body${phase === "thinking" || !sel ? " waiting" : ""}`}>
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
                url={`https://comixai.dev/cheer/k/${sel.id}`}
                onCopied={() => setMsg("りんくを こぴーしたよ")}
              />
              <button
                type="button"
                className="video-share-btn"
                disabled={videoBusy}
                onClick={shareVideo}
                data-ga="share_click"
                data-ga-network="video"
                data-ga-path="/cheer"
              >
                <i className="ph-bold ph-film-strip" style={{ marginRight: 6 }} />
                どうがで シェア
              </button>
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
          </div>
        </section>
      )}
    </div>
  );
}
