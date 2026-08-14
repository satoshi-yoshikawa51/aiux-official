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

   ▍先生はサイトの「Claude教習所」と同一人物
   人物定義はサイト側（src/app/claude-app/courses.ts の冒頭）が原典：
   **ちょっとぶっきらぼうで口数少なめ、でも要所ではちゃんと褒めて、
   最後は優しく送り出す女性上司。**
   一人称「私」・二人称「あなた」・指示は「〜して」のテ形・
   語尾は「〜ね」「〜よ」「〜でしょ」。労いは照れ隠し気味に
   （「…飲み込み、早いじゃない。」）。**「おれ」「あんた」「〜しろ」の
   男性口調は書かない**——一度そうなって全部書き直している。
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

/* ———————————————— 入口の一幕 ————————————————
   職種を決めた直後、相棒が歩いてきて言うひとこと（app/intro.tsx）。
   このあとホームでアプリ案内が始まるので、**そこへ渡す言葉**にする。
   ここで「AIとは」を語り出すと、案内の前置きとして長すぎる */

export const INTRO_VOICE = {
  greet: {
    common: 'その仕事なら、教えることは決まった。……でもAIの前に、まずはこのアプリの使い方から。',
    /* ▍最初に選べる2人には必ず書く（→ store/tutorial.tsx の同じ注意書き）
       このひとことが**選んだ相棒の第一声**。ここが共通（先輩の口調）だと、
       選んだ相手と、目の前でしゃべる人が別人になる */
    byAvatar: {
      ottori:
        'そのお仕事なら、お教えすることは決まりました。……でもAIの前に、まずはこのアプリの使い方から。',
      nekketsu:
        'その仕事か、いいな。教えることは決まったぜ。……ただ、AIの前に、まずはこのアプリの使い方からだ。',
    },
  } as Line,
};

/* ———————————————— レッスンの進行 ————————————————
   カードを読み終わったあと、クイズと結果で出るもの。
   本文に紐づかないので、レッスンごとではなく1組で持つ */

export const LESSON_VOICE = {
  /** クイズを出すとき */
  quizAsk: { common: '確認するよ。ここだけは外さないで。' } as Line,
  /** 正解したとき */
  quizRight: { common: 'そう。わかってるじゃない。' } as Line,
  /** 間違えたとき */
  quizWrong: { common: '違う。……まあ、間違えるなら今のうちよ。' } as Line,
  /** ノーミスで終えたとき */
  resultPerfect: { common: 'ノーミス。……文句なしじゃない。' } as Line,
  /** どこか間違えて終えたとき */
  resultDone: { common: '終わり。間違えたところは、あとで戻ればいい。' } as Line,
};

/* ———————————————— 修了試験 ————————————————
   コースの全レッスンを終えた人だけが受けられる（app/exam/[courseId].tsx）。
   本編・復習と**もう一段あらたまった言い方**にする。試験なので */

export const EXAM_VOICE = {
  /** 入口。ルール説明の横で */
  intro: { common: '修了試験。ここまでの全部から出す。落ちても、何度でも受けていいから。' } as Line,
  /** 問題を出すとき */
  ask: { common: '次。落ち着いて。' } as Line,
  /** 正解したとき */
  right: { common: 'そう。' } as Line,
  /** 間違えたとき */
  wrong: { common: '……惜しい。先に進むよ。' } as Line,
  /** 合格したとき（花火の画面で出す） */
  pass: { common: '合格。……この章は、もうあなたのものよ。' } as Line,
  /** 落ちたとき */
  fail: { common: '今回は届かなかった。間違えたところを見直して、また来て。' } as Line,
};

/* ———————————————— 復習 ————————————————
   間違えた問題だけを出し直す場面（app/review.tsx）。
   本編のクイズとは**言い方を変える**。同じ「確認だ」を使うと、
   復習に来たのか本編にいるのか分からなくなる */

export const REVIEW_VOICE = {
  /** 問題を出すとき */
  ask: { common: '前に外した問題。今度はどう？' } as Line,
  /** 正解したとき */
  right: { common: 'よし。もう間違えないね。' } as Line,
  /** また間違えたとき */
  wrong: { common: 'まだね。ここは、もう一度出すよ。' } as Line,
  /** 全問正解で終えたとき */
  allRight: { common: '全部正解。前に外したとは思えないじゃない。' } as Line,
  /** どこか間違えて終えたとき */
  wrapUp: { common: '残ったぶんは、また持ってくる。逃がさないよ。' } as Line,
};

/* ———————————————— 締め ————————————————
   全17本を終えた人にだけ出る（app/ending.tsx）。
   **ここで新しい話はしない。** 送り出す言葉だけ */

export const ENDING_VOICE = {
  close: {
    common:
      '……終わったね。ここまで来る人は、そういない。あとは現場で使って。使わないと、全部落ちるから。',
  } as Line,
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
  { say: '……なに？ 用が無いなら、手を動かして。', motion: 'arms-crossed' },
  { say: '休憩？ まあ、詰め込みすぎても入らないからね。', motion: 'idle-b' },
  { say: '1日1本で十分。続けるほうが難しいんだから。', motion: 'explain' },
  { say: 'わからないところは、飛ばしていい。あとで戻って。', motion: 'wave' },
  { say: '……そんなに見ないの。', motion: 'worried', emote: 'bang' },
  { say: 'よし、いい顔になってきた。', motion: 'laugh', emote: 'sparkle' },
];

/* おっとり＝やさしい敬語の照れ屋。相手を否定しない */
const OTTORI_TALK: SmallTalk[] = [
  { say: '……はい？ どうか、しましたか。', motion: 'idle-b' },
  { say: '休憩にしましょうか。詰め込みすぎても、入りませんから。', motion: 'explain' },
  { say: '1日1本で十分ですよ。続けるほうが、ずっと難しいので。', motion: 'wave' },
  { say: 'わからないところは、飛ばしていいんです。あとで戻ってきましょう。', motion: 'explain' },
  { say: '……そんなに見られると、その、困ります。', motion: 'worried', emote: 'bang' },
  { say: 'よかった。いい顔に、なってきましたね。', motion: 'laugh', emote: 'sparkle' },
];

/* ねっけつ＝タメ口で暑苦しい。感動しいですぐ泣く */
const NEKKETSU_TALK: SmallTalk[] = [
  { say: 'なんだ？ 用が無いなら、手を動かそうぜ。', motion: 'arms-crossed' },
  { say: '休憩か。いいぜ、詰め込みすぎても入らねえからな。', motion: 'idle-b' },
  { say: '1日1本でいい。続けるほうが、よっぽど難しいんだ。', motion: 'explain' },
  { say: 'わからんところは飛ばせ。あとで戻ってくりゃいい。', motion: 'wave' },
  { say: '……なんだよ、そんなに見るな。照れるだろ。', motion: 'worried', emote: 'bang' },
  { say: 'よし、いい顔になってきたじゃねえか……！', motion: 'laugh', emote: 'sparkle' },
];

const SMALL_TALK: ByAvatar<SmallTalk[]> = {
  /* ▍最初に選べる2人（→ data/avatars.ts）
     アバターをつつくのは、案内が終わって最初に試す遊び。ここが共通
     （先輩の口調）だと、選んだ相手と別人がしゃべることになる */
  ottori: OTTORI_TALK,
  nekketsu: NEKKETSU_TALK,
  /* 「先生」は senpai に改名した。**キーを直さないと、ここに先輩の小話を
     書いた瞬間に効かなくなる**（IDが合わず、下の smallTalkFor が
     フォールバックを返し続ける） */
  senpai: SENSEI_TALK,
  /* otenba / kanroku は、その人らしい小話を書いてから足す。
     未記入のあいだは下の smallTalkFor が先輩のものを返す */
};

/** その相棒の小話。書けていなければ先生のものを返す */
export function smallTalkFor(avatarId: AvatarId | null): SmallTalk[] {
  return (avatarId && SMALL_TALK[avatarId]) || SENSEI_TALK;
}
