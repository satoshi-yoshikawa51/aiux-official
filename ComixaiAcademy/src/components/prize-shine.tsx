/* ============================================================
   当たりの光り物。レア度が上がるほど派手にする層。

   ▍なぜ絵に頼らないか
   景品の絵（舞台の写真・キャラの3D）は、レア度と関係なく作ってある。
   絵だけ見てもRとSRの区別が付かないので、**光り方で格を出す**。

     N  … 何も出さない（毎回光ると、光ることの意味が無くなる）
     R  … 星がまわりで瞬く
     SR … 星が倍、しかも大きい ＋ カードの中心から光が伸びる

   ▍星は「ずっと瞬く」、押したときの星とは別もの
   motion.tsx の Spark は**行って戻らない**（押した返事なので一度きり）。
   こちらは当たりカードが出ているあいだ鳴りっぱなしにしたいので、
   遅れをずらしながら繰り返す。

   ▍光の筋は transform-origin が無いので箱ごと回す
   RNには transform-origin が無く、棒の根元を軸に回せない。**画面いっぱいの
   正方形の箱に、上端から中心まで届く棒を1本置いて、箱ごと回す**。
   箱の中心＝棒の根元になるので、結果として根元を軸に回る。
   ============================================================ */
import React from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons';
import type { Rarity } from '@/data/gacha';

const NATIVE = Platform.OS !== 'web';

/** 星1つ。位置はカードの箱に対する割合（0〜1）、size は pt */
type Twinkle = { x: number; y: number; size: number; delay: number };

/* ▍カードの上ではなく、**まわりに散らす**
   絵の上に星を重ねると、当てた景品そのものが見えにくくなる。
   縁と外側に置いて、中身は空けておく。0〜1の外（負や1超え）も使う */
const R_TWINKLES: Twinkle[] = [
  { x: -0.06, y: 0.12, size: 18, delay: 0 },
  { x: 1.03, y: 0.2, size: 16, delay: 260 },
  { x: 0.08, y: 0.72, size: 15, delay: 520 },
  { x: 0.95, y: 0.66, size: 19, delay: 140 },
  { x: 0.5, y: -0.04, size: 14, delay: 700 },
  { x: 0.22, y: 0.03, size: 13, delay: 380 },
  { x: 0.8, y: 0.92, size: 15, delay: 620 },
  { x: -0.02, y: 0.44, size: 13, delay: 840 },
];

/* SRは倍の数で、ひと回り大きい。**同じ配置を薄く足すのではなく、
   隙間に置く**（重ねるとただ明るくなるだけで、数が増えて見えない） */
const SR_TWINKLES: Twinkle[] = [
  ...R_TWINKLES.map((t) => ({ ...t, size: t.size + 5 })),
  { x: 1.06, y: 0.42, size: 20, delay: 200 },
  { x: 0.32, y: 0.95, size: 17, delay: 460 },
  { x: 0.66, y: 0.06, size: 19, delay: 100 },
  { x: -0.05, y: 0.86, size: 16, delay: 900 },
  { x: 0.14, y: 0.3, size: 14, delay: 320 },
  { x: 0.88, y: 0.35, size: 15, delay: 760 },
  { x: 0.44, y: 1.0, size: 18, delay: 60 },
  { x: 1.0, y: 0.86, size: 14, delay: 580 },
];

/** ひと瞬きの長さと、次の瞬きまでの間 */
const TWINKLE_MS = 900;
const TWINKLE_GAP = 700;

const GOLD = '#ffd46a';
const SILVER = '#fff3c9';

function OneTwinkle({ spec, color, box }: { spec: Twinkle; color: string; box: { w: number; h: number } }) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(t, {
          toValue: 1,
          duration: TWINKLE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE,
        }),
        Animated.delay(TWINKLE_GAP),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: NATIVE }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [t, spec.delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: spec.x * box.w - spec.size / 2,
        top: spec.y * box.h - spec.size / 2,
        /* 0→いちばん開く→0。行って戻るので、点いて消えるように見える */
        opacity: t.interpolate({ inputRange: [0, 0.25, 0.6, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { scale: t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.2, 1.15, 0.3] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '80deg'] }) },
        ],
      }}>
      <Icon name="twinkle" size={spec.size} color={color} />
    </Animated.View>
  );
}

/** カードのまわりで瞬く星。N には出さない */
export function PrizeTwinkles({ rarity }: { rarity: Rarity }) {
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  if (rarity === 'N') return null;
  const specs = rarity === 'SR' ? SR_TWINKLES : R_TWINKLES;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBox((p) =>
          Math.abs(p.w - width) < 2 && Math.abs(p.h - height) < 2
            ? p
            : { w: Math.round(width), h: Math.round(height) },
        );
      }}>
      {box.h > 0
        ? specs.map((s, i) => (
            <OneTwinkle key={i} spec={s} box={box} color={rarity === 'SR' ? GOLD : SILVER} />
          ))
        : null}
    </View>
  );
}

/* ———————————————— SRの、中心から伸びる光 ———————————————— */

const RAYS = 14;
/** 光の輪の直径。**カードより十分大きくしないと、光がカードの裏に
    隠れて何も見えない**（460では縁から少し覗くだけだった）。
    カードは幅300・高さ430ほどなので、その倍を目安にする */
const RAY_FIELD = 660;

/** カードの中心から光が伸びる。**SRだけ**。カードの後ろに敷く */
export function PrizeRays() {
  const spin = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: NATIVE,
      }),
    );
    /* 息をするようにゆっくり強弱を付ける。一定だと貼り紙に見える */
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
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
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: RAY_FIELD,
        height: RAY_FIELD,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {/* 芯。radial-gradient が無いので、薄い円を3枚重ねて代わりにする */}
      {[1, 0.62, 0.34].map((k, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: RAY_FIELD * 0.52 * k,
            height: RAY_FIELD * 0.52 * k,
            borderRadius: RAY_FIELD,
            backgroundColor: `rgba(255,214,120,${0.09 + i * 0.06})`,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.06] }) }],
          }}
        />
      ))}
      {/* 光の筋。箱ごと回して、根元を軸にする（→ 冒頭のメモ） */}
      <Animated.View
        style={{
          position: 'absolute',
          width: RAY_FIELD,
          height: RAY_FIELD,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.95] }),
          transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
        }}>
        {Array.from({ length: RAYS }, (_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: RAY_FIELD,
              height: RAY_FIELD,
              alignItems: 'center',
              transform: [{ rotate: `${(360 / RAYS) * i}deg` }],
            }}>
            {/* ▍1本を2枚重ねる
                単色の棒を1枚置くと、光ではなく**棒**に見える。
                太くて薄い1枚の上に、細くて濃い1枚を重ねると、
                縁がぼけて光の筋になる（ぼかしが使えないので、これで代用）。
                長さと太さは1本おきに変える——全部同じだと風車になる */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                width: i % 2 ? 14 : 26,
                height: RAY_FIELD * (i % 2 ? 0.44 : 0.5),
                backgroundColor: 'rgba(255,224,150,0.14)',
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                width: i % 2 ? 3 : 7,
                height: RAY_FIELD * (i % 2 ? 0.42 : 0.48),
                backgroundColor: i % 2 ? 'rgba(255,235,180,0.4)' : 'rgba(255,214,120,0.55)',
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
              }}
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
