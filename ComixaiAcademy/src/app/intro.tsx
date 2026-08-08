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
import { F, S } from '@/theme';

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
   ホームのアバターは
   「黒帯 → 余白 → コマ（フキダシ＋アバター）→ 次のカセット → タブバー」
   に挟まれて場所が決まる。ここにはその**どれも無い**ので、同じ位置に
   立たせるには数字で合わせるしかない。以下はホーム（案内を閉じた状態）の
   実測値。iPhoneの主要な幅で確かめてある。

     390x844 → 幅330・高さ364・足元から下まで230
     414x896 → 幅355・高さ390・同230
     430x932 → 幅370・高さ408・同230
     375x667 → 幅287・高さ316・同208（背の低い画面）

   ホームの数値を変えたら（余白・カセット・AVATAR_RATIO）ここも測り直すこと。 */

/** ホームの AVATAR_RATIO と同じ。3Dカメラの画角は固定なので、**キャラの
    大きさは枠の高さだけで決まる**。ここがずれると場面の変わり目で伸び縮みする */
const HOME_RATIO = 1.1;
/** コマが左右にとられるぶん（画面の余白＋枠＋コマの内余白） */
const HOME_SIDE = { tall: 60, short: 44 };
/** 足元から画面の下まで（カセットとタブバーのぶん） */
const HOME_FOOT = { tall: 230, short: 208 };
/** フキダシに残しておく最低限。背の低い画面はここで頭打ちになる */
const HOME_HEAD = { tall: 150, short: 140 };

export default function IntroScreen() {
  const { state, markIntroSeen } = useProgress();
  const avatar = getAvatar(state.avatarId);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const handle = React.useRef<AvatarHandle | null>(null);
  const [talking, setTalking] = React.useState(false);

  /* 1＝画面の右外、0＝定位置 */
  const walk = React.useRef(new Animated.Value(1)).current;
  const walked = React.useRef(false);
  const left = React.useRef(false);

  /* ホームと同じ寸法・同じ高さに立たせる（上の HOME_* を参照） */
  const short = height < 700;
  const key = short ? 'short' : 'tall';
  const stageW = Math.floor(
    Math.min(width - HOME_SIDE[key], (height - HOME_FOOT[key] - HOME_HEAD[key]) / HOME_RATIO),
  );
  const stageH = Math.round(stageW * HOME_RATIO);
  /* タブバーは安全領域のぶんだけ下に伸びるので、足元もそのぶん下がる */
  const foot = HOME_FOOT[key] + insets.bottom;
  /* 枠の左端が画面の右端に接する位置＝完全に画面の外 */
  const from = width / 2 + stageW / 2;

  /* 読み込みが終わる前に向きだけ決めておく。
     こうしておくと、出てきた瞬間から左を向いて立っている
     （出てから回すと、正面を向いたまま横に滑る絵になる） */
  React.useEffect(() => {
    handle.current?.face(FACE_LEFT);
  }, []);

  const start = React.useCallback(() => {
    if (walked.current) return;
    walked.current = true;
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

      {/* ———— セリフ ————
           下から積む。上から置くと、行数が増えたぶんだけ相棒に近づいて
           しっぽが顔に刺さる */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: S.lg, right: S.lg, bottom: foot + stageH - S.sm }}>
        {talking ? (
          <PopIn>
            <Bubble variant="say" text={say(INTRO_VOICE.greet, state.avatarId)} />
          </PopIn>
        ) : null}
      </View>

      {/* ———— 相棒 ————
           足元の高さはホームに合わせてある（上の HOME_FOOT） */}
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
        <Avatar3D ref={handle} avatar={avatar} width={stageW} height={stageH} onReady={start} />
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
