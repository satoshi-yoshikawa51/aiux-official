/* ============================================================
   チュートリアル中に「いま説明している場所」を黄色い枠で囲う。

   ▍タブと同じやり方をする
   座標を測ってオーバーレイを重ねる、はやらない（→ store/tutorial.tsx）。
   案内は**「いまどこを指しているか」という名前だけを配る**ので、
   囲われる側が自分の名前と見比べて、自分の番なら自分で枠を描く。
   画面が変わっても安全領域が変わっても狂わない。

   ▍ゆっくり点滅させる
   出しっぱなしだと「押すもの」に見えてしまい、赤（押せるもの）と
   ぶつかる。かといって速く点滅させると急かしているように見える。
   1.1秒かけて薄くなり、1.1秒かけて戻る——読んでいる邪魔をしない速さ。
   ============================================================ */
import React from 'react';
import { Animated, Easing, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { isSpot, useTutorial, type SpotName } from '@/store/tutorial';
import { BW, C, R } from '@/theme';

/** 片道の時間。往復で2.2秒 */
const PULSE_MS = 1100;
/** Webの Animated はネイティブドライバを持たない */
const NATIVE = Platform.OS !== 'web';

export function Spotlight({
  name,
  children,
  /** 枠の角の丸み。囲う相手に合わせる */
  radius = R.sm,
  /** 枠の位置。マイナスで外側に張り出す。既定は相手の枠線にぴったり重ねる */
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

  return (
    <View style={style}>
      {children}
      {on ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: inset,
            top: inset,
            right: inset,
            bottom: inset,
            borderWidth: BW.bold,
            borderColor: C.yellow400,
            borderRadius: radius,
            /* 完全には消さない。消える時間があると「点いていない枠」に
               見えて、どこの話か分からなくなる */
            opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
          }}
        />
      ) : null}
    </View>
  );
}
