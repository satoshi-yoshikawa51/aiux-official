/* ============================================================
   赤入れ。AIが書いた下書きに、赤ペンを入れて直していく。
   SRのおまけ「金インクの原稿の中」用（→ data/extras/sr.ts）。

   ▍押すだけにしない
   `find`（危ない行を見つける）は押して終わり。こちらは
   **押す → どう直すかを3つから選ぶ**の2段構え。悪いと気づくことと、
   直せることは別の能力で、仕事で効くのは後者のほう。

   ▍直すと、その場で原稿が変わる
   選んだ文がそのまま行に入る。金の下線が引かれ、原稿が仕上がっていく。
   「自分が直した」が画面に残るのが、この回の気持ちよさ。

   ▍直さなくていい行を押したら外れ
   そうしないと全部押して総当たりできる。読まずに終わるゲームになる。
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

type Spec = Extract<LessonInteractive, { kind: 'redline' }>;

/** 直した行に引く金の色 */
const GOLD = '#c99a2e';

export function RedlinePlay({ spec, onClear }: { spec: Spec; onClear: (score: GameScore) => void }) {
  const burst = useSparkBurst();
  const { cheer, node: cheerNode } = useCheer();
  const elapsed = useGameClock();
  const allow = spec.allow ?? 2;

  /* 直し終わった行 → 入れた文 */
  const [fixed, setFixed] = React.useState<Record<number, string>>({});
  /* いま開いている行（直し方を選んでいる最中） */
  const [open, setOpen] = React.useState<number | null>(null);
  /* 外した回数と、直前の外し方の説明 */
  const [misses, setMisses] = React.useState(0);
  const [note, setNote] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  const need = spec.lines.map((l, i) => (l.fix ? i : -1)).filter((i) => i >= 0);
  const doneCount = Object.keys(fixed).length;
  const cleared = doneCount === need.length;

  const miss = (why: string) => {
    playSound('wrong');
    setNote(why);
    setMisses((n) => {
      const next = n + 1;
      if (next > allow) setFailed(true);
      return next;
    });
  };

  const tapLine = (i: number) => {
    if (failed || cleared || fixed[i] !== undefined) return;
    const line = spec.lines[i];
    if (!line.fix) {
      /* ここは直さなくていい行 */
      miss('ここは直さなくていい行です。事実も言い切りも問題ありません。');
      return;
    }
    playSound('pick');
    setNote(null);
    setOpen(i);
  };

  const choose = (i: number, ci: number, x: number, y: number) => {
    const fix = spec.lines[i].fix;
    if (!fix || failed) return;
    const c = fix.choices[ci];
    if (!c.ok) {
      miss(c.why);
      return;
    }
    playSound('right');
    burst(x, y, 1.4);
    cheer(x, y, doneCount + 1);
    setNote(c.why);
    setOpen(null);
    setFixed((v) => ({ ...v, [i]: c.text }));
  };

  const retry = () => {
    setFixed({});
    setOpen(null);
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
        ) : cleared ? (
          <GameButton
            label="原稿を出す"
            onPress={() => onClear({ misses, allow, ms: elapsed() })}
          />
        ) : undefined
      }>
      <View style={{ gap: S.md }}>
        <Text style={[F.hand, { fontSize: 15, lineHeight: 25, color: C.paper100 }]}>
          {spec.brief}
        </Text>

        <GameStatus left={`直した ${doneCount} / ${need.length}`} misses={misses} allow={allow} />

        {/* 原稿。直した行は文が入れ替わり、金の下線が残る */}
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
              text={fixed[i] ?? line.text}
              done={fixed[i] !== undefined}
              opened={open === i}
              last={i === spec.lines.length - 1}
              onPress={() => tapLine(i)}
            />
          ))}
        </View>

        {/* 直し方を選ぶ。開いた行のぶんだけ出す */}
        {open !== null && spec.lines[open].fix ? (
          <PopIn>
            <View
              style={{
                borderWidth: BW.bold,
                borderColor: GOLD,
                borderRadius: R.md,
                padding: S.md,
                gap: S.sm,
                backgroundColor: C.ink800,
              }}>
              <View style={{ flexDirection: 'row', gap: 7, alignItems: 'flex-start' }}>
                <Icon name="pen" size={15} color={GOLD} />
                <Text style={[F.hand, { fontSize: 13, color: C.paper100, flex: 1 }]}>
                  {spec.lines[open].fix.problem}
                </Text>
              </View>
              {spec.lines[open].fix.choices.map((c, ci) => (
                <Choice
                  key={ci}
                  text={c.text}
                  onPress={(x, y) => choose(open, ci, x, y)}
                />
              ))}
              <Pressable onPress={() => setOpen(null)} style={{ alignSelf: 'flex-end' }}>
                <Text style={[F.hand, { fontSize: 12, color: C.ink300, paddingVertical: 4 }]}>
                  やっぱり閉じる
                </Text>
              </Pressable>
            </View>
          </PopIn>
        ) : null}

        {/* 直した理由・外した理由。1つだけ出す（積み上げると原稿が押し出される） */}
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
              reason={`赤を入れる所を${misses}回まちがえました。直すのは「言い切り」「根拠のない数字」「主語の抜け」の3種類だけです。`}
            />
          </PopIn>
        ) : null}
      </View>
    </GameFrame>
  );
}

/* 原稿の1行。直すと文が入れ替わり、金の下線が残る */
function Line({
  text,
  done,
  opened,
  last,
  onPress,
}: {
  text: string;
  done: boolean;
  opened: boolean;
  last: boolean;
  onPress: () => void;
}) {
  /* 判定音とぶつかるのでタップ音は消す（他のゲームと同じ理由） */
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light', sound: 'none' });
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} disabled={done}>
      <View
        style={{
          backgroundColor: done ? '#fdf6e3' : opened ? C.paper100 : pressed ? C.paper100 : C.paper0,
          paddingHorizontal: S.md,
          paddingVertical: 11,
          borderBottomWidth: last ? 0 : BW.hair,
          borderBottomColor: C.paper200,
          borderLeftWidth: done ? 4 : opened ? 4 : 0,
          borderLeftColor: done ? GOLD : C.red500,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'flex-start',
        }}>
        <Text
          style={{
            fontFamily: FONT.body,
            fontSize: 13.5,
            lineHeight: 22,
            color: C.ink900,
            flex: 1,
          }}>
          {text}
        </Text>
        {done ? <Icon name="check" size={14} color={GOLD} /> : null}
      </View>
    </Pressable>
  );
}

/* 直し方の札 */
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
