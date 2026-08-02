/* ============================================================
   チュートリアル中に「いま説明している場所」を光らせる。

   ▍タブと同じやり方をする
   座標を測ってオーバーレイを重ねる、はやらない（→ store/tutorial.tsx）。
   案内は**「いまどこを指しているか」という名前だけを配る**ので、
   囲われる側が自分の名前と見比べて、自分で光る。
   画面が変わっても安全領域が変わっても狂わない。

   ▍細い枠1本では見えない
   最初は枠を1本だけ点滅させたが、**紙の上でも黒いカセットの上でも
   まるで目立たなかった**。枠は「線」なので、面積が無く、
   薄くなった瞬間に背景に沈む。

   なので光を4枚重ねてある：

     1. にじみ（boxShadow）  外へ広がるぼけた光。いちばん「ホワン」する
     2. 外の輪（10px幅・薄い） にじみが出ない端末でも面積を稼ぐ保険
     3. 内の輪（6px幅・濃い）  輪郭をはっきりさせる
     4. 芯の枠（太線・不透明） ここが囲いの本体。**消えない**

   1〜3はまとめて呼吸させる（透明度と大きさを同時に動かす）。
   4だけは薄くなりきらないので、いちばん暗い瞬間でも囲いが読める。

   ▍にじみを当てにしない
   boxShadow は RN 0.76 から iOS/Android でも効くが、旧アーキテクチャや
   端末によっては出ないことがある。**出なくても2と3で成立する**ように
   組んであるので、にじみが消えても「光っていない」ことにはならない。
   ============================================================ */
import React from 'react';
import { Animated, Easing, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { isSpot, useTutorial, type SpotName } from '@/store/tutorial';
import { BW, C, R } from '@/theme';

/** 片道の時間。往復1.8秒で「ホワン、ホワン」くらいの速さ */
const PULSE_MS = 900;
/** Webの Animated はネイティブドライバを持たない */
const NATIVE = Platform.OS !== 'web';

/** 黄色を透かして使う。C.yellow400 と同じ色 */
const glow = (a: number) => `rgba(255, 210, 63, ${a})`;

export function Spotlight({
  name,
  children,
  /** 枠の角の丸み。囲う相手に合わせる */
  radius = R.sm,
  /** 芯の枠の位置。マイナスで外側に張り出す */
  inset = 0,
  style,
}: {
  name: SpotName;
  children: React.ReactNode;
  radius?: number;
  inset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { step } = useTutorial();
  const on = isSpot(step, name);

  const t = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!on) return;
    t.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 0,
          duration: PULSE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(t, {
          toValue: 1,
          duration: PULSE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [on, t]);

  if (!on) return <View style={style}>{children}</View>;

  /** 外側へ o だけ張り出した輪 */
  const ring = (o: number, width: number, alpha: number): ViewStyle => ({
    position: 'absolute',
    left: -o,
    right: -o,
    top: -o,
    bottom: -o,
    borderRadius: radius + o,
    borderWidth: width,
    borderColor: glow(alpha),
  });

  return (
    <View style={style}>
      {children}

      {/* ———— 呼吸する光 ————
           透明度と大きさを一緒に動かすと、明滅ではなく**膨らんで見える** */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: inset,
          top: inset,
          right: inset,
          bottom: inset,
          borderRadius: radius,
          /* にじみ。ここがいちばん「ホワン」する。
             出ない端末があるので、下の2枚の輪で保険をかけてある */
          boxShadow: `0px 0px 22px 8px ${glow(0.9)}`,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) }],
        }}>
        <View pointerEvents="none" style={ring(11, 11, 0.3)} />
        <View pointerEvents="none" style={ring(4, 6, 0.55)} />
      </Animated.View>

      {/* ———— 芯の枠 ————
           ここは**消し切らない**。全部が薄くなる瞬間があると、
           「点いていない枠」に見えてどこの話か分からなくなる */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: inset,
          top: inset,
          right: inset,
          bottom: inset,
          borderRadius: radius,
          borderWidth: BW.bold,
          borderColor: C.yellow400,
          /* ごく薄く面を敷く。線だけだと、白い紙の上で細く見える */
          backgroundColor: glow(0.1),
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
        }}
      />
    </View>
  );
}
