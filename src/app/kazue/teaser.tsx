"use client";
/* ============================================================
   「号外!! 新選組カズエ RE:BOOT」ティザーの本体。
   見た目と動きの定義は kazue.css、ここは「いつ動かすか」だけを持つ。

   ・data-kz-scrub を付けたブロックに、スクロール量を --p（0→1）で渡す
   ・.kz-io は視界に入った瞬間に .is-in を付ける（1回きり）
   ・マウス位置を --mx / --my（-1〜1）で渡し、層ごとの視差に使う
   ・ヒーローに灰（紙吹雪）を canvas で降らせる

   原稿のセリフはマンガ本編からの引用。ここで新しく話を作らない。
   ============================================================ */
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

const X_URL = "https://x.com/yoshikawa5116";
const NOTE_URL = "https://note.com/aiux_unite";

/* 1字ずつ <span> に割る。読み上げには元の文をそのまま渡す */
function Chars({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="kz-ch" aria-hidden="true" style={{ "--i": from + i } as CSSProperties}>
          {ch}
        </span>
      ))}
    </>
  );
}

/* 文節ごとに折り返す大見出し。parts の区切りでだけ改行される */
function Big({ parts, className = "" }: { parts: string[]; className?: string }) {
  let n = 0;
  return (
    <p className={`kz-big kz-io ${className}`} aria-label={parts.join("")}>
      {parts.map((part, i) => {
        const from = n;
        n += part.length;
        return (
          <span key={i} className="kz-nowrap" aria-hidden="true">
            <Chars text={part} from={from} />
          </span>
        );
      })}
    </p>
  );
}

function Panel({ src, alt, w, h, className = "" }: { src: string; alt: string; w: number; h: number; className?: string }) {
  return (
    <figure className={`kz-panel kz-io ${className}`}>
      <img src={`/kazue/${src}.webp`} alt={alt} width={w} height={h} loading="lazy" decoding="async" />
    </figure>
  );
}

function BandRow({ children }: { children: ReactNode }) {
  /* 同じ中身を2つ並べ、1つぶん流れたら頭に戻す（切れ目のない帯） */
  return (
    <div className="kz-band-row" aria-hidden="true">
      <span>{children}</span>
      <span>{children}</span>
    </div>
  );
}

const BAND = Array.from({ length: 4 }, (_, i) => (
  <span key={i} style={{ display: "contents" }}>
    <span>号外!!</span>
    <span>新選組カズエ</span>
    <span>RE:BOOT</span>
    <em>COMING SOON</em>
  </span>
));

export function KazueTeaser() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.classList.add("kz-js");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));

    /* —— スクロール連動 —— */
    const scrubs = Array.from(el.querySelectorAll<HTMLElement>("[data-kz-scrub]"));
    let ticking = false;
    const measure = () => {
      ticking = false;
      const vh = window.innerHeight;
      for (const s of scrubs) {
        const r = s.getBoundingClientRect();
        const span = r.height - vh;
        s.style.setProperty("--p", (span > 0 ? clamp(-r.top / span) : 0).toFixed(4));
      }
      const doc = document.documentElement;
      el.style.setProperty("--kz-total", clamp(window.scrollY / Math.max(1, doc.scrollHeight - vh)).toFixed(4));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    /* —— 視界に入ったら —— */
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
    el.querySelectorAll(".kz-io").forEach((t) => io.observe(t));

    /* —— マウスの視差（なめらかに追従）と灰 —— */
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const cv = canvas.current;
    const ctx = cv?.getContext("2d") ?? null;
    const css = getComputedStyle(el);
    const ink = css.getPropertyValue("--k").trim();
    const paper = css.getPropertyValue("--w").trim();
    type Ash = { x: number; y: number; s: number; vx: number; vy: number; rot: number; vr: number; a: number; dark: boolean };
    let ashes: Ash[] = [];
    let cw = 0;
    let chh = 0;
    const spawn = (anywhere: boolean): Ash => ({
      x: Math.random() * cw * 1.2,
      y: anywhere ? Math.random() * chh : chh + 20,
      s: 1.5 + Math.random() * 5,
      vx: -0.25 - Math.random() * 0.9,
      vy: -0.3 - Math.random() * 1.1,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.06,
      a: 0.25 + Math.random() * 0.6,
      dark: Math.random() < 0.35,
    });
    const resize = () => {
      if (!cv) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cw = cv.clientWidth;
      chh = cv.clientHeight;
      cv.width = cw * dpr;
      cv.height = chh * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      ashes = Array.from({ length: Math.round(Math.min(90, cw / 14)) }, () => spawn(true));
    };
    let heroVisible = true;
    const heroIo = new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting));
    if (cv) heroIo.observe(cv);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      el.style.setProperty("--mx", mx.toFixed(4));
      el.style.setProperty("--my", my.toFixed(4));
      if (!ctx || !heroVisible) return;
      ctx.clearRect(0, 0, cw, chh);
      for (let i = 0; i < ashes.length; i++) {
        const p = ashes[i];
        p.x += p.vx + mx * 0.4;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < -20 || p.x < -20) ashes[i] = spawn(false);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.dark ? ink : paper;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
    };
    if (!reduce) {
      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      io.disconnect();
      heroIo.disconnect();
    };
  }, []);

  return (
    <div className="kz-root" ref={root}>
      <div className="kz-progress" aria-hidden="true" />
      <a className="kz-home" href="/" aria-label="COMIXAI トップへ戻る">
        COMIXAI
      </a>
      <div className="kz-curtain" aria-hidden="true">
        <span>号外!!</span>
      </div>

      {/* ═══ ヒーロー：黒い太陽の下、五人が歩いてくる ═══ */}
      <header className="kz-hero" data-kz-scrub>
        <div className="kz-hero-pin">
          <div className="kz-bg-wrap">
            <img className="kz-bg" src="/kazue/bg.webp" alt="" width={1219} height={1744} fetchPriority="high" />
          </div>
          <div className="kz-cast-wrap">
            <img
              className="kz-cast"
              src="/kazue/cast.webp"
              alt="黒い太陽の下、宿場町を歩いてくる女剣士カズエと四人の侍"
              width={1219}
              height={1744}
              fetchPriority="high"
            />
          </div>
          <canvas className="kz-ash" ref={canvas} aria-hidden="true" />
          <div className="kz-vignette" aria-hidden="true" />
          <p className="kz-side kz-side-r" aria-hidden="true">
            貴様、それでも男か。
          </p>
          <p className="kz-side kz-side-l" aria-hidden="true">
            SHINSENGUMI KAZUE — RE:BOOT
          </p>
          <div className="kz-hero-copy">
            <p className="kz-kicker">新連載</p>
            <h1>
              <img className="kz-logo" src="/kazue/logo.webp" alt="号外!! 新選組カズエ RE:BOOT" width={1336} height={856} />
            </h1>
            <p className="kz-soon">
              COMING SOON
              <b>近日連載開始</b>
            </p>
          </div>
          <div className="kz-cue" aria-hidden="true">
            SCROLL
          </div>
          <div className="kz-flash" aria-hidden="true" />
          <div className="kz-hero-black" aria-hidden="true" />
        </div>
      </header>

      {/* ═══ 号外の帯 ═══ */}
      <div className="kz-band">
        <BandRow>{BAND}</BandRow>
        <BandRow>{BAND}</BandRow>
      </div>

      {/* ═══ プロローグ：つまらん ═══ */}
      <div className="kz-sec kz-prologue">
        <div className="kz-inner">
          <p className="kz-label">PROLOGUE</p>
          <div className="kz-pro-grid">
            <Panel src="p2-desk" alt="デスクでポメラニアンを抱いて画面に向かう主人公" w={1186} h={548} className="kz-from-l" />
            <Panel src="p2-tsumaran" alt="「つまらん!!!」と椅子の上でのけぞる主人公" w={1186} h={584} className="kz-from-r" />
            <Big parts={["誰でも", "何でも", "すぐ作れる", "時代が", "来た。"]} className="kz-span" />
            <Panel src="p3-talk" alt="「生成AIが進化しすぎて、誰でも何でもすぐ作れる時代が来た」と語る主人公" w={1186} h={993} className="kz-from-b" />
            <div>
              <Panel src="p3-same" alt="「さすがに冷めません…？」" w={1186} h={752} className="kz-from-r" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ゾクッ：背後に立つ影 ═══ */}
      <div className="kz-sec kz-zoku">
        <div className="kz-inner">
          <div className="kz-zoku-grid">
            <div>
              <p className="kz-sfx kz-io" aria-label="ゾクッ">
                ゾクッ
              </p>
              <p className="kz-zoku-note kz-io kz-rise">そのとき、背後に。</p>
            </div>
            <Panel src="p4-shadow" alt="主人公の背後に、刀を持った長い髪の影が立つ" w={1186} h={1096} className="kz-zoku-shadow" />
          </div>
        </div>
      </div>

      {/* ═══ カズエ登場：一太刀で黒幕が割れる ═══ */}
      <div className="kz-kazue" data-kz-scrub>
        <div className="kz-kazue-pin">
          <div className="kz-lines" aria-hidden="true" />
          <figure className="kz-kazue-fig">
            <img
              src="/kazue/p5-kazue.webp"
              alt="刀を抜きながら「貴様 それでも男か」「甘ったれたこと言ってると斬るぞ」と言い放つ女剣士カズエ"
              width={1186}
              height={1258}
              loading="lazy"
              decoding="async"
            />
          </figure>
          <p className="kz-name">
            カズエ
            <small>KAZUE</small>
          </p>
          <div className="kz-cover kz-cover-a" aria-hidden="true" />
          <div className="kz-cover kz-cover-b" aria-hidden="true" />
          <div className="kz-pre" aria-hidden="true">
            斬るぞ
          </div>
          <div className="kz-slash" aria-hidden="true" />
        </div>
      </div>

      {/* ═══ 約20年前：右から左へ、原稿をめくる ═══ */}
      <div className="kz-past" data-kz-scrub>
        <div className="kz-past-pin">
          <div className="kz-track">
            <p className="kz-card kz-card-year">
              約20年前
              <small>ABOUT 20 YEARS AGO</small>
            </p>
            <figure className="kz-page">
              <img src="/kazue/p8-past.webp" alt="約20年前。新人賞の発表日に、店で雑誌を手に取る若き日の主人公" width={1186} height={1761} loading="lazy" decoding="async" />
            </figure>
            <figure className="kz-page">
              <img src="/kazue/p9-doki.webp" alt="雑誌を開いたまま、震えが止まらない主人公" width={1186} height={1761} loading="lazy" decoding="async" />
            </figure>
            <figure className="kz-page">
              <img src="/kazue/p10-batan.webp" alt="雑誌を閉じ「いや…でも載ってたよな…落ち着いてもう一回確認しよう…」とつぶやく主人公" width={1186} height={1761} loading="lazy" decoding="async" />
            </figure>
            <p className="kz-card kz-card-quote">
              「いや…でも
              <br />
              <b>載ってたよな…</b>」
            </p>
          </div>
          <div className="kz-past-bar" aria-hidden="true">
            <i />
          </div>
        </div>
      </div>

      {/* ═══ AIマンガ研究所：作り方ごと公開する ═══ */}
      <div className="kz-sec kz-lab">
        <div className="kz-inner">
          <div className="kz-lab-grid">
            <figure className="kz-lab-fig kz-io">
              <img
                src="/kazue/p6-lab.webp"
                alt="AIマンガ研究所。カズエの3Dモデルが映る作業机と「AIと一緒に漫画を描きながらそのノウハウを惜しみなく公開！乞うご期待！」と語る主人公"
                width={1186}
                height={1851}
                loading="lazy"
                decoding="async"
              />
            </figure>
            <div className="kz-lab-copy">
              <p className="kz-label">AI MANGA LAB</p>
              <Big parts={["AIと一緒に、", "漫画を描く。", "そのノウハウを、", "惜しみなく公開。"]} />
              <p className="kz-lab-text kz-io kz-rise">
                描きながら、作り方ごと見せていく。
                <br />
                制作の裏側は「AIマンガ研究所」で。乞うご期待！
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 予告 ═══ */}
      <div className="kz-sec kz-cta">
        <div className="kz-inner">
          <img className="kz-cta-logo kz-io" src="/kazue/logo.webp" alt="号外!! 新選組カズエ RE:BOOT" width={1336} height={856} loading="lazy" decoding="async" />
          <p className="kz-cta-soon kz-io kz-rise">
            <small>COMING SOON</small>
            近日連載開始
          </p>
          <p className="kz-cta-lead kz-io kz-rise">連載開始のお知らせは、Xとnoteでいちばん早くお届けします。</p>
          <div className="kz-btns kz-io kz-rise">
            <a className="kz-btn" href={X_URL} target="_blank" rel="noopener noreferrer" data-ga="kazue_follow_x">
              <i className="ph-bold ph-x-logo" aria-hidden="true" />
              Xをフォローして待つ
            </a>
            <a className="kz-btn kz-btn-ghost" href={NOTE_URL} target="_blank" rel="noopener noreferrer" data-ga="kazue_follow_note">
              <i className="ph-bold ph-book-open-text" aria-hidden="true" />
              noteをフォローする
            </a>
          </div>
        </div>
        <div className="kz-author kz-io">
          <img src="/kazue/author-frame.webp" alt="ペンを構える作者" width={1196} height={680} loading="lazy" decoding="async" />
          <p aria-hidden="true">
            乞う
            <br />
            ご期待！
          </p>
        </div>
      </div>
    </div>
  );
}
