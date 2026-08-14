/* オンボーディング1: 一緒に学ぶアバターを選ぶ。

   見た目の作法はホームに揃えてある。黄色いピルは「次にやること」の印なので、
   ここでは STEP 表示がそれにあたる（1画面に1つ）。
   キャラのコマだけは網点を敷かず白のままにする（紙から浮かせる）。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { SaveTransfer } from '@/components/save-transfer';
import { Badge, Button, Panel, PressCard, Row, Screen, ScreenHead } from '@/components/ui';
import {
  AVATARS,
  DEFAULT_AVATAR_ID,
  getAvatar,
  isReady,
  ownsAvatar,
  type AvatarDef,
} from '@/data/avatars';
import { useProgress } from '@/store/progress';
import { F, POP, S, T } from '@/theme';

export default function AvatarPickScreen() {
  const router = useRouter();
  const { state, setAvatar } = useProgress();
  const { width } = useWindowDimensions();
  /* 最初に選べるのは2人だけ。残りはガチャで仲間になる（→ data/gacha.ts） */
  const canPick = (a: AvatarDef) => isReady(a) && ownsAvatar(a, state.skins);

  const [picked, setPicked] = React.useState<string>(DEFAULT_AVATAR_ID);
  const avatar = getAvatar(picked);
  /* コマを気持ち小さくして、**一覧の1枚目が折り返しの上に覗く**ようにする。
     ここが画面いっぱいだと、下に選べる相棒が並んでいることに気づけない */
  const stageW = Math.min(width - S.lg * 4 - POP.md, 250);

  const decide = () => {
    setAvatar(picked);
    router.replace('/onboarding/role');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      tone="dots"
      header={
        <ScreenHead
          pill="STEP 1 / 2"
          title="誰と学ぶ？"
          note={`${AVATARS.filter(canPick).length}人から選べます`}
          noteRight="あとから変えられます"
        />
      }
      /* 決める口は下に貼り付けておく。一覧の末尾に置くと、
         スクロールしないと見つからない */
      footer={
        <Button label="この相棒にする" size="lg" onPress={decide} disabled={!canPick(avatar)} />
      }>
      <Panel caption={avatar.tagline} contentStyle={{ alignItems: 'center', paddingBottom: S.xl + S.sm }}>
        <Avatar3D key={avatar.id} avatar={avatar} width={stageW} height={Math.round(stageW * 0.95)} />
      </Panel>

      <View style={{ gap: S.xs }}>
        {AVATARS.map((a) => {
          const pickable = canPick(a);
          const selected = a.id === picked;
          /* 未入手のキャラも伏せて並べる。ここが伸びていくことを予告しておく */
          return (
            <PressCard key={a.id} disabled={!pickable} selected={selected} onPress={() => setPicked(a.id)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm} style={{ flex: 1 }}>
                  <Icon name={pickable ? a.icon : 'lock'} size={24} color={pickable ? T.text : T.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={F.strong}>{pickable ? a.name : '？？？'}</Text>
                    <Text style={F.tiny}>
                      {pickable ? a.tagline : isReady(a) ? 'ガチャで仲間になります' : a.personality}
                    </Text>
                  </View>
                </Row>
                {!isReady(a) ? (
                  <Badge tone="paper">準備中</Badge>
                ) : !pickable ? (
                  <Badge tone="paper">ガチャ</Badge>
                ) : selected ? (
                  <Badge tone="red">選択中</Badge>
                ) : null}
              </Row>
            </PressCard>
          );
        })}
      </View>

      <Text style={F.hand}>
        いま選べるのは2人。ほかの相棒はガチャで仲間になります
      </Text>

      {/* ▍機種変更・入れ直しの受け口（→ components/save-transfer.tsx）
          記録はこの端末の中にしかないので、**新しい端末で最初に着くこの画面**に
          戻し口を置いておく。せっていまで進まないと戻せない作りだと、
          ここで「全部消えた」と思って離脱する */}
      <SaveTransfer mode="restore" />
    </Screen>
  );
}
