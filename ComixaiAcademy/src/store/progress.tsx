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

import { BADGES, TITLES, titleFor, type Title } from '@/data/badges';
import { DEFAULT_SKIN_ID } from '@/data/avatars';
import {
  DEFAULT_THEME_ID,
  draw,
  DUPE_REFUND,
  SPIN_COST,
  type GachaPrize,
} from '@/data/gacha';
import { EXTRA_REWARD, EXTRA_TOTAL, rarityOfPrize } from '@/data/extras';
import {
  ALL_LESSONS,
  COURSES,
  getQuiz,
  SCORED_GAME_KEYS,
  type QuizEntry,
} from '@/data/courses';
import type { RoleId } from '@/data/types';
import { setMusicEnabled } from '@/lib/music';
import { setSoundEnabled } from '@/lib/sound';

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

/* ▍ゲームの自己ベスト

   通ったかどうかしか残していなかったので、2回目に遊んでも前より
   良くなったのか分からなかった。「もう一度あそぶ」ボタンはあるのに、
   もう一度やる理由が無い状態。★とタイムを残して、それを作る。

   **同点は更新にしない。** 毎回「更新」が出ると、その言葉が軽くなる。 */
export interface GameRecord {
  /** いちばん良かった★（1〜3） */
  stars: number;
  /** そのときのミス数 */
  misses: number;
  /** そのときのタイム(ms)。0＝測っていない */
  ms: number;
  /** 遊んだ回数 */
  plays: number;
}

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
  /** ミニゲームの自己ベスト。キーは レッスンID（1レッスン1ゲーム） */
  games: Record<string, GameRecord>;
  /** コースの修了試験に合格した時刻(ms)。キーはコースID（→ app/exam/[courseId].tsx） */
  exams: Record<string, number>;
  /** おまけをクリアした時刻(ms)。キーは景品ID（→ data/extras/、app/extra/[prizeId].tsx） */
  extras: Record<string, number>;
  /** ガチャP。学習の節目でだけ貯まる（→ data/gacha.ts） */
  coins: number;
  /** ログインボーナスを最後に受け取った日（'YYYY-MM-DD'） */
  lastBonusDay: string;
  /** シェアのお礼Pを最後に受け取った日（'YYYY-MM-DD'）。→ lib/share.ts */
  lastShareDay: string;
  /** 通算のシェア回数。初回だけ多めに配るために持つ */
  shareCount: number;
  /** 持っている舞台テーマ。テーマID -> 引いた時刻(ms) */
  themes: Record<string, number>;
  /** いまホームに装備している舞台テーマ */
  themeId: string;
  /** 持っている色違いアバター。ID -> 引いた時刻(ms)
      （キー名は互換のため skins のまま。中身は「増えたアバター」） */
  skins: Record<string, number>;
  /** いま使っている色違い。'' ＝ ノーマル */
  skinId: string;
  /** 効果音を鳴らすか。既定はオン（→ lib/sound.ts） */
  soundOn: boolean;
  /** BGMを鳴らすか。既定はオン（→ lib/music.ts）。
      効果音と分けるのは、「音は欲しいが曲はいらない」人が多いため */
  musicOn: boolean;
  /** 先生によるアプリ案内を見終えた（またはとばした）か */
  seenTutorial: boolean;
}

/** まっさらな状態。読み込んだ記録の穴埋めにも使う（→ lib/save.ts） */
export const EMPTY: ProgressState = {
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
  games: {},
  exams: {},
  extras: {},
  coins: 0,
  lastBonusDay: '',
  lastShareDay: '',
  shareCount: 0,
  themes: {},
  themeId: DEFAULT_THEME_ID,
  skins: {},
  skinId: DEFAULT_SKIN_ID,
  soundOn: true,
  musicOn: true,
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
  /* ▍「半分」ではなく固定の10本
     レッスンを増やす予定があるので、総数に連動する条件だと
     あとから足すたびにゴールが動く（実機で指摘）。10本で固定 */
  add('half', doneCount >= 10);
  add('all-clear', doneCount >= ALL_LESSONS.length);

  /* ★（ミニゲームの成績）。★の付かないゲームは分母に入れない
     （入れると「全★3」が永久に達成できない条件になる） */
  const star3 = SCORED_GAME_KEYS.filter((id) => (s.games[id]?.stars ?? 0) >= 3).length;
  add('star-first', star3 >= 1);
  add('star-5', star3 >= 5);
  add('star-all', star3 >= SCORED_GAME_KEYS.length);

  /* 復習。卒業＝日をまたいで3回続けて正解した問題 */
  const graduated = Object.values(s.quiz).filter((r) => r.due === 0).length;
  add('review-first', graduated >= 1);
  add('review-10', graduated >= 10);

  /* おまけ（当てた景品についてくる追加コンテンツ）。
     `extra-5` と `extra-sr` の2枚がAIマスターの門になっている
     （→ data/badges.ts のコメント） */
  const extras = Object.keys(s.extras);
  add('extra-first', extras.length >= 1);
  add('extra-3', extras.length >= 3);
  add('extra-5', extras.length >= 5);
  add('extra-sr', extras.some((id) => rarityOfPrize(id) === 'SR'));
  /* 殿堂は**作り終えたときの本数**と比べる。EXTRAS.length と比べると、
     SRのおまけを作っている最中に9本で取れてしまう（→ data/extras/） */
  add('extra-all', extras.length >= EXTRA_TOTAL);

  add('perfect-all', perfectCount >= ALL_LESSONS.length);

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
  /** この修了で増えたガチャP（バッジ+1／称号+3） */
  coinsGained: number;
}

/** ガチャを1回まわした結果 */
export interface SpinResult {
  prize: GachaPrize;
  /** すでに持っていた（DUPE_REFUND を返した） */
  dupe: boolean;
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
  /** ミニゲームを通したことを記録する。★が伸びたときだけ中身を書き換える */
  recordGame: (lessonId: string, stars: number, misses: number, ms: number) => void;
  /** コースの修了試験に合格したことを記録する（2回目以降の合格では上書きしない）。
      初回合格はガチャP +2 */
  passExam: (courseId: string) => void;
  /** 当てた景品のおまけをクリアしたことを記録する（→ data/extras/）。
      初回だけレア度ぶんのP（R+2／SR+5）が入り、バッジと称号も判定する */
  clearExtra: (prizeId: string) => CompletionResult;
  /** ログインボーナス。今日まだなら +1P して true を返す（ホームが1日1回呼ぶ） */
  claimLoginBonus: () => boolean;
  /** シェアのお礼。今日まだなら +1P（初回だけ +3P）。もらえなければ 0 を返す */
  claimShareBonus: () => number;
  /** ガチャを1回まわす。Pが足りなければ null */
  spinGacha: () => SpinResult | null;
  /** 舞台テーマを装備する（持っていないものは無視） */
  setTheme: (id: string) => void;
  /** 持っていない舞台も試しに飾る（確認用 → app/stages.tsx）。
      持ち物は増やさないので、コレクションの数もガチャの引きどころも変わらない */
  previewTheme: (id: string) => void;
  /** 色違いを使う。'' でノーマルに戻す（持っていないものは無視） */
  setSkin: (id: string) => void;
  /** アバターを丸ごと切り替える（キャラ＋色違いを一度に）。
      統一ロスター（設定・ガチャのコレクション）からはこれを呼ぶ */
  setLook: (avatarId: string, skinId: string) => void;
  /** 効果音のオン・オフ */
  setSoundOn: (on: boolean) => void;
  /** BGMのオン・オフ */
  setMusicOn: (on: boolean) => void;
  markTitleSeen: () => void;
  markOpeningSeen: () => void;
  markIntroSeen: () => void;
  markTutorialSeen: () => void;
  /** 書き出しておいた記録で丸ごと置き換える（→ lib/save.ts）。
      いまの記録は消えるので、呼ぶ前に画面で確認を取ること */
  replaceAll: (next: ProgressState) => void;
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
          /* ▍ガチャPは、これまでの積み上げぶんを遡って配る
             あとから入れた仕組みなので、既存ユーザーのバッジと称号が
             0P扱いだと「今まで損してた」になる。初回だけ換算して持たせる */
          if (parsed.coins === undefined) {
            const badgeCount = Object.keys(loaded.badges).length;
            const titleIndex = Math.max(
              0,
              TITLES.findIndex((t) => t.name === titleFor(badgeCount).name),
            );
            loaded.coins = badgeCount + titleIndex * 3;
          }
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
        /* 保存してある設定を、鳴らす側の旗に流し込む */
        setSoundEnabled(next.soundOn);
        setMusicEnabled(next.musicOn);
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

      const afterTitle = titleFor(Object.keys(next.badges).length);
      const newTitle = afterTitle.name !== beforeTitle.name ? afterTitle : null;
      /* ガチャP：バッジ+1／称号が上がったら+3（→ data/gacha.ts） */
      const coinsGained = newBadges.length + (newTitle ? 3 : 0);
      persist({ ...next, coins: next.coins + coinsGained });

      return { newBadges, newTitle, coinsGained };
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

  const recordGame = React.useCallback(
    (lessonId: string, stars: number, misses: number, ms: number) => {
      const prev = ref.current.games[lessonId];
      const better = !prev || stars > prev.stars || (stars === prev.stars && ms > 0 && ms < prev.ms);
      const next: GameRecord = better
        ? { stars, misses, ms, plays: (prev?.plays ?? 0) + 1 }
        : { ...prev, plays: prev.plays + 1 };
      persist({ ...ref.current, games: { ...ref.current.games, [lessonId]: next } });
    },
    [persist],
  );

  const passExam = React.useCallback(
    (courseId: string) => {
      if (ref.current.exams[courseId]) return;
      persist({
        ...ref.current,
        exams: { ...ref.current.exams, [courseId]: Date.now() },
        /* 初回合格はガチャP +2 */
        coins: ref.current.coins + 2,
      });
    },
    [persist],
  );

  /* ▍おまけのクリア
     報酬Pは**初回だけ**。2回目以降も遊べる（★の自己ベストは
     recordGame が別に持つ）が、Pは出さない。ここを毎回出すと、
     いちばん短いおまけを回し続けるのが最短になってしまう */
  const clearExtra = React.useCallback(
    (prizeId: string): CompletionResult => {
      const prev = ref.current;
      const beforeTitle = titleFor(Object.keys(prev.badges).length);
      const first = !prev.extras[prizeId];
      const base: ProgressState = {
        ...prev,
        extras: { ...prev.extras, [prizeId]: prev.extras[prizeId] ?? Date.now() },
        /* おまけも「今日やった」に数える。連続日数のためにレッスンを
           1本開かせるのは筋が悪い */
        days: prev.days.includes(today()) ? prev.days : [today(), ...prev.days].slice(0, 60),
      };
      const { next, newBadges } = applyBadges(base);
      const afterTitle = titleFor(Object.keys(next.badges).length);
      const newTitle = afterTitle.name !== beforeTitle.name ? afterTitle : null;
      const reward = first ? EXTRA_REWARD[rarityOfPrize(prizeId) ?? 'N'] : 0;
      const coinsGained = reward + newBadges.length + (newTitle ? 3 : 0);
      persist({ ...next, coins: next.coins + coinsGained });
      return { newBadges, newTitle, coinsGained };
    },
    [applyBadges, persist],
  );

  const claimLoginBonus = React.useCallback((): boolean => {
    const day = today();
    if (ref.current.lastBonusDay === day) return false;
    persist({ ...ref.current, lastBonusDay: day, coins: ref.current.coins + 1 });
    return true;
  }, [persist]);

  /* ▍シェアしたかどうかは検証できない（→ lib/share.ts）
     なので**不正しても壊れない額**にする。1日1回+1Pはログインボーナスと
     同額で、まわせる回数はほとんど変わらない。初回だけ+3Pにしてあるのは、
     一度やってもらえれば拡散の役目は果たすため */
  const claimShareBonus = React.useCallback((): number => {
    const day = today();
    if (ref.current.lastShareDay === day) return 0;
    const gain = ref.current.shareCount === 0 ? 3 : 1;
    persist({
      ...ref.current,
      lastShareDay: day,
      shareCount: ref.current.shareCount + 1,
      coins: ref.current.coins + gain,
    });
    return gain;
  }, [persist]);

  const spinGacha = React.useCallback((): SpinResult | null => {
    const s = ref.current;
    if (s.coins < SPIN_COST) return null;
    const prize = draw();
    const pocket = prize.kind === 'theme' ? s.themes : s.skins;
    const dupe = !!pocket[prize.id];
    const coins = s.coins - SPIN_COST + (dupe ? DUPE_REFUND : 0);
    const nextPocket = dupe ? pocket : { ...pocket, [prize.id]: Date.now() };
    persist(
      prize.kind === 'theme'
        ? { ...s, coins, themes: nextPocket }
        : { ...s, coins, skins: nextPocket },
    );
    return { prize, dupe };
  }, [persist]);

  const setTheme = React.useCallback(
    (id: string) => {
      if (id !== DEFAULT_THEME_ID && !ref.current.themes[id]) return;
      persist({ ...ref.current, themeId: id });
    },
    [persist],
  );

  /* 持ち物の確認を通さない版。作った舞台の絵を実機で見るためだけにある */
  const previewTheme = React.useCallback(
    (id: string) => persist({ ...ref.current, themeId: id }),
    [persist],
  );

  const setSkin = React.useCallback(
    (id: string) => {
      if (id !== DEFAULT_SKIN_ID && !ref.current.skins[id]) return;
      persist({ ...ref.current, skinId: id });
    },
    [persist],
  );

  const setLook = React.useCallback(
    (avatarId: string, skinId: string) => {
      if (skinId !== DEFAULT_SKIN_ID && !ref.current.skins[skinId]) return;
      const { next } = applyBadges({ ...ref.current, avatarId, skinId });
      persist(next);
    },
    [applyBadges, persist],
  );

  /* ▍鳴らす側は毎回ストアを見ない
     playSound はボタンの中から呼ばれるので、Contextを引かせたくない。
     設定が変わったときにだけ、モジュール側の旗を書き換える */
  const setSoundOn = React.useCallback(
    (on: boolean) => {
      setSoundEnabled(on);
      persist({ ...ref.current, soundOn: on });
    },
    [persist],
  );

  const setMusicOn = React.useCallback(
    (on: boolean) => {
      setMusicEnabled(on);
      persist({ ...ref.current, musicOn: on });
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

  /* ▍読み込んだ記録で置き換える
     中身の検査は lib/save.ts が済ませてある前提。ここでは
     **音の旗を流し込むのを忘れない**（起動時の読み込みと同じ扱い。
     設定だけ前の端末のまま残ると、切ったはずのBGMが鳴り出す） */
  const replaceAll = React.useCallback(
    (next: ProgressState) => {
      setSoundEnabled(next.soundOn);
      setMusicEnabled(next.musicOn);
      persist(next);
    },
    [persist],
  );

  const value = React.useMemo<Ctx>(
    () => ({
      state,
      ready,
      setAvatar,
      setRole,
      completeLesson,
      answerQuiz,
      recordGame,
      passExam,
      clearExtra,
      claimLoginBonus,
      claimShareBonus,
      spinGacha,
      setTheme,
      previewTheme,
      setSkin,
      setLook,
      setSoundOn,
      setMusicOn,
      markTitleSeen,
      markOpeningSeen,
      markIntroSeen,
      markTutorialSeen,
      replaceAll,
      reset,
    }),
    [
      state,
      ready,
      setAvatar,
      setRole,
      completeLesson,
      answerQuiz,
      recordGame,
      passExam,
      clearExtra,
      claimLoginBonus,
      claimShareBonus,
      spinGacha,
      setTheme,
      previewTheme,
      setSkin,
      setLook,
      setSoundOn,
      setMusicOn,
      markTitleSeen,
      markOpeningSeen,
      markIntroSeen,
      markTutorialSeen,
      replaceAll,
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

/* ▍今日やったか
   「1日1本で十分だ」と先生が言うのに、今日やったかどうかの表示も、
   今日ぶんを終えた締めも無かった。連続日数だけが裏で数えられていて、
   **1日という単位がアプリのどこにも無い**状態だった。 */
export function useToday(): { doneToday: boolean } {
  const { state } = useProgress();
  return { doneToday: state.days.includes(today()) };
}

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
