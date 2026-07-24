/* ホーム。選んだアバターが常駐して、次にやることを言ってくる画面。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import type { AvatarMotion } from '@/avatar/motions';
import { Badge, Bubble, Button, Card, Panel, Pop, Progress, Row, Screen, Tone } from '@/components/ui';
import { nextTitle } from '@/data/badges';
import { getAvatar } from '@/data/avatars';
import { COURSES } from '@/data/courses';
import { getRole } from '@/data/roles';
import { useProgress, useStats } from '@/store/progress';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';


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

  const next = React.useMemo(() => {
    for (const course of COURSES) {
      for (const lesson of course.lessons) {
        if (!state.done[lesson.id]) return { course, lesson };
      }
    }
    return null;
  }, [state.done]);

  const [talk, setTalk] = React.useState<{ say: string } | null>(null);

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

  const stageW = Math.min(width - S.lg * 2 - POP.md - S.lg * 2, 320);
  const upcoming = nextTitle(stats.badgeCount);

  return (
    <Screen>
      {/* 称号バー：黒ベタ＋網点のヘッダー */}
      <Pop radius={R.md}>
        <Tone
          tone="dots"
          style={{
            backgroundColor: C.ink900,
            borderWidth: BW.bold,
            borderColor: C.ink900,
            borderRadius: R.md,
            padding: S.lg,
            gap: S.sm,
            overflow: 'hidden',
          }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 2 }}>
              <Text style={[F.kicker, { color: C.red100 }]}>YOUR RANK</Text>
              <Row gap={6}>
                <Text style={{ fontSize: 22 }}>{stats.title.emoji}</Text>
                <Text style={[F.h1, { color: C.paper50 }]}>{stats.title.name}</Text>
              </Row>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[F.kicker, { color: C.red100 }]}>BADGE</Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 20, color: C.paper50 }}>
                {stats.badgeCount}
                <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: C.ink300 }}>
                  /{stats.badgeTotal}
                </Text>
              </Text>
            </View>
          </Row>
          <Progress value={stats.badgeCount} total={stats.badgeTotal} />
          <Text style={[F.hand, { color: C.paper100 }]}>
            {upcoming
              ? `あと${upcoming.need - stats.badgeCount}個で「${upcoming.name}」`
              : '最高位に到達している'}
          </Text>
        </Tone>
      </Pop>

      {/* アバターのステージ */}
      <View>
        <Bubble text={greeting} style={{ marginBottom: S.xl, marginRight: POP.sm }} />
        <Panel tone="dots" caption={`${avatar.name}（つつくと反応する）`} contentStyle={{ paddingBottom: S.xl }}>
          <Pressable onPress={poke} style={{ alignItems: 'center' }}>
            <Avatar3D ref={avatarRef} avatar={avatar} width={stageW} height={Math.round(stageW * 0.92)} />
          </Pressable>
          <Row gap={6} style={{ justifyContent: 'center' }}>
            <Badge tone="paper">{avatar.name}</Badge>
            {role ? <Badge tone="red">{role.emoji} {role.name}</Badge> : null}
          </Row>
        </Panel>
      </View>

      {/* 次にやること */}
      {next ? (
        <Panel number="次" tilt={-0.6} contentStyle={{ paddingTop: S.xl + S.sm, gap: S.md }}>
          <Text style={F.kicker}>{next.course.title.toUpperCase?.() ?? next.course.title}</Text>
          <Text style={F.h1}>
            {next.course.emoji} {next.lesson.title}
          </Text>
          <Text style={F.body}>{next.lesson.summary}</Text>
          <Row gap={6}>
            <Badge tone="paper">{next.lesson.minutes}分</Badge>
            <Badge tone="paper">クイズ{next.lesson.quiz.length}問</Badge>
          </Row>
          <Button label="つづきから はじめる" onPress={() => router.push(`/lesson/${next.lesson.id}`)} />
        </Panel>
      ) : (
        <Card tone="ok">
          <Text style={F.h1}>全課程、修了</Text>
          <Text style={F.body}>やり直したいレッスンは「まなぶ」から何度でも開ける。</Text>
        </Card>
      )}

      {/* ミニ統計 */}
      <Row gap={S.sm} style={{ alignItems: 'stretch' }}>
        <Stat label="STREAK" value={String(stats.streak)} unit="日" />
        <Stat label="DONE" value={String(stats.doneCount)} unit={`/${stats.total}`} />
        <Stat label="RATE" value={String(stats.percent)} unit="%" />
      </Row>
    </Screen>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Pop offset={POP.sm} radius={R.sm} style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: T.surface,
          borderWidth: BW.line,
          borderColor: T.border,
          borderRadius: R.sm,
          paddingVertical: S.md,
          alignItems: 'center',
          gap: 2,
        }}>
        <Text style={F.kicker}>{label}</Text>
        <Row gap={1} style={{ alignItems: 'baseline' }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 22, color: T.text }}>{value}</Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>{unit}</Text>
        </Row>
      </View>
    </Pop>
  );
}
