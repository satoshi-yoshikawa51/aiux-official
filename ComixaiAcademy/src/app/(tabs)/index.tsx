/* ============================================================
   ホーム。選んだアバターが常駐して、次にやることを言ってくる画面。

   ここだけはスクロールさせない（1画面に収める）。そのため
   ・上の帯（称号・バッジ・統計）と下のカード（次のレッスン）は高さ固定
   ・アバターのコマが残りの高さを全部もらう（Panel の fill）
   ・フキダシはコマの中に置く
   アバターの3D表示には具体的な数値が要るので、コマの中身を onLayout で
   実測してから描く（端末の画面サイズに関係なく収まる）。
   ============================================================ */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import type { AvatarMotion } from '@/avatar/motions';
import { Icon, type IconName } from '@/components/icons';
import { Bubble, Button, Panel, Progress, Row, Screen } from '@/components/ui';
import { nextTitle } from '@/data/badges';
import { getAvatar } from '@/data/avatars';
import { COURSES } from '@/data/courses';
import { getRole } from '@/data/roles';
import { STAGE, STAGE_RATIO, STAGE_WALL } from '@/data/stage';
import { useProgress, useStats } from '@/store/progress';
import { BW, C, F, FONT, R, S, T } from '@/theme';

/** アバターをつついたときに出る、どうでもいい雑談 */
const SMALL_TALK: { say: string; motion: AvatarMotion; emote?: IconName }[] = [
  { say: '……なんだ。用が無いなら、手を動かせ。', motion: 'arms-crossed' },
  { say: '休憩か。まあ、詰め込みすぎても入らないからな。', motion: 'idle-b' },
  { say: '1日1本で十分だ。続けるほうが難しい。', motion: 'explain' },
  { say: 'わからんところは、飛ばしていい。あとで戻れ。', motion: 'wave' },
  { say: '……そんなに見るな。', motion: 'worried', emote: 'bang' },
  { say: 'よし、いい顔になってきた。', motion: 'laugh', emote: 'sparkle' },
];

/** アバターの見た目の縦横比（高さ ÷ 幅） */
const AVATAR_RATIO = 0.92;

/* ホームだけアバターを大きく描く。
   3Dのカメラ（src/data/avatars.ts の STANDING）は全身に余白を取った画角で、
   選択画面と共用なので触らない。代わりにキャンバスを置き場より大きくして、
   足元を揃えたまま上へはみ出させる（コマが overflow:'hidden' で切る）。

   1.0 のままだと、背景の部屋の窓や床とくらべてキャラが小さく見える
   （＝小人に見える）。実測した地平線はキャラの顎を通っており、本来は
   目の高さに来るべきなので、そのぶん持ち上げている */
const AVATAR_ZOOM = 1.18;

export default function HomeScreen() {
  const router = useRouter();
  const { state } = useProgress();
  const stats = useStats();

  const avatarRef = React.useRef<AvatarHandle>(null);
  const avatar = getAvatar(state.avatarId);
  const role = getRole(state.roleId);

  /* コマの中身の高さ。狭い端末ではフキダシを詰めてアバターの取り分を増やす */
  const [area, setArea] = React.useState(0);
  const tight = area > 0 && area < 300;

  /* アバターを置ける実寸。onLayoutで測ってから3Dを描く */
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const stage = React.useMemo(() => {
    if (box.w <= 0 || box.h <= 0) return null;
    const w = Math.min(box.w, box.h / AVATAR_RATIO) * AVATAR_ZOOM;
    return { w: Math.floor(w), h: Math.floor(w * AVATAR_RATIO) };
  }, [box]);

  const next = React.useMemo(() => {
    for (const course of COURSES) {
      for (const lesson of course.lessons) {
        if (!state.done[lesson.id]) return { course, lesson };
      }
    }
    return null;
  }, [state.done]);

  const [talk, setTalk] = React.useState<string | null>(null);

  const greeting = React.useMemo(() => {
    if (talk) return talk;
    if (!next) return 'ぜんぶ終わったな。……よくやった。あとは現場で使え。';
    if (stats.doneCount === 0) return `${role?.name ?? ''}か。なら、話が早い。まず1本やってみろ。`;
    if (stats.streak >= 3) return `${stats.streak}日続いてるな。……その調子だ。`;
    return `次は「${next.lesson.title}」だ。`;
  }, [talk, next, stats.doneCount, stats.streak, role?.name]);

  const poke = () => {
    const pick = SMALL_TALK[Math.floor(Math.random() * SMALL_TALK.length)];
    setTalk(pick.say);
    avatarRef.current?.play(pick.motion);
    if (pick.emote) avatarRef.current?.emote(pick.emote);
  };

  const upcoming = nextTitle(stats.badgeCount);

  /* ———— 称号の帯 ————
     画面の端まで届く黒ベタ。枠もベタ影も付けない。
     下のタブバーと同じ黒で挟むことで、あいだが「紙」として立つ */
  const header = (
    <View style={{ paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.md, gap: 6 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={6} style={{ flex: 1 }}>
          <Icon name={stats.title.icon} size={21} color={C.paper0} />
          <Text style={[F.h2, { color: C.paper50 }]} numberOfLines={1}>
            {stats.title.name}
          </Text>
        </Row>
        <Text style={{ fontFamily: FONT.mono, fontSize: 16, color: C.paper50 }}>
          {stats.badgeCount}
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300 }}>
            /{stats.badgeTotal}
          </Text>
        </Text>
      </Row>
      <Progress value={stats.badgeCount} total={stats.badgeTotal} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.ink300, letterSpacing: 0.6 }}>
          {stats.streak}日連続 ・ {stats.doneCount}/{stats.total}本 ・ {stats.percent}%
        </Text>
        {/* 「NEXT」は下のカードの黄色いピルが持っているので、こちらは使わない
            （同じ画面に別の意味のNEXTが2つ出る）。あと何個で上がるかを出す */}
        <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.red100, letterSpacing: 0.6 }}>
          {upcoming ? `あと${upcoming.need - stats.badgeCount}で ${upcoming.name}` : 'MAX'}
        </Text>
      </Row>
    </View>
  );

  return (
    <Screen scroll={false} header={header} tone="dots" style={{ gap: S.md }}>
      {/* ———— アバターのコマ（残りの高さを全部使う） ————
           名前と職種はコマのキャプション（右下に絶対配置）に逃がして、
           アバターに使える高さを削らないようにしている。
           地は網点ではなく舞台の絵（→ src/data/stage.ts） */}
      <Panel
        fill
        bg={STAGE}
        bgRatio={STAGE_RATIO}
        bgColor={STAGE_WALL}
        caption={role ? `${avatar.name}・${role.name}` : avatar.name}
        contentStyle={{ padding: S.sm, gap: S.sm }}>
        {/* コマの中身の高さを先に測る。この高さはフキダシの大小に左右されないので、
            「狭ければフキダシを詰める」判定を安定して行える。
            フキダシとアバターは**下に寄せる**。上に寄せると尻尾が床を指してしまい、
            誰がしゃべっているのか分からなくなる */}
        <View
          style={{ flex: 1, justifyContent: 'flex-end', gap: S.sm }}
          onLayout={(e) => setArea(e.nativeEvent.layout.height)}>
          <Bubble
            text={greeting}
            compact={tight}
            numberOfLines={tight ? 3 : undefined}
            style={{ marginRight: 3, marginLeft: 3 }}
          />
          {/* アバターの置き場は縦横比で決める（flex:1 だと余った高さを全部
              取ってしまい、フキダシがキャラから離れる）。狭い端末では
              maxHeight が効いて、そのぶん小さく描かれる */}
          <Pressable
            onPress={poke}
            onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
            style={{
              width: '100%',
              aspectRatio: 1 / AVATAR_RATIO,
              maxHeight: '76%',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
            {stage ? (
              <Avatar3D ref={avatarRef} avatar={avatar} width={stage.w} height={stage.h} />
            ) : null}
          </Pressable>
        </View>
      </Panel>

      {/* ———— 次にやること ————
           地をほぼ黒に沈めて、白い網点を薄く敷く。黄と赤がいちばん強く
           出るのはこの上。コマ番号（左上の黒い角）はやめて、行の頭に
           黄色いピルを置く（角に重ねるとコースのアイコンとぶつかる） */}
      {next ? (
        <Panel surface={C.ink800} tone="dots-light" contentStyle={{ padding: S.md, gap: S.sm }}>
          <Row gap={8}>
            <View
              style={{
                backgroundColor: C.yellow400,
                borderWidth: BW.bold,
                borderColor: T.border,
                borderRadius: R.full,
                paddingHorizontal: 9,
                paddingVertical: 2,
              }}>
              <Text
                style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 1, color: C.ink900 }}>
                NEXT
              </Text>
            </View>
            <Icon name={next.course.icon} size={18} color={C.paper50} />
            <Text
              style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]}
              numberOfLines={1}>
              {next.lesson.title}
            </Text>
          </Row>
          <Button
            label={`はじめる（${next.lesson.minutes}分・クイズ${next.lesson.quiz.length}問）`}
            size="sm"
            onPress={() => router.push(`/lesson/${next.lesson.id}`)}
          />
        </Panel>
      ) : (
        <Panel contentStyle={{ padding: S.md, gap: S.xs }}>
          <Text style={F.h2}>全課程、修了</Text>
          <Text style={F.small}>やり直したいレッスンは「まなぶ」から開ける。</Text>
        </Panel>
      )}
    </Screen>
  );
}
