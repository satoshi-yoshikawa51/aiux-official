/* ルートレイアウト。進捗ストアを配って、オンボーディングの振り分けをする。 */
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProgressProvider, useProgress } from '@/store/progress';
import { T } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** アバターと職種が決まるまでは、オンボーディングから出さない */
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { state, ready } = useProgress();
  const segments = useSegments() as string[];
  const router = useRouter();

  React.useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});

    const inOnboarding = segments[0] === 'onboarding';
    if (!state.avatarId) {
      if (segments[1] !== 'avatar') router.replace('/onboarding/avatar');
    } else if (!state.roleId) {
      if (segments[1] !== 'role') router.replace('/onboarding/role');
    } else if (inOnboarding) {
      router.replace('/');
    }
  }, [ready, state.avatarId, state.roleId, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProgressProvider>
          <OnboardingGate>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: T.bg },
                headerTintColor: T.text,
                headerTitleStyle: { fontWeight: '800' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: T.bg },
              }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/avatar" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/role" options={{ headerShown: false }} />
              <Stack.Screen name="lesson/[id]" options={{ title: '', headerBackTitle: '戻る' }} />
            </Stack>
          </OnboardingGate>
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
