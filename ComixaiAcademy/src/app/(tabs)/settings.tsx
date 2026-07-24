/* せってい。アバター・職種の変更と、記録のリセット。 */
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Card, Row, Screen, SectionTitle, Tag } from '@/components/ui';
import { AVATARS, getAvatar, isReady } from '@/data/avatars';
import { ROLES, getRole } from '@/data/roles';
import { useProgress, useStats } from '@/store/progress';
import type { RoleId } from '@/data/types';
import { F, S, T, inkBorder } from '@/theme';

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
      <SectionTitle>せってい</SectionTitle>

      {/* アバター */}
      <Card style={{ gap: S.md }}>
        <Text style={F.h2}>アバター</Text>
        <Text style={F.small}>いま：{avatar.name}</Text>
        <View style={{ gap: S.sm }}>
          {AVATARS.map((a) => {
            const selected = a.id === state.avatarId;
            const ready = isReady(a);
            return (
              <Pressable
                key={a.id}
                disabled={!ready}
                onPress={() => setAvatar(a.id)}
                style={({ pressed }) => [
                  {
                    ...inkBorder,
                    borderWidth: selected ? 2 : 1.5,
                    borderColor: selected ? T.border : T.borderSoft,
                    backgroundColor: selected ? T.accentSoft : T.surface,
                    padding: S.md,
                    opacity: !ready ? 0.5 : pressed ? 0.7 : 1,
                  },
                ]}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row gap={S.sm} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20 }}>{a.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[F.body, { fontWeight: '700', color: T.text }]}>{a.name}</Text>
                      <Text style={F.tiny}>{a.tagline}</Text>
                    </View>
                  </Row>
                  {!ready ? <Tag>準備中</Tag> : selected ? <Tag tone="accent">選択中</Tag> : null}
                </Row>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* 職種 */}
      <Card style={{ gap: S.md }}>
        <Text style={F.h2}>職種</Text>
        <Text style={F.small}>
          いま：{role ? `${role.emoji} ${role.name}` : '未選択'}／変えると「職種別」コースの中身が変わる
        </Text>
        <View style={{ gap: S.sm }}>
          {ROLES.map((r) => {
            const selected = r.id === state.roleId;
            return (
              <Pressable
                key={r.id}
                onPress={() => setRole(r.id as RoleId)}
                style={({ pressed }) => [
                  {
                    ...inkBorder,
                    borderWidth: selected ? 2 : 1.5,
                    borderColor: selected ? T.border : T.borderSoft,
                    backgroundColor: selected ? T.accentSoft : T.surface,
                    padding: S.md,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row gap={S.sm} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                    <Text style={[F.body, { fontWeight: '700', color: T.text, flex: 1 }]}>{r.name}</Text>
                  </Row>
                  {selected ? <Tag tone="accent">選択中</Tag> : null}
                </Row>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* 記録 */}
      <Card tone="sunk" style={{ gap: S.sm }}>
        <Text style={F.h2}>記録</Text>
        <Text style={F.small}>
          修了 {stats.doneCount}/{stats.total} 本・バッジ {stats.badgeCount}/{stats.badgeTotal} 個・
          連続 {stats.streak}日
        </Text>
        <Text style={F.tiny}>
          記録はこの端末の中だけに保存される。アプリを消すと一緒に消える。
        </Text>
        <Pressable onPress={confirmReset} style={{ paddingVertical: S.sm }}>
          <Text style={[F.body, { color: T.accent, fontWeight: '700' }]}>記録をぜんぶ消す</Text>
        </Pressable>
      </Card>

      {/* リンク */}
      <Card style={{ gap: S.sm }}>
        <Text style={F.h2}>このアプリについて</Text>
        <Text style={F.small}>
          COMIXAI（comixai.dev）の用語集・職種別ガイド・プロンプト集をもとにした学習アプリ。
        </Text>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(SITE)} style={{ paddingVertical: S.xs }}>
          <Text style={[F.body, { color: T.link, fontWeight: '700' }]}>COMIXAI を開く →</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
