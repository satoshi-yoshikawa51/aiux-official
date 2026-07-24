/* バッジと称号。未獲得は伏せて、匂わせだけ出す（サイトの図鑑と同じ作法）。 */
import React from 'react';
import { Text, View } from 'react-native';

import { Badge, Panel, Pop, Progress, Row, Screen, SectionHead, Tone } from '@/components/ui';
import { BADGES, TITLES } from '@/data/badges';
import { useProgress, useStats } from '@/store/progress';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

export default function BadgesScreen() {
  const { state } = useProgress();
  const stats = useStats();

  return (
    <Screen>
      <SectionHead
        kicker="BADGES & RANKS"
        title="バッジ"
        hand={`${stats.badgeCount} / ${stats.badgeTotal} 個を獲得`}
      />

      {/* いまの称号 */}
      <Pop radius={R.md}>
        <Tone
          tone="lines"
          style={{
            backgroundColor: C.ink900,
            borderWidth: BW.bold,
            borderColor: C.ink900,
            borderRadius: R.md,
            padding: S.lg,
            gap: S.sm,
            overflow: 'hidden',
          }}>
          <Text style={[F.kicker, { color: C.red100 }]}>CURRENT RANK</Text>
          <Row gap={S.sm}>
            <Text style={{ fontSize: 30 }}>{stats.title.emoji}</Text>
            <Text style={[F.title, { color: C.paper50, flex: 1 }]}>{stats.title.name}</Text>
          </Row>
          <Progress value={stats.badgeCount} total={stats.badgeTotal} />
        </Tone>
      </Pop>

      {/* 称号の階段 */}
      <View style={{ gap: S.sm }}>
        <Text style={F.h1}>称号</Text>
        {TITLES.map((t) => {
          const reached = stats.badgeCount >= t.need;
          const current = stats.title.name === t.name;
          const face = (
            <View
              style={{
                backgroundColor: current ? T.accentSoft : reached ? T.surface : 'transparent',
                borderWidth: current ? BW.bold : BW.hair,
                borderColor: current ? T.border : T.borderSoft,
                borderRadius: R.md,
                padding: S.md,
                gap: 4,
              }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={S.sm} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 19, opacity: reached ? 1 : 0.25 }}>{t.emoji}</Text>
                  <Text
                    style={[F.strong, { color: reached ? T.text : T.disabled, fontSize: 15.5, flex: 1 }]}>
                    {t.name}
                  </Text>
                </Row>
                {current ? (
                  <Badge tone="red">いまここ</Badge>
                ) : (
                  <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>
                    BADGE {t.need}
                  </Text>
                )}
              </Row>
              {reached ? <Text style={F.hand}>「{t.say}」</Text> : null}
            </View>
          );
          return current ? (
            <Pop key={t.name} offset={POP.sm} radius={R.md}>
              {face}
            </Pop>
          ) : (
            <View key={t.name}>{face}</View>
          );
        })}
      </View>

      {/* バッジ一覧 */}
      <View style={{ gap: S.md }}>
        <Text style={F.h1}>獲得したバッジ</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.md }}>
          {BADGES.map((b) => {
            const got = !!state.badges[b.id];
            return got ? (
              <Panel key={b.id} tone="dots" style={{ width: '46%' }} contentStyle={{ gap: 4, padding: S.md }}>
                <Text style={{ fontSize: 28 }}>{b.emoji}</Text>
                <Text style={[F.strong, { fontSize: 14 }]}>{b.name}</Text>
                <Text style={F.tiny}>{b.desc}</Text>
              </Panel>
            ) : (
              <View
                key={b.id}
                style={{
                  width: '46%',
                  backgroundColor: T.sunk,
                  borderWidth: BW.hair,
                  borderColor: T.borderSoft,
                  borderRadius: R.sm,
                  padding: S.md,
                  gap: 4,
                  marginRight: POP.md,
                  marginBottom: POP.md,
                }}>
                <Text style={{ fontSize: 28, opacity: 0.2 }}>❔</Text>
                <Text style={[F.strong, { fontSize: 14, color: T.disabled }]}>？？？</Text>
                <Text style={F.tiny}>{b.hint}</Text>
              </View>
            );
          })}
        </View>
        <Text style={F.hand}>記録はこの端末の中だけ。アカウントもサーバーも使っていない。</Text>
      </View>
    </Screen>
  );
}
