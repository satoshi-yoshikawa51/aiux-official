/* ============================================================
   職種えらび。オンボーディングとせっての両方で使う。

   ▍なぜ1列のカードをやめたか
   職種が10になり、1列の縦並びだと1画面に3枚しか入らなくなった。
   選ぶには全部見えていることが大事なので、**アイコンと名前だけの
   2列グリッド**にして一覧性を取っている。10枚でもだいたい1画面に収まる。

   ▍説明を一覧の下に置くのをやめた
   かつては選んだ1つの説明をグリッドの下に出していた。ところが説明が
   出るぶん下が伸びて、**先へ進むボタンが画面の外へ押し出されていた**。
   選んだのに進めない、という一番まずい状態になる。

   いまはカードを押すと説明が**ポップアップ**で出て、決めるのもその中で行う。
   一覧の高さは動かないし、読んでから決められる。
   ============================================================ */
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { useTap } from '@/components/motion';
import { Button, Panel, Pop, Row, sinkPop, Tap } from '@/components/ui';
import { ROLES, getRole, type Role } from '@/data/roles';
import type { RoleId } from '@/data/types';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

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
  const { pressed, onPressIn, onPressOut } = useTap();
  return (
    /* 47%＋gap で2列。48%だと、ベタ影のぶんが右端からはみ出る端末がある */
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={{ width: '47%' }}>
      <Pop offset={pressed ? 0 : POP.sm} radius={R.md} reserve={false} style={{ marginBottom: POP.sm }}>
        <View
          style={[{
            backgroundColor: pressed ? T.sunk : selected ? T.accentSoft : T.surface,
            borderWidth: selected ? BW.bold : BW.line,
            borderColor: T.border,
            borderRadius: R.md,
            paddingVertical: S.md,
            paddingHorizontal: S.sm,
            minHeight: 78,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }, sinkPop(pressed)]}>
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

/* 押した職種の説明。読んでから、ここで決める */
function RoleSheet({
  role,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  role: Role;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      {/* 外側を押しても閉じる。読むだけのつもりで開いた人の逃げ道 */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(20,17,15,0.55)',
          justifyContent: 'center',
          padding: S.lg,
        }}>
        {/* 中身を押しても閉じない */}
        <Pressable onPress={() => {}}>
          <Panel contentStyle={{ gap: S.sm, padding: S.lg }}>
            <Row gap={8}>
              <Icon name={role.icon} size={26} color={T.accent} />
              <Text style={[F.h1, { flex: 1 }]}>{role.name}</Text>
              {/* 閉じる口は**右上のばつ**。決めるボタンの真下に文字で置くと、
                  決めたつもりで閉じてしまう（実際に誤タップしそうだと指摘された） */}
              <Tap onPress={onClose} sparks={false} hitSlop={12}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: R.full,
                    borderWidth: BW.line,
                    borderColor: T.border,
                    backgroundColor: T.sunk,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon name="close" size={13} color={T.text} />
                </View>
              </Tap>
            </Row>
            <Text style={F.body}>{role.catch}</Text>
            <View style={{ gap: 3, marginTop: 2 }}>
              {role.fit.map((f) => (
                <Text key={f} style={F.hand}>
                  ・{f}
                </Text>
              ))}
            </View>
            <View style={{ marginTop: S.sm }}>
              <Button label={confirmLabel} size="lg" onPress={onConfirm} />
            </View>
          </Panel>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function RolePicker({
  value,
  onPick,
  /** ポップアップの決めるボタンの文言。画面によって意味が違う */
  confirmLabel = 'この仕事にする',
}: {
  value: RoleId | null;
  onPick: (id: RoleId) => void;
  confirmLabel?: string;
}) {
  /* 押しただけではまだ決まらない。説明を読んでから決める */
  const [looking, setLooking] = React.useState<RoleId | null>(null);
  const role = getRole(looking);

  return (
    <View style={{ gap: S.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: S.sm }}>
        {ROLES.map((r) => (
          <RoleCard
            key={r.id}
            icon={r.icon}
            name={r.name}
            selected={r.id === value}
            onPress={() => setLooking(r.id)}
          />
        ))}
      </View>

      <Text style={F.hand}>ひとつ選ぶと、どんな内容になるかが見られます</Text>

      {role ? (
        <RoleSheet
          role={role}
          confirmLabel={confirmLabel}
          onConfirm={() => {
            setLooking(null);
            onPick(role.id);
          }}
          onClose={() => setLooking(null)}
        />
      ) : null}
    </View>
  );
}
