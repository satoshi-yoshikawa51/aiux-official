/* ============================================================
   相棒のセリフ。**フキダシの中身は、そのキャラがしゃべっている言葉**なので、
   相棒を変えたら口調も変わる。ここはその置き場。

   ▍レッスンのカードだけは courses/ 側にある
   カードのセリフは本文と一体で読むものなので、`sayByAvatar` として
   カードの隣に置いてある（→ data/types.ts の LessonCard）。
   ここに集めたのは「レッスン本文に紐づかない、場面ごとのセリフ」。

   ▍書けていないぶんは先生の言葉が出る
   1人あたり80本ほどあるので、一度に書き切る前提にしない。
   **未記入なら共通（＝先生の言葉）にそのまま落ちる**ので、
   モデルを足したキャラから少しずつ埋めていける。
   いまは先生ぶんだけが埋まっている状態。

   ▍書くときの指針は avatars.ts の personality
   先輩＝テンション高め・タメ口寄り／後輩＝敬語・素直・質問が多い／
   師匠＝老練・比喩多め・結論を先に言わない／相棒＝無感情・簡潔・数字で語る。
   ============================================================ */
import type { AvatarMotion } from '@/avatar/motions';
import type { IconName } from '@/components/icons';

import type { AvatarId, ByAvatar } from './types';

/** 共通（先生の言葉）と、相棒別の差し替えを1組にしたもの */
export interface Line {
  common: string;
  byAvatar?: ByAvatar<string>;
}

/** 選んでいる相棒の言葉を返す。無ければ共通に落ちる */
export function say(line: Line, avatarId: AvatarId | null): string {
  if (avatarId && line.byAvatar?.[avatarId] !== undefined) return line.byAvatar[avatarId];
  return line.common;
}

/* ———————————————— レッスンの進行 ————————————————
   カードを読み終わったあと、クイズと結果で出るもの。
   本文に紐づかないので、レッスンごとではなく1組で持つ */

export const LESSON_VOICE = {
  /** クイズを出すとき */
  quizAsk: { common: '確認だ。ここだけ間違えるな。' } as Line,
  /** 正解したとき */
  quizRight: { common: 'そうだ。わかってるじゃないか。' } as Line,
  /** 間違えたとき */
  quizWrong: { common: '違う。……まあ、ここで間違えておけ。' } as Line,
  /** ノーミスで終えたとき */
  resultPerfect: { common: 'ノーミスか。文句なしだ。' } as Line,
  /** どこか間違えて終えたとき */
  resultDone: { common: '終わりだ。間違えたところは、あとで戻ればいい。' } as Line,
};

/* ———————————————— ホームの小話 ————————————————
   アバターをつつくと出るひとこと。
   **相棒ごとに丸ごと差し替える**（口調だけでなく、何を言うかも変わるため）。
   未記入の相棒は先生のものが出る */

export interface SmallTalk {
  say: string;
  motion: AvatarMotion;
  emote?: IconName;
}

const SENSEI_TALK: SmallTalk[] = [
  { say: '……なんだ。用が無いなら、手を動かせ。', motion: 'arms-crossed' },
  { say: '休憩か。まあ、詰め込みすぎても入らないからな。', motion: 'idle-b' },
  { say: '1日1本で十分だ。続けるほうが難しい。', motion: 'explain' },
  { say: 'わからんところは、飛ばしていい。あとで戻れ。', motion: 'wave' },
  { say: '……そんなに見るな。', motion: 'worried', emote: 'bang' },
  { say: 'よし、いい顔になってきた。', motion: 'laugh', emote: 'sparkle' },
];

const SMALL_TALK: ByAvatar<SmallTalk[]> = {
  sensei: SENSEI_TALK,
  /* senpai / kouhai / shishou / aibou は、3Dモデルを足すときに書く。
     未記入のあいだは下の smallTalkFor が先生のものを返す */
};

/** その相棒の小話。書けていなければ先生のものを返す */
export function smallTalkFor(avatarId: AvatarId | null): SmallTalk[] {
  return (avatarId && SMALL_TALK[avatarId]) || SENSEI_TALK;
}
