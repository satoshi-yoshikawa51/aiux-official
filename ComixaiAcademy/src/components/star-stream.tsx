/* ============================================================
   流れ星の海。修了試験に入る瞬間の幕（app/exam/[courseId].tsx）。

   ▍役割
   レッスンの結果画面から試験へ、地続きに画面が変わるだけだと
   「章の締めが始まった」感じが出ない。夜空を右上から左下へ
   流れ星が何本も流れて、FINAL EXAM の文字が灯る——**ここからは
   特別な一幕**という合図。約1.8秒で勝手にどく（押しても飛ばせる）。

   ▍ゲームのタイル・レッスンの扉ページとの描き分け
   ・ミニゲーム＝黒タイルがパパパパッ（勢い）
   ・レッスン＝紙の扉ページ（静か）
   ・修了試験＝夜空に流れ星（厳かで、少し高揚）
   入りの絵で「いま何が始まったのか」が分かるようにしてある。
   ============================================================ */
import React from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';

import { Icon } from '@/components/icons';
import { playSound } from '@/lib/sound';
import { C, FONT } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/** 流れ星の本数。多いほど「海」になるが、増やしすぎると雨になる */
const STARS = 22;
/** 出しておく時間と、出ていく時間 */
const HOLD_MS = 1800;
const OUT_MS = 300;

/* 進行方向：右上 → 左下。単位ベクトル (-0.88, 0.48) ＝ 約29度の下り */
const DIR_X = -0.88;
const DIR_Y = 0.48;
/* 尾の傾き。進行ベクトルに合わせる（atan2(0.48, -0.88) ≒ 151度） */
const TAIL_DEG = '151deg';

function ShootingStar({
  x,
  y,
  travel,
  size,
  color,
  delay,
  duration,
}: {
  /** 流れ始めの位置 */
  x: number;
  y: number;
  /** 流れる距離(px) */
  travel: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t, delay, duration]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: t.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, DIR_X * travel] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, DIR_Y * travel] }) },
        ],
      }}>
      {/* 尾。星の進行方向の後ろへ伸びる細い光 */}
      <Animated.View
        style={{
          position: 'absolute',
          left: size * 0.3,
          top: size * 0.42,
          width: size * 3.6,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          opacity: 0.4,
          transform: [{ rotate: TAIL_DEG }, { translateX: -size * 1.6 }],
        }}
      />
      <Icon name="twinkle" size={size} color={color} />
    </Animated.View>
  );
}

export function StarStream({ courseNo, onDone }: { courseNo: number; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const out = React.useRef(new Animated.Value(0)).current;
  const leaving = React.useRef(false);
  const done = React.useRef(onDone);
  done.current = onDone;

  /* 星は毎回ちがう空にする。位置・大きさ・速さを開いたときに決める */
  const stars = React.useMemo(
    () =>
      Array.from({ length: STARS }, (_, i) => {
        const big = i % 5 === 0;
        return {
          key: i,
          /* 画面の右上側を広めに使う（左下へ抜けるぶんの余白を足す） */
          x: width * (0.15 + Math.random() * 1.05),
          y: height * (-0.15 + Math.random() * 0.75),
          travel: width * (0.9 + Math.random() * 0.5),
          size: big ? 18 + Math.random() * 8 : 9 + Math.random() * 7,
          color: i % 7 === 3 ? C.red500 : i % 3 === 0 ? C.paper50 : C.yellow400,
          delay: Math.random() * 900,
          duration: 700 + Math.random() * 500,
        };
      }),
    [width, height],
  );

  const leave = React.useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    Animated.timing(out, {
      toValue: 1,
      duration: OUT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: NATIVE,
    }).start(() => done.current());
  }, [out]);

  React.useEffect(() => {
    playSound('start');
    const id = setTimeout(leave, HOLD_MS);
    return () => clearTimeout(id);
  }, [leave]);

  /* FINAL EXAM の灯り。星が流れ出したあと、ふっと浮かぶ */
  const glow = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const a = Animated.timing(glow, {
      toValue: 1,
      duration: 520,
      delay: 480,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [glow]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 30, opacity: out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
      ]}>
      <Pressable
        onPress={leave}
        style={{ flex: 1, backgroundColor: C.ink900, alignItems: 'center', justifyContent: 'center' }}>
        {stars.map(({ key, ...s }) => (
          <ShootingStar key={key} {...s} />
        ))}
        <Animated.View
          style={{
            alignItems: 'center',
            gap: 8,
            opacity: glow,
            transform: [{ translateY: glow.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }}>
          <Text
            style={{ fontFamily: FONT.mono, fontSize: 12, letterSpacing: 6, color: C.paper100 }}>
            第{courseNo}章
          </Text>
          <Text
            style={{
              fontFamily: FONT.display,
              fontSize: 34,
              lineHeight: 46,
              letterSpacing: 4,
              color: C.yellow400,
            }}>
            FINAL EXAM
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
