/* ============================================================
   BGM。効果音（sound.ts）の隣に置くが、性格がぜんぶ逆なので別ファイル。

   ▍効果音との違い
   ・効果音は「一発」、BGMは「ループ」
   ・効果音は同時に何個も鳴るが、BGMは**常に1曲だけ**
   ・効果音は押した瞬間、BGMは**場面**に付く（画面が変わったら曲が変わる）

   ▍曲は3枠だけ
   opening（絵巻）／home（ホーム・レッスン、いちばん長く聴く）／
   game（ミニゲーム中）。細かく分けるほど切り替わりが増えて、
   曲の切れ目のほうがうるさくなる。迷ったら home に寄せる。

   ▍音源はユーザー提供（assets/music/）
   効果音と違って合成ではない。差し替えはファイルを置き換えるだけ。

   ▍切り替えはフェードで
   ぶつ切りで替えると、場面転換のたびに耳が引っかかる。
   0.4秒で下げて、替えて、0.4秒で上げる。

   ▍鳴らないことを異常にしない（sound.ts と同じ作法）
   Webは最初のタップまで自動再生できない。失敗したら覚えておいて、
   **次にどこかを触った瞬間に**そっと再開する。エラーは全部呑む。
   ============================================================ */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

export type MusicTrack = 'opening' | 'home' | 'game';

const FILES: Record<MusicTrack, number> = {
  opening: require('@/assets/music/opening.mp3'),
  home: require('@/assets/music/home.mp3'),
  game: require('@/assets/music/game.mp3'),
};

/* BGMは効果音より一段下げて敷く。主役はセリフと効果音 */
const VOLUME = 0.35;
const FADE_MS = 400;
const FADE_STEP = 40;

const players = new Map<MusicTrack, AudioPlayer>();
let current: MusicTrack | null = null;
let enabled = true;
/* Webの自動再生規制で始められなかった曲。次のタップで再開する */
let pending: MusicTrack | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;

function playerOf(track: MusicTrack): AudioPlayer {
  let p = players.get(track);
  if (!p) {
    p = createAudioPlayer(FILES[track]);
    p.loop = true;
    p.volume = VOLUME;
    players.set(track, p);
  }
  return p;
}

/* ▍Webの自動再生規制
   ページを開いた直後は play() が拒否される。ユーザーが1回でも触れば
   解禁されるので、**最初のタップで再挑戦する**係をここで仕込む。
   capture で拾うのは、アプリ側が stopPropagation しても届くように */
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const retry = () => {
    if (pending && enabled) {
      const t = pending;
      pending = null;
      playMusic(t);
    }
  };
  document.addEventListener('pointerdown', retry, { capture: true });
}

function fadeTo(p: AudioPlayer, to: number, then?: () => void) {
  if (fadeTimer) clearInterval(fadeTimer);
  const from = p.volume;
  const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP));
  let i = 0;
  fadeTimer = setInterval(() => {
    i += 1;
    try {
      p.volume = from + ((to - from) * i) / steps;
    } catch {
      /* 破棄済みなら止めるだけ */
    }
    if (i >= steps) {
      if (fadeTimer) clearInterval(fadeTimer);
      fadeTimer = null;
      then?.();
    }
  }, FADE_STEP);
}

/**
 * その場面の曲に切り替える。同じ曲なら何もしない。
 * **待たない・失敗を投げない**（sound.ts と同じ扱い）。
 */
export function playMusic(track: MusicTrack) {
  if (!enabled) {
    /* オフのあいだも「いまの場面」は覚えておく。オンに戻した瞬間、
       その場面の曲から始められる */
    current = track;
    return;
  }
  if (current === track && players.get(track)?.playing) return;
  try {
    const prev = current ? players.get(current) : null;
    current = track;
    const next = playerOf(track);
    const start = () => {
      try {
        next.seekTo(0).catch(() => {});
        next.volume = 0;
        next.play();
        /* play() の拒否は同期では分からないことがある。少し待って
           進んでいなければ、次のタップに回す */
        fadeTo(next, VOLUME);
        setTimeout(() => {
          if (current === track && !next.playing) pending = track;
        }, 300);
      } catch {
        pending = track;
      }
    };
    if (prev && prev !== next && prev.playing) {
      fadeTo(prev, 0, () => {
        try {
          prev.pause();
        } catch {}
        start();
      });
    } else {
      start();
    }
  } catch {
    /* 鳴らなくても学習は進む */
  }
}

/** いまの場面の曲を頭からではなく「続きから」戻す（復帰時用） */
export function resumeMusic() {
  if (!enabled || !current) return;
  try {
    const p = playerOf(current);
    if (!p.playing) {
      p.volume = 0;
      p.play();
      fadeTo(p, VOLUME);
    }
  } catch {
    /* 鳴らなくても学習は進む */
  }
}

/** 全部止める（アプリがバックグラウンドへ行くときなど） */
export function stopMusic() {
  pending = null;
  for (const p of players.values()) {
    try {
      p.pause();
    } catch {}
  }
}

/** せっていの「BGM」。進捗ストアが起動時と切り替え時に流し込む */
export function setMusicEnabled(on: boolean) {
  enabled = on;
  if (!on) {
    stopMusic();
  } else if (current) {
    /* いまの場面の曲から静かに戻る */
    const t = current;
    current = null;
    playMusic(t);
  }
}
