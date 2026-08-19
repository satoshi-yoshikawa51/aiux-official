/* ============================================================
   効果音。

   ▍なぜ入れたか
   触覚（Haptics）は最初から入っているのに、**聴覚だけが空だった**。
   星が舞ってもタイルが弾けても称号が上がっても無音で、
   演出のいちばん安い伸びしろがここに残っていた。

   ▍音は拾ってこない。作る
   `tools/build-sounds.mjs` が合成している。素材を拾うと出どころと商用利用が
   ついて回るうえ、音のトーンがばらばらになる。ぜんぶ同じ音源から作れば、
   アイコンや書体と同じで「同じ手で描いたもの」に揃う。

   ▍鳴らないことを異常にしない
   端末の設定・読み込み失敗・Webの自動再生規制など、鳴らない理由はいくらでも
   ある。**どれも学習を止める理由にはならない**ので、失敗はすべて黙って捨てる。
   触覚と同じ扱い（あれば嬉しい、無くても困らない）。

   ▍消音スイッチには逆らわない
   iOSのサイレントスイッチを無視して鳴らす設定にはしていない。
   電車で開く人がいる学習アプリで、消したのに鳴るのはただの事故。

   ▍player は使い回す
   鳴らすたびに作ると、連打で端末のプレイヤーが増え続ける。
   1音1つを持ち、頭出ししてから鳴らす。

   ▍Webは WebAudio で鳴らす
   expo-audio（HTMLAudioElement）は再生開始までの遅れが大きく、
   「押した音が遅れて聞こえる」が直りきらなかった（実機で再指摘。
   ホーム画面に置いたWebアプリで遊んでいるので、そこが本番）。
   起動時にデコード済みの AudioBuffer を持っておき、押した瞬間に
   AudioContext へ流す。この経路はデコードもシークも無いので即応する。
   ============================================================ */
import { Platform } from 'react-native';

import { Asset } from 'expo-asset';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export type SoundName =
  | 'tap'
  | 'pick'
  | 'tick'
  | 'right'
  | 'wrong'
  | 'start'
  | 'clear'
  | 'star'
  | 'badge'
  | 'rankup'
  | 'finish';

/* require は静的に書く必要がある（Metroが束ねるのはリテラルだけ）ので、
   台帳をここに置く。tools/build-sounds.mjs の SOUNDS と名前を揃えること */
const FILES: Record<SoundName, number> = {
  tap: require('@/assets/sounds/tap.wav'),
  pick: require('@/assets/sounds/pick.wav'),
  tick: require('@/assets/sounds/tick.wav'),
  right: require('@/assets/sounds/right.wav'),
  wrong: require('@/assets/sounds/wrong.wav'),
  start: require('@/assets/sounds/start.wav'),
  clear: require('@/assets/sounds/clear.wav'),
  star: require('@/assets/sounds/star.wav'),
  badge: require('@/assets/sounds/badge.wav'),
  rankup: require('@/assets/sounds/rankup.wav'),
  finish: require('@/assets/sounds/finish.wav'),
};

const players = new Map<SoundName, AudioPlayer>();

/** 設定の「音を鳴らす」。進捗ストアが起動時と切り替え時に流し込む */
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

/* ———— Web専用：WebAudio ———— */

let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();

function webContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

async function preloadWeb() {
  const c = webContext();
  if (!c) return;
  await Promise.all(
    (Object.keys(FILES) as SoundName[]).map(async (name) => {
      if (buffers.has(name)) return;
      try {
        const asset = Asset.fromModule(FILES[name]);
        const res = await fetch(asset.uri);
        const raw = await res.arrayBuffer();
        buffers.set(name, await c.decodeAudioData(raw));
      } catch {
        /* 読めなくても、その音が鳴らないだけ */
      }
    }),
  );
}

/* ▍音は起動時に全部用意しておく
   押された瞬間に作ると、**最初の1回だけ読み込みのぶん遅れて鳴る**
   （実機で「押した音が遅れて聞こえる」の報告）。
   Webはデコード済みバッファ、ネイティブはプレイヤーを先に作る。
   起動時に1回呼ぶ（_layout.tsx） */
export function preloadSounds() {
  try {
    if (Platform.OS === 'web') {
      preloadWeb().catch(() => {});
      return;
    }
    for (const name of Object.keys(FILES) as SoundName[]) {
      if (!players.has(name)) players.set(name, createAudioPlayer(FILES[name]));
    }
  } catch {
    /* 作れなくても playSound が都度作りに行くので、遅れるだけで鳴る */
  }
}

/**
 * 1音鳴らす。**待たない・失敗を投げない。**
 * 呼ぶ側は結果を気にせず、演出のついでに置いてよい。
 */
export function playSound(name: SoundName) {
  if (!enabled) return;
  try {
    /* Web：デコード済みバッファを AudioContext へ。即応する */
    const c = webContext();
    if (c) {
      /* 自動再生規制で止まっていたら起こす（ユーザー操作の中なので通る）。
         resume は待たない——次のタップからは確実に鳴る */
      if (c.state === 'suspended') c.resume().catch(() => {});
      const buf = buffers.get(name);
      if (buf) {
        const src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start(0);
      } else {
        /* まだ読み込み中。次に備えて読みにいく（今回は鳴らない） */
        preloadWeb().catch(() => {});
      }
      return;
    }
    let p = players.get(name);
    if (!p) {
      p = createAudioPlayer(FILES[name]);
      players.set(name, p);
    }
    /* 2回目以降は再生位置が末尾に残っているので頭出しする。
       seekTo は Promise を返すが、待つと遅れて聞こえるので待たない。
       **一度も鳴らしていないときは呼ばない**（位置は0のままで、
       seek のぶんだけ初回が遅れるのを避ける） */
    if (p.currentTime > 0) p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    /* 鳴らなくても学習は進む */
  }
}

/** ★の数で鳴らし分ける。3のときだけ、上にきらっと重ねる */
export function playClear(stars: number) {
  playSound('clear');
  if (stars >= 3) setTimeout(() => playSound('star'), 260);
}
