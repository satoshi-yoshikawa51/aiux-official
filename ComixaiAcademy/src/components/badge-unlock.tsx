/* ============================================================
   バッジを取った瞬間の演出。**根元に1枚だけ置いて、どこで取っても出す**。

   ▍なぜ要るのか
   前は、取ったことに気づく場所がレッスンの結果画面しか無かった。
   しかもそこは修了・★・連続日数・称号と並ぶ一覧の途中なので、
   下へスクロールする途中で通り過ぎる。バッジは25種あるのに、
   **いつの間にか増えている**だけのものになっていた。

   取れる場所もばらばら（結果画面・おまけ・ミニゲームの★・復習の卒業・
   アバターや職種を決めた瞬間）。画面ごとに祝う仕掛けを書くと必ず
   取りこぼすので、獲得を1本の列に集めて（→ store/progress.tsx の
   badgeQueue）、ここが順番に出す。

   ▍称号（rank-up.tsx）とは、わざと別の見せ方にする
   称号は**レッスン何本ぶんもの積み重ね**でしか上がらないので、白飛び＋
   集中線＋長い段取りで画面を占領する。バッジはそれより頻繁に取れるので、
   同じ派手さでやると「また止まった」になる。こちらは
   **暗転 → 勲章が判子のように落ちる → 星 → 2秒で自分から閉じる**。
   短く、しかし確実に手を止めさせる。

   ▍勝手に閉じる。触れば早く閉じる
   ご褒美の画面で「閉じる」を押させるのは手間なので、時間が来たら
   自分で退場する。読みたい人のために、触ったらすぐ次へ行ける。
   2つ以上まとめて取ったときは、続けて1枚ずつ出す（右上に 1/2）。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { BadgeArt } from '@/components/badge-art';
import { SparkLayer, useSparkBurst } from '@/components/motion';
import { getBadge } from '@/data/badges';
import { playSound } from '@/lib/sound';
import { useProgress } from '@/store/progress';
import { BW, C, F, FONT, R, S } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/** 自分から閉じるまで。**短くする**——ここが長いと、ご褒美ではなく待ち時間になる */
const STAY_MS = 2200;
/** 落ちてきて止まるまで */
const DROP_MS = 460;
/** 勲章を載せる丸の直径 */
const DISC = 140;

export function BadgeUnlock() {
  const { badgeQueue, dismissBadge } = useProgress();
  const id = badgeQueue[0];
  if (!id) return null;
  return (
    <Modal visible animationType="none" transparent onRequestClose={dismissBadge}>
      {/* Modal は別の窓なので、根元（_layout.tsx）の星の層は届かない */}
      <SparkLayer>
        <Stage
          /* IDを鍵にして作り直す。2枚目が同じ枠に居座ると、
             落ちる動きが1枚目のぶんで終わったままになる */
          key={id}
          id={id}
          index={0}
          total={badgeQueue.length}
          onDone={dismissBadge}
        />
      </SparkLayer>
    </Modal>
  );
}

function Stage({
  id,
  total,
  onDone,
}: {
  id: string;
  index: number;
  total: number;
  onDone: () => void;
}) {
  const badge = getBadge(id);
  const { width, height } = useWindowDimensions();
  const burst = useSparkBurst();

  /* 暗転の濃さ。**真っ黒にしない**——後ろの画面がうっすら見えているほうが、
     「いまやっていたこと」の続きだと分かる */
  const dim = React.useRef(new Animated.Value(0)).current;
  /* 落ちてくる勲章 */
  const drop = React.useRef(new Animated.Value(0)).current;
  /* 着地の揺れ */
  const shake = React.useRef(new Animated.Value(0)).current;

  const closed = React.useRef(false);
  const close = React.useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    onDone();
  }, [onDone]);

  React.useEffect(() => {
    Animated.timing(dim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
    Animated.timing(drop, {
      toValue: 1,
      duration: DROP_MS,
      easing: Easing.out(Easing.back(2.4)),
      useNativeDriver: NATIVE,
    }).start();

    playSound('badge');
    if (NATIVE) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    /* 着地に合わせて、揺らして・星を撒く */
    const land = setTimeout(() => {
      Animated.timing(shake, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE,
      }).start();
      burst(width * 0.5, height * 0.44, 2.2);
      burst(width * 0.26, height * 0.4, 1.4);
      burst(width * 0.74, height * 0.4, 1.4);
    }, DROP_MS - 120);
    const bye = setTimeout(close, STAY_MS);
    return () => {
      clearTimeout(land);
      clearTimeout(bye);
    };
  }, [dim, drop, shake, burst, width, height, close]);

  if (!badge) return null;

  const shift = shake.interpolate({
    inputRange: [0, 0.2, 0.45, 0.7, 1],
    outputRange: [0, 7, -5, 3, 0],
  });

  return (
    <Pressable onPress={close} style={{ flex: 1 }}>
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: S.xl,
          backgroundColor: C.ink900,
          opacity: dim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.86] }),
        }}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          padding: S.xl,
          transform: [{ translateX: shift }],
        }}>
        <Animated.View
          style={{
            alignItems: 'center',
            gap: S.sm,
            opacity: drop.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }),
            transform: [
              { scale: drop.interpolate({ inputRange: [0, 1], outputRange: [2.3, 1] }) },
              {
                translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] }),
              },
            ],
          }}>
          <Text style={[F.kicker, { color: C.yellow400 }]}>BADGE UNLOCKED</Text>

          {/* ▍勲章は**紙の丸**に載せる。黄色にしない
              絵そのものが金と青の勲章なので、黄色い台に載せると金が金に
              溶けて、何が描いてあるか分からない団子になる。紙＋太い黒枠は
              このアプリの地なので、コマから1枚抜き出したように見える。
              後ろにずらして敷く黄色は、ボタンと同じポップシャドウ */}
          <View style={{ width: DISC, height: DISC, marginBottom: S.sm }}>
            <View
              style={{
                position: 'absolute',
                left: 6,
                top: 7,
                width: DISC,
                height: DISC,
                borderRadius: DISC / 2,
                backgroundColor: C.yellow400,
              }}
            />
            <View
              style={{
                width: DISC,
                height: DISC,
                borderRadius: DISC / 2,
                backgroundColor: C.paper50,
                borderWidth: BW.heavy,
                borderColor: C.ink900,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <BadgeArt badge={badge} at="pop" />
            </View>
          </View>

          <View
            style={{
              backgroundColor: C.paper50,
              borderWidth: BW.bold,
              borderColor: C.ink900,
              borderRadius: R.sm,
              paddingVertical: S.sm,
              paddingHorizontal: S.lg,
              alignItems: 'center',
              gap: 2,
              /* 少しだけ傾ける。まっすぐだとカタログの1ページに見える */
              transform: [{ rotate: '-1.5deg' }],
            }}>
            <Text style={F.h1}>{badge.name}</Text>
            <Text style={F.tiny}>{badge.desc}</Text>
          </View>

          {/* ▍まとめて取ったときだけ残りを出す
              1枚のときに「1/1」が出ると、続きがあるように見えて手が止まる */}
          {total > 1 ? (
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1.5, color: C.paper200 }}>
              あと {total - 1}
            </Text>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
