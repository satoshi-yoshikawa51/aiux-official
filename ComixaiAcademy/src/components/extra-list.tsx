/* ============================================================
   おまけの棚。当てたR以上の景品に付いてくる「遊べる回」を並べる。
   （→ data/extras/、app/extra/[prizeId].tsx）

   ▍置き場所は3つ
   - ガチャ画面（当てた直後に、その場で気づける）
   - まなぶタブ（**遊ぶものを探すのはこちら**。ガチャの中だけだと気づかない
     ——実機で指摘）
   - おまけの一覧（app/extras.tsx）

   ▍持っているものだけ並べる
   未入手のおまけは名前も出さない。**中身が見えてしまうと、当てる
   楽しみを先に消費する**ことになる。代わりに残り本数だけ出す。
   ============================================================ */
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Badge, Row, Tap } from '@/components/ui';
import { EXTRA_TOTAL, getExtra } from '@/data/extras';
import { GACHA_POOL, RARITY_COLOR } from '@/data/gacha';
import { useProgress } from '@/store/progress';
import { BW, F, FONT, R, S, T } from '@/theme';

/** 持っている景品のうち、おまけが遊べるもの */
export function ownedExtras(state: { themes: Record<string, number>; skins: Record<string, number> }) {
  return GACHA_POOL.filter((p) =>
    p.rarity === 'N' ? false : p.kind === 'theme' ? !!state.themes[p.id] : !!state.skins[p.id],
  );
}

export function ExtraList({ heading = true }: { heading?: boolean }) {
  const router = useRouter();
  const { state } = useProgress();

  const owned = ownedExtras(state);
  const doneCount = Object.keys(state.extras).length;

  return (
    <View style={{ gap: S.sm }}>
      {heading ? (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={F.h1}>おまけ</Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>
              {doneCount}/{EXTRA_TOTAL}
            </Text>
          </Row>
          <Text style={F.small}>
            R以上の景品には、それぞれ遊べる回がついています。
            <Text style={{ color: T.muted }}>当てた舞台やキャラが、そのまま出てきます。</Text>
          </Text>
        </>
      ) : null}

      {owned.length === 0 ? (
        <Text style={F.hand}>Rを1つ当てると、ここに増えます。</Text>
      ) : (
        owned.map((p) => {
          const extra = getExtra(p.id);
          const cleared = !!state.extras[p.id];
          return (
            <Tap key={p.id} onPress={() => router.push(`/extra/${p.id}`)} sparks={false} scale={0.98}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: S.sm,
                  borderWidth: BW.line,
                  borderColor: cleared ? T.borderSoft : T.border,
                  borderRadius: R.sm,
                  backgroundColor: cleared ? T.sunk : T.surface,
                  padding: S.sm,
                }}>
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    color: RARITY_COLOR[p.rarity],
                    width: 24,
                  }}>
                  {p.rarity}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[F.strong, { fontSize: 13.5 }]} numberOfLines={1}>
                    {extra ? extra.title : '準備中'}
                  </Text>
                  <Text style={[F.tiny, { color: T.muted }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                </View>
                {cleared ? (
                  <Row gap={4}>
                    <Icon name="check" size={13} color={T.ok} />
                    <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: T.ok }}>CLEAR</Text>
                  </Row>
                ) : extra ? (
                  <Badge tone="red">あそぶ</Badge>
                ) : (
                  <Badge tone="paper">準備中</Badge>
                )}
              </View>
            </Tap>
          );
        })
      )}
    </View>
  );
}
