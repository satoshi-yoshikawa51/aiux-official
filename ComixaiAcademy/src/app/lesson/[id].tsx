/* ============================================================
   レッスン。カードを送って読む → クイズ → 結果。
   カードの本文とプロンプトは、選んでいる職種にあわせて差し替わる
   （resolveCard がその解決をやっている）。

   見た目の作法はホームに揃えてある。上の黒帯だけはこの画面の持ち物ではなく、
   Stack のヘッダー（src/app/_layout.tsx で黒に塗ってある）が担っている。
   ============================================================ */
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { Badge, Bubble, Button, Card, Cassette, Panel, Pill, Pop, Row, Screen } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { getBadge, type Title } from '@/data/badges';
import { COURSES, getLesson, resolveCard } from '@/data/courses';
import { useProgress } from '@/store/progress';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

type Phase = 'cards' | 'quiz' | 'result';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { state, completeLesson } = useProgress();
  const { width } = useWindowDimensions();

  const avatarRef = React.useRef<AvatarHandle>(null);
  const avatar = getAvatar(state.avatarId);
  const found = getLesson(String(id));

  const [phase, setPhase] = React.useState<Phase>('cards');
  const [cardIndex, setCardIndex] = React.useState(0);
  const [quizIndex, setQuizIndex] = React.useState(0);
  const [choice, setChoice] = React.useState<number | null>(null);
  const [misses, setMisses] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const [result, setResult] = React.useState<{ newBadges: string[]; newTitle: Title | null } | null>(null);
  const savedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: found?.lesson.title ?? 'レッスン' });
  }, [navigation, found?.lesson.title]);

  const card = found ? found.lesson.cards[cardIndex] : undefined;
  const view = React.useMemo(() => (card ? resolveCard(card, state.roleId) : null), [card, state.roleId]);

  React.useEffect(() => {
    if (phase !== 'cards' || !view) return;
    setCopied(false);
    avatarRef.current?.play(view.motion ?? 'explain');
    if (view.emote) avatarRef.current?.emote(view.emote);
  }, [phase, view]);

  React.useEffect(() => {
    if (phase !== 'result' || savedRef.current || !found) return;
    savedRef.current = true;
    const r = completeLesson(found.lesson.id, misses === 0);
    setResult(r);
    avatarRef.current?.play(misses === 0 ? 'laugh' : 'bow');
    avatarRef.current?.emote(misses === 0 ? 'sparkle' : 'bulb');
  }, [phase, found, misses, completeLesson]);

  if (!found) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, padding: S.lg }}>
        <Text style={F.body}>レッスンが見つからなかった。</Text>
      </View>
    );
  }

  const { lesson, course } = found;
  const quiz = lesson.quiz[quizIndex];
  const stageW = Math.min(width * 0.4, 165);

  const nextLesson = (() => {
    const all = COURSES.flatMap((c) => c.lessons);
    const i = all.findIndex((l) => l.id === lesson.id);
    return i >= 0 && i + 1 < all.length ? all[i + 1] : null;
  })();

  const goNextCard = () => {
    if (cardIndex + 1 < lesson.cards.length) setCardIndex((n) => n + 1);
    else setPhase(lesson.quiz.length > 0 ? 'quiz' : 'result');
  };

  const answer = (i: number) => {
    if (choice !== null) return;
    setChoice(i);
    const ok = i === quiz.answer;
    if (!ok) setMisses((n) => n + 1);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
    avatarRef.current?.play(ok ? 'laugh' : 'worried');
    avatarRef.current?.emote(ok ? 'sparkle' : 'bang');
  };

  const goNextQuiz = () => {
    setChoice(null);
    if (quizIndex + 1 < lesson.quiz.length) setQuizIndex((n) => n + 1);
    else setPhase('result');
  };

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const say =
    phase === 'cards'
      ? (view?.say ?? '')
      : phase === 'quiz'
        ? choice === null
          ? '確認だ。ここだけ間違えるな。'
          : choice === quiz.answer
            ? 'そうだ。わかってるじゃないか。'
            : '違う。……まあ、ここで間違えておけ。'
        : misses === 0
          ? 'ノーミスか。文句なしだ。'
          : '終わりだ。間違えたところは、あとで戻ればいい。';

  return (
    /* 上は Stack のヘッダーが安全領域を飲んでいるので、ここでは下だけ見る */
    <Screen edges={['bottom']} tone="dots" style={{ gap: S.lg, paddingBottom: S.xxl }}>
      <>
        {/* 進み具合 */}
        <Row gap={3}>
          {lesson.cards.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 5,
                borderRadius: R.full,
                backgroundColor: phase !== 'cards' || i <= cardIndex ? T.accent : T.borderSoft,
              }}
            />
          ))}
          {lesson.quiz.map((_, i) => (
            <View
              key={`q${i}`}
              style={{
                flex: 1,
                height: 5,
                borderRadius: R.full,
                backgroundColor:
                  phase === 'result' || (phase === 'quiz' && i < quizIndex) ? T.ok : T.borderSoft,
              }}
            />
          ))}
        </Row>

        {/* 先生とセリフ（横並び） */}
        <Row gap={S.sm} style={{ alignItems: 'flex-end' }}>
          <Avatar3D ref={avatarRef} avatar={avatar} width={stageW} height={Math.round(stageW * 1.25)} />
          <View style={{ flex: 1, paddingBottom: S.lg }}>
            <Bubble text={say} style={{ marginRight: POP.sm }} />
          </View>
        </Row>

        {/* ———— 本文カード ———— */}
        {phase === 'cards' && view ? (
          <Panel number={String(cardIndex + 1)} contentStyle={{ paddingTop: S.xl + S.sm, gap: S.md }}>
            {view.heading ? <Text style={F.h1}>{view.heading}</Text> : null}
            {view.body ? <Text style={F.body}>{view.body}</Text> : null}
            {view.bullets?.length ? (
              <View style={{ gap: 8 }}>
                {view.bullets.map((b, i) => (
                  <Row key={i} gap={8} style={{ alignItems: 'flex-start' }}>
                    <View style={{ paddingTop: 9 }}>
                      <Icon name="play" size={9} color={T.accent} />
                    </View>
                    <Text style={[F.body, { flex: 1 }]}>{b}</Text>
                  </Row>
                ))}
              </View>
            ) : null}
            {view.prompt ? (
              <View style={{ gap: S.sm }}>
                <Row gap={6}>
                  <Badge tone="red">コピペ用</Badge>
                  {course.kind === 'role' ? <Text style={F.hand}>あなたの職種向け</Text> : null}
                </Row>
                <View
                  style={{
                    backgroundColor: C.ink900,
                    borderRadius: R.sm,
                    borderWidth: BW.line,
                    borderColor: C.ink900,
                    padding: S.md,
                  }}>
                  <Text style={{ fontFamily: FONT.mono, color: C.paper50, fontSize: 12, lineHeight: 21 }}>
                    {view.prompt}
                  </Text>
                </View>
                <Button
                  label={copied ? 'コピーした' : 'コピーする'}
                  variant={copied ? 'yellow' : 'secondary'}
                  size="sm"
                  onPress={() => copy(view.prompt!)}
                  style={{ alignSelf: 'flex-start' }}
                />
              </View>
            ) : null}
            <Button
              label={cardIndex + 1 < lesson.cards.length ? 'つぎへ' : 'クイズへ'}
              onPress={goNextCard}
            />
          </Panel>
        ) : null}

        {/* ———— クイズ ———— */}
        {phase === 'quiz' ? (
          <Panel tone="lines" contentStyle={{ gap: S.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={F.kicker}>
                QUIZ {quizIndex + 1} / {lesson.quiz.length}
              </Text>
              {misses > 0 ? (
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>MISS {misses}</Text>
              ) : (
                <Badge tone="green">ノーミス継続</Badge>
              )}
            </Row>
            <Text style={F.h1}>{quiz.q}</Text>
            <View style={{ gap: S.sm }}>
              {quiz.choices.map((c, i) => {
                const revealed = choice !== null;
                const isAnswer = i === quiz.answer;
                const isPicked = i === choice;
                const bg = !revealed ? T.surface : isAnswer ? T.okSoft : isPicked ? T.accentSoft : T.surface;
                const mark = revealed ? (isAnswer ? '○' : isPicked ? '×' : ' ') : String.fromCharCode(65 + i);
                return (
                  <Pressable key={i} onPress={() => answer(i)} disabled={revealed}>
                    <Pop offset={revealed && (isAnswer || isPicked) ? POP.sm : 0} radius={R.sm} reserve={false}>
                      <View
                        style={{
                          backgroundColor: bg,
                          borderWidth: revealed && (isAnswer || isPicked) ? BW.bold : BW.line,
                          borderColor: revealed && !isAnswer && !isPicked ? T.borderSoft : T.border,
                          borderRadius: R.sm,
                          padding: S.md,
                        }}>
                        <Row gap={S.sm} style={{ alignItems: 'flex-start' }}>
                          <Text
                            style={{
                              fontFamily: FONT.display,
                              fontSize: 15,
                              lineHeight: 26,
                              color: revealed && isAnswer ? T.ok : T.muted,
                              width: 16,
                            }}>
                            {mark}
                          </Text>
                          <Text style={[F.body, { flex: 1 }]}>{c}</Text>
                        </Row>
                      </View>
                    </Pop>
                  </Pressable>
                );
              })}
            </View>
            {choice !== null ? (
              <View style={{ gap: S.md, marginTop: S.xs }}>
                <Card tone={choice === quiz.answer ? 'ok' : 'warn'} variant="flat" contentStyle={{ padding: S.md }}>
                  <Text style={F.body}>{quiz.explanation}</Text>
                </Card>
                <Button
                  label={quizIndex + 1 < lesson.quiz.length ? 'つぎの問題' : '結果を見る'}
                  onPress={goNextQuiz}
                />
              </View>
            ) : null}
          </Panel>
        ) : null}

        {/* ———— 結果 ———— */}
        {phase === 'result' ? (
          <View style={{ gap: S.lg }}>
            {/* 紙そのものに網点が敷いてあるので、このコマは白のまま抜く */}
            <Panel tilt={-1} contentStyle={{ gap: S.sm, alignItems: 'center', paddingVertical: S.xl }}>
              <Row gap={6}>
                <Icon name={course.icon} size={15} color={T.accent} />
                <Text style={F.kicker}>{course.title}</Text>
              </Row>
              <Row gap={8}>
                <Icon name={misses === 0 ? 'perfect' : 'check'} size={28} color={T.ok} />
                <Text style={{ fontFamily: FONT.display, fontSize: 26, lineHeight: 36, color: T.text }}>
                  {misses === 0 ? 'ノーミス修了' : '修了'}
                </Text>
              </Row>
              <Text style={[F.hand, { textAlign: 'center' }]}>
                {lesson.title}
              </Text>
              <Badge tone="ink">
                クイズ {lesson.quiz.length - misses} / {lesson.quiz.length} 問正解
              </Badge>
            </Panel>

            {result?.newBadges.length ? (
              <Card tone="accent">
                <Text style={F.kicker}>BADGE UNLOCKED</Text>
                {result.newBadges.map((bid) => {
                  const b = getBadge(bid);
                  if (!b) return null;
                  return (
                    <Row key={bid} gap={S.sm} style={{ marginTop: S.xs }}>
                      <Icon name={b.icon} size={30} color={T.text} />
                      <View style={{ flex: 1 }}>
                        <Text style={F.h2}>{b.name}</Text>
                        <Text style={F.tiny}>{b.desc}</Text>
                      </View>
                    </Row>
                  );
                })}
              </Card>
            ) : null}

            {result?.newTitle ? (
              <Card tone="ink">
                <Text style={[F.kicker, { color: C.red100 }]}>RANK UP</Text>
                <Row gap={S.sm}>
                  <Icon name={result.newTitle.icon} size={32} color={C.paper0} />
                  <Text style={[F.title, { color: C.paper50, flex: 1 }]}>{result.newTitle.name}</Text>
                </Row>
                <Text style={[F.hand, { color: C.paper100 }]}>「{result.newTitle.say}」</Text>
              </Card>
            ) : null}

            {/* ———— 次にやること ————
                 ほぼ黒に沈めたコマに入れて、黄色いピルで印を付ける（ホームと同じ） */}
            <Cassette>
              {nextLesson ? (
                <>
                  <Row gap={8}>
                    <Pill label="NEXT" />
                    <Text
                      style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]}
                      numberOfLines={1}>
                      {nextLesson.title}
                    </Text>
                  </Row>
                  <Button
                    label="次のレッスンへ"
                    onPress={() => router.replace(`/lesson/${nextLesson.id}`)}
                  />
                </>
              ) : (
                <Row gap={8}>
                  <Icon name="trophy" size={18} color={C.paper50} />
                  <Text style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]}>
                    全課程、修了
                  </Text>
                </Row>
              )}
              <Button label="ホームに戻る" variant="secondary" onPress={() => router.replace('/')} />
            </Cassette>
          </View>
        ) : null}
      </>
    </Screen>
  );
}
