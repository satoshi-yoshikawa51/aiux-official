/* バッジと称号。未獲得は伏せて、匂わせだけ出す（サイトの図鑑と同じ作法）。 */
import React from 'react';
import { Text, View } from 'react-native';

import { Card, ProgressBar, Row, Screen, SectionTitle, Tag } from '@/components/ui';
import { BADGES, TITLES } from '@/data/badges';
import { useProgress, useStats } from '@/store/progress';
import { C, F, R, S, T, inkBorder } from '@/theme';

export default function BadgesScreen() {
  const { state } = useProgress();
  const stats = useStats();

  return (
    <Screen>
      <SectionTitle sub={`${stats.badgeCount} / ${stats.badgeTotal} 個を獲得`}>バッジ</SectionTitle>

      <Card tone="sunk" style={{ gap: S.sm }}>
        <Row gap={S.sm}>
          <Text style={{ fontSize: 26 }}>{stats.title.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={F.label}>いまの称号</Text>
            <Text style={F.h1}>{stats.title.name}</Text>
          </View>
        </Row>
        <ProgressBar value={stats.badgeCount} total={stats.badgeTotal} />
      </Card>

      {/* 称号の階段 */}
      <View style={{ gap: S.sm }}>
        <Text style={F.h2}>称号</Text>
        {TITLES.map((t) => {
          const reached = stats.badgeCount >= t.need;
          const current = stats.title.name === t.name;
          return (
            <View
              key={t.name}
              style={{
                ...inkBorder,
                borderWidth: current ? 2 : 1.5,
                borderColor: current ? T.border : T.borderSoft,
                backgroundColor: current ? T.accentSoft : reached ? T.surface : 'transparent',
                padding: S.md,
              }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm}>
                  <Text style={{ fontSize: 18, opacity: reached ? 1 : 0.3 }}>{t.emoji}</Text>
                  <Text style={[F.body, { fontWeight: '700', color: reached ? T.text : T.disabled }]}>
                    {t.name}
                  </Text>
                </Row>
                {current ? <Tag tone="accent">いまここ</Tag> : <Text style={F.tiny}>バッジ{t.need}個</Text>}
              </Row>
              {reached ? <Text style={[F.small, { marginTop: 4 }]}>「{t.say}」</Text> : null}
            </View>
          );
        })}
      </View>

      {/* バッジ一覧 */}
      <View style={{ gap: S.sm }}>
        <Text style={F.h2}>獲得したバッジ</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
          {BADGES.map((b) => {
            const got = !!state.badges[b.id];
            return (
              <View
                key={b.id}
                style={{
                  width: '48%',
                  ...inkBorder,
                  borderWidth: got ? 2 : 1.5,
                  borderColor: got ? T.border : T.borderSoft,
                  backgroundColor: got ? T.surface : T.sunk,
                  borderRadius: R.md,
                  padding: S.md,
                  gap: 4,
                }}>
                <Text style={{ fontSize: 26, opacity: got ? 1 : 0.25 }}>{got ? b.emoji : '❔'}</Text>
                <Text style={[F.body, { fontWeight: '700', color: got ? T.text : T.disabled }]}>
                  {got ? b.name : '？？？'}
                </Text>
                <Text style={F.tiny}>{got ? b.desc : b.hint}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[F.tiny, { color: C.ink300 }]}>
          記録はこの端末の中だけに保存される。アカウントもサーバーも使っていない。
        </Text>
      </View>
    </Screen>
  );
}
