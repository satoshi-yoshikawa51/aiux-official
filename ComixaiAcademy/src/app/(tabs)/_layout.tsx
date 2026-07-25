/* タブ。アイコンは絵文字で統一（アイコンフォントを足さない）

   絵文字を大きめに出すため、アイコンは高さを固定した箱に入れている。
   これをやらないと、絵文字の行高がタブバーの既定の高さを押し広げて
   下のラベルがはみ出し、切れて見える。
   バーの高さもホームインジケーター（下の安全領域）の分を足して確保する。 */
import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BW, C, FONT, T, TAB } from '@/theme';

function Icon({ char, focused }: { char: string; focused: boolean }) {
  return (
    <View style={{ height: TAB.icon, alignItems: 'center', justifyContent: 'center' }}>
      <Text
        style={{
          fontSize: 18,
          lineHeight: TAB.icon,
          textAlign: 'center',
          opacity: focused ? 1 : 0.4,
        }}>
        {char}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.accent,
        tabBarInactiveTintColor: T.muted,
        tabBarStyle: {
          backgroundColor: C.paper0,
          borderTopWidth: BW.bold,
          borderTopColor: C.ink900,
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
      <Tabs.Screen
        name="index"
        options={{ title: 'ホーム', tabBarIcon: ({ focused }) => <Icon char="🏠" focused={focused} /> }}
      />
      <Tabs.Screen
        name="learn"
        options={{ title: 'まなぶ', tabBarIcon: ({ focused }) => <Icon char="📚" focused={focused} /> }}
      />
      <Tabs.Screen
        name="badges"
        options={{ title: 'バッジ', tabBarIcon: ({ focused }) => <Icon char="🏅" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'せってい', tabBarIcon: ({ focused }) => <Icon char="⚙️" focused={focused} /> }}
      />
    </Tabs>
  );
}
