/* ============================================================
   レッスンの中に置く「ミニゲームの入口」。

   いまあるゲームは3つ:
   ・tokenizer     … 打った文字がどうトークンに割れるか見る（合否なし）
   ・token-budget  … 決められたトークン数に収める（**通らないと次へ進めない**）
   ・ai-prompt     … 実際にAIに指示を出し、結果と指示を採点してもらう（進行は止めない）

   ▍ここは入口だけ。中身は別画面
   前は入力欄をこのカードの中に生やしていたが、**どう飾っても
   「読み物の続き」にしか見えなかった**。いまは押すと全画面で
   ミニゲームが立ち上がる（→ components/mini-game.tsx）。
   タイトルが動いて、地が黒くなって、先生も進み具合も消える。
   入る前と出たあとで画面ごと変わるから、ゲームとして立つ。

   通ったら onDone(true) を呼ぶ。レッスン側はこれを見て通せんぼを解く。

   ▍先に進めなくするのは token-budget だけ
   トークン数は誰がやっても同じ答えになるので、止めても必ず抜けられる。
   一方 ai-prompt の点はAIの判断で揺れる。**揺れるもので通せんぼをしない。**
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { GAME, MiniGame } from '@/components/mini-game';
import { SlideIn, useTap } from '@/components/motion';
import { Row, sinkFlat } from '@/components/ui';
import type { LessonInteractive } from '@/data/types';
import { BW, C, F, FONT, R, S, T } from '@/theme';

export function LessonInteractiveCard({
  spec,
  onDone,
}: {
  spec: LessonInteractive;
  /** 合否のあるゲームを通ったときに true で呼ぶ */
  onDone?: (ok: boolean) => void;
}) {
  const g = GAME[spec.kind];
  const [open, setOpen] = React.useState(false);
  const [cleared, setCleared] = React.useState(false);
  const { pressed, onPressIn, onPressOut } = useTap();

  const start = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setOpen(true);
  };

  return (
    <>
      {/* ———— 入口の看板 ————
           黒帯に名前を出して、左から滑り込ませる。
           押すところは赤（このアプリでは赤＝押せるもの） */}
      <SlideIn from="left" distance={30} duration={340}>
        <View
          style={{
            backgroundColor: C.ink900,
            borderWidth: BW.bold,
            borderColor: T.border,
            borderRadius: R.sm,
            padding: S.md,
            gap: S.sm,
          }}>
          <Row gap={7}>
            <Icon name={g.icon} size={16} color={C.yellow400} />
            <Text
              style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.4, color: C.yellow400 }}>
              MINI GAME
            </Text>
            {cleared ? (
              <Row gap={4} style={{ marginLeft: 'auto' }}>
                <Icon name="check" size={13} color={T.ok} />
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1, color: T.ok }}>
                  CLEAR
                </Text>
              </Row>
            ) : null}
          </Row>

          <Text style={{ fontFamily: FONT.display, fontSize: 21, lineHeight: 28, color: C.paper50 }}>
            {g.name}
          </Text>
          <Text style={[F.hand, { fontSize: 12.5, color: C.ink300 }]}>{g.how}</Text>

          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={start}
            style={{ marginTop: 2 }}>
            <View
              style={[{
                /* 押すと一段沈んだ赤に。黒地のカードなので色の差がよく出る */
                backgroundColor: cleared ? (pressed ? C.ink800 : 'transparent') : pressed ? T.accentPress : T.accent,
                borderWidth: BW.bold,
                borderColor: cleared ? C.paper100 : pressed ? T.accentPress : T.accent,
                borderRadius: R.sm,
                paddingVertical: 12,
                alignItems: 'center',
              }, sinkFlat(pressed, 0.97)]}>
              <Row gap={7}>
                <Text
                  style={{
                    fontFamily: FONT.heading,
                    fontSize: 15,
                    letterSpacing: 0.4,
                    color: cleared ? C.paper50 : C.paper0,
                  }}>
                  {cleared ? 'もう一度あそぶ' : 'ゲームをはじめる'}
                </Text>
                <Icon name="play" size={12} color={cleared ? C.paper50 : C.paper0} />
              </Row>
            </View>
          </Pressable>
        </View>
      </SlideIn>

      {open ? (
        <MiniGame
          spec={spec}
          onClose={() => setOpen(false)}
          onCleared={() => {
            setCleared(true);
            onDone?.(true);
          }}
        />
      ) : null}
    </>
  );
}
