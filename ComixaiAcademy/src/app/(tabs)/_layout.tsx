/* タブ。黒地に白抜きのオリジナルアイコン（src/components/icons.tsx）。
   選択中は赤の丸ベタを敷く。

   アイコンとラベルの高さを固定し、バーの高さをその合計から決めている。
   ここが噛み合っていないとラベルの箱が潰れ、overflow:hidden で文字が切れる。
   バーの高さと下の内余白には安全領域（ホームインジケーター）も足す。

   チュートリアルもここに住む。タブの外側に置くと、案内の吹き出しが
   タブ切り替えのたびに消えてしまうため。 */
import { Tabs } from 'expo-router';
import React from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon, type IconName } from '@/components/icons';
import { useSparkBurst } from '@/components/motion';
import { TutorialOverlay } from '@/components/tutorial-overlay';
import { useProgress } from '@/store/progress';
import { TutorialProvider, useTutorial } from '@/store/tutorial';
import { C, FONT, TAB } from '@/theme';

const SCREENS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'ホーム', icon: 'home' },
  { name: 'learn', title: 'まなぶ', icon: 'learn' },
  { name: 'badges', title: 'バッジ', icon: 'badges' },
  { name: 'settings', title: 'せってい', icon: 'settings' },
];

function Bar() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { state, ready } = useProgress();
  const { active, step, start, next } = useTutorial();
  const burst = useSparkBurst();

  /* ▍タブだけは、押した座標を計算で出している
     ほかの押せるものは指の座標（pageX/pageY）をそのまま使えるが、
     タブの中身は react-navigation が描いていて触れない。
     tabBarButton を差し替える手もあるが、**このバーは高さの計算が
     噛み合っていないとラベルが切れる**ので触りたくない。
     等分に並んでいるぶん、位置は素直に割り出せる */
  const tabSpark = (i: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const x = (width / SCREENS.length) * (i + 0.5);
    const y = height - insets.bottom - TAB.height / 2;
    burst(x, y, 1.1);
  };

  /* 職種まで決め終わった直後、1回だけ案内を出す。
     見終わったときの保存は TutorialProvider の onFinish 側 */
  const startedRef = React.useRef(false);
  React.useEffect(() => {
    if (!ready || startedRef.current) return;
    if (state.roleId && !state.seenTutorial) {
      startedRef.current = true;
      start();
    }
  }, [ready, state.roleId, state.seenTutorial, start]);

  return (
    /* ▍画面の端で切る
       案内の光は枠の外へ飛ぶので、切らないと画面からはみ出す。
       はみ出したぶんだけ**モバイルのブラウザがページごとズームアウトする**
       （オープニングで実測：innerWidth が 390 → 472 に膨らんだ）。
       端まで届いた光はそこで切れるだけなので、見た目の実害は無い */
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          /* 黒地なので、選択中は白・非選択は灰にする（赤は黒の上で沈む） */
          tabBarActiveTintColor: C.paper0,
          tabBarInactiveTintColor: C.ink300,
          tabBarStyle: {
            backgroundColor: C.ink900,
            borderTopWidth: 0,
            elevation: 0,
            height: TAB.height + insets.bottom,
            paddingTop: TAB.pad,
            paddingBottom: insets.bottom + TAB.pad,
          },
          /* 項目の既定の内余白を消して、上の計算どおりの高さを使い切る */
          tabBarItemStyle: { paddingVertical: 0 },
          tabBarIconStyle: { height: TAB.icon },
          tabBarLabelStyle: { fontFamily: FONT.heading, fontSize: 10.5, lineHeight: TAB.label },
        }}>
        {SCREENS.map((s, i) => (
          <Tabs.Screen
            key={s.name}
            name={s.name}
            listeners={{ tabPress: () => tabSpark(i) }}
            options={{
              title: s.title,
              tabBarIcon: ({ focused }) => (
                <TabIcon
                  name={s.icon}
                  focused={focused}
                  box={TAB.icon}
                  glyph={TAB.glyph}
                  /* 案内中の「いま見てほしいタブ」だけ光る。
                     座標を測らず、光る側が自分で判断する */
                  glow={active && step?.glow === s.icon}
                />
              ),
            }}
          />
        ))}
      </Tabs>

      {/* ▍案内中は画面を止めて、触ったら次へ進むようにする

          止めないと、**光っているボタンをそのまま押せてしまう**。
          実際に2歩目でホームの「はじめる（3分・クイズ2問）」を押せて、
          レッスンに飛んで案内が途切れていた。指し示しているものを
          押させないのは、案内としては当たり前の作法。

          ただし「押しても何も起きない」だと固まったように見えるので、
          **どこを触っても次へ進む**（送りのボタンと同じ）。
          パネルはこれより後に描いているので、とばす／つぎへは効く。 */}
      {active ? <Pressable style={StyleSheet.absoluteFill} onPress={next} /> : null}

      <TutorialOverlay />
    </View>
  );
}

export default function TabsLayout() {
  const { markTutorialSeen } = useProgress();
  return (
    <TutorialProvider onFinish={markTutorialSeen}>
      <Bar />
    </TutorialProvider>
  );
}
