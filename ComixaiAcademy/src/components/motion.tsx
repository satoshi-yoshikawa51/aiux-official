/* ============================================================
   動きの部品。画面の切り替えと、出てくるものの「ポン」。

   ▍サイトと同じ気持ちよさにする
   サイトのトークナイザー（src/app/tokenizer/lab.tsx）は、チップが
   `scale(0.3) → 1.1 → 1` の 0.36秒で弾んで出る。しかも**新しく増えた
   ぶんだけ**、28msずつ遅らせて左から順に。あの跳ね方をそのまま移した。

   ▍ネイティブドライバはWebで効かない
   react-native-web の Animated はネイティブドライバを持たない。
   transform と opacity だけを動かしているので、
   `useNativeDriver` を切ってもWebで問題なく動く。
   ============================================================ */
import React from 'react';
import { Animated, Easing, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

const NATIVE = Platform.OS !== 'web';

/* ———————————————— 画面の切り替え ————————————————
   カードが差し替わったことを分からせる。**入りだけ**動かしている。
   出も動かすと、中身を差し替えるまでの待ちが要って、送りが重くなる。 */

export function SlideIn({
  children,
  /** どちら側から入るか */
  from = 'right',
  /** 動く量（px） */
  distance = 26,
  duration = 300,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  from?: 'right' | 'left' | 'bottom';
  distance?: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t, duration, delay]);

  const shift = t.interpolate({
    inputRange: [0, 1],
    outputRange: [from === 'left' ? -distance : distance, 0],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [from === 'bottom' ? { translateY: shift } : { translateX: shift }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/* ———————————————— ポンと出る ————————————————
   サイトの tok-pop と同じ形。0.3倍から始めて1.1倍まで行き過ぎ、
   1.0に戻る。**行き過ぎるところが「気持ちよさ」の正体**なので、
   ここを削らないこと。 */

export function PopIn({
  children,
  delay = 0,
  /** false のときは動かさずそのまま出す（すでに出ているものの再描画） */
  animate = true,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(animate ? 0 : 1)).current;

  React.useEffect(() => {
    if (!animate) return;
    const a = Animated.timing(t, {
      toValue: 1,
      duration: 360,
      delay,
      easing: Easing.out(Easing.back(2.4)),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t, delay, animate]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
          transform: [
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/* ———————————————— 値が変わったら跳ねる ————————————————
   数字が入れ替わったことを、数字そのものの動きで知らせる。
   トークン数のように**1文字打つたびに変わる**ものに使う。 */

export function Bump({
  value,
  children,
  style,
}: {
  /** これが変わるたびに跳ねる */
  value: number | string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(0)).current;
  const first = React.useRef(true);

  React.useEffect(() => {
    /* 最初の描画では跳ねない（画面に入った瞬間に全部が動くと騒がしい） */
    if (first.current) {
      first.current = false;
      return;
    }
    t.setValue(0);
    const a = Animated.timing(t, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [value, t]);

  return (
    <Animated.View
      style={[
        style,
        { transform: [{ scale: t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.28, 1] }) }] },
      ]}>
      {children}
    </Animated.View>
  );
}

/* ———————————————— 合格のスタンプ ————————————————
   通った瞬間に、傾いたスタンプが**上から降ってきて止まる**。
   マンガのコマに判子を押す感じ。止まってからは動かさない
   （ずっと動いていると、次に何をすればいいのかが見えなくなる）。 */

export function Stamp({
  children,
  /** 傾き（度） */
  tilt = -8,
  style,
}: {
  children: React.ReactNode;
  tilt?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.back(3)),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
            { rotate: `${tilt}deg` },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/** 動かないただの箱。条件で PopIn と入れ替えたいときに使う */
export function NoMotion({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
}
