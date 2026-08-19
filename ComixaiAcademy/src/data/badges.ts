/* ============================================================
   バッジと称号。
   Webサイトの「COMIXAI図鑑」と同じ思想で、条件は
   「解除済みかどうか」だけを端末内に持つ（サーバー・アカウント不要）。

   バッジの判定は src/store/progress.tsx の evaluateBadges() に集約。
   ここは「台帳」＝表示用のメタ情報だけを持つ。
   ============================================================ */
import type { IconName } from '@/components/icons';

import { EXTRA_TOTAL } from './extras';
import { voiceIdOf, type AvatarId, type ByAvatar } from './types';

export interface Badge {
  id: string;
  /** 絵が無いバッジの代役。**絵を入れたら使われない**（→ art） */
  icon: IconName;
  /** 勲章の絵（`require('@/assets/badges/<id>.png')`）。

      ▍アイコンではなく絵にする理由
      バッジは「取った瞬間のごほうび」なので、線画のアイコンだと軽い。
      入れ物だけ先に作ってあるので、**描けたものから1枚ずつ**差し替えられる。
      未記入のあいだは icon がそのまま出る（画面は壊れない）。

      絵の仕様は assets/badges/README.md に置いた。 */
  art?: number;
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
    art: require('@/assets/badges/avatar-set.png'),
    name: '相棒えらび',
    desc: 'アバターを選んだ',
    hint: '誰と学ぶかを、まず決めるところから',
  },
  {
    id: 'role-set',
    icon: 'compass',
    art: require('@/assets/badges/role-set.png'),
    name: '配属決定',
    desc: '職種を選んだ',
    hint: '自分の仕事を選ぶと、教わる中身が変わるらしい',
  },
  {
    id: 'first-lesson',
    icon: 'star',
    art: require('@/assets/badges/first-lesson.png'),
    name: 'はじめの一歩',
    desc: '最初のレッスンを修了した',
    hint: 'まずは1本、最後まで',
  },
  {
    id: 'course-basics',
    icon: 'sprout',
    art: require('@/assets/badges/course-basics.png'),
    name: 'きほん修了',
    desc: 'コース「AIのきほん」を全部クリアした',
    hint: '土台になる4本を、ぜんぶ',
  },
  {
    id: 'course-work',
    icon: 'briefcase',
    art: require('@/assets/badges/course-work.png'),
    name: '最初の一週間、走破',
    desc: 'コース「最初の一週間」を全部クリアした',
    hint: '自分の職種の一歩目から三歩目まで',
  },
  {
    id: 'course-prompt',
    icon: 'pen',
    art: require('@/assets/badges/course-prompt.png'),
    name: '道場やぶり',
    desc: 'コース「プロンプト道場」を全部クリアした',
    hint: '書き方の型を、手に入れた者に',
  },
  {
    id: 'course-risk',
    icon: 'shield',
    art: require('@/assets/badges/course-risk.png'),
    name: '事故らない人',
    desc: 'コース「事故らないAI」を全部クリアした',
    hint: '便利さより先に知っておく話を、ひととおり',
  },
  {
    id: 'course-next',
    icon: 'rocket',
    art: require('@/assets/badges/course-next.png'),
    name: '一歩先',
    desc: 'コース「これからのAI」を全部クリアした',
    hint: '一問一答の、その先まで',
  },
  {
    id: 'quiz-perfect',
    icon: 'perfect',
    art: require('@/assets/badges/quiz-perfect.png'),
    name: 'ノーミス',
    desc: 'クイズを1問も間違えずにレッスンを修了した',
    hint: '一度も間違えずに終えられるか',
  },
  {
    id: 'quiz-perfect-5',
    icon: 'target',
    art: require('@/assets/badges/quiz-perfect-5.png'),
    name: '無傷の5本',
    desc: 'ノーミス修了を5レッスン達成した',
    hint: 'まぐれでない、を証明する回数',
  },
  {
    id: 'streak-3',
    icon: 'fire',
    art: require('@/assets/badges/streak-3.png'),
    name: '三日坊主、返上',
    desc: '3日連続で学習した',
    hint: '続けることでしか取れないものがある',
  },
  {
    id: 'streak-7',
    icon: 'calendar',
    art: require('@/assets/badges/streak-7.png'),
    name: '一週間皆勤',
    desc: '7日連続で学習した',
    hint: '三日の、その先へ',
  },
  /* ▍総数に連動する言い方をしない
     レッスンはこれから増やす。「全レッスンの半分」だと、増やすたびに
     条件が動いて、取った人と取っていない人で意味が変わる（実機で指摘）。
     固定の本数で言う。増築しても、この10本は10本のまま */
  {
    id: 'half',
    icon: 'badges',
    art: require('@/assets/badges/half.png'),
    name: '10本ノック',
    desc: 'レッスンを10本修了した',
    hint: '積み上げて、10本',
  },
  {
    id: 'all-clear',
    icon: 'crown',
    art: require('@/assets/badges/all-clear.png'),
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
    art: require('@/assets/badges/star-first.png'),
    name: 'はじめての★3',
    desc: 'ミニゲームをノーミスで通した',
    hint: '一度も外さずに通せるか',
  },
  {
    id: 'star-5',
    icon: 'twinkle',
    art: require('@/assets/badges/star-5.png'),
    name: '★3を5本',
    desc: '5つのミニゲームで★3を取った',
    hint: 'まぐれでない、を証明する回数',
  },
  {
    id: 'star-all',
    icon: 'target',
    art: require('@/assets/badges/star-all.png'),
    name: '全★3',
    desc: '★のつくミニゲームすべてで★3を取った',
    hint: '1つ残らず、ノーミスで',
  },
  {
    id: 'review-first',
    icon: 'check',
    art: require('@/assets/badges/review-first.png'),
    name: '直した',
    desc: '間違えた問題を1つ、復習で卒業させた',
    hint: '間違えたままにしない',
  },
  {
    id: 'review-10',
    icon: 'rotate',
    art: require('@/assets/badges/review-10.png'),
    name: '弱点つぶし',
    desc: '復習で10問を卒業させた',
    hint: '外したぶんを、10問ぶん直す',
  },
  {
    id: 'perfect-all',
    icon: 'crown',
    art: require('@/assets/badges/perfect-all.png'),
    name: '無傷',
    desc: 'すべてのレッスンをノーミスで修了した',
    hint: '全課程を、1問も落とさずに',
  },

  /* ———— おまけ（ガチャで当てた景品についてくる）————
     ▍しきい値は「全部」にしない
     ガチャは運なので、「SR全部」を条件にすると引けない人は永久に
     マスターになれない。実際に回して測ると、SR5つ揃えるのに必要なPは
     中央値459P（＝150回ぶん）で、稼げる総量を大きく超える。
     マスターの門は「R以上を5本」と「SRを1本」の2枚に置いた。
     この2つなら中央値53Pで、本編を一通り終える頃にちょうど届く。
     → README「ガチャの出やすさ」 */
  {
    id: 'extra-first',
    icon: 'egg',
    art: require('@/assets/badges/extra-first.png'),
    name: 'おまけ開封',
    desc: '当てた景品のおまけを1本クリアした',
    hint: 'ガチャで当てたものには、続きがある',
  },
  {
    id: 'extra-3',
    icon: 'sparkle',
    art: require('@/assets/badges/extra-3.png'),
    name: 'おかわり',
    desc: 'おまけを3本クリアした',
    hint: '当てたぶんだけ、遊ぶところが増える',
  },
  {
    id: 'extra-5',
    icon: 'sprout',
    art: require('@/assets/badges/extra-5.png'),
    name: '精進',
    desc: 'おまけを5本クリアした',
    hint: '当てた景品の中身を、5本ぶん',
  },
  {
    id: 'extra-sr',
    icon: 'twinkle',
    art: require('@/assets/badges/extra-sr.png'),
    name: 'SRを開けた',
    desc: 'SRの景品のおまけをクリアした',
    hint: 'いちばん豪華な1枚には、専用の遊びがついている',
  },
  {
    id: 'extra-all',
    icon: 'trophy',
    art: require('@/assets/badges/extra-all.png'),
    name: '殿堂',
    desc: 'R以上のおまけを、すべてクリアした',
    /* 本数を手で書かない。前は「14本」と書いたまま実体が20本になっていた
       （おまけを増やすたびにここが置いていかれる） */
    hint: `${EXTRA_TOTAL}本すべて。称号には要らない、コレクターだけの1枚`,
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
  const id = voiceIdOf(avatarId);
  if (id && title.sayByAvatar?.[id] !== undefined) return title.sayByAvatar[id];
  return title.say;
}

/** 上から順に、条件を満たす最上位が現在の称号になる。

    ▍最初の1本で必ず1つ上がるようにしてある
    オンボーディング（アバターと職種を決める）だけで2つ入るので、
    2で上がる作りにすると**レッスンを1本もやる前に昇格が済んでしまい**、
    最初のランクアップ演出が「AI研修生 → AIの相棒」になっていた。
    見習いの幅を3まで広げて、1本目を通した時点（first-lesson で3つ目）に
    「AI見習い → AI研修生」が来るようにしている。

    ▍最上位は「全25枚中22枚」に置く
    一度は「殿堂を除く全部（24）」に置いていたが、それだと復習の
    2枚（直した・弱点つぶし）が必須になる。復習は**間違えた問題しか
    入らない**ので、ミスの少ない人は10問ぶんわざと間違えないと
    マスターになれない（実機で指摘）。わざとミスを積ませる頂点は
    設計としておかしいので、殿堂＋2枚ぶんの遊びを持たせて22にした。
    うまい人は復習を飛ばせるし、普通に間違える人は自然に埋まる。

    22でも連続日数（3日・7日）はほぼ必須に残る（飛ばせるのは3枚
    だけで、殿堂がまず1枠を食う）ので、マスターは**どうしても
    数日かかる**。それでいい——称号の頂点は、駆け抜けた人ではなく
    通い続けた人のもの。

    殿堂を外に置く理由は変わらず：ガチャの運が大きく効く
    （SRを5つ揃えるのに中央値459P）。運で頂点に届かないのは
    称号の設計として良くない。殿堂はマスターの上に残る、
    コレクターだけの目標。

    段は 3・6・9・12・15・22。
    **バッジを増やすときは、ここの数字も見直すこと。** 増やしたぶん
    最上位が相対的に緩くなる（分母だけ増えて分子は据え置きになる）。 */
export const TITLES: Title[] = [
  {
    need: 0,
    icon: 'egg',
    name: 'AI見習い',
    say: 'まあ、そこからね。',
    sayByAvatar: {
      ottori: 'ここから、ですね。あなたのペースでいきましょう。',
      nekketsu: 'まずはここからだ。始めなきゃ、何も始まらねえ。',
      otenba: 'まあ、ここからっしょ。',
      kanroku: 'まずはここからだな。焦らなくていい。',
      neko: 'ここからだね！ はじめないと、はじまらないもん。',
    },
  },
  {
    need: 3,
    icon: 'learn',
    name: 'AI研修生',
    say: '研修生に上げておく。まだ何も覚えてないけど。',
    sayByAvatar: {
      ottori: '研修生に上がりましたね。……まだこれからですけど、ちゃんと一歩です。',
      nekketsu: '研修生だ！ まだ何も覚えてねえけどな、一歩は一歩だ。',
      otenba: '研修生になったじゃん。まだ何も覚えてないけどね。',
      kanroku: '研修生か。まだ何も覚えていないが、始めたことが大きい。',
      neko: '研修生になった！ ……まだ何も覚えてないけどね。',
    },
  },
  {
    need: 6,
    icon: 'buddy',
    name: 'AIの相棒',
    say: '相棒、か。悪くない響きね。',
    sayByAvatar: {
      ottori: '相棒、ですか。……その、うれしいです。',
      nekketsu: '相棒か。……おう、悪くねえ響きだな。',
      otenba: '相棒か。……いい響きじゃん。',
      kanroku: '相棒、か。……悪くない響きだな。',
      neko: '相棒だって！ ……えへへ、いい響き。',
    },
  },
  {
    need: 9,
    icon: 'hammer',
    name: 'AI使い',
    say: '道具として使えてる。ここからが面白い。',
    sayByAvatar: {
      ottori: '道具として、使えていますね。ここからが面白いところです。',
      nekketsu: '道具として使えてる。ここからが面白いんだ。',
      otenba: '道具として使えてるじゃん。ここからが面白いんだって。',
      kanroku: '道具として使えているな。ここからが面白い。',
      neko: '道具として使えてる！ ここからがおもしろいんだよ。',
    },
  },
  {
    need: 12,
    icon: 'cap',
    name: 'AI職人',
    say: '職人。人に教えられる域に入ったじゃない。',
    sayByAvatar: {
      ottori: '職人、ですね。人に教えられるところまで来ました。',
      nekketsu: '職人だ。人に教えられる域に入ったじゃねえか……！',
      otenba: '職人じゃん。人に教えられるとこまで来たね。',
      kanroku: '職人か。人に教えられる域に入ったな。',
      neko: 'じゃーん、職人！ 人に教えられるところまで来たね。',
    },
  },
  {
    need: 15,
    icon: 'trophy',
    name: 'AI師範',
    say: '師範。……もう私が教えることは、そう多くない。',
    sayByAvatar: {
      ottori: '師範……。もう、お伝えできることは、そう多くありません。',
      nekketsu: '師範……。もう、教えられることは、そう多くねえ。',
      otenba: '師範……。もう教えられること、そんな残ってないかも。',
      kanroku: '師範か。……もう、教えられることは、そう多くない。',
      neko: '師範……！ もう教えられること、あんまり無いかも。',
    },
  },
  {
    need: 22,
    icon: 'crown',
    name: 'AIマスター',
    /* 「全部取った」とは言わない。22で届く（殿堂や復習を残していても
       マスターにはなれる）ので、枚数ではなく道のりを労う */
    say: 'マスター、か。……ここまで来る人は、そういない。',
    sayByAvatar: {
      ottori: 'マスター、ですね。……ここまで来る方は、そういません。',
      /* ねっけつは「感動しいですぐ泣く」（→ data/avatars.ts）。
         いちばんの山場なので、ここで一度だけ出す */
      nekketsu: 'マスターか。……ここまで来るやつは、そういない。……いや、泣いてない。',
      otenba: 'マスターじゃん。……ここまで来る人、まじでそういないから。',
      kanroku: 'マスター、か。……ここまで来る人は、そういない。',
      neko: 'マスターだ！ ……ここまで来る人、そんなにいないんだよ。すごい。',
    },
  },
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
