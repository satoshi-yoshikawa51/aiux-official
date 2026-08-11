/* ============================================================
   舞台の見本。**20枚ぜんぶを並べて、その場で試しに飾れる**画面。

   ▍なぜ要るのか
   舞台はガチャの景品なので、当てるまで見られない。**作った絵が実機で
   どう見えるかを確かめる手段が無かった**（絵を足すたびに20回まわす
   わけにもいかない）。ここから飾ればホームですぐ確認できる。

   ▍持ち物は増やさない
   押しても「持っている」ことにはしない。装備中のIDを差し替えるだけ。
   だからコレクションの数（n/20）も、ガチャの引きどころも変わらない。

   確認用の画面なので、公開前に せってい の入口ごと外すか、
   隠しの操作に付け替えること（→ (tabs)/settings.tsx）。
   ============================================================ */
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { useTap } from '@/components/motion';
import { StageEffect, StageGlow } from '@/components/stage-effect';
import { Badge, Row, Screen } from '@/components/ui';
import { RARITY_COLOR, THEMES, type Rarity, type StageTheme } from '@/data/gacha';
import { CLASSROOM } from '@/data/stage';
import { useProgress } from '@/store/progress';
import { BW, C, F, FONT, R, S, T } from '@/theme';

const GROUPS: { rarity: Rarity; note: string }[] = [
  { rarity: 'N', note: 'ふだんの場所。曇り・蛍光灯・低彩度' },
  { rarity: 'R', note: '光が主役。夕日・炎・ネオン・提灯' },
  { rarity: 'SR', note: '光条・鏡面・金。粒と光る枠つき' },
];

export default function StagesScreen() {
  const router = useRouter();
  const { state, previewTheme } = useProgress();

  const pick = (id: string) => {
    previewTheme(id);
    router.replace('/');
  };

  return (
    <Screen edges={['bottom']} tone="dots" style={{ gap: S.lg }}>
      {/* 題は Stack のヘッダーが持っているので、ここでは出さない（→ _layout.tsx） */}
      <Row gap={7} style={{ alignItems: 'flex-start' }}>
        <Icon name="palette" size={18} color={T.accent} />
        <Text style={[F.small, { flex: 1 }]}>
          {THEMES.length}枚ぜんぶ。押すと試しに飾れます——
          <Text style={{ color: T.muted }}>確認用なので、持ち物は増えません。</Text>
        </Text>
      </Row>

      {GROUPS.map((g) => {
        const list = THEMES.filter((t) => t.rarity === g.rarity);
        return (
          <View key={g.rarity} style={{ gap: S.sm }}>
            <Row gap={8} style={{ alignItems: 'baseline' }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 16, color: RARITY_COLOR[g.rarity] }}>
                {g.rarity}
              </Text>
              <Text style={[F.small, { flex: 1 }]}>{g.note}</Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>
                {list.length}枚
              </Text>
            </Row>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
              {list.map((t) => (
                <StageCard
                  key={t.id}
                  theme={t}
                  active={state.themeId === t.id}
                  onPress={() => pick(t.id)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

function StageCard({
  theme,
  active,
  onPress,
}: {
  theme: StageTheme;
  active: boolean;
  onPress: () => void;
}) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: true });
  const art = theme.art ?? CLASSROOM;
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={{ width: '47%' }}>
      <View
        style={{
          borderWidth: active ? BW.bold : BW.line,
          borderColor: C.ink900,
          borderRadius: R.sm,
          backgroundColor: T.surface,
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.97 : 1 }],
        }}>
        {/* 絵は**ホームと同じ縦横比**で切って出す。ここで見た印象と
            実際に飾ったときの印象がズレないように */}
        <View style={{ aspectRatio: 0.86 }}>
          <Image source={art.src} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          {theme.tint !== 'transparent' ? (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: theme.tint }}
            />
          ) : null}
          {theme.effect ? <StageEffect effect={theme.effect} /> : null}
          {theme.glow ? <StageGlow glow={theme.glow} /> : null}
        </View>
        <View style={{ padding: S.sm, gap: 3 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={[F.strong, { fontSize: 12.5, flex: 1 }]} numberOfLines={1}>
              {theme.name}
            </Text>
            <Text
              style={{ fontFamily: FONT.mono, fontSize: 9.5, color: RARITY_COLOR[theme.rarity] }}>
              {theme.rarity}
            </Text>
          </Row>
          <Text style={[F.tiny, { color: T.muted }]} numberOfLines={2}>
            {theme.desc}
          </Text>
          {active ? <Badge tone="red">かざり中</Badge> : null}
        </View>
      </View>
    </Pressable>
  );
}
