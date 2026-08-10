/* ============================================================
   バッジと称号。
   Webサイトの「COMIXAI図鑑」と同じ思想で、条件は
   「解除済みかどうか」だけを端末内に持つ（サーバー・アカウント不要）。

   バッジの判定は src/store/progress.tsx の evaluateBadges() に集約。
   ここは「台帳」＝表示用のメタ情報だけを持つ。
   ============================================================ */
import type { IconName } from '@/components/icons';

import type { AvatarId, ByAvatar } from './types';

export interface Badge {
  id: string;
  icon: IconName;
  name: string;
  /** 獲得条件（獲得後に表示） */
  desc: string;
  /** 未獲得のときに出す匂わせ */
  hint: string;
}

export const BADGES: Badge[] = [
  {
    id: 'avatar-set',
    icon: 'mask',
    name: '相棒えらび',
    desc: 'アバターを選んだ',
    hint: '誰と学ぶかを、まず決めるところから',
  },
  {
    id: 'role-set',
    icon: 'compass',
    name: '配属決定',
    desc: '職種を選んだ',
    hint: '自分の仕事を選ぶと、教わる中身が変わるらしい',
  },
  {
    id: 'first-lesson',
    icon: 'star',
    name: 'はじめの一歩',
    desc: '最初のレッスンを修了した',
    hint: 'まずは1本、最後まで',
  },
  {
    id: 'course-basics',
    icon: 'sprout',
    name: 'きほん修了',
    desc: 'コース「AIのきほん」を全部クリアした',
    hint: '土台になる4本を、ぜんぶ',
  },
  {
    id: 'course-work',
    icon: 'briefcase',
    name: '最初の一週間、走破',
    desc: 'コース「最初の一週間」を全部クリアした',
    hint: '自分の職種の一歩目から三歩目まで',
  },
  {
    id: 'course-prompt',
    icon: 'pen',
    name: '道場やぶり',
    desc: 'コース「プロンプト道場」を全部クリアした',
    hint: '書き方の型を、手に入れた者に',
  },
  {
    id: 'course-risk',
    icon: 'shield',
    name: '事故らない人',
    desc: 'コース「事故らないAI」を全部クリアした',
    hint: '便利さより先に知っておく話を、ひととおり',
  },
  {
    id: 'course-next',
    icon: 'rocket',
    name: '一歩先',
    desc: 'コース「これからのAI」を全部クリアした',
    hint: '一問一答の、その先まで',
  },
  {
    id: 'quiz-perfect',
    icon: 'perfect',
    name: 'ノーミス',
    desc: 'クイズを1問も間違えずにレッスンを修了した',
    hint: '一度も間違えずに終えられるか',
  },
  {
    id: 'quiz-perfect-5',
    icon: 'target',
    name: '無傷の5本',
    desc: 'ノーミス修了を5レッスン達成した',
    hint: 'まぐれでない、を証明する回数',
  },
  {
    id: 'streak-3',
    icon: 'fire',
    name: '三日坊主、返上',
    desc: '3日連続で学習した',
    hint: '続けることでしか取れないものがある',
  },
  {
    id: 'streak-7',
    icon: 'calendar',
    name: '一週間皆勤',
    desc: '7日連続で学習した',
    hint: '三日の、その先へ',
  },
  {
    id: 'half',
    icon: 'badges',
    name: '折り返し',
    desc: '全レッスンの半分を修了した',
    hint: '山の半分まで登ったら',
  },
  {
    id: 'all-clear',
    icon: 'crown',
    name: '全課程修了',
    desc: 'すべてのレッスンを修了した',
    hint: '最後の1本まで、残さず',
  },

  /* ———— ここから下は、あとから足したもの ————
     もとは14個しかなく、しかも**開始5分で4個入る**偏った配り方だった。
     10本目あたりが完全な無報酬地帯になっていたので、そこを埋める。

     ▍作った仕組みには、ちゃんと報酬を付ける
     ★も復習も、遊びとしては作ったのにバッジが1つも無かった。
     やったことが台帳に載らないと、やる理由が育たない。 */
  {
    id: 'star-first',
    icon: 'star',
    name: 'はじめての★3',
    desc: 'ミニゲームをノーミスで通した',
    hint: '一度も外さずに通せるか',
  },
  {
    id: 'star-5',
    icon: 'twinkle',
    name: '★3を5本',
    desc: '5つのミニゲームで★3を取った',
    hint: 'まぐれでない、を証明する回数',
  },
  {
    id: 'star-all',
    icon: 'target',
    name: '全★3',
    desc: '★のつくミニゲームすべてで★3を取った',
    hint: '1つ残らず、ノーミスで',
  },
  {
    id: 'review-first',
    icon: 'check',
    name: '直した',
    desc: '間違えた問題を1つ、復習で卒業させた',
    hint: '間違えたままにしない',
  },
  {
    id: 'review-10',
    icon: 'rotate',
    name: '弱点つぶし',
    desc: '復習で10問を卒業させた',
    hint: '外したぶんを、10問ぶん直す',
  },
  {
    id: 'perfect-all',
    icon: 'crown',
    name: '無傷',
    desc: 'すべてのレッスンをノーミスで修了した',
    hint: '全課程を、1問も落とさずに',
  },
];

export const BADGE_COUNT = BADGES.length;

export function getBadge(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

/* ———————————————— 称号 ———————————————— */

export interface Title {
  /** 必要バッジ数 */
  need: number;
  name: string;
  icon: IconName;
  /** 昇格したときのひとこと。全画面の演出で読ませる山場のセリフ */
  say: string;
  /** 相棒別の書き分け。**未記入なら say（＝先生の言葉）に落ちる** */
  sayByAvatar?: ByAvatar<string>;
}

/** 昇格のひとことを、選んでいる相棒の口調で返す */
export function titleSay(title: Title, avatarId: AvatarId | null): string {
  if (avatarId && title.sayByAvatar?.[avatarId] !== undefined) return title.sayByAvatar[avatarId];
  return title.say;
}

/** 上から順に、条件を満たす最上位が現在の称号になる。

    ▍最初の1本で必ず1つ上がるようにしてある
    オンボーディング（アバターと職種を決める）だけで2つ入るので、
    2で上がる作りにすると**レッスンを1本もやる前に昇格が済んでしまい**、
    最初のランクアップ演出が「AI研修生 → AIの相棒」になっていた。
    見習いの幅を3まで広げて、1本目を通した時点（first-lesson で3つ目）に
    「AI見習い → AI研修生」が来るようにしている。

    ▍最上位は「やり込みだけで届く」ところに置く
    もとは全20個…ではなく全14個で、最上位が14＝**全部**だった。つまり
    `streak-7`（7日連続）が必須で、**1日で17本やり切ったヘビーユーザーでも
    7日目まで AIマスター になれない**。頑張った人ほど「あと2個」の中身が
    待ち時間だと気づいて萎える作りだった。

    いまは20個あり、**1日で取り切れるのは16個**（連続日数2つと復習2つは、
    日をまたがないと取れない）。最上位をちょうど16に置いてあるので、
    やり込めばその日のうちに届く。残る4つは称号の先にあるコレクション。

    **バッジを増やすときは、ここの数字も見直すこと。** 増やしたぶん
    最上位が相対的に緩くなる（分母だけ増えて分子は据え置きになる）。 */
export const TITLES: Title[] = [
  { need: 0, icon: 'egg', name: 'AI見習い', say: 'まあ、そこからね。' },
  { need: 3, icon: 'learn', name: 'AI研修生', say: '研修生に上げておく。まだ何も覚えてないけど。' },
  { need: 6, icon: 'buddy', name: 'AIの相棒', say: '相棒、か。悪くない響きね。' },
  { need: 9, icon: 'hammer', name: 'AI使い', say: '道具として使えてる。ここからが面白い。' },
  { need: 11, icon: 'cap', name: 'AI職人', say: '職人。人に教えられる域に入ったじゃない。' },
  { need: 13, icon: 'trophy', name: 'AI師範', say: '師範。……もう私が教えることは、そう多くない。' },
  { need: 16, icon: 'crown', name: 'AIマスター', say: 'よくやった。ここまで来る人は、そういない。' },
];

export function titleFor(badgeCount: number): Title {
  let current = TITLES[0];
  for (const t of TITLES) if (badgeCount >= t.need) current = t;
  return current;
}

/** 次の称号（最高位ならnull） */
export function nextTitle(badgeCount: number): Title | null {
  return TITLES.find((t) => t.need > badgeCount) ?? null;
}

/** ひとつ前の称号（いちばん下ならnull）。
    ランクアップの演出で「どこから上がったか」を出すのに使う */
export function prevTitle(title: Title): Title | null {
  const i = TITLES.findIndex((t) => t.name === title.name);
  return i > 0 ? TITLES[i - 1] : null;
}
