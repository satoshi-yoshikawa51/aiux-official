/* ============================================================
   SRの舞台に重ねる飾り。**動く光の粒**と、コマの縁の光。

   ▍写実的な絵に、記号を載せない
   最初はアイコンの星と塗りの四角を散らしていたが、写真のような絵の上では
   それだけが漫画記号として浮き、幼く見えた。**写真に写る光**——ピントの
   外れた玉ボケ、空気中の塵、レンズを横切る光——に寄せて作り直した。
   決まりは3つ:
   ・小さく（1〜4px）、大きいものは**薄く**（不透明度0.1前後の玉ボケ）
   ・輪郭を作らない（中心が明るく外へ消える円。react-native-svg の放射
     グラデーションを1つ定義して、粒はそれを使い回す）
   ・縁取りも影も置かない

   ▍動かす（1本の値で層ごと流す）
   層ごとに Animated.Value を1つだけ持ち、**中身は静止したまま層ごと
   動かす**。粒の数だけアニメを持たせない。移動と不透明度だけなので
   useNativeDriver が効き、JS側は毎フレーム何もしない。

   継ぎ目を消すために、粒は**上下2枚ぶん**敷いて層の高さを2倍に取り、
   ちょうど1枚ぶん動かして折り返す。速さの違う層を重ねると奥行きが出る。

   ▍アプリが後ろに回ったら止める
   ホームは常駐画面なので、動かしっぱなしは電池を食う。AppState を見て、
   背面に回っているあいだはループを止める。

   ▍NとRには飾りを置かない
   レア度は「画面に増える要素の数」で見せている（→ README）。
   雨・雪・花びらは、色を重ねるだけのテーマを引退させたときに一緒に消した。
   ============================================================ */
import React from 'react';
import { Animated, AppState, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { StageTheme } from '@/data/gacha';

type EffectName = NonNullable<StageTheme['effect']>;

/** 0〜1の決まった散らばり。Math.random だと描き直すたびに配置が変わる */
const fract = (v: number) => v - Math.floor(v);
const jitter = (i: number, salt: number) => fract(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453);

interface LayerSpec {
  /** 粒の数（見えている範囲ぶん。実際はこの2倍を敷く） */
  n: number;
  /** 半径の下限・上限(px) */
  r: [number, number];
  color: string;
  /** 中心の不透明度。大きい粒ほど薄くする */
  alpha: number;
  /** 1周にかける秒数。長いほど奥に見える */
  sec: number;
  /** 1で上へ、-1で下へ流れる */
  dir: 1 | -1;
  /** 横揺れの幅(px)。0で真っ直ぐ */
  sway: number;
}

interface Spec {
  layers: LayerSpec[];
  /** レンズを横切る光。目玉の舞台だけに置く */
  sweep?: { color: string; sec: number };
}

const SPEC: Record<EffectName, Spec> = {
  /* ▍金箔（目玉の「金インクの原稿の中」）
     いちばん豪華な飾り。塵・箔・玉ボケの3層に、横切る光を足す。
     金は彩度を上げると安っぽくなるので、白に寄せた金で光らせる */
  kinpaku: {
    layers: [
      /* 白に寄せた塵。暗いところで光る */
      { n: 26, r: [1, 2.4], color: '#fff6e2', alpha: 0.9, sec: 13, dir: 1, sway: 7 },
      /* **濃い金**。この絵は紙が白いので、明るい粒だけだと飛んでしまう。
         明暗どちらの上でも粒が立つように、濃いほうを1層かませる */
      { n: 16, r: [1.4, 3.2], color: '#c8901f', alpha: 0.62, sec: 18, dir: 1, sway: 10 },
      { n: 12, r: [2.4, 4.6], color: '#f0c268', alpha: 0.42, sec: 25, dir: 1, sway: 13 },
      /* 玉ボケ。いちばん大きく、いちばん薄い */
      { n: 8, r: [10, 21], color: '#ffe6ab', alpha: 0.16, sec: 36, dir: 1, sway: 5 },
    ],
    sweep: { color: '#ffd98a', sec: 11 },
  },
  /* ▍光の粒（サーバーの聖堂）。冷たく、まばらに、ゆっくり昇る */
  motes: {
    layers: [
      { n: 20, r: [0.8, 1.8], color: '#dff3ff', alpha: 0.7, sec: 17, dir: 1, sway: 5 },
      { n: 6, r: [7, 15], color: '#7ecbff', alpha: 0.11, sec: 31, dir: 1, sway: 3 },
    ],
  },
  /* ▍きらめき（雲海の上の教室）。陽の中の塵なので、ゆっくり降りる */
  kira: {
    layers: [
      { n: 22, r: [1, 2.2], color: '#fff3d9', alpha: 0.7, sec: 19, dir: -1, sway: 8 },
      { n: 6, r: [10, 20], color: '#ffeec9', alpha: 0.12, sec: 33, dir: -1, sway: 4 },
    ],
  },
};

/** 一定の速さで 0→1 を回し続ける。背面に回っているあいだは止める */
function useLoop(sec: number) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    const start = () => {
      anim?.stop();
      anim = Animated.loop(
        Animated.timing(t, {
          toValue: 1,
          duration: sec * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      anim.start();
    };
    start();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') start();
      else anim?.stop();
    });
    return () => {
      anim?.stop();
      sub.remove();
    };
  }, [t, sec]);
  return t;
}

/** グラデーションのidは画面内で重複させない */
let uid = 0;

function Layer({ spec, w, h, salt }: { spec: LayerSpec; w: number; h: number; salt: number }) {
  const t = useLoop(spec.sec);
  const gid = React.useMemo(() => `sg${(uid += 1)}`, []);

  const dots = React.useMemo(
    () =>
      Array.from({ length: spec.n }, (_, i) => ({
        x: jitter(i, salt + 1) * w,
        y: jitter(i, salt + 2) * h,
        r: spec.r[0] + jitter(i, salt + 3) * (spec.r[1] - spec.r[0]),
      })),
    [spec.n, spec.r, w, h, salt],
  );

  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: spec.dir > 0 ? [0, -h] : [-h, 0],
  });
  const translateX = t.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, spec.sway, 0, -spec.sway, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h * 2,
        transform: [{ translateY }, { translateX }],
      }}>
      <Svg width={w} height={h * 2}>
        <Defs>
          {/* 中心が明るく、外へ消える。輪郭を作らないための1枚 */}
          <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={spec.color} stopOpacity={spec.alpha} />
            <Stop offset="0.4" stopColor={spec.color} stopOpacity={spec.alpha * 0.45} />
            <Stop offset="1" stopColor={spec.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {dots.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={d.r * 2.4} fill={`url(#${gid})`} />
        ))}
        {/* 折り返し用の2枚目。1枚ぶん動かしたとき、ここが同じ絵になる */}
        {dots.map((d, i) => (
          <Circle key={`b${i}`} cx={d.x} cy={d.y + h} r={d.r * 2.4} fill={`url(#${gid})`} />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** レンズを横切る光。斜めの帯がゆっくり流れて、端で消える */
function Sweep({ color, sec, w, h }: { color: string; sec: number; w: number; h: number }) {
  const t = useLoop(sec);
  const gid = React.useMemo(() => `sw${(uid += 1)}`, []);
  const bw = Math.max(60, Math.round(w * 0.5));
  const bh = Math.round(h * 1.8);
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [-bw, w + bw] });
  const opacity = t.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [0, 0.9, 1, 0.9, 0],
  });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        top: -h * 0.4,
        width: bw,
        height: bh,
        opacity,
        transform: [{ translateX }, { rotate: '16deg' }],
      }}>
      <Svg width={bw} height={bh}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="0.5" stopColor={color} stopOpacity={0.22} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={bw} height={bh} fill={`url(#${gid})`} />
      </Svg>
    </Animated.View>
  );
}

export function StageEffect({ effect }: { effect: EffectName }) {
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const spec = SPEC[effect];
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        /* 1〜2pxの揺れで作り直さない（粒の配置がチラつく） */
        setBox((p) =>
          Math.abs(p.w - width) < 2 && Math.abs(p.h - height) < 2
            ? p
            : { w: Math.round(width), h: Math.round(height) },
        );
      }}>
      {box.h > 0 ? (
        <>
          {spec.layers.map((l, i) => (
            <Layer key={i} spec={l} w={box.w} h={box.h} salt={i * 5} />
          ))}
          {spec.sweep ? <Sweep {...spec.sweep} w={box.w} h={box.h} /> : null}
        </>
      ) : null}
    </View>
  );
}

/* ———— SRの縁の光 ————
   レア度を**絵の出来に頼らず**分かるようにする層。
   もとは四隅に太い玉を置いていたが、これも写実的な絵の上では浮いた。
   **髪の毛ほどの線と、四隅の短い鉤**だけにして、光は角に寄せる。 */
const GLOW: Record<NonNullable<StageTheme['glow']>, { line: string; edge: string }> = {
  gold: { line: 'rgba(255,226,150,0.42)', edge: 'rgba(255,214,120,0.95)' },
  cyan: { line: 'rgba(190,235,255,0.38)', edge: 'rgba(150,220,255,0.9)' },
};

const BRACKET = 22;
const HAIR = 1;

export function StageGlow({ glow }: { glow: NonNullable<StageTheme['glow']> }) {
  const c = GLOW[glow];
  const corners = [
    { top: 4, left: 4 },
    { top: 4, right: 4 },
    { bottom: 4, left: 4 },
    { bottom: 4, right: 4 },
  ];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          left: 4,
          right: 4,
          top: 4,
          bottom: 4,
          borderWidth: HAIR,
          borderColor: c.line,
          borderRadius: 3,
        }}
      />
      {corners.map((pos, i) => (
        <React.Fragment key={i}>
          <View
            style={{
              position: 'absolute',
              ...pos,
              width: BRACKET,
              height: HAIR + 0.5,
              backgroundColor: c.edge,
            }}
          />
          <View
            style={{
              position: 'absolute',
              ...pos,
              width: HAIR + 0.5,
              height: BRACKET,
              backgroundColor: c.edge,
            }}
          />
        </React.Fragment>
      ))}
    </View>
  );
}
