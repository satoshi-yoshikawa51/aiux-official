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
   ============================================================ */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export type SoundName =
  | 'tap'
  | 'pick'
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

/** せっていの「音を鳴らす」。進捗ストアが起動時と切り替え時に流し込む */
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

/**
 * 1音鳴らす。**待たない・失敗を投げない。**
 * 呼ぶ側は結果を気にせず、演出のついでに置いてよい。
 */
export function playSound(name: SoundName) {
  if (!enabled) return;
  try {
    let p = players.get(name);
    if (!p) {
      p = createAudioPlayer(FILES[name]);
      players.set(name, p);
    }
    /* 連打されると前の音が途中で残るので、必ず頭出しする。
       seekTo は Promise を返すが、待つと遅れて聞こえるので待たない */
    p.seekTo(0).catch(() => {});
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
