/* ============================================================
   チュートリアルの吹き出し。タブバーのすぐ上に浮かせる。

   ▍3Dアバターをここに置かない理由
   先生の顔を出したいところだが、GLViewをもう1つ立てると、ホームの
   アバターと2重になる。読み込み直しも起きうるし、非力な端末では効く。
   ホームの回では**本物のアバターが後ろに立っている**ので、ここは
   アイコンと名前だけにして、そちらに語らせる。

   下の余白はタブバーの高さ＋安全領域ぶん空けること。
   ここを固定値にすると、ホームインジケーターのある端末で隠れる。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { Pop, Row } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { useProgress } from '@/store/progress';
import { useTutorial } from '@/store/tutorial';
import { BW, C, F, FONT, POP, R, S, T, TAB } from '@/theme';

/* 黒帯のおおよその高さ。上に出すときだけ、これだけ下げて帯を避ける。

   帯の高さは中身しだいで変わるので**測って配るのが本筋**だが、そのために
   画面から帯の高さを持ち上げる仕掛けを足すほどの話ではない。
   `bubble: 'top'` を使うのはホームの1回だけで、ホームの帯は実測85px。
   少し多めに取ってあるので、帯が縮む端末では隙間が空くだけで重ならない。 */
const HEAD_H = 88;

export function TutorialOverlay() {
  const insets = useSafeAreaInsets();
  const { active, step, index, total, next, finish } = useTutorial();
  const { state } = useProgress();
  const avatar = getAvatar(state.avatarId);

  if (!active || !step) return null;

  /** その画面のアバターがしゃべる回か。ここはボタンだけの帯になる */
  const byAvatar = step.voice === 'avatar';

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: S.md,
        right: S.md,
        /* ふだんは下（親指に近い）。指している場所が下敷きになる回だけ上へ。
           上に出すときは黒帯のぶんだけ下げて、帯と重ならないようにする */
        ...(step.bubble === 'top'
          ? { top: insets.top + HEAD_H + S.sm }
          : { bottom: TAB.height + insets.bottom + S.sm }),
      }}>
      <Pop radius={R.md} reserve={false} style={{ marginBottom: POP.md }}>
        <View
          style={{
            backgroundColor: C.ink800,
            borderWidth: BW.bold,
            borderColor: T.border,
            borderRadius: R.md,
            padding: S.md,
            gap: S.sm,
          }}>
          {/* ▍アバターが自分の口でしゃべる回は、名前もセリフも出さない
              ホームには先生が立っていて、そのフキダシに案内のセリフが出ている。
              ここにも同じ人物の名前とセリフを並べると、**声が2つになって
              どちらを読めばいいのか分からなくなる**（→ store/tutorial.tsx の voice）。
              その回のこのパネルは、送りのボタンだけを持つ細い帯にする */}
          {byAvatar ? null : (
            <>
              <Row gap={8}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: R.full,
                    backgroundColor: C.ink900,
                    borderWidth: BW.line,
                    borderColor: C.paper50,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon name={avatar.icon} size={17} color={C.paper50} />
                </View>
                <Text style={[F.strong, { flex: 1, fontSize: 13.5, color: C.paper50 }]}>
                  {avatar.name}
                </Text>
                <Text
                  style={{ fontFamily: FONT.mono, fontSize: 10.5, color: C.ink300, letterSpacing: 1 }}>
                  {index} / {total}
                </Text>
              </Row>

              <Text
                style={{ fontFamily: FONT.hand, fontSize: 14.5, lineHeight: 23, color: C.paper50 }}>
                {step.say}
              </Text>
            </>
          )}

          <Row gap={S.sm} style={{ justifyContent: 'flex-end' }}>
            {/* アバターがしゃべる回は、この帯に文字が無いので
                「何歩目か」だけ左に置いておく（進み具合は要る） */}
            {byAvatar ? (
              <Row gap={7} style={{ flex: 1 }}>
                <Icon name={avatar.icon} size={14} color={C.ink300} />
                <Text
                  style={{ fontFamily: FONT.mono, fontSize: 10.5, color: C.ink300, letterSpacing: 1 }}>
                  {index} / {total}
                </Text>
              </Row>
            ) : null}
            <Pressable
              onPress={() => {
                tap();
                finish();
              }}
              hitSlop={8}
              style={{ paddingVertical: 8, paddingHorizontal: 6 }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300, letterSpacing: 1 }}>
                とばす
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                tap();
                next();
              }}
              style={{
                backgroundColor: C.yellow400,
                borderWidth: BW.bold,
                borderColor: T.border,
                borderRadius: R.sm,
                paddingVertical: 9,
                paddingHorizontal: 18,
              }}>
              <Row gap={6}>
                <Text style={{ fontFamily: FONT.heading, fontSize: 14, color: C.ink900 }}>
                  {/* ホームの「はじめる（3分…）」と紛れるので、締めは別の言葉にする */}
                  {index >= total ? 'わかった' : 'つぎへ'}
                </Text>
                <Icon name="play" size={11} color={C.ink900} />
              </Row>
            </Pressable>
          </Row>
        </View>
      </Pop>
    </View>
  );
}
