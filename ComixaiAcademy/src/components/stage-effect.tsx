/* ============================================================
   舞台テーマの飾り。ホームの教室に重ねる雨・桜・雪・星。

   ▍動かさない
   ホームは常駐画面なので、ループアニメを置くと電池を食い続ける。
   置き方（位置・大きさ・傾き）で「降っている感じ」を出す。

   ▍位置は決め打ちの散らばり
   Math.random だと描画のたびに配置が変わってチラつく。
   タイル演出（motion.tsx の jitterAt）と同じ発想で、式から作る。
   ============================================================ */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons';
import type { StageTheme } from '@/data/gacha';

/** 0〜1の決まった散らばり */
const fract = (v: number) => v - Math.floor(v);
const jitter = (i: number, salt: number) => fract(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453);

export function StageEffect({ effect }: { effect: NonNullable<StageTheme['effect']> }) {
  const items = React.useMemo(() => {
    const n = effect === 'kira' ? 8 : effect === 'stars' ? 14 : 12;
    return Array.from({ length: n }, (_, i) => ({
      key: i,
      x: jitter(i, 1),
      y: jitter(i, 2),
      s: jitter(i, 3),
      r: jitter(i, 4),
    }));
  }, [effect]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map(({ key, x, y, s, r }) => {
        const left = `${4 + x * 92}%` as const;
        /* 星は空（上側）に、雪や花びらは全体に散らす */
        const top = `${(effect === 'stars' || effect === 'kira' ? 2 + y * 55 : 2 + y * 88)}%` as const;
        if (effect === 'rain') {
          return (
            <View
              key={key}
              style={{
                position: 'absolute',
                left,
                top,
                width: 2,
                height: 22 + s * 16,
                borderRadius: 1,
                backgroundColor: 'rgba(220,235,255,0.4)',
                transform: [{ rotate: '14deg' }],
              }}
            />
          );
        }
        if (effect === 'sakura') {
          return (
            <View
              key={key}
              style={{
                position: 'absolute',
                left,
                top,
                width: 7 + s * 5,
                height: 5 + s * 4,
                borderRadius: 6,
                borderTopLeftRadius: 1,
                backgroundColor: 'rgba(255,200,215,0.85)',
                transform: [{ rotate: `${r * 360}deg` }],
              }}
            />
          );
        }
        if (effect === 'snow') {
          const d = 4 + s * 5;
          return (
            <View
              key={key}
              style={{
                position: 'absolute',
                left,
                top,
                width: d,
                height: d,
                borderRadius: d / 2,
                backgroundColor: 'rgba(255,255,255,0.85)',
              }}
            />
          );
        }
        /* stars / kira */
        return (
          <View key={key} style={{ position: 'absolute', left, top }}>
            <Icon
              name="twinkle"
              size={effect === 'kira' ? 14 + s * 12 : 8 + s * 10}
              color={effect === 'kira' ? '#ffd84d' : r > 0.7 ? '#fff3c4' : '#ffffff'}
              opacity={0.75 + r * 0.25}
            />
          </View>
        );
      })}
    </View>
  );
}
