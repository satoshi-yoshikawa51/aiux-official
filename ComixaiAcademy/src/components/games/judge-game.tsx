/* ============================================================
   見比べる。同じ指示から出た2つの出力を並べ、採用するほうと理由を選ぶ。
   SRのおまけ用（→ data/extras/）。

   ▍直す（redline）より前の段階
   **選べない人は直せない。** 良し悪しの物差しを持っていないと、
   AIの出力を前にして「なんとなく上のほう」で決めることになる。
   ここは、その物差しを言葉にするところをやる。

   ▍理由まで選ばせる
   2択なので、勘でも半分は当たる。当てただけでは通らないように、
   **どちらかを選んだあと「なぜそちらか」を3つから選ぶ**。
   理由を外したら、そのぶんミス。

   ▍どちらも「それっぽい」ものにする
   片方を明らかに壊れた文にすると、読まずに終わる。差は1点だけにして、
   そこに気づけるかを問う。
   ============================================================ */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PopIn, useSparkBurst, useTap } from '@/components/motion';
import type { JudgeRound, LessonInteractive } from '@/data/types';
import { playSound } from '@/lib/sound';
import { BW, C, F, FONT, R, S } from '@/theme';

import { GameButton, GameFrame, GameStatus, TryAgain, useCheer } from './parts';
import { shuffled, useGameClock, type GameScore } from './score';

type Spec = Extract<LessonInteractive, { kind: 'judge' }>;

/** 採用したほうに引く色 */
const PICKED = '#ffd23f';

export function JudgePlay({ spec, onClear }: { spec: Spec; onClear: (score: GameScore) => void }) {
  const burst = useSparkBurst();
  const { cheer, node: cheerNode } = useCheer();
  const elapsed = useGameClock();
  const allow = spec.allow ?? 2;

  const [at, setAt] = React.useState(0);
  /* 'pick' = どちらを採るか選ぶ / 'why' = 理由を選ぶ / 'done' = この問は終わり */
  const [step, setStep] = React.useState<'pick' | 'why' | 'done'>('pick');
  const [picked, setPicked] = React.useState<'a' | 'b' | null>(null);
  const [misses, setMisses] = React.useState(0);
  const [note, setNote] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  const round: JudgeRound = spec.rounds[at];
  /* 理由の並びは毎回混ぜる。同じ位置に正解が来ると位置で覚えられる */
  const [reasons, setReasons] = React.useState(() => shuffled(spec.rounds[0].reasons));
  const last = at >= spec.rounds.length - 1;
  const cleared = step === 'done' && last;

  const miss = (why: string) => {
    playSound('wrong');
    setNote(why);
    setMisses((n) => {
      const next = n + 1;
      if (next > allow) setFailed(true);
      return next;
    });
  };

  const pick = (side: 'a' | 'b') => {
    if (failed || step !== 'pick') return;
    const good = round[side].ok;
    setPicked(side);
    if (!good) {
      miss(round.wrongPick);
      /* ▍外しても先へ進める。**正しいほうに直してから理由を聞く**
         外したところで止めると、この問の学び（なぜそちらか）に
         たどり着けないまま次へ行くことになる */
      setPicked(round.a.ok ? 'a' : 'b');
    } else {
      playSound('pick');
      setNote(null);
    }
    setStep('why');
  };

  const chooseReason = (i: number, x: number, y: number) => {
    if (failed || step !== 'why') return;
    const r = reasons[i];
    if (!r.ok) {
      miss(r.why);
      return;
    }
    playSound('right');
    burst(x, y, 1.4);
    cheer(x, y, at + 1);
    setNote(r.why);
    setStep('done');
  };

  const nextRound = () => {
    const n = at + 1;
    setAt(n);
    setReasons(shuffled(spec.rounds[n].reasons));
    setPicked(null);
    setNote(null);
    setStep('pick');
  };

  const retry = () => {
    setAt(0);
    setReasons(shuffled(spec.rounds[0].reasons));
    setPicked(null);
    setMisses(0);
    setNote(null);
    setFailed(false);
    setStep('pick');
  };

  return (
    <GameFrame
      overlay={cheerNode}
      footer={
        failed ? (
          <GameButton label="もう一度" onPress={retry} />
        ) : cleared ? (
          <GameButton
            label="決めた"
            onPress={() => onClear({ misses, allow, ms: elapsed() })}
          />
        ) : step === 'done' ? (
          <GameButton label="つぎの2本" onPress={nextRound} sound="pick" />
        ) : undefined
      }>
      <View style={{ gap: S.md }}>
        <Text style={[F.hand, { fontSize: 15, lineHeight: 25, color: C.paper100 }]}>
          {spec.brief}
        </Text>

        <GameStatus
          left={`${at + 1}組目 / ${spec.rounds.length}組`}
          misses={misses}
          allow={allow}
        />

        {/* 何を頼んだのか。**これが無いと良し悪しを決められない** */}
        <View
          style={{
            borderWidth: BW.line,
            borderColor: C.ink700,
            borderRadius: R.md,
            padding: S.md,
            gap: 5,
          }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1, color: C.ink300 }}>
            頼んだこと
          </Text>
          <Text style={{ fontFamily: FONT.body, fontSize: 13.5, lineHeight: 22, color: C.paper100 }}>
            {round.ask}
          </Text>
        </View>

        {/* 2つの出力。押すと採用 */}
        <Output
          tag="A"
          label={round.a.label}
          text={round.a.text}
          picked={picked === 'a'}
          dim={picked !== null && picked !== 'a'}
          disabled={step !== 'pick' || failed}
          onPress={() => pick('a')}
        />
        <Output
          tag="B"
          label={round.b.label}
          text={round.b.text}
          picked={picked === 'b'}
          dim={picked !== null && picked !== 'b'}
          disabled={step !== 'pick' || failed}
          onPress={() => pick('b')}
        />

        {/* 理由を選ぶ */}
        {step === 'why' && !failed ? (
          <PopIn>
            <View
              style={{
                borderWidth: BW.bold,
                borderColor: PICKED,
                borderRadius: R.md,
                padding: S.md,
                gap: S.sm,
                backgroundColor: C.ink800,
              }}>
              <Text style={[F.hand, { fontSize: 13, color: C.paper100 }]}>
                {picked === 'a' ? 'A' : 'B'} を採る。では、なぜそちらか。
              </Text>
              {reasons.map((r, i) => (
                <Choice key={i} text={r.text} onPress={(x, y) => chooseReason(i, x, y)} />
              ))}
            </View>
          </PopIn>
        ) : null}

        {note && !failed ? (
          <PopIn>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <Icon name="bulb" size={14} color={C.yellow400} />
              <Text style={[F.hand, { fontSize: 12.5, color: C.paper100, flex: 1 }]}>{note}</Text>
            </View>
          </PopIn>
        ) : null}

        {failed ? (
          <PopIn>
            <TryAgain
              reason={`${misses}回外しました。見るところは毎回おなじ——「頼んだこと」に答えているか、確かめられる形になっているか、読む人が次に動けるか。うまい言い回しは物差しになりません。`}
            />
          </PopIn>
        ) : null}
      </View>
    </GameFrame>
  );
}

/* AIの出力1つ。押すと採用され、縁が金になる */
function Output({
  tag,
  label,
  text,
  picked,
  dim,
  disabled,
  onPress,
}: {
  tag: string;
  label: string;
  text: string;
  picked: boolean;
  dim: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  /* 判定音とぶつかるのでタップ音は消す（他のゲームと同じ理由） */
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light', sound: 'none' });
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} disabled={disabled}>
      <View
        style={{
          backgroundColor: pressed && !disabled ? C.paper100 : C.paper0,
          borderWidth: picked ? BW.bold : BW.line,
          borderColor: picked ? PICKED : C.ink900,
          borderRadius: R.md,
          padding: S.md,
          gap: 7,
          opacity: dim ? 0.45 : 1,
        }}>
        <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
          <View
            style={{
              backgroundColor: picked ? PICKED : C.ink900,
              borderRadius: R.full,
              width: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{ fontFamily: FONT.mono, fontSize: 11, color: picked ? C.ink900 : C.paper0 }}>
              {tag}
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1, color: C.ink500 }}>
            {label}
          </Text>
          {picked ? <Icon name="check" size={14} color={PICKED} /> : null}
        </View>
        <Text style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 22, color: C.ink900 }}>
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

/* 理由の札 */
function Choice({ text, onPress }: { text: string; onPress: (x: number, y: number) => void }) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light', sound: 'none' });
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={(e) => onPress(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
      <View
        style={{
          backgroundColor: pressed ? C.paper100 : C.paper0,
          borderWidth: BW.line,
          borderColor: C.ink900,
          borderRadius: R.sm,
          paddingHorizontal: S.md,
          paddingVertical: 10,
        }}>
        <Text style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 21, color: C.ink900 }}>
          {text}
        </Text>
      </View>
    </Pressable>
  );
}
