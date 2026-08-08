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
} from '../types';
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
  if (avatarId && byAvatar && byAvatar[avatarId] !== undefined) return byAvatar[avatarId];
  return common;
}

/** カードの表示内容を、選択中の職種と相棒にあわせて解決する。

    ▍セリフは「相棒 → 職種 → 共通」の順で見る
    フキダシは**誰がしゃべっているか**が先に立つので、相棒別があれば勝つ。
    職種別（sayByRole）は「あんたの仕事は〜」と相手の仕事に触れる回で
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
