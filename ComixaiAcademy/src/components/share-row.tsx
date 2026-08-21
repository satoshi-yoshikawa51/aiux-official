/* ============================================================
   シェアの口。**節目にだけ**出す（→ lib/share.ts）。

   ▍常設しない
   ホームやバッジ画面に置きっぱなしにしても押されない。称号が上がった
   直後・SRを当てた直後・修了試験に受かった直後——**いちばん気分がいい
   瞬間**に、その場の結果を持って出るから押される。

   ▍もらえるものをボタンに書く
   はじめは「シェアする」＋説明文だったが、**何がもらえるのか読まないと
   分からなかった**（実機で「説明文がわかりにくい」）。ボタン自体に
   「シェアしてガチャP GET」と書き、初回の3Pは赤で立てて、
   条件（1日1回）は※で小さく添える。

   ▍お礼は小さく
   投稿したかどうかは検証できないので（→ lib/share.ts）、
   1日1回まで+1P、初回だけ+3P。ログインボーナス（1日3P）より小さい
   おまけなので、押すだけで取られても経済は動かない。
   ============================================================ */
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Button, Row } from '@/components/ui';
import { share, shareText, type ShareReason } from '@/lib/share';
import { playSound } from '@/lib/sound';
import { today, useProgress } from '@/store/progress';
import { C, F, FONT, T } from '@/theme';

export function ShareRow({
  reason,
  /** 黒地のカードの中に置くときは true（文字色を反転する） */
  onDark = false,
}: {
  reason: ShareReason;
  onDark?: boolean;
}) {
  const { state, claimShareBonus } = useProgress();
  const [note, setNote] = React.useState<string | null>(null);
  const done = Object.keys(state.done).length;

  /** 初回はまだか。ここだけ赤で立てる */
  const first = state.shareCount === 0;
  /** 今日のぶんは受け取り済みか */
  const claimed = state.lastShareDay === today();

  const press = async () => {
    const ok = await share(shareText(reason, { done, total: 17 }));
    if (!ok) return;
    const gained = claimShareBonus();
    if (gained > 0) playSound('badge');
    setNote(
      gained > 0
        ? `ありがとう。ガチャP +${gained}`
        : '今日のぶんは受け取り済みです。明日またどうぞ',
    );
  };

  return (
    <View style={{ gap: 5, alignItems: 'center' }}>
      {/* ▍赤にはしない
           同じコマに本来の行動（「ホームに飾る」など）の赤いボタンが
           いることがある。**1画面に赤2つ**だと、どちらが本命か分からない。
           目立たせる役目は、下の赤字「初回は3P GET！」に持たせる */}
      <Button
        label={claimed ? 'シェアする' : 'シェアしてガチャP GET'}
        onPress={press}
        variant="secondary"
        size="sm"
      />
      {/* 初回のごほうびは、いちばん目立つ形で1行 */}
      {first && !claimed ? (
        <Text
          style={{
            fontFamily: FONT.heading,
            fontSize: 13,
            /* 黒地の上では red500 が沈むので、明るいほうの赤にする */
            color: onDark ? C.red100 : C.red500,
          }}>
          初回は 3P GET！
        </Text>
      ) : null}
      <Text style={[F.tiny, { color: onDark ? C.ink300 : T.muted }]}>
        {claimed ? '※ 今日のぶんは受け取り済み（明日また +1P）' : '※ 1日1回まで'}
      </Text>
      {note ? (
        <Row gap={6}>
          <Icon name="sparkle" size={13} color={T.accent} />
          <Text style={[F.tiny, { color: onDark ? C.paper100 : T.text }]}>{note}</Text>
        </Row>
      ) : null}
    </View>
  );
}
