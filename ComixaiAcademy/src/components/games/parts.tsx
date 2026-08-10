/* ============================================================
   ミニゲーム共通の部品。黒地の上に置くもの。

   紙の上の `Button`（ui.tsx）とは別物にしてある。あちらはベタ影が
   前提だが、黒地の上ではベタ影が沈んで見えないため、こちらは
   「色が変わって少し縮む」で押した手ごたえを出している。
   ============================================================ */
import React from 'react';
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTap } from '@/components/motion';
import type { SoundName } from '@/lib/sound';
import { BW, C, FONT, R, S } from '@/theme';

/* ============================================================
   ゲーム1本ぶんの器。**押して決める口は、下に貼り付ける。**

   もとは中身をぜんぶ縦に流していただけなので、札が少ない回では
   「これで決める」が画面の上のほうに残り、**下の3分の2が丸ごと
   空いていた**。親指の届くところに無いうえ、画面のどこを見れば
   いいのかも回ごとに変わる。

   打つゲーム（トークン収め・AIに指示を出す）は前から下に帯を
   持っていたので、残りもそちらに揃える。帯があるぶんの高さは
   本文の下に自動で空くので、隠れない。
   ============================================================ */
export function GameFrame({
  children,
  footer,
}: {
  children: React.ReactNode;
  /** 下に貼り付けるもの。決める口が無い場面では省く */
  footer?: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: S.lg, paddingBottom: footer ? S.lg : S.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={{
            borderTopWidth: BW.line,
            borderTopColor: C.ink800,
            backgroundColor: C.ink900,
            padding: S.lg,
            gap: S.sm,
          }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export function GameButton({
  label,
  onPress,
  disabled,
  tone = 'yellow',
  sound,
  style,
}: {
  label: string;
  /** 押された指の座標。星を出す位置に使う */
  onPress: (x: number, y: number) => void;
  disabled?: boolean;
  tone?: 'yellow' | 'ghost';
  /** 押した音。**押した結果に判定音（right/wrong）が鳴るボタンは 'none' にする**。
      タップ音と判定音が同時に鳴ると、判定音のほうがかき消される
      （実機で「正解しても音が鳴らない」の報告） */
  sound?: SoundName | 'none';
  style?: StyleProp<ViewStyle>;
}) {
  const yellow = tone === 'yellow';
  const { pressed, onPressIn, onPressOut } = useTap({ sound });
  const down = pressed && !disabled;

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={(e) => onPress(e.nativeEvent.pageX, e.nativeEvent.pageY)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
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

   ▍「もう一度」の口はここに置かない
   決める口はぜんぶ下の帯（GameFrame の footer）に集めてある。
   ここは**読ませる札**で、押すところは下、と場所を分ける。
   ============================================================ */
export function TryAgain({ reason }: { /** 何が足りなかったのか。1〜2行で具体的に */ reason: string }) {
  return (
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
  );
}
