/* ============================================================
   進捗ストア。

   端末のAsyncStorageにだけ保存する（サーバー・アカウント不要）。
   Webサイトの図鑑（localStorage）と同じ方針で、アンインストールすれば
   消えるし、端末をまたぐ同期もしない。

   バッジの判定は evaluateBadges() に全部集約してある。
   バッジを増やすときは src/data/badges.ts に台帳を足して、
   ここに条件を1行足すだけで済むようにしてある。
   ============================================================ */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

import { BADGES, titleFor, type Title } from '@/data/badges';
import { ALL_LESSONS, COURSES } from '@/data/courses';
import type { RoleId } from '@/data/types';

const KEY = 'comixai-academy-v1';

export interface ProgressState {
  version: 1;
  avatarId: string | null;
  roleId: RoleId | null;
  /** レッスンID -> 修了時刻(ms) */
  done: Record<string, number>;
  /** 1問も間違えずに修了したレッスンID -> 時刻(ms) */
  perfect: Record<string, number>;
  /** バッジID -> 獲得時刻(ms) */
  badges: Record<string, number>;
  /** 学習した日（'YYYY-MM-DD'）。新しい順、最大60件 */
  days: string[];
  /** 昇格演出を出し終えた称号名 */
  seenTitle: string;
}

const EMPTY: ProgressState = {
  version: 1,
  avatarId: null,
  roleId: null,
  done: {},
  perfect: {},
  badges: {},
  days: [],
  seenTitle: '',
};

/* ———————————————— 日付ユーティリティ ———————————————— */

export function today(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return today(d);
}

/** 今日（または昨日）から途切れずに続いている日数 */
export function streakOf(days: string[]): number {
  const set = new Set(days);
  // 今日まだ学習していなくても、昨日まで続いていれば連続は生きている扱い
  let offset = set.has(daysAgo(0)) ? 0 : set.has(daysAgo(1)) ? 1 : -1;
  if (offset < 0) return 0;
  let n = 0;
  while (set.has(daysAgo(offset))) {
    n += 1;
    offset += 1;
  }
  return n;
}

/* ———————————————— バッジ判定 ———————————————— */

/** 現時点で満たしているバッジIDの一覧 */
export function evaluateBadges(s: ProgressState): string[] {
  const doneCount = Object.keys(s.done).length;
  const perfectCount = Object.keys(s.perfect).length;
  const streak = streakOf(s.days);
  const courseCleared = (courseId: string) => {
    const course = COURSES.find((c) => c.id === courseId);
    return !!course && course.lessons.every((l) => s.done[l.id]);
  };

  const earned: string[] = [];
  const add = (id: string, ok: boolean) => {
    if (ok) earned.push(id);
  };

  add('avatar-set', !!s.avatarId);
  add('role-set', !!s.roleId);
  add('first-lesson', doneCount >= 1);
  for (const course of COURSES) add(course.badgeId, courseCleared(course.id));
  add('quiz-perfect', perfectCount >= 1);
  add('quiz-perfect-5', perfectCount >= 5);
  add('streak-3', streak >= 3);
  add('streak-7', streak >= 7);
  add('half', doneCount >= Math.ceil(ALL_LESSONS.length / 2));
  add('all-clear', doneCount >= ALL_LESSONS.length);

  // 台帳に無いIDが紛れていないかの保険（開発中のtypo対策）
  const known = new Set(BADGES.map((b) => b.id));
  return earned.filter((id) => known.has(id));
}

/* ———————————————— コンテキスト ———————————————— */

export interface CompletionResult {
  /** このレッスンで新しく獲得したバッジID */
  newBadges: string[];
  /** 称号が上がったなら、その称号 */
  newTitle: Title | null;
}

interface Ctx {
  state: ProgressState;
  /** AsyncStorageからの読み込みが終わったか */
  ready: boolean;
  setAvatar: (id: string) => void;
  setRole: (id: RoleId) => void;
  completeLesson: (lessonId: string, perfect: boolean) => CompletionResult;
  markTitleSeen: () => void;
  reset: () => void;
}

const ProgressContext = React.createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ProgressState>(EMPTY);
  const [ready, setReady] = React.useState(false);
  // 保存は最新のstateを参照したいので、ref経由で同期的に持っておく
  const ref = React.useRef(state);
  ref.current = state;

  React.useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          try {
            setState({ ...EMPTY, ...(JSON.parse(raw) as ProgressState) });
          } catch {
            /* 壊れていたら初期状態で続行する（遊びには支障がない） */
          }
        }
      })
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const persist = React.useCallback((next: ProgressState) => {
    ref.current = next;
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
      /* 保存に失敗しても、その場の学習は続けられるようにする */
    });
  }, []);

  /** バッジ判定を回して、新しく獲得したものを反映する */
  const applyBadges = React.useCallback((base: ProgressState) => {
    const earned = evaluateBadges(base);
    const badges = { ...base.badges };
    const newBadges: string[] = [];
    const now = Date.now();
    for (const id of earned) {
      if (!badges[id]) {
        badges[id] = now;
        newBadges.push(id);
      }
    }
    return { next: { ...base, badges }, newBadges };
  }, []);

  const setAvatar = React.useCallback(
    (id: string) => {
      const { next } = applyBadges({ ...ref.current, avatarId: id });
      persist(next);
    },
    [applyBadges, persist],
  );

  const setRole = React.useCallback(
    (id: RoleId) => {
      const { next } = applyBadges({ ...ref.current, roleId: id });
      persist(next);
    },
    [applyBadges, persist],
  );

  const completeLesson = React.useCallback(
    (lessonId: string, perfect: boolean): CompletionResult => {
      const prev = ref.current;
      const beforeTitle = titleFor(Object.keys(prev.badges).length);
      const day = today();

      const base: ProgressState = {
        ...prev,
        done: { ...prev.done, [lessonId]: prev.done[lessonId] ?? Date.now() },
        perfect: perfect ? { ...prev.perfect, [lessonId]: prev.perfect[lessonId] ?? Date.now() } : prev.perfect,
        days: prev.days.includes(day) ? prev.days : [day, ...prev.days].slice(0, 60),
      };

      const { next, newBadges } = applyBadges(base);
      persist(next);

      const afterTitle = titleFor(Object.keys(next.badges).length);
      return {
        newBadges,
        newTitle: afterTitle.name !== beforeTitle.name ? afterTitle : null,
      };
    },
    [applyBadges, persist],
  );

  const markTitleSeen = React.useCallback(() => {
    const t = titleFor(Object.keys(ref.current.badges).length);
    persist({ ...ref.current, seenTitle: t.name });
  }, [persist]);

  const reset = React.useCallback(() => persist({ ...EMPTY }), [persist]);

  const value = React.useMemo<Ctx>(
    () => ({ state, ready, setAvatar, setRole, completeLesson, markTitleSeen, reset }),
    [state, ready, setAvatar, setRole, completeLesson, markTitleSeen, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = React.useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress は ProgressProvider の中で使うこと');
  return ctx;
}

/* ———————————————— 画面から使う派生値 ———————————————— */

export function useStats() {
  const { state } = useProgress();
  const doneCount = Object.keys(state.done).length;
  const badgeCount = Object.keys(state.badges).length;
  return {
    doneCount,
    total: ALL_LESSONS.length,
    badgeCount,
    badgeTotal: BADGES.length,
    streak: streakOf(state.days),
    title: titleFor(badgeCount),
    percent: ALL_LESSONS.length ? Math.round((doneCount / ALL_LESSONS.length) * 100) : 0,
  };
}
