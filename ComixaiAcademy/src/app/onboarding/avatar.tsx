/* オンボーディング1: 一緒に学ぶアバターを選ぶ。

   見た目の作法はホームに揃えてある。黄色いピルは「次にやること」の印なので、
   ここでは STEP 表示がそれにあたる（1画面に1つ）。
   キャラのコマだけは網点を敷かず白のままにする（紙から浮かせる）。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { Badge, Button, Panel, PressCard, Row, Screen, ScreenHead } from '@/components/ui';
import { AVATARS, DEFAULT_AVATAR_ID, getAvatar, isReady } from '@/data/avatars';
import { useProgress } from '@/store/progress';
import { F, POP, S, T } from '@/theme';

export default function AvatarPickScreen() {
  const router = useRouter();
  const { setAvatar } = useProgress();
  const { width } = useWindowDimensions();

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
          note={`${AVATARS.length}人から選ぶ`}
          noteRight="あとから変えられる"
        />
      }
      /* 決める口は下に貼り付けておく。一覧の末尾に置くと、
         スクロールしないと見つからない */
      footer={
        <Button label="この相棒にする" size="lg" onPress={decide} disabled={!isReady(avatar)} />
      }>
      <Panel caption={avatar.tagline} contentStyle={{ alignItems: 'center', paddingBottom: S.xl + S.sm }}>
        <Avatar3D key={avatar.id} avatar={avatar} width={stageW} height={Math.round(stageW * 0.95)} />
      </Panel>

      <View style={{ gap: S.xs }}>
        {AVATARS.map((a) => {
          const ready = isReady(a);
          const selected = a.id === picked;
          return (
            <PressCard key={a.id} disabled={!ready} selected={selected} onPress={() => setPicked(a.id)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm} style={{ flex: 1 }}>
                  <Icon name={a.icon} size={24} color={T.text} />
                  <View style={{ flex: 1 }}>
                    <Text style={F.strong}>{a.name}</Text>
                    <Text style={F.tiny}>{ready ? a.tagline : a.personality}</Text>
                  </View>
                </Row>
                {!ready ? (
                  <Badge tone="paper">準備中</Badge>
                ) : selected ? (
                  <Badge tone="red">選択中</Badge>
                ) : null}
              </Row>
            </PressCard>
          );
        })}
      </View>

      <Text style={F.hand}>
        「準備中」は3Dモデルを追加すると選べるようになる（手順はREADME）
      </Text>
    </Screen>
  );
}
