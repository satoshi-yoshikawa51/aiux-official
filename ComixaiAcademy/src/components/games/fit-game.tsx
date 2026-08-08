/* ============================================================
   詰める。限られた広さの「作業机」に、どの資料を載せるか選ぶ。

   ▍打つのをやめて、選ぶに変えた
   もとは「決められたトークン数に収まるまで文章を書いて削る」だった。
   狙い（作業机には上限がある）は良いのに、**スマホで長文を書いて
   削るのがとにかく面倒**で、体験の前に力尽きる。

   載せる資料を選ぶ形なら、1タップで机が埋まっていくのが見える。
   しかも「入るかどうか」だけでなく**「要るものを入れたか」**まで
   問える。上限との戦いは、本当は取捨選択の話なので、こちらのほうが近い。

   ▍入れすぎたら入らない、で終わらせない
   容量に収まっていても、要るものが抜けていれば通らない。
   容量だけ見ると「軽いものだけ載せる」が最適解になってしまう。
   ============================================================ */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Bump, PopIn, useSparkBurst, useTap } from '@/components/motion';
import type { LessonInteractive } from '@/data/types';
import { BW, C, F, FONT, R, S } from '@/theme';

import { GameButton } from './parts';

type Spec = Extract<LessonInteractive, { kind: 'fit' }>;

export function FitPlay({ spec, onClear }: { spec: Spec; onClear: () => void }) {
  const burst = useSparkBurst();
  const [on, setOn] = React.useState<number[]>([]);
  const [checked, setChecked] = React.useState(false);

  const used = on.reduce((a, i) => a + spec.items[i].cost, 0);
  const over = used > spec.capacity;
  const missing = spec.items.filter((it, i) => it.needed && !on.includes(i));
  const junk = on.filter((i) => !spec.items[i].needed);
  const ok = !over && missing.length === 0 && junk.length === 0;

  const toggle = (i: number, x: number, y: number) => {
    setChecked(false);
    setOn((v) => (v.includes(i) ? v.filter((n) => n !== i) : [...v, i]));
    if (!on.includes(i)) burst(x, y, 0.9);
  };

  const pct = Math.min(100, Math.round((used / spec.capacity) * 100));

  return (
    <View style={{ gap: S.md }}>
      <Text style={[F.hand, { fontSize: 13, color: C.paper100 }]}>{spec.brief}</Text>

      {/* 机の埋まり具合 */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Bump value={used}>
            <Text
              style={{
                fontFamily: FONT.display,
                fontSize: 26,
                color: over ? C.red500 : C.paper0,
              }}>
              {used}
            </Text>
          </Bump>
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.ink300 }}>
            つくえの広さ {spec.capacity}
          </Text>
        </View>
        <View
          style={{
            height: 14,
            borderRadius: R.full,
            backgroundColor: C.ink800,
            borderWidth: BW.line,
            borderColor: over ? C.red500 : C.ink700,
            overflow: 'hidden',
          }}>
          <View
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: over ? C.red500 : C.yellow400,
            }}
          />
        </View>
        {over ? (
          <Text style={[F.hand, { fontSize: 12.5, color: C.red500 }]}>
            机からはみ出しています。古いものから忘れられます。
          </Text>
        ) : null}
      </View>

      {/* 載せる資料 */}
      <View style={{ gap: 6 }}>
        {spec.items.map((it, i) => (
          <FitRow
            key={it.name}
            name={it.name}
            cost={it.cost}
            on={on.includes(i)}
            onPress={(x, y) => toggle(i, x, y)}
          />
        ))}
      </View>

      {/* 答え合わせ */}
      {checked ? (
        <PopIn>
          <View style={{ gap: 6 }}>
            {ok ? (
              <Text style={[F.hand, { fontSize: 13, color: C.yellow400 }]}>
                要るものだけが載っています。これが「机を空けて使う」ということ。
              </Text>
            ) : (
              <>
                {over ? null : null}
                {missing.map((m) => (
                  <Text key={m.name} style={[F.hand, { fontSize: 12.5, color: C.red500 }]}>
                    「{m.name}」が抜けています。{m.why}
                  </Text>
                ))}
                {junk.map((i) => (
                  <Text key={i} style={[F.hand, { fontSize: 12.5, color: C.red500 }]}>
                    「{spec.items[i].name}」は要りません。{spec.items[i].why}
                  </Text>
                ))}
              </>
            )}
          </View>
        </PopIn>
      ) : null}

      {ok && checked ? (
        <GameButton label="これで決める" onPress={onClear} />
      ) : (
        <GameButton label="これで渡す" onPress={() => setChecked(true)} disabled={on.length === 0} />
      )}
    </View>
  );
}

/* 資料1つ。載せると黄色くなる */
function FitRow({
  name,
  cost,
  on,
  onPress,
}: {
  name: string;
  cost: number;
  on: boolean;
  onPress: (x: number, y: number) => void;
}) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light' });
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={(e) => onPress(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: S.sm,
          backgroundColor: on ? C.yellow400 : pressed ? C.ink800 : 'transparent',
          borderWidth: on ? BW.bold : BW.line,
          borderColor: on ? C.yellow400 : C.ink700,
          borderRadius: R.sm,
          paddingHorizontal: S.md,
          paddingVertical: 11,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        }}>
        <Icon name={on ? 'check' : 'folder'} size={15} color={on ? C.ink900 : C.ink300} />
        <Text
          style={{
            fontFamily: FONT.body,
            fontSize: 13.5,
            color: on ? C.ink900 : C.paper100,
            flex: 1,
          }}>
          {name}
        </Text>
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            color: on ? C.ink900 : C.ink300,
          }}>
          {cost}
        </Text>
      </View>
    </Pressable>
  );
}
