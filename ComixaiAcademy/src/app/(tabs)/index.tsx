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
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import type { AvatarMotion } from '@/avatar/motions';
import { Icon, type IconName } from '@/components/icons';
import { Spotlight } from '@/components/spotlight';
import { useSparkBurst } from '@/components/motion';
import { Bubble, Button, Cassette, Panel, Pill, Row, Screen, ScreenHead } from '@/components/ui';
import { nextTitle } from '@/data/badges';
import { getAvatar } from '@/data/avatars';
import { COURSES } from '@/data/courses';
import { getRole } from '@/data/roles';
import { STAGE, STAGE_RATIO, STAGE_WALL } from '@/data/stage';
import { smallTalkFor } from '@/data/voice';
import { useProgress, useReview, useStats, useToday } from '@/store/progress';
import { useTutorial } from '@/store/tutorial';
import { C, F, FONT, R, S, T } from '@/theme';

/** アバターをつついたときに出る、どうでもいい雑談 */

/* アバターの見た目の縦横比（高さ ÷ 幅）。

   3Dカメラの縦画角は固定なので、**この置き場が縦に伸びたぶんだけ
   キャラも大きく描かれる**（同じ world 幅がより多い画素に載る）。
   背景の教室は「立った人の目の高さ」から描いてあるため、キャラの
   目線が地平線に届いていないと背の低い人に見える。0.92 では届かず、
   身長125cm相当に見えていたので縦に伸ばしてある。
   キャラの横幅は置き場の半分も無いので、縦に伸ばしても見切れない。 */
const AVATAR_RATIO = 1.1;

/* ▍かつてここに AVATAR_ZOOM（キャンバスを置き場より大きくして上へはみ出させる）
   があった。「小人に見える」への対処としては AVATAR_RATIO と同じ狙いで、
   **両方を掛けると1.3倍になって行き過ぎる**ので片方に寄せてある。
   はみ出させる方式をやめたのは、上へ伸びたキャラがフキダシに潜り込んで
   顔が隠れるため（Pressableはフキダシより後ろの兄弟なので上に描かれる）。
   置き場ごと縦に伸ばす AVATAR_RATIO なら、フキダシの居場所を奪わない。 */

export default function HomeScreen() {
  const router = useRouter();
  const { state } = useProgress();
  const stats = useStats();
  /* 期限が来ている復習の数。0なら何も出さない（→ app/review.tsx） */
  const due = useReview().due.length;
  /* 今日ぶんを終えているか。終えていたら、カセットの見た目を締める */
  const { doneToday } = useToday();
  /* 案内中はセリフをこちらのフキダシに出す。**先生が2か所で
     同時にしゃべらないため**（→ store/tutorial.tsx の voice） */
  const tutorial = useTutorial();
  const guiding = tutorial.active && tutorial.step?.voice === 'avatar';

  const avatarRef = React.useRef<AvatarHandle>(null);
  const avatar = getAvatar(state.avatarId);
  const role = getRole(state.roleId);

  /* ———— 背の低い画面 ————
     3Dカメラの縦画角は固定なので、**キャラの大きさはキャンバスの高さだけで
     決まる**（幅を広げても変わらない）。320x568 ではコマが248しか無く、
     フキダシを引くとアバターに154しか回らずキャラが小さく見えていた。
     ので、余白・カード・フキダシから高さを削ってアバターに回す。
     しきい値はiPhone SE(667)を含める値にしてある。

     ▍320x568 は割り切っている
     コマに対するキャラの高さは 320:49% / 375:63% / 390:63% / 430:63%。
     375以上は揃ったが、**320だけは届いていない**。あの画面はコマに
     248しか割けず、正しい大きさに必要な約270に構造的に足りないため
     （ヘッダー・タブバー・次のカードで画面の半分近くを使う）。
     直すなら「320のときだけ膝上の画角にする」くらいしか無く、
     そうすると足元が切れて床に立っている感が消える。
     iPhone SE初代・5s（iOS 15止まり）だけの話なので、**そのままにすると
     決めた**。ここの数値を触るときは、その判断ごと見直すこと。 */
  const short = useWindowDimensions().height < 700;

  /* コマの中身の高さ。狭い端末ではフキダシを詰めてアバターの取り分を増やす。
     しきい値はSE（コマの中身が約330）が入るように取ってある。ここを
     下回る端末でアバターを大きいままにすると、フキダシが上にはみ出て
     1行目が読めなくなる */
  const [area, setArea] = React.useState(0);
  const tight = short || (area > 0 && area < 380);

  /* アバターに回せる高さ。フキダシの実測値から引いて出す。

     割合（`88%` など）で決めると、フキダシが2行になった端末で
     合計が中身の高さを超え、**フキダシが上へ押し出されてキャラに
     かぶる**。セリフは長さが変わるので、割合では当てられない。
     測ってから引く。 */
  /* ▍いちばん高かったフキダシに合わせて、そこで止める
     もとは「いまのフキダシの高さ」から引いていたので、**セリフが1行
     増えるたびにキャラが縮んだ**。案内が終わった瞬間にも大きくなる。
     同じキャラの背丈が画面の中で変わるのは、それだけで違和感になる。

     出た高さの最大を覚えて下限にすると、1周した時点で動かなくなる
     （opening.tsx のコマの高さと同じ手）。決め打ちにしないのは、
     端末の幅でも文字サイズ設定でも変わるため */
  const [bubbleH, setBubbleH] = React.useState(0);
  const avatarMax = area > 0 && bubbleH > 0 ? Math.max(0, area - bubbleH - S.sm) : undefined;

  /* アバターを置ける実寸。onLayoutで測ってから3Dを描く。

     ▍寸法が落ち着くまで描き始めない
     Avatar3D は寸法が変わるとGLコンテキストを作り直す＝**1.9MBのGLBを
     読み直す**。起動時のレイアウトは一度で決まらず、書体が読み込まれた
     あとにフキダシが折り返し直すので、素直に繋ぐと寸法が2〜3回変わる。
     実測すると 320x568 と 375x667 でGLBを3回読んでいた（狭いほど
     フキダシの行数が変わりやすいぶん、遅い端末ほど余計に読む）。
     少し待って、変化が止まった寸法だけを渡す。 */
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const [settled, setSettled] = React.useState({ w: 0, h: 0 });
  React.useEffect(() => {
    const t = setTimeout(() => setSettled(box), 180);
    return () => clearTimeout(t);
  }, [box.w, box.h]);

  const stage = React.useMemo(() => {
    if (settled.w <= 0 || settled.h <= 0) return null;
    const w = Math.min(settled.w, settled.h / AVATAR_RATIO);
    return { w: Math.floor(w), h: Math.floor(w * AVATAR_RATIO) };
  }, [settled]);

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
    if (guiding) return tutorial.step?.say ?? '';
    if (talk) return talk;
    if (!next) return 'ぜんぶ終わったね。……よくやった。あとは現場で使って。';
    if (stats.doneCount === 0) return `${role?.name ?? ''}ね。なら、話が早い。まず1本やってみて。`;
    if (stats.streak >= 3) return `${stats.streak}日続いてるね。……その調子よ。`;
    return `次は「${next.lesson.title}」よ。`;
  }, [guiding, tutorial.step, talk, next, stats.doneCount, stats.streak, role?.name]);

  const burst = useSparkBurst();

  const poke = () => {
    /* 案内中はつつかせない。雑談で案内のセリフを上書きしてしまう */
    if (guiding) return;
    /* 小話は相棒ごと。書けていない相棒は先生のものが出る（data/voice.ts） */
    const talks = smallTalkFor(state.avatarId);
    const pick = talks[Math.floor(Math.random() * talks.length)];
    setTalk(pick.say);
    avatarRef.current?.play(pick.motion);
    if (pick.emote) avatarRef.current?.emote(pick.emote);
  };

  const upcoming = nextTitle(stats.badgeCount);

  /* ———— 称号の帯 ————
     この画面はキッカーを置かず、称号そのものを見出しにする（size="md"）。
     背の低い画面では帯も詰める。568の画面で85は取りすぎで、
     そのぶんがまるごとアバターの取り分から引かれていた */
  const header = (
    /* チュートリアルの1歩目で囲われる。帯そのものではなく中身を囲うと、
       ステータスバーぶんの余白まで黄色くならない。
       帯は画面の端まであるので、枠を8px内側に置いて**内から端へ**飛ばす
       （外へ飛ばすと画面の外に出て、輪の左右が切れる） */
    <Spotlight name="home-head" radius={R.sm} inset={8} room={8}>
    <ScreenHead
      compact={short}
      size="md"
      icon={<Icon name={stats.title.icon} size={21} color={C.paper0} />}
      title={stats.title.name}
      right={
        <Text style={{ fontFamily: FONT.mono, fontSize: 16, color: C.paper50 }}>
          {stats.badgeCount}
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300 }}>
            /{stats.badgeTotal}
          </Text>
        </Text>
      }
      progress={{ value: stats.badgeCount, total: stats.badgeTotal }}
      note={`${stats.streak}日連続 ・ ${stats.doneCount}/${stats.total}本 ・ ${stats.percent}%`}
      /* 「NEXT」は下のカセットの黄色いピルが持っているので、帯では使わない
         （同じ画面に別の意味のNEXTが2つ出る）。あと何個で上がるかを出す */
      noteRight={upcoming ? `あと${upcoming.need - stats.badgeCount}で ${upcoming.name}` : 'MAX'}
    />
    </Spotlight>
  );

  return (
    <Screen
      scroll={false}
      header={header}
      tone="dots"
      /* padding は styles.screenPad より後に効くので、ここで上書きできる */
      style={{ gap: short ? S.sm : S.md, padding: short ? S.sm : S.lg }}>
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
          <View
            onLayout={(e) => {
              const h = Math.ceil(e.nativeEvent.layout.height);
              setBubbleH((prev) => (h > prev ? h : prev));
            }}>
            <Bubble
              text={greeting}
              compact={tight}
              numberOfLines={tight ? 3 : undefined}
              style={{ marginRight: 3, marginLeft: 3 }}
            />
          </View>
          {/* アバターの置き場は縦横比で決める（flex:1 だと余った高さを全部
              取ってしまい、フキダシがキャラから離れる）。 */}
          <Pressable
            /* つついたところから星。沈めたりはしない（本人が動いて返事をする） */
            onPressIn={(e) => {
              if (guiding) return;
              const { pageX, pageY } = e.nativeEvent;
              if (pageX || pageY) burst(pageX, pageY, 1.4);
            }}
            onPress={poke}
            onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
            style={{
              width: '100%',
              aspectRatio: 1 / AVATAR_RATIO,
              maxHeight: avatarMax ?? (tight ? '74%' : '88%'),
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
        <Spotlight name="home-next">
        <Cassette compact={short}>
          {/* ▍今日ぶんが終わったら、そう言って締める
              終わりが無いと、いつやめていいのか分からない。
              **黄色いピルは「次にやること」の印**なので、今日ぶんを
              終えたら外す（外さないと、まだ残っているように見える） */}
          <Row gap={8}>
            {doneToday ? (
              <Icon name="check" size={16} color={T.ok} />
            ) : (
              <Pill label="NEXT" />
            )}
            <Icon name={next.course.icon} size={18} color={C.paper50} />
            <Text
              style={[F.strong, { fontSize: 14.5, flex: 1, color: C.paper50 }]}
              numberOfLines={1}>
              {doneToday ? '今日のぶんは終わり' : next.lesson.title}
            </Text>
          </Row>
          {/* ▍復習は、行を増やさずに横へ足す
              ホームは1画面に収める作りなので、カセットに行を足すと
              そのぶんアバターが縮む。**同じ行に並べる**なら高さは変わらない */}
          <Row gap={S.sm}>
            <View style={{ flex: 1 }}>
              <Button
                label={
                  doneToday
                    ? `もう1本やる（${next.lesson.minutes}分）`
                    : due > 0
                      ? `はじめる（${next.lesson.minutes}分）`
                      : `はじめる（${next.lesson.minutes}分・クイズ${next.lesson.quiz.length}問）`
                }
                variant={doneToday ? 'secondary' : 'primary'}
                size="sm"
                onPress={() => router.push(`/lesson/${next.lesson.id}`)}
              />
            </View>
            {due > 0 ? (
              <Button
                label={`復習 ${due}`}
                variant="yellow"
                size="sm"
                onPress={() => router.push('/review')}
              />
            ) : null}
          </Row>
        </Cassette>
        </Spotlight>
      ) : (
        <Panel contentStyle={{ padding: S.md, gap: S.sm }}>
          <Text style={F.h2}>全課程、修了</Text>
          <Text style={F.small}>やり直したいレッスンは「まなぶ」から開けます。</Text>
          {/* 締めは何度でも見られるようにしておく。
              1回しか見られない画面は、撮ることもできない */}
          <Row gap={S.sm}>
            <View style={{ flex: 1 }}>
              <Button label="修了の記録" size="sm" onPress={() => router.push('/ending')} />
            </View>
            {due > 0 ? (
              <Button
                label={`復習 ${due}`}
                variant="yellow"
                size="sm"
                onPress={() => router.push('/review')}
              />
            ) : null}
          </Row>
        </Panel>
      )}
    </Screen>
  );
}
