/* ============================================================
   持ち帰り（チートシート）。

   ▍なぜ要るのか
   17本終えても、手元に残るのは称号だけだった。「今日から使う3枚」という
   レッスンがあるのに、**その3枚を保存する場所がどこにも無い**。
   学んだことが端末の中の進捗フラグにしかならないのは、実務のアプリとして
   おかしい。

   ▍集めるのは「自分のもの」だけ
   共通の解説は集めない（それはレッスンを読み返せばいい）。ここに載せるのは
   **職種にひもづいたもの**——「あなたの現場だと」と、職種別のプロンプト。
   自分にしか出ていない内容だから、持って出る値打ちがある。

   ▍終えたレッスンぶんだけ出す
   全部を最初から見せると、ここを読めば済むことになってレッスンが要らなくなる。
   通した回のぶんだけ増えていく。**進めた量がそのまま厚みになる**。

   ▍まるごとコピーできること
   スマホの画面で読み返すためのものではなく、**仕事の場所へ持っていくもの**。
   メモアプリでもSlackでも貼れるプレーンテキストで出す。
   ============================================================ */
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Badge, Button, Card, Panel, Row, Screen, ScreenHead } from '@/components/ui';
import { COURSES, resolveCard } from '@/data/courses';
import { getRole } from '@/data/roles';
import { useProgress } from '@/store/progress';
import { BW, C, F, FONT, R, S, T } from '@/theme';

interface Entry {
  courseTitle: string;
  lessonTitle: string;
  /** その職種向けの一言（roleNote） */
  note?: string;
  /** その職種向けのプロンプトひな形 */
  prompt?: string;
}

export default function SheetScreen() {
  const { state } = useProgress();
  const role = getRole(state.roleId);
  const [copied, setCopied] = React.useState<string | null>(null);

  const entries = React.useMemo<Entry[]>(() => {
    const out: Entry[] = [];
    for (const course of COURSES) {
      for (const lesson of course.lessons) {
        if (!state.done[lesson.id]) continue;
        const note = state.roleId ? lesson.roleNote?.[state.roleId] : undefined;
        /* プロンプトは職種別のものだけ拾う。共通の例文は「自分のもの」ではない */
        let prompt: string | undefined;
        for (const card of lesson.cards) {
          if (!card.promptByRole) continue;
          const p = resolveCard(card, state.roleId, state.avatarId).prompt;
          if (p) prompt = p;
        }
        if (!note && !prompt) continue;
        out.push({ courseTitle: course.title, lessonTitle: lesson.title, note, prompt });
      }
    }
    return out;
  }, [state.done, state.roleId, state.avatarId]);

  const copy = async (text: string, key: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(key);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  /** まるごと1枚のテキストにする。貼る先を選ばないよう飾りを入れない */
  const asText = () => {
    const lines = [`COMIXAI アカデミー / 持ち帰り（${role?.name ?? ''}）`, ''];
    for (const e of entries) {
      lines.push(`■ ${e.lessonTitle}`);
      if (e.note) lines.push(e.note);
      if (e.prompt) lines.push('', '[プロンプト]', e.prompt);
      lines.push('');
    }
    return lines.join('\n').trim();
  };

  const header = (
    <ScreenHead
      kicker="CHEAT SHEET"
      title="持ち帰り"
      right={
        <Text style={{ fontFamily: FONT.mono, fontSize: 16, color: C.paper50 }}>{entries.length}</Text>
      }
      note={role ? `${role.name}のあなた向けに集めたもの` : '職種を選ぶと集まります'}
      noteRight="終えた回のぶん"
    />
  );

  if (entries.length === 0) {
    return (
      <Screen header={header} tone="dots">
        <Panel contentStyle={{ gap: S.sm, alignItems: 'center', paddingVertical: S.xl }}>
          <Icon name="folder" size={30} color={T.disabled} />
          <Text style={F.h2}>まだ何もありません</Text>
          <Text style={[F.hand, { textAlign: 'center' }]}>
            レッスンを終えるたびに、あなたの職種向けの一言とプロンプトがここに溜まります。
          </Text>
        </Panel>
      </Screen>
    );
  }

  return (
    <Screen header={header} tone="dots">
      <Card tone="ok" variant="flat" contentStyle={{ padding: S.md, gap: S.sm }}>
        <Text style={F.small}>
          仕事で使う場所へ持っていくためのものです。まるごとコピーして、メモや社内チャットに
          貼っておくと、次に迷ったときに探さずに済みます。
        </Text>
        <Button
          label={copied === 'all' ? 'コピーした' : 'ぜんぶコピーする'}
          variant={copied === 'all' ? 'yellow' : 'primary'}
          size="sm"
          onPress={() => copy(asText(), 'all')}
          style={{ alignSelf: 'flex-start' }}
        />
      </Card>

      {entries.map((e, i) => (
        <Panel key={i} contentStyle={{ gap: S.sm, padding: S.md }}>
          <Row gap={6}>
            <Badge tone="paper">{e.courseTitle}</Badge>
          </Row>
          <Text style={F.h2}>{e.lessonTitle}</Text>
          {e.note ? <Text style={F.body}>{e.note}</Text> : null}
          {e.prompt ? (
            <View style={{ gap: S.sm }}>
              <View
                style={{
                  backgroundColor: C.ink900,
                  borderRadius: R.sm,
                  borderWidth: BW.line,
                  borderColor: C.ink900,
                  padding: S.md,
                }}>
                <Text style={{ fontFamily: FONT.mono, color: C.paper50, fontSize: 12, lineHeight: 21 }}>
                  {e.prompt}
                </Text>
              </View>
              <Button
                label={copied === `p${i}` ? 'コピーした' : 'このプロンプトをコピー'}
                variant={copied === `p${i}` ? 'yellow' : 'secondary'}
                size="sm"
                onPress={() => copy(e.prompt!, `p${i}`)}
                style={{ alignSelf: 'flex-start' }}
              />
            </View>
          ) : null}
        </Panel>
      ))}
    </Screen>
  );
}
