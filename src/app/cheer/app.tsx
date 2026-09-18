"use client";

/* ============================================================
   きょうの きみに — 画面まるごとのクライアントコンポーネント。
   生成は /api/cheer（Claude Haiku）に投げ、使えないときは
   STOCK のストック台詞に降格する。ロジックはプロトタイプ
   （pet-cheer.html）をそのまま移植。
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { FEELS, WHYS, QUOTES, STOCK, REPEAT, type Choice } from "./data";
import { PETS, type Pet } from "./pets";

type Screen = "ask" | "result";

function pick<T>(arr: T[], avoid?: T | null): T {
  const pool = avoid ? arr.filter((x) => x !== avoid) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function petSvg(p: Pet): string {
  return `<svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" aria-label="${p.name}">${p.draw(p)}</svg>`;
}

/* /api/cheer に台詞をもらいに行く。降格すべきときは null、
   レート制限は {code:"rate_limited"} を投げる */
async function askServer(
  payload: { feel: string; why: string; pet: string; quote: number; note: string },
  signal: AbortSignal,
): Promise<string[] | null> {
  const res = await fetch("/api/cheer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (res.status === 429) throw { code: "rate_limited" };
  if (!res.ok) return null;
  const data = (await res.json()) as { lines?: unknown };
  if (
    Array.isArray(data.lines) &&
    data.lines.length > 0 &&
    data.lines.every((l) => typeof l === "string")
  ) {
    return data.lines as string[];
  }
  return null;
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
  const [busy, setBusy] = useState(false); // 再生中は「べつの こ」を無効に
  const [done, setDone] = useState(false); // 全行出たら保存ボタンを出す

  const ctlRef = useRef<AbortController | null>(null);
  const lastPetRef = useRef<Pet | null>(null);
  const lastKeyRef = useRef("");
  const linesRef = useRef<string[] | null>(null);
  const creditRef = useRef("");
  const petRef = useRef<Pet | null>(null);

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
    const quoteIndex = Math.floor(Math.random() * QUOTES[feel].length);
    const quote = QUOTES[feel][quoteIndex];

    setScreen("result");
    setPet(p);
    setThinking(true);
    setLines(null);
    setShown(0);
    setCredit("");
    setMsg("");
    setBusy(true);
    setDone(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    let result: string[] | null = null;
    let source: "ai" | "stock" = "ai";
    try {
      result = await askServer(
        { feel, why, pet: p.id, quote: quoteIndex, note: note.trim() },
        signal,
      );
    } catch (e) {
      if (signal.aborted) return;
      source = "stock";
      if (e && typeof e === "object" && (e as { code?: string }).code === "rate_limited") {
        setMsg("いっぱい はなしたから すこし やすませてね");
      }
    }
    if (signal.aborted) return;
    if (!result) {
      source = "stock";
      result = STOCK[feel][0];
    }
    const key = result.join("|");
    if (key === lastKeyRef.current) result = REPEAT;
    lastKeyRef.current = key;

    setThinking(false);
    setLines(result);
    linesRef.current = result;
    await playLines(result, signal);
    if (signal.aborted) return;
    const c = source === "ai" ? `${quote.who}（${p.ja}やく）` : `${p.ja}の ことば`;
    setCredit(c);
    creditRef.current = c;
    setBusy(false);
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
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* canvasに描いて <a download> で保存（プロトタイプの downloads 置き換え） */
  async function saveImage() {
    const p = petRef.current;
    const ls = linesRef.current;
    if (!p || !ls) return;
    const W = 1080;
    const H = 1350;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const g = cv.getContext("2d");
    if (!g) return;
    try {
      /* Webフォントが未ロードだと canvas がシステムフォントで描かれるので先に読む */
      await document.fonts.load("500 60px 'Zen Maru Gothic'");
    } catch {
      /* 読めなくてもフォールバックフォントで描く */
    }
    g.fillStyle = "#F2ECFF";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#FFFFFF";
    roundRect(g, 80, 120, W - 160, H - 240, 72);
    g.fill();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="420" height="420">${p.draw(p)}</svg>`;
    const img = new Image();
    await new Promise((res) => {
      img.onload = res;
      img.onerror = res;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
    g.drawImage(img, (W - 420) / 2, 170, 420, 420);
    g.fillStyle = "#3B3350";
    g.textAlign = "center";
    g.font = "500 60px 'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif";
    let y = 700;
    ls.forEach((l) => {
      g.fillText(l, W / 2, y);
      y += 92;
    });
    g.fillStyle = "#8A80A6";
    g.font = "500 34px 'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif";
    g.fillText(creditRef.current, W / 2, H - 190);
    g.fillText("きょうの きみに", W / 2, H - 70);
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
      <main className="cheer-main">
        <h1>きょうの きみに</h1>

        {screen === "ask" && (
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
        )}

        {screen === "result" && (
          <section>
            <div className={`stage${thinking ? " thinking" : ""}`}>
              {pet && (
                <div
                  className="pet"
                  /* SVGはペット定義ファイル（pets/）のマークアップ文字列をそのまま流す */
                  dangerouslySetInnerHTML={{ __html: petSvg(pet) }}
                />
              )}
              <p className="petname">{pet?.name}</p>
              <p className="lines">
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
              <p className={`credit${credit ? " in" : ""}`}>{credit}</p>
            </div>
            <div className="actions">
              <button className="sub-btn primary" type="button" disabled={busy} onClick={start}>
                べつの こにも きいてみる
              </button>
              {done && (
                <button className="sub-btn" type="button" onClick={saveImage}>
                  がぞうを ほぞん
                </button>
              )}
              <button className="sub-btn" type="button" onClick={restart}>
                はじめから
              </button>
            </div>
            <p className="msg">{msg}</p>
          </section>
        )}
      </main>
    </div>
  );
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
