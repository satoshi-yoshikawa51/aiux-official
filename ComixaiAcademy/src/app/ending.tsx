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
import { getRole } from '@/data/roles';
import { ENDING_VOICE, say as voice } from '@/data/voice';
import { playSound } from '@/lib/sound';
import { useProgress, useStats } from '@/store/progress';
import { C, F, FONT, POP, S, T } from '@/theme';

export default function EndingScreen() {
  const router = useRouter();
  const { state } = useProgress();
  const stats = useStats();
  const avatar = getAvatar(state.avatarId);
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

      {/* ▍終わりにしない
          全部終わっても、復習と★3集めは残っている。
          「ここから先は現場で」と言って、持ち帰りに渡す */}
      <SlideIn from="bottom" distance={18} delay={520}>
        <Panel contentStyle={{ padding: S.md, gap: S.sm }}>
          <Text style={F.h2}>ここから先は、現場で</Text>
          <Text style={F.small}>
            覚えたことは、使わないと落ちます。あなたの職種向けに集めた一言とプロンプトを
            持ち帰って、仕事で使う場所に貼っておいてください。
          </Text>
          <Button label="持ち帰りをひらく" size="sm" onPress={() => router.push('/sheet')} />
        </Panel>
      </SlideIn>

      {star3 < SCORED_GAME_KEYS.length || graduated > 0 ? (
        <SlideIn from="bottom" distance={18} delay={640}>
          <Panel contentStyle={{ padding: S.md, gap: 6 }}>
            <Text style={[F.small, { color: C.ink500 }]}>まだ残っているもの</Text>
            {star3 < SCORED_GAME_KEYS.length ? (
              <Text style={F.small}>
                ★3があと {SCORED_GAME_KEYS.length - star3} 本
              </Text>
            ) : null}
            <Text style={F.small}>間違えた問題の復習は、日をおいて戻ってきます</Text>
          </Panel>
        </SlideIn>
      ) : null}

      <Button label="ホームにもどる" variant="secondary" onPress={() => router.replace('/')} />
    </Screen>
  );
}
