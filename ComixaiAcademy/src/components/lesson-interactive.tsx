/* ============================================================
   レッスンの体験カード。読むだけ・選ぶだけにしないための道具。

   いまあるのは2つ:
   ・tokenizer     … 打った文字がどうトークンに割れるか見る（合否なし）
   ・token-budget  … 決められたトークン数に収める（通らないと次へ進めない）

   合否のあるものは、条件を満たしたら onDone(true) を呼ぶこと。
   レッスン側はこれを見て「つぎへ」を出す。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Row } from '@/components/ui';
import type { LessonInteractive } from '@/data/types';
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
