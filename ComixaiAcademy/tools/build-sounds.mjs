/* ============================================================
   効果音を作る。**素材を拾ってこない。ここで合成する。**

   拾ってくると、出どころと商用利用の確認がついて回るうえ、
   トーンがばらばらになる。ぜんぶ同じ音源から作れば、
   アイコンや書体と同じで「同じ手で描いたもの」に揃う。

   使い方:
     node tools/build-sounds.mjs
       -> assets/sounds/*.wav

   ▍鳴らす側の作法は src/lib/sound.ts
   ▍音の設計
   ・**短い。** いちばん長い rankup で1.1秒。UIの音は、鳴り終わる前に
     次の操作が来ると濁る
   ・**うるさくしない。** ピーク -12dB くらい。学習アプリなので、
     電車で音を出したまま開いても事故にならない音量にする
   ・**ドレミで揃える。** 正解・クリア・昇格は同じ音階（Cメジャー）の
     上行、外したときだけ下行にする。音楽的な統一が「同じアプリの音」を作る
   ・矩形波にわずかなノイズを混ぜて、マンガっぽい「ポン」にする。
     きれいなサイン波だと上品すぎて、この絵に合わない
   ============================================================ */
import fs from 'node:fs';

const RATE = 22050;
const OUT = new URL('../assets/sounds/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

/** 音名 → 周波数（A4=440） */
const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5,
  G3: 196.0, A3: 220.0, E3: 164.81, C3: 130.81,
};

/* ———————————————— 波形 ———————————————— */

/** 矩形波。倍音が多いぶん、小さい音でも埋もれない */
const square = (t, f) => (Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1);
/** 三角波。矩形よりやわらかい。押した音に使う */
const tri = (t, f) => {
  const p = (t * f) % 1;
  return 4 * Math.abs(p - 0.5) - 1;
};

/** 立ち上がり・減衰。**アタックを0にすると「プチッ」と鳴る**ので必ず付ける */
function env(t, dur, attack = 0.006, release = 0.5) {
  if (t < attack) return t / attack;
  const rel = dur * release;
  const from = dur - rel;
  if (t > from) return Math.max(0, 1 - (t - from) / rel);
  return 1;
}

/**
 * 音のかたまりを1本に混ぜる。
 * notes: [{ at, dur, freq, gain, wave }]
 */
function render(notes, total) {
  const n = Math.ceil(total * RATE);
  const buf = new Float32Array(n);
  for (const note of notes) {
    const start = Math.floor(note.at * RATE);
    const len = Math.ceil(note.dur * RATE);
    const wave = note.wave === 'tri' ? tri : square;
    for (let i = 0; i < len; i++) {
      const j = start + i;
      if (j >= n) break;
      const t = i / RATE;
      const e = env(t, note.dur, note.attack ?? 0.006, note.release ?? 0.6);
      buf[j] += wave(t, note.freq) * e * (note.gain ?? 0.25);
    }
  }
  return buf;
}

/** 16bit PCM の WAV に書き出す */
function writeWav(name, samples, peakTarget = 0.25) {
  /* ピークは基本 -12dB（0.25）に揃える。音ごとに音量がばらつくと、
     どれかだけ大きくて驚く。
     ▍例外は PEAKS に書く。正解音（right）は高音の短いアルペジオで、
     BGMや環境音にいちばん埋もれやすい——実機で「正解しても鳴らない」に
     聞こえていたので、これだけ一段（約+3dB）持ち上げる */
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0 ? peakTarget / peak : 1;

  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i] * gain));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  const path = new URL(`${name}.wav`, OUT).pathname;
  fs.writeFileSync(path, Buffer.concat([header, data]));
  return { name, bytes: header.length + data.length, sec: samples.length / RATE };
}

/* ———————————————— 音の台帳 ———————————————— */

const SOUNDS = {
  /** ボタンを押した。**いちばん多く鳴るので、いちばん軽く短く** */
  tap: () => render([{ at: 0, dur: 0.05, freq: NOTE.C5, gain: 0.22, wave: 'tri', release: 0.8 }], 0.06),

  /** 選択肢を選んだ・札を置いた。tapより少し高い */
  pick: () => render([{ at: 0, dur: 0.06, freq: NOTE.E5, gain: 0.22, wave: 'tri', release: 0.8 }], 0.07),

  /** クイズの残り時間わずか。1秒ごとに鳴る小さな針の音（チッ）。
      連打で鳴るので、いちばん短く・いちばん小さく */
  tick: () => render([{ at: 0, dur: 0.03, freq: NOTE.C6, gain: 0.14, wave: 'tri', release: 0.9 }], 0.04),

  /** 正解。ドミソの上行 */
  right: () =>
    render(
      [
        { at: 0, dur: 0.09, freq: NOTE.C5, gain: 0.22 },
        { at: 0.07, dur: 0.09, freq: NOTE.E5, gain: 0.22 },
        { at: 0.14, dur: 0.16, freq: NOTE.G5, gain: 0.24 },
      ],
      0.32,
    ),

  /** 外した。下行させる。**汚い音にしない**——学習で外すのは悪いことではない */
  wrong: () =>
    render(
      [
        { at: 0, dur: 0.11, freq: NOTE.A3, gain: 0.24, wave: 'tri' },
        { at: 0.09, dur: 0.2, freq: NOTE.E3, gain: 0.24, wave: 'tri' },
      ],
      0.3,
    ),

  /** ゲームに入る（タイルが覆う）。低いところから駆け上がる */
  start: () =>
    render(
      [
        { at: 0, dur: 0.06, freq: NOTE.C4, gain: 0.2 },
        { at: 0.05, dur: 0.06, freq: NOTE.G4, gain: 0.2 },
        { at: 0.1, dur: 0.06, freq: NOTE.C5, gain: 0.2 },
        { at: 0.15, dur: 0.14, freq: NOTE.E5, gain: 0.22 },
      ],
      0.32,
    ),

  /** ゲームを通した。ドミソド */
  clear: () =>
    render(
      [
        { at: 0, dur: 0.1, freq: NOTE.C5, gain: 0.22 },
        { at: 0.08, dur: 0.1, freq: NOTE.E5, gain: 0.22 },
        { at: 0.16, dur: 0.1, freq: NOTE.G5, gain: 0.22 },
        { at: 0.24, dur: 0.3, freq: NOTE.C6, gain: 0.26 },
      ],
      0.58,
    ),

  /** ★3。clear のあとに重ねる、きらっとした上の音 */
  star: () =>
    render(
      [
        { at: 0, dur: 0.07, freq: NOTE.G5, gain: 0.18, wave: 'tri' },
        { at: 0.06, dur: 0.07, freq: NOTE.C6, gain: 0.18, wave: 'tri' },
        { at: 0.12, dur: 0.18, freq: NOTE.E6, gain: 0.2, wave: 'tri' },
      ],
      0.32,
    ),

  /** バッジを取った。短いファンファーレ */
  badge: () =>
    render(
      [
        { at: 0, dur: 0.12, freq: NOTE.G4, gain: 0.22 },
        { at: 0.1, dur: 0.12, freq: NOTE.C5, gain: 0.22 },
        { at: 0.2, dur: 0.26, freq: NOTE.E5, gain: 0.24 },
      ],
      0.5,
    ),

  /** 称号が上がった。**アプリでいちばん長い音**。それでも1.1秒 */
  rankup: () =>
    render(
      [
        { at: 0, dur: 0.13, freq: NOTE.C4, gain: 0.2 },
        { at: 0.11, dur: 0.13, freq: NOTE.E4, gain: 0.2 },
        { at: 0.22, dur: 0.13, freq: NOTE.G4, gain: 0.2 },
        { at: 0.33, dur: 0.16, freq: NOTE.C5, gain: 0.24 },
        /* 着地。3和音を重ねて厚くする */
        { at: 0.5, dur: 0.6, freq: NOTE.C5, gain: 0.2 },
        { at: 0.5, dur: 0.6, freq: NOTE.E5, gain: 0.16 },
        { at: 0.5, dur: 0.6, freq: NOTE.G5, gain: 0.14 },
      ],
      1.15,
    ),

  /** レッスンを修了した。落ち着いた締め */
  finish: () =>
    render(
      [
        { at: 0, dur: 0.14, freq: NOTE.E5, gain: 0.2 },
        { at: 0.12, dur: 0.14, freq: NOTE.C5, gain: 0.2 },
        { at: 0.24, dur: 0.34, freq: NOTE.G4, gain: 0.22 },
        { at: 0.24, dur: 0.34, freq: NOTE.C5, gain: 0.16 },
      ],
      0.62,
    ),
};

/** 基準（0.25）から外す音だけ書く */
const PEAKS = { right: 0.36, tick: 0.14 };

const made = Object.entries(SOUNDS).map(([name, fn]) => writeWav(name, fn(), PEAKS[name]));
const total = made.reduce((a, m) => a + m.bytes, 0);
for (const m of made) {
  console.log(`  ${m.name.padEnd(8)} ${m.sec.toFixed(2)}秒  ${(m.bytes / 1024).toFixed(1)}KB`);
}
console.log(`\n-> assets/sounds/（${made.length}個・合計 ${(total / 1024).toFixed(0)}KB）`);
