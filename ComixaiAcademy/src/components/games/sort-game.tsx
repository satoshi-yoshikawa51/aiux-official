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
import { Animated, Easing, Platform, Text, useWindowDimensions, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Bump, PopIn, SlideIn, useSparkBurst } from '@/components/motion';
import type { LessonInteractive, SortItem } from '@/data/types';
import { BW, C, F, FONT, R, S } from '@/theme';

import { playSound } from '@/lib/sound';
import { GameButton, GameFrame } from './parts';
import { useGameClock, type GameScore } from './score';

type Spec = Extract<LessonInteractive, { kind: 'sort' }>;

/** 1枚ぶんの答え合わせ */
interface Judged {
  item: SortItem;
  ok: boolean;
}

/* 札が箱に入るまでの時間。**伸ばさない**。
   ここが長いと、6枚さばくあいだずっと待たされることになる */
const FLY_MS = 300;
const NATIVE = Platform.OS !== 'web';

export function SortPlay({ spec, onClear }: { spec: Spec; onClear: (score: GameScore) => void }) {
  const burst = useSparkBurst();
  const elapsed = useGameClock();
  const { width } = useWindowDimensions();
  const [at, setAt] = React.useState(0);
  const [done, setDone] = React.useState<Judged[]>([]);
  /* 直前の1枚の判定。次の札が出るまで出しっぱなしにする */
  const [last, setLast] = React.useState<Judged | null>(null);

  /* ▍札が「箱に入る」ところを見せる
     もとは押した瞬間に消えて次が出るだけで、**振り分けた手ごたえが
     どこにも無かった**。左右どちらに入れたのかも、絵として残らない。
     飛んでいるあいだは古い札を出したままにして、着いてから次を配る。 */
  const fly = React.useRef(new Animated.Value(0)).current;
  const [flying, setFlying] = React.useState<{ judged: Judged; dir: -1 | 1 } | null>(null);

  const item = flying ? flying.judged.item : spec.items[at];
  const misses = done.filter((d) => !d.ok).length;
  const finished = at >= spec.items.length;
  const passed = finished && misses <= spec.allow;

  const answer = (toRight: boolean, x: number, y: number) => {
    /* 飛んでいる最中は受け付けない。連打で2枚まとめて飛ぶのを防ぐ */
    if (!item || flying) return;
    const ok = toRight === item.right;
    const j = { item, ok };
    playSound(ok ? 'right' : 'wrong');
    if (ok) burst(x, y, 1.2);

    setFlying({ judged: j, dir: toRight ? 1 : -1 });
    fly.setValue(0);
    Animated.timing(fly, {
      toValue: 1,
      duration: FLY_MS,
      /* 投げたものが落ちる感じ。等速だと紙が滑って見える */
      easing: Easing.in(Easing.quad),
      useNativeDriver: NATIVE,
    }).start(({ finished }) => {
      if (!finished) return;
      /* 着いてから判定を出す。飛ぶ前に出すと、答えが先に見えてしまう */
      setLast(j);
      setDone((v) => [...v, j]);
      setAt((n) => n + 1);
      setFlying(null);
      fly.setValue(0);
    });
  };

  if (finished) {
    return (
      <GameFrame
        footer={
          passed ? (
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
          )
        }>
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

      </View>
      </GameFrame>
    );
  }

  return (
    <GameFrame
      /* 見るものは札1枚だけなので、上下まんなかに置く */
      center
      /* ▍箱は下に貼り付ける
         札とセットで縦に流していたので、**札が短い回では箱が画面の
         まんなかに来て、下半分が空いていた**。どの回でも同じ場所に
         あるほうが、続けて振り分けるときに手が迷わない */
      footer={
        <View style={{ flexDirection: 'row', gap: S.sm }}>
          <Catcher on={flying?.dir === -1} style={{ flex: 1 }}>
            <GameButton label={spec.left} tone="ghost" onPress={(x, y) => answer(false, x, y)} />
          </Catcher>
          <Catcher on={flying?.dir === 1} style={{ flex: 1 }}>
            <GameButton label={spec.right} onPress={(x, y) => answer(true, x, y)} />
          </Catcher>
        </View>
      }>
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

      {/* いま見る1枚。**紙の色にして、黒地から浮かせる**。
          答えると、選んだ箱のほうへ落ちていく */}
      <PopIn key={`card${at}`}>
        <Animated.View
          style={{
            opacity: fly.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 0.9, 0] }),
            transform: [
              {
                translateX: fly.interpolate({
                  inputRange: [0, 1],
                  /* 画面の外まで。箱の向こうへ抜けたように見せる */
                  outputRange: [0, (flying?.dir ?? 1) * width * 0.85],
                }),
              },
              {
                /* 少し持ち上がってから落ちる。まっすぐ横だと紙に見えない */
                translateY: fly.interpolate({
                  inputRange: [0, 0.35, 1],
                  outputRange: [0, -18, 46],
                }),
              },
              {
                rotate: fly.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${(flying?.dir ?? 1) * 16}deg`],
                }),
              },
              { scale: fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) },
            ],
          }}>
          <View
            style={{
              backgroundColor: C.paper0,
              borderWidth: BW.bold,
              /* 入れた瞬間だけ縁が色づく。当たりは黄、外れは赤 */
              borderColor: flying ? (flying.judged.ok ? C.yellow400 : C.red500) : C.ink900,
              borderRadius: R.md,
              padding: S.lg,
              minHeight: 132,
              justifyContent: 'center',
            }}>
            <Text style={{ fontFamily: FONT.body, fontSize: 15, lineHeight: 25, color: C.ink900 }}>
              {item.text}
            </Text>
          </View>
        </Animated.View>
      </PopIn>

    </View>
    </GameFrame>
  );
}

/* 札を受け止める側の箱。入ってくるあいだだけ、ぐっと持ち上がる。
   **どちらに入れたのか**を絵で残すのが役目 */
function Catcher({
  on,
  style,
  children,
}: {
  on: boolean;
  style?: React.ComponentProps<typeof View>['style'];
  children: React.ReactNode;
}) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(v, {
      toValue: on ? 1 : 0,
      duration: on ? 140 : 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
  }, [on, v]);
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
