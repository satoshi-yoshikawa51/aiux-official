/* ============================================================
   削る。長い指示文から要らない行を消して、予算に収める。
   SRのおまけ用（→ data/extras/）。

   ▍足す練習しか無かった
   ほかのゲームは「良い指示を組み立てる」「危ない行を見つける」——
   どれも**足すか、見つけるか**。現場でいちばん多いのは、
   すでに長い指示文を渡されて、そこから削る仕事のほう。

   ▍消せる／消せないを、押したその場で言う
   消してはいけない行を押したらミス。ただし**消える前に止める**
   （消してから戻すと、何が起きたのか分からなくなる）。

   ▍予算は常に見えている
   上の帯が「いま何／予算いくつ」を出し、超えているあいだは赤い。
   決める口は、収まるまで出さない（詰めるゲームと同じ作法）。
   ============================================================ */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PopIn, useSparkBurst, useTap } from '@/components/motion';
import type { LessonInteractive } from '@/data/types';
import { playSound } from '@/lib/sound';
import { BW, C, F, FONT, R, S } from '@/theme';

import { GameButton, GameFrame, GameStatus, TryAgain, useCheer } from './parts';
import { useGameClock, type GameScore } from './score';

type Spec = Extract<LessonInteractive, { kind: 'trim' }>;

/** 収まっているときの緑。黒地の上なので、紙の側の green500 より明るくする */
const OK = '#7ee08c';

export function TrimPlay({ spec, onClear }: { spec: Spec; onClear: (score: GameScore) => void }) {
  const burst = useSparkBurst();
  const { cheer, node: cheerNode } = useCheer();
  const elapsed = useGameClock();
  const allow = spec.allow ?? 2;

  /* 消した行の番号 */
  const [cut, setCut] = React.useState<number[]>([]);
  const [misses, setMisses] = React.useState(0);
  const [note, setNote] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  const total = spec.lines.reduce(
    (n, l, i) => n + (cut.includes(i) ? 0 : l.cost),
    0,
  );
  const over = total - spec.budget;
  const fits = over <= 0;

  const tap = (i: number, x: number, y: number) => {
    if (failed || cut.includes(i)) return;
    const line = spec.lines[i];
    if (line.keep) {
      /* ▍**消させない。** 消してから戻す作りにすると、何が起きたか見失う */
      playSound('wrong');
      setNote(line.why);
      setMisses((n) => {
        const next = n + 1;
        if (next > allow) setFailed(true);
        return next;
      });
      return;
    }
    playSound('right');
    burst(x, y, 1.2);
    cheer(x, y, cut.length + 1);
    setNote(line.why);
    setCut((v) => [...v, i]);
  };

  const undo = (i: number) => {
    if (failed) return;
    playSound('pick');
    setNote(null);
    setCut((v) => v.filter((n) => n !== i));
  };

  const retry = () => {
    setCut([]);
    setMisses(0);
    setNote(null);
    setFailed(false);
  };

  return (
    <GameFrame
      overlay={cheerNode}
      footer={
        failed ? (
          <GameButton label="もう一度" onPress={retry} />
        ) : fits ? (
          <GameButton
            label="この指示で出す"
            onPress={() => onClear({ misses, allow, ms: elapsed() })}
          />
        ) : undefined
      }>
      <View style={{ gap: S.md }}>
        <Text style={[F.hand, { fontSize: 15, lineHeight: 25, color: C.paper100 }]}>
          {spec.brief}
        </Text>

        <GameStatus left={`削った ${cut.length}行`} misses={misses} allow={allow} />

        {/* 予算の帯。**収まるまでずっと赤い** */}
        <Meter total={total} budget={spec.budget} />

        {/* 指示文。消した行は取り消し線＋薄くなる（消えると比べられない） */}
        <View
          style={{
            backgroundColor: C.paper0,
            borderWidth: BW.bold,
            borderColor: C.ink900,
            borderRadius: R.md,
            overflow: 'hidden',
          }}>
          {spec.lines.map((line, i) => (
            <Line
              key={i}
              text={line.text}
              cost={line.cost}
              cut={cut.includes(i)}
              last={i === spec.lines.length - 1}
              onPress={(x, y) => (cut.includes(i) ? undo(i) : tap(i, x, y))}
            />
          ))}
        </View>

        {note && !failed ? (
          <PopIn>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <Icon name="bulb" size={14} color={C.yellow400} />
              <Text style={[F.hand, { fontSize: 12.5, color: C.paper100, flex: 1 }]}>{note}</Text>
            </View>
          </PopIn>
        ) : null}

        {!fits && !failed ? (
          <Text style={[F.hand, { fontSize: 12.5, color: C.ink300 }]}>
            あと {over} 減らすと収まります。消した行は、もう一度押せば戻せます。
          </Text>
        ) : null}

        {failed ? (
          <PopIn>
            <TryAgain
              reason={`消してはいけない行を${misses}回押しました。消していいのは「言い方」「前置き」「同じことの念押し」。何を・誰に・どう出すかは残します。`}
            />
          </PopIn>
        ) : null}
      </View>
    </GameFrame>
  );
}

/* 予算の帯。超えているぶんは赤で右にはみ出す */
function Meter({ total, budget }: { total: number; budget: number }) {
  const ok = total <= budget;
  /* 帯の幅は「予算」を基準にする。超過ぶんは頭打ちにして、
     どれだけ超えても帯からは出ないようにする */
  const ratio = Math.min(1, total / Math.max(1, budget));
  const overRatio = Math.min(0.35, Math.max(0, (total - budget) / Math.max(1, budget)));
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.ink300 }}>
          いまの長さ
        </Text>
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            letterSpacing: 1,
            color: ok ? OK : C.red500,
          }}>
          {total} / {budget}
        </Text>
      </View>
      <View
        style={{
          height: 12,
          borderWidth: BW.line,
          borderColor: C.ink700,
          borderRadius: R.full,
          overflow: 'hidden',
          flexDirection: 'row',
          backgroundColor: C.ink800,
        }}>
        <View style={{ flex: ratio, backgroundColor: ok ? OK : C.red500 }} />
        <View style={{ flex: Math.max(0.0001, 1 - ratio + overRatio) }} />
      </View>
    </View>
  );
}

/* 指示文の1行。消すと取り消し線が入り、重さの札が0になる */
function Line({
  text,
  cost,
  cut,
  last,
  onPress,
}: {
  text: string;
  cost: number;
  cut: boolean;
  last: boolean;
  onPress: (x: number, y: number) => void;
}) {
  /* 判定音とぶつかるのでタップ音は消す（他のゲームと同じ理由） */
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light', sound: 'none' });
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={(e) => onPress(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
      <View
        style={{
          backgroundColor: cut ? C.paper200 : pressed ? C.paper100 : C.paper0,
          paddingHorizontal: S.md,
          paddingVertical: 11,
          borderBottomWidth: last ? 0 : BW.hair,
          borderBottomColor: C.paper200,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'flex-start',
        }}>
        <Text
          style={{
            fontFamily: FONT.body,
            fontSize: 13.5,
            lineHeight: 22,
            color: cut ? C.ink500 : C.ink900,
            textDecorationLine: cut ? 'line-through' : 'none',
            flex: 1,
          }}>
          {text}
        </Text>
        <View
          style={{
            borderWidth: BW.hair,
            borderColor: cut ? C.ink500 : C.ink900,
            borderRadius: R.full,
            paddingHorizontal: 7,
            paddingVertical: 1,
            marginTop: 2,
          }}>
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              color: cut ? C.ink500 : C.ink900,
            }}>
            {cut ? 0 : cost}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
