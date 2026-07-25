/* タブ。黒地に白抜きのオリジナルアイコン（src/components/icons.tsx）。
   選択中は赤の丸ベタを敷く。

   アイコンとラベルの高さを固定し、バーの高さをその合計から決めている。
   ここが噛み合っていないとラベルの箱が潰れ、overflow:hidden で文字が切れる。
   バーの高さと下の内余白には安全領域（ホームインジケーター）も足す。 */
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon, type IconName } from '@/components/icons';
import { C, FONT, TAB } from '@/theme';

const SCREENS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'ホーム', icon: 'home' },
  { name: 'learn', title: 'まなぶ', icon: 'learn' },
  { name: 'badges', title: 'バッジ', icon: 'badges' },
  { name: 'settings', title: 'せってい', icon: 'settings' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
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
      {SCREENS.map((s) => (
        <Tabs.Screen
          key={s.name}
          name={s.name}
          options={{
            title: s.title,
            tabBarIcon: ({ focused }) => (
              <TabIcon name={s.icon} focused={focused} box={TAB.icon} glyph={TAB.glyph} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
