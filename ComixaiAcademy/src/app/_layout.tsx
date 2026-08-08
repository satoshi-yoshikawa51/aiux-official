/* ルートレイアウト。フォント読み込み・進捗ストア・オンボーディングの振り分け。 */
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SparkLayer } from '@/components/motion';
import { ProgressProvider, useProgress } from '@/store/progress';
import { C, FONT, T } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** オープニング → アバター → 職種、が決まるまでは先に進ませない */
function OnboardingGate({ ready: fontsReady, children }: { ready: boolean; children: React.ReactNode }) {
  const { state, ready } = useProgress();
  const segments = useSegments() as string[];
  const router = useRouter();

  React.useEffect(() => {
    if (!ready || !fontsReady) return;
    SplashScreen.hideAsync().catch(() => {});

    const inOpening = segments[0] === 'opening';
    const inOnboarding = segments[0] === 'onboarding';
    /* 初回だけ絵巻を見せる。ここでアバターのGLBを先読みするので、
       飛ばしてもホームで待たされない（opening.tsx を参照） */
    if (!state.seenOpening) {
      if (!inOpening) router.replace('/opening');
    } else if (inOpening) {
      router.replace(state.avatarId ? '/' : '/onboarding/avatar');
    } else if (!state.avatarId) {
      if (segments[1] !== 'avatar') router.replace('/onboarding/avatar');
    } else if (!state.roleId) {
      if (segments[1] !== 'role') router.replace('/onboarding/role');
    } else if (inOnboarding) {
      router.replace('/');
    }
  }, [ready, fontsReady, state.seenOpening, state.avatarId, state.roleId, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  /* サイトと同じ書体。日本語フォントはサブセット済み（tools/subset-fonts.mjs） */
  const [fontsReady] = useFonts({
    [FONT.body]: require('@/assets/fonts/ZenKakuGothicNew-Regular.ttf'),
    [FONT.heading]: require('@/assets/fonts/ZenKakuGothicNew-Bold.ttf'),
    [FONT.display]: require('@/assets/fonts/ZenKakuGothicNew-Black.ttf'),
    [FONT.hand]: require('@/assets/fonts/YuseiMagic-Regular.ttf'),
    [FONT.mono]: require('@/assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProgressProvider>
          {/* ボタンを押したときの星は、ここが全画面ぶんまとめて描く。
              ボタンの中で描くと、押した拍子に画面が切り替わる／ボタンが
              作り直されるたびに星まで消えてしまう（motion.tsx を参照）。
              ※ ミニゲームは Modal＝別の窓なので、あちらは自前で層を持つ */}
          <SparkLayer>
          <OnboardingGate ready={fontsReady}>
            {/* どの画面も上端は黒ベタ（帯 or Stackのヘッダー）なので、
                ステータスバーの文字は白でないと読めない */}
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                /* レッスンの帯。タブの画面が Screen の header で出しているものと
                   同じ役目を、こちらは Stack のヘッダーが持つ（→ ui.tsx の ScreenHead） */
                headerStyle: { backgroundColor: C.ink900 },
                headerTintColor: C.paper50,
                headerTitleStyle: { fontFamily: FONT.display, fontSize: 16, color: C.paper50 },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: T.bg },
              }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="opening" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/avatar" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/role" options={{ headerShown: false }} />
              <Stack.Screen name="lesson/[id]" options={{ title: '', headerBackTitle: '戻る' }} />
            </Stack>
          </OnboardingGate>
          </SparkLayer>
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
