/* ============================================================
   バッジと称号。
   Webサイトの「COMIXAI図鑑」と同じ思想で、条件は
   「解除済みかどうか」だけを端末内に持つ（サーバー・アカウント不要）。

   バッジの判定は src/store/progress.tsx の evaluateBadges() に集約。
   ここは「台帳」＝表示用のメタ情報だけを持つ。
   ============================================================ */
import type { IconName } from '@/components/icons';

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
    /* いまSR専用の遊びが入っているのは金インクだけ（→ data/extras/sr.ts）。
       それを伏せると、別のSRを当てた人が「おまけが無い」と延々探すことになる */
    hint: 'SR「金インクの原稿の中」に、専用の遊びがついている',
  },
  {
    id: 'extra-all',
    icon: 'trophy',
    art: require('@/assets/badges/extra-all.png'),
    name: '殿堂',
    desc: 'R以上のおまけを、すべてクリアした',
    /* 本数は EXTRA_TOTAL（→ data/extras/index.ts）と揃えること。
       前は「14本」と書いたまま実体が12本になっていた */
    hint: '全12本。まだ実装中のぶんも含む——称号には要らない、コレクターだけの1枚',
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

    ▍最上位は「殿堂を除く全部」に置く
    一度は16（＝1日で取り切れる上限）に置いていたが、**全20個のうち
    16でマスターは軽すぎる**という判断で「全部」に戻した。
    連続日数（3日・7日）と復習の卒業（日をまたいで3回正解）が必須に
    なるので、マスターは**どうしても数日かかる**。それでいい——
    称号の頂点は、駆け抜けた人ではなく通い続けた人のもの。

    おまけのバッジ5枚を足して全25枚になったので、マスターは24。
    **外してあるのは「殿堂」（おまけ14本すべて）の1枚だけ**で、
    これはガチャの運が大きく効く（SRを5つ揃えるのに中央値459P）。
    運で頂点に届かないのは称号の設計として良くないので、殿堂は
    マスターの上に残る、コレクターだけの目標にしてある。

    ▍SRのおまけを作り終えるまで、マスターには届かない
    条件に入っている `extra-sr` は、SR用の専用ゲームが1本でも
    入るまで取れない。**数字を今だけ下げると、あとで上げたときに
    称号が下がって見える**（称号はバッジ数から毎回計算するため）。
    先に最終形の24を置いて、中身が追いつくのを待つ。

    段は 3・6・9・12・15・24。
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
    need: 24,
    icon: 'crown',
    name: 'AIマスター',
    say: '全部、取ったのね。……ここまで来る人は、そういない。',
    sayByAvatar: {
      ottori: '全部、取られたんですね。……ここまで来る方は、そういません。',
      /* ねっけつは「感動しいですぐ泣く」（→ data/avatars.ts）。
         いちばんの山場なので、ここで一度だけ出す */
      nekketsu: '全部取ったのか。……ここまで来るやつは、そういない。……いや、泣いてない。',
      otenba: '全部取ったじゃん。……ここまで来る人、まじでそういないから。',
      kanroku: '全部、取ったか。……ここまで来る人は、そういない。',
      neko: 'ぜんぶ取った！ ……ここまで来る人、そんなにいないんだよ。すごい。',
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
