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
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Button, Row } from '@/components/ui';
import type { LessonInteractive } from '@/data/types';
import { gradePrompt, type GradeResult } from '@/lib/grade';
import { loadTokenizer, toChips, type TokenChip } from '@/lib/tokenizer';
import { BW, C, F, FONT, R, S, T } from '@/theme';

/** 打つたびに数えると重いので、少し落ち着いてから数える */
const DEBOUNCE_MS = 140;

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
          setCount(ids.length);
          setChips(toChips(ids, decode));
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
      {/* ———— お題 ———— */}
      {budget ? (
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
              {budget.min}〜{budget.max} トークンに収める
            </Text>
          </Row>
          <Text style={[F.strong, { fontSize: 14.5, color: C.ink900 }]}>{budget.brief}</Text>
        </View>
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
            <Text style={{ fontFamily: FONT.display, fontSize: 22, lineHeight: 26, color: ok ? T.ok : T.text }}>
              {count}
            </Text>
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

      {/* ———— 割れ方 ———— */}
      {chips.length ? (
        <View style={{ gap: 5 }}>
          <Text style={[F.hand, { fontSize: 12.5 }]}>AIにはこう見えている↓</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
            {chips.map((c, i) => (
              <View
                key={i}
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
                  {c.n > 1 ? (
                    <Text style={{ fontSize: 9, color: C.red600 }}> {c.n}</Text>
                  ) : null}
                </Text>
              </View>
            ))}
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
      {/* お題 */}
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

      {busy ? <Text style={[F.hand, { textAlign: 'center' }]}>返事を待っています…</Text> : null}

      {/* 結果 */}
      {result ? (
        <View style={{ gap: S.sm }}>
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
              <Text style={{ fontFamily: FONT.display, fontSize: 26, lineHeight: 30, color: T.text }}>
                {result.score}
                <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: T.muted }}>点</Text>
              </Text>
              <Text style={[F.strong, { flex: 1, textAlign: 'right', fontSize: 13 }]}>
                {passed ? '合格' : `あと${spec.pass - result.score}点`}
              </Text>
            </Row>
            {result.good ? <Text style={F.body}>◎ {result.good}</Text> : null}
            {result.improve ? <Text style={F.body}>→ {result.improve}</Text> : null}
            {result.missing.length ? (
              <Row gap={5} style={{ flexWrap: 'wrap' }}>
                {result.missing.map((m) => (
                  <View
                    key={m}
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
        </View>
      ) : null}
    </View>
  );
}
