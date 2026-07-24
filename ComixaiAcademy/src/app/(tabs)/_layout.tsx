/* タブ。アイコンは絵文字で統一（アイコンフォントを足さない） */
import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { T } from '@/theme';

function Icon({ char, focused }: { char: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{char}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.accent,
        tabBarInactiveTintColor: T.muted,
        tabBarStyle: { backgroundColor: T.surface, borderTopColor: T.borderSoft },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
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
