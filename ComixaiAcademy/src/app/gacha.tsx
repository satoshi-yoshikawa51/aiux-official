/* ============================================================
   ガチャ。ガチャPを3枚入れてダイヤルを回すと、カプセルが落ちてくる。

   ▍マシンは絵で描く（画像を使わない）
   マンガのインク＋紙のデザインシステムそのままに、太い黒枠と
   ベタ影のViewで組む。ドームの中にはカプセルが詰まっていて、
   回すたびに1つ減って落ちてくる……ように見せる。

   ▍段取り
   ダイヤルが回る（カリカリ音）→ マシンが揺れる → カプセルが
   出口から落ちて弾む → タップで開ける → 景品がスタンプで出る。
   開けるまでを1タップ挟むのは、「何が出た？」の間を作るため。

   ▍景品は舞台テーマと、アバター（→ data/gacha.ts）
   アバターには「キャラ本体」（別モデル。おてんば・かんろく・先輩）と
   「色違い」（テクスチャ違い。せんぱい_金髪ver）の2種類があるが、
   どちらも**1体増える**体験なので同じ景品として扱う。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Easing, Image, Platform, Pressable, Text, View } from 'react-native';

import { Avatar3D } from '@/avatar/Avatar3D';
import { Icon } from '@/components/icons';
import { PopIn, SlideIn, Stamp, useSparkBurst, useTap } from '@/components/motion';
import { StageEffect, StageGlow } from '@/components/stage-effect';
import { Badge, Button, Panel, Pop, Row, Screen, Tap } from '@/components/ui';
import {
  AVATARS,
  DEFAULT_SKIN_ID,
  getAvatar,
  lookOfPrize,
  ownsAvatar,
  SKINS,
} from '@/data/avatars';
import { ExtraList } from '@/components/extra-list';
import { ShareRow } from '@/components/share-row';
import {
  DEFAULT_THEME_ID,
  DUPE_REFUND,
  GACHA_POOL,
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
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/* ドームの中に見えるカプセルの色。回すたびに減って見える */
const CAPSULE_COLORS = ['#e60012', '#1a6cff', '#f5b301', '#1fa463', '#f08c00', '#8a5cf6'];

type Phase = 'idle' | 'spinning' | 'dropped' | 'revealed';

export default function GachaScreen() {
  const { state, spinGacha, setTheme, setLook } = useProgress();
  const burst = useSparkBurst();
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [result, setResult] = React.useState<SpinResult | null>(null);

  /* ダイヤルの回転・マシンの揺れ・カプセルの落下 */
  const dial = React.useRef(new Animated.Value(0)).current;
  const shake = React.useRef(new Animated.Value(0)).current;
  const drop = React.useRef(new Animated.Value(0)).current;

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
    setPhase('spinning');
    playSound('start');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

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

  const open = (x: number, y: number) => {
    if (phase !== 'dropped' || !result) return;
    setPhase('revealed');
    burst(x, y, result.prize.rarity === 'SR' ? 2.6 : 1.8);
    playSound(result.prize.rarity === 'SR' ? 'badge' : 'clear');
    if (result.prize.rarity === 'SR') setTimeout(() => playSound('star'), 300);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const closeResult = () => {
    setResult(null);
    setPhase('idle');
  };

  const dialDeg = dial.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const shakeX = shake.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 5, -4, 3, 0],
  });
  /* 出口の高さぶん落として、弾ませる */
  const dropY = drop.interpolate({ inputRange: [0, 1], outputRange: [-46, 0] });

  /* 落ちてきたカプセルの色は、引いた景品のレア度で */
  const capsuleColor = result ? RARITY_COLOR[result.prize.rarity] : C.red500;

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

      {/* ———— マシン ———— */}
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ translateX: shakeX }], alignItems: 'center' }}>
          {/* ドーム */}
          <Pop radius={R.full} reserve={false}>
            <View
              style={{
                width: 190,
                height: 190,
                borderRadius: 95,
                backgroundColor: '#eef4ff',
                borderWidth: BW.heavy,
                borderColor: C.ink900,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}>
              {/* 中のカプセル。残りPが多いほど詰まって見える…わけではなく飾り */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  paddingBottom: 12,
                  paddingHorizontal: 16,
                  gap: 4,
                }}>
                {CAPSULE_COLORS.concat(CAPSULE_COLORS.slice(0, 3)).map((c, i) => (
                  <View
                    key={i}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: c,
                      borderWidth: BW.line,
                      borderColor: C.ink900,
                      /* 上半分に光を入れてカプセルらしく */
                      overflow: 'hidden',
                    }}>
                    <View
                      style={{
                        height: 15,
                        backgroundColor: 'rgba(255,255,255,0.55)',
                        borderTopLeftRadius: 17,
                        borderTopRightRadius: 17,
                      }}
                    />
                  </View>
                ))}
              </View>
              {/* ガラスの反射 */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 22,
                  width: 44,
                  height: 20,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.65)',
                  transform: [{ rotate: '-24deg' }],
                }}
              />
            </View>
          </Pop>

          {/* 胴体 */}
          <Pop radius={R.md} reserve={false} style={{ marginTop: -10 }}>
            <View
              style={{
                width: 210,
                borderRadius: R.md,
                backgroundColor: C.red500,
                borderWidth: BW.heavy,
                borderColor: C.ink900,
                alignItems: 'center',
                paddingVertical: S.md,
                gap: S.sm,
              }}>
              {/* ダイヤル。回すところ */}
              <Animated.View style={{ transform: [{ rotate: dialDeg }] }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: C.paper0,
                    borderWidth: BW.bold,
                    borderColor: C.ink900,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View
                    style={{
                      width: 44,
                      height: 12,
                      borderRadius: 4,
                      backgroundColor: C.ink900,
                    }}
                  />
                </View>
              </Animated.View>
              <Text style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: 2, color: C.paper50 }}>
                {SPIN_COST}P / 1回
              </Text>
              {/* 出口 */}
              <View
                style={{
                  width: 76,
                  height: 54,
                  borderTopLeftRadius: R.sm,
                  borderTopRightRadius: R.sm,
                  backgroundColor: C.ink900,
                  marginBottom: -S.md,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  overflow: 'visible',
                }}>
                {/* 落ちてくるカプセル。押すと開く */}
                {phase === 'dropped' || phase === 'spinning' ? (
                  <Animated.View
                    style={{
                      opacity: drop.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 1, 1] }),
                      transform: [{ translateY: dropY }],
                    }}>
                    <Pressable
                      disabled={phase !== 'dropped'}
                      accessibilityRole="button"
                      accessibilityLabel="カプセルを開ける"
                      onPress={(e) => open(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
                      <View
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 23,
                          backgroundColor: capsuleColor,
                          borderWidth: BW.bold,
                          borderColor: C.ink900,
                          overflow: 'hidden',
                          marginBottom: 3,
                        }}>
                        <View
                          style={{
                            height: 20,
                            backgroundColor: 'rgba(255,255,255,0.6)',
                            borderTopLeftRadius: 23,
                            borderTopRightRadius: 23,
                          }}
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                ) : null}
              </View>
            </View>
          </Pop>
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
                name={has ? a.name : '？？？'}
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
            backgroundColor: 'rgba(20,17,15,0.82)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: S.xl,
            zIndex: 20,
          }}>
          <Stamp tilt={-3}>
            <Panel contentStyle={{ alignItems: 'center', gap: S.sm, padding: S.xl }}>
              <Badge tone={result.prize.rarity === 'SR' ? 'yellow' : result.prize.rarity === 'R' ? 'blue' : 'ink'}>
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
                      <View style={{ flex: 1, backgroundColor: t9(theme) }} />
                      {theme.effect ? <StageEffect effect={theme.effect} /> : null}
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
          </Stamp>
        </Pressable>
      ) : null}
    </View>
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
            同じレア度・同じ種類の中では等確率です。すでに持っているものも出ます（そのときは
            {DUPE_REFUND}P返ります）。1回{SPIN_COST}P。
          </Text>
          {/* キャラにNが無いことは、隠さずに書いておく。
              「キャラが出にくい」と感じたときの答えがここにある */}
          <Text style={F.tiny}>
            キャラにはNがないので、Nを引いたときは必ず背景になります。
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
