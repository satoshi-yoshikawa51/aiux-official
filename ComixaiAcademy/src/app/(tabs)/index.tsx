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
import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import type { AvatarMotion } from '@/avatar/motions';
import { Icon, type IconName } from '@/components/icons';
import { Ring, Spotlight } from '@/components/spotlight';
import { PopIn, useSparkBurst } from '@/components/motion';
import { StageEffect, StageGlow } from '@/components/stage-effect';
import { gachaCoachSay, useGachaCoach, useGachaCoachGift } from '@/components/gacha-coach';
import { Bubble, Button, Cassette, Panel, Pill, Row, Screen, ScreenHead, Tap } from '@/components/ui';
import { nextTitle } from '@/data/badges';
import { getAvatar } from '@/data/avatars';
import { COURSES } from '@/data/courses';
import { DEFAULT_HORIZON, getTheme, SPIN_COST } from '@/data/gacha';
import { getRole } from '@/data/roles';
import { CLASSROOM } from '@/data/stage';
import { HOME_VOICE, say, smallTalkFor } from '@/data/voice';
import { playSound } from '@/lib/sound';
import { useProgress, useReview, useStats, useToday } from '@/store/progress';
import { stepSay, useTutorial } from '@/store/tutorial';
import { C, F, FONT, R, S, T } from '@/theme';

/** アバターをつついたときに出る、どうでもいい雑談 */

/* ============================================================
   ▍キャラの大きさは「置き場の高さ」だけで決まる

   3Dカメラの縦画角は固定なので、キャラの画素の高さ＝置き場の高さ×一定。
   実測すると**キャラは置き場の92%を使っていて、頭上の余白は3%**しかない。
   つまり「小さく見える」は3D側の問題ではなく、**置き場に高さを
   渡せていない**のが原因だった。渡せていなかった理由は2つ：

   1. 置き場に 1:1.1 の縦横比を課していた。幅100%＝377pxの端末では
      高さが 415px で頭打ちになり、余った高さを捨てていた
   2. フキダシの確保が過大だった（下の「▍基準を取り直す」）。
      実測で90px＝コマの15%が、誰も使わないまま空いていた

   どちらもやめて、**フキダシの残り全部を置き場に渡す**。
   キャラの横幅は高さの3割ほどなので、置き場が横長になっても見切れない。
   ============================================================ */

/* ———— 床の隅に立つガチャ台 ————
   ガチャ画面と**同じ絵**を使う（→ app/gacha.tsx の MACHINE）。
   別の絵にすると、押した先で違うものが出てきて繋がらない。
   絵の縦横比は 966/640。 */
const GACHA_MACHINE = require('@/assets/images/gacha-machine.png');
const MACHINE_W = 36;
const MACHINE_H = Math.round(MACHINE_W * (966 / 640));
/** 取り出し口に置くカプセルの直径（絵の幅に対する割合は gacha.tsx と同じ0.187） */
const CAP = Math.round(MACHINE_W * 0.187) + 1;

export default function HomeScreen() {
  const router = useRouter();
  const { state, ready, claimLoginBonus } = useProgress();
  const stats = useStats();
  /* 装備中の舞台テーマ（ガチャの景品）。教室に色と飾りを重ねる */
  const theme = getTheme(state.themeId);
  /** いまガチャを1回まわせるか。床のガチャ台の見た目がこれで変わる */
  const canSpin = state.coins >= SPIN_COST;

  /* ▍ログインボーナス
     1日1回、ホームを開いたら +3P（＝ガチャ1回ぶん）。受け取れたときだけ小さく知らせる
     （毎回音や演出を出すと、開くたびにうるさい） */
  const [bonusShown, setBonusShown] = React.useState(false);
  React.useEffect(() => {
    if (!ready) return;
    if (claimLoginBonus()) {
      setBonusShown(true);
      playSound('pick');
      const t = setTimeout(() => setBonusShown(false), 2800);
      return () => clearTimeout(t);
    }
  }, [ready, claimLoginBonus]);
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
  /* いま測れている高さ。基準を取り直すときに使う */
  const bubbleRaw = React.useRef(0);
  const rebased = React.useRef(false);

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

  /* ▍基準を取り直す（起動時に一度だけ）
     書体が読み込まれる前は、同じセリフが余計に折り返して背が高くなる。
     それを「いちばん高かったフキダシ」として覚えてしまうと、**その
     ぶんの高さが最後まで空いたまま**になる（実測で90px＝コマの15%）。
     寸法が落ち着いた（settled が出た）時点で、測り直して基準にする。
     以降は素直に最大値を覚える——セリフの伸び縮みでキャラを動かさない */
  React.useEffect(() => {
    if (rebased.current || settled.w <= 0) return;
    rebased.current = true;
    setBubbleH(bubbleRaw.current);
  }, [settled.w]);

  /* ———— 舞台の大きさ ————
     絵は**コマを覆いきる最小の大きさ**で敷く（下端・中央ぞろえ）。

     ▍背景側では縮尺を詰められない
     小さくするとコマの上に絵が届かず、壁色のベタ帯が出る（実測で82px）。
     大きくする方向は効くが、中庭の絵で計算すると2.4倍要って、そこまで
     寄せるとベンチも木も空も画面から消えた。**縮尺はキャラ側で合わせる**
     （↓のキャンバスの高さ）。 */
  /* 絵はテーマごと。まだ描けていないテーマは素の教室に色を重ねる */
  const art = theme.art ?? CLASSROOM;

  const bgHeight = React.useMemo(() => {
    if (box.w <= 0 || area <= 0) return undefined;
    const panelW = box.w + S.sm * 2;
    const panelH = area + S.sm * 2;
    return Math.ceil(Math.max(panelH, panelW / art.ratio));
  }, [box.w, area, art.ratio]);

  /* ———— キャンバスの高さ＝キャラの大きさ ————
     縦横比は課さない（→ 冒頭のメモ）。高さだけ、絵の地平線に合わせる。

     ▍目線を地平線に乗せる
     地平線はカメラの高さにあるので、そこに立つ人の目線は必ず地平線と
     重なる。ズレたぶんが「巨人」「小人」として出る。実測した比率は
     ・キャラはキャンバスの92%、頭上の余白3.1%
     ・目線は足元から身長の90%
     ここから、目線はキャンバスの上から12.3%＝**下端から87.7%**。
     キャンバスは下端ぞろえなので、地平線の高さ（コマ下端から測った
     ピクセル）を 0.877 で割れば、必要なキャンバスの高さが出る。

     地平線を持たない絵（素の教室）は今までどおりコマいっぱい。 */
  const stage = React.useMemo(() => {
    if (settled.w <= 0 || !bgHeight || area <= 0) return null;
    /* **置き場の高さ（box.h）は見ない。** フキダシをキャラの上に寄せると
       置き場が縮むので、そこを見ていると縮み合いになる。
       コマの中身の高さ（area）からフキダシの実測ぶんを引いた残りを上限にする。

       ▍area だけを上限にしてはいけない
       前はそうしていて、SEの案内中に壊れた。案内バーのぶんコマが縮むと
       地平線由来の高さがコマの中身を超え、キャンバスがコマいっぱいまで
       伸びる＝フキダシの取り分がゼロになる。フキダシは上へはみ出して
       パネルに刈られ、**セリフの1行目から読めなくなる**（実機SEで指摘）。
       bubbleH は「いちばん高かったフキダシ」で固定される値なので、
       ここから引いても縮み合いにはならない */
    const horizonFromBottom = bgHeight * (1 - (art.horizon ?? DEFAULT_HORIZON));
    const room = Math.floor(area) - (bubbleH > 0 ? bubbleH + S.sm : 0);
    return {
      w: Math.floor(settled.w),
      /* 極端に狭い端末で引きすぎても、キャラを消さない下限だけ守る */
      h: Math.max(Math.min(Math.round(horizonFromBottom / 0.877), room), 96),
    };
  }, [settled.w, area, art.horizon, bgHeight, bubbleH]);


  const next = React.useMemo(() => {
    for (const course of COURSES) {
      for (const lesson of course.lessons) {
        if (!state.done[lesson.id]) return { course, lesson };
      }
    }
    return null;
  }, [state.done]);

  const [talk, setTalk] = React.useState<string | null>(null);

  /* ▍相棒を替えたら、前の相棒の小話は捨てる
     つついて出た小話は、次につつくまで残る作りにしてある（読む時間が
     要るので）。**そこへ相棒を替えて戻ってくると、新しい相棒の顔で
     前の相棒のセリフが出たままになる**（実機で指摘）。
     ホームのタブは出しっぱなしなので、画面を作り直しても消えない。 */
  React.useEffect(() => {
    setTalk(null);
  }, [state.avatarId]);

  /* ▍ガチャの案内（1本目を終えた人に1回だけ）
     最初の案内には入れない——**まわすPも、飾る場所を見た経験も無い**
     うちに見せても意味が通らない（→ components/gacha-coach.tsx）。
     案内が始まった時点で3Pを渡すので、下の入口のPの数字がその場で増える */
  const gachaCoach = useGachaCoach();
  useGachaCoachGift();

  const greeting = React.useMemo(() => {
    /* ▍案内のセリフも、必ず stepSay を通す
       `step.say` は**共通（先輩の口調）**。相棒別の書き分けは sayByAvatar に
       あるので、生で出すと選んだ相手と別人がしゃべることになる。

       案内6歩のうち voice:'avatar' の3歩（①②⑥）だけがこのフキダシに出て、
       残りは案内パネル（components/tutorial-overlay.tsx）に出る。**出口が
       2つある**ので、片方だけ直すと3歩ぶんが共通のまま残る——実際そうなっていた。 */
    if (guiding) return tutorial.step ? stepSay(tutorial.step, state.avatarId) : '';
    /* つついたら小話が勝つ。**同じ催促を延々と読まされない**ための逃げ道
       （ガチャに行かない人には、行くまで案内が出続けるので） */
    if (talk) return talk;
    if (gachaCoach.onHome) return gachaCoachSay(state.avatarId);
    /* ▍終わっても「終わり」と言わない
       ここで話を締めるとアプリを消される（実機フィードバック）。
       次があることだけ、ひと言そえておく */
    if (!next) return say(HOME_VOICE.allDone, state.avatarId);
    if (stats.doneCount === 0) return say(HOME_VOICE.start(role?.name ?? ''), state.avatarId);
    if (stats.streak >= 3) return say(HOME_VOICE.streak(stats.streak), state.avatarId);
    return say(HOME_VOICE.next(next.lesson.title), state.avatarId);
  }, [
    guiding,
    tutorial.step,
    state.avatarId,
    talk,
    gachaCoach.onHome,
    next,
    stats.doneCount,
    stats.streak,
    role?.name,
  ]);

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
        bg={art.src}
        bgRatio={art.ratio}
        bgColor={art.wall}
        bgHeight={bgHeight}
        caption={role ? `${avatar.name}・${role.name}` : avatar.name}
        contentStyle={{ padding: S.sm, gap: S.sm }}>
        {/* ———— 舞台テーマ（ガチャの景品） ————
             教室の写真に色を重ね、雨や星の飾りを散らす。触れない層 */}
        {theme.tint !== 'transparent' ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: theme.tint,
            }}
          />
        ) : null}
        {theme.effect ? <StageEffect effect={theme.effect} /> : null}
        {theme.glow ? <StageGlow glow={theme.glow} /> : null}

        {/* ▍ガチャの入口は舞台の**左下**に置く
             右上はフキダシの居場所。アバターの取り分を増やしてから
             フキダシがコマの上端まで来たので、そこに重なると読めない。
             右下はキャプション（名前・職種）が使っているので、左下へ。
             床の隅なのでキャラにもかからない */}
        {/* ▍案内中は、この入口そのものを光らせる
             説明のカードを別に置くと、**本物の入口を一度も触らないまま**
             話だけ聞くことになる。押してほしい当のものを光らせる。
             輪はコマの overflow:'hidden' に切られるので、隅では余地を狭める。
             **チップの左と下はコマの内側6pxしか空いていない**ので、芯を2px
             外に出して、輪はそこから4pxまで。合わせて6px＝切られる寸前で止める
             （切れた輪は光ではなく「壊れた枠」に見える → components/spotlight.tsx）。
             丸いチップなので radius も丸に合わせる */}
        <Ring
          on={gachaCoach.onHome}
          radius={R.sm}
          inset={-2}
          room={4}
          /* ▍左は12・下は6。**左右で寄せ方が違う**
             下は床の隅なので詰めてよいが、左を6にすると台がコマの縁に
             貼りついて、置いてあるというより貼ってあるように見えた */
          style={{ position: 'absolute', bottom: 6, left: 12, zIndex: 5 }}>
          <Tap onPress={() => router.push('/gacha')} sound="pick">
            <View style={{ alignItems: 'center', gap: 3 }}>
              {/* ▍アイコンではなく、**ガチャ台そのもの**を置く
                   もとは卵のアイコンと「0P」だけのチップだった。Pが何の
                   ポイントなのかも、押すと何が起きるのかも読み取れない
                   （実機で「ガチャがわかりにくい」の指摘）。ガチャの画面に
                   出てくるあの台を、床の隅に小さく立たせる。**同じ絵が
                   同じ意味で2か所に出る**ので、説明がいらない */}
              <View style={{ width: MACHINE_W, height: MACHINE_H }}>
                <Image
                  source={GACHA_MACHINE}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
                {/* ▍まわせるときは、取り出し口にカプセルを1つ置く
                     「出てくるものが待っている」を絵で言う。文字を足すより
                     静かで、絵の一部として収まる。位置と大きさは
                     app/gacha.tsx の MACHINE.chuteAt と同じ割合 */}
                {canSpin ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: MACHINE_W * 0.4664 - CAP / 2,
                      top: MACHINE_H * 0.893 - CAP / 2,
                      width: CAP,
                      height: CAP,
                      borderRadius: CAP / 2,
                      backgroundColor: C.yellow400,
                      borderWidth: 1,
                      borderColor: C.ink900,
                    }}
                  />
                ) : null}
              </View>
              {/* Pの数は残す（あと何回まわせるかの手がかり）。
                  まわせるときだけ黄色に反転させて、**数字そのものを合図にする** */}
              <View
                style={{
                  backgroundColor: canSpin ? C.yellow400 : C.ink900,
                  borderRadius: R.full,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}>
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    color: canSpin ? C.ink900 : C.paper50,
                  }}>
                  {state.coins}P
                </Text>
              </View>
            </View>
          </Tap>
        </Ring>
        {/* ログインボーナスの受け取り。ひと呼吸で消える。
            **ガチャ台の高さぶん上に逃がす**（台が54＋すきま3＋Pの札17＝74）。
            前は卵のチップ1つぶん(38)で足りていた */}
        {bonusShown ? (
          <PopIn style={{ position: 'absolute', bottom: 84, left: 12, zIndex: 5 }}>
            <View
              style={{
                backgroundColor: C.yellow400,
                borderWidth: 2,
                borderColor: C.ink900,
                borderRadius: R.full,
                paddingHorizontal: 9,
                paddingVertical: 3,
              }}>
              <Text style={{ fontFamily: FONT.heading, fontSize: 11, color: C.ink900 }}>
                ログインボーナス +3P
              </Text>
            </View>
          </PopIn>
        ) : null}
        {/* コマの中身の高さを先に測る。この高さはフキダシの大小に左右されないので、
            「狭ければフキダシを詰める」判定を安定して行える。
            フキダシとアバターは**下に寄せる**。上に寄せると尻尾が床を指してしまい、
            誰がしゃべっているのか分からなくなる */}
        <View
          style={{ flex: 1, justifyContent: 'flex-end', gap: S.sm }}
          onLayout={(e) => setArea(e.nativeEvent.layout.height)}>
          {/* 覚えた最大の高さを**下限として確保**する。こうしておけば
              セリフが短くなってもキャラの取り分は増えない（＝背が伸びない） */}
          {/* ▍フキダシはキャラの頭の近くに置く
              キャラは地平線に合わせて縮むので、上に大きな空きができる。
              そこを丸ごと空けたままだとフキダシがコマの上端に取り残されて、
              誰がしゃべっているのか分からなくなる。空きの真ん中に置く
              （＝コマの上端とキャラの頭の中間） */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
          <View
            style={{ minHeight: bubbleH || undefined }}
            onLayout={(e) => {
              const h = Math.ceil(e.nativeEvent.layout.height);
              bubbleRaw.current = h;
              setBubbleH((prev) => (rebased.current ? Math.max(prev, h) : h));
            }}>
            <Bubble
              text={greeting}
              compact={tight}
              numberOfLines={tight ? 3 : undefined}
              style={{ marginRight: 3, marginLeft: 3 }}
            />
          </View>
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
            /* フキダシを引いた残りを全部もらう。縦横比は課さない
               （課すと幅で頭打ちになって、高さを捨てることになる） */
            style={{
              width: '100%',
              /* 置き場は中身なりにする。flex:1 で余りを全部取ると、
                 フキダシをキャラの上に寄せられない */
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
                /* ▍案内中はグレーに沈める
                   タップ自体は全面の透明レイヤーが奪っている（→ (tabs)/_layout.tsx）ので
                   押せはしないのだが、赤いままだと**いちばん押せそうな顔**をして
                   反応しない。どこを押していいか迷わせるので、色でも「いまは
                   押せない」と言う。案内が終わった瞬間に赤へ戻る */
                disabled={tutorial.active}
                onPress={() => router.push(`/lesson/${next.lesson.id}`)}
              />
            </View>
            {due > 0 ? (
              <Button
                label={`復習 ${due}`}
                variant="yellow"
                size="sm"
                disabled={tutorial.active}
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
