/* 全コースの束ね役。表示順はこの配列のとおり。 */
import type { Course, Lesson, RoleId, LessonCard, ByRole } from '../types';
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

/** カードの表示内容を、選択中の職種にあわせて解決する */
export function resolveCard(card: LessonCard, role: RoleId | null) {
  return {
    say: pick(card.say, card.sayByRole, role) ?? card.say,
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
