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
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { LessonInteractiveCard } from '@/components/lesson-interactive';
import { PopIn } from '@/components/motion';
import { StageEffect, StageGlow } from '@/components/stage-effect';
import { Badge, Bubble, Button, Card, Panel, Row, Screen } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { getBadge } from '@/data/badges';
import { extraGameKey, getExtra, EXTRA_REWARD } from '@/data/extras';
import { DEFAULT_HORIZON, GACHA_POOL, getTheme, RARITY_COLOR } from '@/data/gacha';
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

  /* 何コマ目のセリフを出しているか。コマを押すと次へ */
  const [line, setLine] = React.useState(0);

  /* ▍コマの高さは端末幅から決め打ちにする
     ホームは1画面ぜんぶがコマなので余りから出せるが、こちらは下に
     読み物とゲームが続く。コマだけで画面を埋めない高さにする */
  const panelH = Math.round(Math.min(width, 460) * 0.92);

  /* 中身の実寸。ここから絵とキャラの大きさを出す（→ (tabs)/index.tsx） */
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  /* 寸法が揺れているあいだ渡さない。Avatar3D は寸法が変わるたびに
     GLBを読み直すので、素直に繋ぐと起動時に2〜3回読む */
  const [settled, setSettled] = React.useState({ w: 0, h: 0 });
  React.useEffect(() => {
    const t = setTimeout(() => setSettled(box), 180);
    return () => clearTimeout(t);
  }, [box.w, box.h]);

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

  /* ▍舞台のおまけ＝その舞台／キャラのおまけ＝いま飾っている舞台
     どちらも「先生がその場所に立ってしゃべる」形にそろえる。
     絵だけ出してフキダシを外に並べると、**誰もいない風景の下に
     吹き出しが浮かぶ**画になって落ち着かない（実機で指摘） */
  const theme = prize.kind === 'theme' ? getTheme(prizeId) : getTheme(state.themeId);
  const art = theme.art ?? CLASSROOM;
  /* アバターのおまけは**その相棒本人**が出てくる（景品IDがそのままアバターID）。
     舞台のおまけは誰が出るか決まっていないので、いま使っている相棒 */
  const avatar = getAvatar(prize.kind === 'avatar' ? prizeId : state.avatarId);

  /* 絵は**コマを覆いきる最小の大きさ**で敷き、キャラの目線を絵の地平線に
     乗せる。ズレたぶんが「巨人」「小人」として出るので、ホームと同じ式で
     出す（→ (tabs)/index.tsx の「舞台の大きさ」） */
  const bgHeight =
    box.w > 0 ? Math.ceil(Math.max(panelH, (box.w + S.sm * 2) / art.ratio)) : undefined;
  const stageH =
    settled.w > 0 && bgHeight
      ? Math.min(
          Math.round((bgHeight * (1 - (art.horizon ?? DEFAULT_HORIZON))) / 0.877),
          Math.floor(box.h),
        )
      : 0;

  const last = line >= extra.say.length - 1;
  const next = () => setLine((n) => Math.min(extra.say.length - 1, n + 1));

  const onCleared = () => {
    /* 記録は1回で足りる。2周目に押しても報酬は出ない（store側で判定） */
    setResult(clearExtra(prizeId));
  };

  return (
    <Screen tone="dots" style={{ gap: S.md }}>
      {head}

      {/* ———— 当てたものの中で、先生がしゃべる ———— */}
      <Pressable onPress={next} disabled={last}>
        <Panel
          bg={art.src}
          bgRatio={art.ratio}
          bgColor={art.wall}
          bgHeight={bgHeight}
          caption={prize.name}
          contentStyle={{ height: panelH, padding: S.sm, gap: S.sm, justifyContent: 'flex-end' }}>
          {theme.tint !== 'transparent' ? (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: theme.tint }}
            />
          ) : null}
          {theme.effect ? <StageEffect effect={theme.effect} /> : null}
          {theme.glow ? <StageGlow glow={theme.glow} /> : null}

          {/* レア度の札は**左下**。上に置くとフキダシの下敷きになる
              （フキダシは空きの真ん中＝キャラが高いとコマの上端に来る）。
              右下はキャプション（景品名）が使っている */}
          <View
            style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 5 }}
            pointerEvents="none">
            <View
              style={{
                backgroundColor: C.ink900,
                borderRadius: 999,
                paddingHorizontal: 9,
                paddingVertical: 4,
              }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: RARITY_COLOR[prize.rarity] }}>
                {prize.rarity} のおまけ
              </Text>
            </View>
          </View>

          {/* 中身の高さを測る。この高さから絵とキャラの大きさを出す
              （ホームと同じ考え方 → (tabs)/index.tsx） */}
          <View
            style={{ flex: 1, justifyContent: 'flex-end', gap: S.sm }}
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout;
              setBox((p) => (Math.abs(p.w - w) < 2 && Math.abs(p.h - h) < 2 ? p : { w, h }));
            }}>
            {/* フキダシはコマの上端とキャラの頭の中間に置く */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Bubble text={extra.say[line]} />
            </View>
            <View style={{ alignItems: 'center' }}>
              {stageH > 0 ? (
                <Avatar3D
                  key={avatar.id}
                  avatar={avatar}
                  width={Math.floor(settled.w)}
                  height={stageH}
                />
              ) : null}
            </View>
          </View>

        </Panel>
      </Pressable>

      {/* ▍つづきの合図はコマの外に出す
          コマの中に置くと、フキダシかキャプションのどちらかと必ず重なる
          （上はフキダシ、右下は景品名、左下はレア度の札で埋まっている） */}
      {!last ? (
        <Row gap={6} style={{ justifyContent: 'flex-end' }}>
          <Text style={[F.hand, { fontSize: 12.5, color: T.muted }]}>
            コマを押すと、つづき（{line + 1}/{extra.say.length}）
          </Text>
          <Icon name="play" size={11} color={T.muted} />
        </Row>
      ) : null}

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
