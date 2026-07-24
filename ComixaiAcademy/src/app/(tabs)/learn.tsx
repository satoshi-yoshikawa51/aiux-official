/* まなぶ。コースとレッスンの一覧。職種で中身が変わるコースには印を付ける。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Badge, Panel, PressCard, Progress, Row, Screen, SectionHead } from '@/components/ui';
import { COURSES } from '@/data/courses';
import { getRole } from '@/data/roles';
import { useProgress } from '@/store/progress';
import { F, FONT, S, T } from '@/theme';

export default function LearnScreen() {
  const router = useRouter();
  const { state } = useProgress();
  const role = getRole(state.roleId);

  return (
    <Screen>
      <SectionHead
        kicker="COURSES"
        title="まなぶ"
        hand={role ? `いまは ${role.name} 向けで表示中` : undefined}
      />

      {COURSES.map((course, ci) => {
        const doneCount = course.lessons.filter((l) => state.done[l.id]).length;
        const cleared = doneCount === course.lessons.length;
        return (
          <Panel
            key={course.id}
            number={String(ci + 1)}
            tone={cleared ? 'lines' : 'none'}
            contentStyle={{ paddingTop: S.xl + S.sm, gap: S.md }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Row gap={6}>
                  <Text style={{ fontSize: 19 }}>{course.emoji}</Text>
                  <Text style={[F.h1, { flex: 1 }]}>{course.title}</Text>
                </Row>
                <Text style={F.small}>{course.desc}</Text>
              </View>
              {cleared ? <Badge tone="green">修了</Badge> : null}
            </Row>

            {course.kind === 'role' ? (
              <Row gap={6}>
                <Badge tone="red">職種別</Badge>
                <Text style={F.hand}>
                  {role ? `${role.name}向けの例が出る` : '職種を選ぶと内容が変わる'}
                </Text>
              </Row>
            ) : null}

            <Row gap={S.sm}>
              <View style={{ flex: 1 }}>
                <Progress value={doneCount} total={course.lessons.length} />
              </View>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: T.muted }}>
                {doneCount}/{course.lessons.length}
              </Text>
            </Row>

            <View style={{ gap: S.xs }}>
              {course.lessons.map((lesson, i) => {
                const done = !!state.done[lesson.id];
                const perfect = !!state.perfect[lesson.id];
                return (
                  <PressCard
                    key={lesson.id}
                    onPress={() => router.push(`/lesson/${lesson.id}`)}
                    style={{ backgroundColor: done ? T.sunk : T.surface }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Row gap={S.md} style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.mono, fontSize: 15, color: T.muted, width: 18 }}>
                          {i + 1}
                        </Text>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[F.strong, { fontSize: 14.5 }]}>{lesson.title}</Text>
                          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>
                            {lesson.minutes}min ・ QUIZ {lesson.quiz.length}
                          </Text>
                        </View>
                      </Row>
                      <Text style={{ fontSize: 17 }}>{perfect ? '💯' : done ? '✅' : '▶︎'}</Text>
                    </Row>
                  </PressCard>
                );
              })}
            </View>
          </Panel>
        );
      })}
    </Screen>
  );
}
