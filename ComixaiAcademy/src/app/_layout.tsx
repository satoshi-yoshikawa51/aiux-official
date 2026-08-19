/* ルートレイアウト。フォント読み込み・進捗ストア・オンボーディングの振り分け。 */
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BadgeUnlock } from '@/components/badge-unlock';
import { CrashScreen } from '@/components/crash-screen';
import { SparkLayer } from '@/components/motion';
import { RankUpGate } from '@/components/rank-up';
import { TermSheetProvider } from '@/components/term-text';
import { playMusic, resumeMusic, stopMusic } from '@/lib/music';
import { preloadSounds } from '@/lib/sound';
import { warmTokenizer } from '@/lib/tokenizer';
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
    const inIntro = segments[0] === 'intro';
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
    } else if (!state.seenIntro) {
      /* 職種まで決まったら、ホームの前に一幕はさむ（app/intro.tsx）。
         **行き先の判断はここ1か所に寄せる。** 職種の画面から直接
         intro へ飛ばすと、この効果の「終わっていたらホームへ」と
         競り合って、どちらが後に走るかで行き先が変わる */
      if (!inIntro) router.replace('/intro');
    } else if (inOnboarding || inIntro) {
      router.replace('/');
    }
  }, [
    ready,
    fontsReady,
    state.seenOpening,
    state.avatarId,
    state.roleId,
    state.seenIntro,
    segments,
    router,
  ]);

  return <>{children}</>;
}

/* ▍場面にBGMを付ける係
   曲は「画面」ではなく「場面」に付ける。レッスンと復習は lesson の曲、
   それ以外（ホーム・タブ・オープニング・持ち帰りなど）は home の曲。
   ミニゲームは Modal＝路上に出ないので、あちらは mini-game.tsx が
   自分で game の曲に替える。

   ready を待つのは、保存された「BGMオフ」を読み込む前に
   鳴らし始めないため。バックグラウンドでは止める（BGMが
   ポケットの中で鳴り続けるのは事故）。 */
function MusicDirector() {
  const { ready } = useProgress();
  const segments = useSegments() as string[];

  React.useEffect(() => {
    if (!ready) return;
    /* おまけもレッスン扱い。ミニゲームを閉じると 'lesson' に戻す作りなので
       （→ components/mini-game.tsx）、ここを揃えておかないと曲が食い違う */
    const inLesson =
      segments[0] === 'lesson' ||
      segments[0] === 'review' ||
      segments[0] === 'exam' ||
      segments[0] === 'extra';
    playMusic(inLesson ? 'lesson' : 'home');
  }, [ready, segments]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') resumeMusic();
      else stopMusic();
    });
    return () => sub.remove();
  }, []);

  return null;
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

  /* 効果音を先に読み込む。押された瞬間に読み込むと初回だけ遅れて鳴る */
  React.useEffect(() => {
    preloadSounds();
  }, []);

  /* ▍トークンの表（1MB）は、落ち着いたころに裏で取っておく
     最初のレッスンの体験カードで使う。そこまで来てから取りにいくと、
     電波が細い所では**カードを開いた目の前で待たされて失敗する**。
     起動直後は絵とモデルの読み込みで詰まっているので、少し待ってから */
  React.useEffect(() => {
    const t = setTimeout(warmTokenizer, 4000);
    return () => clearTimeout(t);
  }, []);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 致命エラーの受け皿。リリースビルドは黙って落ちてログも見えないので、
          何が起きたかを画面に出す（→ components/crash-screen.tsx） */}
      <CrashScreen>
      <SafeAreaProvider>
        <ProgressProvider>
          {/* ボタンを押したときの星は、ここが全画面ぶんまとめて描く。
              ボタンの中で描くと、押した拍子に画面が切り替わる／ボタンが
              作り直されるたびに星まで消えてしまう（motion.tsx を参照）。
              ※ ミニゲームは Modal＝別の窓なので、あちらは自前で層を持つ */}
          <SparkLayer>
          {/* 本文の用語を押したときの説明。窓を増やさないよう根元に1枚だけ持つ */}
          <TermSheetProvider>
          <OnboardingGate ready={fontsReady}>
            <MusicDirector />
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
              <Stack.Screen name="intro" options={{ headerShown: false }} />
              <Stack.Screen name="lesson/[id]" options={{ title: '', headerBackTitle: '戻る' }} />
              <Stack.Screen name="review" options={{ title: '復習', headerBackTitle: '戻る' }} />
              <Stack.Screen name="exam/[courseId]" options={{ title: '修了試験', headerBackTitle: '戻る' }} />
              <Stack.Screen name="gacha" options={{ title: 'ガチャ', headerBackTitle: '戻る' }} />
              {/* おまけ（当てた景品についてくる追加コンテンツ）。題は画面側で入れる */}
              <Stack.Screen name="extra/[prizeId]" options={{ title: 'おまけ', headerBackTitle: '戻る' }} />
              <Stack.Screen name="extras" options={{ title: 'おまけ', headerBackTitle: '戻る' }} />
              <Stack.Screen name="stages" options={{ title: '舞台の見本', headerBackTitle: '戻る' }} />
              {/* ▍持ち帰りはヘッダーを出す（戻る矢印のため）
                   タブの外の画面なので、ヘッダーを消すと**戻る口が無くなる**
                   （実機で「トップに戻れない」の報告）。レッスン・復習と同じ形 */}
              <Stack.Screen name="sheet" options={{ title: '持ち帰り', headerBackTitle: '戻る' }} />
              <Stack.Screen name="ending" options={{ headerShown: false }} />
            </Stack>
            {/* ▍ご褒美の演出は、根元に1枚ずつ置く
                取れる場所が画面じゅうに散っているので、画面ごとに書くと
                必ず取りこぼす（→ components/badge-unlock.tsx）。
                **バッジ → 昇格の順**。昇格はバッジが出終わるまで待つ */}
            <BadgeUnlock />
            <RankUpGate />
          </OnboardingGate>
          </TermSheetProvider>
          </SparkLayer>
        </ProgressProvider>
      </SafeAreaProvider>
      </CrashScreen>
    </GestureHandlerRootView>
  );
}
