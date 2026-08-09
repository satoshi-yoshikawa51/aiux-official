/* ============================================================
   見つける。文書を読んで、危ない行をタップして摘発する。

   ▍サイトの /keibi（インジェクション・ディフェンス）と同じ骨
   「AIが読む文書に仕込まれた隠れ指示を見つける」がそのまま入るし、
   「悪い指示のどこが悪いか」「著作権で危ない一文」も同じ形で出せる。

   ▍読むことがそのまま操作になる
   カードを読ませたあとにクイズを出すと、読みと問いが切れてしまう。
   ここは**本文そのものが問題**なので、読む手が止まらない。

   ▍全部押せば通る、にはしない
   押した行が外れていたら減点する。そうしないと総当たりで抜けられて、
   読まずに終わる。 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PopIn, Stamp, useSparkBurst, useTap } from '@/components/motion';
import type { LessonInteractive } from '@/data/types';
import { BW, C, F, FONT, R, S } from '@/theme';

import { playSound } from '@/lib/sound';
import { GameButton, TryAgain } from './parts';
import { useGameClock, type GameScore } from './score';

type Spec = Extract<LessonInteractive, { kind: 'find' }>;

export function FindPlay({ spec, onClear }: { spec: Spec; onClear: (score: GameScore) => void }) {
  const burst = useSparkBurst();
  const elapsed = useGameClock();
  /* 押した行（当たり・外れの両方） */
  const [picked, setPicked] = React.useState<number[]>([]);
  /* 外しすぎた。やり直すまで下の札を出しておく */
  const [failed, setFailed] = React.useState(false);
  /* 何回まで外して通れるか。書いていなければ1回 */
  const allow = spec.allow ?? 1;

  const bad = spec.lines.map((l, i) => (l.bad ? i : -1)).filter((i) => i >= 0);
  const hit = picked.filter((i) => spec.lines[i].bad);
  const wrong = picked.filter((i) => !spec.lines[i].bad);
  const cleared = hit.length === bad.length;

  const tap = (i: number, x: number, y: number) => {
    if (picked.includes(i) || cleared || failed) return;
    setPicked((v) => [...v, i]);
    if (spec.lines[i].bad) {
      playSound('right');
      burst(x, y, 1.3);
      return;
    }
    /* ▍外した瞬間に止める
       全部見つけてから「実は外れが3つありました」と言われても、
       どれが外れだったのか分からない。押したその場で終わりにする */
    playSound('wrong');
    if (wrong.length + 1 > allow) setFailed(true);
  };

  const retry = () => {
    setPicked([]);
    setFailed(false);
  };

  return (
    <View style={{ gap: S.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.yellow400 }}>
          みつけた {hit.length} / {bad.length}
        </Text>
        {wrong.length > 0 ? (
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.red500 }}>
            MISS {wrong.length} / {allow}
          </Text>
        ) : null}
      </View>

      {/* 文書。1行ずつ押せる */}
      <View
        style={{
          backgroundColor: C.paper0,
          borderWidth: BW.bold,
          borderColor: C.ink900,
          borderRadius: R.md,
          overflow: 'hidden',
        }}>
        {spec.lines.map((line, i) => (
          <FindLine
            key={i}
            text={line.text}
            state={
              !picked.includes(i)
                ? 'plain'
                : line.bad
                  ? 'hit'
                  : 'wrong'
            }
            last={i === spec.lines.length - 1}
            onPress={(x, y) => tap(i, x, y)}
          />
        ))}
      </View>

      {/* 当てた行の理由。押すたびに増える */}
      {hit.map((i) => (
        <PopIn key={i}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="check" size={14} color={C.yellow400} />
            <Text style={[F.hand, { fontSize: 12.5, color: C.paper100, flex: 1 }]}>
              {spec.lines[i].why}
            </Text>
          </View>
        </PopIn>
      ))}

      {failed ? (
        <PopIn>
          <TryAgain
            reason={`関係のない行を${wrong.length}つ摘発しました。危ないのは「読んだAIへの命令になっている行」だけです。`}
            onRetry={retry}
          />
        </PopIn>
      ) : cleared ? (
        <PopIn>
          <GameButton
            label="これで決める"
            onPress={() => onClear({ misses: wrong.length, allow, ms: elapsed() })}
          />
        </PopIn>
      ) : (
        <Text style={[F.hand, { fontSize: 12.5, color: C.ink300 }]}>{spec.brief}</Text>
      )}
    </View>
  );
}

/* 1行。押した結果で色が変わる。**紙の上なので黒文字が基本** */
function FindLine({
  text,
  state,
  last,
  onPress,
}: {
  text: string;
  state: 'plain' | 'hit' | 'wrong';
  last: boolean;
  onPress: (x: number, y: number) => void;
}) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light' });
  const bg =
    state === 'hit' ? C.yellow400 : state === 'wrong' ? C.red50 : pressed ? C.paper100 : C.paper0;
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={(e) => onPress(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
      <View
        style={{
          backgroundColor: bg,
          paddingHorizontal: S.md,
          paddingVertical: 11,
          borderBottomWidth: last ? 0 : BW.hair,
          borderBottomColor: C.paper200,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'flex-start',
        }}>
        <Text style={{ fontFamily: FONT.body, fontSize: 13.5, lineHeight: 22, color: C.ink900, flex: 1 }}>
          {text}
        </Text>
        {/* ▍摘発は判子で押す
             色が変わるだけだと「選んだ」にしか見えない。**捕まえた**という
             絵にしたいので、斜めの判子を落とす（マンガの記号） */}
        {state !== 'plain' ? (
          <Stamp tilt={state === 'hit' ? -8 : 6} from={1.9} duration={220}>
            <View
              style={{
                borderWidth: BW.line,
                borderColor: C.ink900,
                borderRadius: R.xs,
                paddingHorizontal: 5,
                paddingVertical: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
              }}>
              <Icon name={state === 'hit' ? 'check' : 'close'} size={10} color={C.ink900} />
              <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: C.ink900, letterSpacing: 0.5 }}>
                {state === 'hit' ? 'HIT' : 'MISS'}
              </Text>
            </View>
          </Stamp>
        ) : null}
      </View>
    </Pressable>
  );
}
