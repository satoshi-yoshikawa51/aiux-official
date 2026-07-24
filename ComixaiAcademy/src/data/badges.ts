/* ============================================================
   バッジと称号。
   Webサイトの「COMIXAI図鑑」と同じ思想で、条件は
   「解除済みかどうか」だけを端末内に持つ（サーバー・アカウント不要）。

   バッジの判定は src/store/progress.tsx の evaluateBadges() に集約。
   ここは「台帳」＝表示用のメタ情報だけを持つ。
   ============================================================ */

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  /** 獲得条件（獲得後に表示） */
  desc: string;
  /** 未獲得のときに出す匂わせ */
  hint: string;
}

export const BADGES: Badge[] = [
  {
    id: 'avatar-set',
    emoji: '🎭',
    name: '相棒えらび',
    desc: 'アバターを選んだ',
    hint: '誰と学ぶかを、まず決めるところから',
  },
  {
    id: 'role-set',
    emoji: '🧭',
    name: '配属決定',
    desc: '職種を選んだ',
    hint: '自分の仕事を選ぶと、教わる中身が変わるらしい',
  },
  {
    id: 'first-lesson',
    emoji: '🌟',
    name: 'はじめの一歩',
    desc: '最初のレッスンを修了した',
    hint: 'まずは1本、最後まで',
  },
  {
    id: 'course-basics',
    emoji: '🌱',
    name: 'きほん修了',
    desc: 'コース「AIのきほん」を全部クリアした',
    hint: '土台になる4本を、ぜんぶ',
  },
  {
    id: 'course-work',
    emoji: '💼',
    name: '最初の一週間、走破',
    desc: 'コース「最初の一週間」を全部クリアした',
    hint: '自分の職種の一歩目から三歩目まで',
  },
  {
    id: 'course-prompt',
    emoji: '✍️',
    name: '道場やぶり',
    desc: 'コース「プロンプト道場」を全部クリアした',
    hint: '書き方の型を、手に入れた者に',
  },
  {
    id: 'course-risk',
    emoji: '🛡️',
    name: '事故らない人',
    desc: 'コース「事故らないAI」を全部クリアした',
    hint: '便利さより先に知っておく話を、ひととおり',
  },
  {
    id: 'course-next',
    emoji: '🚀',
    name: '一歩先',
    desc: 'コース「これからのAI」を全部クリアした',
    hint: '一問一答の、その先まで',
  },
  {
    id: 'quiz-perfect',
    emoji: '💯',
    name: 'ノーミス',
    desc: 'クイズを1問も間違えずにレッスンを修了した',
    hint: '一度も間違えずに終えられるか',
  },
  {
    id: 'quiz-perfect-5',
    emoji: '🎯',
    name: '無傷の5本',
    desc: 'ノーミス修了を5レッスン達成した',
    hint: 'まぐれでない、を証明する回数',
  },
  {
    id: 'streak-3',
    emoji: '🔥',
    name: '三日坊主、返上',
    desc: '3日連続で学習した',
    hint: '続けることでしか取れないものがある',
  },
  {
    id: 'streak-7',
    emoji: '📅',
    name: '一週間皆勤',
    desc: '7日連続で学習した',
    hint: '三日の、その先へ',
  },
  {
    id: 'half',
    emoji: '🏅',
    name: '折り返し',
    desc: '全レッスンの半分を修了した',
    hint: '山の半分まで登ったら',
  },
  {
    id: 'all-clear',
    emoji: '👑',
    name: '全課程修了',
    desc: 'すべてのレッスンを修了した',
    hint: '最後の1本まで、残さず',
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
  emoji: string;
  /** 昇格したときに先生が言うひとこと */
  say: string;
}

/** 上から順に、条件を満たす最上位が現在の称号になる */
export const TITLES: Title[] = [
  { need: 0, emoji: '🐣', name: 'AI見習い', say: 'まあ、そこからだな。' },
  { need: 2, emoji: '📗', name: 'AI研修生', say: '研修生に上げておく。まだ何も覚えてないが。' },
  { need: 4, emoji: '🤝', name: 'AIの相棒', say: '相棒、か。悪くない響きだ。' },
  { need: 6, emoji: '🛠️', name: 'AI使い', say: '道具として使えてる。ここからが面白い。' },
  { need: 9, emoji: '🎓', name: 'AI職人', say: '職人だ。人に教えられる域に入った。' },
  { need: 12, emoji: '🏆', name: 'AI師範', say: '師範。……もう私が教えることは、そう多くない。' },
  { need: 14, emoji: '👑', name: 'AIマスター', say: 'よくやった。ここまで来たやつは、そういない。' },
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
