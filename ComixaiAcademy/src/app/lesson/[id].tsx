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
import { Modal, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { LessonInteractiveCard } from '@/components/lesson-interactive';
import { LessonTitle } from '@/components/lesson-title';
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
import { COURSES, gameKeyOf, getLesson, lessonCards, resolveCard } from '@/data/courses';
import { getRole } from '@/data/roles';
import { LESSON_VOICE, say as voice } from '@/data/voice';
import { useProgress, useStats } from '@/store/progress';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

type Phase = 'cards' | 'quiz' | 'result';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { state, ready, completeLesson, answerQuiz, markTutorialSeen } = useProgress();

  /* ▍レッスンを開いたら、ホームの案内は「見た」ことにする
     ふつうの操作では案内中に画面へ触れない（(tabs)/_layout.tsx が
     全面を止めている）が、**Webで共有されたレッスンURLを直接ひらく**と
     案内を素通りできる。その人が次にホームへ来たとき、もうレッスンを
     終えているのに案内が1/6から始まるのは変なので、ここで印を立てる。
     レッスンを開いた時点で、案内の役目は終わっている。
     ready を待つのは復習画面と同じ理由——読み込み前に書くと、
     空の記録に上書き保存してしまう */
  const tutMarked = React.useRef(false);
  React.useEffect(() => {
    if (!ready || tutMarked.current || state.seenTutorial) return;
    tutMarked.current = true;
    markTutorialSeen();
  }, [ready, state.seenTutorial, markTutorialSeen]);
  const stats = useStats();
  const { width } = useWindowDimensions();

  const avatarRef = React.useRef<AvatarHandle>(null);
  const avatar = getAvatar(state.avatarId);
  const role = getRole(state.roleId);
  const found = getLesson(String(id));

  const [phase, setPhase] = React.useState<Phase>('cards');
  /* 開いた直後の扉ページ（「1-2 タイトル」）。どくまで本文は触れない */
  const [showTitle, setShowTitle] = React.useState(true);
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

  /* ▍途中で戻ると、この回はまるごと消える
     レッスンの進み具合はどこにも保存していない（修了したときだけ記録する）。
     なのに黙って戻れてしまい、**5枚読んだ人が何も残らずに出ていく**
     ことがあった。1回だけ引き止める。 */
  const [leaving, setLeaving] = React.useState<null | (() => void)>(null);
  /* 一度「やめる」を選んだあとは、素通しする（でないと自分で出した
     dispatch をもう一度つかまえて、永久に出られなくなる） */
  const leftRef = React.useRef(false);
  React.useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e: { preventDefault: () => void; data: { action: unknown } }) => {
      /* 読み始めたばかり・もう終えている人は止めない */
      if (phase === 'result' || (phase === 'cards' && cardIndex === 0)) return;
      if (leftRef.current) return;
      e.preventDefault();
      setLeaving(() => () => {
        leftRef.current = true;
        navigation.dispatch(e.data.action as never);
      });
    });
    return sub;
  }, [navigation, phase, cardIndex]);

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

  /* ▍体験カードは全部、やらないと先へ進めない
     もとは token-budget だけが通せんぼで、他のゲームは素通りできた。
     すると「やってもやらなくてもクリアになる」ので、遊ばれない
     （実機で指摘。読むだけで修了が積み上がっていた）。
     試験（ゲーム）を通ることを修了の条件にする。
     合否の無いトークナイザーも「わかった」まで見れば通る。
     ai-prompt はAIの採点が使えないとき簡易採点に降格する（lib/grade.ts）
     ので、電波が無くても必ず抜けられる */
  const gated = !!view?.interactive;
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

  /* 扉ページに出す「1-2」の番号。章＝コースの並び順、本＝コース内の並び順 */
  const lessonNo = `${COURSES.findIndex((c) => c.id === course.id) + 1}-${
    course.lessons.findIndex((l) => l.id === lesson.id) + 1
  }`;

  /* ▍締めの1枚（セリフしか無いカード）
     多くのレッスンが「セリフ＋お辞儀」で終わる。ここで空の白コマを
     出すと、番号だけの白い箱＝壊れた画面にしか見えない（実機で報告あり）。
     コマは出さず、そのぶんキャラを大きくして「幕」として見せる */
  const closing =
    phase === 'cards' &&
    !!view &&
    !view.heading &&
    !view.body &&
    !view.bullets?.length &&
    !view.prompt &&
    !view.interactive;
  const stageW = closing ? Math.min(width * 0.52, 215) : Math.min(width * 0.4, 165);

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

  /* 下に貼り付ける口。場面ごとに中身が変わる。
     クイズは答えるまで出さない（先に押せると、読まずに飛ばせてしまう） */
  const footer =
    phase === 'cards' ? (
      <Button
        label={
          !canAdvance
            ? view?.interactive?.kind === 'tokenizer'
              ? 'ゲームをためすと進める'
              : 'ゲームをクリアすると進める'
            : cardIndex + 1 < cards.length
              ? 'つぎへ'
              : 'クイズへ'
        }
        disabled={!canAdvance}
        onPress={goNextCard}
      />
    ) : phase === 'quiz' && choice !== null ? (
      <Button
        label={quizIndex + 1 < lesson.quiz.length ? 'つぎの問題' : '結果を見る'}
        onPress={goNextQuiz}
      />
    ) : phase === 'result' ? (
      /* 結果は修了→バッジ→称号と縦に伸びるので、次の1本への口が
         画面の外に出る。ここだけは下に貼り付けておく。

         ▍コースを埋めた回は、次のレッスンより先に修了試験
         前は「次のレッスンへ」が次の章の1本目を指していて、
         章の締め（試験と花火）に気づかないまま素通りしていた（実機で指摘） */
      clearedCourse && !state.exams[course.id] ? (
        <Button label="修了試験へ" onPress={() => router.push(`/exam/${course.id}`)} />
      ) : nextLesson ? (
        <Button label="次のレッスンへ" onPress={() => router.replace(`/lesson/${nextLesson.id}`)} />
      ) : (
        <Button label="ホームに戻る" onPress={() => router.replace('/')} />
      )
    ) : undefined;

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

  const confirmLeave = leaving ? (
    <Modal visible transparent animationType="fade" onRequestClose={() => setLeaving(null)}>
      <Pressable
        onPress={() => setLeaving(null)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(20,17,15,0.55)',
          justifyContent: 'center',
          padding: S.lg,
        }}>
        <Pressable onPress={() => {}}>
          <Panel contentStyle={{ gap: S.sm, padding: S.lg }}>
            <Text style={F.h1}>ここでやめる？</Text>
            <Text style={F.body}>
              途中までの進み具合は残りません。次に開いたときは、また1枚目からになります。
            </Text>
            <Row gap={S.sm} style={{ marginTop: S.xs }}>
              <View style={{ flex: 1 }}>
                <Button label="つづける" onPress={() => setLeaving(null)} />
              </View>
              {/* やめる口には星を出さない（祝うところではない） */}
              <Button label="やめる" variant="secondary" onPress={leaving} />
            </Row>
          </Panel>
        </Pressable>
      </Pressable>
    </Modal>
  ) : null;

  return (
    <View style={{ flex: 1 }}>
    {/* 上は Stack のヘッダーが安全領域を飲んでいるので、ここでは下だけ見る */}
    <Screen
      edges={['bottom']}
      tone="dots"
      style={{ gap: S.lg, paddingBottom: S.xxl }}
      /* ▍先へ進む口は、下に貼り付ける
         カードの中に置いていたので、**本文が短い回ではボタンが画面の
         まんなかに来て、下半分が丸ごと空いていた**。親指の届くところに
         無いのがいちばん効く（→ ui.tsx の Screen footer）。
         貼ったぶんの高さは本文の下に自動で空くので、隠れない */
      footer={footer}>
      {confirmLeave}
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
          <Avatar3D
            ref={avatarRef}
            avatar={avatar}
            width={stageW}
            height={Math.round(stageW * 1.25)}
            /* 笑う・お辞儀するで頭が枠から出るので、少し引く */
            zoom={1.18}
          />
          <View style={{ flex: 1, paddingBottom: S.lg }}>
            {/* しっぽは左のキャラへ向ける。下向きだと、画面の下から
                しゃべっているように見える（実機で報告あり） */}
            <Bubble text={say} tail="left" style={{ marginRight: POP.sm }} />
          </View>
        </Row>

        {/* ———— 本文カード ———— */}
        {phase === 'cards' && view && !closing ? (
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
                gameKey={gameKeyOf(lesson, view.interactive)}
                onDone={onInteractiveDone}
              />
            ) : null}
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
              {/* ▍間違えても修了になる理由を、その場で言う
                   「1問しか正解してないのにクリアになった。なんで？」と
                   なっていた（実機で指摘）。間違いは無かったことに
                   なるのではなく、復習に回って日を置いて戻ってくる */}
              {misses > 0 ? (
                <Row gap={6} style={{ paddingHorizontal: S.sm }}>
                  <Icon name="rotate" size={13} color={T.muted} />
                  <Text style={[F.tiny, { flex: 1 }]}>
                    まちがえた{misses}問は「まなぶ」の復習に入りました。日を置いて、もう一度出ます。
                  </Text>
                </Row>
              ) : null}
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
                  {/* 章の締め（修了試験）への口は下の帯と NEXT のカセットが持つ。
                       ここに黄色いボタンを足すと、1画面に「次」が2つになる */}
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

            {/* ▍最後の1本を終えた人は、締めへ送る
                 「全課程、修了」がバッジ1個で流れていくのは、
                 14コマの絵巻で始めたアプリの終わり方として軽すぎる */}
            {result?.newBadges.includes('all-clear') ? (
              <Button label="修了の記録を見る" onPress={() => router.push('/ending')} />
            ) : null}

            {/* ———— 次にやること ————
                 ほぼ黒に沈めたコマに入れて、黄色いピルで印を付ける（ホームと同じ） */}
            {/* ▍先へ進むボタンは下の帯に置いてある
                 修了・バッジ・称号と続くので、ここは画面のいちばん下になる。
                 一覧の末尾に置くとスクロールしないと見つからない
                 （実際、狭い端末では「次のレッスンへ」が画面の外にいた） */}
            <Cassette>
              {clearedCourse && !state.exams[course.id] ? (
                /* コースを埋めた回の「次」は修了試験。次の章の1本目ではない */
                <Row gap={8}>
                  <Pill label="NEXT" />
                  <Icon name="trophy" size={16} color={C.paper50} />
                  <Text
                    style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]}
                    numberOfLines={1}>
                    修了試験（{course.title}）
                  </Text>
                </Row>
              ) : nextLesson ? (
                <Row gap={8}>
                  <Pill label="NEXT" />
                  <Text
                    style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]}
                    numberOfLines={1}>
                    {nextLesson.title}
                  </Text>
                </Row>
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

    {/* ———— 扉ページ ————
         開いた直後に「1-2 タイトル」をひと呼吸だけ。紙のトーンのまま
         出すので、ゲーム（黒タイル）の入りとは間違えない */}
    {showTitle ? (
      <LessonTitle
        no={lessonNo}
        title={lesson.title}
        minutes={lesson.minutes}
        quizCount={lesson.quiz.length}
        icon={course.icon}
        onDone={() => setShowTitle(false)}
      />
    ) : null}
    </View>
  );
}
