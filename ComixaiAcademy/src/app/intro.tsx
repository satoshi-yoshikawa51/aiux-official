/* ============================================================
   入口の一幕。職種を決めた直後に挟む。
   右から相棒が歩いてきて、中央で止まり、正面を向いてひとこと言う。
   タップするとホームへ渡し、ホーム側のアプリ案内（tutorial）に続く。

   ▍出すものは網点の紙と相棒だけ
   帯もカードもボタンも置かない。ここは画面ではなく**間（ま）**なので、
   要素を足すほど「場面が変わった」感じが薄れる。

   ▍立ち位置はホームに合わせる（下の HOME_* ）
   次に映るのがホームなので、**同じ大きさの相棒が同じ高さに立っている**と
   場面がつながる。ずれていると、切り替わった瞬間にキャラが跳ぶ。

   ▍歩きは2段で止める
   等速で歩いてきて、最後のひと足だけ減速する。1本の減速カーブで通すと
   最初から足を引きずって見える。

   ▍向きは Avatar3D の face() に任せる
   毎フレーム少しずつ寄せてくれるので、こちらは「左を向け」「正面を向け」と
   1回ずつ言えばいい。読み込み前に呼んでおくと、その向きで立ち上がる。

   ▍出入りは Gate が決める（_layout.tsx）
   職種の画面が自分で router.replace すると、Gate の「オンボーディングが
   終わっていたらホームへ」と競り合って、行き先が運任せになる。
   なので seenIntro を見て**Gate がここへ寄越し**、見終えてフラグを立てたら
   **Gate がホームへ返す**。この画面は router を触らない。
   ============================================================ */
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { PopIn } from '@/components/motion';
import { Bubble, Screen } from '@/components/ui';
import { getAvatar } from '@/data/avatars';
import { INTRO_VOICE, say } from '@/data/voice';
import { useProgress } from '@/store/progress';
import { stepSay, TUTORIAL } from '@/store/tutorial';
import { BW, F, S } from '@/theme';

/** Webの Animated はネイティブドライバを持たない */
const NATIVE = Platform.OS !== 'web';

/** 歩いてくる時間と、最後に止まる時間 */
const WALK_MS = 900;
const STOP_MS = 420;
/** 3Dが出てこないとき（モデル未実装・読み込み失敗）でも、ここまでで歩き出す */
const GIVE_UP_MS = 3500;

/** 左を向く角度。回転0でカメラ側（正面）を向くモデルなので、-90度で下手向き */
const FACE_LEFT = -Math.PI / 2;

/* ———————————————— ホームでの立ち位置 ————————————————
   ホームのアバターは、上下に積まれたものに挟まれて場所が決まる。

     安全領域 / 黒帯 / 画面の余白 / コマの枠と内余白 / フキダシ / すきま
       ……アバター……
     すきま / コマの枠と内余白 / 次のカセット / 画面の余白 / 案内のパネル /
     タブバー / 安全領域

   ここにはその**どれも無い**ので、同じ大きさ・同じ高さは数字で作るしかない。

   ▍いちばん間違えやすいのは安全領域
   ノッチのある実機では上下に90pxほど食われる。Webで見ていると0なので、
   **枠の幅で頭打ちになっているように見えて、実機では高さで頭打ちになる**。
   一度これで実機だけ4割大きくなった。insets を必ず引くこと。

   ▍案内のパネルのぶんも見込む
   一幕の次に映るのは「案内が出ているホーム」で、パネルのぶんホームは
   アバターを縮めている（Screen の reserve）。ここを見込まないと、
   切り替わった瞬間にキャラが縮む。

   ▍フキダシの高さは「ホームで出る行」を測って決める
   アバターの上にどれだけ空くかはフキダシの行数で決まり、行数は端末の幅で
   変わる（同じ文でも390では3行、414では2行）。決め打ちにできない。
   なので**ホームの1歩目に出る行を、透明のフキダシに入れて測る**。
   自分のセリフで測ると、行数が食い違ったぶんだけ大きさがずれる
   （実測で10%ずれた）。測るのはホームの行、出すのは自分の行。 */

/** ホームの AVATAR_RATIO と同じ。3Dカメラの画角は固定なので、**キャラの
    大きさは枠の高さだけで決まる**。ここがずれると場面の変わり目で伸び縮みする */
const HOME_RATIO = 1.1;

/** 背の高い画面／低い画面それぞれの、ホームの実測値（安全領域は別に足す） */
const HOME = {
  /** 黒帯の高さ（安全領域を含まない） */
  band: { tall: 85, short: 73 },
  /** 画面の余白（ホームの Screen style と同じ） */
  pad: { tall: S.lg, short: S.sm },
  /** コマが左右にとられるぶん（余白＋枠＋内余白＋ベタ影） */
  side: { tall: 60, short: 44 },
  /** 足元から画面の下まで（コマの内余白・カセット・余白・タブバー） */
  foot: { tall: 230, short: 208 },
};
/** コマの枠と内余白（フキダシの上に乗るぶん） */
const HOME_EDGE = BW.bold + S.sm;
/** 案内のパネルがホームの下に積む高さ（パネル＋その上の余白）。実測 */
const GUIDE_H = 107;
/** ホームのフキダシがコマの中でとる左右の余白（marginLeft/Right） */
const HOME_BUBBLE_MARGIN = 3;

export default function IntroScreen() {
  const { state, markIntroSeen } = useProgress();
  const avatar = getAvatar(state.avatarId, state.skinId);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const handle = React.useRef<AvatarHandle | null>(null);
  const [talking, setTalking] = React.useState(false);

  /* 1＝画面の右外、0＝定位置 */
  const walk = React.useRef(new Animated.Value(1)).current;
  const walked = React.useRef(false);
  const left = React.useRef(false);

  /* ———— ホームと同じ寸法・同じ高さに立たせる（上の HOME を参照）————
     測れるまでは何も描かない。あとから寸法が変わると GLView が作り直しに
     なって、1.9MBのGLBを読み直すことになる */
  const short = height < 700;
  const k = short ? 'short' : 'tall';
  const [bubbleH, setBubbleH] = React.useState(0);
  const [settled, setSettled] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setSettled(bubbleH), 120);
    return () => clearTimeout(t);
  }, [bubbleH]);

  /* フキダシの幅はホームに合わせる。ここが違うと折り返す行数が変わり、
     測った高さも見え方もずれる */
  const bubbleSide = HOME.side[k] / 2 + HOME_BUBBLE_MARGIN;
  /* 足元から画面の下まで。案内のパネルと安全領域のぶんも下がる */
  const foot = HOME.foot[k] + GUIDE_H + insets.bottom;
  /* アバターの上にあるもの。フキダシまで含めた高さ */
  const head = insets.top + HOME.band[k] + HOME.pad[k] + HOME_EDGE + settled + S.sm;
  const stageW = Math.floor(
    Math.min(width - HOME.side[k], Math.max(120, (height - head - foot) / HOME_RATIO)),
  );
  const stageH = Math.round(stageW * HOME_RATIO);
  /* 枠の左端が画面の右端に接する位置＝完全に画面の外 */
  const from = width / 2 + stageW / 2;

  /* 読み込みが終わる前に向きだけ決めておく。
     こうしておくと、出てきた瞬間から左を向いて立っている
     （出てから回すと、正面を向いたまま横に滑る絵になる）。
     Avatar3D はフキダシを測ってから生えるので、そのあとで呼ぶ */
  React.useEffect(() => {
    if (settled > 0) handle.current?.face(FACE_LEFT);
  }, [settled]);

  const start = React.useCallback(() => {
    if (walked.current) return;
    walked.current = true;

    /* ▍歩けない相棒は、歩かせない
       walk が入っていないGLBがある（→ avatar/Avatar3D.tsx の has）。
       そのまま滑らせると**足を止めたまま横移動する**という、いちばん
       壊れて見える絵になる。歩けないなら初めからそこに立たせて、
       正面を向いて話し始めるだけにする。演出は減るが、破綻はしない。

       いまは12体すべてに walk が入っているので、ここは通らない。
       **保険として残す**——walk の無いモデルがまた紛れ込んだとき、
       棒立ちで滑る絵に戻さないため。いま揃っているかは
       `npm run avatar:check` で分かる */
    if (!handle.current?.has('walk')) {
      walk.setValue(0);
      handle.current?.face(0);
      handle.current?.play('explain');
      setTalking(true);
      return;
    }

    handle.current?.play('walk');
    Animated.sequence([
      /* 歩いてくるあいだは等速。ここを緩めると滑って見える */
      Animated.timing(walk, {
        toValue: 0.18,
        duration: WALK_MS,
        easing: Easing.linear,
        useNativeDriver: NATIVE,
      }),
      /* 最後のひと足ぶんだけ減速して止まる */
      Animated.timing(walk, {
        toValue: 0,
        duration: STOP_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      /* 止まると同時に正面を向いて、話し出す */
      handle.current?.face(0);
      handle.current?.play('explain');
      setTalking(true);
    });
  }, [walk]);

  /* 3Dが出てこない相棒でも、ここで止まらせない（onReady が来ない） */
  React.useEffect(() => {
    const t = setTimeout(start, GIVE_UP_MS);
    return () => clearTimeout(t);
  }, [start]);

  /* ▍勝手に進めない
     読み終わる時間は人によって違う。秒数で送ると、速い人は待たされ、
     遅い人は読み切る前に消える。**押したら進む**に統一する */
  const leave = React.useCallback(() => {
    if (left.current || !talking) return;
    left.current = true;
    markIntroSeen();
  }, [markIntroSeen, talking]);

  return (
    <Screen
      scroll={false}
      tone="dots"
      /* 網点の紙を画面いっぱいに敷きたいので、安全領域は自分で見る */
      edges={[]}
      /* 画面の外へ歩かせるので、はみ出したぶんは必ず切る。
         切らないとモバイルのブラウザがページごとズームアウトする
         （opening.tsx で実際に踏んだ）。
         padding は longhand が勝つので、下だけ別に0を書く */
      style={{ padding: 0, paddingBottom: 0, gap: 0, overflow: 'hidden' }}>
      {/* この画面だけ黒帯が無い。白い文字のままだと時計が読めない */}
      <StatusBar style="dark" />

      {/* ———— ものさし ————
           **ホームの1歩目に出る行**を、ホームと同じ幅・同じ設定のフキダシに
           入れて高さを測る。画面には出さない。自分のセリフで測ると、
           折り返しの行数が食い違ったぶんだけアバターの大きさがずれる */}
      <View
        pointerEvents="none"
        onLayout={(e) => setBubbleH(Math.ceil(e.nativeEvent.layout.height))}
        style={{ position: 'absolute', left: bubbleSide, right: bubbleSide, top: 0, opacity: 0 }}>
        <Bubble
          text={stepSay(TUTORIAL[0], state.avatarId)}
          compact={short}
          numberOfLines={short ? 3 : undefined}
        />
      </View>

      {/* ———— セリフ ————
           下から積む。上から置くと、行数が増えたぶんだけ相棒に近づいて
           しっぽが顔に刺さる */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: bubbleSide,
          right: bubbleSide,
          bottom: foot + stageH + S.sm,
        }}>
        {talking ? (
          <PopIn>
            <Bubble
              text={say(INTRO_VOICE.greet, state.avatarId)}
              compact={short}
              numberOfLines={short ? 3 : undefined}
            />
          </PopIn>
        ) : null}
      </View>

      {/* ———— 相棒 ————
           大きさと足元の高さはホームに合わせてある（上の HOME） */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: foot,
          alignItems: 'center',
          transform: [{ translateX: walk.interpolate({ inputRange: [0, 1], outputRange: [0, from] }) }],
        }}>
        {/* フキダシを測り終えてから描き始める。先に描くと、測った直後に
            寸法が変わってGLBを読み直す */}
        {settled > 0 ? (
          <Avatar3D ref={handle} avatar={avatar} width={stageW} height={stageH} onReady={start} />
        ) : (
          <View style={{ width: stageW, height: stageH }} />
        )}
      </Animated.View>

      {/* ———— 次へ ————
           ホームでいうタブバーのあたり。ここに置くと、相棒の足元と
           重ならずに済む */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: insets.bottom + S.xl,
          alignItems: 'center',
        }}>
        {talking ? (
          <PopIn>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[F.hand, { fontSize: 14 }]}>タップして、つづける</Text>
              <Icon name="play" size={11} />
            </View>
          </PopIn>
        ) : null}
      </View>

      {/* ———— 押すところ ————
           **いちばん上に重ねる。** 下に敷くと、相棒の上を押したときに
           GLView の canvas が先に受け取ってしまう（親の pointerEvents="none"
           が canvas まで効かない）。ここには押すものが他に無いので、
           全面を1枚のPressableで覆ってしまってよい */}
      <Pressable onPress={leave} style={StyleSheet.absoluteFill} />
    </Screen>
  );
}
