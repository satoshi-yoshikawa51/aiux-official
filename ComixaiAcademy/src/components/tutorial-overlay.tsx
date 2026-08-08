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
import { Pop, Row, Tap } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { useProgress } from '@/store/progress';
import { useTutorial } from '@/store/tutorial';
import { BW, C, F, FONT, POP, R, S, T, TAB } from '@/theme';

export function TutorialOverlay() {
  const insets = useSafeAreaInsets();
  const { active, step, index, total, next, finish, setPanelH } = useTutorial();
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
        /* いつも下（親指に近い）。**上に逃がす仕組みはやめた**——
           逃がした先にも隠すものがあって（フキダシ）、同じことの繰り返しに
           なるため。いまは画面がこのパネルのぶんだけ下を空けるので、
           そもそも何も覆わない（→ store/tutorial.tsx の panelH） */
        bottom: TAB.height + insets.bottom + S.sm,
      }}
      /* 自分の高さを測って配る。画面はこれを見て下を空ける */
      onLayout={(e) => setPanelH(Math.ceil(e.nativeEvent.layout.height))}>
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
            {/* 案内を打ち切る口。**星は出さない** */}
            <Tap
              onPress={() => {
                tap();
                finish();
              }}
              sparks={false}
              hitSlop={8}
              style={{ paddingVertical: 8, paddingHorizontal: 6 }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300, letterSpacing: 1 }}>
                とばす
              </Text>
            </Tap>
            <Tap
              onPress={() => {
                tap();
                next();
              }}
              scale={0.95}>
              <View
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
              </View>
            </Tap>
          </Row>
        </View>
      </Pop>
    </View>
  );
}
