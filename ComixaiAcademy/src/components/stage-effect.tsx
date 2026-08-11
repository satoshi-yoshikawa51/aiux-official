/* ============================================================
   SRの舞台に重ねる飾り。**舞台ごとに違う動き**をさせる。

   | 舞台 | 動き |
   |---|---|
   | サーバーの聖堂 | `streaks` 線状の光が下から上へ走る |
   | 雲海の上の教室 | `pika` その場でチカチカ瞬く暖かい光 |
   | 金インクの原稿の中 | `burst` 中央から手前へ放射状に、出ては消える |

   ▍同じ動きを色替えで配らない
   最初は3つとも「粒がゆっくり流れる」で、色だけ変えていた。当てた側から
   すると**同じものが3回出てくる**のと変わらない。動きそのものを変える。

   ▍写実的な絵に、記号を載せない
   アイコンの星や塗りの四角は、写真のような絵の上では漫画記号として浮く。
   使うのは**中心が明るく、すぐ外で消える円**（放射グラデーションを1つ
   定義して使い回す）と、**両端が消える線**だけ。縁取りも影も置かない。

   ▍またたきは「粒ごと」に見えないといけない
   層まるごとの不透明度で瞬かせると、**その層が一斉に暗くなる**ので
   「絵が薄くなって消えていく」ように見えてしまう（一度やって戻した）。
   小さな組に分けて、組ごとに違う周期・違う出だしで光らせる。

   ▍動かしかた
   値は Animated.Value を数本だけ。**中身は静止したまま、まとめて動かす**
   （粒の数だけアニメを持たせない）。移動・拡大・不透明度だけなので
   useNativeDriver が効き、JS側は毎フレーム何もしない。

   ▍アプリが後ろに回ったら止める
   ホームは常駐画面なので、動かしっぱなしは電池を食う。
   **止めたあとは値を0に戻してから回し直す**——Animated.loop は各周で
   開始時の値まで戻すので、終端で止めるとその後ずっと動かなくなる。

   ▍NとRには飾りを置かない
   レア度は「画面に増える要素の数」で見せている（→ README）。
   ============================================================ */
import React from 'react';
import { Animated, AppState, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, RadialGradient, Stop } from 'react-native-svg';

import type { StageTheme } from '@/data/gacha';

type EffectName = NonNullable<StageTheme['effect']>;

/** 0〜1の決まった散らばり。Math.random だと描き直すたびに配置が変わる */
const fract = (v: number) => v - Math.floor(v);
const jitter = (i: number, salt: number) => fract(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453);

/** 一定の速さで 0→1 を回し続ける。delay は出だしをずらすため（1回だけ効く） */
function useLoop(sec: number, delayMs = 0) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const start = () => {
      anim?.stop();
      /* 止めた位置から再開しない。Animated.loop は各周でこの値まで戻すので、
         終端で止まっていると 1→1 のアニメになり、以降ずっと動かない */
      t.setValue(0);
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
    timer = setTimeout(start, delayMs);
    /* iOSは通知バナーや App スイッチャーでも inactive を送ってくる。
       止めるのは本当に背面へ回ったときだけ */
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') start();
      else if (s === 'background') anim?.stop();
    });
    return () => {
      if (timer) clearTimeout(timer);
      anim?.stop();
      sub.remove();
    };
  }, [t, sec, delayMs]);
  return t;
}

/** グラデーションのidは画面内で重複させない */
let uid = 0;
const useGid = (p: string) => React.useMemo(() => `${p}${(uid += 1)}`, [p]);

/** 中心が明るく、すぐ外で消える円。なだらかに広げると薄い染みになる */
function Dot({ id, color, alpha }: { id: string; color: string; alpha: number }) {
  return (
    <RadialGradient id={id} cx="50%" cy="50%" r="50%">
      <Stop offset="0" stopColor={color} stopOpacity={alpha} />
      <Stop offset="0.22" stopColor={color} stopOpacity={alpha * 0.92} />
      <Stop offset="0.42" stopColor={color} stopOpacity={alpha * 0.35} />
      <Stop offset="1" stopColor={color} stopOpacity={0} />
    </RadialGradient>
  );
}

/* ============================================================
   streaks — サーバーの聖堂
   線状の光が下から上へ走る。速さの違う3本立てで、奥行きを出す。
   線は**両端が消える**（真ん中だけ明るい）ので、棒に見えない。
   ============================================================ */
const STREAKS = [
  { n: 16, len: [26, 64], w: 1.6, color: '#ffffff', alpha: 0.95, sec: 5.5 },
  { n: 20, len: [16, 40], w: 1.3, color: '#8fe0ff', alpha: 0.85, sec: 8.5 },
  { n: 22, len: [8, 22], w: 1, color: '#3aa8e6', alpha: 0.6, sec: 14 },
];

function StreakLayer({
  spec,
  w,
  h,
  salt,
}: {
  spec: (typeof STREAKS)[number];
  w: number;
  h: number;
  salt: number;
}) {
  const t = useLoop(spec.sec);
  const gid = useGid('st');
  const lines = React.useMemo(
    () =>
      Array.from({ length: spec.n }, (_, i) => ({
        x: jitter(i, salt + 1) * w,
        y: jitter(i, salt + 2) * h,
        len: spec.len[0] + jitter(i, salt + 3) * (spec.len[1] - spec.len[0]),
      })),
    [spec.n, spec.len, w, h, salt],
  );
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -h] });
  return (
    <Animated.View
      style={{ position: 'absolute', width: w, height: h * 2, transform: [{ translateY }] }}>
      <Svg width={w} height={h * 2}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={spec.color} stopOpacity={0} />
            <Stop offset="0.45" stopColor={spec.color} stopOpacity={spec.alpha} />
            <Stop offset="0.62" stopColor={spec.color} stopOpacity={spec.alpha} />
            <Stop offset="1" stopColor={spec.color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {lines.map((l, i) => (
          <React.Fragment key={i}>
            <Rect x={l.x} y={l.y} width={spec.w} height={l.len} rx={spec.w / 2} fill={`url(#${gid})`} />
            {/* 折り返し用の2枚目 */}
            <Rect
              x={l.x}
              y={l.y + h}
              width={spec.w}
              height={l.len}
              rx={spec.w / 2}
              fill={`url(#${gid})`}
            />
          </React.Fragment>
        ))}
      </Svg>
    </Animated.View>
  );
}

function Streaks({ w, h }: { w: number; h: number }) {
  return (
    <>
      {STREAKS.map((s, i) => (
        <StreakLayer key={i} spec={s} w={w} h={h} salt={i * 7} />
      ))}
    </>
  );
}

/* ============================================================
   pika — 雲海の上の教室
   流れない。その場でチカチカ光る。**小さな組に分けて**、組ごとに
   違う周期・違う出だしにすることで、粒が個別に瞬いて見える。
   ============================================================ */
const PIKA_GROUPS = 12;
const PIKA_PER = 5;
/* 明るい空の上では白い粒が飛ぶ。**濃い金を混ぜて**、雲の上でも粒が立つように */
const PIKA_COLORS = ['#ffffff', '#ffe9c0', '#e8a13c', '#fff6dd', '#d98f1f', '#ffd48a'];

function PikaGroup({ w, h, g }: { w: number; h: number; g: number }) {
  /* 周期も出だしもバラバラにする。揃うと画面全体が明滅してしまう */
  const sec = 2.4 + jitter(g, 11) * 3.4;
  const t = useLoop(sec, Math.round(jitter(g, 12) * 2600));
  const gid = useGid('pk');
  const color = PIKA_COLORS[g % PIKA_COLORS.length];
  const dots = React.useMemo(
    () =>
      Array.from({ length: PIKA_PER }, (_, i) => {
        const k = g * PIKA_PER + i;
        return {
          x: jitter(k, 21) * w,
          y: jitter(k, 22) * h,
          r: 1.5 + jitter(k, 23) * 3.2,
        };
      }),
    [w, h, g],
  );
  /* ▍山は広く取る
     鋭く尖らせると「光っている時間」が周期の1割ほどしかなく、組の数だけ
     用意しても**同時に光っているのは1組**になって、画面がほぼ消えて見える。
     山を広く・谷を浅くして、常に3〜4組が光っている状態にする */
  const opacity = t.interpolate({
    inputRange: [0, 0.18, 0.38, 0.62, 0.82, 1],
    outputRange: [0.12, 0.45, 1, 1, 0.45, 0.12],
  });
  const scale = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1.25, 0.7],
  });
  return (
    <Animated.View
      style={{ position: 'absolute', width: w, height: h, opacity, transform: [{ scale }] }}>
      <Svg width={w} height={h}>
        <Defs>
          <Dot id={gid} color={color} alpha={1} />
          {/* ▍光条（十字のフレア）
              明るい空の上では丸い粒が沈む。**強い光がレンズに作る筋**を
              足すと、同じ明るさでも「光っている」と読める。
              記号の星とは別物——両端が消える細い線を2本、交差させるだけ */}
          <LinearGradient id={`${gid}f`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="0.5" stopColor={color} stopOpacity={0.85} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id={`${gid}g`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="0.5" stopColor={color} stopOpacity={0.85} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {dots.map((d, i) => {
          const fl = d.r * 9;
          return (
            <React.Fragment key={i}>
              {/* 大きい粒にだけ光条を付ける。全部に付けると賑やかすぎる */}
              {d.r > 2.6 ? (
                <>
                  <Rect
                    x={d.x - fl / 2}
                    y={d.y - 0.6}
                    width={fl}
                    height={1.2}
                    fill={`url(#${gid}f)`}
                  />
                  <Rect
                    x={d.x - 0.6}
                    y={d.y - fl / 2}
                    width={1.2}
                    height={fl}
                    fill={`url(#${gid}g)`}
                  />
                </>
              ) : null}
              <Circle cx={d.x} cy={d.y} r={d.r * 3.1} fill={`url(#${gid})`} />
            </React.Fragment>
          );
        })}
      </Svg>
    </Animated.View>
  );
}

function Pika({ w, h }: { w: number; h: number }) {
  return (
    <>
      {Array.from({ length: PIKA_GROUPS }, (_, g) => (
        <PikaGroup key={g} w={w} h={h} g={g} />
      ))}
    </>
  );
}

/* ============================================================
   burst — 金インクの原稿の中（目玉）
   中央から手前へ、金の粒が放射状に出ては消える。
   1波＝粒のかたまりを1つの View に入れ、**まとめて拡大しながら
   消す**。出だしをずらした波を重ねると、途切れずに噴き続ける。
   ============================================================ */
const WAVES = 6;
const WAVE_SEC = 3.6;
const WAVE_DOTS = 26;
/* 紙が白い絵なので、明るい金だけだと飛ぶ。濃い金を半分入れる */
const BURST_COLORS = ['#fffaf0', '#ffe1a0', '#d99b1f', '#a86f12'];

function Wave({ size, i }: { size: number; i: number }) {
  const t = useLoop(WAVE_SEC, Math.round((WAVE_SEC * 1000 * i) / WAVES));
  const gid = useGid('bs');
  const dots = React.useMemo(() => {
    const c = size / 2;
    return Array.from({ length: WAVE_DOTS }, (_, k) => {
      const a = (jitter(k, i * 3 + 31) + k / WAVE_DOTS) * Math.PI * 2;
      /* 手前ほど散るので、距離は二乗で散らす */
      const d = (0.18 + jitter(k, i * 3 + 32) ** 2 * 0.3) * size;
      return {
        x: c + Math.cos(a) * d,
        y: c + Math.sin(a) * d * 0.82,
        r: 1.2 + jitter(k, i * 3 + 33) * 2.8,
        c: BURST_COLORS[k % BURST_COLORS.length],
      };
    });
  }, [size, i]);
  /* 手前へ来るほど大きく、端で消える */
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.22, 2.7] });
  const opacity = t.interpolate({
    inputRange: [0, 0.1, 0.55, 1],
    outputRange: [0, 1, 0.75, 0],
  });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        opacity,
        transform: [{ scale }],
      }}>
      <Svg width={size} height={size}>
        <Defs>
          {BURST_COLORS.map((c, k) => (
            <Dot key={k} id={`${gid}-${k}`} color={c} alpha={1} />
          ))}
        </Defs>
        {dots.map((d, k) => (
          <Circle
            key={k}
            cx={d.x}
            cy={d.y}
            r={d.r * 3.1}
            fill={`url(#${gid}-${BURST_COLORS.indexOf(d.c)})`}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** レンズを横切る光。目玉の舞台だけに置く */
function Sweep({ w, h }: { w: number; h: number }) {
  const t = useLoop(11);
  const gid = useGid('sw');
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
            <Stop offset="0" stopColor="#ffd98a" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#ffd98a" stopOpacity={0.22} />
            <Stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={bw} height={bh} fill={`url(#${gid})`} />
      </Svg>
    </Animated.View>
  );
}

function Burst({ w, h }: { w: number; h: number }) {
  /* 噴き出す中心。真ん中より少し上——キャラの頭の向こうから来るように */
  const size = Math.round(Math.max(w, h) * 1.15);
  return (
    <>
      <View
        style={{
          position: 'absolute',
          left: Math.round(w / 2 - size / 2),
          top: Math.round(h * 0.4 - size / 2),
          width: size,
          height: size,
        }}>
        {Array.from({ length: WAVES }, (_, i) => (
          <Wave key={i} size={size} i={i} />
        ))}
      </View>
      <Sweep w={w} h={h} />
    </>
  );
}

export function StageEffect({ effect }: { effect: EffectName }) {
  const [box, setBox] = React.useState({ w: 0, h: 0 });
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
          {effect === 'streaks' ? <Streaks w={box.w} h={box.h} /> : null}
          {effect === 'pika' ? <Pika w={box.w} h={box.h} /> : null}
          {effect === 'burst' ? <Burst w={box.w} h={box.h} /> : null}
        </>
      ) : null}
    </View>
  );
}

/* ———— SRの縁の光 ————
   レア度を**絵の出来に頼らず**分かるようにする層。
   四隅に太い玉を置くと写実的な絵の上で浮くので、
   **髪の毛ほどの線と、四隅の短い鉤**だけにする。 */
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
