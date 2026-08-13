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
import { shuffled, useGameClock, type GameScore } from './score';

type Spec = Extract<LessonInteractive, { kind: 'build' }>;

export function BuildPlay({ spec, onClear }: { spec: Spec; onClear: (score: GameScore) => void }) {
  const elapsed = useGameClock();
  /* 軸ごとに「何番目を選んだか」。未選択は -1 */
  const [chosen, setChosen] = React.useState<number[]>(() => spec.slots.map(() => -1));
  const [failed, setFailed] = React.useState<{ label: string; why: string }[] | null>(null);
  /* 札の並びは軸ごとに毎回シャッフル（並び順で答えを覚えさせない） */
  const [slotOrder] = React.useState(() =>
    spec.slots.map((slot) => shuffled(slot.options.map((_, i) => i))),
  );
  const all = chosen.every((c) => c >= 0);
  /* 何軸まで弱い札のままで通れるか。書いていなければ1軸 */
  const allow = spec.allow ?? 1;

  /* ▍ミスは「決めた瞬間」だけ数える
     押して結果を読むのがこの体験の中身なので、触るのは自由。
     **ゴールに効かない札**を選んだまま決めた軸の数だけがミスになる */
  const offGoal = spec.slots
    .map((slot, i) =>
      chosen[i] >= 0 && !slot.options[chosen[i]].ok
        ? { label: slot.label, why: slot.options[chosen[i]].why ?? '' }
        : null,
    )
    .filter((x): x is { label: string; why: string } => x !== null);

  const decide = () => {
    if (offGoal.length > allow) {
      playSound('wrong');
      setFailed(offGoal);
      return;
    }
    onClear({ misses: offGoal.length, allow, ms: elapsed() });
  };

  return (
    <GameFrame
      footer={
        failed ? (
          <GameButton label="もう一度" onPress={() => setFailed(null)} />
        ) : all ? (
          /* タップ音は消す。弱い札のまま決めたとき wrong が同時に鳴るため */
          <GameButton label="これで決める" sound="none" onPress={decide} />
        ) : undefined
      }>
    <View style={{ gap: S.lg }}>
      {/* ▍お題と「何をしたら正解か」を、最初に両方言う
          お題（場面）だけだと、押して何が起きるのか・どうなれば
          合格なのかが分からない（実機で「これどういう意図？
          何したら正解？」の声）。仕組みと合格条件はここに固定で書く */}
      <View style={{ gap: S.sm }}>
        <Text style={[F.hand, { fontSize: 15, lineHeight: 25, color: C.paper100 }]}>{spec.brief}</Text>
        {/* ▍ゴールは**いちばん目立つ場所に、ずっと**出す
            「何をしたら正解か」が無いと、札を読み比べても決めようがない
            （実機で「何が正解かよくわからない」の指摘）。
            正解の札は、この1行と突き合わせれば選べるように書いてある */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            alignItems: 'flex-start',
            borderWidth: BW.bold,
            borderColor: C.yellow400,
            borderRadius: R.sm,
            padding: S.md,
          }}>
          <Icon name="target" size={16} color={C.yellow400} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5, color: C.yellow400 }}>
              GOAL
            </Text>
            <Text style={{ fontFamily: FONT.heading, fontSize: 14, lineHeight: 23, color: C.paper0 }}>
              {spec.goal}
            </Text>
          </View>
        </View>
        <Text style={[F.hand, { fontSize: 12.5, lineHeight: 20, color: C.ink300 }]}>
          札を押すと、AIの返しがその場で変わります。ゴールに効く札は、どの軸にも1つだけ。読み比べて選んでから「これで決める」。
        </Text>
      </View>

      {spec.slots.map((slot, si) => (
        <View key={slot.label} style={{ gap: S.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 1.5, color: C.yellow400 }}>
              {slot.label}
            </Text>
            {chosen[si] >= 0 ? <Icon name="check" size={12} color={C.yellow400} /> : null}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {slotOrder[si].map((oi) => {
              const o = slot.options[oi];
              return (
                <PartChip
                  key={o.name}
                  label={o.name}
                  on={chosen[si] === oi}
                  onPress={() => {
                    setFailed(null);
                    setChosen((v) => v.map((c, i) => (i === si ? oi : c)));
                  }}
                />
              );
            })}
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
            reason={`ゴールに届いていない軸があります。${failed
              .map((f) => `【${f.label}】${f.why}`)
              .join(' ')}`}
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
