/* バッジと称号。未獲得は伏せて、匂わせだけ出す（サイトの図鑑と同じ作法）。

   見た目の作法はホームに揃えてある。
   ・いまの称号は**黒帯そのもの**が持つ（浮いた黒カードにすると、
     上のタブバーとの黒ではさむ効きが消えて、ただの島になる）
   ・「次にやること」＝次の称号。黒いカセットに黄色いピルで1つだけ置く */
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Spotlight } from '@/components/spotlight';
import { Badge, Cassette, Panel, Pill, Pop, Row, Screen, ScreenHead } from '@/components/ui';
import { BADGES, TITLES, nextTitle } from '@/data/badges';
import { useProgress, useStats } from '@/store/progress';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

export default function BadgesScreen() {
  const { state } = useProgress();
  const stats = useStats();
  const upcoming = nextTitle(stats.badgeCount);

  const header = (
    <ScreenHead
      kicker="CURRENT RANK"
      size="md"
      icon={<Icon name={stats.title.icon} size={26} color={C.paper0} />}
      title={stats.title.name}
      right={
        <Text style={{ fontFamily: FONT.mono, fontSize: 16, color: C.paper50 }}>
          {stats.badgeCount}
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300 }}>
            /{stats.badgeTotal}
          </Text>
        </Text>
      }
      progress={{ value: stats.badgeCount, total: stats.badgeTotal }}
      note={`レッスン ${stats.doneCount}/${stats.total}本 ・ ${stats.streak}日連続`}
      noteRight={upcoming ? `あと${upcoming.need - stats.badgeCount}で 上がる` : 'MAX'}
    />
  );

  return (
    <Screen header={header} tone="dots">
      {/* ———— 次の称号 ———— */}
      {upcoming ? (
        <Spotlight name="badges-next">
        <Cassette>
          <Row gap={8}>
            <Pill label="NEXT" />
            <Icon name={upcoming.icon} size={18} color={C.paper50} />
            <Text style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]} numberOfLines={1}>
              {upcoming.name}
            </Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300 }}>
              BADGE {upcoming.need}
            </Text>
          </Row>
          <Text style={[F.hand, { color: C.paper100 }]}>
            あと{upcoming.need - stats.badgeCount}個で「{upcoming.name}」になる
          </Text>
        </Cassette>
        </Spotlight>
      ) : (
        <Cassette>
          <Row gap={8}>
            <Icon name="crown" size={18} color={C.paper50} />
            <Text style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]}>
              称号はここが終点
            </Text>
          </Row>
        </Cassette>
      )}

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
                  <Icon name={t.icon} size={20} color={T.text} opacity={reached ? 1 : 0.25} />
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
              /* 紙そのものに網点が敷いてあるので、獲得済みのコマは白のまま抜く
                 （ここにも網点を足すと、地と見分けが付かなくなる） */
              <Panel key={b.id} style={{ width: '46%' }} contentStyle={{ gap: 4, padding: S.md }}>
                <Icon name={b.icon} size={28} color={T.text} />
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
                <Icon name="lock" size={26} color={T.disabled} opacity={0.6} />
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
