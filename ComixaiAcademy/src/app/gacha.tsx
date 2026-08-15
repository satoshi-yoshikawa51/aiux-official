/* ============================================================
   ガチャ。ガチャPを3枚入れてダイヤルを回すと、カプセルが落ちてくる。

   ▍マシンは絵、動くところだけ重ねる
   もとは黒枠＋ベタ影のViewで描き起こしていたが、写真のような
   マシンの絵に差し替えた。**動くのはダイヤルとカプセルだけ**なので、
   その2つだけを絵の上に重ねる（位置の持ち方は下の MACHINE を見て）。
   ドームに詰まったカプセルは、絵に描かれているものをそのまま使う。

   ▍段取り
   ダイヤルが回る（カリカリ音）→ マシンが揺れる → カプセルが
   出口から落ちて弾む → タップで蓋が飛ぶ → 景品がスタンプで出る。
   開けるまでを1タップ挟むのは、「何が出た？」の間を作るため。

   ▍カプセルの色でレア度を先に知らせる
   青＝N ／ 赤＝R ／ 金＝SR。落ちてきた瞬間にもう分かるので、
   タップする前がいちばん盛り上がる（→ components/capsule-3d.tsx）。

   ▍景品は舞台テーマと、アバター（→ data/gacha.ts）
   アバターには「キャラ本体」（別モデル。おてんば・かんろく・先輩）と
   「色違い」（テクスチャ違い。せんぱい_金髪ver）の2種類があるが、
   どちらも**1体増える**体験なので同じ景品として扱う。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar3D } from '@/avatar/Avatar3D';
import { Capsule3D, CAPSULE_OPEN_MS } from '@/components/capsule-3d';
import { Icon } from '@/components/icons';
import { PrizeRays, PrizeTwinkles } from '@/components/prize-shine';
import { PopIn, useSparkBurst, useTap } from '@/components/motion';
import { StageEffect, StageGlow } from '@/components/stage-effect';
import { Badge, Button, Panel, Row, Screen, Tap } from '@/components/ui';
import {
  AVATARS,
  DEFAULT_SKIN_ID,
  avatarLabel,
  getAvatar,
  lookOfPrize,
  ownsAvatar,
  SKINS,
} from '@/data/avatars';
import { ExtraList } from '@/components/extra-list';
import { GachaCoachBand } from '@/components/gacha-coach';
import { ShareRow } from '@/components/share-row';
import {
  DEFAULT_THEME_ID,
  DUPE_REFUND,
  getTheme,
  odds,
  RARITY_COLOR,
  SPIN_COST,
  THEMES,
  type Rarity,
  type StageTheme,
} from '@/data/gacha';
import { playSound } from '@/lib/sound';
import { useProgress, type SpinResult } from '@/store/progress';
import { BW, C, F, FONT, R, S, T } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/* ———— マシンの絵と、その上に重ねる部品の位置 ————

   ▍位置は「絵に対する割合」で持つ
   マシンは1枚の絵なので、ダイヤルも取り出し口も**絵の中の座標**でしか
   分からない。ピクセルで書くと表示幅を変えた瞬間にズレるので、割合で
   持って表示寸法に掛ける。数字は絵から測って出した
   （tools は使い捨て。ダイヤル＝銀色のいちばん大きなかたまり、
   取り出し口＝下部の暗い赤のかたまり、をつながりで拾った）。

   ▍ダイヤルだけ別の絵にして重ねる
   絵に焼かれたダイヤルは回らない。銀の円板だけを**丸く切り出した**
   gacha-dial.png を、同じ位置・同じ大きさで重ねて回す。円は回しても
   輪郭が変わらないので、下の絵とズレない（溝と光沢だけが回る）。 */
const MACHINE = {
  src: require('@/assets/images/gacha-machine.png'),
  dial: require('@/assets/images/gacha-dial.png'),
  /** 絵の縦横比（966 / 640） */
  ratio: 966 / 640,
  /** ダイヤル：中心の位置と、直径（どちらも幅に対する割合） */
  dialAt: { x: 0.4852, y: 0.7164, size: 0.2437 },
  /** 取り出し口：カプセルの中心を置く位置と、描く枠の一辺。

      枠の中で球が占めるのは約67%（カメラの画角で決まる）なので、
      **見た目の直径は size × 0.67**。絵の中央を縦に読むと、口の天井が
      0.817・受け皿の面が0.955なので、内側の高さは0.138（＝48pt）。
      そこに収まる直径にして、底が受け皿に載る高さへ中心を置いてある。
      **カプセルは絵の上に描くので、はみ出すと口の外に浮いて見える** */
  chuteAt: { x: 0.4664, y: 0.893, size: 0.28 },
  /** 取り出し口の天井（絵の高さに対する割合）。ここより上にカプセルが
      来ているあいだは、マシンの絵で隠して「中を通っている」ことにする */
  chuteCeiling: 0.817,
} as const;
const MACHINE_W = 232;
const MACHINE_H = Math.round(MACHINE_W * MACHINE.ratio);

/* ———— カプセルの寸法 ————
   3Dは**いつも CAP_BOX で描いて、倍率だけ動かす**（→ 使っているところの
   メモ）。口に収まっているときは CAP_REST まで縮め、押されたら等倍まで
   開いて手前に出る。 */
const CAP_BOX = 168;
const CAP_REST = (MACHINE.chuteAt.size * MACHINE_W) / CAP_BOX;
/** 手前に出たときの、口からの持ち上げ量 */
const CAP_POP_UP = -MACHINE_H * 0.3;
/** 手前に出るのにかける時間 */
const POP_MS = 300;

/* ———— カードが出てくるところ ————
   カプセルは画面の中ほどより少し上（マシンの胴のあたり）で開くので、
   カードはそこから降りてくる形にする。**きっちり測っていない**——
   マシンの位置は上の案内バンドの有無で少し動くので、だいたいの値。
   ここが大きくズレて見えたら、この数字だけ変えれば直る */
const CARD_FROM_Y = -80;
const CARD_OUT_MS = 460;

/* popping＝押されて手前に出ている最中、opening＝蓋が飛んでいる最中。
   この2つを挟まないと、押した瞬間に結果のカードが覆いかぶさって
   **開く演出が一度も見えない** */
type Phase = 'idle' | 'spinning' | 'dropped' | 'popping' | 'opening' | 'revealed';

export default function GachaScreen() {
  const { state, spinGacha, setTheme, setLook } = useProgress();
  const burst = useSparkBurst();
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [result, setResult] = React.useState<SpinResult | null>(null);
  /* この画面で1回でもまわしたか（案内の文言が変わる → gacha-coach.tsx） */
  const [spunOnce, setSpunOnce] = React.useState(false);

  /* ダイヤルの回転・マシンの揺れ・カプセルの落下・手前に出る動き */
  const dial = React.useRef(new Animated.Value(0)).current;
  const shake = React.useRef(new Animated.Value(0)).current;
  const drop = React.useRef(new Animated.Value(0)).current;
  const pop = React.useRef(new Animated.Value(0)).current;

  /* 引退したテーマの記録が残っていても数に入れない（→ data/gacha.ts） */
  const ownedThemes = THEMES.filter((t) => t.id !== DEFAULT_THEME_ID && state.themes[t.id]).length;
  /* アバターの持ち数は「キャラ本体 ＋ 色違い」。景品から外した色違いの
     記録が残っていても数に入れない（舞台と同じ扱い） */
  const playable = AVATARS.filter((a) => a.model);
  const ownedAvatars =
    playable.filter((a) => ownsAvatar(a, state.skins)).length +
    SKINS.filter((sk) => state.skins[sk.id]).length;
  const totalAvatars = playable.length + SKINS.length;
  const canSpin = state.coins >= SPIN_COST && phase === 'idle';

  const spin = () => {
    if (!canSpin) return;
    const r = spinGacha();
    if (!r) return;
    setResult(r);
    setSpunOnce(true);
    setPhase('spinning');
    playSound('start');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    /* ▍カプセルはここで引っ込める
       drop を戻すのをダイヤルが回りきったあと（800ms後）にしていたので、
       **2回目以降は前回の1が残ったまま**で、回している最中に受け皿へ
       カプセルが座っていた。落ちる前にもう1個見えてしまう。
       まわし始めた時点で、口の上（見えない位置）に戻す */
    drop.setValue(0);
    pop.setValue(0);

    /* ダイヤル1回転。途中でカリ、カリ、カリ */
    dial.setValue(0);
    [140, 340, 560].forEach((ms) => setTimeout(() => playSound('tick'), ms));
    Animated.timing(dial, {
      toValue: 1,
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start(() => {
      /* 揺れてから、カプセルが落ちる */
      shake.setValue(0);
      Animated.timing(shake, {
        toValue: 1,
        duration: 320,
        easing: Easing.linear,
        useNativeDriver: NATIVE,
      }).start();
      drop.setValue(0);
      playSound('pick');
      Animated.timing(drop, {
        toValue: 1,
        duration: 620,
        easing: Easing.bounce,
        useNativeDriver: NATIVE,
      }).start(() => setPhase('dropped'));
    });
  };

  /* 押されたら、手前に出る → 蓋が飛ぶ → カードが出る、の順で見せる。
     ひと息ずつ待たないと、開封が0フレームで隠れる */
  const open = (x: number, y: number) => {
    if (phase !== 'dropped' || !result) return;
    setPhase('popping');
    playSound('pick');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    pop.setValue(0);
    Animated.timing(pop, {
      toValue: 1,
      duration: POP_MS,
      /* 行き過ぎて戻る。手前へ「ポン」と出る手ざわりはここで決まる */
      easing: Easing.out(Easing.back(2.2)),
      useNativeDriver: NATIVE,
    }).start(({ finished }) => {
      if (!finished) return;
      setPhase('opening');
      setTimeout(() => setPhase('revealed'), CAPSULE_OPEN_MS);
      burst(x, y, result.prize.rarity === 'SR' ? 2.6 : 1.8);
      playSound(result.prize.rarity === 'SR' ? 'badge' : 'clear');
      if (result.prize.rarity === 'SR') setTimeout(() => playSound('star'), 300);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    });
  };

  const closeResult = () => {
    setResult(null);
    setPhase('idle');
    /* 次に落ちてくるカプセルは、また口の中で小さく待つ */
    pop.setValue(0);
  };

  const dialDeg = dial.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const shakeX = shake.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 5, -4, 3, 0],
  });
  /* ドームの高さぶん落として、弾ませる */
  const dropY = drop.interpolate({ inputRange: [0, 1], outputRange: [-MACHINE_H * 0.42, 0] });
  /* 押されたあと、手前に出る（持ち上がりながら等倍まで開く） */
  const popY = pop.interpolate({ inputRange: [0, 1], outputRange: [0, CAP_POP_UP] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [CAP_REST, 1] });

  /* 一度でもまわしたら、カプセルは置いたままにする（→ capsule-3d.tsx の
     冒頭。出し入れするとWebGLのコンテキストが尽きる）。見え隠れは
     opacity で、当たり判定は phase で切る */
  const capsuleLive = phase !== 'idle' || spunOnce;

  return (
    /* 開封カードはスクロールの外に重ねる。Screenの中に置くと、
       コレクション欄が伸びたぶん「中身の中央」＝画面の外に出てしまう */
    <View style={{ flex: 1 }}>
      <Screen edges={['bottom']} tone="dots" style={{ gap: S.lg }}>
      {/* 所持P。増減が主役の画面なので、いちばん上に大きく */}
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={7}>
          <Icon name="egg" size={18} color={T.accent} />
          <Text style={{ fontFamily: FONT.display, fontSize: 22, color: T.text }}>
            {state.coins}
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: T.muted }}> P</Text>
          </Text>
        </Row>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>
          舞台 {ownedThemes + 1}/{THEMES.length} ・ アバター {ownedAvatars}/{totalAvatars}
        </Text>
      </Row>

      {/* 1本目を終えた人への案内。まわす前と後で言うことが変わる */}
      <GachaCoachBand spun={spunOnce} />

      {/* ———— マシン ————
           絵1枚の上に、回るダイヤルと落ちてくるカプセルを重ねる。
           ドームの中のカプセルは絵に描かれているものをそのまま使う。

           ▍重ねる順番に意味がある
           マシンの絵 → カプセル → **口より上を隠すマスク** → ダイヤル。
           マスクが無いと、落ちてくるカプセルが**マシンの手前を滑り降りて
           きて、宙から降ってきたように見える**。マスクはマシンの絵を
           もう一度、口の天井までで切って重ねたもの。ダイヤルはその
           マスクより上（絵の中ほど）にあるので、いちばん最後に描く */}
      <View style={{ alignItems: 'center' }}>
        <Animated.View
          style={{
            transform: [{ translateX: shakeX }],
            width: MACHINE_W,
            height: MACHINE_H,
          }}>
          <Image
            source={MACHINE.src}
            resizeMode="contain"
            style={{ width: MACHINE_W, height: MACHINE_H }}
          />

          {/* 取り出し口に落ちてくるカプセル。押すと手前に出て開く */}
          {capsuleLive ? (
            <Animated.View
              style={{
                position: 'absolute',
                left: MACHINE.chuteAt.x * MACHINE_W - CAP_BOX / 2,
                top: MACHINE.chuteAt.y * MACHINE_H - CAP_BOX / 2,
                /* ▍落ちるときは下、手前に出たら上
                   書いた順（マシン→カプセル→マスク→ダイヤル）のままだと、
                   **手前に出たカプセルがダイヤルの裏に潜る**。落下中だけ
                   マスクとダイヤルの下に置いて、それ以外は全部より上にする */
                zIndex: phase === 'spinning' ? 1 : 5,
                opacity:
                  phase === 'spinning'
                    ? drop.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 1, 1] })
                    : phase === 'idle'
                      ? 0
                      : 1,
                /* translate → scale の順に書く。**逆にすると移動量まで
                   拡大される**（手前に出た瞬間に画面外へ飛ぶ） */
                transform: [
                  { translateY: phase === 'spinning' ? dropY : popY },
                  { scale: phase === 'spinning' ? CAP_REST : popScale },
                ],
              }}>
              <Pressable
                disabled={phase !== 'dropped'}
                accessibilityRole="button"
                accessibilityLabel="カプセルを開ける"
                onPress={(e) => open(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
                {/* ▍いつも大きく描いて、小さいときは縮めて見せる
                    逆（小さく描いて拡大）だと、手前に出た瞬間に**canvasを
                    引き伸ばした眠い絵**になる。size を変えるとGLを作り直す
                    ことになるので、寸法は固定して倍率だけ動かす */}
                <Capsule3D
                  rarity={result?.prize.rarity ?? 'N'}
                  size={CAP_BOX}
                  open={phase === 'opening' || phase === 'revealed'}
                />
              </Pressable>
            </Animated.View>
          ) : null}

          {/* 口より上を隠すマスク（落ちてくるあいだだけ） */}
          {phase === 'spinning' ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: MACHINE_W,
                height: MACHINE.chuteCeiling * MACHINE_H,
                overflow: 'hidden',
                zIndex: 2,
              }}>
              <Image
                source={MACHINE.src}
                resizeMode="contain"
                style={{ width: MACHINE_W, height: MACHINE_H }}
              />
            </View>
          ) : null}

          {/* 回るダイヤル */}
          <Animated.Image
            source={MACHINE.dial}
            resizeMode="contain"
            style={{
              position: 'absolute',
              width: MACHINE.dialAt.size * MACHINE_W,
              height: MACHINE.dialAt.size * MACHINE_W,
              left: (MACHINE.dialAt.x - MACHINE.dialAt.size / 2) * MACHINE_W,
              top: MACHINE.dialAt.y * MACHINE_H - (MACHINE.dialAt.size * MACHINE_W) / 2,
              zIndex: 3,
              transform: [{ rotate: dialDeg }],
            }}
          />
        </Animated.View>


        {/* 状況の一言。マシンの下に固定の高さで */}
        <View style={{ height: 30, justifyContent: 'center', marginTop: S.md }}>
          {phase === 'dropped' ? (
            <PopIn>
              <Text style={[F.hand, { fontSize: 14, color: T.text }]}>カプセルを押して開ける</Text>
            </PopIn>
          ) : phase === 'idle' ? (
            <Text style={[F.hand, { fontSize: 13, color: T.muted }]}>
              {state.coins >= SPIN_COST
                ? 'ダイヤルの下のボタンでまわす'
                : `あと${SPIN_COST - state.coins}Pたまったら まわせる`}
            </Text>
          ) : null}
        </View>

        <Button
          label={phase === 'spinning' ? 'まわしています…' : `${SPIN_COST}Pで まわす`}
          onPress={spin}
          disabled={!canSpin}
          style={{ alignSelf: 'stretch', marginTop: S.xs }}
        />
        <Text style={[F.tiny, { marginTop: 6 }]}>
          Pはログイン・バッジ・称号・修了試験で貯まる ／ ダブりは+{DUPE_REFUND}P
        </Text>
      </View>

      {/* 何がどれだけ出るのか（→ 下の OddsBox） */}
      <OddsBox />

      {/* 当てた景品についてくる遊び（→ components/extra-list.tsx）。
          当てた直後にここで気づけるよう、ガチャの中にも置いておく */}
      <ExtraList />

      {/* ———— あつめた舞台 ———— */}
      <View style={{ gap: S.sm }}>
        <Text style={F.h1}>あつめた舞台</Text>
        <Text style={F.small}>持っている舞台は、押すとホームに飾れます。</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, alignItems: 'flex-start' }}>
          {THEMES.map((t) => {
            const owned = t.id === DEFAULT_THEME_ID || !!state.themes[t.id];
            const active = state.themeId === t.id;
            return (
              <ThemeCard
                key={t.id}
                theme={t}
                owned={owned}
                active={active}
                onPress={() => owned && setTheme(t.id)}
              />
            );
          })}
        </View>
      </View>

      {/* ———— あつめたアバター ————
           色違いも独立した1体として並べる。ガチャで増えていくロスター。
           まだモデルの無いキャラは「準備中」で見せて、この棚が
           これから伸びることを予告しておく */}
      <View style={{ gap: S.sm }}>
        <Text style={F.h1}>あつめたアバター</Text>
        <Text style={F.small}>押すとそのアバターに切り替わります（せっていからも変えられます）。</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, alignItems: 'flex-start' }}>
          {AVATARS.filter((a) => a.model).map((a) => {
            /* 最初の2人は持っている。残りはガチャで当てるまで伏せておく */
            const has = ownsAvatar(a, state.skins);
            return (
            <React.Fragment key={a.id}>
              <AvatarCard
                name={has ? avatarLabel(a) : '？？？'}
                rarity={a.initial ? null : a.rarity}
                swatch={has ? '#274a5e' : a.accent}
                owned={has}
                active={state.avatarId === a.id && state.skinId === DEFAULT_SKIN_ID}
                onPress={() => has && setLook(a.id, DEFAULT_SKIN_ID)}
              />
              {SKINS.filter((sk) => sk.avatarId === a.id).map((sk) => {
                const owned = !!state.skins[sk.id];
                return (
                  <AvatarCard
                    key={sk.id}
                    name={sk.name}
                    rarity={sk.rarity}
                    swatch={sk.swatch}
                    owned={owned}
                    active={state.avatarId === a.id && state.skinId === sk.id}
                    onPress={() => owned && setLook(a.id, sk.id)}
                  />
                );
              })}
            </React.Fragment>
            );
          })}
          {AVATARS.filter((a) => !a.model).map((a) => (
            <AvatarCard
              key={a.id}
              name={a.name}
              rarity={null}
              swatch={a.accent}
              owned={false}
              preparing
              active={false}
              onPress={() => {}}
            />
          ))}
        </View>
      </View>

      </Screen>

      {/* ———— 結果 ———— */}
      {phase === 'revealed' && result ? (
        <Pressable
          onPress={closeResult}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            padding: S.xl,
            zIndex: 20,
          }}>
          {/* ▍暗幕はゆっくり降ろす
              いきなり真っ暗にすると、蓋が飛んだ瞬間が塗りつぶされる。
              カードが育つのと同じ速さで暗くしていく */}
          <Scrim />

          {/* ▍光り物はカードと同じ枠に入れる
              暗幕いっぱいに広げると、星がカードのまわりではなく
              **画面の四隅**で光る。カードの大きさに合わせた入れ物を
              作って、その中で位置を決める */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* SRだけ、カードの中心から光が伸びる。**カードの後ろ**に敷く */}
          {result.prize.rarity === 'SR' ? <PrizeRays /> : null}

          {/* ▍カプセルから出てくるように見せる
              蓋が飛んだところにカードが生えてくる。カプセルは画面の
              中ほどより少し上（マシンの胴のあたり）にいるので、そのぶん
              上から降りてくる形にしてある。Stampの「上から落ちて押す」
              とは別で、こちらは**小さく生まれて開く**動き */}
          <CardOut from={CARD_FROM_Y}>
            <Panel contentStyle={{ alignItems: 'center', gap: S.sm, padding: S.xl }}>
              {/* 札の色も、落ちてきたカプセルと同じ割り当てにする
                  （青＝N ／ 赤＝R ／ 金＝SR） */}
              <Badge tone={result.prize.rarity === 'SR' ? 'yellow' : result.prize.rarity === 'R' ? 'red' : 'blue'}>
                {result.prize.rarity}
              </Badge>
              {result.prize.kind === 'theme' ? (
                /* 舞台のミニプレビュー */
                (() => {
                  const theme = getTheme(result.prize.id);
                  return (
                    <View
                      style={{
                        width: 190,
                        height: 110,
                        borderRadius: R.sm,
                        borderWidth: BW.bold,
                        borderColor: C.ink900,
                        backgroundColor: '#b8a276',
                        overflow: 'hidden',
                      }}>
                      {/* ▍当てた舞台の絵をちゃんと出す
                          ここは重ねる色のベタだけを描いていて、**専用の絵が
                          あるテーマでも絵が出ていなかった**（当てた瞬間に
                          いちばん見たいものが、ただの土色の面だった）。
                          下の「あつめた舞台」のコマと同じ積み方にする */}
                      {theme.art ? (
                        <Image
                          source={theme.art.src}
                          resizeMode="cover"
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : null}
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          backgroundColor: theme.art ? theme.tint : t9(theme),
                        }}
                      />
                      {theme.effect ? <StageEffect effect={theme.effect} /> : null}
                      {theme.glow ? <StageGlow glow={theme.glow} /> : null}
                    </View>
                  );
                })()
              ) : (
                /* アバターは本人が出てくる。ここが一番のご褒美 */
                <View
                  style={{
                    width: 190,
                    height: 190,
                    borderRadius: R.sm,
                    borderWidth: BW.bold,
                    borderColor: C.ink900,
                    backgroundColor: '#eef4ff',
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}>
                  <Avatar3D
                    avatar={(() => {
                      /* キャラ本体（別モデル）と色違い（テクスチャ違い）の
                         どちらが当たっても、ここで本人の姿に解決する */
                      const look = lookOfPrize(result.prize.id);
                      return getAvatar(look?.avatarId, look?.skinId);
                    })()}
                    width={170}
                    height={182}
                  />
                </View>
              )}
              <Text style={{ fontFamily: FONT.display, fontSize: 24, lineHeight: 34, color: T.text }}>
                {result.prize.name}
              </Text>
              <Text style={[F.hand, { textAlign: 'center' }]}>
                {result.dupe ? 'すでに持っていた。+1P 返しておくね。' : result.prize.desc}
              </Text>
              <Button
                label={result.dupe ? 'もどる' : result.prize.kind === 'theme' ? 'ホームに飾る' : 'このアバターにする'}
                size="sm"
                onPress={() => {
                  if (!result.dupe) {
                    if (result.prize.kind === 'theme') setTheme(result.prize.id);
                    else {
                      const look = lookOfPrize(result.prize.id);
                      if (look) setLook(look.avatarId, look.skinId);
                    }
                  }
                  closeResult();
                }}
              />
              {/* SRを当てた瞬間だけシェアの口を出す。Nや R では出さない
                  （毎回出ると、ただのボタンになって押されなくなる） */}
              {!result.dupe && result.prize.rarity === 'SR' ? (
                <ShareRow
                  reason={{ kind: 'prize', name: result.prize.name, rarity: result.prize.rarity }}
                />
              ) : null}
              <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5, color: T.muted }}>
                TAP TO CLOSE
              </Text>
            </Panel>
          </CardOut>

          {/* キラキラはカードの上。R より SR のほうが数も大きさも増える */}
          <PrizeTwinkles rarity={result.prize.rarity} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

/* 暗幕。カードが育つのと同じ速さで降ろす（→ 使っているところのメモ） */
function Scrim() {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: CARD_OUT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: 'rgba(20,17,15,0.82)', opacity: t },
      ]}
    />
  );
}

/* カプセルから出てくるカード。**小さく生まれて、持ち上がりながら開く**。
   Stamp（上から落ちて判子を押す）とは動きの意味が違うので別にしてある。
   傾きはStampに合わせて -3度 */
function CardOut({ from, children }: { from: number; children: React.ReactNode }) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: CARD_OUT_MS,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t]);
  return (
    <Animated.View
      style={{
        opacity: t.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 1, 1] }),
        /* translate → scale の順。逆にすると移動量まで拡大される */
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.12, 1] }) },
          { rotate: '-3deg' },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

/* ———— 提供割合 ————
   ▍数字は在庫から計算する（→ data/gacha.ts の odds()）
   手で書くと、舞台やアバターを足したときに必ず食い違う。
   ストアの審査でもガチャは提供割合の開示が要る。

   ▍たたんでおく
   回したい人が最初に見るものではないので、ふだんは1行。
   押した人にだけ、内訳を全部見せる。 */
const KIND_LABEL: Record<'theme' | 'avatar', string> = { theme: '背景', avatar: 'キャラ' };
const KIND_UNIT: Record<'theme' | 'avatar', string> = { theme: '枚', avatar: '体' };
/** 小数第1位まで。ぴったりのときは整数で出す（89.5% / 65%） */
const pct = (n: number) => `${Math.round(n * 10) / 10}%`;

function OddsBox() {
  const [open, setOpen] = React.useState(false);
  const o = React.useMemo(() => odds(), []);
  return (
    <View style={{ gap: S.sm }}>
      <Tap onPress={() => setOpen((v) => !v)} sparks={false} style={{ paddingVertical: 4 }}>
        <Row gap={6}>
          <Icon name={open ? 'close' : 'chart'} size={14} color={T.link} />
          <Text style={[F.strong, { color: T.link, fontSize: 13 }]}>
            {open ? '提供割合をとじる' : '提供割合をみる'}
          </Text>
        </Row>
      </Tap>
      {open ? (
        <View
          style={{
            borderWidth: BW.line,
            borderColor: T.border,
            borderRadius: R.sm,
            backgroundColor: T.sunk,
            padding: S.md,
            gap: S.sm,
          }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: T.text, lineHeight: 20 }}>
            {o.byKind.map((k) => `${KIND_LABEL[k.kind]} ${pct(k.pct)}`).join(' ・ ')}
            {'\n'}
            {o.byRarity.map((r) => `${r.rarity} ${pct(r.pct)}`).join(' ・ ')}
          </Text>
          <View style={{ height: 1, backgroundColor: T.borderSoft }} />
          {o.cells.map((c) => (
            <Row key={`${c.rarity}:${c.kind}`} style={{ justifyContent: 'space-between' }}>
              <Row gap={8} style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    color: RARITY_COLOR[c.rarity],
                    width: 26,
                  }}>
                  {c.rarity}
                </Text>
                <Text style={[F.small, { flex: 1 }]}>
                  {KIND_LABEL[c.kind]} {c.count}
                  {KIND_UNIT[c.kind]}
                </Text>
              </Row>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: T.text }}>
                {pct(c.pct)}
              </Text>
            </Row>
          ))}
          <Text style={F.tiny}>
            同じレア度の中では等確率です。すでに持っているものも出ます（そのときは
            {DUPE_REFUND}P返ります）。1回{SPIN_COST}P。
          </Text>
          {/* ▍上の「背景◯% ・ キャラ◯%」は決めた比率ではない
              種類での重み付けはやめたので（→ data/gacha.ts）、あの数字は
              **いま入っている本数の結果**。景品を足すと動く。決め打ちの
              比率だと誤解されないよう、そこだけ書いておく */}
          <Text style={F.tiny}>
            上の「背景・キャラ」の割合は、入っている本数から出た結果です（決めた比率ではありません）。
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** プレビュー用：透明tintのときは教室っぽい土色を見せる */
function t9(t: StageTheme): string {
  return t.tint === 'transparent' ? 'rgba(0,0,0,0)' : t.tint;
}

/* 舞台1枚のカード。未入手は？？？ */
function ThemeCard({
  theme,
  owned,
  active,
  onPress,
}: {
  theme: StageTheme;
  owned: boolean;
  active: boolean;
  onPress: () => void;
}) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: owned });
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={!owned}
      style={{ width: '47%' }}>
      <View
        style={{
          borderWidth: active ? BW.bold : BW.line,
          borderColor: active ? C.ink900 : owned ? C.ink900 : T.borderSoft,
          borderRadius: R.sm,
          backgroundColor: owned ? T.surface : T.sunk,
          overflow: 'hidden',
          transform: [{ scale: pressed && owned ? 0.97 : 1 }],
        }}>
        {/* ミニプレビュー */}
        <View style={{ height: 62, backgroundColor: owned ? '#b8a276' : T.sunk }}>
          {owned ? (
            <>
              {/* 専用の絵があるテーマは、その絵をそのまま出す。
                  無いものは重ねる色のベタ（もとの見せ方） */}
              {theme.art ? (
                <Image
                  source={theme.art.src}
                  resizeMode="cover"
                  style={{ width: '100%', height: '100%' }}
                />
              ) : null}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: theme.art ? theme.tint : t9(theme),
                }}
              />
              {theme.effect ? <StageEffect effect={theme.effect} /> : null}
              {theme.glow ? <StageGlow glow={theme.glow} /> : null}
            </>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="lock" size={20} color={T.disabled} opacity={0.6} />
            </View>
          )}
        </View>
        <View style={{ padding: S.sm, gap: 3 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text
              style={[F.strong, { fontSize: 12.5, flex: 1, color: owned ? T.text : T.disabled }]}
              numberOfLines={1}>
              {owned ? theme.name : '？？？'}
            </Text>
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 9.5,
                color: RARITY_COLOR[theme.rarity],
              }}>
              {theme.rarity}
            </Text>
          </Row>
          {active ? <Badge tone="red">かざり中</Badge> : null}
        </View>
      </View>
    </Pressable>
  );
}

/* アバター1体のカード。プレビューは髪の色（3Dを並べると重いので出さない）。
   preparing＝モデルがまだ無いキャラ。名前は見せて、この先を予告する */
function AvatarCard({
  name,
  rarity,
  swatch,
  owned,
  active,
  preparing = false,
  onPress,
}: {
  name: string;
  /** null ＝ ノーマル（レア度なし） */
  rarity: Rarity | null;
  swatch: string;
  owned: boolean;
  active: boolean;
  preparing?: boolean;
  onPress: () => void;
}) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: owned });
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={!owned}
      style={{ width: '47%' }}>
      <View
        style={{
          borderWidth: active ? BW.bold : BW.line,
          borderColor: active ? C.ink900 : owned ? C.ink900 : T.borderSoft,
          borderRadius: R.sm,
          backgroundColor: owned ? T.surface : T.sunk,
          overflow: 'hidden',
          transform: [{ scale: pressed && owned ? 0.97 : 1 }],
        }}>
        <View style={{ height: 62, alignItems: 'center', justifyContent: 'center' }}>
          {owned || preparing ? (
            /* 髪（またはキャラの色）を丸で。上半分に光を入れてカプセルの流儀に揃える */
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: swatch,
                borderWidth: BW.line,
                borderColor: C.ink900,
                overflow: 'hidden',
                opacity: preparing ? 0.45 : 1,
              }}>
              <View
                style={{
                  height: 16,
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  borderTopLeftRadius: 19,
                  borderTopRightRadius: 19,
                }}
              />
            </View>
          ) : (
            <Icon name="lock" size={20} color={T.disabled} opacity={0.6} />
          )}
        </View>
        <View style={{ padding: S.sm, gap: 3 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text
              style={[F.strong, { fontSize: 12.5, flex: 1, color: owned ? T.text : T.disabled }]}
              numberOfLines={1}>
              {owned || preparing ? name : '？？？'}
            </Text>
            {rarity ? (
              <Text style={{ fontFamily: FONT.mono, fontSize: 9.5, color: RARITY_COLOR[rarity] }}>
                {rarity}
              </Text>
            ) : null}
          </Row>
          {active ? <Badge tone="red">つかい中</Badge> : preparing ? <Badge tone="paper">準備中</Badge> : null}
        </View>
      </View>
    </Pressable>
  );
}
