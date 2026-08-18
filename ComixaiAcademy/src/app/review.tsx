/* ============================================================
   復習。**間違えた問題だけ**が、日を置いて戻ってくる場所。

   ▍なぜ要るのか
   読んで1問答えて終わり、では**間違えたことに気づいて終わる**だけで、
   直る機会がどこにもなかった。先生は「間違えたところは、あとで戻れば
   いい」と言うのに、戻る手段がレッスンのやり直ししか無かった。

   ▍出す順は「間違えた回数が多い順」
   いちばん怪しいものから当てにいく（→ store/progress.tsx の useReview）。

   ▍卒業まで3回、日をまたいで
   正解すると 翌日 → 3日後 → 7日後 と間隔が伸び、3回続けたら出なくなる。
   その場で3連打しても卒業できないのが狙い（覚えたつもりを防ぐ）。
   期限前のぶんは「まとめて解く」で前倒しできるが、**前倒しでも
   間隔は伸びる**。急いで潰したい人の道は塞がない。

   ▍レッスンには戻さない
   問題だけを出す。カードを読み直したい人のために、1問ごとに
   「このレッスンを開く」を置いてある。
   ============================================================ */
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { SlideIn } from '@/components/motion';
import { MissTag, QuizChoices, QuizExplain } from '@/components/quiz';
import { Badge, Bubble, Button, Panel, Row, Screen } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import type { QuizEntry } from '@/data/courses';
import { REVIEW_VOICE, say as voice } from '@/data/voice';
import { useProgress, useReview } from '@/store/progress';
import { F, FONT, POP, R, S, T } from '@/theme';

export default function ReviewScreen() {
  const router = useRouter();
  const { state, ready, answerQuiz } = useProgress();
  const review = useReview();
  const avatar = getAvatar(state.avatarId);
  const avatarRef = React.useRef<AvatarHandle>(null);
  const { width } = useWindowDimensions();
  const stageW = Math.min(width * 0.4, 165);

  /* ▍出す問題は入ったときに決めて、そのまま動かさない
     答えるたびに useReview が引き直されるので、そのまま繋ぐと
     **正解した瞬間にその問題が一覧から消えて、画面が飛ぶ**。
     開いたときの並びを1回だけ写し取る。

     ただし写すのは**記録を読み終えてから**。useState の初期値で
     取ると、AsyncStorage がまだ空の1回目の描画で写してしまい、
     いつ開いても「直すものは無い」になる（この画面を直接ひらいた
     ときに実際そうなっていた）。null＝まだ写していない、の意 */
  const [queue, setQueue] = React.useState<QuizEntry[] | null>(null);
  React.useEffect(() => {
    if (!ready || queue !== null) return;
    setQueue(review.due.length > 0 ? review.due : review.pending);
  }, [ready, queue, review]);
  const [i, setI] = React.useState(0);
  const [choice, setChoice] = React.useState<number | null>(null);
  const [right, setRight] = React.useState(0);
  const [misses, setMisses] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const entry = queue?.[i];
  const quiz = entry?.item;

  const answer = (n: number) => {
    if (choice !== null || !quiz) return;
    setChoice(n);
    const ok = n === quiz.answer;
    if (ok) setRight((v) => v + 1);
    else setMisses((v) => v + 1);
    answerQuiz(quiz.id, ok);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
    avatarRef.current?.play(ok ? 'laugh' : 'worried');
    avatarRef.current?.emote(ok ? 'sparkle' : 'bang');
  };

  const goNext = () => {
    setChoice(null);
    if (i + 1 < (queue?.length ?? 0)) setI((n) => n + 1);
    else setDone(true);
  };

  const v = (line: Parameters<typeof voice>[0]) => voice(line, state.avatarId);
  const say = done
    ? misses === 0
      ? v(REVIEW_VOICE.allRight)
      : v(REVIEW_VOICE.wrapUp)
    : choice === null
      ? v(REVIEW_VOICE.ask)
      : choice === quiz?.answer
        ? v(REVIEW_VOICE.right)
        : v(REVIEW_VOICE.wrong);

  /* 記録を読み終えるまでは、まだ何も出さない。ここで空の画面を出すと
     一瞬「直すものは無い」が見えてから問題が出る、というちらつきになる */
  if (queue === null) return <Screen tone="dots" edges={['bottom']}>{null}</Screen>;

  /* 直すものが1つも無いとき。ここに来る導線は出していないが、
     ブックマークや戻るで来ることはある */
  if (queue.length === 0) {
    return (
      <Screen tone="dots" edges={['bottom']} style={{ gap: S.lg }}>
        <Panel contentStyle={{ gap: S.sm, alignItems: 'center', paddingVertical: S.xl }}>
          <Icon name="perfect" size={30} color={T.ok} />
          <Text style={F.h1}>直すものは無い</Text>
          <Text style={[F.hand, { textAlign: 'center' }]}>
            間違えた問題がここに溜まります。いまは空です。
          </Text>
        </Panel>
        <Button label="もどる" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    /* 上は Stack のヘッダー（「復習」と戻る矢印）が持つ。
       ここで Screen の header も出すと黒帯が2段になる */
    <Screen edges={['bottom']} tone="dots" style={{ gap: S.lg, paddingBottom: S.xxl }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={F.kicker}>のこり {review.pending.length}問</Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, color: T.muted }}>
          卒業 {review.graduated}
        </Text>
      </Row>

      {/* 進み具合 */}
      <Row gap={3}>
        {queue.map((_, n) => (
          <View
            key={n}
            style={{
              flex: 1,
              height: 5,
              borderRadius: R.full,
              backgroundColor: done || n < i ? T.ok : n === i ? T.accent : T.borderSoft,
            }}
          />
        ))}
      </Row>

      <Row gap={S.sm} style={{ alignItems: 'flex-end' }}>
        <Avatar3D
            ref={avatarRef}
            avatar={avatar}
            width={stageW}
            height={Math.round(stageW * 1.25)}
            /* 笑う・お辞儀するで頭が枠から出るので、少し引く */
            zoom={1.18}
          />
        <View style={{ flex: 1, paddingBottom: S.lg }}>
          {/* しっぽは左のキャラへ向ける（レッスンと同じ） */}
          <Bubble text={say} tail="left" style={{ marginRight: POP.sm }} />
        </View>
      </Row>

      {!done && quiz && entry ? (
        <SlideIn key={quiz.id}>
          <Panel tone="lines" contentStyle={{ gap: S.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={F.kicker}>
                {i + 1} / {queue.length}
              </Text>
              <MissTag misses={misses} />
            </Row>
            <Text style={F.h1}>{quiz.q}</Text>
            <QuizChoices quiz={quiz} choice={choice} onPick={answer} />
            {choice !== null ? (
              <View style={{ gap: S.md, marginTop: S.xs }}>
                <QuizExplain quiz={quiz} choice={choice} />
                {/* もう一度読みたい人のための逃げ道。復習の中で本文まで
                    抱えると画面が重くなるので、開くのはレッスン側に任せる */}
                <Button
                  label={`「${entry.lesson.title}」を開く`}
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push(`/lesson/${entry.lesson.id}`)}
                />
                <Button label={i + 1 < queue.length ? 'つぎの問題' : '結果を見る'} onPress={goNext} />
              </View>
            ) : null}
          </Panel>
        </SlideIn>
      ) : null}

      {done ? (
        <SlideIn from="bottom" distance={24} duration={380} style={{ gap: S.lg }}>
          <Panel tilt={-1} contentStyle={{ gap: S.sm, alignItems: 'center', paddingVertical: S.xl }}>
            <Icon name={misses === 0 ? 'perfect' : 'check'} size={28} color={T.ok} />
            <Text style={{ fontFamily: FONT.display, fontSize: 24, lineHeight: 34, color: T.text }}>
              {right} / {queue.length} 問正解
            </Text>
            <Text style={[F.hand, { textAlign: 'center' }]}>
              {misses === 0
                ? '正解したぶんは、間をあけてもう一度出ます'
                : '外したぶんは、また出します'}
            </Text>
            <Row gap={6}>
              <Badge tone="ink">のこり {review.pending.length}問</Badge>
              <Badge tone="green">卒業 {review.graduated}問</Badge>
            </Row>
          </Panel>
          <Button label="ホームにもどる" onPress={() => router.replace('/')} />
        </SlideIn>
      ) : null}
    </Screen>
  );
}
