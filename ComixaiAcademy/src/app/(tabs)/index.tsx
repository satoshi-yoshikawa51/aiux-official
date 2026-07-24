/* ホーム。選んだアバターが常駐して、次にやることを言ってくる画面。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import type { AvatarMotion } from '@/avatar/motions';
import { Bubble, Button, Card, ProgressBar, Row, Screen, Tag } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { COURSES } from '@/data/courses';
import { nextTitle } from '@/data/badges';
import { getRole } from '@/data/roles';
import { useProgress, useStats } from '@/store/progress';
import { F, S, T } from '@/theme';

/** アバターをつついたときに出る、どうでもいい雑談 */
const SMALL_TALK: { say: string; motion: AvatarMotion; emote?: string }[] = [
  { say: '……なんだ。用が無いなら、手を動かせ。', motion: 'arms-crossed' },
  { say: '休憩か。まあ、詰め込みすぎても入らないからな。', motion: 'idle-b' },
  { say: '1日1本で十分だ。続けるほうが難しい。', motion: 'explain' },
  { say: 'わからんところは、飛ばしていい。あとで戻れ。', motion: 'wave' },
  { say: '……そんなに見るな。', motion: 'worried', emote: '❗' },
  { say: 'よし、いい顔になってきた。', motion: 'laugh', emote: '✨' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { state } = useProgress();
  const stats = useStats();
  const { width } = useWindowDimensions();

  const avatarRef = React.useRef<AvatarHandle>(null);
  const avatar = getAvatar(state.avatarId);
  const role = getRole(state.roleId);

  /* まだ終わっていない最初のレッスン */
  const next = React.useMemo(() => {
    for (const course of COURSES) {
      for (const lesson of course.lessons) {
        if (!state.done[lesson.id]) return { course, lesson };
      }
    }
    return null;
  }, [state.done]);

  const [talk, setTalk] = React.useState<{ say: string; motion?: AvatarMotion } | null>(null);

  const greeting = React.useMemo(() => {
    if (talk) return talk.say;
    if (!next) return 'ぜんぶ終わったな。……よくやった。あとは現場で使え。';
    if (stats.doneCount === 0) return `${role?.name ?? ''}か。なら、話が早い。まずは1本だけやってみろ。`;
    if (stats.streak >= 3) return `${stats.streak}日続いてるな。……その調子だ。`;
    return `次は「${next.lesson.title}」だ。${next.lesson.minutes}分で終わる。`;
  }, [talk, next, stats.doneCount, stats.streak, role?.name]);

  const poke = () => {
    const pick = SMALL_TALK[Math.floor(Math.random() * SMALL_TALK.length)];
    setTalk(pick);
    avatarRef.current?.play(pick.motion);
    if (pick.emote) avatarRef.current?.emote(pick.emote);
  };

  const stageW = Math.min(width - S.lg * 2, 380);
  const stageH = Math.round(stageW * 0.9);

  return (
    <Screen>
      {/* 称号バー */}
      <Card tone="sunk" style={{ gap: S.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row>
            <Text style={{ fontSize: 22 }}>{stats.title.emoji}</Text>
            <View>
              <Text style={F.label}>いまの称号</Text>
              <Text style={F.h2}>{stats.title.name}</Text>
            </View>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={F.label}>バッジ</Text>
            <Text style={F.h2}>
              {stats.badgeCount}
              <Text style={F.small}> / {stats.badgeTotal}</Text>
            </Text>
          </View>
        </Row>
        <ProgressBar value={stats.badgeCount} total={stats.badgeTotal} />
        <Text style={F.tiny}>
          {nextTitle(stats.badgeCount)
            ? `あと${nextTitle(stats.badgeCount)!.need - stats.badgeCount}個で「${nextTitle(stats.badgeCount)!.name}」`
            : '最高位に到達している'}
        </Text>
      </Card>

      {/* アバターのステージ */}
      <View style={{ alignItems: 'center' }}>
        <Bubble text={greeting} style={{ alignSelf: 'stretch', marginBottom: S.lg }} />
        <Pressable onPress={poke} style={styles.stage}>
          <Avatar3D ref={avatarRef} avatar={avatar} width={stageW} height={stageH} />
        </Pressable>
        <Row gap={S.xs} style={{ marginTop: S.xs }}>
          <Tag>{avatar.name}</Tag>
          {role ? <Tag tone="accent">{role.emoji} {role.name}</Tag> : null}
        </Row>
      </View>

      {/* 次にやること */}
      {next ? (
        <Card>
          <Text style={F.label}>つづきから</Text>
          <Text style={F.h2}>
            {next.course.emoji} {next.lesson.title}
          </Text>
          <Text style={F.small}>{next.lesson.summary}</Text>
          <Button
            label={`はじめる（${next.lesson.minutes}分）`}
            onPress={() => router.push(`/lesson/${next.lesson.id}`)}
            style={{ marginTop: S.sm }}
          />
        </Card>
      ) : (
        <Card tone="ok">
          <Text style={F.h2}>全課程、修了</Text>
          <Text style={F.small}>やり直したいレッスンは「まなぶ」から何度でも開ける。</Text>
        </Card>
      )}

      {/* ミニ統計 */}
      <Row gap={S.sm}>
        <Stat label="連続" value={`${stats.streak}日`} />
        <Stat label="修了" value={`${stats.doneCount}/${stats.total}`} />
        <Stat label="達成率" value={`${stats.percent}%`} />
      </Row>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card tone="surface" style={{ flex: 1, alignItems: 'center', gap: 2, padding: S.md }}>
      <Text style={F.label}>{label}</Text>
      <Text style={[F.h2, { color: T.text }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'flex-end' },
});
