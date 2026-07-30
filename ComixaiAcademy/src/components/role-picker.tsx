/* ============================================================
   職種えらび。オンボーディングとせっての両方で使う。

   ▍なぜ1列のカードをやめたか
   職種が10になり、1列の縦並びだと1画面に3枚しか入らなくなった。
   選ぶには全部見えていることが大事なので、**アイコンと名前だけの
   2列グリッド**にして一覧性を取り、説明は「いま選んでいる1つ」だけ
   下に出す形にしている。10枚でもだいたい1画面に収まる。
   ============================================================ */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Panel, Pop, Row } from '@/components/ui';
import { ROLES, getRole } from '@/data/roles';
import type { RoleId } from '@/data/types';
import { BW, F, FONT, POP, R, S, T } from '@/theme';

function RoleCard({
  icon,
  name,
  selected,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = React.useState(false);
  return (
    /* 47%＋gap で2列。48%だと、ベタ影のぶんが右端からはみ出る端末がある */
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={{ width: '47%' }}>
      <Pop offset={pressed ? 1 : POP.sm} radius={R.md} reserve={false} style={{ marginBottom: POP.sm }}>
        <View
          style={{
            backgroundColor: selected ? T.accentSoft : T.surface,
            borderWidth: selected ? BW.bold : BW.line,
            borderColor: T.border,
            borderRadius: R.md,
            paddingVertical: S.md,
            paddingHorizontal: S.sm,
            minHeight: 78,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }],
          }}>
          <Icon name={icon} size={23} color={selected ? T.accent : T.text} />
          <Text
            numberOfLines={2}
            style={{
              fontFamily: FONT.heading,
              fontSize: 12.5,
              lineHeight: 17,
              textAlign: 'center',
              color: T.text,
            }}>
            {name}
          </Text>
        </View>
      </Pop>
    </Pressable>
  );
}

export function RolePicker({
  value,
  onPick,
}: {
  value: RoleId | null;
  onPick: (id: RoleId) => void;
}) {
  const picked = getRole(value);
  return (
    <View style={{ gap: S.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: S.sm }}>
        {ROLES.map((r) => (
          <RoleCard
            key={r.id}
            icon={r.icon}
            name={r.name}
            selected={r.id === value}
            onPress={() => onPick(r.id)}
          />
        ))}
      </View>

      {/* 説明は選んだ1つだけ。全部に出すと、10枚ぶんで画面が3倍になる */}
      {picked ? (
        <Panel contentStyle={{ gap: 6, padding: S.md }}>
          <Row gap={6}>
            <Icon name={picked.icon} size={18} color={T.accent} />
            <Text style={[F.h2, { flex: 1 }]}>{picked.name}</Text>
          </Row>
          <Text style={F.body}>{picked.catch}</Text>
          <View style={{ gap: 2, marginTop: 2 }}>
            {picked.fit.map((f) => (
              <Text key={f} style={F.hand}>
                ・{f}
              </Text>
            ))}
          </View>
        </Panel>
      ) : (
        <Text style={F.hand}>ひとつ選ぶと、ここに説明が出る</Text>
      )}
    </View>
  );
}
