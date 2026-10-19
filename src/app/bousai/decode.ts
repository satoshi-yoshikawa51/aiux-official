/* ============================================================
   見出しの「解読」モーション（/bousai の見出しと、トップのバナーで共用）。
   背景のコードの雨と同じ文字（カナ・英数・記号）が上から落ちてきて、
   その場でスクランブルしながら1文字ずつ本当の文字に確定していく。
   確定の瞬間だけ白く光る（.tk-ch.hit）。見た目は cyber.css の .tk-ch。

   使う側は <span class="tk-ch"> を1文字ずつ並べておき、その要素と
   タイミングを渡す。戻り値は中断用の関数。キッカー（> CYBER ATTACK …）を
   タイプ打ちで出すこともできる。
   ============================================================ */

export const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEFGHJKLMNPQRSTUVWXYZ<>=/:;+*#$%&";
const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/* タイミング（ミリ秒） */
export type DecodeTiming = {
  titleStart: number; /* 文字が落ち始めるまで */
  charStagger: number; /* 文字ごとの開始のずれ */
  fallMs: number; /* 落ちてくる時間 */
  scrambleMs: number; /* スクランブルしている時間 */
  flashMs: number; /* 確定時の光 */
};
/* 約1.1秒で全部そろう速さ（ページの見出しもバナーも同じ） */
export const DECODE_TIMING: DecodeTiming = { titleStart: 100, charStagger: 45, fallMs: 180, scrambleMs: 300, flashMs: 160 };

/* 全体の所要時間（最後の文字の光が消えるまで） */
export function decodeTotal(n: number, t: DecodeTiming) {
  return t.titleStart + (n - 1) * t.charStagger + t.fallMs + t.scrambleMs + t.flashMs;
}

export function startDecode(opts: {
  chars: string[];
  els: (HTMLElement | null)[];
  timing?: DecodeTiming;
  kicker?: { el: HTMLElement | null; text: string; start: number; speed: number };
  onDone?: () => void;
}): () => void {
  const { chars, els, kicker } = opts;
  const T = opts.timing ?? DECODE_TIMING;
  const total = decodeTotal(chars.length, T);
  let raf = 0;
  let lastScramble = 0;
  /* 演出の時計は「描けたフレーム」で進め、1フレームで進む量に上限を置く。
     経過時間だけで進めると、ページ読み込み直後の重い処理でフレームが飛んだ
     瞬間に一気に最後まで行ってしまい、演出が見えない（/bousai で起きていた）。
     上限は 60ms（約16fps相当）。それより遅い端末では演出がその分ゆっくりになる */
  let t = 0;
  let prev = -1;
  const MAX_STEP = 60;

  const frame = (now: number) => {
    if (prev >= 0) t += Math.min(now - prev, MAX_STEP);
    prev = now;

    /* キッカー: タイプ打ち */
    if (kicker?.el) {
      const n = Math.max(0, Math.min(kicker.text.length, Math.floor((t - kicker.start) / kicker.speed)));
      kicker.el.textContent = kicker.text.slice(0, n) + (n >= kicker.text.length ? "" : "▌");
    }

    /* タイトル: 文字ごとに 落下 → スクランブル → 確定 */
    const scrambleTick = now - lastScramble > 45;
    if (scrambleTick) lastScramble = now;
    chars.forEach((ch, i) => {
      const el = els[i];
      if (!el) return;
      const local = t - T.titleStart - i * T.charStagger;
      if (local < 0) {
        el.style.opacity = "0";
        el.style.transform = "translateY(-0.9em)";
        return;
      }
      if (local < T.fallMs) {
        /* 落ちてくる間も文字は入れ替わり続ける */
        const p = local / T.fallMs;
        const ease = 1 - Math.pow(1 - p, 3);
        el.style.opacity = String(0.35 + 0.65 * ease);
        el.style.transform = `translateY(${(-0.9 + 0.9 * ease).toFixed(3)}em)`;
        el.className = "tk-ch scr";
        if (scrambleTick || !el.textContent) el.textContent = ch === " " ? " " : rnd();
        return;
      }
      const s = local - T.fallMs;
      if (s < T.scrambleMs) {
        el.style.opacity = "1";
        el.style.transform = "none";
        el.className = "tk-ch scr";
        /* 終盤ほど本当の文字が混じる確率を上げる */
        if (scrambleTick) el.textContent = Math.random() < (s / T.scrambleMs) * 0.5 ? ch : rnd();
        return;
      }
      const f = s - T.scrambleMs;
      el.textContent = ch;
      el.style.opacity = "1";
      el.style.transform = "none";
      el.className = f < T.flashMs ? "tk-ch hit" : "tk-ch";
    });

    if (t < total) raf = requestAnimationFrame(frame);
    else opts.onDone?.();
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

/* 演出をやめて本当の文字をそのまま出す（中断時・画面外に出たときの後片付け） */
export function resetChars(chars: string[], els: (HTMLElement | null)[], hidden: boolean) {
  chars.forEach((ch, i) => {
    const el = els[i];
    if (!el) return;
    el.textContent = ch;
    el.className = "tk-ch";
    el.style.opacity = hidden ? "0" : "1";
    el.style.transform = hidden ? "translateY(-0.9em)" : "none";
  });
}
