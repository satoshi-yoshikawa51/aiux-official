/* ============================================================
   「COMIXAIでもっと知る」。レッスンの主題に直結するサイト側の
   受け皿（用語集・マンガ・レシピ・体験ゲーム）への出口。

   ▍置く場所は2つだけ
   レッスンの修了画面（学び終わった直後＝いちばん知りたい瞬間）と、
   持ち帰りページ（仕事の場所へ持っていくものと一緒に）。
   本文の途中には置かない——読んでいる最中に外へ誘うのは邪魔なだけで、
   用語のその場リンク（term-text.tsx）が既にその役を持っている。

   ▍外に出ることを隠さない
   押すとブラウザが開く。アプリ内で偽装せず、行の頭に種類の札
   （用語集／マンガ／…）を置いて、何が開くかを先に言う。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Linking, Platform, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Row, Tap } from '@/components/ui';
import { getRelated, type RelatedLink } from '@/data/related';
import { BW, C, F, FONT, R, S, T } from '@/theme';

/* 札の色。種類がひと目で分かる程度の差だけ付ける */
const TAG_BG: Record<RelatedLink['tag'], string> = {
  用語集: '#dbe7ff',
  マンガ: '#ffe3e0',
  あそぶ: '#dff3e0',
  レシピ: '#fff1cf',
  記事: '#eee6f7',
};

/** 1レッスンぶん。修了画面が使う */
export function RelatedLinks({ lessonId, heading = true }: { lessonId: string; heading?: boolean }) {
  return <RelatedLinkRows links={getRelated(lessonId)} heading={heading} />;
}

/** リンクの列そのもの。持ち帰りページは終えた回ぶんを束ねて渡す */
export function RelatedLinkRows({ links, heading = true }: { links: RelatedLink[]; heading?: boolean }) {
  if (links.length === 0) return null;

  const open = (url: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ gap: S.xs }}>
      {heading ? (
        <Row gap={6} style={{ marginBottom: 2 }}>
          <Icon name="compass" size={14} color={T.accent} />
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1.5, color: T.muted }}>
            COMIXAIでもっと知る
          </Text>
        </Row>
      ) : null}
      {links.map((l) => (
        <Tap key={l.url + l.label} onPress={() => open(l.url)} sparks={false} scale={0.98}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: S.sm,
              backgroundColor: C.paper0,
              borderWidth: BW.line,
              borderColor: C.ink900,
              borderRadius: R.sm,
              paddingVertical: 9,
              paddingHorizontal: S.md,
            }}>
            <View
              style={{
                backgroundColor: TAG_BG[l.tag],
                borderRadius: R.full,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}>
              <Text style={{ fontFamily: FONT.heading, fontSize: 10.5, color: C.ink900 }}>
                {l.tag}
              </Text>
            </View>
            <Text style={[F.small, { flex: 1, color: T.text }]} numberOfLines={2}>
              {l.label}
            </Text>
            {/* ブラウザが開くことの予告。矢印だけだと画面内遷移に見える */}
            <Icon name="rocket" size={13} color={T.muted} />
          </View>
        </Tap>
      ))}
    </View>
  );
}
