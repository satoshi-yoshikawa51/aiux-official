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

/* ============================================================
   外したときの札。**通らなかったことを、その場で言う。**

   もとは「見つける」「組み立てる」「並べる」の3つに合否が無く、
   何を選んでも通っていた。負けられないゲームにCLEARのスタンプを出すと、
   スタンプのほうの値打ちが下がる。

   ここで大事なのは、**何を外したのかを具体的に言うこと**。
   「もう一度」とだけ出すと、当てにいく遊びになる。
   ============================================================ */
export function TryAgain({
  reason,
  onRetry,
}: {
  /** 何が足りなかったのか。1〜2行で具体的に */
  reason: string;
  onRetry: (x: number, y: number) => void;
}) {
  return (
    <View style={{ gap: S.md }}>
      <View
        style={{
          borderWidth: BW.bold,
          borderColor: C.red500,
          borderRadius: R.md,
          padding: S.md,
          gap: 6,
        }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 20, color: C.red500, letterSpacing: 1 }}>
          TRY AGAIN
        </Text>
        <Text style={{ fontFamily: FONT.body, fontSize: 13.5, lineHeight: 22, color: C.paper100 }}>
          {reason}
        </Text>
      </View>
      <GameButton label="もう一度" onPress={onRetry} />
    </View>
  );
}
