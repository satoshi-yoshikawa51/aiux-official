/* ============================================================
   シェアの口。**節目にだけ**出す（→ lib/share.ts）。

   ▍常設しない
   ホームやバッジ画面に置きっぱなしにしても押されない。称号が上がった
   直後・SRを当てた直後・修了試験に受かった直後——**いちばん気分がいい
   瞬間**に、その場の結果を持って出るから押される。

   ▍お礼は小さく
   投稿したかどうかは検証できないので（→ lib/share.ts）、
   1日1回まで+1P、初回だけ+3P。ログインボーナスと同額なので、
   押すだけで取られても経済は動かない。
   ============================================================ */
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Button, Row } from '@/components/ui';
import { share, shareText, type ShareReason } from '@/lib/share';
import { playSound } from '@/lib/sound';
import { useProgress } from '@/store/progress';
import { C, F, S, T } from '@/theme';

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

  const press = async () => {
    const ok = await share(shareText(reason, { done, total: 17 }));
    if (!ok) return;
    const gained = claimShareBonus();
    if (gained > 0) playSound('badge');
    setNote(
      gained > 0
        ? `ありがとう。ガチャP +${gained}`
        : '今日のぶんはもう受け取っています（明日また+1P）',
    );
  };

  return (
    <View style={{ gap: 6 }}>
      <Row gap={S.sm}>
        <Button label="シェアする" onPress={press} variant="secondary" size="sm" />
        <Text style={[F.tiny, { flex: 1, color: onDark ? C.ink300 : T.muted }]}>
          1日1回まで、ガチャP +1
        </Text>
      </Row>
      {note ? (
        <Row gap={6}>
          <Icon name="sparkle" size={13} color={T.accent} />
          <Text style={[F.tiny, { flex: 1, color: onDark ? C.paper100 : T.text }]}>{note}</Text>
        </Row>
      ) : null}
    </View>
  );
}
