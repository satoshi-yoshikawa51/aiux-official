/* せってい。アバター・職種の変更と、記録のリセット。

   見た目の作法はホームに揃えてある（黒帯・網点の紙・黒いカセット）。
   この画面には「次にやること」が無いので、**黄色いピルは置かない**。
   黒いカセットは記録（消すと戻せないもの）に使う。 */
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { RolePicker } from '@/components/role-picker';
import { Badge, Card, Cassette, PressCard, Row, Screen, ScreenHead } from '@/components/ui';
import { AVATARS, getAvatar, isReady } from '@/data/avatars';
import { getRole } from '@/data/roles';
import { useProgress, useStats } from '@/store/progress';
import { C, F, FONT, S, T } from '@/theme';

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

  const header = (
    <ScreenHead
      kicker="SETTINGS"
      title="せってい"
      note={`${avatar.name} ・ ${role?.name ?? '職種えらび中'}`}
      noteRight="いつでも変えられる"
    />
  );

  return (
    <Screen header={header} tone="dots">
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
        <RolePicker value={state.roleId} onPick={setRole} />
      </View>

      {/* 記録 */}
      <Cassette>
        <Text style={[F.h1, { color: C.paper50 }]}>記録</Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: C.paper100, lineHeight: 20 }}>
          DONE {stats.doneCount}/{stats.total} ・ BADGE {stats.badgeCount}/{stats.badgeTotal} ・ STREAK{' '}
          {stats.streak}
        </Text>
        <Text style={[F.hand, { color: C.ink300 }]}>
          この端末の中だけに保存される。アプリを消すと一緒に消える。
        </Text>
        {/* 消すのは取り消せないので、赤いボタンの見た目にはしない。
            黒の上では red500 が沈むので、文字は red100 で出す */}
        <Pressable onPress={confirmReset} style={{ paddingVertical: S.sm }}>
          <Row gap={6}>
            <Icon name="bang" size={15} color={C.red100} />
            <Text style={[F.strong, { color: C.red100 }]}>記録をぜんぶ消す</Text>
          </Row>
        </Pressable>
      </Cassette>

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
