/* ============================================================
   オープニング。初回起動のときだけ出る「AI歴史絵巻」。

   ▍なにを待っているのか
   ストアからのダウンロードはOSの仕事なので、アプリからは見せられない。
   実際に待ちが出るのは**初回のアセット読み込み**——アバターのGLB（1.9MB）と
   そのテクスチャ、舞台の背景。放っておくとホームに着いてから読み込みが
   始まって、キャラが出るまで数秒かかる。

   そこでこの画面が**先に読み込んでしまう**。絵巻を1コマずつ見ているあいだに
   裏で終わらせ、終わったら「スキップ」を押せるようにする。飛ばした人も
   ホームでは待たされない。

   コマの中身は src/data/emaki.ts（サイトの /history から取り込んだもの。
   tools/sync-emaki.mjs が作る）。
   ============================================================ */
import { Asset } from 'expo-asset';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/icons';
import { Panel, Pill, Row, Screen, ScreenHead } from '@/components/ui';
import { AVATARS } from '@/data/avatars';
import { EMAKI } from '@/data/emaki';
import { STAGE } from '@/data/stage';
import { useProgress } from '@/store/progress';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

/** 冬の時代は寒色、ブームは暖色でコマの地を染める */
const TONE_BG = { winter: '#e7f0ff', boom: '#fff1db' } as const;

export default function OpeningScreen() {
  const router = useRouter();
  const { markOpeningSeen } = useProgress();
  const { height } = useWindowDimensions();
  const short = height < 700;

  const [i, setI] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const panel = EMAKI[i];
  const last = i === EMAKI.length - 1;

  /* ホームで使う重いものを、ここで先に落としておく。
     失敗しても先へ進ませる（読み込みはホーム側でもう一度試みられる） */
  React.useEffect(() => {
    let alive = true;
    const heavy = [STAGE, ...AVATARS.flatMap((a) => (a.model ? [a.model.glb, a.model.texture] : []))];
    Asset.loadAsync(heavy)
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const leave = () => {
    tap();
    markOpeningSeen();
    router.replace('/onboarding/avatar');
  };

  const header = (
    <ScreenHead
      compact={short}
      kicker="AI EMAKI — 75年のはなし"
      title="AIは、どこから来たか"
      size="md"
      right={
        /* 読み込みが終わるまでは飛ばせない。
           終わっていないと、ホームでキャラが出るのを待たされるだけなので */
        loaded ? (
          <Pressable onPress={leave} hitSlop={10}>
            <Row gap={4}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300, letterSpacing: 1 }}>
                スキップ
              </Text>
              <Icon name="play" size={11} color={C.ink300} />
            </Row>
          </Pressable>
        ) : (
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.ink300, letterSpacing: 0.6 }}>
            よみこみ中…
          </Text>
        )
      }
      note={`${i + 1} / ${EMAKI.length}`}
      noteRight={panel.year}
    />
  );

  return (
    <Screen scroll={false} header={header} tone="dots" edges={['bottom']}
      style={{ gap: short ? S.sm : S.md, padding: short ? S.sm : S.lg }}>
      {/* ———— コマ ———— */}
      <Panel
        fill
        surface={panel.tone ? TONE_BG[panel.tone] : T.surface}
        contentStyle={{ padding: 0, gap: 0 }}>
        {/* 余った高さは**絵に回す**。文章の下に空白を溜めるより、
            縦長の端末ほどコマ絵が大きくなるほうが絵巻らしい。
            minHeight は、文章が長いコマでも絵が潰れないための下限 */}
        <View style={{ flex: 1, minHeight: short ? 150 : 190 }}>
          <Image source={panel.image} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        </View>
        <View style={{ padding: short ? S.sm : S.md, gap: short ? 4 : 6 }}>
          <Row gap={8}>
            <Pill label={panel.year} />
            <Text style={[F.h2, { flex: 1, fontSize: short ? 15 : 17 }]} numberOfLines={2}>
              {panel.title}
            </Text>
          </Row>
          <Text
            style={[F.body, { fontSize: short ? 12.5 : 14, lineHeight: short ? 20 : 23 }]}
            numberOfLines={short ? 4 : 6}>
            {panel.body}
          </Text>
          {panel.hand ? (
            <Text style={[F.hand, { fontSize: short ? 12 : 13 }]} numberOfLines={2}>
              {panel.hand}
            </Text>
          ) : null}
        </View>
      </Panel>

      {/* ———— 進み具合 ———— */}
      <Row gap={4} style={{ justifyContent: 'center' }}>
        {EMAKI.map((_, n) => (
          <View
            key={n}
            style={{
              width: n === i ? 16 : 6,
              height: 6,
              borderRadius: R.full,
              backgroundColor: n === i ? T.accent : n < i ? T.border : T.borderSoft,
            }}
          />
        ))}
      </Row>

      {/* ———— 横ボタン ———— */}
      <Row gap={S.sm}>
        <ArrowButton
          icon="play"
          flip
          label="もどる"
          disabled={i === 0}
          onPress={() => {
            tap();
            setI((n) => Math.max(0, n - 1));
          }}
        />
        <ArrowButton
          icon="play"
          label={last ? 'はじめる' : 'つぎへ'}
          primary
          onPress={() => {
            tap();
            if (last) leave();
            else setI((n) => Math.min(EMAKI.length - 1, n + 1));
          }}
        />
      </Row>
    </Screen>
  );
}

/* 左右送りのボタン。矢印は play（三角）を回して使う
   （専用の矢印アイコンは作っていない。icons.tsx を増やすほどではない） */
function ArrowButton({
  icon,
  label,
  onPress,
  disabled,
  primary,
  flip,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  flip?: boolean;
}) {
  const [pressed, setPressed] = React.useState(false);
  const bg = disabled ? T.sunk : primary ? T.accent : T.surface;
  const fg = disabled ? T.disabled : primary ? C.paper0 : C.ink900;
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={{ flex: primary ? 1.6 : 1 }}>
      <View
        style={{
          backgroundColor: bg,
          borderWidth: BW.bold,
          borderColor: disabled ? T.borderSoft : T.border,
          borderRadius: R.sm,
          paddingVertical: 13,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: POP.sm,
          transform: [
            { translateX: pressed && !disabled ? 2 : 0 },
            { translateY: pressed && !disabled ? 2 : 0 },
          ],
        }}>
        <Row gap={7}>
          {flip ? <View style={{ transform: [{ rotate: '180deg' }] }}><Icon name={icon} size={13} color={fg} /></View> : null}
          <Text style={{ fontFamily: FONT.heading, fontSize: 15, color: fg, letterSpacing: 0.4 }}>
            {label}
          </Text>
          {flip ? null : <Icon name={icon} size={13} color={fg} />}
        </Row>
      </View>
      {!disabled ? (
        /* ベタ影。押すと本体が沈んで影が消える（サイトと同じ挙動） */
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: POP.sm,
            top: pressed ? 0 : POP.sm,
            right: -POP.sm,
            bottom: pressed ? POP.sm : 0,
            backgroundColor: T.border,
            borderRadius: R.sm,
            zIndex: -1,
          }}
        />
      ) : null}
    </Pressable>
  );
}
