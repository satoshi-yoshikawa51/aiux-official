/* ============================================================
   BGM。効果音（sound.ts）の隣に置くが、性格がぜんぶ逆なので別ファイル。

   ▍効果音との違い
   ・効果音は「一発」、BGMは「ループ」
   ・効果音は同時に何個も鳴るが、BGMは**常に1曲だけ**
   ・効果音は押した瞬間、BGMは**場面**に付く（画面が変わったら曲が変わる）

   ▍曲は3枠だけ
   home（ホーム・タブまわり）／lesson（レッスン・復習）／
   game（ミニゲーム中）。割り当ては曲を用意した人の指定どおり：
   ホーム＝午後のカフェ、レッスン＝アフタヌーンティー、
   ゲーム＝light_song。オープニングや持ち帰りなど、どれでもない
   場面は home に寄せる（細かく分けるほど切れ目がうるさくなる）。

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

export type MusicTrack = 'home' | 'lesson' | 'game';

const FILES: Record<MusicTrack, number> = {
  home: require('@/assets/music/home.mp3'),
  lesson: require('@/assets/music/lesson.mp3'),
  game: require('@/assets/music/game.mp3'),
};

/* BGMは効果音より一段下げて敷く。主役はセリフと効果音 */
const VOLUME = 0.35;
const FADE_MS = 400;
const FADE_STEP = 40;

const players = new Map<MusicTrack, AudioPlayer>();
let current: MusicTrack | null = null;
let enabled = true;

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
   ページを開いた直後の play() は拒否される。しかも**拒否は
   expo-audio の中で握り潰されて、外から成否が見えない**
   （.playing での判定は当てにならず、実機で「タップしても無音」に
   なった）。なので判定はあきらめて、**タップのたびに play() を
   呼び直す**。再生中のプレイヤーへの play() は無害な空振りなので、
   これがいちばん壊れにくい */
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    () => {
      if (!enabled || !current) return;
      try {
        const p = playerOf(current);
        p.play();
        if (p.volume < VOLUME - 0.001) fadeTo(p, VOLUME);
      } catch {
        /* 鳴らなくても学習は進む */
      }
    },
    /* capture＝アプリ側が stopPropagation しても届くように */
    { capture: true },
  );
}

/* ▍ネイティブの「黙って止まる」を自分で直す
   iOSでは、通知音・Siri・電話などの割り込みや、曲の切り替えの綾で、
   プレイヤーが**エラーも出さずに止まったまま**になることがある
   （TestFlightで「この画面で無音になった」の報告）。Webは上の
   「タップのたびに鳴らし直す」係がいるが、ネイティブにはタップの
   横取り口が無い。なので数秒おきに見回って、鳴っているはずなのに
   止まっていたら、そっと戻す。裏に居るあいだ（halted）は見回らない
   ——裏で鳴らし直すと、ポケットの中で鳴る事故に戻ってしまう */
let halted = false;
if (Platform.OS !== 'web') {
  setInterval(() => {
    if (!enabled || halted || !current) return;
    try {
      const p = players.get(current);
      if (p && !p.playing) {
        p.play();
        if (p.volume < VOLUME - 0.001) fadeTo(p, VOLUME);
      }
    } catch {
      /* 鳴らなくても学習は進む */
    }
  }, 3000);
}

/* フェードのタイマーは**プレイヤーごと**に持つ。1本を共有すると、
   前の曲のフェードアウト中に次の曲のフェードが始まった瞬間、
   前の曲の残りが取り消されて「半分の音量で鳴りっぱなし」になる */
const fadeTimers = new Map<AudioPlayer, ReturnType<typeof setInterval>>();

function fadeTo(p: AudioPlayer, to: number, then?: () => void) {
  const old = fadeTimers.get(p);
  if (old) clearInterval(old);
  const from = p.volume;
  const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP));
  let i = 0;
  const timer = setInterval(() => {
    i += 1;
    try {
      p.volume = from + ((to - from) * i) / steps;
    } catch {
      /* 破棄済みなら止めるだけ */
    }
    if (i >= steps) {
      clearInterval(timer);
      if (fadeTimers.get(p) === timer) fadeTimers.delete(p);
      then?.();
    }
  }, FADE_STEP);
  fadeTimers.set(p, timer);
}

/**
 * その場面の曲に切り替える。同じ曲なら何もしない。
 * **待たない・失敗を投げない**（sound.ts と同じ扱い）。
 */
export function playMusic(track: MusicTrack) {
  /* 場面が動いた＝表で音を出してよい状態。見回りも再開する */
  halted = false;
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
        /* ▍頭出しは「一度でも進んでいるとき」だけ
           作りたてのプレイヤーに seekTo すると、iOSのネイティブ側で落ちる
           報告がある（expo/expo#38550。実機でも「BGMが鳴る瞬間に落ちる」）。
           新品は位置0なので、そもそも seek する意味がない。
           効果音側（sound.ts の playSound）と同じガード */
        if (next.currentTime > 0) next.seekTo(0).catch(() => {});
        next.volume = 0;
        next.play();
        /* ここで拒否されていても気にしない。Webなら上の
           pointerdown 係が、次のタップで立ち上げ直す */
        fadeTo(next, VOLUME);
      } catch {
        /* 鳴らなくても学習は進む */
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
  halted = false;
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
  /* 止めたものを見回りが起こしてしまわないように */
  halted = true;
  for (const p of players.values()) {
    try {
      p.pause();
    } catch {}
  }
}

/** 設定の「BGM」。進捗ストアが起動時と切り替え時に流し込む */
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
