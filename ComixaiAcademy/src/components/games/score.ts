/* ============================================================
   ゲームの成績。**全部のゲームが同じ物差しで測られる**ための共通部分。

   ▍なぜ要るのか
   作ったときは、ゲームごとに合否の考え方がばらばらだった。

   ・仕分け … ミス1回まで（負けられる）
   ・詰める … 完全一致しないと「決める」ボタンすら出ない（いちばん厳しい）
   ・組み立て … 何を選んでも必ずCLEAR（**負けられない**）
   ・見つける … ミスを数えるだけで、外しても通る
   ・並べる … 間違えても札が消えないので、総当たりで必ず解ける

   同じ「MINI GAME」の看板で難度が3段階も違い、しかもプレイヤーには
   見えない。半分は押せば終わるので、CLEARのスタンプまで軽くなっていた。

   ▍そろえたのは2つだけ
   1. **どのゲームにも「外す」がある**（allow 回まで許して、超えたらやり直し）
   2. **成績が★で残る**（ミス0で★3）。自己ベストを持つので、もう一度やる理由になる

   タイムも測るが、**★には使わない**。急かすと、考えずに当てにいく遊びになる。
   記録としてだけ出す。
   ============================================================ */
import React from 'react';

export interface GameScore {
  /** 外した回数 */
  misses: number;
  /** 何回まで外して通れるか。超えたら通らない */
  allow: number;
  /** かかった時間(ms)。★には効かない。記録としてだけ残す */
  ms: number;
}

/** ★の数（1〜3）。ミスの数だけで決まる */
export function starsOf(misses: number): number {
  if (misses <= 0) return 3;
  if (misses === 1) return 2;
  return 1;
}

/** タイトル画面と入口に出す「ミスは○回まで」 */
export function allowLabel(allow: number): string {
  return allow <= 0 ? 'ノーミスで突破' : `ミスは${allow}回まで`;
}

/** 1分半を超えたら分表記。記録の表示用 */
export function timeLabel(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 90) return `${s}秒`;
  return `${Math.floor(s / 60)}分${String(s % 60).padStart(2, '0')}秒`;
}

/** 遊んでいるあいだの時計。開いた時刻を覚えて、決めたときに引く */
export function useGameClock() {
  const startRef = React.useRef(Date.now());
  return React.useCallback(() => Date.now() - startRef.current, []);
}
