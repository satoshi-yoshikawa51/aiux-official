/* まなぶ。コースとレッスンの一覧。職種で中身が変わるコースには印を付ける。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, ProgressBar, Row, Screen, SectionTitle, Tag } from '@/components/ui';
import { COURSES } from '@/data/courses';
import { getRole } from '@/data/roles';
import { useProgress } from '@/store/progress';
import { F, S, T, inkBorder } from '@/theme';

export default function LearnScreen() {
  const router = useRouter();
  const { state } = useProgress();
  const role = getRole(state.roleId);

  return (
    <Screen>
      <SectionTitle sub={role ? `${role.emoji} ${role.name}向けの内容で表示している` : undefined}>
        まなぶ
      </SectionTitle>

      {COURSES.map((course) => {
        const doneCount = course.lessons.filter((l) => state.done[l.id]).length;
        const cleared = doneCount === course.lessons.length;
        return (
          <Card key={course.id} style={{ gap: S.md }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={6}>
                  <Text style={{ fontSize: 18 }}>{course.emoji}</Text>
                  <Text style={F.h2}>{course.title}</Text>
                </Row>
                <Text style={F.small}>{course.desc}</Text>
              </View>
              {cleared ? <Tag tone="ok">修了</Tag> : null}
            </Row>

            {course.kind === 'role' ? (
              <Row gap={6}>
                <Tag tone="accent">職種別</Tag>
                <Text style={F.tiny}>
                  {role ? `${role.name}向けの例と手順が出る` : '職種を選ぶと内容が変わる'}
                </Text>
              </Row>
            ) : null}

            <ProgressBar value={doneCount} total={course.lessons.length} />
            <Text style={F.tiny}>
              {doneCount} / {course.lessons.length} 本
            </Text>

            <View style={{ gap: S.sm }}>
              {course.lessons.map((lesson, i) => {
                const done = !!state.done[lesson.id];
                const perfect = !!state.perfect[lesson.id];
                return (
                  <Pressable
                    key={lesson.id}
                    onPress={() => router.push(`/lesson/${lesson.id}`)}
                    style={({ pressed }) => [
                      {
                        ...inkBorder,
                        borderWidth: 1.5,
                        borderColor: done ? T.borderSoft : T.border,
                        backgroundColor: done ? T.sunk : T.surface,
                        padding: S.md,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Row gap={S.sm} style={{ flex: 1 }}>
                        <Text style={[F.label, { width: 20 }]}>{i + 1}</Text>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[F.body, { fontWeight: '700', color: T.text }]}>{lesson.title}</Text>
                          <Text style={F.tiny}>
                            {lesson.minutes}分・クイズ{lesson.quiz.length}問
                          </Text>
                        </View>
                      </Row>
                      <Text style={{ fontSize: 16 }}>{perfect ? '💯' : done ? '✅' : '▶︎'}</Text>
                    </Row>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
