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
import { AVATARS, migrateAvatars, ownsAvatar } from '@/data/avatars';
import {
  DEFAULT_THEME_ID,
  draw,
  DUPE_REFUND,
  GACHA_POOL,
  PITY_AFTER,
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
import { DEMO, DEMO_PRIZE_ID } from '@/lib/demo';
import { setMusicEnabled } from '@/lib/music';
import { setSoundEnabled } from '@/lib/sound';

const KEY = 'comixai-academy-v1';

/** 止めているあいだに返す空の列。毎回 [] を作ると、受け取る側が
    「変わった」と誤解して無駄に描き直す */
const EMPTY_QUEUE: string[] = [];

/* ============================================================
   ▍復習（間隔をあけて出し直す）

   読んで1問答えて終わり、では**間違えたことに気づいて終わる**だけで、
   直る機会が無い。なので間違えた問題だけを控えておいて、日を置いて
   もう一度出す。

   ▍控えるのは「間違えた問題」だけ
   全問を反復すると、覚えている問題まで毎日出てきて続かない。
   一度も間違えなかった問題は記録すら作らない（＝復習に出てこない）。

   ▍1回直したら卒業
   間違えた問題は、次にどこかで正解した時点で卒業（もう出ない）。
   はじめは「日をまたいで3回正解で卒業」の間隔反復だったが、
   直した直後も「直しかけ」が残り続けるのが**壊れているようにしか
   見えない**（実機の指摘）。このアプリの復習は「間違えたままにしない」
   ための場所で、記憶術の教材ではない——わかりやすさを取る。
   ============================================================ */

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
  /** 最後に段が動いた日（'YYYY-MM-DD'）。**同じ日に2段進めない**ための印
      （→ answerQuiz）。古い記録には無い——無ければ進めてよい */
  day?: string;
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
  /** ガチャで増えたアバター。ID -> 引いた時刻(ms)
      （キー名は色違いがあった頃の skins のまま。互換のため変えない） */
  skins: Record<string, number>;
  /** 効果音を鳴らすか。既定はオン（→ lib/sound.ts） */
  soundOn: boolean;
  /** BGMを鳴らすか。既定はオン（→ lib/music.ts）。
      効果音と分けるのは、「音は欲しいが曲はいらない」人が多いため */
  musicOn: boolean;
  /** 先生によるアプリ案内を見終えた（またはとばした）か */
  seenTutorial: boolean;
  /* ▍ガチャの案内（→ components/gacha-coach.tsx）
     1本目を終えてホームに戻ったところで、先生が3Pを渡して1回まわさせる。
     「渡したか」と「案内を見終えたか」を別に持つ——**Pだけ渡して
     まわさずに閉じた人**に、もう一度Pを配ってしまわないため */
  gachaCoinsGiven: boolean;
  seenGachaTutorial: boolean;
  /** 新しいものが出ないまま、続けて何回まわしたか（→ 救済。data/gacha.ts の PITY_AFTER） */
  dryStreak: number;
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
  soundOn: true,
  musicOn: true,
  gachaCoinsGiven: false,
  seenGachaTutorial: false,
  dryStreak: 0,
};

/* ▍体験モードは、まっさらではなく「始まった直後」から出す（→ lib/demo.ts）
   LPのスマホの中は数十秒で閉じられる場所なので、入口の演出3つと案内を
   通させると、ホームに着く前に閉じられる。ガチャPも最初から持たせる
   ——**まわせない台を見せても伝わらない**。
   曲を切ってあるのは、人のページに貼りついた小窓だから（効果音は残す）。 */
const DEMO_STATE: ProgressState = {
  ...EMPTY,
  avatarId: 'ottori',
  roleId: 'sales',
  seenOpening: true,
  seenIntro: true,
  seenTutorial: true,
  gachaCoinsGiven: true,
  seenGachaTutorial: true,
  /* 何回かまわせるだけ持たせる。1回ぶんだけだと、当たった相棒に
     着替える前に台が止まって「品切れの台」に見える */
  coins: 20,
  musicOn: false,
};

/* ———————————————— 日付ユーティリティ ———————————————— */

/** その日を「学習した日」に入れる。連続日数と「今日のぶんは終わり」の元。

    ▍**レッスンとおまけだけが「学習」ではない**
    もとは completeLesson と clearExtra だけが days を刻んでいて、
    アプリが黄色いカセットで自分から促した**復習をやった日ほど
    連続日数が切れる**ねじれがあった（通しプレイの検証で発覚）。
    答えた日・受かった日は、ぜんぶ学習した日。 */
function stampDay<T extends { days: string[] }>(s: T, day: string): T {
  return s.days.includes(day) ? s : { ...s, days: [day, ...s.days].slice(0, 60) };
}

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

  /* 復習。卒業＝間違えたあと、どこかで正解し直した問題 */
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
  /** すでに持っていた（レア度ぶんのPを返した） */
  dupe: boolean;
  /** ダブりで返ってきたP（→ data/gacha.ts の DUPE_REFUND） */
  refund: number;
  /** 救済で出た（新しいものが出ない回が続いたので、未所持から確定で引いた） */
  pity: boolean;
}

interface Ctx {
  state: ProgressState;
  /** AsyncStorageからの読み込みが終わったか */
  ready: boolean;
  /* ============================================================
     ▍**取った瞬間に祝う**ための待ち行列（→ components/badge-unlock.tsx）

     バッジは25種あって、取れる場所もばらばら（レッスンの結果・おまけ・
     ミニゲームの★・復習の卒業・アバターや職種を決めた瞬間）。
     祝う仕掛けを画面ごとに書くと必ず取りこぼすので、**獲得を1本の列に
     集めて、根元に置いた1枚が順番に出す**。

     保存しない（端末に残す意味が無い）。読み込み時のバッジ判定は
     applyBadges を通らないので、**起動しただけで25連発**にはならない。 */
  badgeQueue: string[];
  /** 先頭の1件を出し終えた（→ 次があれば続けて出る） */
  dismissBadge: () => void;
  /** 上がった称号。バッジを出し終えてから昇格の演出に入る
      （→ components/rank-up.tsx。バッジ → 昇格 の順にする） */
  pendingTitle: Title | null;
  dismissTitle: () => void;
  /* ▍ミニゲームのように**別の窓が前に出ている**あいだは出さない
     祝いの画面はModalなので、ミニゲームのModalの下に隠れて、
     見えないまま自動で閉じてしまう。開いているあいだは列を止めて、
     閉じたところで出す。返り値を呼ぶと止めるのをやめる */
  holdBadges: () => () => void;
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
  /** 使う相棒を切り替える。統一ロスター（設定・ガチャのコレクション）から呼ぶ。
      当てていないアバターは無視する */
  setLook: (avatarId: string) => void;
  /** 効果音のオン・オフ */
  setSoundOn: (on: boolean) => void;
  /** BGMのオン・オフ */
  setMusicOn: (on: boolean) => void;
  markTitleSeen: () => void;
  markOpeningSeen: () => void;
  markIntroSeen: () => void;
  markTutorialSeen: () => void;
  /** ガチャの案内をはじめる。**初回だけ3P渡す**（→ components/gacha-coach.tsx） */
  startGachaCoach: () => void;
  /** ガチャの案内を見終えた */
  markGachaCoachSeen: () => void;
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
    /* 体験モードは記録を読まない。人のブラウザに残っている本物の進捗を
       小窓に映してしまわないため（→ lib/demo.ts） */
    if (DEMO) {
      setSoundEnabled(DEMO_STATE.soundOn);
      setMusicEnabled(DEMO_STATE.musicOn);
      setState(DEMO_STATE);
      setReady(true);
      return;
    }
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
        /* ▍IDを変えたアバターを読み替える（→ data/avatars.ts）
           ここで直して**保存し直す**。直したものを持っているだけだと、
           次に何かを保存したときに古いIDへ戻ってしまう */
        const migrated = migrateAvatars(added ? { ...loaded, badges } : loaded, now);
        const next = migrated;
        const changed = added || migrated !== loaded;
        /* 保存してある設定を、鳴らす側の旗に流し込む */
        setSoundEnabled(next.soundOn);
        setMusicEnabled(next.musicOn);
        setState(next);
        if (changed) AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      })
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const persist = React.useCallback((next: ProgressState) => {
    ref.current = next;
    setState(next);
    /* 体験モードは端末に残さない。閉じれば消える（→ lib/demo.ts） */
    if (DEMO) return;
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
      /* 保存に失敗しても、その場の学習は続けられるようにする */
    });
  }, []);

  /* 祝いの待ち行列（→ Ctx のメモ） */
  const [badgeQueue, setBadgeQueue] = React.useState<string[]>([]);
  const [pendingTitle, setPendingTitle] = React.useState<Title | null>(null);
  const [holds, setHolds] = React.useState(0);
  const dismissBadge = React.useCallback(() => setBadgeQueue((q) => q.slice(1)), []);
  const dismissTitle = React.useCallback(() => setPendingTitle(null), []);
  const holdBadges = React.useCallback(() => {
    setHolds((n) => n + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setHolds((n) => Math.max(0, n - 1));
    };
  }, []);

  /* ============================================================
     ▍**バッジも称号もPも、ここ1本にまとめる**

     前は「バッジを立てる」だけがここで、称号の判定とPの加算は
     completeLesson と clearExtra が**それぞれ**持っていた。すると
     ミニゲームの★や復習の卒業で取れたバッジは、その場では立たず
     （＝祝えず・Pも出ず）、次にレッスンを終えたときに黙って増えていた。
     しかもそのとき称号の「前」の値には既に入っているので、
     **昇格の演出ごと素通り**することがあった。

     判定は1か所。返すのは「新しいバッジ・上がった称号・増えたP」。
     呼ぶ側は persist するときにPを足すだけでいい。
     ============================================================ */
  const applyBadges = React.useCallback((base: ProgressState) => {
    const beforeTitle = titleFor(Object.keys(base.badges).length);
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
    const afterTitle = titleFor(Object.keys(badges).length);
    const newTitle = afterTitle.name !== beforeTitle.name ? afterTitle : null;
    /* ガチャP：バッジ+1／称号が上がったら+3（→ data/gacha.ts） */
    const coinsGained = newBadges.length + (newTitle ? 3 : 0);
    if (newBadges.length) setBadgeQueue((q) => [...q, ...newBadges]);
    if (newTitle) setPendingTitle(newTitle);
    return { next: { ...base, badges }, newBadges, newTitle, coinsGained };
  }, []);

  /** 祝ったぶんのPを足して保存する。applyBadges の結果をそのまま渡す */
  const persistWith = React.useCallback(
    (r: { next: ProgressState; coinsGained: number }, extraCoins = 0) =>
      persist({ ...r.next, coins: r.next.coins + r.coinsGained + extraCoins }),
    [persist],
  );

  const setAvatar = React.useCallback(
    (id: string) => {
      persistWith(applyBadges({ ...ref.current, avatarId: id }));
    },
    [applyBadges, persistWith],
  );

  const setRole = React.useCallback(
    (id: RoleId) => {
      persistWith(applyBadges({ ...ref.current, roleId: id }));
    },
    [applyBadges, persistWith],
  );

  const completeLesson = React.useCallback(
    (lessonId: string, perfect: boolean): CompletionResult => {
      const prev = ref.current;
      const day = today();

      const r = applyBadges(
        stampDay(
          {
            ...prev,
            done: { ...prev.done, [lessonId]: prev.done[lessonId] ?? Date.now() },
            perfect: perfect ? { ...prev.perfect, [lessonId]: prev.perfect[lessonId] ?? Date.now() } : prev.perfect,
          },
          day,
        ),
      );
      persistWith(r);
      return { newBadges: r.newBadges, newTitle: r.newTitle, coinsGained: r.coinsGained };
    },
    [applyBadges, persistWith],
  );

  /* ▍間違えたときだけ記録を作る
     正解した問題まで控えると、覚えているものが毎日出てきて続かない。
     記録が無い＝一度も間違えていない＝復習に出さない、でよい */
  const answerQuiz = React.useCallback(
    (quizId: string, correct: boolean) => {
      const prev = ref.current.quiz[quizId];
      if (!prev && correct) return;
      const now = Date.now();
      const day = today();
      /* 正解＝その場で卒業（due: 0）。レッスンの再走や修了試験で
         正解しても同じく卒業する——どの口から直しても「直した」は
         「直した」。streak は記録として数だけ残す */
      const next: QuizRecord = correct
        ? { streak: prev.streak + 1, wrong: prev.wrong, due: 0, day }
        : { streak: 0, wrong: (prev?.wrong ?? 0) + 1, due: now, day };
      /* ▍ここでもバッジ判定を回す（復習の卒業＝review-first / review-10）
         前はレッスンを1本終えるまで判定が走らず、**卒業した瞬間ではなく
         次にレッスンを終えたときに黙って増えていた**。取った瞬間に祝えない
         のはここが原因のひとつ。復習した日は days にも刻む（→ stampDay） */
      persistWith(
        applyBadges(stampDay({ ...ref.current, quiz: { ...ref.current.quiz, [quizId]: next } }, day)),
      );
    },
    [applyBadges, persistWith],
  );

  const recordGame = React.useCallback(
    (lessonId: string, stars: number, misses: number, ms: number) => {
      const prev = ref.current.games[lessonId];
      const better = !prev || stars > prev.stars || (stars === prev.stars && ms > 0 && ms < prev.ms);
      const next: GameRecord = better
        ? { stars, misses, ms, plays: (prev?.plays ?? 0) + 1 }
        : { ...prev, plays: prev.plays + 1 };
      /* ★のバッジ（star-first / star-5 / star-all）も、取った瞬間に */
      persistWith(applyBadges({ ...ref.current, games: { ...ref.current.games, [lessonId]: next } }));
    },
    [applyBadges, persistWith],
  );

  const passExam = React.useCallback(
    (courseId: string) => {
      if (ref.current.exams[courseId]) return;
      /* 初回合格はガチャP +2。バッジが同時に取れたらそのぶんも足す。
         合格しに来ただけの日も「学習した日」（→ stampDay） */
      persistWith(
        applyBadges(
          stampDay({ ...ref.current, exams: { ...ref.current.exams, [courseId]: Date.now() } }, today()),
        ),
        2,
      );
    },
    [applyBadges, persistWith],
  );

  /* ▍おまけのクリア
     報酬Pは**初回だけ**。2回目以降も遊べる（★の自己ベストは
     recordGame が別に持つ）が、Pは出さない。ここを毎回出すと、
     いちばん短いおまけを回し続けるのが最短になってしまう */
  const clearExtra = React.useCallback(
    (prizeId: string): CompletionResult => {
      const prev = ref.current;
      const first = !prev.extras[prizeId];
      /* おまけも「今日やった」に数える。連続日数のためにレッスンを
         1本開かせるのは筋が悪い */
      const r = applyBadges(
        stampDay({ ...prev, extras: { ...prev.extras, [prizeId]: prev.extras[prizeId] ?? Date.now() } }, today()),
      );
      const reward = first ? EXTRA_REWARD[rarityOfPrize(prizeId) ?? 'N'] : 0;
      persistWith(r, reward);
      return { newBadges: r.newBadges, newTitle: r.newTitle, coinsGained: r.coinsGained + reward };
    },
    [applyBadges, persistWith],
  );

  const claimLoginBonus = React.useCallback((): boolean => {
    const day = today();
    if (ref.current.lastBonusDay === day) return false;
    /* 1日3P＝ちょうどガチャ1回ぶん。1Pだと「開いても3日ためないと
       まわせない」で、日々のごほうびとして弱かった（実機の指摘） */
    persist({ ...ref.current, lastBonusDay: day, coins: ref.current.coins + 3 });
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
    /* ▍体験モードは「かんばん」しか出さない（→ lib/demo.ts）
       宣伝で見せている相棒がその場で出ないと話が合わない。Pも減らさない
       ——1回で品切れになる台にすると、まわした人が続きを触れなくなる */
    if (DEMO) {
      const only = GACHA_POOL.find((p) => p.kind === 'avatar' && p.id === DEMO_PRIZE_ID);
      if (only) {
        persist({ ...s, skins: { ...s.skins, [only.id]: Date.now() } });
        return { prize: only, dupe: false, refund: 0, pity: false };
      }
    }
    /* ▍救済（→ data/gacha.ts の PITY_AFTER）
       新しいものが出ない回が続いたら、次は**持っていないものから確定**で引く。
       レア度は見ない——終盤は残りがSRだけになるので、レア度を守ると
       救済がいちばん要るところで効かなくなる。抽選をここでやるのは、
       持ち物（themes / skins）を見る必要があるため */
    const unowned = GACHA_POOL.filter((p) => !(p.kind === 'theme' ? s.themes : s.skins)[p.id]);
    const pity = s.dryStreak >= PITY_AFTER && unowned.length > 0;
    const prize = pity ? unowned[Math.floor(Math.random() * unowned.length)] : draw();
    const pocket = prize.kind === 'theme' ? s.themes : s.skins;
    const dupe = !!pocket[prize.id];
    const refund = dupe ? DUPE_REFUND[prize.rarity] : 0;
    const coins = s.coins - SPIN_COST + refund;
    const nextPocket = dupe ? pocket : { ...pocket, [prize.id]: Date.now() };
    const dryStreak = dupe ? s.dryStreak + 1 : 0;
    persist(
      prize.kind === 'theme'
        ? { ...s, coins, dryStreak, themes: nextPocket }
        : { ...s, coins, dryStreak, skins: nextPocket },
    );
    return { prize, dupe, refund, pity };
  }, [persist]);

  const setTheme = React.useCallback(
    (id: string) => {
      if (id !== DEFAULT_THEME_ID && !ref.current.themes[id]) return;
      persist({ ...ref.current, themeId: id });
    },
    [persist],
  );

  const setLook = React.useCallback(
    (avatarId: string) => {
      /* 当てていないキャラには着替えられない。最初の2人だけ最初から持っている
         （当てたキャラは skins に入る → data/gacha.ts） */
      const base = AVATARS.find((a) => a.id === avatarId);
      if (!base || !ownsAvatar(base, ref.current.skins)) return;
      persistWith(applyBadges({ ...ref.current, avatarId }));
    },
    [applyBadges, persistWith],
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

  /* ▍案内のぶんのPは一度だけ
     ここを「押すたびに+3」にすると、案内を閉じずに何度も押せてしまう */
  const startGachaCoach = React.useCallback(() => {
    if (ref.current.gachaCoinsGiven) return;
    persist({ ...ref.current, gachaCoinsGiven: true, coins: ref.current.coins + SPIN_COST });
  }, [persist]);

  const markGachaCoachSeen = React.useCallback(() => {
    if (ref.current.seenGachaTutorial) return;
    persist({ ...ref.current, seenGachaTutorial: true });
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
      /* 別の窓（ミニゲーム）が前に出ているあいだは、空に見せて止める */
      badgeQueue: holds > 0 ? EMPTY_QUEUE : badgeQueue,
      dismissBadge,
      pendingTitle: holds > 0 ? null : pendingTitle,
      dismissTitle,
      holdBadges,
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
      setLook,
      setSoundOn,
      setMusicOn,
      markTitleSeen,
      markOpeningSeen,
      markIntroSeen,
      markTutorialSeen,
      startGachaCoach,
      markGachaCoachSeen,
      replaceAll,
      reset,
    }),
    [
      state,
      ready,
      badgeQueue,
      dismissBadge,
      pendingTitle,
      dismissTitle,
      holds,
      holdBadges,
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
      setLook,
      setSoundOn,
      setMusicOn,
      markTitleSeen,
      markOpeningSeen,
      markIntroSeen,
      markTutorialSeen,
      startGachaCoach,
      markGachaCoachSeen,
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
  /** まだ直せていない問題。間違えた回数が多い順に並ぶ */
  due: QuizEntry[];
  /** 卒業した問題の数。積み上がりを見せるのに使う */
  graduated: number;
}

export function useReview(): ReviewSet {
  const { state } = useProgress();
  return React.useMemo(() => {
    const due: QuizEntry[] = [];
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
      /* 期限（due の日時）は見ない。3回制のころの記録に未来の期限が
         残っていても、いま直せるものとして全部出す */
      due.push(entry);
    }
    /* 出す順は「間違えた回数が多い順」。いちばん怪しいものから当てる */
    due.sort(
      (a, b) => (state.quiz[b.item.id]?.wrong ?? 0) - (state.quiz[a.item.id]?.wrong ?? 0),
    );
    return { due, graduated };
  }, [state.quiz]);
}
