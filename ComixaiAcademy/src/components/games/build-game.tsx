/* ============================================================
   組み立て。指示の部品を選ぶと、AIの出力がその場で変わる。

   ▍サイトの /shinjin・/gakuya と同じ骨
   「誰に・形式・トーン・長さ」を選ぶと、AI新人くんが額面通りに動く。
   **打たずに、選ぶだけで指示の効きが分かる**のがここの肝。

   ▍打つのをやめた理由
   「役割を与えると、口が変わる」は、もともと本物のAIにプロンプトを
   書いて渡す回だった。テーマは良いのに、スマホで役割文を打つのが
   面倒で、そこで止まる。役割を**札から選ぶ**なら1タップで、
   しかも選び替えて聞き比べられる（打ち直すより早い）。

   ▍選ぶたびに結果を出す
   全部選び終わってから見せると、どれがどう効いたのか分からない。
   選んだ瞬間にその軸の結果だけ差し替わるようにしてある。
   ============================================================ */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Bump, PopIn, useTap } from '@/components/motion';
import type { LessonInteractive } from '@/data/types';
import { BW, C, F, FONT, R, S } from '@/theme';

import { playSound } from '@/lib/sound';
import { GameButton, GameFrame, TryAgain } from './parts';
import { useGameClock, type GameScore } from './score';

type Spec = Extract<LessonInteractive, { kind: 'build' }>;

export function BuildPlay({ spec, onClear }: { spec: Spec; onClear: (score: GameScore) => void }) {
  const elapsed = useGameClock();
  /* 軸ごとに「何番目を選んだか」。未選択は -1 */
  const [chosen, setChosen] = React.useState<number[]>(() => spec.slots.map(() => -1));
  const [failed, setFailed] = React.useState<string[] | null>(null);
  const all = chosen.every((c) => c >= 0);
  /* 何軸まで弱い札のままで通れるか。書いていなければ1軸 */
  const allow = spec.allow ?? 1;

  /* ▍ミスは「決めた瞬間」だけ数える
     押して結果を読むのがこの体験の中身なので、触るのは自由。
     弱い札を選んだまま決めた軸の数だけがミスになる */
  const weakSlots = spec.slots
    .map((slot, i) => (chosen[i] >= 0 && slot.options[chosen[i]].weak ? slot.label : null))
    .filter((x): x is string => x !== null);

  const decide = () => {
    if (weakSlots.length > allow) {
      playSound('wrong');
      setFailed(weakSlots);
      return;
    }
    onClear({ misses: weakSlots.length, allow, ms: elapsed() });
  };

  return (
    <GameFrame
      footer={
        failed ? (
          <GameButton label="もう一度" onPress={() => setFailed(null)} />
        ) : all ? (
          <GameButton label="これで決める" onPress={decide} />
        ) : undefined
      }>
    <View style={{ gap: S.lg }}>
      <Text style={[F.hand, { fontSize: 13, color: C.paper100 }]}>{spec.brief}</Text>

      {spec.slots.map((slot, si) => (
        <View key={slot.label} style={{ gap: S.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 1.5, color: C.yellow400 }}>
              {slot.label}
            </Text>
            {chosen[si] >= 0 ? <Icon name="check" size={12} color={C.yellow400} /> : null}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {slot.options.map((o, oi) => (
              <PartChip
                key={o.name}
                label={o.name}
                on={chosen[si] === oi}
                onPress={() => {
                  setFailed(null);
                  setChosen((v) => v.map((c, i) => (i === si ? oi : c)));
                }}
              />
            ))}
          </View>

          {/* 選んだ結果。差し替わるたびに跳ねる */}
          {chosen[si] >= 0 ? (
            <PopIn key={`${si}-${chosen[si]}`}>
              <View
                style={{
                  backgroundColor: C.paper0,
                  borderWidth: BW.line,
                  borderColor: C.ink900,
                  borderRadius: R.sm,
                  padding: S.md,
                }}>
                <Text style={{ fontFamily: FONT.body, fontSize: 13.5, lineHeight: 22, color: C.ink900 }}>
                  {slot.options[chosen[si]].result}
                </Text>
              </View>
            </PopIn>
          ) : null}
        </View>
      ))}

      {failed ? (
        <PopIn>
          <TryAgain
            reason={`「${failed.join('」「')}」が弱いままです。札を押すと、どう変わるかがその場で出ます。読み比べてから決めてください。`}
          />
        </PopIn>
      ) : all ? (
        <PopIn>
          <Text style={[F.hand, { fontSize: 13, color: C.yellow400 }]}>{spec.wrap}</Text>
        </PopIn>
      ) : (
        <Text style={[F.hand, { fontSize: 12.5, color: C.ink300 }]}>
          ぜんぶ選ぶと、指示が組み上がります
        </Text>
      )}
    </View>
    </GameFrame>
  );
}

/* 部品の札。選ぶと黄色く反転する */
function PartChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { pressed, onPressIn, onPressOut } = useTap({ scale: 0.8 });
  /* ▍選んだ札は「はまる」
     色が変わるだけだと選択に見えて、部品を組んでいる感じが出ない。
     選ばれた瞬間だけ、いちど大きくなってから収まる（Bump） */
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
      <Bump value={on ? 1 : 0} scale={1.14}>
      <View
        style={{
          backgroundColor: on ? C.yellow400 : pressed ? C.ink800 : 'transparent',
          borderWidth: on ? BW.bold : BW.line,
          borderColor: on ? C.yellow400 : C.ink700,
          borderRadius: R.full,
          paddingHorizontal: 13,
          paddingVertical: 8,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        }}>
        <Text
          style={{
            fontFamily: FONT.heading,
            fontSize: 13,
            color: on ? C.ink900 : C.paper100,
          }}>
          {label}
        </Text>
      </View>
      </Bump>
    </Pressable>
  );
}
