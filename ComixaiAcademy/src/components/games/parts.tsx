/* ============================================================
   ミニゲーム共通の部品。黒地の上に置くもの。

   紙の上の `Button`（ui.tsx）とは別物にしてある。あちらはベタ影が
   前提だが、黒地の上ではベタ影が沈んで見えないため、こちらは
   「色が変わって少し縮む」で押した手ごたえを出している。
   ============================================================ */
import React from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTap } from '@/components/motion';
import type { SoundName } from '@/lib/sound';
import { BW, C, FONT, R, S } from '@/theme';

const NATIVE = Platform.OS !== 'web';

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
  overlay,
}: {
  children: React.ReactNode;
  /** 下に貼り付けるもの。決める口が無い場面では省く */
  footer?: React.ReactNode;
  /** 画面全体に重ねるもの（掛け声ポップなど）。触れない */
  overlay?: React.ReactNode;
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
      {overlay ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          {overlay}
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================
   掛け声。正解のたびに、押した指の近くで「ナイス！」がぽんと出る。

   星（useSparkBurst）だけだと画面が静かで、**当てた気持ちよさが
   足りない**（実機で「ミニゲームが殺風景」の指摘）。文字が出ると
   画面が一気に喋りだす。連続で当てるほど言葉が強くなる。
   ループアニメではなく一発もの（電池を食わない）。
   ============================================================ */

const CHEERS = ['ナイス！', 'いいね！', '冴えてる！', 'その調子！', 'さすが！'];

export function useCheer(): {
  /** x,y＝指の座標（pageX/pageY）。streak＝何連続めの正解か（1〜） */
  cheer: (x: number, y: number, streak?: number) => void;
  node: React.ReactNode;
} {
  const [pop, setPop] = React.useState<{ key: number; text: string; x: number; y: number } | null>(
    null,
  );
  const cheer = React.useCallback((x: number, y: number, streak = 1) => {
    const text = CHEERS[Math.min(Math.max(streak - 1, 0), CHEERS.length - 1)];
    setPop({ key: Date.now(), text, x, y });
  }, []);
  const node = pop ? (
    <CheerPop key={pop.key} text={pop.text} x={pop.x} y={pop.y} onDone={() => setPop(null)} />
  ) : null;
  return { cheer, node };
}

function CheerPop({
  text,
  x,
  y,
  onDone,
}: {
  text: string;
  x: number;
  y: number;
  onDone: () => void;
}) {
  const t = React.useRef(new Animated.Value(0)).current;
  const done = React.useRef(onDone);
  done.current = onDone;
  React.useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start(() => done.current());
  }, [t]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        /* 指の少し上。左右は端で見切れないように寄せる */
        left: Math.min(Math.max(x - 70, 8), 250),
        top: Math.max(y - 150, 40),
        opacity: t.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [8, -26] }) },
          {
            scale: t.interpolate({
              inputRange: [0, 0.2, 0.35, 1],
              outputRange: [0.5, 1.15, 1, 1],
            }),
          },
          { rotate: '-4deg' },
        ],
      }}>
      <View
        style={{
          backgroundColor: C.yellow400,
          borderWidth: BW.bold,
          borderColor: C.ink900,
          borderRadius: R.full,
          paddingHorizontal: 14,
          paddingVertical: 6,
        }}>
        <Text style={{ fontFamily: FONT.heading, fontSize: 15, color: C.ink900 }}>{text}</Text>
      </View>
    </Animated.View>
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
   進み具合とミスの帯。**合否のあるゲームは、これを必ず出す。**

   もとは仕分けにしか無く、並べる・詰めるは**ミスを数えているのに
   画面のどこにも出ていなかった**。何回外せるのかも、いま何回
   外したのかも見えないと、失敗が「不思議な即死」になる（実機で指摘）。

   left には「手順 2 / 4」「みつけた 1 / 2」のような進み具合を渡す。
   無いゲーム（詰める）は省略してよい。MISSは0回でも出しておく——
   出ていれば「外せる回数に限りがある」が始まる前から伝わる。
   ============================================================ */
export function GameStatus({
  left,
  misses,
  allow,
}: {
  /** 進み具合の文字。省略するとMISSだけ右に出る */
  left?: string;
  misses: number;
  allow: number;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.yellow400 }}>
        {left ?? ''}
      </Text>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          letterSpacing: 1,
          color: misses > allow ? C.red500 : misses > 0 ? C.red500 : C.ink300,
        }}>
        MISS {misses} / {allow}
      </Text>
    </View>
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
