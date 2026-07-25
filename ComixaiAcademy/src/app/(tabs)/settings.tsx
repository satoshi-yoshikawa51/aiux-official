/* せってい。アバター・職種の変更と、記録のリセット。 */
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Badge, Card, PressCard, Row, Screen, SectionHead } from '@/components/ui';
import { AVATARS, getAvatar, isReady } from '@/data/avatars';
import { ROLES, getRole } from '@/data/roles';
import type { RoleId } from '@/data/types';
import { useProgress, useStats } from '@/store/progress';
import { F, FONT, S, T } from '@/theme';

const SITE = 'https://comixai.dev';

export default function SettingsScreen() {
  const router = useRouter();
  const { state, setAvatar, setRole, reset } = useProgress();
  const stats = useStats();
  const avatar = getAvatar(state.avatarId);
  const role = getRole(state.roleId);

  const confirmReset = () => {
    Alert.alert('記録をぜんぶ消す', 'レッスンの修了・バッジ・称号がすべて初期化される。取り消せない。', [
      { text: 'やめる', style: 'cancel' },
      {
        text: '消す',
        style: 'destructive',
        onPress: () => {
          reset();
          router.replace('/onboarding/avatar');
        },
      },
    ]);
  };

  return (
    <Screen>
      <SectionHead kicker="SETTINGS" title="せってい" />

      {/* アバター */}
      <View style={{ gap: S.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={F.h1}>アバター</Text>
          <Text style={F.hand}>いま：{avatar.name}</Text>
        </Row>
        {AVATARS.map((a) => {
          const selected = a.id === state.avatarId;
          const ready = isReady(a);
          return (
            <PressCard key={a.id} disabled={!ready} selected={selected} onPress={() => setAvatar(a.id)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm} style={{ flex: 1 }}>
                  <Icon name={a.icon} size={22} color={T.text} />
                  <View style={{ flex: 1 }}>
                    <Text style={F.strong}>{a.name}</Text>
                    <Text style={F.tiny}>{a.tagline}</Text>
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

      {/* 職種 */}
      <View style={{ gap: S.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={F.h1}>職種</Text>
          <Text style={F.hand}>変えると内容が変わる</Text>
        </Row>
        {ROLES.map((r) => {
          const selected = r.id === state.roleId;
          return (
            <PressCard key={r.id} selected={selected} onPress={() => setRole(r.id as RoleId)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm} style={{ flex: 1 }}>
                  <Icon name={r.icon} size={22} color={T.text} />
                  <Text style={[F.strong, { flex: 1 }]}>{r.name}</Text>
                </Row>
                {selected ? <Badge tone="red">選択中</Badge> : null}
              </Row>
            </PressCard>
          );
        })}
      </View>

      {/* 記録 */}
      <Card tone="sunk">
        <Text style={F.h1}>記録</Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: T.body, lineHeight: 20 }}>
          DONE {stats.doneCount}/{stats.total} ・ BADGE {stats.badgeCount}/{stats.badgeTotal} ・ STREAK{' '}
          {stats.streak}
        </Text>
        <Text style={F.hand}>この端末の中だけに保存される。アプリを消すと一緒に消える。</Text>
        <Pressable onPress={confirmReset} style={{ paddingVertical: S.sm }}>
          <Text style={[F.strong, { color: T.accent }]}>記録をぜんぶ消す</Text>
        </Pressable>
      </Card>

      {/* リンク */}
      <Card>
        <Text style={F.h1}>このアプリについて</Text>
        <Text style={F.body}>
          COMIXAI（comixai.dev）の用語集・職種別ガイド・プロンプト集をもとにした学習アプリ。
        </Text>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(SITE)} style={{ paddingVertical: S.xs }}>
          <Text style={[F.strong, { color: T.link }]}>COMIXAI を開く →</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
