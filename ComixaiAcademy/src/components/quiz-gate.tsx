/* ============================================================
   クイズの幕開け。「ここから答える番」だと、ひと呼吸おいて伝える。

   ▍なぜ要るのか
   レッスンには扉ページ（lesson-title.tsx）があるのに、クイズは
   「クイズへ」を押した次の瞬間に1問目とタイマーが走り出していた。
   読む側から答える側へ役割が変わるのに、その切り替えを画面が
   言ってくれない——「急に入る」と実機で指摘された。

   ▍レッスンの扉とは逆の、黒い幕にする
   扉ページは紙のままにしている（章の続きだから）。こちらは
   **インクで塗った黒い幕**。ここからは読み物ではなく勝負の時間、
   というトーンの切り替えを地の色でも言う。ミニゲームの入り
   （黒タイル）と同じ側の色にしてある。

   ▍タイマーは幕が引けてから
   幕の裏で15秒が減り始めていたら、演出のせいで損をする。
   出している間は止めてもらう（→ lesson/[id].tsx の running）。
   待たせるのは1.4秒だけ。押せばすぐ引ける。
   ============================================================ */
import React from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text } from 'react-native';

import { Stamp } from '@/components/motion';
import { QUIZ_SECONDS } from '@/components/quiz';
import { playSound } from '@/lib/sound';
import { C, FONT, R, S } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/** 出しておく時間。扉ページ（1.6秒）より短く——本編前の間はもう取ってある */
const HOLD_MS = 1400;
const OUT_MS = 220;

export function QuizGate({ count, onDone }: { count: number; onDone: () => void }) {
  /* 赤い下線。文字が着地してから走らせる（扉ページと同じ段取り） */
  const line = React.useRef(new Animated.Value(0)).current;
  const out = React.useRef(new Animated.Value(0)).current;
  const leaving = React.useRef(false);
  const done = React.useRef(onDone);
  done.current = onDone;

  React.useEffect(() => {
    /* 試験の「試験をはじめる」と同じ音。答える番の合図はこの音に揃える */
    playSound('start');
    const a = Animated.timing(line, {
      toValue: 1,
      duration: 380,
      delay: 320,
      /* 幅はネイティブドライバに載らない */
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    });
    a.start();
    return () => a.stop();
  }, [line]);

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
    const id = setTimeout(leave, HOLD_MS);
    return () => clearTimeout(id);
  }, [leave]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 20,
          opacity: out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        },
      ]}>
      <Pressable
        onPress={leave}
        style={{
          flex: 1,
          backgroundColor: C.ink900,
          alignItems: 'center',
          justifyContent: 'center',
          padding: S.xl,
          gap: S.md,
        }}>
        <Stamp tilt={-1.5} from={1.6}>
          <Animated.View style={{ alignItems: 'center', gap: S.sm }}>
            {/* ▍主役は「QUIZ」の一語
                前は「ここから3問」を大きく出していたが、日本語の説明文が
                ドンと出ると看板ではなく注意書きに見える（実機で指摘）。
                ミニゲームの「MINI GAME」と同じ作法で、英語の種目名を掲げて
                数字は下に添える */}
            <Text
              style={{
                fontFamily: FONT.display,
                fontSize: 52,
                lineHeight: 62,
                letterSpacing: 6,
                color: C.paper50,
              }}>
              QUIZ
            </Text>
            <Animated.View
              style={{
                height: 5,
                borderRadius: R.full,
                backgroundColor: C.red500,
                width: line.interpolate({ inputRange: [0, 1], outputRange: [0, 130] }),
              }}
            />
            {/* 問数と制限時間は下線のあとに出す。全部いっぺんに出すと読まれない */}
            <Animated.Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 11.5,
                letterSpacing: 1.5,
                color: C.ink300,
                opacity: line,
              }}>
              全{count}問 ・ 1問 {QUIZ_SECONDS}秒
            </Animated.Text>
          </Animated.View>
        </Stamp>
      </Pressable>
    </Animated.View>
  );
}
