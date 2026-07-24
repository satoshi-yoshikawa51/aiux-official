/* タブ。アイコンは絵文字で統一（アイコンフォントを足さない） */
import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { BW, C, FONT, T } from '@/theme';

function Icon({ char, focused }: { char: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.4 }}>{char}</Text>
    </View>
  );
}

export default function TabsLayout() {
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
        },
        tabBarLabelStyle: { fontFamily: FONT.heading, fontSize: 11 },
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
