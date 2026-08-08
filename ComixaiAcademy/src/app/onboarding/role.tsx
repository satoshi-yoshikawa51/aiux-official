/* オンボーディング2: 職種を選ぶ。ここでコースの中身が変わる。

   見た目の作法はホームに揃えてある。黄色いピルは STEP 表示が持つ（1画面に1つ）。
   職種は10あるので、一覧は2列グリッド（src/components/role-picker.tsx）。 */
import { useRouter } from 'expo-router';
import React from 'react';

import { RolePicker } from '@/components/role-picker';
import { Bubble, Screen, ScreenHead } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import type { RoleId } from '@/data/types';
import { useProgress } from '@/store/progress';
import { POP, S } from '@/theme';

export default function RolePickScreen() {
  const router = useRouter();
  const { state, setRole } = useProgress();
  const avatar = getAvatar(state.avatarId);

  /* ▍決めるのはポップアップの中
     かつては一覧の下に説明を出し、さらに下に「はじめる」を置いていた。
     説明が出るぶん下が伸びて、**選んだ瞬間にボタンが画面の外へ出て**
     いた（選んだのに進めない）。いまは押す → 説明を読む → その場で決める。 */
  const decide = (id: RoleId) => {
    setRole(id);
    router.replace('/');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      tone="dots"
      header={
        <ScreenHead
          pill="STEP 2 / 2"
          title="どんな仕事をしてる？"
          note="選んだ職種にあわせて、例とプロンプトが変わります"
        />
      }>
      <Bubble
        variant="shout"
        text={`${avatar.name}だ。で、あんたの仕事は？ そこが決まらないと、教える中身が決まらない。`}
        style={{ marginRight: POP.sm, marginBottom: S.lg }}
      />

      <RolePicker value={null} onPick={decide} confirmLabel="この仕事ではじめる" />
    </Screen>
  );
}
