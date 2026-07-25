/* ============================================================
   オリジナルアイコン。アプリ内の絵文字はすべてこれに置き換えている。

   ■ なぜSVG（ベクター）なのか
   タブでの表示は22px前後。この小ささではPNGは@3xを用意しても輪郭が甘くなり、
   白抜き／減光／赤で色ごとの書き出しも要る。ベクターなら常にシャープで、
   色は指定するだけでいい。

   ■ 形の作り方（小さいサイズの鉄則）
   ・線で描かず「ベタのシルエットから穴を抜く」（fillRule="evenodd"）
   ・24×24グリッド。抜きは最低2単位の幅。細いと22pxで消える
   ・1アイコンの要素は3つまで

   形そのものは tools/build-icons.mjs で座標を計算して作り、22pxで実際に
   ラスタライズして目視で詰めたもの。パスデータは icon-paths.ts に
   自動生成されるので、手で書き写さないこと。
   ============================================================ */
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ICON_PATHS, type IconName } from './icon-paths';
import { C } from '@/theme';

export type { IconName };

/** 見た目の大きさを揃えるための微調整（形の面積差を目で合わせたもの） */
const OPTICAL: Partial<Record<IconName, number>> = {
  home: 1.06,
  settings: 0.93,
  star: 0.94,
  perfect: 0.96,
  play: 0.95,
  check: 1.02,
  bang: 1.04,
};

/**
 * アイコン1つ。拡大縮小は viewBox を広げ／狭めて行う
 * （transform を使わないので、どの環境でも同じ結果になる）
 */
export function Icon({
  name,
  size = 20,
  color = C.ink900,
  opacity = 1,
}: {
  name: IconName;
  size?: number;
  color?: string;
  opacity?: number;
}) {
  const s = OPTICAL[name] ?? 1;
  const vb = 24 / s;
  const min = 12 - vb / 2;
  return (
    <Svg width={size} height={size} viewBox={`${min} ${min} ${vb} ${vb}`}>
      <Path d={ICON_PATHS[name]} fill={color} fillRule="evenodd" opacity={opacity} />
    </Svg>
  );
}

/** タブ用。選択中は赤の丸ベタを敷いて、アイコンは白のまま抜く */
export function TabIcon({
  name,
  focused,
  box = 30,
  glyph = 20,
}: {
  name: IconName;
  focused: boolean;
  box?: number;
  glyph?: number;
}) {
  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      {focused ? (
        <View
          style={{
            position: 'absolute',
            width: box,
            height: box,
            borderRadius: box / 2,
            backgroundColor: C.red500,
          }}
        />
      ) : null}
      {/* Webでは position:absolute の要素が通常フローの兄弟より上に描かれるため、
          zIndex を明示しないと赤丸がアイコンを覆ってしまう */}
      <View style={{ zIndex: 1 }}>
        <Icon name={name} size={glyph} color={C.paper0} opacity={focused ? 1 : 0.5} />
      </View>
    </View>
  );
}
