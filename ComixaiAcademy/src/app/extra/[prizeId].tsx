/* ============================================================
   おまけ。ガチャで当てた景品についてくる追加コンテンツ。

   ▍当てたものが、そのまま舞台装置になる
   舞台のおまけは**その舞台の絵の上**で、アバターのおまけは**その色の
   先生が出てきて**遊ぶ。絵もモデルももう有るので、新しい素材を1枚も
   足さずに「当てた甲斐」が出る。

   ▍持っていないものは開けない
   URLを直に叩かれても、持っていなければ入口だけ見せてガチャへ返す。

   ▍報酬は初回だけ（→ store/progress.tsx の clearExtra）
   2回目以降も遊べる。★の自己ベストは別に残る。
   ============================================================ */
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { LessonInteractiveCard } from '@/components/lesson-interactive';
import { PopIn } from '@/components/motion';
import { StageEffect, StageGlow } from '@/components/stage-effect';
import { Badge, Bubble, Button, Card, Panel, Row, Screen } from '@/components/ui';
import { getAvatar, getSkin } from '@/data/avatars';
import { getBadge } from '@/data/badges';
import { extraGameKey, getExtra, EXTRA_REWARD } from '@/data/extras';
import { GACHA_POOL, getTheme, RARITY_COLOR } from '@/data/gacha';
import { CLASSROOM } from '@/data/stage';
import { useProgress, type CompletionResult } from '@/store/progress';
import { C, F, FONT, S, T } from '@/theme';

export default function ExtraScreen() {
  const params = useLocalSearchParams<{ prizeId: string }>();
  const prizeId = String(params.prizeId ?? '');
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { state, clearExtra } = useProgress();

  const extra = getExtra(prizeId);
  const prize = GACHA_POOL.find((p) => p.id === prizeId);
  const owned =
    prize?.kind === 'theme' ? !!state.themes[prizeId] : !!state.skins[prizeId];
  const [result, setResult] = React.useState<CompletionResult | null>(null);
  const cleared = !!state.extras[prizeId];

  const head = <Stack.Screen options={{ title: extra?.title ?? 'おまけ' }} />;

  /* まだ中身を作っていない景品（SRはこれから）。
     入口だけ先に出しておくと、何が来るのか分かる */
  if (!prize || !extra) {
    return (
      <Screen tone="dots" style={{ gap: S.md }}>
        {head}
        <Card>
          <Text style={F.h1}>準備中</Text>
          <Text style={F.body}>
            この景品のおまけは、まだ作っている最中です。もう少し待ってください。
          </Text>
          <Button label="ガチャに戻る" onPress={() => router.back()} variant="secondary" />
        </Card>
      </Screen>
    );
  }

  if (!owned) {
    return (
      <Screen tone="dots" style={{ gap: S.md }}>
        {head}
        <Card>
          <Text style={F.h1}>まだ当てていません</Text>
          <Text style={F.body}>
            おまけは、その景品を持っている人だけが開けます。{'\n'}
            {prize.name}（{prize.rarity}）を当ててから、もう一度どうぞ。
          </Text>
          <Button label="ガチャへ" onPress={() => router.replace('/gacha')} />
        </Card>
      </Screen>
    );
  }

  const theme = prize.kind === 'theme' ? getTheme(prizeId) : null;
  const art = theme?.art ?? CLASSROOM;
  const skin = prize.kind === 'avatar' ? getSkin(prizeId) : null;
  const avatar = getAvatar(state.avatarId, skin?.id);
  /* コマの中に立たせる大きさ。ホームほど大きく取らない（読み物が主） */
  const stageW = Math.min(width - S.lg * 4, 230);

  const onCleared = () => {
    /* 記録は1回で足りる。2周目に押しても報酬は出ない（store側で判定） */
    setResult(clearExtra(prizeId));
  };

  return (
    <Screen tone="dots" style={{ gap: S.md }}>
      {head}

      {/* ———— 当てたものを、そのまま見せる ———— */}
      <Panel
        bg={art.src}
        bgRatio={art.ratio}
        bgColor={art.wall}
        caption={prize.kind === 'theme' ? prize.name : (skin?.name ?? prize.name)}
        contentStyle={{ padding: S.sm, gap: S.sm, minHeight: 190, justifyContent: 'flex-end' }}>
        {theme && theme.tint !== 'transparent' ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: theme.tint }}
          />
        ) : null}
        {theme?.effect ? <StageEffect effect={theme.effect} /> : null}
        {theme?.glow ? <StageGlow glow={theme.glow} /> : null}

        <Row style={{ position: 'absolute', top: 6, left: 6 }}>
          <View
            style={{
              backgroundColor: C.ink900,
              borderRadius: 999,
              paddingHorizontal: 9,
              paddingVertical: 4,
            }}>
            <Text
              style={{ fontFamily: FONT.mono, fontSize: 10, color: RARITY_COLOR[prize.rarity] }}>
              {prize.rarity} のおまけ
            </Text>
          </View>
        </Row>

        {/* アバターのおまけは、その色の先生に出てきてもらう */}
        {prize.kind === 'avatar' ? (
          <View style={{ alignItems: 'center' }}>
            <Avatar3D
              key={avatar.id + (skin?.id ?? '')}
              avatar={avatar}
              width={stageW}
              height={Math.round(stageW * 0.95)}
            />
          </View>
        ) : null}
      </Panel>

      {/* ———— 先生のはなし ———— */}
      {extra.say.map((line, i) => (
        <Bubble key={i} text={line} />
      ))}

      <Card tone="warn">
        <Row gap={7} style={{ alignItems: 'flex-start' }}>
          <Icon name="bulb" size={17} color={C.ink900} />
          <Text style={[F.strong, { flex: 1 }]}>{extra.point}</Text>
        </Row>
      </Card>

      {/* ———— 本体 ———— */}
      <LessonInteractiveCard
        spec={extra.game}
        gameKey={extraGameKey(prizeId)}
        onDone={(ok) => ok && onCleared()}
      />

      {/* ———— 結果 ———— */}
      {result ? (
        <PopIn>
          <Card>
            <Row gap={7}>
              <Icon name="check" size={18} color={T.ok} />
              <Text style={F.h1}>おまけクリア</Text>
            </Row>
            {result.coinsGained > 0 ? (
              <Text style={F.body}>
                ガチャP +{result.coinsGained}
                {result.coinsGained > EXTRA_REWARD[prize.rarity] ? '（バッジぶんを含む）' : ''}
              </Text>
            ) : (
              <Text style={F.body}>クリア済みなので、Pは入りません。★は更新されます。</Text>
            )}
            {result.newBadges.length > 0 ? (
              <Row gap={S.xs} style={{ flexWrap: 'wrap' }}>
                {result.newBadges.map((id) => (
                  <Badge key={id} tone="yellow">
                    {getBadge(id)?.name ?? id}
                  </Badge>
                ))}
              </Row>
            ) : null}
            {result.newTitle ? (
              <Text style={[F.strong, { color: T.accent }]}>
                称号が上がりました — {result.newTitle.name}
              </Text>
            ) : null}
            <Button label="ガチャに戻る" onPress={() => router.back()} variant="secondary" />
          </Card>
        </PopIn>
      ) : cleared ? (
        <Row gap={6}>
          <Icon name="check" size={14} color={T.ok} />
          <Text style={[F.tiny, { color: T.ok }]}>クリア済み。もう一度遊べます（★は更新されます）</Text>
        </Row>
      ) : null}
    </Screen>
  );
}
