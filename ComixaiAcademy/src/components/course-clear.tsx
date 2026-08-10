/* ============================================================
   コースクリアの祝砲。**修了試験に受かった人にだけ**出す全画面。

   ▍称号ランクアップ（rank-up.tsx）より上に置く演出
   称号はバッジの数で勝手に上がるが、こちらは試験に受かって初めて出る。
   アプリでいちばん派手：夜空（黒地）に花火が上がり続ける中で、
   COURSE CLEAR → 章の名前 → 成績 → 先生のひとこと、と組み上がる。

   ▍花火は「打ち上げ続ける」
   1発だけだと祝砲ではなく効果音になる。見ているあいだじゅう、
   位置を変えながらバンバン上がる。閉じるまで止めない。

   ▍触ったら飛ばせる。ただし「閉じる」ではない（rank-up と同じ作法）
   途中で触ったら最後まで一気に組み上げる。組み上がってから
   もう一度触るか、ボタンで閉じる。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { SparkLayer, useSparkBurst } from '@/components/motion';
import { playSound } from '@/lib/sound';
import { Bubble } from '@/components/ui';
import { EXAM_VOICE, say as voice } from '@/data/voice';
import { useProgress } from '@/store/progress';
import { BW, C, F, FONT, R, S } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/* 組み上がる段取り。花火が主役なので、文字は少し遅めに置いていく */
const BEATS = [
  420, // COURSE CLEAR
  980, // 章の名前
  1460, // 成績
  1900, // 先生のひとこと
  2350, // つづける
] as const;
const LAST = BEATS.length;

/* ———————————————— 花火1発 ————————————————
   中心から放射状に飛ぶ火の粉。重い粒子は要らない——
   14個の点が「開いて、流れて、消える」だけで花火に見える */

const EMBERS = 14;
const FIREWORK_MS = 1150;

function Firework({
  x,
  y,
  size,
  color,
  delay,
}: {
  x: number;
  y: number;
  /** 開いたときの半径(px) */
  size: number;
  color: string;
  delay: number;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: FIREWORK_MS,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t, delay]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y }}>
      {/* 開く輪。ぱっと広がってすぐ薄れる */}
      <Animated.View
        style={{
          position: 'absolute',
          left: -size,
          top: -size,
          width: size * 2,
          height: size * 2,
          borderRadius: size,
          borderWidth: 2.5,
          borderColor: color,
          opacity: t.interpolate({ inputRange: [0, 0.12, 0.5, 1], outputRange: [0, 0.9, 0.25, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1.15] }) }],
        }}
      />
      {Array.from({ length: EMBERS }, (_, i) => {
        const ang = (i / EMBERS) * Math.PI * 2;
        /* 偶数番だけ少し遠くへ。真円のままだと歯車に見える */
        const r = size * (i % 2 === 0 ? 1 : 0.62);
        const dx = Math.cos(ang) * r;
        const dy = Math.sin(ang) * r;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: -3,
              top: -3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i % 3 === 0 ? C.paper50 : color,
              opacity: t.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
              transform: [
                /* 開いたあと、火の粉が少し「垂れる」。まっすぐ消えると線香花火にならない */
                { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
                {
                  translateY: t.interpolate({
                    inputRange: [0, 0.55, 1],
                    outputRange: [0, dy, dy + size * 0.35],
                  }),
                },
                { scale: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.2, 1, 0.3] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

/* 打ち上げ係。位置と色を変えながら、閉じるまでバンバン上げ続ける */
function FireworkShow() {
  const { width, height } = useWindowDimensions();
  const [shots, setShots] = React.useState<
    { id: number; x: number; y: number; size: number; color: string; delay: number }[]
  >([]);
  const seq = React.useRef(0);

  React.useEffect(() => {
    const colors = [C.yellow400, C.red500, C.paper50, C.yellow400];
    const fire = (n: number, spread: number) => {
      const add = Array.from({ length: n }, (_, i) => ({
        id: (seq.current += 1),
        x: width * (0.15 + Math.random() * 0.7),
        y: height * (0.08 + Math.random() * 0.42),
        size: 54 + Math.random() * 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: i * spread,
      }));
      setShots((v) => [...v.slice(-14), ...add]);
    };
    /* 開幕は3連発、あとは撃ち続ける */
    fire(3, 180);
    const id = setInterval(() => fire(2, 260), 900);
    return () => clearInterval(id);
  }, [width, height]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {shots.map((s) => (
        <Firework key={s.id} {...s} />
      ))}
    </View>
  );
}

/* 特大から落ちてくる。rank-up の Slam と同じ気持ちよさ */
function Slam({
  children,
  from = 4,
  tilt = 0,
  onLand,
}: {
  children: React.ReactNode;
  from?: number;
  tilt?: number;
  onLand?: () => void;
}) {
  const t = React.useRef(new Animated.Value(0)).current;
  const land = React.useRef(onLand);
  land.current = onLand;
  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.back(1.9)),
      useNativeDriver: NATIVE,
    });
    a.start();
    const id = setTimeout(() => land.current?.(), 260);
    return () => {
      a.stop();
      clearTimeout(id);
    };
  }, [t]);
  return (
    <Animated.View
      style={{
        opacity: t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }),
        transform: [
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) },
          { rotate: `${tilt}deg` },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

function Slot({ h, children }: { h: number; children: React.ReactNode }) {
  return <View style={{ height: h, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

/* ———————————————— 本体 ———————————————— */

export function CourseClearScreen({
  courseNo,
  courseTitle,
  icon,
  score,
  total,
  onDone,
}: {
  /** 何章か（1はじまり） */
  courseNo: number;
  courseTitle: string;
  icon: IconName;
  /** 試験の正解数と問題数 */
  score: number;
  total: number;
  onDone: () => void;
}) {
  return (
    <Modal visible animationType="none" transparent onRequestClose={onDone}>
      {/* Modal は別の窓なので、星の層はこの中にもう1枚要る */}
      <SparkLayer>
        <Stage
          courseNo={courseNo}
          courseTitle={courseTitle}
          icon={icon}
          score={score}
          total={total}
          onDone={onDone}
        />
      </SparkLayer>
    </Modal>
  );
}

function Stage({
  courseNo,
  courseTitle,
  icon,
  score,
  total,
  onDone,
}: {
  courseNo: number;
  courseTitle: string;
  icon: IconName;
  score: number;
  total: number;
  onDone: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const burst = useSparkBurst();
  const { state } = useProgress();
  const [beat, setBeat] = React.useState(0);
  const flash = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(flash, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    playSound('badge');
  }, [flash]);

  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => {
    timers.current = BEATS.map((ms, i) => setTimeout(() => setBeat(i + 1), ms));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  /* 花火にあわせて星と「きらっ」の音を撒く。上半分＝花火のいる高さに */
  React.useEffect(() => {
    const ids = [400, 1300, 2200].map((ms, i) =>
      setTimeout(() => {
        burst(width * (0.3 + i * 0.2), height * 0.28, 2.2);
        playSound('star');
      }, ms),
    );
    return () => ids.forEach(clearTimeout);
  }, [burst, width, height]);

  const skipOrClose = () => {
    if (beat >= LAST) {
      onDone();
      return;
    }
    timers.current.forEach(clearTimeout);
    setBeat(LAST);
  };

  return (
    <Pressable onPress={skipOrClose} style={{ flex: 1, backgroundColor: C.ink900 }}>
      <FireworkShow />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl }}>
        {/* ① COURSE CLEAR */}
        <Slot h={92}>
          {beat >= 1 ? (
            <Slam from={5} tilt={-5}>
              <View
                style={{
                  borderWidth: 4,
                  borderColor: C.yellow400,
                  borderRadius: R.md,
                  paddingHorizontal: S.xl,
                  paddingVertical: S.sm,
                  backgroundColor: 'rgba(20,17,15,0.65)',
                }}>
                <Text
                  style={{ fontFamily: FONT.display, fontSize: 34, lineHeight: 46, color: C.yellow400 }}>
                  COURSE CLEAR
                </Text>
              </View>
            </Slam>
          ) : null}
        </Slot>

        {/* ② 章の名前 */}
        <Slot h={92}>
          {beat >= 2 ? (
            <Slam from={3}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text
                  style={{ fontFamily: FONT.mono, fontSize: 12, letterSpacing: 4, color: C.paper100 }}>
                  第{courseNo}章
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name={icon} size={26} color={C.yellow400} />
                  <Text
                    style={{ fontFamily: FONT.display, fontSize: 30, lineHeight: 42, color: C.paper0 }}>
                    {courseTitle}
                  </Text>
                </View>
              </View>
            </Slam>
          ) : null}
        </Slot>

        {/* ③ 試験の成績 */}
        <Slot h={44}>
          {beat >= 3 ? (
            <Slam from={1.8}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderWidth: BW.line,
                  borderColor: C.ink700,
                  borderRadius: R.full,
                  paddingHorizontal: S.lg,
                  paddingVertical: 7,
                }}>
                <Icon name="check" size={14} color={C.yellow400} />
                <Text
                  style={{ fontFamily: FONT.mono, fontSize: 12, letterSpacing: 1, color: C.paper50 }}>
                  修了試験 {score} / {total}
                </Text>
              </View>
            </Slam>
          ) : null}
        </Slot>

        {/* ④ 先生のひとこと */}
        <Slot h={116}>
          {beat >= 4 ? (
            <Slam from={1.35}>
              <Bubble
                text={voice(EXAM_VOICE.pass, state.avatarId)}
                numberOfLines={3}
                style={{ maxWidth: 300 }}
              />
            </Slam>
          ) : null}
        </Slot>
      </View>

      {/* ⑤ つづける。高さは最初から確保しておく（rank-up と同じ理由） */}
      <View style={{ height: 132, alignItems: 'center', justifyContent: 'flex-start' }}>
        {beat >= LAST ? (
          <Slam from={1.25}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: C.yellow400,
                  borderWidth: BW.bold,
                  borderColor: C.ink900,
                  borderRadius: R.sm,
                  paddingVertical: 13,
                  paddingHorizontal: S.xxl,
                }}>
                <Text
                  style={{ fontFamily: FONT.heading, fontSize: 16, color: C.ink900, letterSpacing: 0.4 }}>
                  つづける
                </Text>
              </View>
              <Text
                style={[
                  F.tiny,
                  { color: C.ink500, marginTop: S.sm, fontFamily: FONT.mono, letterSpacing: 1 },
                ]}>
                TAP TO CLOSE
              </Text>
            </View>
          </Slam>
        ) : null}
      </View>

      {/* 白飛び。開いた瞬間だけ全部を白く消す */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: C.paper0, opacity: flash }]}
      />
    </Pressable>
  );
}
