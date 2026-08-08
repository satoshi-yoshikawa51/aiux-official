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
import { ALL_LESSONS, COURSES, getQuiz, type QuizEntry } from '@/data/courses';
import type { RoleId } from '@/data/types';

const KEY = 'comixai-academy-v1';

/* ============================================================
   ▍復習（間隔をあけて出し直す）

   読んで1問答えて終わり、では**間違えたことに気づいて終わる**だけで、
   直る機会が無い。なので間違えた問題だけを控えておいて、日を置いて
   もう一度出す。

   ▍控えるのは「間違えた問題」だけ
   全問を反復すると、覚えている問題まで毎日出てきて続かない。
   一度も間違えなかった問題は記録すら作らない（＝復習に出てこない）。

   ▍卒業まで3回
   間違える → その場で復習できる（due = いま）
   正解する → 翌日 → 3日後 → 7日後 と間隔が伸び、3回続けて正解で卒業。
   途中で間違えたら連続はゼロに戻る。**日をまたいで3回**なので、
   その場で3連打しても卒業できない。そこが狙い。
   ============================================================ */

/** 何日後に出し直すか。連続正解1回目・2回目・3回目 */
const REVIEW_STEP_DAYS = [1, 3, 7];
/** 連続正解がここに達したら卒業 */
export const REVIEW_GRADUATE = REVIEW_STEP_DAYS.length;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface QuizRecord {
  /** 次に出す時刻(ms)。0＝卒業（もう出さない） */
  due: number;
  /** 連続正解数 */
  streak: number;
  /** 通算のまちがい回数 */
  wrong: number;
}

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
  /** オープニング（AI歴史絵巻）を見終えたか。2回目以降は出さない */
  seenOpening: boolean;
  /** 職種を決めた直後の一幕（相棒が歩いてくる）を見終えたか */
  seenIntro: boolean;
  /** 間違えた問題の記録。キーは QuizItem.id（→ 下の「復習」） */
  quiz: Record<string, QuizRecord>;
  /** 先生によるアプリ案内を見終えた（またはとばした）か */
  seenTutorial: boolean;
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
  seenOpening: false,
  seenIntro: false,
  seenTutorial: false,
  quiz: {},
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
  /** 1問答えたことを記録する。本編のクイズからも復習からも呼ぶ */
  answerQuiz: (quizId: string, correct: boolean) => void;
  markTitleSeen: () => void;
  markOpeningSeen: () => void;
  markIntroSeen: () => void;
  markTutorialSeen: () => void;
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
        if (!alive || !raw) return;
        let loaded: ProgressState;
        try {
          const parsed = JSON.parse(raw) as Partial<ProgressState>;
          loaded = { ...EMPTY, ...parsed };
          /* ▍あとから足した「見たか」の印は、既に始めている人には立てておく
             そうしないと、もう学習が進んでいる人の画面に**いまさら
             入口の演出が割り込む**。職種まで決まっていれば通過済みとみなす */
          if (parsed.seenIntro === undefined && parsed.roleId) loaded.seenIntro = true;
        } catch {
          /* 壊れていたら初期状態で続行する（遊びには支障がない） */
          return;
        }
        /* 起動時にもバッジ判定を回す。
           アップデートでバッジを増やしたとき、条件を満たしている既存ユーザーが
           「次にレッスンを終えるまで貰えない」状態にならないようにするため。 */
        const now = Date.now();
        const badges = { ...loaded.badges };
        let added = false;
        for (const id of evaluateBadges(loaded)) {
          if (!badges[id]) {
            badges[id] = now;
            added = true;
          }
        }
        const next = added ? { ...loaded, badges } : loaded;
        setState(next);
        if (added) AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
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

  /* ▍間違えたときだけ記録を作る
     正解した問題まで控えると、覚えているものが毎日出てきて続かない。
     記録が無い＝一度も間違えていない＝復習に出さない、でよい */
  const answerQuiz = React.useCallback(
    (quizId: string, correct: boolean) => {
      const prev = ref.current.quiz[quizId];
      if (!prev && correct) return;
      const now = Date.now();
      const next: QuizRecord = correct
        ? (() => {
            const streak = (prev?.streak ?? 0) + 1;
            const graduated = streak >= REVIEW_GRADUATE;
            return {
              streak,
              wrong: prev?.wrong ?? 0,
              due: graduated ? 0 : now + REVIEW_STEP_DAYS[streak - 1] * DAY_MS,
            };
          })()
        : { streak: 0, wrong: (prev?.wrong ?? 0) + 1, due: now };
      persist({ ...ref.current, quiz: { ...ref.current.quiz, [quizId]: next } });
    },
    [persist],
  );

  const markTitleSeen = React.useCallback(() => {
    const t = titleFor(Object.keys(ref.current.badges).length);
    persist({ ...ref.current, seenTitle: t.name });
  }, [persist]);

  const markOpeningSeen = React.useCallback(() => {
    if (ref.current.seenOpening) return;
    persist({ ...ref.current, seenOpening: true });
  }, [persist]);

  const markIntroSeen = React.useCallback(() => {
    if (ref.current.seenIntro) return;
    persist({ ...ref.current, seenIntro: true });
  }, [persist]);

  const markTutorialSeen = React.useCallback(() => {
    if (ref.current.seenTutorial) return;
    persist({ ...ref.current, seenTutorial: true });
  }, [persist]);

  /* 記録を消したら**オープニングからやり直す**。
     消す人はアバターも職種も選び直すことになるので、
     途中から始まるより最初から通したほうが筋が通る。
     絵巻を見直したいときの入口にもなる（初回しか出ないので、
     ここを残しておかないと端末のデータを消すしか手が無くなる） */
  const reset = React.useCallback(() => persist({ ...EMPTY }), [persist]);

  const value = React.useMemo<Ctx>(
    () => ({
      state,
      ready,
      setAvatar,
      setRole,
      completeLesson,
      answerQuiz,
      markTitleSeen,
      markOpeningSeen,
      markIntroSeen,
      markTutorialSeen,
      reset,
    }),
    [
      state,
      ready,
      setAvatar,
      setRole,
      completeLesson,
      answerQuiz,
      markTitleSeen,
      markOpeningSeen,
      markIntroSeen,
      markTutorialSeen,
      reset,
    ],
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

/* ———————————————— 復習 ————————————————
   ホームとまなぶタブの導線、復習画面がここを見る */

export interface ReviewSet {
  /** いま出すべき問題（期限が来ているもの）。少ない順に並ぶ */
  due: QuizEntry[];
  /** まだ卒業していない問題ぜんぶ（期限前も含む）。「まとめて解く」用 */
  pending: QuizEntry[];
  /** 卒業した問題の数。積み上がりを見せるのに使う */
  graduated: number;
}

export function useReview(): ReviewSet {
  const { state } = useProgress();
  return React.useMemo(() => {
    const now = Date.now();
    const due: QuizEntry[] = [];
    const pending: QuizEntry[] = [];
    let graduated = 0;
    for (const [id, rec] of Object.entries(state.quiz)) {
      const entry = getQuiz(id);
      /* データから消えた問題の記録は無視する（idを変えたときなど）。
         消さずに残しておくのは、戻したときに履歴が生き返るように */
      if (!entry) continue;
      if (rec.due === 0) {
        graduated += 1;
        continue;
      }
      pending.push(entry);
      if (rec.due <= now) due.push(entry);
    }
    /* 出す順は「間違えた回数が多い順」。いちばん怪しいものから当てる */
    const byWrong = (a: QuizEntry, b: QuizEntry) =>
      (state.quiz[b.item.id]?.wrong ?? 0) - (state.quiz[a.item.id]?.wrong ?? 0);
    due.sort(byWrong);
    pending.sort(byWrong);
    return { due, pending, graduated };
  }, [state.quiz]);
}
