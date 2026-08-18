/* ============================================================
   バッジの絵。**絵があれば絵、無ければアイコン**を出すだけの部品。

   ▍1か所にまとめる理由
   バッジは「バッジ」タブと「レッスンの結果」の2か所に出る。絵の有無で
   出し分ける判断を両方に書くと、片方だけ絵になって食い違う。実際、称号の
   セリフで同じ取りこぼしをやっている（→ data/types.ts の voiceIdOf のメモ）。

   ▍絵とアイコンで大きさを変える
   アイコンは線画なので28ptでも読めるが、**勲章の絵は28ptだと潰れる**
   （月桂樹も帯も、何が描いてあるか分からない団子になる）。絵のときは
   大きめの寸法を使う。呼ぶ側は「どの場面か」だけ渡せばいい。
   ============================================================ */
import React from 'react';
import { Image, View } from 'react-native';

import { Icon } from '@/components/icons';
import type { Badge } from '@/data/badges';
import { T } from '@/theme';

/** 出す場所。絵とアイコンで別々の寸法を持つ */
const SIZE = {
  /** バッジ一覧のコマ */
  grid: { art: 72, icon: 28 },
  /** レッスンの結果に出る「BADGE UNLOCKED」の行 */
  row: { art: 48, icon: 30 },
  /** 取った瞬間の演出（→ components/badge-unlock.tsx）。ここだけ大きく出す */
  pop: { art: 104, icon: 64 },
} as const;

export function BadgeArt({ badge, at }: { badge: Badge; at: keyof typeof SIZE }) {
  const size = SIZE[at];
  if (!badge.art) return <Icon name={badge.icon} size={size.icon} color={T.text} />;
  return (
    <Image
      source={badge.art}
      /* 正方形で書き出す決まりなので contain。**縦横比を勝手に変えない**
         （→ assets/badges/README.md） */
      resizeMode="contain"
      style={{ width: size.art, height: size.art }}
    />
  );
}

/** 未獲得のコマ。**絵は出さない**——取る前に見せると、取った瞬間の驚きが消える。
    絵のバッジと高さを揃えたいので、鍵は絵と同じ枠の中に置く */
export function BadgeLocked({ badge, at }: { badge: Badge; at: keyof typeof SIZE }) {
  const size = SIZE[at];
  const box = badge.art ? size.art : size.icon;
  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="lock" size={Math.min(size.icon, 26)} color={T.disabled} opacity={0.6} />
    </View>
  );
}
