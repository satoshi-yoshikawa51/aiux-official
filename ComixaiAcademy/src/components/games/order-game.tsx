/* ============================================================
   並べる。工程を正しい順に組む。

   ▍ドラッグで並べ替えさせない
   スマホの縦スクロールの中で長押しドラッグをやらせると、
   触るたびに画面が動いて事故る。ここは**上から順に「次はこれ」を
   押していく**方式にした。指1本で、押した順がそのまま並びになる。

   ▍間違えた瞬間に止める
   全部並べ終えてから丸ごと×を出すと、どこで間違えたのか分からない。
   違う札を押したらその場で赤く出して、理由を見せて、そこからやり直す。
   順番の話は「なぜその順なのか」が本体なので、都度の理由が要る。
   ============================================================ */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PopIn, SlideIn, Stamp, useSparkBurst, useTap } from '@/components/motion';
import type { LessonInteractive } from '@/data/types';
import { BW, C, F, FONT, R, S } from '@/theme';

import { playSound } from '@/lib/sound';
import { GameButton, TryAgain } from './parts';
import { useGameClock, type GameScore } from './score';

type Spec = Extract<LessonInteractive, { kind: 'order' }>;

export function OrderPlay({ spec, onClear }: { spec: Spec; onClear: (score: GameScore) => void }) {
  const burst = useSparkBurst();
  const elapsed = useGameClock();
  /* 外した回数。もとは間違えても札が消えないので、総当たりで必ず解けた */
  const [misses, setMisses] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  /* 順番は当てにいきにくいので、ほかより少し甘くする */
  const allow = spec.allow ?? 2;
  /* 押した順（spec.steps の添字） */
  const [placed, setPlaced] = React.useState<number[]>([]);
  /* いま間違えた札。次に何か押すまで出しておく */
  const [slip, setSlip] = React.useState<number | null>(null);

  const done = placed.length === spec.steps.length;

  const tap = (i: number, x: number, y: number) => {
    if (placed.includes(i) || done || failed) return;
    /* 正解は「まだ置いていないうちで、いちばん順番が早いもの」 */
    if (i === placed.length) {
      setSlip(null);
      setPlaced((v) => [...v, i]);
      playSound('right');
      burst(x, y, 1.1);
    } else {
      setSlip(i);
      playSound('wrong');
      const n = misses + 1;
      setMisses(n);
      if (n > allow) setFailed(true);
    }
  };

  /* 表示は元の順を伏せたいので、決まった並べ替えで出す
     （毎回同じ並びだが、正解順とは違う） */
  const shown = React.useMemo(
    () => spec.steps.map((_, i) => i).sort((a, b) => ((a * 7) % spec.steps.length) - ((b * 7) % spec.steps.length)),
    [spec.steps],
  );

  return (
    <View style={{ gap: S.md }}>
      <Text style={[F.hand, { fontSize: 13, color: C.paper100 }]}>{spec.brief}</Text>

      {/* ———— 組み上がった順番 ————
           **下から押し上げるように積む**。もとはその場でポンと出るだけで、
           「工程が積み上がっていく」絵になっていなかった。
           いちばん新しい1枚だけ、少し大きめに入ってくる */}
      <View style={{ gap: 6 }}>
        {placed.map((si, n) => (
          <SlideIn
            key={si}
            from="bottom"
            distance={n === placed.length - 1 ? 22 : 0}
            duration={n === placed.length - 1 ? 280 : 0}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: S.sm,
                backgroundColor: C.yellow400,
                borderWidth: BW.bold,
                borderColor: C.yellow400,
                borderRadius: R.sm,
                paddingHorizontal: S.md,
                paddingVertical: 11,
              }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 16, color: C.ink900, width: 20 }}>
                {n + 1}
              </Text>
              <Text style={{ fontFamily: FONT.body, fontSize: 13.5, color: C.ink900, flex: 1 }}>
                {spec.steps[si].name}
              </Text>
              {/* 積んだ印。いちばん新しい1枚に判子を落とす */}
              {n === placed.length - 1 ? (
                <Stamp tilt={-10} from={1.8} duration={240}>
                  <Icon name="check" size={14} color={C.ink900} />
                </Stamp>
              ) : null}
            </View>
          </SlideIn>
        ))}
      </View>

      {/* いま置いたものの理由 */}
      {placed.length > 0 && !done ? (
        <PopIn key={`w${placed.length}`}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="check" size={14} color={C.yellow400} />
            <Text style={[F.hand, { fontSize: 12.5, color: C.paper100, flex: 1 }]}>
              {spec.steps[placed[placed.length - 1]].why}
            </Text>
          </View>
        </PopIn>
      ) : null}

      {/* 間違えたときの理由 */}
      {slip !== null ? (
        <PopIn key={`s${slip}`}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="bang" size={14} color={C.red500} />
            <Text style={[F.hand, { fontSize: 12.5, color: C.red500, flex: 1 }]}>
              {spec.steps[slip].tooEarly}
            </Text>
          </View>
        </PopIn>
      ) : null}

      {failed ? (
        <PopIn>
          <TryAgain
            reason={`順番を${misses}回外しました。ここは「前の工程が終わっていないと、次はできない」でつながっています。上から読み直してみてください。`}
            onRetry={() => {
              setPlaced([]);
              setSlip(null);
              setMisses(0);
              setFailed(false);
            }}
          />
        </PopIn>
      ) : null}

      {/* まだ置いていない札 */}
      {!done && !failed ? (
        <View style={{ gap: 6, marginTop: S.xs }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 1.5, color: C.ink300 }}>
            つぎにやることは？
          </Text>
          {shown
            .filter((i) => !placed.includes(i))
            .map((i) => (
              <StepChip
                key={i}
                label={spec.steps[i].name}
                wrong={slip === i}
                onPress={(x, y) => tap(i, x, y)}
              />
            ))}
        </View>
      ) : (
        <PopIn>
          <View style={{ gap: S.md }}>
            <Text style={[F.hand, { fontSize: 13, color: C.yellow400 }]}>{spec.wrap}</Text>
            <GameButton
              label="これで決める"
              onPress={() => onClear({ misses, allow, ms: elapsed() })}
            />
          </View>
        </PopIn>
      )}
    </View>
  );
}

function StepChip({
  label,
  wrong,
  onPress,
}: {
  label: string;
  wrong: boolean;
  onPress: (x: number, y: number) => void;
}) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light' });
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={(e) => onPress(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
      <View
        style={{
          backgroundColor: wrong ? C.red50 : pressed ? C.ink800 : 'transparent',
          borderWidth: BW.line,
          borderColor: wrong ? C.red500 : C.ink700,
          borderRadius: R.sm,
          paddingHorizontal: S.md,
          paddingVertical: 12,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        }}>
        <Text
          style={{
            fontFamily: FONT.body,
            fontSize: 13.5,
            color: wrong ? C.ink900 : C.paper100,
          }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
