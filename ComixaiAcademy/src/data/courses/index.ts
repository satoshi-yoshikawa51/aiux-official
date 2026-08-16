/* 全コースの束ね役。表示順はこの配列のとおり。 */
import type {
  Course,
  Lesson,
  RoleId,
  LessonCard,
  ByRole,
  ByAvatar,
  AvatarId,
  QuizItem,
  LessonInteractive,
} from '../types';
import { voiceIdOf } from '../types';
import { BASICS } from './basics';
import { WORK } from './work';
import { PROMPT } from './prompt';
import { RISK } from './risk';
import { NEXT } from './next';

export const COURSES: Course[] = [BASICS, WORK, PROMPT, RISK, NEXT];

export const ALL_LESSONS: Lesson[] = COURSES.flatMap((c) => c.lessons);

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getLesson(id: string): { course: Course; lesson: Lesson } | undefined {
  for (const course of COURSES) {
    const lesson = course.lessons.find((l) => l.id === id);
    if (lesson) return { course, lesson };
  }
  return undefined;
}

/** 職種別の値があればそれを、無ければ共通の値を返す */
export function pick<Tvalue>(
  common: Tvalue | undefined,
  byRole: ByRole<Tvalue> | undefined,
  role: RoleId | null,
): Tvalue | undefined {
  if (role && byRole && byRole[role] !== undefined) return byRole[role];
  return common;
}

/** アバター別の値があればそれを、無ければ共通の値を返す */
export function pickAvatar<Tvalue>(
  common: Tvalue | undefined,
  byAvatar: ByAvatar<Tvalue> | undefined,
  avatarId: AvatarId | null,
): Tvalue | undefined {
  /* SR（衣装違い）は元のキャラのセリフを引く（→ data/types.ts の voiceIdOf） */
  const id = voiceIdOf(avatarId);
  if (id && byAvatar && byAvatar[id] !== undefined) return byAvatar[id];
  return common;
}

/** カードの表示内容を、選択中の職種と相棒にあわせて解決する。

    ▍セリフは「相棒 → 職種 → 共通」の順で見る
    フキダシは**誰がしゃべっているか**が先に立つので、相棒別があれば勝つ。
    職種別（sayByRole）は「あなたの仕事は〜」と相手の仕事に触れる回で
    使っているものなので、そういう回に相棒別を書くときは、
    **仕事に触れない言い回しにするか、書かずに職種別へ譲る**こと。 */
export function resolveCard(card: LessonCard, role: RoleId | null, avatarId: AvatarId | null = null) {
  return {
    say: pickAvatar(undefined, card.sayByAvatar, avatarId) ?? pick(card.say, card.sayByRole, role) ?? card.say,
    motion: card.motion,
    emote: card.emote,
    heading: card.heading,
    body: pick(card.body, card.bodyByRole, role),
    prompt: pick(card.prompt, card.promptByRole, role),
    bullets: pick(card.bullets, card.bulletsByRole, role),
    /* 体験は職種で変えない。全職種共通の道具として出す */
    interactive: card.interactive,
  };
}

/* ———————————————— 問題の索引 ————————————————
   復習は「レッスンの外」で問題を出すので、idから1問を引ける必要がある
   （→ app/review.tsx）。ここで一度だけ作って使い回す。

   **idの重複はここで落とす。** 重複すると復習の記録が混ざり、
   直したはずの問題が別の問題として戻ってくる。データを足したときに
   気づけるよう、黙って通さない。 */
export interface QuizEntry {
  item: QuizItem;
  lesson: Lesson;
  course: Course;
}

export const ALL_QUIZ: QuizEntry[] = (() => {
  const out: QuizEntry[] = [];
  const seen = new Set<string>();
  for (const course of COURSES) {
    for (const lesson of course.lessons) {
      for (const item of lesson.quiz) {
        if (seen.has(item.id)) {
          throw new Error(`クイズのidが重複しています: ${item.id}（${lesson.id}）`);
        }
        seen.add(item.id);
        out.push({ item, lesson, course });
      }
    }
  }
  return out;
})();

const QUIZ_BY_ID = new Map(ALL_QUIZ.map((e) => [e.item.id, e]));

export function getQuiz(id: string): QuizEntry | undefined {
  return QUIZ_BY_ID.get(id);
}

/* ———————————————— 「あなたの現場だと」 ————————————————
   職種を選ばせておきながら、書き分けは78カード中16か所しかなかった。
   全レッスンの最後に1枚、その職種の話を足す。

   **カードの配列そのものには混ぜない。** レッスンごとに枚数が変わると
   進み具合の点の数が揺れるうえ、既存のカードのどこに挟むかで
   本文の流れが崩れる。読み終わりに1枚足すのがいちばん素直。

   「あてはまらない」を選んだ人には roleNote が無いので、何も足さない。 */
export function lessonCards(lesson: Lesson, role: RoleId | null): LessonCard[] {
  const note = role ? lesson.roleNote?.[role] : undefined;
  if (!note) return lesson.cards;
  return [
    ...lesson.cards,
    {
      /* セリフは職種に触れない。触れると roleNote と同じことを二度言う */
      say: 'ここまでは全員に同じ話をした。あなたの現場だと、こうなる。',
      motion: 'explain',
      emote: 'compass',
      heading: 'あなたの現場だと',
      body: note,
    },
  ];
}

/* ———————————————— ★の付くゲームを持つレッスン ————————————————
   合否の無いもの（トークナイザー）と、収まるまで押せないもの
   （トークン収め）には★が付かない。バッジの「全部★3」を数えるとき、
   そこを分母に入れると**永久に達成できない条件**になる。

   mini-game.tsx の hasStars もここを見る（判定を2か所に置かない）。 */
export const SCORED_KINDS: LessonInteractive['kind'][] = [
  'sort',
  'find',
  'build',
  'order',
  'fit',
  'redline',
  'trim',
  'interview',
  'judge',
  'ai-prompt',
];

/* ———————————————— ゲームの成績を引く鍵 ————————————————
   もとは「1レッスン1ゲーム」の前提でレッスンIDを鍵にしていたが、
   prompt-3 / risk-1 / next-2 は★付きゲームが**2つ**ある（build等＋ai-prompt）。
   同じ鍵に相乗りすると、片方を遊んだだけでもう片方の入口が
   「もう一度あそぶ」になる（実機で指摘）。

   鍵は、1つだけの回はレッスンIDのまま（既存の記録を生かす）、
   2つある回だけ `レッスンID:種類` で分ける。
   **同じ種類のゲームを1レッスンに2つ置かないこと**（鍵が衝突する）。 */
export function gameKeyOf(lesson: Lesson, interactive: LessonInteractive): string {
  const scored = lesson.cards.filter(
    (c) => c.interactive && SCORED_KINDS.includes(c.interactive.kind),
  );
  return scored.length > 1 ? `${lesson.id}:${interactive.kind}` : lesson.id;
}

/** ★の付く全ゲームの鍵。バッジ「全★3」とエンディングの分母 */
export const SCORED_GAME_KEYS: string[] = ALL_LESSONS.flatMap((l) =>
  l.cards
    .filter((c) => c.interactive && SCORED_KINDS.includes(c.interactive.kind))
    .map((c) => gameKeyOf(l, c.interactive!)),
);
