/* ============================================================
   確認用の記録。**全部クリア・全部そろった状態**を作る。

   ▍なぜ要るのか
   舞台やおまけを足すたびに、それを見るために本編を17本やり直して
   ガチャを何十回も回す……のは無理がある。1タップでその状態にできれば、
   **足した当日に実機で見られる**。

   ▍中身は台帳から作る
   IDを手で並べない。レッスンもクイズも景品もおまけも、データ側の一覧から
   組み立てる。**足したものが自動で入る**ので、この仕組み自体は増やした
   あとも直さなくていい。

   ▍出口は2つ
   - せっていの「確認用」から、その場で当てはめる
   - 同じものを文字列として書き出して、別の端末に貼る（記録の持ち出しと同じ形）

   公開前に、せっていの入口ごと外すこと（→ app/(tabs)/settings.tsx）。
   ============================================================ */
import { DEFAULT_AVATAR_ID, DEFAULT_SKIN_ID, SKINS } from '@/data/avatars';
import { ALL_LESSONS, ALL_QUIZ, COURSES, SCORED_GAME_KEYS } from '@/data/courses';
import { EXTRAS, extraGameKey } from '@/data/extras';
import { DEFAULT_THEME_ID, THEMES } from '@/data/gacha';
import { encodeSave } from '@/lib/save';
import { EMPTY, evaluateBadges, today, type ProgressState } from '@/store/progress';

/** 連続日数のバッジ（3日・7日）が立つように、直近の日を埋める */
function recentDays(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(today(d));
  }
  return out;
}

/** 全部クリア・全部そろった状態。バッジは判定を通して立てる */
export function fullSave(now = Date.now()): ProgressState {
  const stamp = <T extends string>(ids: T[]): Record<string, number> =>
    Object.fromEntries(ids.map((id) => [id, now]));

  const base: ProgressState = {
    ...EMPTY,
    avatarId: DEFAULT_AVATAR_ID,
    roleId: 'creator',
    seenOpening: true,
    seenIntro: true,
    seenTutorial: true,
    /* 本編は全部クリア、しかもノーミス */
    done: stamp(ALL_LESSONS.map((l) => l.id)),
    perfect: stamp(ALL_LESSONS.map((l) => l.id)),
    days: recentDays(8),
    /* 復習は全部卒業（due 0 ＝ もう出さない） */
    quiz: Object.fromEntries(
      ALL_QUIZ.map((q) => [q.item.id, { due: 0, streak: 3, wrong: 1 }]),
    ),
    /* ミニゲームは本編もおまけも★3 */
    games: Object.fromEntries(
      [...SCORED_GAME_KEYS, ...EXTRAS.map((e) => extraGameKey(e.prizeId))].map((k) => [
        k,
        { stars: 3, misses: 0, ms: 12000, plays: 1 },
      ]),
    ),
    exams: stamp(COURSES.map((c) => c.id)),
    /* おまけは、いま作ってあるぶんを全部クリア済みに */
    extras: stamp(EXTRAS.map((e) => e.prizeId)),
    coins: 99,
    lastBonusDay: '',
    themes: stamp(THEMES.filter((t) => t.id !== DEFAULT_THEME_ID).map((t) => t.id)),
    themeId: DEFAULT_THEME_ID,
    skins: stamp(SKINS.map((s) => s.id)),
    skinId: DEFAULT_SKIN_ID,
  };

  /* バッジは条件から立てる。ここで手打ちすると、増やしたとき必ずズレる */
  return { ...base, badges: stamp(evaluateBadges(base)) };
}

/** 同じものを、記録の持ち出しと同じ文字列にして返す */
export function fullSaveText(now = Date.now()): string {
  return encodeSave(fullSave(now), now);
}
