/* ============================================================
   ミニゲーム共通の部品。黒地の上に置くもの。

   紙の上の `Button`（ui.tsx）とは別物にしてある。あちらはベタ影が
   前提だが、黒地の上ではベタ影が沈んで見えないため、こちらは
   「色が変わって少し縮む」で押した手ごたえを出している。
   ============================================================ */
import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTap } from '@/components/motion';
import { BW, C, FONT, R, S } from '@/theme';

export function GameButton({
  label,
  onPress,
  disabled,
  tone = 'yellow',
  style,
}: {
  label: string;
  /** 押された指の座標。星を出す位置に使う */
  onPress: (x: number, y: number) => void;
  disabled?: boolean;
  tone?: 'yellow' | 'ghost';
  style?: StyleProp<ViewStyle>;
}) {
  const yellow = tone === 'yellow';
  const { pressed, onPressIn, onPressOut } = useTap();
  const down = pressed && !disabled;

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={(e) => onPress(e.nativeEvent.pageX, e.nativeEvent.pageY)}
      disabled={disabled}
      style={style}>
      <View
        style={{
          /* 押しているあいだは一段沈んだ色に。黒地なので、
             縁の色が変わるだけでもはっきり分かる */
          backgroundColor: disabled
            ? C.ink800
            : yellow
              ? down
                ? C.yellow200
                : C.yellow400
              : down
                ? C.ink800
                : 'transparent',
          borderWidth: BW.bold,
          borderColor: disabled ? C.ink700 : yellow ? (down ? C.yellow200 : C.yellow400) : C.paper100,
          borderRadius: R.sm,
          paddingVertical: 13,
          paddingHorizontal: S.lg,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 52,
          transform: [{ translateY: down ? 2 : 0 }, { scale: down ? 0.97 : 1 }],
        }}>
        <Text
          style={{
            fontFamily: FONT.heading,
            fontSize: 15,
            letterSpacing: 0.4,
            textAlign: 'center',
            color: disabled ? C.ink500 : yellow ? C.ink900 : C.paper50,
          }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
