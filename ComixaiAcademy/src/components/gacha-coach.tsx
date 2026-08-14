/* ============================================================
   ガチャの案内。**1本目を終えてホームに戻った所**で、先生が声をかける。

   ▍なぜ最初の案内に入れないのか
   オンボーディング直後にガチャを見せても、まわすPが無いし、当てても
   飾る場所（ホームの舞台）を見たことがない。**1本やって、ホームに
   戻ってきた瞬間**なら、報酬の意味も飾る場所も分かっている。

   ▍段取り
   1. ホーム … 先生が3Pを渡し、**ガチャの入口そのものを光らせる**
   2. ガチャ … 「まわす」を1回だけ案内する
   3. 当たったあと … 舞台とアバターを変えられることだけ伝えて終わり。
      **実際には変えない**（勝手に見た目が変わると驚く。選ぶのは本人）

   ▍説明のカードを別に置かない
   はじめはホームの下に案内カードを1枚積んでいた。が、それだと
   **本物のガチャの入口（舞台の左下のP）を一度も触らないまま**
   話だけ聞かされて、次に自分で行くとき「どこから入るんだっけ」になる。
   いまは押してほしい当のものを光らせて、そこを押してもらう。
   説明はガチャの画面に着いてからでいい。

   ▍アプリ案内（store/tutorial.tsx）とは別物
   あちらはタブの中だけで動く仕組みで、ガチャはタブの外の画面。
   1回きりの短い流れなので、画面を止めずに**光らせて、ひと言だけ**にした。
   ============================================================ */
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PopIn } from '@/components/motion';
import { Button, Row } from '@/components/ui';
import { SPIN_COST } from '@/data/gacha';
import { useProgress } from '@/store/progress';
import { C, F, S } from '@/theme';

/** ホームで先生が言うこと。**ホームのフキダシに出す**（→ app/(tabs)/index.tsx）。

    「左下の」と場所で言わずに「光ってる」で指す。アプリ案内でも同じにして
    ある（→ store/tutorial.tsx）。場所の言い方は画面の広さで狂うが、
    光っているものは狂わない */
export const GACHA_COACH_SAY = `1本おつかれさま。ごほうびに${SPIN_COST}P あげる。光ってるところ、押してみて。`;

/** 案内を出す番か。1本終えていて、まだ見ていない人だけ */
export function useGachaCoach() {
  const { state, ready } = useProgress();
  const done = Object.keys(state.done).length;
  /* すでに何か当てている人には出さない。**もう知っている人に
     「ガチャというものがあってね」と話しかけない**ため
     （記録を引き継いだ人や、案内を入れる前から遊んでいた人） */
  const knows = Object.keys(state.themes).length > 0 || Object.keys(state.skins).length > 0;
  return {
    /** ホームでガチャの入口を光らせる番 */
    onHome: ready && state.seenTutorial && done >= 1 && !state.seenGachaTutorial && !knows,
    /** ガチャ画面で案内する番（Pを渡したあと） */
    onGacha: ready && state.gachaCoinsGiven && !state.seenGachaTutorial,
  };
}

/** 案内が始まったら、その場で3Pを渡す。

    ▍ボタンを押させてから渡す、ではなく、先に渡す
    渡す口が別のボタンだと、**押すものが2つ**になる（もらうボタンと、
    ガチャの入口）。先に入れておけば、光っているPの数字がその場で増えて、
    「ごほうびをもらった」ことが入口そのものに出る。押す先は1つで済む。

    `startGachaCoach` は2回目以降なにもしない（→ store/progress.tsx）ので、
    画面が何度描き直されても増え続けることはない */
export function useGachaCoachGift() {
  const { startGachaCoach } = useProgress();
  const { onHome } = useGachaCoach();
  React.useEffect(() => {
    if (onHome) startGachaCoach();
  }, [onHome, startGachaCoach]);
}

/* ———— ガチャ画面側 ————
   まわす前と、まわしたあとで言うことが変わる。
   `spun` は**この画面で1回まわしたか**（ガチャ画面が持っている） */
export function GachaCoachBand({ spun }: { spun: boolean }) {
  const { markGachaCoachSeen } = useProgress();
  const { onGacha } = useGachaCoach();
  if (!onGacha) return null;

  return (
    <PopIn>
      <View
        style={{
          borderWidth: 2,
          borderColor: C.yellow400,
          borderRadius: 10,
          backgroundColor: C.ink900,
          padding: S.md,
          gap: S.sm,
        }}>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Icon name="bulb" size={17} color={C.yellow400} />
          <Text style={[F.strong, { flex: 1, color: C.paper50 }]}>
            {spun
              ? '当てたものは、下の棚に並ぶ。ホームの背景と、私の見た目を変えられる。'
              : `ここがガチャ。さっきの${SPIN_COST}Pで、下の赤いボタンから1回まわせる。`}
          </Text>
        </Row>
        <Text style={[F.tiny, { color: C.ink300 }]}>
          {spun
            ? '※ いま変えなくていい。せってい からいつでも変えられる'
            : '※ 何が出るかは「提供割合をみる」で確かめられる'}
        </Text>
        {spun ? (
          <Button
            label="わかった"
            size="sm"
            onPress={markGachaCoachSeen}
            style={{ alignSelf: 'flex-start' }}
          />
        ) : null}
      </View>
    </PopIn>
  );
}
