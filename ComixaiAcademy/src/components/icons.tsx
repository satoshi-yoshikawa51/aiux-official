/* ============================================================
   オリジナルのタブアイコン（黒地に白抜き）。

   ■ なぜSVG（ベクター）なのか
   タブでの表示は22px前後。この小ささではPNGは@3xを用意しても輪郭が甘くなる。
   ベクターなら常にシャープで、色を変えるだけで白抜き／赤／減光を作り分けられる。

   ■ 形の作り方（小さいサイズの鉄則）
   ・線で描かず「ベタのシルエットから穴を抜く」（fillRule="evenodd"）。
     22pxまで縮めても潰れないのはこの作りだけ
   ・24×24グリッド。抜き（マンガのベタに入れるハイライト）は最低2単位の幅を取る。
     細いと22pxで消える
   ・1アイコンの要素は3つまで

   形は tools/build-icons.mjs で座標を計算して作り、22pxで実際に
   ラスタライズして目視で詰めたもの。作り直すときはそちらを使う。
   ============================================================ */
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { C } from '@/theme';

export type IconName = 'home' | 'learn' | 'badges' | 'settings';

const PATHS: Record<IconName, string> = {
  /* 家。右の斜面に煙突、屋根にハイライト、ドアを抜く */
  home:
    'M12,1.6L16.9,5.9L16.9,3.2L19.6,3.2L19.6,8.3L23.2,11.5L19.9,11.5L19.9,21.9L4.1,21.9L4.1,11.5L0.8,11.5Z' +
    'M9.4,21.9L9.4,14.6L14.6,14.6L14.6,21.9Z' +
    'M5.6,10.0L10.4,5.8L12.6,5.8L7.8,10.0Z',

  /* 開いた本。中央の隙間が背。抜きは必ず水平（斜めにすると「目」に見える） */
  learn:
    'M1.2,4.6C4.0,3.6 8.0,3.9 11.0,5.9L11.0,20.4C8.0,18.4 4.0,18.1 1.2,19.1Z' +
    'M22.8,4.6C20.0,3.6 16.0,3.9 13.0,5.9L13.0,20.4C16.0,18.4 20.0,18.1 22.8,19.1Z' +
    'M3.7,12.0L8.9,12.0L8.9,13.9L3.7,13.9Z' +
    'M20.3,12.0L15.1,12.0L15.1,13.9L20.3,13.9Z',

  /* リボン付きのメダル。星を抜く */
  badges:
    'M4.9,1.9L8.9,1.9L12.3,7.9L9.0,9.6Z' +
    'M19.1,1.9L15.1,1.9L11.7,7.9L15.0,9.6Z' +
    'M4.6,15.2A7.4,7.4 0 1 1 19.4,15.2A7.4,7.4 0 1 1 4.6,15.2Z' +
    'M12,10.4L13.27,13.56L16.66,13.79L14.05,15.97L14.88,19.26L12,17.46L9.12,19.26L9.95,15.97L7.34,13.79L10.73,13.56Z',

  /* 歯車（7枚歯・半歯ずらし）。中心を抜く */
  settings:
    'M11.54,0.61L17.27,1.89L15.14,4.75L18.33,7.27L20.62,4.54L23.19,9.81L19.62,9.93L19.64,14L23.21,14.09' +
    'L20.68,19.39L18.37,16.67L15.2,19.22L17.36,22.06L11.64,23.39L12.32,19.89L8.35,19.01L7.47,22.46' +
    'L2.87,18.82L6.03,17.17L4.25,13.51L1,14.98L0.97,9.11L4.23,10.55L5.98,6.88L2.81,5.26L7.38,1.58L8.29,5.03L12.25,4.1Z' +
    'M8,12A4,4 0 1 1 16,12A4,4 0 1 1 8,12Z',
};

/** 見た目の大きさを揃えるための微調整（面積の差を目で合わせたもの） */
const OPTICAL: Record<IconName, number> = {
  home: 1.06,
  learn: 1.0,
  badges: 1.0,
  settings: 0.93,
};

/**
 * 単体のアイコン。拡大縮小は viewBox を広げ／狭めて行う
 * （transform を使わないので、どの環境でも同じ結果になる）
 */
export function Icon({
  name,
  size = 20,
  color = C.paper0,
  opacity = 1,
}: {
  name: IconName;
  size?: number;
  color?: string;
  opacity?: number;
}) {
  const s = OPTICAL[name];
  const vb = 24 / s;
  const min = 12 - vb / 2;
  return (
    <Svg width={size} height={size} viewBox={`${min} ${min} ${vb} ${vb}`}>
      <Path d={PATHS[name]} fill={color} fillRule="evenodd" opacity={opacity} />
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
