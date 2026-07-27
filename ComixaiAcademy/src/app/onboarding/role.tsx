/* オンボーディング2: 職種を選ぶ。ここでコースの中身が変わる。

   見た目の作法はホームに揃えてある。黄色いピルは STEP 表示が持つ（1画面に1つ）。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Badge, Bubble, Button, PressCard, Row, Screen, ScreenHead } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { ROLES } from '@/data/roles';
import type { RoleId } from '@/data/types';
import { useProgress } from '@/store/progress';
import { F, POP, S, T } from '@/theme';

export default function RolePickScreen() {
  const router = useRouter();
  const { state, setRole } = useProgress();
  const avatar = getAvatar(state.avatarId);

  const [picked, setPicked] = React.useState<RoleId | null>(null);

  const decide = () => {
    if (!picked) return;
    setRole(picked);
    router.replace('/');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      tone="dots"
      header={
        <ScreenHead
          pill="STEP 2 / 2"
          title="どんな仕事をしてる？"
          note="選んだ職種にあわせて、例とプロンプトが差し替わる"
        />
      }>
      <Bubble
        variant="shout"
        text={`${avatar.name}だ。で、あんたの仕事は？ そこが決まらないと、教える中身が決まらない。`}
        style={{ marginRight: POP.sm, marginBottom: S.lg }}
      />

      <View style={{ gap: S.sm }}>
        {ROLES.map((r) => {
          const selected = r.id === picked;
          return (
            <PressCard
              key={r.id}
              selected={selected}
              onPress={() => setPicked(r.id)}
              style={{ padding: S.lg, gap: S.sm }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm} style={{ flex: 1 }}>
                  <Icon name={r.icon} size={24} color={T.text} />
                  <Text style={[F.h1, { flex: 1 }]}>{r.name}</Text>
                </Row>
                {selected ? <Badge tone="red">これ</Badge> : null}
              </Row>
              <Text style={F.body}>{r.catch}</Text>
              {selected ? (
                <View style={{ gap: 3, marginTop: 2 }}>
                  {r.fit.map((f) => (
                    <Text key={f} style={F.hand}>
                      ・{f}
                    </Text>
                  ))}
                </View>
              ) : null}
            </PressCard>
          );
        })}
      </View>

      <Button label="はじめる" size="lg" onPress={decide} disabled={!picked} />
    </Screen>
  );
}
