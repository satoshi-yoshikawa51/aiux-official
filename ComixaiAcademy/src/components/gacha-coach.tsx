/* ============================================================
   ガチャの案内。**1本目を終えてホームに戻った所**で、先生が声をかける。

   ▍なぜ最初の案内に入れないのか
   オンボーディング直後にガチャを見せても、まわすPが無いし、当てても
   飾る場所（ホームの舞台）を見たことがない。**1本やって、ホームに
   戻ってきた瞬間**なら、報酬の意味も飾る場所も分かっている。

   ▍段取り
   1. ホーム … 先生が3Pを渡す（初回だけ）→「ガチャへ」
   2. ガチャ … 「まわす」を1回だけ案内する
   3. 当たったあと … 舞台とアバターを変えられることだけ伝えて終わり。
      **実際には変えない**（勝手に見た目が変わると驚く。選ぶのは本人）

   ▍アプリ案内（store/tutorial.tsx）とは別物
   あちらはタブの中だけで動く仕組みで、ガチャはタブの外の画面。
   1回きりの短い流れなので、画面を止めずに**カードを1枚出すだけ**にした。
   ============================================================ */
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { PopIn } from '@/components/motion';
import { Button, Card, Row } from '@/components/ui';
import { SPIN_COST } from '@/data/gacha';
import { useProgress } from '@/store/progress';
import { C, F, S, T } from '@/theme';

/** 案内を出す番か。1本終えていて、まだ見ていない人だけ */
export function useGachaCoach() {
  const { state, ready } = useProgress();
  const done = Object.keys(state.done).length;
  /* すでに何か当てている人には出さない。**もう知っている人に
     「ガチャというものがあってね」と話しかけない**ため
     （記録を引き継いだ人や、案内を入れる前から遊んでいた人） */
  const knows = Object.keys(state.themes).length > 0 || Object.keys(state.skins).length > 0;
  return {
    /** ホームで声をかける番 */
    onHome: ready && state.seenTutorial && done >= 1 && !state.seenGachaTutorial && !knows,
    /** ガチャ画面で案内する番（Pを渡したあと） */
    onGacha: ready && state.gachaCoinsGiven && !state.seenGachaTutorial,
  };
}

/* ———— ホーム側 ———— */
export function GachaCoachHome() {
  const router = useRouter();
  const { state, startGachaCoach } = useProgress();
  const { onHome } = useGachaCoach();
  if (!onHome) return null;

  const given = state.gachaCoinsGiven;
  return (
    <PopIn>
      <Card tone="warn">
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Icon name="egg" size={20} color={T.accent} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={F.strong}>
              {given ? 'ガチャ、まだまわしてないね。' : '1本おつかれさま。ごほうびがある。'}
            </Text>
            <Text style={F.small}>
              {given
                ? `渡した${SPIN_COST}Pは、そのまま残ってる。1回まわしてみて。`
                : `${SPIN_COST}P あげる。ガチャを1回まわすと、ホームの背景や私の見た目が増える。`}
            </Text>
          </View>
        </Row>
        <Button
          label={given ? 'ガチャへ' : `${SPIN_COST}P もらってガチャへ`}
          size="sm"
          onPress={() => {
            startGachaCoach();
            router.push('/gacha');
          }}
          style={{ alignSelf: 'flex-start' }}
        />
      </Card>
    </PopIn>
  );
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
              : `下の赤いボタンで1回まわしてみて。${SPIN_COST}P使う。`}
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
