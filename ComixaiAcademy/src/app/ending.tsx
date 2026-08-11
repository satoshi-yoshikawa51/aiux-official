/* ============================================================
   エンディング。全17本を終えた人にだけ出る締め。

   ▍なぜ要るのか
   入口には14コマの絵巻（`opening.tsx`）があるのに、**出口には
   「全課程、修了」という小さなパネルしか無かった**。同じ日に
   アンインストールされる作りになっていた。

   ▍出すのは「あなたが何をしたか」
   ここで新しい話はしない。**通した本数・★・ノーミス・かかった日数**を
   並べる。称号の演出（rank-up.tsx）と違って、こちらは静かに読ませる画面。

   ▍終わりにしない
   全部終わっても、復習と★3集めは残っている。「これで終わり」ではなく
   「ここから先は現場で」と言って、持ち帰りに渡す。

   ▍もう一度見られる
   ホームの「全課程、修了」から入れる。1回しか見られない締めは、
   スクリーンショットも撮れない。
   ============================================================ */
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { SlideIn, Stamp, useSparkBurst } from '@/components/motion';
import { Badge, Bubble, Button, Panel, Row, Screen, ScreenHead } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { ALL_LESSONS, SCORED_GAME_KEYS } from '@/data/courses';
import { GACHA_POOL } from '@/data/gacha';
import { getRole } from '@/data/roles';
import { ENDING_VOICE, say as voice } from '@/data/voice';
import { playSound } from '@/lib/sound';
import { useProgress, useStats } from '@/store/progress';
import { C, F, FONT, POP, S, T } from '@/theme';

export default function EndingScreen() {
  const router = useRouter();
  const { state } = useProgress();
  const stats = useStats();
  const avatar = getAvatar(state.avatarId, state.skinId);
  const role = getRole(state.roleId);
  const avatarRef = React.useRef<AvatarHandle>(null);
  const { width, height } = useWindowDimensions();
  const burst = useSparkBurst();
  const stageW = Math.min(width * 0.44, 190);

  const star3 = SCORED_GAME_KEYS.filter((id) => (state.games[id]?.stars ?? 0) >= 3).length;
  const perfect = Object.keys(state.perfect).length;
  const graduated = Object.values(state.quiz).filter((r) => r.due === 0).length;
  /* かかった日数＝学習した日の数。連続でなくてよい */
  const days = state.days.length;

  React.useEffect(() => {
    playSound('rankup');
    avatarRef.current?.play('bow');
    const ids = [400, 900, 1400].map((ms) =>
      setTimeout(() => burst(width / 2, height * 0.3, 2.4), ms),
    );
    return () => ids.forEach(clearTimeout);
  }, [burst, width, height]);

  const stat = (icon: React.ComponentProps<typeof Icon>['name'], label: string, value: string) => (
    <Row gap={8} style={{ paddingVertical: 5 }}>
      <Icon name={icon} size={16} color={T.accent} />
      <Text style={[F.small, { flex: 1 }]}>{label}</Text>
      <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: T.text }}>{value}</Text>
    </Row>
  );

  return (
    <Screen
      tone="dots"
      header={<ScreenHead kicker="ENDING" title="全課程、修了" size="md" note={`${role?.name ?? ''}のあなたへ`} />}>
      <Stamp tilt={-3}>
        <Panel tilt={1} contentStyle={{ alignItems: 'center', gap: S.sm, paddingVertical: S.lg }}>
          <Icon name="crown" size={34} color={T.accent} />
          <Text style={{ fontFamily: FONT.display, fontSize: 26, lineHeight: 36, color: T.text }}>
            {stats.title.name}
          </Text>
          <Badge tone="ink">
            バッジ {stats.badgeCount} / {stats.badgeTotal}
          </Badge>
        </Panel>
      </Stamp>

      <SlideIn from="bottom" distance={18} delay={200}>
        <Row gap={S.sm} style={{ alignItems: 'flex-end' }}>
          <Avatar3D
            ref={avatarRef}
            avatar={avatar}
            width={stageW}
            height={Math.round(stageW * 1.25)}
          />
          <View style={{ flex: 1, paddingBottom: S.lg }}>
            <Bubble text={voice(ENDING_VOICE.close, state.avatarId)} tail="left" style={{ marginRight: POP.sm }} />
          </View>
        </Row>
      </SlideIn>

      <SlideIn from="bottom" distance={18} delay={380}>
        <Panel contentStyle={{ padding: S.md, gap: 2 }}>
          <Text style={F.kicker}>あなたがやったこと</Text>
          {stat('learn', '通したレッスン', `${ALL_LESSONS.length} 本`)}
          {stat('perfect', 'ノーミス修了', `${perfect} 本`)}
          {stat('star', '★3を取ったゲーム', `${star3} / ${SCORED_GAME_KEYS.length}`)}
          {stat('rotate', '復習で直した問題', `${graduated} 問`)}
          {stat('calendar', '学習した日', `${days} 日`)}
        </Panel>
      </SlideIn>

      {/* ▍終わりにしない（実機で「終わり感を出すな」の指摘）
          修了はゴールではなく折り返し。**ここで消すアプリではない**と
          伝えるために、①コンプリートへの導線 ②追加コンテンツの予告
          ③持ち帰り、の順で「まだやることがある」を積む */}
      <CompleteList
        star3={star3}
        perfect={perfect}
        badgeCount={stats.badgeCount}
        badgeTotal={stats.badgeTotal}
        collected={Object.keys(state.themes).length + Object.keys(state.skins).length}
        collectTotal={GACHA_POOL.length}
        onBadges={() => router.push('/badges')}
        onGacha={() => router.push('/gacha')}
      />

      <SlideIn from="bottom" distance={18} delay={640}>
        <Panel contentStyle={{ padding: S.md, gap: S.sm }}>
          <Row gap={8}>
            <Icon name="rocket" size={18} color={T.accent} />
            <Text style={F.h2}>つづきを準備中</Text>
          </Row>
          <Text style={F.small}>
            新しい章、新しい相棒のアバター、新しい舞台——このアプリはこれからも増えます。
            ログインボーナスでガチャPを貯めながら、待っていてください。
            間違えた問題の復習も、日をおいて戻ってきます。
          </Text>
        </Panel>
      </SlideIn>

      <SlideIn from="bottom" distance={18} delay={760}>
        <Panel contentStyle={{ padding: S.md, gap: S.sm }}>
          <Text style={F.h2}>ここから先は、現場で</Text>
          <Text style={F.small}>
            覚えたことは、使わないと落ちます。あなたの職種向けに集めた一言とプロンプトを
            持ち帰って、仕事で使う場所に貼っておいてください。
          </Text>
          <Button label="持ち帰りをひらく" size="sm" onPress={() => router.push('/sheet')} />
        </Panel>
      </SlideIn>

      <Button label="ホームにもどる" variant="secondary" onPress={() => router.replace('/')} />
    </Screen>
  );
}

/* ▍コンプリートへの導線
   全レッスン修了は「本編クリア」であって、集めるものはまだ残っている。
   残りを数字で見せて、やり込みの口（バッジ・ガチャ）へつなぐ。
   全部埋まっている人にだけ「完全コンプリート」を出す */
function CompleteList({
  star3,
  perfect,
  badgeCount,
  badgeTotal,
  collected,
  collectTotal,
  onBadges,
  onGacha,
}: {
  star3: number;
  perfect: number;
  badgeCount: number;
  badgeTotal: number;
  collected: number;
  collectTotal: number;
  onBadges: () => void;
  onGacha: () => void;
}) {
  const rows: { icon: React.ComponentProps<typeof Icon>['name']; text: string }[] = [];
  if (star3 < SCORED_GAME_KEYS.length)
    rows.push({ icon: 'star', text: `ゲームの★3　あと ${SCORED_GAME_KEYS.length - star3} 本` });
  if (perfect < ALL_LESSONS.length)
    rows.push({ icon: 'perfect', text: `ノーミス修了　あと ${ALL_LESSONS.length - perfect} 本` });
  if (badgeCount < badgeTotal)
    rows.push({ icon: 'badges', text: `バッジ　あと ${badgeTotal - badgeCount} 個` });
  if (collected < collectTotal)
    rows.push({ icon: 'egg', text: `ガチャのコレクション　あと ${collectTotal - collected} 個` });

  return (
    <SlideIn from="bottom" distance={18} delay={520}>
      <Panel contentStyle={{ padding: S.md, gap: S.sm }}>
        {rows.length ? (
          <>
            <Row gap={8}>
              <Icon name="target" size={18} color={T.accent} />
              <Text style={F.h2}>コンプリートまで</Text>
            </Row>
            <View style={{ gap: 4 }}>
              {rows.map((r) => (
                <Row key={r.text} gap={8} style={{ paddingVertical: 3 }}>
                  <Icon name={r.icon} size={15} color={T.accent} />
                  <Text style={F.small}>{r.text}</Text>
                </Row>
              ))}
            </View>
            <Row gap={S.sm}>
              <Button label="バッジをみる" size="sm" variant="secondary" style={{ flex: 1 }} onPress={onBadges} />
              <Button label="ガチャへ" size="sm" variant="secondary" style={{ flex: 1 }} onPress={onGacha} />
            </Row>
          </>
        ) : (
          <Row gap={8}>
            <Icon name="crown" size={18} color={T.accent} />
            <Text style={F.h2}>完全コンプリート。すごい。</Text>
          </Row>
        )}
      </Panel>
    </SlideIn>
  );
}
