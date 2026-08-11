/* ============================================================
   修了試験。コースの全レッスンを終えた人だけが受けられる。

   ▍なぜ要るのか
   コースを終えても、修了はバッジ1個で静かに流れていくだけで、
   **「1章クリアした」という実感がどこにも無かった**（実機で指摘）。
   章の締めに試験を置き、受かったら花火（course-clear.tsx）で祝う。

   ▍出題はコース全体から10問
   毎回シャッフルして選ぶので、受け直すたびに顔ぶれが変わる。
   8問（8割）正解で合格。落ちても何度でも受けられるし、
   間違えた問題は本編と同じく復習に積まれる（answerQuiz）。

   ▍レッスンをロックする鍵ではない
   合格しなくても次のコースへは進める（コースにも鍵はかけていない）。
   これは章の卒業証書であって、関所ではない。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import { CourseClearScreen } from '@/components/course-clear';
import { Icon } from '@/components/icons';
import { SlideIn } from '@/components/motion';
import { MissTag, QuizChoices, QuizExplain, QuizTimer, TIMED_OUT } from '@/components/quiz';
import { StarStream } from '@/components/star-stream';
import { Badge, Bubble, Button, Panel, Row, Screen } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { COURSES, getCourse } from '@/data/courses';
import type { QuizItem } from '@/data/types';
import { EXAM_VOICE, say as voice } from '@/data/voice';
import { playSound } from '@/lib/sound';
import { useProgress } from '@/store/progress';
import { F, FONT, POP, R, S, T } from '@/theme';

/** 何問出すか（コースの持ち問題がこれ未満なら全部） */
const EXAM_SIZE = 10;

/** 何問まで間違えて合格できるか（=2割）。10問なら2問 */
const allowOf = (total: number) => Math.max(1, Math.round(total * 0.2));

type Phase = 'intro' | 'quiz' | 'result';

export default function ExamScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { state, ready, answerQuiz, passExam } = useProgress();
  const avatar = getAvatar(state.avatarId, state.skinId);
  const avatarRef = React.useRef<AvatarHandle>(null);
  const { width } = useWindowDimensions();
  const stageW = Math.min(width * 0.4, 165);

  const course = getCourse(String(courseId));
  const courseNo = course ? COURSES.findIndex((c) => c.id === course.id) + 1 : 0;

  const [phase, setPhase] = React.useState<Phase>('intro');
  /* 入場の幕（流れ星の海）。どくまで下の入口は触れない */
  const [entering, setEntering] = React.useState(true);
  const [queue, setQueue] = React.useState<QuizItem[]>([]);
  /* 選択肢の並びを本編とずらす種。受験のたびに引き直す
     （本編と同じ並びだと、位置で覚えた答えがそのまま通る） */
  const [salt, setSalt] = React.useState('exam');
  const [i, setI] = React.useState(0);
  const [choice, setChoice] = React.useState<number | null>(null);
  const [misses, setMisses] = React.useState(0);
  /* 花火。合格した瞬間に結果画面の上へかぶせる */
  const [celebrating, setCelebrating] = React.useState(false);

  const allow = allowOf(queue.length || EXAM_SIZE);
  const quiz = queue[i];
  const passed = phase === 'result' && misses <= allow;

  /* 出題を組む。受け直すたびに引き直す */
  const deal = React.useCallback(() => {
    if (!course) return;
    const all = course.lessons.flatMap((l) => l.quiz);
    const pool = [...all];
    for (let n = pool.length - 1; n > 0; n--) {
      const j = Math.floor(Math.random() * (n + 1));
      [pool[n], pool[j]] = [pool[j], pool[n]];
    }
    setQueue(pool.slice(0, EXAM_SIZE));
    setSalt(Math.random().toString(36).slice(2));
    setI(0);
    setChoice(null);
    setMisses(0);
  }, [course]);

  React.useEffect(() => {
    deal();
  }, [deal]);

  const start = () => {
    playSound('start');
    setPhase('quiz');
    avatarRef.current?.play('arms-crossed');
  };

  const answer = (n: number) => {
    if (choice !== null || !quiz) return;
    setChoice(n);
    const ok = n === quiz.answer;
    if (!ok) setMisses((v) => v + 1);
    /* 間違いは本編と同じく復習へ積む */
    answerQuiz(quiz.id, ok);
    playSound(ok ? 'right' : 'wrong');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
    avatarRef.current?.play(ok ? 'wave' : 'worried');
    avatarRef.current?.emote(ok ? 'sparkle' : 'bang');
  };

  /* 時間切れ。不正解と同じ扱い（復習にも積む）。試験でもルールは本編と同じ */
  const timeUp = () => {
    if (choice !== null || !quiz) return;
    setChoice(TIMED_OUT);
    setMisses((v) => v + 1);
    answerQuiz(quiz.id, false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    playSound('wrong');
    avatarRef.current?.play('worried');
    avatarRef.current?.emote('bang');
  };

  const goNext = () => {
    setChoice(null);
    if (i + 1 < queue.length) {
      setI((n) => n + 1);
      return;
    }
    const ok = misses <= allow;
    setPhase('result');
    if (ok) {
      passExam(String(courseId));
      setCelebrating(true);
      avatarRef.current?.play('laugh');
      avatarRef.current?.emote('sparkle');
    } else {
      playSound('wrong');
      avatarRef.current?.play('bow');
    }
  };

  const v = (line: Parameters<typeof voice>[0]) => voice(line, state.avatarId);
  const say =
    phase === 'intro'
      ? v(EXAM_VOICE.intro)
      : phase === 'quiz'
        ? choice === null
          ? v(EXAM_VOICE.ask)
          : choice === quiz?.answer
            ? v(EXAM_VOICE.right)
            : v(EXAM_VOICE.wrong)
        : passed
          ? v(EXAM_VOICE.pass)
          : v(EXAM_VOICE.fail);

  if (!course || !ready) {
    return <Screen tone="dots" edges={['bottom']}>{null}</Screen>;
  }

  /* 全レッスンを終えていない人はまだ受けられない。
     導線は出していないが、URL直打ちで来ることはある */
  const lessonsDone = course.lessons.every((l) => state.done[l.id]);
  if (!lessonsDone) {
    return (
      <Screen tone="dots" edges={['bottom']} style={{ gap: S.lg }}>
        <Panel contentStyle={{ gap: S.sm, alignItems: 'center', paddingVertical: S.xl }}>
          <Icon name="target" size={30} color={T.muted} />
          <Text style={F.h1}>まだ受けられない</Text>
          <Text style={[F.hand, { textAlign: 'center' }]}>
            「{course.title}」の全レッスンを終えると、修了試験が開きます。
          </Text>
        </Panel>
        <Button label="もどる" onPress={() => router.back()} />
      </Screen>
    );
  }

  const footer =
    phase === 'intro' ? (
      <Button label="試験をはじめる" onPress={start} />
    ) : phase === 'quiz' && choice !== null ? (
      <Button label={i + 1 < queue.length ? 'つぎの問題' : '結果を見る'} onPress={goNext} />
    ) : phase === 'result' ? (
      passed ? (
        <Button label="ホームに戻る" onPress={() => router.replace('/')} />
      ) : (
        <View style={{ gap: S.sm }}>
          <Button
            label="もう一度受ける"
            onPress={() => {
              deal();
              setPhase('quiz');
            }}
          />
          <Button label="まなぶに戻る" variant="secondary" onPress={() => router.back()} />
        </View>
      )
    ) : undefined;

  return (
    <View style={{ flex: 1 }}>
    <Screen edges={['bottom']} tone="dots" style={{ gap: S.lg, paddingBottom: S.xxl }} footer={footer}>
      {/* 進み具合 */}
      {phase !== 'intro' ? (
        <Row gap={3}>
          {queue.map((_, n) => (
            <View
              key={n}
              style={{
                flex: 1,
                height: 5,
                borderRadius: R.full,
                backgroundColor:
                  phase === 'result' || n < i ? T.ok : n === i ? T.accent : T.borderSoft,
              }}
            />
          ))}
        </Row>
      ) : null}

      <Row gap={S.sm} style={{ alignItems: 'flex-end' }}>
        <Avatar3D ref={avatarRef} avatar={avatar} width={stageW} height={Math.round(stageW * 1.25)} zoom={1.18} />
        <View style={{ flex: 1, paddingBottom: S.lg }}>
          <Bubble text={say} tail="left" style={{ marginRight: POP.sm }} />
        </View>
      </Row>

      {/* ———— 入口。ルールを先に言う ———— */}
      {phase === 'intro' ? (
        <SlideIn from="bottom" distance={18}>
          <Panel contentStyle={{ gap: S.md }}>
            <Row gap={7}>
              <Icon name={course.icon} size={18} color={T.accent} />
              <Text style={F.kicker}>第{courseNo}章 修了試験</Text>
            </Row>
            <Text style={F.h1}>{course.title}</Text>
            <View style={{ gap: 8 }}>
              {[
                `コース全体から ${queue.length}問 出ます`,
                `${queue.length - allow}問 正解で合格（${allow}問まで間違えられます）`,
                '間違えた問題は、いつもどおり復習に入ります',
                '落ちても、何度でも受け直せます',
              ].map((t) => (
                <Row key={t} gap={8} style={{ alignItems: 'flex-start' }}>
                  <View style={{ paddingTop: 9 }}>
                    <Icon name="play" size={9} color={T.accent} />
                  </View>
                  <Text style={[F.body, { flex: 1 }]}>{t}</Text>
                </Row>
              ))}
            </View>
          </Panel>
        </SlideIn>
      ) : null}

      {/* ———— 問題 ———— */}
      {phase === 'quiz' && quiz ? (
        <SlideIn key={quiz.id}>
          <Panel tone="lines" contentStyle={{ gap: S.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={F.kicker}>
                Q {i + 1} / {queue.length}
              </Text>
              {choice === TIMED_OUT ? <Badge tone="red">時間切れ</Badge> : <MissTag misses={misses} />}
            </Row>
            {/* 制限時間。本編と同じ（→ components/quiz.tsx の設計メモ）。
                流れ星の入場中は止める——回しっぱなしだと、1問目だけ
                演出の1.8秒ぶん短くなる（実測で発覚） */}
            <QuizTimer quizId={quiz.id} running={!entering && choice === null} onTimeout={timeUp} />
            <Text style={F.h1}>{quiz.q}</Text>
            <QuizChoices quiz={quiz} choice={choice} onPick={answer} shuffleSalt={salt} />
            {choice !== null ? <QuizExplain quiz={quiz} choice={choice} /> : null}
          </Panel>
        </SlideIn>
      ) : null}

      {/* ———— 結果 ———— */}
      {phase === 'result' ? (
        <SlideIn from="bottom" distance={24} duration={380}>
          <Panel tilt={-1} contentStyle={{ gap: S.sm, alignItems: 'center', paddingVertical: S.xl }}>
            <Row gap={6}>
              <Icon name={course.icon} size={15} color={T.accent} />
              <Text style={F.kicker}>第{courseNo}章 修了試験</Text>
            </Row>
            <Row gap={8}>
              <Icon name={passed ? 'trophy' : 'rotate'} size={28} color={passed ? T.ok : T.muted} />
              <Text style={{ fontFamily: FONT.display, fontSize: 26, lineHeight: 36, color: T.text }}>
                {passed ? '合格' : 'あと一歩'}
              </Text>
            </Row>
            <Badge tone={passed ? 'green' : 'ink'}>
              {queue.length - misses} / {queue.length} 問正解
            </Badge>
            {!passed ? (
              <Text style={[F.hand, { textAlign: 'center' }]}>
                合格まで あと{misses - allow}問。間違えたぶんは復習に入っています。
              </Text>
            ) : null}
          </Panel>
        </SlideIn>
      ) : null}

      {/* ———— 花火。合格の瞬間に全画面でかぶせる ———— */}
      {celebrating ? (
        <CourseClearScreen
          courseNo={courseNo}
          courseTitle={course.title}
          icon={course.icon}
          score={queue.length - misses}
          total={queue.length}
          onDone={() => setCelebrating(false)}
        />
      ) : null}
    </Screen>

    {/* ———— 入場の幕。夜空を流れ星が右上から左下へ流れる ———— */}
    {entering ? <StarStream courseNo={courseNo} onDone={() => setEntering(false)} /> : null}
    </View>
  );
}
