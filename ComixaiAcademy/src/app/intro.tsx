/* ============================================================
   入口の一幕。職種を決めた直後に挟む。
   右から相棒が歩いてきて、中央で止まり、正面を向いてひとこと言う。
   そのままホームへ渡し、ホーム側のアプリ案内（tutorial）に続く。

   ▍出すものは網点の紙と相棒だけ
   帯もカードもボタンも置かない。ここは画面ではなく**間（ま）**なので、
   要素を足すほど「場面が変わった」感じが薄れる。

   ▍歩きは2段で止める
   等速で歩いてきて、最後だけ減速する。1本の減速カーブで通すと
   最初から足を引きずって見える（歩幅と速さが合わない）。

   ▍向きは Avatar3D の face() に任せる
   毎フレーム少しずつ寄せてくれるので、こちらは「左を向け」「正面を向け」と
   1回ずつ言えばいい。読み込み前に呼んでおくと、その向きで立ち上がる。

   ▍出入りは Gate が決める（_layout.tsx）
   職種の画面が自分で router.replace すると、Gate の「オンボーディングが
   終わっていたらホームへ」と競り合って、行き先が運任せになる。
   なので seenIntro を見て**Gate がここへ寄越し**、見終えてフラグを立てたら
   **Gate がホームへ返す**。この画面は router を触らない。
   ============================================================ */
import React from 'react';
import { Animated, Easing, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Avatar3D, type AvatarHandle } from '@/avatar/Avatar3D';
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
/** しゃべってから、ホームへ渡すまでの間。読み終わるくらい */
const READ_MS = 4200;
/** 3Dが出てこないとき（モデル未実装・読み込み失敗）でも、ここまでで歩き出す */
const GIVE_UP_MS = 3500;

/** 左を向く角度。回転0でカメラ側（正面）を向いているモデルなので、-90度で下手向き */
const FACE_LEFT = -Math.PI / 2;

export default function IntroScreen() {
  const { state, markIntroSeen } = useProgress();
  const avatar = getAvatar(state.avatarId);
  const { width } = useWindowDimensions();

  const handle = React.useRef<AvatarHandle | null>(null);
  const [talking, setTalking] = React.useState(false);

  /* 1＝画面の右外、0＝中央 */
  const walk = React.useRef(new Animated.Value(1)).current;
  const walked = React.useRef(false);
  const left = React.useRef(false);

  /* 相棒のコマ。オンボーディングの1枚目と同じくらいの背丈にする */
  const stageW = Math.min(width * 0.74, 290);
  const stageH = Math.round(stageW * 0.95);
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

  const leave = React.useCallback(() => {
    if (left.current) return;
    left.current = true;
    markIntroSeen();
  }, [markIntroSeen]);

  /* 読み終わるころに自動で進む。待たせない、急かさない */
  React.useEffect(() => {
    if (!talking) return;
    const t = setTimeout(leave, READ_MS);
    return () => clearTimeout(t);
  }, [talking, leave]);

  return (
    <Screen
      scroll={false}
      tone="dots"
      edges={['top', 'bottom']}
      /* 画面の外へ歩かせるので、はみ出したぶんは必ず切る。
         切らないとモバイルのブラウザがページごとズームアウトする
         （opening.tsx で実際に踏んだ） */
      style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
      {/* 待てない人のために、どこを押しても進めるようにしておく */}
      <Pressable
        onPress={talking ? leave : undefined}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: S.xxl }}>
        {/* ▍フキダシのぶんの高さは先に空けておく
            出た瞬間に相棒が下へ押されると、せっかく止まった足がずれる */}
        <View
          style={{
            width: '100%',
            minHeight: 132,
            justifyContent: 'flex-end',
            paddingHorizontal: S.lg,
          }}>
          {talking ? (
            <PopIn>
              <Bubble variant="say" text={say(INTRO_VOICE.greet, state.avatarId)} />
            </PopIn>
          ) : null}
        </View>

        <Animated.View
          style={{
            transform: [
              {
                translateX: walk.interpolate({ inputRange: [0, 1], outputRange: [0, from] }),
              },
            ],
          }}>
          <Avatar3D
            ref={handle}
            avatar={avatar}
            width={stageW}
            height={stageH}
            onReady={start}
          />
        </Animated.View>

        <View style={{ height: 22, justifyContent: 'center' }}>
          {talking ? (
            <PopIn>
              <Text style={F.tiny}>タップで進む</Text>
            </PopIn>
          ) : null}
        </View>
      </Pressable>
    </Screen>
  );
}
