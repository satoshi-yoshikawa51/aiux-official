/* ============================================================
   クイズの1問。レッスン本編（app/lesson/[id].tsx）と
   復習（app/review.tsx）の**両方が同じものを使う**。

   もともとレッスン画面の中に書いてあったが、復習でも同じ見た目・
   同じ押し心地でないと「別の問題を解かされている」感じになるので、
   ここに出した。片方だけ直して見た目がずれるのを防ぐ意味もある。

   ▍答えたあとは押せない
   選び直せると、正解を見てから当てたことにできてしまう。復習の記録が
   意味を持つのは「一発で選んだかどうか」なので、そこは閉じる。
   ============================================================ */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTap } from '@/components/motion';
import { TermText } from '@/components/term-text';
import { Badge, Card, Pop, Row, sinkFlat } from '@/components/ui';
import type { QuizItem } from '@/data/types';
import { BW, F, FONT, POP, R, S, T } from '@/theme';

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
  const { pressed, onPressIn, onPressOut } = useTap();
  const down = pressed && !revealed;
  return (
    <Pressable disabled={revealed} onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
      <Pop offset={revealed && (isAnswer || isPicked) ? POP.sm : 0} radius={R.sm} reserve={false}>
        <View
          style={[
            {
              backgroundColor: down ? T.sunk : bg,
              borderWidth: revealed && (isAnswer || isPicked) ? BW.bold : BW.line,
              borderColor: revealed && !isAnswer && !isPicked ? T.borderSoft : T.border,
              borderRadius: R.sm,
              padding: S.md,
            },
            /* 画面幅いっぱいの行なので、縮みは控えめに */
            sinkFlat(down, 0.97),
          ]}>
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
            <Text style={[F.body, { flex: 1 }]}>{label}</Text>
          </Row>
        </View>
      </Pop>
    </Pressable>
  );
}

/** 選択肢いちれつ。choice が null のあいだは伏せたまま */
export function QuizChoices({
  quiz,
  choice,
  onPick,
}: {
  quiz: QuizItem;
  choice: number | null;
  onPick: (i: number) => void;
}) {
  return (
    <View style={{ gap: S.sm }}>
      {quiz.choices.map((c, i) => {
        const revealed = choice !== null;
        const isAnswer = i === quiz.answer;
        const isPicked = i === choice;
        return (
          <QuizChoice
            key={i}
            label={c}
            mark={revealed ? (isAnswer ? '○' : isPicked ? '×' : ' ') : String.fromCharCode(65 + i)}
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
    <Card
      tone={choice === quiz.answer ? 'ok' : 'warn'}
      variant="flat"
      contentStyle={{ padding: S.md }}>
      {/* 解説にも用語が出る。ここで詰まると、そのまま次に進んでしまう */}
      <TermText style={F.body}>{quiz.explanation}</TermText>
    </Card>
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
