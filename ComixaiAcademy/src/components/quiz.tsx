/* ============================================================
   クイズの1問。レッスン本編（app/lesson/[id].tsx）と
   復習（app/review.tsx）の**両方が同じものを使う**。

   もともとレッスン画面の中に書いてあったが、復習でも同じ見た目・
   同じ押し心地でないと「別の問題を解かされている」感じになるので、
   ここに出した。片方だけ直して見た目がずれるのを防ぐ意味もある。

   ▍答えたあとは押せない
   選び直せると、正解を見てから当てたことにできてしまう。復習の記録が
   意味を持つのは「一発で選んだかどうか」なので、そこは閉じる。

   ▍答えた瞬間に、余韻を置く
   もとは押した瞬間に色と記号が**同時に差し替わるだけ**で、
   「答えた」という手ごたえがどこにも出ていなかった。ここでは
   ・選んだ行がひと呼吸ふくらむ
   ・外したときは、正解の行が**少し遅れて**起き上がる
   ・○×は判子のように出る／解説はそのあとに滑り込む
   の順に時間差をつけて、目線が「選んだ行 → 正解 → 解説」と動くようにした。
   ============================================================ */
import React from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';

import { PopIn, SlideIn, useTap } from '@/components/motion';
import { TermText } from '@/components/term-text';
import { Badge, Card, Pop, Row, sinkFlat } from '@/components/ui';
import type { QuizItem } from '@/data/types';
import { playSound } from '@/lib/sound';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/** 正解の行を起こすまでの間。選んだ行のふくらみが収まってから */
const LATE_MS = 240;

/* ———————————————— 時間制限 ————————————————
   ▍12秒にしてある理由
   8秒だと問題文＋4択（120〜200字）を読み切れず、勘で押すゲームになる。
   20秒は実機で「長すぎる」だった。12秒＝読んだらすぐ決める長さ。

   ▍残り秒数の数字は出さない（バーだけ）
   数字があると、読むより数字を見てしまう。減っていくバーと、
   残り5秒の赤＋針の音だけで伝える。切れたら不正解
   （wrongの音は呼ぶ側が鳴らす。正誤の音は答えの処理と同じ場所に置く）。

   ▍復習には付けない
   復習は思い出す場なので、急かすと逆効果（呼ぶ側で使い分ける）。 */

export const QUIZ_SECONDS = 12;
/** ここから先が「急げ」。バーが赤くなり、1秒ごとに鳴る */
const HURRY_AT = 5;

/** 時間切れを表す choice の値。どの選択肢とも一致しない */
export const TIMED_OUT = -1;

export function QuizTimer({
  quizId,
  running,
  seconds = QUIZ_SECONDS,
  onTimeout,
}: {
  /** 変わるたびにタイマーを張り直す */
  quizId: string;
  /** 答えたら false にして止める（バーは止まった位置で残る） */
  running: boolean;
  seconds?: number;
  onTimeout: () => void;
}) {
  const [left, setLeft] = React.useState(seconds);
  const w = React.useRef(new Animated.Value(1)).current;
  const timeout = React.useRef(onTimeout);
  timeout.current = onTimeout;

  /* 問題が変わったら満タンから */
  React.useEffect(() => {
    setLeft(seconds);
    w.setValue(1);
  }, [quizId, seconds, w]);

  /* バーは滑らかに減らす（1秒刻みだとカクつく）。幅なのでネイティブドライバ不可 */
  React.useEffect(() => {
    if (!running) {
      w.stopAnimation();
      return;
    }
    const a = Animated.timing(w, {
      toValue: 0,
      duration: seconds * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [quizId, running, seconds, w]);

  /* 残り秒数は1秒刻み。針の音と時間切れはこちらが数える */
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((n) => {
        const next = n - 1;
        if (next > 0 && next <= HURRY_AT) playSound('tick');
        if (next <= 0) {
          clearInterval(id);
          timeout.current();
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(id);
  }, [quizId, running]);

  const hurry = left <= HURRY_AT;

  return (
    <View
      style={{
        height: 10,
        borderRadius: R.full,
        backgroundColor: T.sunk,
        borderWidth: BW.hair,
        borderColor: T.borderSoft,
        overflow: 'hidden',
      }}>
      <Animated.View
        style={{
          height: '100%',
          width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: hurry ? C.red500 : C.yellow400,
        }}
      />
    </View>
  );
}

export function QuizChoice({
  label,
  mark,
  bg,
  revealed,
  isAnswer,
  isPicked,
  onPress,
}: {
  label: string;
  mark: string;
  bg: string;
  revealed: boolean;
  isAnswer: boolean;
  isPicked: boolean;
  onPress: () => void;
}) {
  /* タップ音は消す。答えた瞬間に判定音（right/wrong）が鳴るので、
     重ねると判定音のほうがかき消される（ゲームの箱と同じ理由） */
  const { pressed, onPressIn, onPressOut } = useTap({ sound: 'none' });
  const down = pressed && !revealed;
  /* この行が「立つ」側か。選んだ行と、正解の行だけ */
  const lifts = revealed && (isAnswer || isPicked);
  /* 外した人の目を正解へ運ぶぶんだけ遅らせる。
     自分で選んだ行は、押した指に応えて即ふくらむ */
  const delay = isPicked ? 0 : LATE_MS;

  /* 立ち上がりの一発だけ。**答えたあと、ずっと動かさない**
     （動き続けると解説を読むほうへ目が移らない） */
  const lit = React.useRef(new Animated.Value(0)).current;
  const done = React.useRef(false);
  React.useEffect(() => {
    if (!lifts || done.current) return;
    done.current = true;
    const a = Animated.timing(lit, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [lifts, delay, lit]);

  return (
    <Pressable
      disabled={revealed}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      /* ○×は記号なので、読み上げには言葉で渡す。
         色と記号だけで正誤を出していると、そこが丸ごと落ちる */
      accessibilityRole="button"
      accessibilityLabel={
        revealed ? `${isAnswer ? '正解' : isPicked ? 'あなたの答え' : ''} ${label}`.trim() : label
      }
      accessibilityState={{ disabled: revealed, selected: isPicked }}>
      <Animated.View
        style={{
          transform: [
            {
              scale: lit.interpolate({
                inputRange: [0, 0.4, 1],
                /* 大きく張ると隣の行にぶつかるので、ほんの少しだけ */
                outputRange: [1, isPicked ? 1.025 : 1.04, 1],
              }),
            },
          ],
        }}>
      <Pop offset={lifts ? POP.sm : 0} radius={R.sm} reserve={false}>
        <View
          style={[
            {
              backgroundColor: down ? T.sunk : bg,
              borderWidth: lifts ? BW.bold : BW.line,
              borderColor: revealed && !isAnswer && !isPicked ? T.borderSoft : T.border,
              borderRadius: R.sm,
              padding: S.md,
            },
            /* 画面幅いっぱいの行なので、縮みは控えめに */
            sinkFlat(down, 0.97),
          ]}>
          <Row gap={S.sm} style={{ alignItems: 'flex-start' }}>
            {/* ○×は判子のように出す。伏せているあいだの A/B/C は静かに置く */}
            <MarkSlot pop={lifts} delay={delay}>
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
            </MarkSlot>
            <Text style={[F.body, { flex: 1 }]}>{label}</Text>
          </Row>
        </View>
      </Pop>
      </Animated.View>
    </Pressable>
  );
}

/* ○×だけ跳ねさせる小さな器。伏せているあいだは素通し
   （PopIn を常に噛ませると、問題が変わるたびに記号がいちいち跳ねる） */
function MarkSlot({
  pop,
  delay,
  children,
}: {
  pop: boolean;
  delay: number;
  children: React.ReactNode;
}) {
  if (!pop) return <>{children}</>;
  return <PopIn delay={delay}>{children}</PopIn>;
}

/* ▍選択肢は並べ替えて出す
   データを書くとき、正解はつい2番目（B）に寄る（実際、1章はほぼ全問Bで
   「Bを押せば当たる」と気づかれた）。データ側を手で並べ直しても、
   足すたびに同じ偏りが戻ってくるので、**出すときに混ぜる**。

   ▍混ぜ方は問題idで決める（毎回ランダムにしない）
   同じ問題は本編でも復習でも、いつ開いても同じ並びで出す。
   並びが毎回変わると「前はCだった」という覚え方まで壊れてしまうし、
   間違えた問題を復習で見たとき、別の問題に見える。

   ▍修了試験だけは salt で並びを変える
   本編と同じ並びだと「位置で覚えた答え」がそのまま通ってしまう
   （実機で「順番も同じで簡単すぎる」の指摘）。試験は受験ごとの
   salt を渡してきて、本編とも前回の受験とも違う並びにする */
function shuffledOrder(quiz: QuizItem, salt = ''): number[] {
  /* idから種を作る（文字列ハッシュ） */
  const key = quiz.id + salt;
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  const rand = () => {
    /* mulberry32。端末やビルドが変わっても同じ列になる */
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = quiz.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** 選択肢いちれつ。choice が null のあいだは伏せたまま。
    onPick に渡るのは**データ上のインデックス**（並べ替え前）なので、
    呼ぶ側の答え合わせはこれまでどおり quiz.answer と比べるだけでよい */
export function QuizChoices({
  quiz,
  choice,
  onPick,
  shuffleSalt,
}: {
  quiz: QuizItem;
  choice: number | null;
  onPick: (i: number) => void;
  /** 並びを本編とずらしたいとき（修了試験）だけ渡す。受験ごとに変える */
  shuffleSalt?: string;
}) {
  const order = React.useMemo(() => shuffledOrder(quiz, shuffleSalt), [quiz, shuffleSalt]);
  return (
    <View style={{ gap: S.sm }}>
      {order.map((i, at) => {
        const c = quiz.choices[i];
        const revealed = choice !== null;
        const isAnswer = i === quiz.answer;
        const isPicked = i === choice;
        return (
          <QuizChoice
            key={i}
            label={c}
            mark={revealed ? (isAnswer ? '○' : isPicked ? '×' : ' ') : String.fromCharCode(65 + at)}
            bg={!revealed ? T.surface : isAnswer ? T.okSoft : isPicked ? T.accentSoft : T.surface}
            revealed={revealed}
            isAnswer={isAnswer}
            isPicked={isPicked}
            onPress={() => onPick(i)}
          />
        );
      })}
    </View>
  );
}

/** 答えたあとに出る解説。正解なら緑、外したら赤 */
export function QuizExplain({ quiz, choice }: { quiz: QuizItem; choice: number }) {
  return (
    /* 選択肢が立ち終わってから滑り込む。同時に出すと、
       目線が解説へ流れて**自分がどれを選んだのか**を見ないまま進む */
    <SlideIn from="bottom" distance={14} duration={320} delay={LATE_MS + 180}>
      <Card
        tone={choice === quiz.answer ? 'ok' : 'warn'}
        variant="flat"
        contentStyle={{ padding: S.md }}>
        {/* 解説にも用語が出る。ここで詰まると、そのまま次に進んでしまう */}
        <TermText style={F.body}>{quiz.explanation}</TermText>
      </Card>
    </SlideIn>
  );
}

/** 「ノーミス継続」／「MISS n」の右肩表示 */
export function MissTag({ misses }: { misses: number }) {
  if (misses > 0) {
    return (
      <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>MISS {misses}</Text>
    );
  }
  return <Badge tone="green">ノーミス継続</Badge>;
}
