/* ============================================================
   おまけ（当てた景品についてくる追加コンテンツ）。

   ▍何のためにあるか
   ガチャで当てた舞台やアバターは、飾ったら終わりだった。**当てたものが
   遊べる**ようにして、集める理由をもう一段深くする。称号の条件にも
   入れてあるので、AIマスターになるにはここを通ることになる
   （→ data/badges.ts）。

   ▍当てた景品が、そのまま舞台装置になる
   舞台のおまけは**その舞台の絵の上で**、アバターのおまけは**その相棒が
   出てきて**遊ぶ（→ app/extra/[prizeId].tsx）。絵もモデルももう有るので、
   新しい素材を1枚も足さずに「当てた甲斐」を出せる。

   ▍中身の作り分け
   - **R** … レッスンで使っている5種（仕分け・見つける・組み立て・並べる・
     詰める）にデータを流し込む（→ stages.ts / avatars.ts）
   - **SR** … ここでしか遊べない専用の型を持たせる（→ sr.ts）。
     赤入れ・削る・聞き出す・見比べるの4種

   ▍書くときの決まり
   - 舞台やキャラの雰囲気に**寄せる**。夜のオフィスなら残業、桜なら異動。
     絵とゲームの中身が無関係だと、当てたものである意味が消える
   - でも**学べることは本物**にする。飾りのクイズにしない
   - **アバターのおまけは、そのキャラの口調で書く**（→ data/avatars.ts の
     personality）。舞台のおまけは誰が出るか決まらないので、共通の声で書く
   ============================================================ */
import { GACHA_POOL, type Rarity } from '@/data/gacha';
import type { LessonInteractive } from '@/data/types';

import { STAGE_EXTRAS } from './stages';
import { AVATAR_EXTRAS } from './avatars';
import { SR_EXTRAS } from './sr';

export interface Extra {
  /** 景品ID（THEMES.id か SKINS.id）。これが鍵になる */
  prizeId: string;
  /** 見出し */
  title: string;
  /** 入り口で先生がしゃべること。2〜3コマ */
  say: string[];
  /** このおまけで持って帰ってほしい1行 */
  point: string;
  /** 遊ぶもの */
  game: LessonInteractive;
}

export const EXTRAS: Extra[] = [...STAGE_EXTRAS, ...AVATAR_EXTRAS, ...SR_EXTRAS];

/** レア度ごとの報酬P。クリアの初回だけ入る */
export const EXTRA_REWARD: Record<Rarity, number> = { N: 0, R: 2, SR: 5 };

/* ▍完成したときの本数を定数で持つ

   「殿堂」バッジを `EXTRAS.length` と比べると、**おまけを作っている
   最中に、有るぶんを全部クリアしただけで殿堂が取れてしまう**。
   バッジは一度取ると消えないので、あとから条件を厳しくしても
   取り消せない。だから最終形の本数を先に決めて、そこと比べる。

   いまは **R以上の景品と1対1でそろっている**：
   舞台R7 ＋ 色違いR6 ＋ SR9（舞台3・アバター6）= 22。
   景品を足したら、おまけを1本書いて、ここも増やす。 */
export const EXTRA_TOTAL = 22;

export function getExtra(prizeId: string | null | undefined): Extra | undefined {
  return EXTRAS.find((e) => e.prizeId === prizeId);
}

/** その景品のレア度。おまけの報酬とバッジの判定に使う */
export function rarityOfPrize(prizeId: string): Rarity | null {
  return GACHA_POOL.find((p) => p.id === prizeId)?.rarity ?? null;
}

/** ミニゲームの自己ベストを引く鍵（→ store/progress.tsx の games） */
export const extraGameKey = (prizeId: string) => `extra:${prizeId}`;
