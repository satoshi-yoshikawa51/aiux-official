/* ============================================================
   相棒のセリフ。**フキダシの中身は、そのキャラがしゃべっている言葉**なので、
   相棒を変えたら口調も変わる。ここはその置き場。

   ▍レッスンのカードだけは courses/ 側にある
   カードのセリフは本文と一体で読むものなので、`sayByAvatar` として
   カードの隣に置いてある（→ data/types.ts の LessonCard）。
   ここに集めたのは「レッスン本文に紐づかない、場面ごとのセリフ」。

   ▍書けていないぶんは先輩の言葉が出る
   **未記入なら共通（＝先輩の言葉）にそのまま落ちる**ので、モデルを足した
   キャラから少しずつ埋めていける。

   このファイルの「場面ごとのセリフ」は、**6人ぶんとも埋まっている**
   （クイズ5・修了試験6・復習5・エンディング1・小話6）。残っているのは
   レッスン本文の sayByAvatar（courses/）と称号（badges.ts）。

   ▍書くときの指針は avatars.ts の personality
   おっとり＝やさしい敬語の照れ屋。相手を否定しない／
   ねっけつ＝タメ口で暑苦しい。感動しいですぐ泣く／
   おてんば＝ギャル系で芸術肌。まじで・とりま・〜じゃん／
   かんろく＝優しい口調だが貫禄がある。家ではやさしいパパ／
   かんばん（ID: neko）＝好奇心旺盛で目立ちたがりだが素直。noteのマンガに
     出ている看板キャラなので、**アプリの都合で性格を作らない**／
   先輩＝下のとおり。

   ▍先輩（もと「先生」。同じ人物）はサイトの「Claude教習所」と同一人物
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

import { voiceIdOf, type AvatarId, type ByAvatar } from './types';

/** 共通（先輩の言葉）と、相棒別の差し替えを1組にしたもの */
export interface Line {
  common: string;
  byAvatar?: ByAvatar<string>;
}

/** 選んでいる相棒の言葉を返す。無ければ共通に落ちる */
export function say(line: Line, avatarId: AvatarId | null): string {
  const id = voiceIdOf(avatarId);
  if (id && line.byAvatar?.[id] !== undefined) return line.byAvatar[id];
  return line.common;
}

/* ———————————————— 入口の一幕 ————————————————
   職種を決めた直後、相棒が歩いてきて言うひとこと（app/intro.tsx）。
   このあとホームでアプリ案内が始まるので、**そこへ渡す言葉**にする。
   ここで「AIとは」を語り出すと、案内の前置きとして長すぎる */

export const INTRO_VOICE = {
  greet: {
    common: 'その仕事なら、教えることは決まった。……でもAIの前に、まずはこのアプリの使い方から。',
    /* ▍ここは初期の2人ぶんだけでいい
       この一幕が出るのは**職種を決めた直後の1回だけ**で、そこで選べるのは
       初期の2人（→ data/avatars.ts の initial）。ガチャで当たる相棒が
       ここをしゃべる道は無い。逆に、この2人ぶんは必ず書く——
       このひとことが**選んだ相棒の第一声**なので、共通（先輩の口調）に
       落ちると、選んだ相手と目の前でしゃべる人が別人になる */
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
  quizAsk: {
    common: '確認するよ。ここだけは外さないで。',
    byAvatar: {
      ottori: '確認しますね。ここだけは、外さないでください。',
      nekketsu: '確認だ。ここだけは外すなよ。',
      otenba: 'はい確認〜。ここだけは外さないでよ？',
      kanroku: '確認しよう。ここだけは外さないでほしい。',
      neko: 'かくにん！ ここだけは外さないでよ？',
    },
  } as Line,
  /** 正解したとき */
  quizRight: {
    common: 'そう。わかってるじゃない。',
    byAvatar: {
      ottori: 'はい、正解です。……ちゃんと分かっていますね。',
      nekketsu: 'そうだ！ 分かってるじゃねえか。',
      otenba: 'せいかーい。分かってるじゃん。',
      kanroku: 'そう、それでいい。',
      neko: 'せいかい！ わかってるじゃん！',
    },
  } as Line,
  /** 間違えたとき */
  quizWrong: {
    common: '違う。……まあ、間違えるなら今のうちよ。',
    byAvatar: {
      ottori: '惜しいです。……でも、いま間違えておけるのは、いいことですよ。',
      nekketsu: '違う。……いいさ、間違えるなら今のうちだ。',
      otenba: 'ざんねん。まあ、いま間違えとくのが得じゃん？',
      kanroku: '違うな。……いい、間違えるのは今のうちだ。',
      neko: 'ざんねん。……でも、いま間違えるほうがいいんだよ。',
    },
  } as Line,
  /** ノーミスで終えたとき */
  resultPerfect: {
    common: 'ノーミス。……文句なしじゃない。',
    byAvatar: {
      ottori: 'ノーミスです。……すごい。わたし、うれしいです。',
      nekketsu: 'ノーミス……！ おい、文句なしだぞ。',
      otenba: 'ノーミスじゃん。……まじですごくない？',
      kanroku: 'ノーミスか。……見事だ。',
      neko: 'ノーミス……！ じゃーん、すごいじゃん！',
    },
  } as Line,
  /** どこか間違えて終えたとき */
  resultDone: {
    common: '終わり。間違えたところは、あとで戻ればいい。',
    byAvatar: {
      ottori: 'おつかれさまでした。間違えたところは、あとで戻ってきましょう。',
      nekketsu: '終わりだ。間違えたところは、あとで戻りゃいい。',
      otenba: 'おつかれ〜。間違えたとこは、あとで戻ればいいって。',
      kanroku: 'おつかれさま。間違えたところは、あとで戻ればいい。',
      neko: 'おつかれ！ まちがえたとこは、あとで戻ろ。',
    },
  } as Line,
};

/* ———————————————— 修了試験 ————————————————
   コースの全レッスンを終えた人だけが受けられる（app/exam/[courseId].tsx）。
   本編・復習と**もう一段あらたまった言い方**にする。試験なので */

export const EXAM_VOICE = {
  /** 入口。ルール説明の横で */
  intro: {
    common: '修了試験。ここまでの全部から出す。落ちても、何度でも受けていいから。',
    byAvatar: {
      ottori: '修了試験です。ここまでの全部から出します。落ちても、何度でも受けられますから。',
      nekketsu: '修了試験だ。ここまでの全部から出す。落ちても何度でも受けられる。安心して来い。',
      otenba: '修了試験ね。ここまで全部から出すよ。落ちても何回でも受けられるし、気楽にいこ。',
      kanroku: '修了試験だ。ここまでの全部から出す。落ちても、何度でも受けていい。',
      neko: '修了試験！ ここまでの全部から出るよ。落ちても何回でも受けられるから、こわくない。',
    },
  } as Line,
  /** 問題を出すとき */
  ask: {
    common: '次。落ち着いて。',
    byAvatar: {
      ottori: '次です。落ち着いて。',
      nekketsu: '次だ。落ち着け。',
      otenba: 'はい次〜。落ち着いてね。',
      kanroku: '次だ。落ち着いていこう。',
      neko: 'つぎ！ 落ちついて。',
    },
  } as Line,
  /** 正解したとき */
  right: {
    common: 'そう。',
    byAvatar: {
      ottori: 'はい。',
      nekketsu: 'よし。',
      otenba: 'おっけ。',
      kanroku: 'よろしい。',
      neko: 'せいかい！',
    },
  } as Line,
  /** 間違えたとき */
  wrong: {
    common: '……惜しい。先に進むよ。',
    byAvatar: {
      ottori: '……惜しいです。先に進みますね。',
      nekketsu: '……惜しい。先に進むぞ。',
      otenba: '……おしい。先いくね。',
      kanroku: '……惜しかったな。先に進もう。',
      neko: '……おしい。つぎいこ。',
    },
  } as Line,
  /** 合格したとき（花火の画面で出す） */
  pass: {
    common: '合格。……この章は、もうあなたのものよ。',
    byAvatar: {
      ottori: '合格です。……この章は、もうあなたのものですよ。',
      nekketsu: '合格だ……！ この章は、もうきみのものだぞ。',
      otenba: '合格じゃん！ この章はもう、あんたのもの。',
      kanroku: '合格だ。……この章は、もう君のものだよ。',
      neko: 'ごうかく！ じゃーん、この章はもうきみのものだよ！',
    },
  } as Line,
  /** 落ちたとき */
  fail: {
    common: '今回は届かなかった。間違えたところを見直して、また来て。',
    byAvatar: {
      ottori: '今回は届きませんでしたね。間違えたところを見直して、また来てください。',
      nekketsu: '今回は届かなかったな。間違えたところを見直して、また来い。何度でも待ってる。',
      otenba: '今回はとどかなかったか。間違えたとこ見直して、また来て。',
      kanroku: '今回は届かなかったな。間違えたところを見直して、また来るといい。',
      neko: '今回はとどかなかったね。まちがえたとこ見なおして、また来て！',
    },
  } as Line,
};

/* ———————————————— 復習 ————————————————
   間違えた問題だけを出し直す場面（app/review.tsx）。
   本編のクイズとは**言い方を変える**。同じ「確認だ」を使うと、
   復習に来たのか本編にいるのか分からなくなる */

export const REVIEW_VOICE = {
  /** 問題を出すとき */
  ask: {
    common: '前に外した問題。今度はどう？',
    byAvatar: {
      ottori: '前に外した問題です。今度は、どうでしょう。',
      nekketsu: '前に外した問題だ。今度はどうだ？',
      otenba: '前に外した問題ね。今度はどう？',
      kanroku: '前に外した問題だ。今度はどうかな。',
      neko: '前に外した問題！ こんどはどう？',
    },
  } as Line,
  /** 正解したとき */
  right: {
    common: 'よし。もう間違えないね。',
    byAvatar: {
      ottori: 'はい、もう大丈夫ですね。',
      nekketsu: 'よし！ もう間違えないな。',
      otenba: 'おっけ、もう間違えないね。',
      kanroku: 'よし。もう間違えないな。',
      neko: 'よし、もう間違えないね！',
    },
  } as Line,
  /** また間違えたとき */
  wrong: {
    common: 'まだね。ここは、もう一度出すよ。',
    byAvatar: {
      ottori: 'まだですね。ここは、もう一度お出しします。',
      nekketsu: 'まだだな。ここは、もう一度出す。',
      otenba: 'まだかー。ここ、もう一回出すね。',
      kanroku: 'まだだな。ここは、もう一度出そう。',
      neko: 'まだだね。じゃあ、もう一回もってくるね。',
    },
  } as Line,
  /** 全問正解で終えたとき */
  allRight: {
    common: '全部正解。前に外したとは思えないじゃない。',
    byAvatar: {
      ottori: '全部正解です。前に外したとは思えません。',
      nekketsu: '全問正解……！ 前に外したとは思えねえよ。',
      otenba: '全部正解じゃん。前に外したとか嘘でしょ。',
      kanroku: '全部正解か。前に外したとは思えないな。',
      neko: '全部せいかい！ 前に外したなんて、うそみたい。',
    },
  } as Line,
  /** どこか間違えて終えたとき */
  wrapUp: {
    common: '残ったぶんは、また持ってくる。逃がさないよ。',
    byAvatar: {
      ottori: '残ったぶんは、また持ってきますね。',
      nekketsu: '残ったぶんは、また持ってくる。逃がさねえぞ。',
      otenba: '残ったぶんは、また持ってくるから。逃がさないよ〜。',
      kanroku: '残ったぶんは、また持ってくる。逃がしはしないよ。',
      neko: 'のこりは、また持ってくるね。にがさないよ！',
    },
  } as Line,
};

/* ———————————————— 締め ————————————————
   全17本を終えた人にだけ出る（app/ending.tsx）。
   **ここで新しい話はしない。** 送り出す言葉だけ */

export const ENDING_VOICE = {
  close: {
    common:
      '……終わったね。ここまで来る人は、そういない。あとは現場で使って。使わないと、全部落ちるから。',
    byAvatar: {
      ottori:
        '……終わりましたね。ここまで来る人は、そういません。あとは現場で使ってください。使わないと、全部こぼれてしまいますから。',
      /* ねっけつは「感動しいですぐ泣く」（→ data/avatars.ts）。
         締めは、その一点だけ出しておく */
      nekketsu:
        '……終わったな。ここまで来るやつは、そういない。あとは現場で使え。使わなきゃ、全部抜けちまうからな。……いや、泣いてない。',
      otenba:
        '……終わったね。ここまで来る人、まじでそういないから。あとは現場で使って。使わないと全部忘れるよ、ほんとに。',
      kanroku:
        '……終わったな。ここまで来る人は、そういない。あとは現場で使うことだ。使わなければ、全部抜け落ちる。',
      neko:
        '……終わったね。ここまで来る人、そんなにいないんだよ。あとは現場で使って。使わないと、ぜんぶ抜けちゃうから。',
    },
  } as Line,
};

/* ———————————————— ホームの小話 ————————————————
   アバターをつつくと出るひとこと。
   **相棒ごとに丸ごと差し替える**（口調だけでなく、何を言うかも変わるため）。
   未記入の相棒は先輩のものが出る */

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

/* おてんば＝ギャル系で芸術肌。まじで／とりま／〜じゃん。根はやさしい */
const OTENBA_TALK: SmallTalk[] = [
  { say: 'ん？ 用が無いなら手ぇ動かそ？', motion: 'arms-crossed' },
  { say: '休憩する？ 詰め込みすぎても入んないしね。', motion: 'idle-b' },
  { say: '1日1本でよくない？ 続けるほうがむずいって。', motion: 'explain' },
  { say: 'わかんないとこは飛ばしていいよ。あとで戻ろ。', motion: 'wave' },
  { say: '……そんな見ないでよ、照れるじゃん。', motion: 'worried', emote: 'bang' },
  { say: 'お、いい顔になってきたじゃん。', motion: 'laugh', emote: 'sparkle' },
];

/* かんろく＝優しい口調だが貫禄がある。家ではやさしいパパ */
const KANROKU_TALK: SmallTalk[] = [
  { say: '……ん？ 用が無いなら、手を動かそうか。', motion: 'arms-crossed' },
  { say: '休憩かい。詰め込みすぎても入らないからな。', motion: 'idle-b' },
  { say: '1日1本で十分だ。続けるほうが、よほど難しい。', motion: 'explain' },
  { say: 'わからないところは飛ばしていい。あとで戻ればいいさ。', motion: 'wave' },
  { say: '……そう見られると、いい年をして落ち着かないな。', motion: 'worried', emote: 'bang' },
  { say: 'うん。いい顔になってきたな。', motion: 'laugh', emote: 'sparkle' },
];

/* かんばん＝看板キャラ。好奇心旺盛で目立ちたがりだが素直（→ data/avatars.ts）。
   「じゃーん」は決めゼリフなので、ここでは1本だけに絞る */
const KANBAN_TALK: SmallTalk[] = [
  { say: 'ん？ よんだ？ ……よんでない？ そっか。', motion: 'idle-b' },
  { say: '休憩しよ！ 詰めこみすぎても、入らないしね。', motion: 'explain' },
  { say: '1日1本でいいんだって。つづけるほうが、むずかしいから。', motion: 'wave' },
  { say: 'わかんないとこは、とばしていいよ。あとで戻ろ！', motion: 'explain' },
  { say: '……そんなに見ないでよ。てれるじゃん。', motion: 'worried', emote: 'bang' },
  { say: 'じゃーん！ いい顔になってきたね！', motion: 'laugh', emote: 'sparkle' },
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
  /* ここから下はガチャで仲間になる2人 */
  otenba: OTENBA_TALK,
  kanroku: KANROKU_TALK,
  /* キーはアバターID。名乗りは「かんばん」だが、IDはGLBのファイル名に
     合わせて neko のまま（→ data/avatars.ts） */
  neko: KANBAN_TALK,
};

/** その相棒の小話。書けていなければ先生のものを返す */
export function smallTalkFor(avatarId: AvatarId | null): SmallTalk[] {
  const id = voiceIdOf(avatarId);
  return (id && SMALL_TALK[id]) || SENSEI_TALK;
}
