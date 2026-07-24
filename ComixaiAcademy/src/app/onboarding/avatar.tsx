/* オンボーディング1: 一緒に学ぶアバターを選ぶ。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D } from '@/avatar/Avatar3D';
import { Button, Card, Row, Screen, Tag } from '@/components/ui';
import { AVATARS, DEFAULT_AVATAR_ID, getAvatar, isReady } from '@/data/avatars';
import { useProgress } from '@/store/progress';
import { F, S, T, inkBorder } from '@/theme';

export default function AvatarPickScreen() {
  const router = useRouter();
  const { setAvatar } = useProgress();
  const { width } = useWindowDimensions();

  const [picked, setPicked] = React.useState<string>(DEFAULT_AVATAR_ID);
  const avatar = getAvatar(picked);

  const stageW = Math.min(width - S.lg * 2, 320);

  const decide = () => {
    setAvatar(picked);
    router.replace('/onboarding/role');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ gap: 4 }}>
        <Text style={F.label}>STEP 1 / 2</Text>
        <Text style={F.title}>誰と学ぶ？</Text>
        <Text style={F.small}>ホーム画面にずっといる相棒を選ぶ。あとから変えられる。</Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Avatar3D
          key={avatar.id}
          avatar={avatar}
          width={stageW}
          height={Math.round(stageW * 0.95)}
        />
        <Text style={[F.small, { textAlign: 'center' }]}>{avatar.tagline}</Text>
      </View>

      <View style={{ gap: S.sm }}>
        {AVATARS.map((a) => {
          const ready = isReady(a);
          const selected = a.id === picked;
          return (
            <Pressable
              key={a.id}
              disabled={!ready}
              onPress={() => setPicked(a.id)}
              style={({ pressed }) => [
                {
                  ...inkBorder,
                  borderWidth: selected ? 2 : 1.5,
                  borderColor: selected ? T.border : T.borderSoft,
                  backgroundColor: selected ? T.accentSoft : T.surface,
                  padding: S.md,
                  opacity: !ready ? 0.45 : pressed ? 0.7 : 1,
                },
              ]}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[F.body, { fontWeight: '700', color: T.text }]}>{a.name}</Text>
                    <Text style={F.tiny}>{ready ? a.tagline : a.personality}</Text>
                  </View>
                </Row>
                {!ready ? <Tag>準備中</Tag> : selected ? <Tag tone="accent">選択中</Tag> : null}
              </Row>
            </Pressable>
          );
        })}
      </View>

      <Card tone="sunk">
        <Text style={F.tiny}>
          「準備中」のアバターは3Dモデルを追加すると選べるようになる。追加手順はREADMEに書いてある。
        </Text>
      </Card>

      <Button label="この相棒にする" onPress={decide} disabled={!isReady(avatar)} />
    </Screen>
  );
}
