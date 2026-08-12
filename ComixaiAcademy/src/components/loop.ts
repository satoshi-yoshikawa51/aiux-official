/* ============================================================
   0→1 を回し続ける値。飾りのアニメはここから取る。

   ▍Webは「時計から位相を出す」1本の rAF に集める

   Animated.timing は**前のフレームからの差分を積み上げて**進む。だから
   途中でフレームが1回も返ってこなくなると、そこで固まったまま戻らない。
   Webは useNativeDriver が効かず全部これなので、重い処理（3Dアバターの
   読み直しなど）や端末側の都合でフレームが落ちると、飾りだけが止まる。
   「先生を変えてホームに戻ると背景の飾りが消えた」はこの形。

   なので値は**時計から計算する**。位相 = 経過ミリ秒 ÷ 1周。
   フレームが飛んでも次のフレームで正しい位置に戻るので、**止まったままに
   ならない**。ずれも溜まらない。画面を行き来しても続きから見える
   （0に戻さないので、戻るたびに模様が作り直されることもない）。

   rAF は1本だけ。動かす値がいくつあっても、毎フレームの仕事は1回で済む。

   ▍rAFごと返ってこなくなったときの保険
   2秒ごとに「最後のフレームからどれだけ経ったか」だけ見て、間が空いて
   いたら鎖をつなぎ直す。**位相は時計から出しているので、つなぎ直しても
   絵は飛ばない**（前に入れた見張りは0へ戻していたので、そこが見えた）。

   ▍ネイティブは従来どおり
   useNativeDriver が効いてUIスレッドで回るので、JS側のフレーム落ちに
   巻き込まれない。rAFに載せ替えるとむしろ悪くなる。

   使うところ：舞台の飾り（components/stage-effect.tsx）、
   ミニゲームのタイトル（components/mini-game.tsx）。
   ============================================================ */
import React from 'react';
import { Animated, AppState, Easing, Platform } from 'react-native';

const WEB = Platform.OS === 'web';

type Ticker = { v: Animated.Value; ms: number; delay: number };
const tickers = new Set<Ticker>();
let rafId: number | null = null;
let lastFrame = 0;
let watchdog: ReturnType<typeof setInterval> | null = null;

function frame() {
  const now = Date.now();
  lastFrame = now;
  tickers.forEach((k) => {
    const p = (((now - k.delay) % k.ms) + k.ms) % k.ms;
    k.v.setValue(p / k.ms);
  });
  rafId = requestAnimationFrame(frame);
}

function startClock() {
  if (rafId === null) {
    lastFrame = Date.now();
    rafId = requestAnimationFrame(frame);
  }
  if (watchdog === null) {
    watchdog = setInterval(() => {
      if (tickers.size === 0 || Date.now() - lastFrame < 1200) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      startClock();
    }, 2000);
  }
}

function stopClock() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  if (watchdog !== null) clearInterval(watchdog);
  watchdog = null;
}

/** sec秒で 0→1 を回し続ける値。delayMs は出だしをずらすため */
export function useLoop(sec: number, delayMs = 0) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (WEB) {
      const k: Ticker = { v: t, ms: sec * 1000, delay: delayMs };
      tickers.add(k);
      startClock();
      return () => {
        tickers.delete(k);
        if (tickers.size === 0) stopClock();
      };
    }
    return nativeLoop(t, sec, delayMs);
  }, [t, sec, delayMs]);
  return t;
}

function nativeLoop(t: Animated.Value, sec: number, delayMs: number) {
  let anim: Animated.CompositeAnimation | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const run = () => {
    anim?.stop();
    /* 止めた位置から再開しない。Animated.loop は各周でこの値まで戻すので、
       終端で止まっていると 1→1 のアニメになり、以降ずっと動かない */
    t.setValue(0);
    anim = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: sec * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
  };
  const restart = () => {
    if (timer) clearTimeout(timer);
    anim?.stop();
    t.setValue(0);
    timer = setTimeout(run, delayMs);
  };
  restart();

  const sub = AppState.addEventListener('change', (st) => {
    if (st === 'active') restart();
  });

  return () => {
    if (timer) clearTimeout(timer);
    anim?.stop();
    sub.remove();
  };
}

/* ▍1周のあいだに cycles 回くり返す表を作る

   P は1回ぶんの区切り（0〜1、増加、先頭0・末尾1）、V はそこでの値。
   末尾はごくわずか手前に置いて、次の回の先頭と重ならないようにする
   （interpolate は入力が増加していないと受け付けない）。 */
export function periodic(
  t: Animated.Value,
  cycles: number,
  P: number[],
  V: number[],
): Animated.AnimatedInterpolation<number> {
  const input: number[] = [];
  const output: number[] = [];
  const e = 1e-5;
  for (let k = 0; k < cycles; k++) {
    for (let j = 0; j < P.length; j++) {
      const last = j === P.length - 1;
      input.push((k + P[j]) / cycles - (last ? e : 0));
      output.push(V[j]);
    }
  }
  input.push(1);
  output.push(V[0]);
  return t.interpolate({ inputRange: input, outputRange: output });
}
