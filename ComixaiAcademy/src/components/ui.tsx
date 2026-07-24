/* ============================================================
   共通UI部品。マンガのコマ（太いインク枠＋ベタ影）を基本形にしている。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { C, F, R, S, T, inkBorder, inkShadow } from '@/theme';

export function Screen({
  children,
  edges = ['top'],
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  edges?: Edge[];
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[{ padding: S.lg, paddingBottom: S.xxl * 2, gap: S.lg }, style]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding: S.lg, gap: S.lg }, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {inner}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  tone = 'surface',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'sunk' | 'accent' | 'ok' | 'warn';
}) {
  const bg = {
    surface: T.surface,
    sunk: T.sunk,
    accent: T.accentSoft,
    ok: T.okSoft,
    warn: T.warnSoft,
  }[tone];
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'quiet';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const press = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };
  const bg = variant === 'primary' ? T.accent : variant === 'ghost' ? T.surface : 'transparent';
  const fg = variant === 'primary' ? C.paper0 : T.text;
  return (
    <Pressable
      onPress={press}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        variant === 'quiet' && { borderWidth: 0 },
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}>
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Tag({
  children,
  tone = 'default',
  style,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'accent' | 'ok' | 'muted';
  style?: StyleProp<ViewStyle>;
}) {
  const { bg, fg } = {
    default: { bg: T.sunk, fg: T.body },
    accent: { bg: T.accent, fg: C.paper0 },
    ok: { bg: T.okSoft, fg: T.ok },
    muted: { bg: 'transparent', fg: T.muted },
  }[tone];
  return (
    <View style={[styles.tag, { backgroundColor: bg }, style]}>
      <Text style={[F.tiny, { color: fg, fontWeight: '700' }]}>{children}</Text>
    </View>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%` }]} />
    </View>
  );
}

/** 先生のセリフを入れるフキダシ（左下にしっぽ） */
export function Bubble({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <View style={styles.bubble}>
        <Text style={[F.body, { color: T.text }]}>{text}</Text>
      </View>
      <View style={styles.bubbleTailOuter} />
      <View style={styles.bubbleTailInner} />
    </View>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={F.h1}>{children}</Text>
      {sub ? <Text style={F.small}>{sub}</Text> : null}
    </View>
  );
}

export function Row({
  children,
  style,
  gap = S.sm,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[F.small, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  card: {
    ...inkBorder,
    ...inkShadow(3),
    padding: S.lg,
    gap: S.sm,
  },
  button: {
    ...inkBorder,
    ...inkShadow(3),
    borderRadius: R.pill,
    paddingVertical: 14,
    paddingHorizontal: S.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { transform: [{ translateX: 2 }, { translateY: 2 }], shadowOpacity: 0 },
  buttonLabel: { fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  tag: {
    borderRadius: R.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  barTrack: {
    height: 12,
    borderRadius: R.pill,
    backgroundColor: T.sunk,
    borderWidth: 2,
    borderColor: T.border,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: T.accent },
  bubble: {
    ...inkBorder,
    ...inkShadow(3),
    backgroundColor: T.surface,
    padding: S.md,
    borderRadius: R.lg,
  },
  /* しっぽ：外側（インク色）の上に内側（紙色）を重ねて三角の縁取りを作る */
  bubbleTailOuter: {
    position: 'absolute',
    bottom: -13,
    left: 26,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: T.border,
  },
  bubbleTailInner: {
    position: 'absolute',
    bottom: -8,
    left: 29,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: T.surface,
  },
});
