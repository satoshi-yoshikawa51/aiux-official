/* ============================================================
   レッスンの幕開け。「1-2 プロンプトは「お願い」じゃなくて「指示書」」の
   タイトルを、読み始める前にひと呼吸だけ見せる。

   ▍ゲームの入りとは逆のトーンにする
   ミニゲームは黒いタイルで画面を塗り潰す（mini-game.tsx）。こちらは
   **紙のまま**。網点の紙に、コマ番号つきの白いコマがポンと落ちてくる
   ——「マンガの新しい章の扉ページ」のつもり。地の色が変わらないので、
   ゲームが始まったのとは間違えない。

   ▍待たせない
   1.6秒で勝手にどく。押せばすぐどく。レッスンは1日1本の習慣にしたい
   ので、毎回の入りが重いと開くのが億劫になる。
   ============================================================ */
import React from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { Stamp } from '@/components/motion';
import { Panel, Tone } from '@/components/ui';
import { playSound } from '@/lib/sound';
import { C, FONT, R, S, T } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/** 出しておく時間。タイル演出が無いぶん、ゲームのタイトルより短くていい */
const HOLD_MS = 1600;
/** 出ていくときの時間 */
const OUT_MS = 240;

export function LessonTitle({
  no,
  title,
  minutes,
  quizCount,
  icon,
  onDone,
}: {
  /** 「1-2」のような章-本の番号 */
  no: string;
  title: string;
  minutes: number;
  quizCount: number;
  /** コースのアイコン */
  icon: IconName;
  onDone: () => void;
}) {
  /* 赤い下線が左から伸びる。タイトルが着地してから走らせる */
  const line = React.useRef(new Animated.Value(0)).current;
  /* 出ていくとき。上へ抜けながら消える */
  const out = React.useRef(new Animated.Value(0)).current;
  const leaving = React.useRef(false);
  const done = React.useRef(onDone);
  done.current = onDone;

  React.useEffect(() => {
    playSound('pick');
    const a = Animated.timing(line, {
      toValue: 1,
      duration: 420,
      delay: 360,
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
          transform: [{ translateY: out.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }],
        },
      ]}>
      {/* 紙で覆う。裏のレッスンはこのあいだ触れない */}
      <Pressable onPress={leave} style={{ flex: 1, backgroundColor: T.bg }}>
        <Tone tone="dots" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl }}>
          {/* 扉ページのコマ。判子のように落ちてくる */}
          <Stamp tilt={-1.5} from={1.6}>
            <Panel
              number={no}
              contentStyle={{
                paddingTop: S.xl + S.md,
                paddingBottom: S.xl,
                paddingHorizontal: S.xl,
                gap: S.md,
                alignItems: 'center',
                minWidth: 260,
                maxWidth: 340,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={icon} size={14} color={T.accent} />
                <Text
                  style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 3, color: T.accent }}>
                  LESSON {no}
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: FONT.display,
                  fontSize: 26,
                  lineHeight: 38,
                  color: T.text,
                  textAlign: 'center',
                }}>
                {title}
              </Text>

              <Animated.View
                style={{
                  height: 5,
                  borderRadius: R.full,
                  backgroundColor: T.accent,
                  width: line.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }),
                }}
              />

              <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 1, color: T.muted }}>
                {minutes}MIN ・ QUIZ {quizCount}
              </Text>
            </Panel>
          </Stamp>

          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: 2,
              color: C.ink300,
              marginTop: S.xl,
            }}>
            TAP TO START
          </Text>
        </Tone>
      </Pressable>
    </Animated.View>
  );
}
