/* ============================================================
   レッスンの体験カード。読むだけ・選ぶだけにしないための道具。

   いまあるのは3つ:
   ・tokenizer     … 打った文字がどうトークンに割れるか見る（合否なし）
   ・token-budget  … 決められたトークン数に収める（**通らないと次へ進めない**）
   ・ai-prompt     … 実際にAIに指示を出し、結果と指示を採点してもらう（進行は止めない）

   条件を満たしたら onDone(true) を呼ぶ。レッスン側はこれを見て演出を出す。

   ▍先に進めなくするのは token-budget だけ
   トークン数は誰がやっても同じ答えになるので、止めても必ず抜けられる。
   一方 ai-prompt の点はAIの判断で揺れる。**揺れるもので通せんぼをしない。**

   ▍ここは「ミニゲーム」として作る
   本文カードの中に入力欄が生えているだけだと、読み物の続きに見えて手が動かない。
   なので**ゲームの体裁**を与えている：
     ・入る前にタイトルが出る（GameTitle）
     ・トークン数はゲージで見せる。目標帯に入るまでの距離が目で分かる
     ・チップはサイトのトークナイザーと同じ跳ね方で、左から順に増える
     ・通ったらスタンプが降ってくる
   演出はぜんぶ src/components/motion.tsx の部品でやっている。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { Bump, PopIn, SlideIn, Stamp } from '@/components/motion';
import { Button, Row } from '@/components/ui';
import type { LessonInteractive } from '@/data/types';
import { gradePrompt, type GradeResult } from '@/lib/grade';
import { loadTokenizer, toChips, type TokenChip } from '@/lib/tokenizer';
import { BW, C, F, FONT, R, S, T } from '@/theme';

/** 打つたびに数えると重いので、少し落ち着いてから数える */
const DEBOUNCE_MS = 140;

/** チップが1枚ずつずれて出るときの間隔。サイトと同じ28ms、頭打ちも同じ400ms */
const CHIP_STEP_MS = 28;
const CHIP_STEP_MAX = 400;

/** ミニゲームの名前。カードの見出しとは別に、ゲームとしての看板を出す */
const GAME: Record<LessonInteractive['kind'], { name: string; icon: IconName; rule: string }> = {
  tokenizer: { name: 'トークナイザー', icon: 'pen', rule: '打つと、AIの切れ目が見える' },
  'token-budget': { name: 'トークン収め', icon: 'target', rule: '決められた幅に収める' },
  'ai-prompt': { name: 'AIに指示を出す', icon: 'bulb', rule: '書いて、渡して、採点される' },
};

export function LessonInteractiveCard({
  spec,
  onDone,
}: {
  spec: LessonInteractive;
  /** 合否のある体験で、条件を満たしたときに true で呼ぶ */
  onDone?: (ok: boolean) => void;
}) {
  if (spec.kind === 'ai-prompt') return <AiPromptCard spec={spec} onDone={onDone} />;
  return <TokenCard spec={spec} onDone={onDone} />;
}

/* ———————————————— ゲームの看板 ————————————————
   黒帯にゲーム名を出して、左から滑り込ませる。
   「ここからは読み物ではなく、手を動かすところ」の合図。 */

function GameTitle({ kind }: { kind: LessonInteractive['kind'] }) {
  const g = GAME[kind];
  return (
    <SlideIn from="left" distance={30} duration={340}>
      <View
        style={{
          backgroundColor: C.ink900,
          borderWidth: BW.bold,
          borderColor: T.border,
          borderRadius: R.sm,
          paddingHorizontal: S.md,
          paddingVertical: S.sm,
          gap: 2,
        }}>
        <Row gap={7}>
          <Icon name={g.icon} size={16} color={C.yellow400} />
          <Text
            style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.4, color: C.yellow400 }}>
            MINI GAME
          </Text>
        </Row>
        {/* 名前とルールは行を分ける。横に並べると、長いルールが
            「打つと、AIの切れ目が見…」のように切れる */}
        <Text style={{ fontFamily: FONT.display, fontSize: 19, lineHeight: 26, color: C.paper50 }}>
          {g.name}
        </Text>
        <Text style={[F.hand, { fontSize: 12.5, color: C.ink300 }]}>{g.rule}</Text>
      </View>
    </SlideIn>
  );
}

/* ———————————————— 目標のゲージ ————————————————
   「あと何トークン」を文字で言うだけだと、近づいている感じが出ない。
   帯の上に緑の目標ゾーンを置いて、そこへ伸びていくのを見せる。 */

function BudgetGauge({ count, min, max, ok }: { count: number; min: number; max: number; ok: boolean }) {
  /* 上限の少し先まで目盛りを取る。行き過ぎたことも見えるようにするため */
  const span = max * 1.5;
  /** 目盛りの上での位置（%）。RNの型は `${number}%` を求めるので合わせる */
  const pct = (n: number) => `${Math.min(100, (n / span) * 100)}%` as `${number}%`;

  const w = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(w, {
      toValue: Math.min(1, count / span),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      /* 幅はネイティブドライバに載らない */
      useNativeDriver: false,
    }).start();
  }, [count, span, w]);

  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          height: 16,
          borderRadius: R.full,
          borderWidth: BW.line,
          borderColor: T.border,
          backgroundColor: T.sunk,
          overflow: 'hidden',
        }}>
        {/* 目標の帯 */}
        <View
          style={{
            position: 'absolute',
            left: pct(min),
            width: `${((max - min) / span) * 100}%`,
            top: 0,
            bottom: 0,
            backgroundColor: T.okSoft,
            borderLeftWidth: BW.line,
            borderRightWidth: BW.line,
            borderColor: T.ok,
          }}
        />
        {/* いまの位置 */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: ok ? T.ok : T.accent,
            opacity: ok ? 1 : 0.55,
          }}
        />
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9.5, color: T.muted }}>0</Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9.5, color: T.ok }}>
          {min} — {max}
        </Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9.5, color: T.muted }}>{Math.round(span)}</Text>
      </Row>
    </View>
  );
}

function TokenCard({
  spec,
  onDone,
}: {
  spec: Extract<LessonInteractive, { kind: 'tokenizer' | 'token-budget' }>;
  onDone?: (ok: boolean) => void;
}) {
  const budget = spec.kind === 'token-budget' ? spec : null;

  const [text, setText] = React.useState('');
  const [chips, setChips] = React.useState<TokenChip[]>([]);
  const [count, setCount] = React.useState(0);
  const [ready, setReady] = React.useState(false);

  /* 何枚目から先が「新しく増えたぶん」か。ここから右だけを跳ねさせる
     （全部跳ねさせると、1文字打つたびに画面が波打って読めない） */
  const prevChips = React.useRef(0);

  React.useEffect(() => {
    let alive = true;
    loadTokenizer()
      .then(() => alive && setReady(true))
      .catch(() => {
        /* 表が読めなくても、レッスン自体は続けられるようにする */
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      loadTokenizer()
        .then(({ encode, decode }) => {
          const ids = encode(text);
          setChips((old) => {
            prevChips.current = old.length;
            return toChips(ids, decode);
          });
          setCount(ids.length);
        })
        .catch(() => {});
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text, ready]);

  /* 合否。範囲に入った瞬間に1度だけ知らせる */
  const ok = !!budget && count >= budget.min && count <= budget.max;
  const wasOk = React.useRef(false);
  React.useEffect(() => {
    if (!budget) return;
    if (ok && !wasOk.current) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      onDone?.(true);
    }
    wasOk.current = ok;
  }, [ok, budget, onDone]);

  const presets = spec.presets ?? [];

  return (
    <View style={{ gap: S.sm }}>
      <GameTitle kind={spec.kind} />

      {/* ———— お題 ———— */}
      {budget ? (
        <SlideIn from="right" distance={20} delay={90}>
          <View
            style={{
              backgroundColor: C.yellow400,
              borderWidth: BW.bold,
              borderColor: T.border,
              borderRadius: R.sm,
              padding: S.md,
              gap: S.sm,
            }}>
            <Row gap={6}>
              <Icon name="target" size={15} color={C.ink900} />
              <Text
                style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.ink900 }}>
                {budget.min}〜{budget.max} トークンに収める
              </Text>
            </Row>
            <Text style={[F.strong, { fontSize: 14.5, color: C.ink900 }]}>{budget.brief}</Text>
            <BudgetGauge count={count} min={budget.min} max={budget.max} ok={ok} />
          </View>
        </SlideIn>
      ) : null}

      {/* ———— 入力 ———— */}
      <View
        style={{
          backgroundColor: T.surface,
          borderWidth: BW.bold,
          borderColor: ok ? T.ok : T.border,
          borderRadius: R.sm,
          overflow: 'hidden',
        }}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          editable={ready}
          placeholder={ready ? 'ここに打ってみる' : 'よみこみ中…'}
          placeholderTextColor={T.disabled}
          style={{
            minHeight: 88,
            padding: S.md,
            fontFamily: FONT.body,
            fontSize: 15,
            lineHeight: 24,
            color: T.text,
            textAlignVertical: 'top',
          }}
        />
        {/* 数と合否 */}
        <Row
          style={{
            justifyContent: 'space-between',
            borderTopWidth: BW.line,
            borderTopColor: T.borderSoft,
            paddingHorizontal: S.md,
            paddingVertical: S.sm,
            backgroundColor: T.sunk,
          }}>
          <Row gap={6}>
            {/* 数が変わるたびに跳ねる。**打った手応え**がここに出る */}
            <Bump value={count}>
              <Text
                style={{
                  fontFamily: FONT.display,
                  fontSize: 22,
                  lineHeight: 26,
                  color: ok ? T.ok : T.text,
                }}>
                {count}
              </Text>
            </Bump>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>トークン</Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>
              / {[...text].length}文字
            </Text>
          </Row>
          {budget ? (
            <Row gap={5}>
              <Icon name={ok ? 'check' : 'bang'} size={14} color={ok ? T.ok : T.muted} />
              <Text style={[F.hand, { color: ok ? T.ok : T.muted, fontSize: 13 }]}>
                {ok
                  ? 'ぴったり'
                  : count === 0
                    ? 'まだ書いていない'
                    : count < budget.min
                      ? `あと${budget.min - count}トークン`
                      : `${count - budget.max}トークン多い`}
              </Text>
            </Row>
          ) : null}
        </Row>
      </View>

      {/* ———— 通った ————
           降ってきて止まるスタンプ。ここまでで1ゲーム終わり */}
      {ok ? (
        <Stamp style={{ alignSelf: 'center' }}>
          <View
            style={{
              backgroundColor: T.okSoft,
              borderWidth: BW.bold,
              borderColor: T.ok,
              borderRadius: R.sm,
              paddingHorizontal: S.lg,
              paddingVertical: 6,
            }}>
            <Row gap={7}>
              <Icon name="perfect" size={18} color={T.ok} />
              <Text style={{ fontFamily: FONT.display, fontSize: 17, lineHeight: 24, color: T.ok }}>
                ぴったり！
              </Text>
            </Row>
          </View>
        </Stamp>
      ) : null}

      {/* ———— 割れ方 ————
           サイトのトークナイザーと同じで、増えたぶんだけ左から順に跳ねて出る */}
      {chips.length ? (
        <View style={{ gap: 5 }}>
          <Text style={[F.hand, { fontSize: 12.5 }]}>AIにはこう見えている↓</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
            {chips.map((c, i) => {
              const isNew = i >= prevChips.current;
              return (
                <PopIn
                  key={i}
                  animate={isNew}
                  delay={isNew ? Math.min((i - prevChips.current) * CHIP_STEP_MS, CHIP_STEP_MAX) : 0}>
                  <View
                    style={{
                      /* 2トークン以上でやっと1つの文字列になった塊は色を変える。
                         「日本語は文字数とトークン数が一致しない」がこれで目に入る */
                      backgroundColor: c.n > 1 ? C.red50 : T.surface,
                      borderWidth: BW.hair,
                      borderColor: c.n > 1 ? C.red500 : T.borderSoft,
                      borderRadius: R.xs,
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                    }}>
                    <Text style={{ fontFamily: FONT.mono, fontSize: 12.5, color: T.text }}>
                      {c.text === ' ' ? '␣' : c.text.replace(/\n/g, '⏎')}
                      {c.n > 1 ? <Text style={{ fontSize: 9, color: C.red600 }}> {c.n}</Text> : null}
                    </Text>
                  </View>
                </PopIn>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* ———— 例文 ———— */}
      {presets.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {presets.map((p) => (
            <Pressable
              key={p}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }
                setText(p);
              }}
              style={{
                backgroundColor: T.surface,
                borderWidth: BW.line,
                borderColor: T.border,
                borderRadius: R.full,
                paddingHorizontal: 11,
                paddingVertical: 6,
              }}>
              <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: T.body }} numberOfLines={1}>
                {p.length > 18 ? p.slice(0, 18) + '…' : p}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

/* ============================================================
   実際にAIに指示を出して、その結果と指示そのものを採点してもらうカード。

   採点はサイト側の /api/academy/grade がやる（APIキーはあちら）。
   AIが使えないときは簡易採点に降格する（src/lib/grade.ts）。
   **降格しても合否は出る。** 学習を止めないことを優先している。
   ============================================================ */
function AiPromptCard({
  spec,
  onDone,
}: {
  spec: Extract<LessonInteractive, { kind: 'ai-prompt' }>;
  onDone?: (ok: boolean) => void;
}) {
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<GradeResult | null>(null);

  const passed = !!result && result.score >= spec.pass;
  React.useEffect(() => {
    if (passed) onDone?.(true);
  }, [passed, onDone]);

  const submit = async () => {
    if (busy || text.trim().length < 5) return;
    setBusy(true);
    setResult(null);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const r = await gradePrompt(spec.exerciseId, text.trim());
    setResult(r);
    setBusy(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        r.score >= spec.pass
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
  };

  return (
    <View style={{ gap: S.sm }}>
      <GameTitle kind={spec.kind} />

      {/* お題 */}
      <SlideIn from="right" distance={20} delay={90}>
        <View
          style={{
            backgroundColor: C.yellow400,
            borderWidth: BW.bold,
            borderColor: T.border,
            borderRadius: R.sm,
            padding: S.md,
            gap: 4,
          }}>
          <Row gap={6}>
            <Icon name="target" size={15} color={C.ink900} />
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.ink900 }}>
              {spec.pass}点以上で合格
            </Text>
          </Row>
          <Text style={[F.strong, { fontSize: 14.5, color: C.ink900 }]}>{spec.brief}</Text>
        </View>
      </SlideIn>

      {/* 入力 */}
      <View
        style={{
          backgroundColor: T.surface,
          borderWidth: BW.bold,
          borderColor: passed ? T.ok : T.border,
          borderRadius: R.sm,
          overflow: 'hidden',
        }}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          editable={!busy}
          placeholder={'ここにプロンプトを書く\n（役割・目的・条件・出力形式）'}
          placeholderTextColor={T.disabled}
          style={{
            minHeight: 130,
            padding: S.md,
            fontFamily: FONT.body,
            fontSize: 15,
            lineHeight: 24,
            color: T.text,
            textAlignVertical: 'top',
          }}
        />
      </View>

      <Button
        label={busy ? 'AIが書いています…' : result ? 'もう一度ためす' : 'AIに渡す'}
        onPress={submit}
        disabled={busy || text.trim().length < 5}
      />

      {busy ? <Thinking /> : null}

      {/* 結果 */}
      {result ? (
        <SlideIn from="bottom" distance={18} duration={340} style={{ gap: S.sm }}>
          <View
            style={{
              backgroundColor: passed ? T.okSoft : T.warnSoft,
              borderWidth: BW.bold,
              borderColor: passed ? T.ok : T.warn,
              borderRadius: R.sm,
              padding: S.md,
              gap: 6,
            }}>
            <Row gap={8}>
              <Icon name={passed ? 'perfect' : 'bulb'} size={20} color={passed ? T.ok : T.warn} />
              {/* 点は跳ねて出る。採点が「返ってきた」ことが目で分かる */}
              <PopIn>
                <Text style={{ fontFamily: FONT.display, fontSize: 26, lineHeight: 30, color: T.text }}>
                  {result.score}
                  <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: T.muted }}>点</Text>
                </Text>
              </PopIn>
              <Text style={[F.strong, { flex: 1, textAlign: 'right', fontSize: 13 }]}>
                {passed ? '合格' : `あと${spec.pass - result.score}点`}
              </Text>
            </Row>
            {result.good ? <Text style={F.body}>◎ {result.good}</Text> : null}
            {result.improve ? <Text style={F.body}>→ {result.improve}</Text> : null}
            {result.missing.length ? (
              <Row gap={5} style={{ flexWrap: 'wrap' }}>
                {result.missing.map((m, i) => (
                  <PopIn key={m} delay={i * CHIP_STEP_MS}>
                    <View
                      style={{
                        borderWidth: BW.hair,
                        borderColor: T.border,
                        borderRadius: R.full,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        backgroundColor: T.surface,
                      }}>
                      <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, color: T.body }}>{m}</Text>
                    </View>
                  </PopIn>
                ))}
              </Row>
            ) : null}
          </View>

          {/* AIが実際に書いたもの */}
          {result.output ? (
            <View style={{ gap: 5 }}>
              <Text style={[F.hand, { fontSize: 12.5 }]}>あなたの指示で、AIはこう書いた↓</Text>
              <View
                style={{
                  backgroundColor: C.ink900,
                  borderRadius: R.sm,
                  padding: S.md,
                }}>
                <Text
                  style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 22, color: C.paper50 }}>
                  {result.output}
                </Text>
              </View>
            </View>
          ) : null}

          {result.offline ? (
            <Text style={[F.tiny, { textAlign: 'center' }]}>
              いまAIに繋がらないので、簡易採点で出しています
            </Text>
          ) : null}
        </SlideIn>
      ) : null}
    </View>
  );
}

/* 待っているあいだの3つの点。順に膨らむ。
   進捗バーは出さない——**何割終わったかを知らないので、出せば嘘になる** */
function Thinking() {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 3, duration: 1050, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Row gap={7} style={{ justifyContent: 'center', paddingVertical: 2 }}>
      {[0, 1, 2].map((n) => (
        <Animated.View
          key={n}
          style={{
            width: 8,
            height: 8,
            borderRadius: R.full,
            backgroundColor: T.accent,
            transform: [
              {
                scale: t.interpolate({
                  inputRange: [n - 0.5, n, n + 0.5, n + 2.5, n + 3],
                  outputRange: [1, 1.7, 1, 1, 1.7],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
        />
      ))}
      <Text style={[F.hand, { fontSize: 12.5, marginLeft: 4 }]}>返事を待っています…</Text>
    </Row>
  );
}
