/* ============================================================
   称号ランクアップ。**このアプリでいちばん派手な画面**。

   ▍なぜ全画面で止めるのか
   称号は、レッスン何本ぶんもの積み重ねでしか上がらない。それを結果画面の
   カード1枚で流すと、いちばん大きなご褒美がいちばん地味になる。
   ここだけは画面を占領して、手を止めさせる。

   ▍組み立て（マンガの見開き1ページのつもりで）
   ベタフラッシュ（白く飛ぶ）→ 集中線 → 「RANK UP」を叩きつける →
   前の称号に取り消し線 → 新しい称号が判子のように落ちてくる →
   星が大量に舞う → 先生のひとこと → つづける

   ▍触ったら飛ばせる。ただし「閉じる」ではない
   途中で触ったら**最後まで一気に進める**（閉じない）。ご褒美の画面なので、
   うっかり触って見逃すのがいちばん惜しい。組み上がってからもう一度触るか、
   ボタンを押すと閉じる。

   ▍演出の部品は motion.tsx にある
   星（SparkLayer）と押した感じ（useTap）はそちら。
   Modal は別の窓なので、星の層はこの中にもう1枚必要。
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
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/icons';
import { SparkLayer, useSparkBurst } from '@/components/motion';
import { Bubble } from '@/components/ui';
import { titleSay, type Title } from '@/data/badges';
import { useProgress } from '@/store/progress';
import { BW, C, F, FONT, R, S } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/* 組み上がるまでの段取り。**間延びさせない**。
   ここを伸ばすと、ご褒美ではなく待ち時間になる */
const BEATS = [
  260, // RANK UP を叩きつける
  760, // 前の称号に取り消し線
  1180, // 新しい称号が落ちてくる
  1560, // 称号の名前
  1960, // 先生のひとこと
  2320, // つづける
] as const;
const LAST = BEATS.length; // 6 ＝ 組み上がり

/* ———————————————— 集中線 ————————————————
   マンガの「ここが山場」の記号。放射状のベタを回しながら脈打たせる。
   細い線を引くのではなく**中心から外へ広がる三角のベタ**にしているのは、
   線だと端末によって細りすぎて消えるため（アイコンと同じ理屈）。 */

const RAYS = 30;

/** 単位円のまま作って、使う側で画面より大きく引き伸ばす */
const rayPath = (i: number) => {
  const a = (i / RAYS) * Math.PI * 2;
  /* 手前を細く、外へ向かって太く。等幅だと車輪に見える */
  const w = 0.030;
  const at = (ang: number, r: number) => `${(Math.cos(ang) * r).toFixed(3)},${(Math.sin(ang) * r).toFixed(3)}`;
  return `M0,0L${at(a - w, 1)}L${at(a + w, 1)}Z`;
};

function SpeedLines() {
  const { width, height } = useWindowDimensions();
  /* 回すので、対角より大きく取らないと角が空く */
  const d = Math.sqrt(width * width + height * height) * 1.15;

  const spin = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: NATIVE }),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [spin, pulse]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (width - d) / 2,
        top: (height - d) / 2,
        width: d,
        height: d,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] }),
        transform: [
          { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
        ],
      }}>
      <Svg width={d} height={d} viewBox="-1 -1 2 2">
        {Array.from({ length: RAYS }, (_, i) => (
          <Path
            key={i}
            d={rayPath(i)}
            /* 黄と紙色を交互に。1色だと平らに見える */
            fill={i % 2 === 0 ? C.yellow400 : C.paper50}
            opacity={i % 2 === 0 ? 0.14 : 0.07}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

/* ———————————————— 広がる輪 ————————————————
   衝撃が外へ抜けていく合図。3本を時間差で出す */

function Shockwave({ delay, color, thick }: { delay: number; color: string; thick: number }) {
  const { width, height } = useWindowDimensions();
  const d = Math.max(width, height);
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (width - d) / 2,
        top: (height - d) / 2,
        width: d,
        height: d,
        borderRadius: d / 2,
        borderWidth: thick,
        borderColor: color,
        opacity: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.9, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.05, 1.5] }) }],
      }}
    />
  );
}

/* ———————————————— 叩きつける ————————————————
   特大から等倍へ、行き過ぎて止まる。CLEARのスタンプより**強く**
   （あちらは2.2倍から、こちらは5倍から落とす） */

function Slam({
  children,
  from = 5,
  tilt = 0,
  delay = 0,
  onLand,
}: {
  children: React.ReactNode;
  from?: number;
  tilt?: number;
  delay?: number;
  onLand?: () => void;
}) {
  const t = React.useRef(new Animated.Value(0)).current;
  const land = React.useRef(onLand);
  land.current = onLand;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.back(1.9)),
      useNativeDriver: NATIVE,
    });
    a.start();
    const id = setTimeout(() => land.current?.(), delay + 260);
    return () => {
      a.stop();
      clearTimeout(id);
    };
  }, [t, delay]);

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

/* ———————————————— 置き場所を先に確保する ————————————————
   出来事が増えるたびに縦に積むと、**すでに出ているものが上へずれる**。
   組み上がっていく画なので、動くたびに全体がガタつくと安っぽい。
   最初から高さだけ取っておいて、中身が後から入る形にする。 */

function Slot({ h, children }: { h: number; children: React.ReactNode }) {
  return <View style={{ height: h, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

/* ———————————————— メダル ————————————————
   黒地なので、外側は**紙の色の輪**にする。黄色だけだと縁が沈んで
   ただの丸に見える。金の輪が外へ広がり続けて「光っている」を出す。 */

function Halo({ size }: { size: number }) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const a = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
    );
    a.start();
    return () => a.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: C.yellow400,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
      }}
    />
  );
}

function Medal({ icon }: { icon: Title['icon'] }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Halo size={168} />
      <View
        style={{
          width: 168,
          height: 168,
          borderRadius: 84,
          backgroundColor: C.paper0,
          borderWidth: BW.bold,
          borderColor: C.ink900,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: 146,
            height: 146,
            borderRadius: 73,
            backgroundColor: C.yellow400,
            borderWidth: 3,
            borderColor: C.ink900,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name={icon} size={80} color={C.ink900} />
        </View>
      </View>
    </View>
  );
}

/* ———————————————— 本体 ———————————————— */

export function RankUpScreen({
  from,
  to,
  onDone,
}: {
  /** ひとつ前の称号。いちばん下の称号から上がったときは null */
  from: Title | null;
  to: Title;
  onDone: () => void;
}) {
  return (
    <Modal visible animationType="none" transparent onRequestClose={onDone}>
      {/* Modal は別の窓なので、根元（_layout.tsx）の星の層は届かない */}
      <SparkLayer>
        <Stage from={from} to={to} onDone={onDone} />
      </SparkLayer>
    </Modal>
  );
}

function Stage({ from, to, onDone }: { from: Title | null; to: Title; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const burst = useSparkBurst();
  /* ひとことは選んでいる相棒の口調で出す（書けていなければ先生の言葉） */
  const { state } = useProgress();
  const avatarId = state.avatarId;
  const [beat, setBeat] = React.useState(0);

  /* 白飛び。最初の一瞬だけ画面を白く飛ばして、黒へ沈める */
  const flash = React.useRef(new Animated.Value(1)).current;
  /* 着地のたびに画面ごと揺らす */
  const shake = React.useRef(new Animated.Value(0)).current;

  const quake = React.useCallback(() => {
    shake.setValue(0);
    Animated.timing(shake, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
  }, [shake]);

  /* 星を何発かまとめて撒く。1発では画面の広さに負ける */
  const volley = React.useCallback(() => {
    const spots: [number, number, number][] = [
      [0.5, 0.42, 2.6],
      [0.18, 0.3, 1.8],
      [0.82, 0.34, 1.8],
      [0.3, 0.62, 1.6],
      [0.72, 0.66, 1.6],
    ];
    spots.forEach(([x, y, s]) => burst(width * x, height * y, s));
  }, [burst, width, height]);

  React.useEffect(() => {
    Animated.timing(flash, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [flash]);

  /* 段取りを進めるタイマー。触られたら止めて最後まで飛ばす */
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => {
    timers.current = BEATS.map((ms, i) => setTimeout(() => setBeat(i + 1), ms));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const skipOrClose = () => {
    if (beat >= LAST) {
      onDone();
      return;
    }
    timers.current.forEach(clearTimeout);
    setBeat(LAST);
  };

  const shift = shake.interpolate({ inputRange: [0, 0.2, 0.45, 0.7, 1], outputRange: [0, 9, -7, 4, 0] });

  return (
    <Pressable onPress={skipOrClose} style={{ flex: 1, backgroundColor: C.ink900 }}>
      <SpeedLines />
      <Shockwave delay={140} color={C.yellow400} thick={5} />
      <Shockwave delay={330} color={C.paper50} thick={3} />
      <Shockwave delay={560} color={C.red500} thick={4} />

      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: S.xl,
          transform: [{ translateX: shift }],
        }}>
        {/* ① RANK UP */}
        <Slot h={34}>
        {beat >= 1 ? (
          <Slam from={5.5} onLand={quake}>
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 15,
                letterSpacing: 8,
                color: C.yellow400,
              }}>
              RANK UP
            </Text>
          </Slam>
        ) : null}
        </Slot>

        {/* ② 前の称号に取り消し線。「ここから上がった」を一目で */}
        <Slot h={34}>
        {beat >= 2 && from ? (
          <Slam from={1.6}>
            <View>
              <Text
                style={{
                  fontFamily: FONT.heading,
                  fontSize: 17,
                  color: C.ink300,
                }}>
                {from.name}
              </Text>
              <View
                style={{
                  position: 'absolute',
                  left: -4,
                  right: -4,
                  top: '52%',
                  height: 2.5,
                  backgroundColor: C.red500,
                }}
              />
            </View>
          </Slam>
        ) : null}
        </Slot>

        {/* ③ 新しい称号が判子のように落ちてくる。着地で星をばら撒く */}
        <Slot h={196}>
        {beat >= 3 ? (
          <Slam
            from={4.2}
            tilt={-7}
            onLand={() => {
              quake();
              volley();
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
              }
            }}>
            <Medal icon={to.icon} />
          </Slam>
        ) : null}
        </Slot>

        {/* ④ 称号の名前 */}
        <Slot h={62}>
        {beat >= 4 ? (
          <Slam from={3} onLand={quake}>
            <Text
              style={{
                fontFamily: FONT.display,
                fontSize: 38,
                lineHeight: 50,
                color: C.paper0,
                textAlign: 'center',
              }}>
              {to.name}
            </Text>
          </Slam>
        ) : null}
        </Slot>

        {/* ⑤ 先生のひとこと */}
        <Slot h={124}>
        {beat >= 5 ? (
          <Slam from={1.35}>
            <Bubble text={titleSay(to, avatarId)} variant="say" numberOfLines={3} style={{ maxWidth: 300 }} />
          </Slam>
        ) : null}
        </Slot>
      </Animated.View>

      {/* ⑥ つづける。組み上がってから出す。
           **高さは最初から確保しておく**。あとから足すと、上の列が
           そのぶん押し上げられて、組み上がった瞬間に全部がずれる */}
      <View style={{ height: 132, alignItems: 'center', justifyContent: 'flex-start' }}>
      {beat >= LAST ? (
        <Slam from={1.25}>
          <View style={{ alignItems: 'center', paddingHorizontal: S.xl }}>
            <View
              style={{
                backgroundColor: C.yellow400,
                borderWidth: BW.bold,
                borderColor: C.ink900,
                borderRadius: R.sm,
                paddingVertical: 13,
                paddingHorizontal: S.xxl,
              }}>
              <Text style={{ fontFamily: FONT.heading, fontSize: 16, color: C.ink900, letterSpacing: 0.4 }}>
                つづける
              </Text>
            </View>
            <Text
              style={[F.tiny, { color: C.ink500, marginTop: S.sm, fontFamily: FONT.mono, letterSpacing: 1 }]}>
              TAP TO CLOSE
            </Text>
          </View>
        </Slam>
      ) : null}
      </View>

      {/* 白飛び。いちばん上に置いて、開いた瞬間だけ全部を白く消す */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: C.paper0, opacity: flash }]}
      />
    </Pressable>
  );
}
