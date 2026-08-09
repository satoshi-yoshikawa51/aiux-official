/* まなぶ。コースとレッスンの一覧。職種で中身が変わるコースには印を付ける。

   見た目の作法はホームに揃えてある（黒帯・網点の紙・黒いカセット）。
   ここでの「次にやること」＝まだ終わっていない最初のレッスン。
   黄色いピルはそのカセットにだけ置く（1画面に1つ）。 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Spotlight } from '@/components/spotlight';
import {
  Badge,
  Button,
  Cassette,
  Panel,
  Pill,
  PressCard,
  Progress,
  Row,
  Screen,
  ScreenHead,
} from '@/components/ui';
import { COURSES } from '@/data/courses';
import { getRole } from '@/data/roles';
import { useProgress, useReview } from '@/store/progress';
import { C, F, FONT, R, S, T } from '@/theme';

export default function LearnScreen() {
  const router = useRouter();
  const { state } = useProgress();
  const role = getRole(state.roleId);
  const review = useReview();

  const lessons = React.useMemo(() => COURSES.flatMap((c) => c.lessons), []);
  const doneTotal = lessons.filter((l) => state.done[l.id]).length;

  const next = React.useMemo(() => {
    for (const course of COURSES) {
      for (const lesson of course.lessons) {
        if (!state.done[lesson.id]) return { course, lesson };
      }
    }
    return null;
  }, [state.done]);

  const header = (
    <ScreenHead
      kicker="COURSES"
      title="まなぶ"
      right={
        <Text style={{ fontFamily: FONT.mono, fontSize: 16, color: C.paper50 }}>
          {doneTotal}
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300 }}>
            /{lessons.length}
          </Text>
        </Text>
      }
      progress={{ value: doneTotal, total: lessons.length }}
      /* 「あてはまらない」を選んだ人には職種名を出さない
         （generic の職種は byRole を持たないので、実際に出るのは共通文） */
      note={
        !role ? '職種を選ぶと内容が変わります' : role.generic ? '共通の内容を表示しています' : `${role.name} 向けの内容です`
      }
      noteRight={`${COURSES.length}コース`}
    />
  );

  return (
    <Screen header={header} tone="dots">
      {/* ———— 直すものがあるなら、新しい1本より先 ————
           まだ身についていないものを置いたまま先に進むと、積み上がるだけ。
           **期限が来ているぶんだけ**出す（→ store/progress.tsx の useReview）。
           こちらはスクロールする画面なので、行を足しても何も潰れない */}
      {review.due.length > 0 ? (
        <Cassette>
          <Row gap={8}>
            <Pill label="REVIEW" />
            <Icon name="rotate" size={18} color={C.paper50} />
            <Text style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]}>
              まちがえた問題が {review.due.length}問
            </Text>
          </Row>
          <Button
            label="復習する"
            variant="yellow"
            size="sm"
            onPress={() => router.push('/review')}
          />
        </Cassette>
      ) : review.pending.length > 0 ? (
        /* 期限前でも、前倒しで解きたい人のために道は残す。
           急かさないよう、こちらは沈んだ見た目にしない */
        <Panel contentStyle={{ padding: S.md, gap: S.sm }}>
          <Row gap={8}>
            <Icon name="rotate" size={16} color={T.muted} />
            <Text style={[F.small, { flex: 1 }]}>
              直しかけの問題が {review.pending.length}問（次の出番は日をあけてから）
            </Text>
          </Row>
          <Button
            label="いま解く"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/review')}
            style={{ alignSelf: 'flex-start' }}
          />
        </Panel>
      ) : null}

      {/* ———— つづき ————
           いちばん押してほしいものを、ほぼ黒に沈めたコマに入れる（ホームと同じ） */}
      {/* ▍ここに「次の1本」のカセットは置かない
           ホームの赤いボタンと行き先が同じで、**同じ画面の中に「次」が
           2つある**状態だった。この画面の役目はコースを見渡すことなので、
           次の1本は下の一覧で黄色いリングが指している（learn-next）。
           ここに出すのは、コース全体の進み具合だけでいい */}
      {!next ? (
        <Cassette>
          <Row gap={8}>
            <Icon name="trophy" size={18} color={C.paper50} />
            <Text style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]}>
              全課程、修了
            </Text>
          </Row>
        </Cassette>
      ) : null}

      {COURSES.map((course, ci) => {
        const doneCount = course.lessons.filter((l) => state.done[l.id]).length;
        const cleared = doneCount === course.lessons.length;
        /* ▍前提のコースが終わっていないときは、開ける前に言う
             鍵はかけない（知っている人まで足止めするので）。
             基礎を飛ばして RAG に行くと迷子になる、というだけの話 */
        const needs = course.needs ? COURSES.find((c) => c.id === course.needs) : undefined;
        const needsFirst =
          !!needs && !needs.lessons.every((l) => state.done[l.id]) && doneCount === 0;
        return (
          <Panel
            key={course.id}
            number={String(ci + 1)}
            tone={cleared ? 'lines' : 'none'}
            contentStyle={{ paddingTop: S.xl + S.sm, gap: S.md }}>
            {needsFirst ? (
              <Row gap={6}>
                <Icon name="bang" size={13} color={T.muted} />
                <Text style={[F.tiny, { flex: 1 }]}>
                  先に「{needs?.title}」を終えておくと、ここが分かりやすくなります
                </Text>
              </Row>
            ) : null}
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Row gap={6}>
                  <Icon name={course.icon} size={20} color={T.text} />
                  <Text style={[F.h1, { flex: 1 }]}>{course.title}</Text>
                </Row>
                <Text style={F.small}>{course.desc}</Text>
              </View>
              {cleared ? <Badge tone="green">修了</Badge> : null}
            </Row>

            {course.kind === 'role' ? (
              <Row gap={6}>
                {/* 共通文しか出ない人に「職種別」の札を出すと嘘になる */}
                {role && !role.generic ? <Badge tone="red">職種別</Badge> : null}
                <Text style={[F.hand, { flex: 1 }]}>
                  {!role
                    ? '職種を選ぶと内容が変わる'
                    : role.generic
                      ? 'せっていで職種を選ぶと、例が差し替わる'
                      : `${role.name}向けの例が出る`}
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
                /* 上のカセットと同じレッスンには印を付ける。
                   黄色は使わない（1画面に1つ）ので、赤の枠で示す。
                   案内中だけは、この上に黄色い枠が重なる（→ Spotlight） */
                const isNext = next?.lesson.id === lesson.id;
                const card = (
                  <PressCard
                    selected={isNext}
                    onPress={() => router.push(`/lesson/${lesson.id}`)}
                    style={isNext ? undefined : { backgroundColor: done ? T.sunk : T.surface }}>
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
                      <Icon
                        name={perfect ? 'perfect' : done ? 'check' : 'play'}
                        size={17}
                        color={isNext ? T.accent : done ? T.ok : T.muted}
                      />
                    </Row>
                  </PressCard>
                );
                /* 案内が指しているのはこの1行。**次の1本にだけ**枠を出す */
                return isNext ? (
                  <Spotlight key={lesson.id} name="learn-next" radius={R.md}>
                    {card}
                  </Spotlight>
                ) : (
                  <View key={lesson.id}>{card}</View>
                );
              })}
            </View>
          </Panel>
        );
      })}

      {/* ———— 持ち帰り ————
           終えた回のぶんだけ、自分の職種向けの一言とプロンプトが溜まる。
           一覧の**下**に置く。上に置くと目的地が2つに見える */}
      <Panel contentStyle={{ padding: S.md, gap: S.sm }}>
        <Row gap={8}>
          <Icon name="folder" size={18} color={T.text} />
          <Text style={[F.h2, { flex: 1 }]}>持ち帰り</Text>
          {doneTotal > 0 ? <Badge tone="paper">{doneTotal}本ぶん</Badge> : null}
        </Row>
        <Text style={F.small}>
          終えた回から、あなたの職種向けの一言とプロンプトを集めてあります。まるごとコピーして、
          仕事で使う場所に貼っておけます。
        </Text>
        <Button
          label="ひらく"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/sheet')}
          style={{ alignSelf: 'flex-start' }}
        />
      </Panel>
    </Screen>
  );
}
