/* ============================================================
   レッスン。カードを送って読む → クイズ → 結果。
   カードの本文とプロンプトは、選んでいる職種にあわせて差し替わる
   （resolveCard がその解決をやっている）。
   ============================================================ */
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import { Bubble, Button, Card, Row, Tag } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { getBadge, type Title } from '@/data/badges';
import { COURSES, getLesson, resolveCard } from '@/data/courses';
import { useProgress } from '@/store/progress';
import { C, F, R, S, T, inkBorder } from '@/theme';

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
  const [result, setResult] = React.useState<{ newBadges: string[]; newTitle: Title | null } | null>(null);
  const savedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: found?.lesson.title ?? 'レッスン' });
  }, [navigation, found?.lesson.title]);

  const card = found ? found.lesson.cards[cardIndex] : undefined;
  const view = React.useMemo(
    () => (card ? resolveCard(card, state.roleId) : null),
    [card, state.roleId],
  );

  /* カードが変わるたびに、そのカードのモーションを再生する */
  React.useEffect(() => {
    if (phase !== 'cards' || !view) return;
    avatarRef.current?.play(view.motion ?? 'explain');
    if (view.emote) avatarRef.current?.emote(view.emote);
  }, [phase, view]);

  /* 結果に着いた瞬間に一度だけ保存する */
  React.useEffect(() => {
    if (phase !== 'result' || savedRef.current || !found) return;
    savedRef.current = true;
    const r = completeLesson(found.lesson.id, misses === 0);
    setResult(r);
    avatarRef.current?.play(misses === 0 ? 'laugh' : 'bow');
    avatarRef.current?.emote(misses === 0 ? '✨' : '💡');
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
  const stageW = Math.min(width * 0.42, 170);

  /* —— 次のレッスン（結果画面の導線用） —— */
  const nextLesson = (() => {
    const all = COURSES.flatMap((c) => c.lessons);
    const i = all.findIndex((l) => l.id === lesson.id);
    return i >= 0 && i + 1 < all.length ? all[i + 1] : null;
  })();

  const goNextCard = () => {
    if (cardIndex + 1 < lesson.cards.length) {
      setCardIndex((n) => n + 1);
    } else {
      setPhase(lesson.quiz.length > 0 ? 'quiz' : 'result');
    }
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
    avatarRef.current?.emote(ok ? '✨' : '❗');
  };

  const goNextQuiz = () => {
    setChoice(null);
    if (quizIndex + 1 < lesson.quiz.length) setQuizIndex((n) => n + 1);
    else setPhase('result');
  };

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl * 2, gap: S.lg }}
        showsVerticalScrollIndicator={false}>
        {/* 進み具合 */}
        <Row gap={4}>
          {lesson.cards.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: R.pill,
                backgroundColor: phase !== 'cards' || i <= cardIndex ? T.accent : T.borderSoft,
              }}
            />
          ))}
          {lesson.quiz.map((_, i) => (
            <View
              key={`q${i}`}
              style={{
                flex: 1,
                height: 4,
                borderRadius: R.pill,
                backgroundColor:
                  phase === 'result' || (phase === 'quiz' && i < quizIndex) ? T.ok : T.borderSoft,
              }}
            />
          ))}
        </Row>

        {/* 先生 */}
        <View style={{ alignItems: 'center' }}>
          <Bubble
            text={
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
                    : '終わりだ。間違えたところは、あとで戻ればいい。'
            }
            style={{ alignSelf: 'stretch', marginBottom: S.md }}
          />
          <Avatar3D ref={avatarRef} avatar={avatar} width={stageW} height={Math.round(stageW * 1.2)} />
        </View>

        {/* ———— 本文カード ———— */}
        {phase === 'cards' && view ? (
          <Card style={{ gap: S.md }}>
            {view.heading ? <Text style={F.h2}>{view.heading}</Text> : null}
            {view.body ? <Text style={F.body}>{view.body}</Text> : null}
            {view.bullets?.length ? (
              <View style={{ gap: 6 }}>
                {view.bullets.map((b, i) => (
                  <Row key={i} gap={8} style={{ alignItems: 'flex-start' }}>
                    <Text style={[F.body, { color: T.accent, fontWeight: '800' }]}>▪︎</Text>
                    <Text style={[F.body, { flex: 1 }]}>{b}</Text>
                  </Row>
                ))}
              </View>
            ) : null}
            {view.prompt ? (
              <View style={{ gap: S.sm }}>
                <Row gap={6}>
                  <Tag tone="accent">コピペ用</Tag>
                  {course.kind === 'role' ? <Text style={F.tiny}>あなたの職種向け</Text> : null}
                </Row>
                <View style={{ backgroundColor: C.ink900, borderRadius: R.md, padding: S.md }}>
                  <Text style={{ color: C.paper50, fontSize: 13, lineHeight: 21 }}>{view.prompt}</Text>
                </View>
                <Pressable onPress={() => copy(view.prompt!)} style={{ alignSelf: 'flex-start' }}>
                  <Text style={[F.body, { color: T.link, fontWeight: '700' }]}>コピーする</Text>
                </Pressable>
              </View>
            ) : null}
            <Button
              label={cardIndex + 1 < lesson.cards.length ? 'つぎへ' : 'クイズへ'}
              onPress={goNextCard}
              style={{ marginTop: S.xs }}
            />
          </Card>
        ) : null}

        {/* ———— クイズ ———— */}
        {phase === 'quiz' ? (
          <Card style={{ gap: S.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Tag>
                クイズ {quizIndex + 1} / {lesson.quiz.length}
              </Tag>
              {misses > 0 ? <Text style={F.tiny}>ミス {misses}</Text> : <Tag tone="ok">ノーミス継続</Tag>}
            </Row>
            <Text style={F.h2}>{quiz.q}</Text>
            <View style={{ gap: S.sm }}>
              {quiz.choices.map((c, i) => {
                const revealed = choice !== null;
                const isAnswer = i === quiz.answer;
                const isPicked = i === choice;
                const bg = !revealed
                  ? T.surface
                  : isAnswer
                    ? T.okSoft
                    : isPicked
                      ? T.accentSoft
                      : T.surface;
                return (
                  <Pressable
                    key={i}
                    onPress={() => answer(i)}
                    disabled={revealed}
                    style={({ pressed }) => [
                      {
                        ...inkBorder,
                        borderWidth: revealed && (isAnswer || isPicked) ? 2 : 1.5,
                        borderColor: revealed && (isAnswer || isPicked) ? T.border : T.borderSoft,
                        backgroundColor: bg,
                        padding: S.md,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}>
                    <Row gap={S.sm} style={{ alignItems: 'flex-start' }}>
                      <Text style={[F.body, { fontWeight: '800', color: T.muted }]}>
                        {revealed ? (isAnswer ? '○' : isPicked ? '×' : '　') : String.fromCharCode(65 + i)}
                      </Text>
                      <Text style={[F.body, { flex: 1 }]}>{c}</Text>
                    </Row>
                  </Pressable>
                );
              })}
            </View>
            {choice !== null ? (
              <>
                <Card tone={choice === quiz.answer ? 'ok' : 'warn'} style={{ padding: S.md }}>
                  <Text style={F.body}>{quiz.explanation}</Text>
                </Card>
                <Button
                  label={quizIndex + 1 < lesson.quiz.length ? 'つぎの問題' : '結果を見る'}
                  onPress={goNextQuiz}
                />
              </>
            ) : null}
          </Card>
        ) : null}

        {/* ———— 結果 ———— */}
        {phase === 'result' ? (
          <View style={{ gap: S.lg }}>
            <Card tone={misses === 0 ? 'ok' : 'surface'} style={{ gap: S.sm }}>
              <Text style={F.label}>{course.emoji} {course.title}</Text>
              <Text style={F.title}>{misses === 0 ? '💯 ノーミス修了' : '✅ 修了'}</Text>
              <Text style={F.small}>
                {lesson.title}／クイズ {lesson.quiz.length - misses} / {lesson.quiz.length} 問正解
              </Text>
            </Card>

            {result?.newBadges.length ? (
              <Card tone="accent" style={{ gap: S.sm }}>
                <Text style={F.h2}>バッジを獲得</Text>
                {result.newBadges.map((bid) => {
                  const b = getBadge(bid);
                  if (!b) return null;
                  return (
                    <Row key={bid} gap={S.sm}>
                      <Text style={{ fontSize: 26 }}>{b.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[F.body, { fontWeight: '700', color: T.text }]}>{b.name}</Text>
                        <Text style={F.tiny}>{b.desc}</Text>
                      </View>
                    </Row>
                  );
                })}
              </Card>
            ) : null}

            {result?.newTitle ? (
              <Card tone="sunk" style={{ gap: 4 }}>
                <Text style={F.label}>称号が上がった</Text>
                <Row gap={S.sm}>
                  <Text style={{ fontSize: 28 }}>{result.newTitle.emoji}</Text>
                  <Text style={F.title}>{result.newTitle.name}</Text>
                </Row>
                <Text style={F.small}>「{result.newTitle.say}」</Text>
              </Card>
            ) : null}

            {nextLesson ? (
              <Button
                label="次のレッスンへ"
                onPress={() => router.replace(`/lesson/${nextLesson.id}`)}
              />
            ) : null}
            <Button label="ホームに戻る" variant="ghost" onPress={() => router.replace('/')} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
