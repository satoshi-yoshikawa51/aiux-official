/* ============================================================
   仕分け。流れてくる1枚を、左右どちらの箱に入れるか決めるだけ。

   ▍サイトの /slop・/nou・/uso と同じ骨。中身だけ差し替える
   「AIのウソを見抜け」「入れていい情報／ダメな情報」「任せる／自分でやる」
   「スロップ／良質」——**問いの形が同じ**なので、1つの仕掛けで足りる。
   レッスンごとに箱の名前と札を渡すだけで別のゲームになる。

   ▍指1本で終わること
   スマホで長文を打たせると、そこで入るのをやめる。ここは**左右2つの
   ボタンだけ**にした。スワイプは付けていない（縦スクロールの中では
   誤爆しやすく、押すのと変わらないため）。

   ▍間違えても即終わりにしない
   allow 枚までは間違えても通る。1枚外して最初からやり直しだと、
   考えるより当てにいくようになる。外した札は最後にまとめて見せる。
   ============================================================ */
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Bump, PopIn, SlideIn, useSparkBurst } from '@/components/motion';
import type { LessonInteractive, SortItem } from '@/data/types';
import { BW, C, F, FONT, R, S } from '@/theme';

import { playSound } from '@/lib/sound';
import { GameButton } from './parts';
import { useGameClock, type GameScore } from './score';

type Spec = Extract<LessonInteractive, { kind: 'sort' }>;

/** 1枚ぶんの答え合わせ */
interface Judged {
  item: SortItem;
  ok: boolean;
}

export function SortPlay({ spec, onClear }: { spec: Spec; onClear: (score: GameScore) => void }) {
  const burst = useSparkBurst();
  const elapsed = useGameClock();
  const [at, setAt] = React.useState(0);
  const [done, setDone] = React.useState<Judged[]>([]);
  /* 直前の1枚の判定。次の札が出るまで出しっぱなしにする */
  const [last, setLast] = React.useState<Judged | null>(null);

  const item = spec.items[at];
  const misses = done.filter((d) => !d.ok).length;
  const finished = at >= spec.items.length;
  const passed = finished && misses <= spec.allow;

  const answer = (toRight: boolean, x: number, y: number) => {
    if (!item) return;
    const ok = toRight === item.right;
    const j = { item, ok };
    setLast(j);
    setDone((v) => [...v, j]);
    setAt((n) => n + 1);
    playSound(ok ? 'right' : 'wrong');
    if (ok) burst(x, y, 1.2);
  };

  if (finished) {
    return (
      <View style={{ gap: S.md }}>
        <PopIn>
          <View
            style={{
              borderWidth: BW.bold,
              borderColor: passed ? C.yellow400 : C.red500,
              borderRadius: R.md,
              padding: S.lg,
              gap: 6,
              alignItems: 'center',
            }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 2, color: C.ink300 }}>
              {passed ? 'CLEAR' : 'TRY AGAIN'}
            </Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 30, color: C.paper0 }}>
              {spec.items.length - misses} / {spec.items.length}
            </Text>
            <Text style={[F.hand, { fontSize: 13, color: C.paper100, textAlign: 'center' }]}>
              {passed
                ? '見分けがついている。'
                : `あと${misses - spec.allow}枚、当てられれば通る。`}
            </Text>
          </View>
        </PopIn>

        {/* 外した札だけ、理由をつけて見せる */}
        {done
          .filter((d) => !d.ok)
          .map((d, i) => (
            <SlideIn key={i} from="bottom" distance={10} delay={i * 60}>
              <View
                style={{
                  borderWidth: BW.line,
                  borderColor: C.ink700,
                  borderRadius: R.sm,
                  padding: S.md,
                  gap: 4,
                }}>
                <Text style={{ fontFamily: FONT.body, fontSize: 13.5, color: C.paper100, lineHeight: 21 }}>
                  {d.item.text}
                </Text>
                <Text style={[F.hand, { fontSize: 12.5, color: C.yellow400 }]}>
                  正解は「{d.item.right ? spec.right : spec.left}」。{d.item.why}
                </Text>
              </View>
            </SlideIn>
          ))}

        <View style={{ gap: S.sm, marginTop: S.xs }}>
          {passed ? (
            <GameButton
              label="これで決める"
              onPress={() => onClear({ misses, allow: spec.allow, ms: elapsed() })}
            />
          ) : (
            <GameButton
              label="もう一度"
              onPress={() => {
                setAt(0);
                setDone([]);
                setLast(null);
              }}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: S.md }}>
      {/* 残り枚数と、間違えられる残り */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.ink300 }}>
          {at + 1} / {spec.items.length}
        </Text>
        <Bump value={misses}>
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: 1,
              color: misses > spec.allow ? C.red500 : C.ink300,
            }}>
            MISS {misses} / {spec.allow}
          </Text>
        </Bump>
      </View>

      {/* 直前の判定。次の札の上に小さく残す */}
      {last ? (
        <PopIn key={at} animate>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={last.ok ? 'check' : 'bang'} size={14} color={last.ok ? C.yellow400 : C.red500} />
            <Text style={[F.hand, { fontSize: 12.5, color: C.paper100, flex: 1 }]} numberOfLines={2}>
              {last.item.why}
            </Text>
          </View>
        </PopIn>
      ) : null}

      {/* いま見る1枚。**紙の色にして、黒地から浮かせる** */}
      <PopIn key={`card${at}`}>
        <View
          style={{
            backgroundColor: C.paper0,
            borderWidth: BW.bold,
            borderColor: C.ink900,
            borderRadius: R.md,
            padding: S.lg,
            minHeight: 132,
            justifyContent: 'center',
          }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 15, lineHeight: 25, color: C.ink900 }}>
            {item.text}
          </Text>
        </View>
      </PopIn>

      {/* 左右の箱。押した指のところから星が出る */}
      <View style={{ flexDirection: 'row', gap: S.sm }}>
        <GameButton
          label={spec.left}
          tone="ghost"
          style={{ flex: 1 }}
          onPress={(x, y) => answer(false, x, y)}
        />
        <GameButton label={spec.right} style={{ flex: 1 }} onPress={(x, y) => answer(true, x, y)} />
      </View>
    </View>
  );
}
