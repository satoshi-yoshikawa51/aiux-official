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
import { Platform, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { LessonInteractiveCard } from '@/components/lesson-interactive';
import { MissTag, QuizChoices, QuizExplain } from '@/components/quiz';
import { RankUpScreen } from '@/components/rank-up';
import { hasTerm, TermHint, TermText } from '@/components/term-text';
import { SlideIn, Stamp } from '@/components/motion';
import {
  Badge,
  Bubble,
  Button,
  Card,
  Cassette,
  Panel,
  Pill,
  Row,
  Screen,
} from '@/components/ui';
import { playSound } from '@/lib/sound';
import { getAvatar } from '@/data/avatars';
import { getBadge, prevTitle, titleSay, type Title } from '@/data/badges';
import { COURSES, getLesson, lessonCards, resolveCard } from '@/data/courses';
import { getRole } from '@/data/roles';
import { LESSON_VOICE, say as voice } from '@/data/voice';
import { useProgress, useStats } from '@/store/progress';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

type Phase = 'cards' | 'quiz' | 'result';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { state, completeLesson, answerQuiz } = useProgress();
  const stats = useStats();
  const { width } = useWindowDimensions();

  const avatarRef = React.useRef<AvatarHandle>(null);
  const avatar = getAvatar(state.avatarId);
  const role = getRole(state.roleId);
  const found = getLesson(String(id));

  const [phase, setPhase] = React.useState<Phase>('cards');
  const [cardIndex, setCardIndex] = React.useState(0);
  const [quizIndex, setQuizIndex] = React.useState(0);
  const [choice, setChoice] = React.useState<number | null>(null);
  const [misses, setMisses] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  /* 合否のある体験カードを通過したか。カードを送るたびに戻す */
  const [cleared, setCleared] = React.useState(false);
  const [result, setResult] = React.useState<{ newBadges: string[]; newTitle: Title | null } | null>(null);
  /* ランクアップの演出を出しているあいだ。**結果画面より前に**割り込ませる */
  const [rankUp, setRankUp] = React.useState<Title | null>(null);
  const savedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: found?.lesson.title ?? 'レッスン' });
  }, [navigation, found?.lesson.title]);

  /* 職種の1枚は最後に足される（→ courses/index.ts の lessonCards）。
     以降の枚数の数え方は、すべてこの cards を見ること。
     lesson.cards を直接数えると、最後の1枚ぶんだけ点がずれる */
  const cards = React.useMemo(
    () => (found ? lessonCards(found.lesson, state.roleId) : []),
    [found, state.roleId],
  );
  const card = cards[cardIndex];
  const view = React.useMemo(
    () => (card ? resolveCard(card, state.roleId, state.avatarId) : null),
    [card, state.roleId, state.avatarId],
  );

  React.useEffect(() => {
    if (phase !== 'cards' || !view) return;
    setCopied(false);
    setCleared(false);
    avatarRef.current?.play(view.motion ?? 'explain');
    if (view.emote) avatarRef.current?.emote(view.emote);
  }, [phase, view]);

  /* 通せんぼをするのは token-budget だけ。
     トークン数は誰がやっても同じ答えになるので、必ず抜けられる。
     ai-prompt の点はAIの判断で揺れるので、**揺れるもので止めない** */
  const gated = view?.interactive?.kind === 'token-budget';
  const canAdvance = !gated || cleared;

  const onInteractiveDone = React.useCallback((ok: boolean) => {
    if (!ok) return;
    setCleared(true);
    avatarRef.current?.play('laugh');
    avatarRef.current?.emote('sparkle');
  }, []);

  React.useEffect(() => {
    if (phase !== 'result' || savedRef.current || !found) return;
    savedRef.current = true;
    const r = completeLesson(found.lesson.id, misses === 0);
    setResult(r);
    /* 称号が上がったら、結果を読ませる前に演出を差し込む。
       ここでしか上がらないものなので、結果画面のカード1枚では軽すぎる */
    if (r.newTitle) setRankUp(r.newTitle);
    /* ▍音は「いちばん大きい出来事」だけ鳴らす
       修了・バッジ・昇格が同時に起きるので、全部鳴らすと濁る。
       昇格があるなら昇格の音は演出側（rank-up.tsx）が鳴らすので、
       ここは鳴らさない */
    if (!r.newTitle) playSound(r.newBadges.length > 0 ? 'badge' : 'finish');
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

  /* このレッスンでコースが埋まったか。結果に締めを出すのに使う */
  const clearedCourse =
    phase === 'result' && !!found && found.course.lessons.every((l) => state.done[l.id]);

  const nextLesson = (() => {
    const all = COURSES.flatMap((c) => c.lessons);
    const i = all.findIndex((l) => l.id === lesson.id);
    return i >= 0 && i + 1 < all.length ? all[i + 1] : null;
  })();

  const goNextCard = () => {
    if (cardIndex + 1 < cards.length) setCardIndex((n) => n + 1);
    else setPhase(lesson.quiz.length > 0 ? 'quiz' : 'result');
  };

  const answer = (i: number) => {
    if (choice !== null) return;
    setChoice(i);
    const ok = i === quiz.answer;
    if (!ok) setMisses((n) => n + 1);
    /* 間違えた問題は控えておいて、日を置いてもう一度出す（→ app/review.tsx）。
       ここで記録しないと「間違えたことに気づいて終わり」になる */
    answerQuiz(quiz.id, ok);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
    playSound(ok ? 'right' : 'wrong');
    /* ▍モーションを11種ぜんぶ使う
       正解と不正解しか出し分けていなかったので、**続けて当てたときだけ
       笑わせる**。毎回笑うと、笑ったことの意味が無くなる */
    avatarRef.current?.play(ok ? (misses === 0 ? 'laugh' : 'wave') : 'worried');
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

  /* セリフは相棒で変わる。書けていない相棒は先生の言葉に落ちる（data/voice.ts） */
  const v = (line: Parameters<typeof voice>[0]) => voice(line, state.avatarId);
  const say =
    phase === 'cards'
      ? (view?.say ?? '')
      : phase === 'quiz'
        ? choice === null
          ? v(LESSON_VOICE.quizAsk)
          : choice === quiz.answer
            ? v(LESSON_VOICE.quizRight)
            : v(LESSON_VOICE.quizWrong)
        : misses === 0
          ? v(LESSON_VOICE.resultPerfect)
          : v(LESSON_VOICE.resultDone);

  return (
    /* 上は Stack のヘッダーが安全領域を飲んでいるので、ここでは下だけ見る */
    <Screen edges={['bottom']} tone="dots" style={{ gap: S.lg, paddingBottom: S.xxl }}>
      <>
        {/* 進み具合 */}
        <Row gap={3}>
          {cards.map((_, i) => (
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
          /* ▍カードが変わったことを動きで見せる
             key を付けてあるので、送るたびに作り直されて入りの動きが走る。
             **出は動かしていない**——中身を差し替えるまでの待ちが要って、
             送りのテンポが落ちるため */
          <SlideIn key={`c${cardIndex}`}>
          <Panel number={String(cardIndex + 1)} contentStyle={{ paddingTop: S.xl + S.sm, gap: S.md }}>
            {view.heading ? <Text style={F.h1}>{view.heading}</Text> : null}
            {/* 本文と箇条書きの中の用語は押せる（→ components/term-text.tsx）。
                初出の回で説明していても、あとの回で出てきたときに
                戻る手段が無いと、そこで置いていかれる */}
            {view.body ? <TermText style={F.body}>{view.body}</TermText> : null}
            {view.bullets?.length ? (
              <View style={{ gap: 8 }}>
                {view.bullets.map((b, i) => (
                  <Row key={i} gap={8} style={{ alignItems: 'flex-start' }}>
                    <View style={{ paddingTop: 9 }}>
                      <Icon name="play" size={9} color={T.accent} />
                    </View>
                    <TermText style={[F.body, { flex: 1 }]}>{b}</TermText>
                  </Row>
                ))}
              </View>
            ) : null}
            {/* 押せることに気づかないと意味が無いので、用語のあるカードだけ
                一度だけ案内を出す */}
            {hasTerm(view.body) || view.bullets?.some(hasTerm) ? <TermHint /> : null}
            {view.prompt ? (
              <View style={{ gap: S.sm }}>
                <Row gap={6}>
                  <Badge tone="red">コピペ用</Badge>
                  {/* 「あてはまらない」を選んだ人には共通文が出るので、そうは言わない */}
                  {course.kind === 'role' && role && !role.generic ? (
                    <Text style={F.hand}>{role.name}向け</Text>
                  ) : null}
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
            {view.interactive ? (
              <LessonInteractiveCard
                spec={view.interactive}
                lessonId={lesson.id}
                onDone={onInteractiveDone}
              />
            ) : null}
            <Button
              label={
                !canAdvance
                  ? 'ゲームをクリアすると進める'
                  : cardIndex + 1 < cards.length
                    ? 'つぎへ'
                    : 'クイズへ'
              }
              disabled={!canAdvance}
              onPress={goNextCard}
            />
          </Panel>
          </SlideIn>
        ) : null}

        {/* ———— クイズ ———— */}
        {phase === 'quiz' ? (
          <SlideIn key={`q${quizIndex}`}>
          <Panel tone="lines" contentStyle={{ gap: S.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={F.kicker}>
                QUIZ {quizIndex + 1} / {lesson.quiz.length}
              </Text>
              <MissTag misses={misses} />
            </Row>
            <Text style={F.h1}>{quiz.q}</Text>
            <QuizChoices quiz={quiz} choice={choice} onPick={answer} />
            {choice !== null ? (
              <View style={{ gap: S.md, marginTop: S.xs }}>
                <QuizExplain quiz={quiz} choice={choice} />
                <Button
                  label={quizIndex + 1 < lesson.quiz.length ? 'つぎの問題' : '結果を見る'}
                  onPress={goNextQuiz}
                />
              </View>
            ) : null}
          </Panel>
          </SlideIn>
        ) : null}

        {/* ———— 結果 ———— */}
        {phase === 'result' ? (
          /* 締めは下から持ち上げる。横に流すと「まだ続く」ように見える */
          <SlideIn from="bottom" distance={24} duration={380} style={{ gap: S.lg }}>
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

            {/* ———— コース修了 ————
                 コースを終えたのに、バッジ1個ぶんの扱いしか無かった。
                 4本通した重みが、1本終えたのと同じ見た目では釣り合わない。
                 判子を落として、通った本数を並べて見せる */}
            {clearedCourse ? (
              <Stamp tilt={-2}>
                <Card tone="ink" contentStyle={{ gap: S.sm, alignItems: 'center', paddingVertical: S.lg }}>
                  <Text style={[F.kicker, { color: C.yellow400 }]}>COURSE CLEAR</Text>
                  <Row gap={8}>
                    <Icon name={course.icon} size={26} color={C.yellow400} />
                    <Text style={{ fontFamily: FONT.display, fontSize: 22, color: C.paper50 }}>
                      {course.title}
                    </Text>
                  </Row>
                  <View style={{ gap: 4, alignSelf: 'stretch', paddingHorizontal: S.md }}>
                    {course.lessons.map((l) => (
                      <Row key={l.id} gap={7}>
                        <Icon name="check" size={12} color={T.ok} />
                        <Text style={[F.tiny, { color: C.paper100, flex: 1 }]} numberOfLines={1}>
                          {l.title}
                        </Text>
                      </Row>
                    ))}
                  </View>
                </Card>
              </Stamp>
            ) : null}

            {/* ———— 続いている日数 ————
                 数えているのに、ホームに小さく出るだけだった。
                 **伸びたその日にだけ**出す。毎回出すと数字が景色になる */}
            {stats.streak >= 2 ? (
              <Card tone="warn" variant="flat" contentStyle={{ padding: S.md }}>
                <Row gap={8}>
                  <Icon name="fire" size={22} color={T.accent} />
                  <Text style={[F.strong, { flex: 1 }]}>{stats.streak}日 連続</Text>
                  <Text style={F.tiny}>
                    {stats.streak >= 7 ? '一週間、続いた' : `あと${7 - stats.streak}日で一週間`}
                  </Text>
                </Row>
              </Card>
            ) : null}

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
                <Text style={[F.hand, { color: C.paper100 }]}>
                  「{titleSay(result.newTitle, state.avatarId)}」
                </Text>
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
          </SlideIn>
        ) : null}

        {/* ———— 称号ランクアップ ————
             結果を読ませる前に全画面で割り込む。閉じるまで結果は裏にいる。
             ここでしか上がらないご褒美なので、カード1枚では軽すぎた */}
        {rankUp ? (
          <RankUpScreen from={prevTitle(rankUp)} to={rankUp} onDone={() => setRankUp(null)} />
        ) : null}
      </>
    </Screen>
  );
}
