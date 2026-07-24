/* オンボーディング2: 職種を選ぶ。ここでコースの中身が変わる。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Bubble, Button, Row, Screen, Tag } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { ROLES } from '@/data/roles';
import type { RoleId } from '@/data/types';
import { useProgress } from '@/store/progress';
import { F, S, T, inkBorder } from '@/theme';

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
    <Screen edges={['top', 'bottom']}>
      <View style={{ gap: 4 }}>
        <Text style={F.label}>STEP 2 / 2</Text>
        <Text style={F.title}>どんな仕事をしてる？</Text>
        <Text style={F.small}>選んだ職種にあわせて、例とプロンプトが差し替わる。あとから変えられる。</Text>
      </View>

      <Bubble
        text={`${avatar.name}だ。……で、あんたの仕事は？ そこが決まらないと、教える中身が決まらない。`}
      />

      <View style={{ gap: S.sm, marginTop: S.sm }}>
        {ROLES.map((r) => {
          const selected = r.id === picked;
          return (
            <Pressable
              key={r.id}
              onPress={() => setPicked(r.id)}
              style={({ pressed }) => [
                {
                  ...inkBorder,
                  borderWidth: selected ? 2 : 1.5,
                  borderColor: selected ? T.border : T.borderSoft,
                  backgroundColor: selected ? T.accentSoft : T.surface,
                  padding: S.lg,
                  gap: S.sm,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                  <Text style={[F.h2, { flex: 1 }]}>{r.name}</Text>
                </Row>
                {selected ? <Tag tone="accent">これ</Tag> : null}
              </Row>
              <Text style={F.small}>{r.catch}</Text>
              {selected ? (
                <View style={{ gap: 2, marginTop: 2 }}>
                  {r.fit.map((f) => (
                    <Text key={f} style={F.tiny}>
                      ・{f}
                    </Text>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Button label="はじめる" onPress={decide} disabled={!picked} />
    </Screen>
  );
}
