/* ============================================================
   UI部品。サイトのデザインシステム（src/app/ds.tsx）の移植。

   ■ ポップシャドウについて
   サイトの box-shadow: 5px 5px 0 var(--ink-900) を、RNの shadow* で
   再現することはできない（iOS専用で、Androidは elevation のぼかし影に
   なってしまう）。そこで「同じ形のベタ塗りViewを裏にずらして敷く」
   方式にしている。これなら iOS / Android / Web で同じ絵が出る。
   ============================================================ */
import { Asset } from 'expo-asset';
import React from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import type { SoundName } from '@/lib/sound';
import { useTap } from '@/components/motion';
import { useTutorial } from '@/store/tutorial';
import { BW, C, F, FONT, POP, R, S, T } from '@/theme';

const TONE_DOTS = require('@/assets/images/tone-dots.png');
const TONE_DOTS_LIGHT = require('@/assets/images/tone-dots-light.png');
const TONE_LINES = require('@/assets/images/tone-lines.png');

/* ———————————————— スクリーントーン ————————————————
   ネイティブは ImageBackground の resizeMode="repeat" でタイルを敷ける。
   react-native-web は repeat に対応していないので、Webのときだけ
   CSSの background-repeat に落とす。 */

/** dots=黒い点（紙の上） / dots-light=白い点（黒地の上） */
export type ToneKind = 'none' | 'dots' | 'dots-light' | 'lines';

const toneSource = (t: ToneKind) =>
  t === 'dots' ? TONE_DOTS : t === 'dots-light' ? TONE_DOTS_LIGHT : TONE_LINES;

export function Tone({
  tone,
  style,
  children,
}: {
  tone: ToneKind;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  if (tone === 'none') return <View style={style}>{children}</View>;

  if (Platform.OS === 'web') {
    const a = Asset.fromModule(toneSource(tone));
    const web = {
      backgroundImage: `url(${a.uri})`,
      backgroundRepeat: 'repeat',
      backgroundSize: `${a.width ?? 9}px ${a.height ?? 9}px`,
    } as unknown as ViewStyle;
    return <View style={[style, web]}>{children}</View>;
  }

  return (
    <ImageBackground source={toneSource(tone)} resizeMode="repeat" style={style}>
      {children}
    </ImageBackground>
  );
}

/* ———————————————— ベタ塗りの影 ———————————————— */

export function Pop({
  children,
  offset = POP.md,
  radius = R.md,
  color = T.border,
  style,
  /** 影のぶんの余白を確保する（並べたときに次の要素と重ならない） */
  reserve = true,
}: {
  children: React.ReactNode;
  offset?: number;
  radius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  reserve?: boolean;
}) {
  return (
    <View style={[reserve && { marginRight: offset, marginBottom: offset }, style]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: offset,
          top: offset,
          right: -offset,
          bottom: -offset,
          backgroundColor: color,
          borderRadius: radius,
        }}
      />
      {children}
    </View>
  );
}

/* ———————————————— 画面 ———————————————— */

export function Screen({
  children,
  /** 画面上部に端まで敷く黒ベタの帯。ステータスバーの裏まで伸ばす */
  header,
  edges = ['top'],
  scroll = true,
  /** 紙（本文の地）に敷くスクリーントーン */
  tone = 'none',
  /** 網点の濃さ。薄くしたいときだけ 0.5 くらいを渡す */
  toneOpacity = 1,
  /** 画面下に貼り付けて動かさない帯。**先に進むボタン専用**。
      長い一覧の末尾にボタンを置くと、スクロールしないと見つからない
      （相棒えらびで実際に「どこで決めるのか分からない」が起きた）。
      ここに置いたぶんの高さは本文の下に自動で空ける */
  footer,
  style,
  onScroll,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  edges?: Edge[];
  scroll?: boolean;
  tone?: ToneKind;
  toneOpacity?: number;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** スクロールのたびに知りたい画面だけ渡す。
      ガチャは、画面に重ねた層のカプセルをマシンの口に合わせて置いていて、
      **スクロールでマシンだけが動くとカプセルが置き去りになる**。
      動いた瞬間に測り直せるよう、ScrollViewのイベントをそのまま通す */
  onScroll?: () => void;
}) {
  const insets = useSafeAreaInsets();
  /* 固定帯の高さは中身しだいなので、置いてから測る。
     決め打ちにすると、文字の大きさ設定を上げた端末で本文が隠れる */
  const [footerH, setFooterH] = React.useState(0);
  /* タブバーは内容に覆いかぶさらないので、下は素の余白でよい。
     スクロールする画面だけ、最後の要素が窮屈に見えないよう少し多めに取る */
  const bottomPad = scroll ? S.xxl : S.lg;

  /* ———— 案内パネルのぶんだけ下を空ける ————
     案内中はタブバーの上に説明のパネルが浮いている。**空けないと、
     案内が指している当のものをパネルが隠す**（ホームのカセットで実際に
     起きた）。paddingBottom ではなく高さのある箱を足しているのは、
     この下の style で padding をまるごと上書きしている画面があるため。
     光は枠の外へ14px出るので、そのぶんも足しておく */
  const { active: guiding, panelH } = useTutorial();
  const reserve = guiding && panelH > 0 ? panelH + S.lg : 0;

  /* 帯があるときは、帯自身がステータスバーぶんを飲み込むので
     SafeAreaView に上を任せない（任せると帯の上に紙の余白が出る） */
  const safeEdges = header ? edges.filter((e) => e !== 'top') : edges;

  /* 案内パネルと固定帯、どちらのぶんも下に空ける。
     空けないと、いちばん下の項目が帯の裏に隠れて**選べないように見える** */
  const spacerH = reserve + footerH;
  const spacer = spacerH > 0 ? <View style={{ height: spacerH }} /> : null;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.screenPad, { paddingBottom: bottomPad }, style]}
      onScroll={onScroll}
      /* onScroll を渡した画面だけ毎コマ欲しい。渡していない画面は既定のまま */
      scrollEventThrottle={onScroll ? 16 : undefined}
      showsVerticalScrollIndicator={false}>
      {children}
      {spacer}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, styles.screenPad, { paddingBottom: bottomPad }, style]}>
      {children}
      {spacer}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={safeEdges}>
      {header ? (
        <View style={{ backgroundColor: C.ink900, paddingTop: insets.top }}>{header}</View>
      ) : null}
      {/* 紙。網点はここだけに敷く（黒ベタの帯とタブバーには掛からない） */}
      <View style={{ flex: 1 }}>
        {tone !== 'none' && (
          <Tone tone={tone} style={[StyleSheet.absoluteFill, { opacity: toneOpacity }]} />
        )}
        {body}

        {/* 固定帯。紙と同じ色で塗り、上に線を引いて「ここから下は別」を出す。
            透かすと本文の文字が透けて読めなくなる */}
        {footer ? (
          <View
            onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: T.bg,
              borderTopWidth: BW.line,
              borderTopColor: T.border,
              paddingHorizontal: S.lg,
              paddingTop: S.md,
              paddingBottom: S.md,
            }}>
            {footer}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

/* ———————————————— 黒帯の中身 ————————————————
   Screen の header に渡すもの。全画面でこの形に揃える。

   ・キッカー（赤）と黄色いピルを1行目に
   ・見出しは白。左にアイコン、右に数字を置ける
   ・ゲージと、10pxのモノスペース1行まで

   帯そのものは枠もベタ影も付けない。下のタブバーと同じ黒で挟むことで、
   あいだが「紙」として立つ（浮いたカードにすると、この効きが消える）。 */

export function ScreenHead({
  kicker,
  title,
  icon,
  right,
  pill,
  progress,
  note,
  noteRight,
  size = 'lg',
  compact = false,
}: {
  kicker?: string;
  title: string;
  /** 見出しの左に置くアイコン */
  icon?: React.ReactNode;
  /** 見出しの右に置く数字など */
  right?: React.ReactNode;
  /** 黄色いピル。「次にやること」の印なので**1画面に1つだけ** */
  pill?: string;
  progress?: { value: number; total: number };
  note?: string;
  noteRight?: string;
  /** lg=ページの見出し / md=ホームの称号のように行が続くとき */
  size?: 'md' | 'lg';
  /** 背の低い画面。余白を詰めて本文に高さを回す */
  compact?: boolean;
}) {
  const noteFont = { fontFamily: FONT.mono, fontSize: 10, letterSpacing: 0.6 } as const;
  return (
    <View
      style={{
        paddingHorizontal: S.lg,
        paddingTop: compact ? 4 : S.sm,
        paddingBottom: compact ? S.sm : S.md,
        gap: compact ? 4 : 6,
      }}>
      {kicker || pill ? (
        <Row gap={8}>
          {pill ? <Pill label={pill} /> : null}
          {kicker ? <Text style={[F.kicker, { color: C.red100 }]}>{kicker}</Text> : null}
        </Row>
      ) : null}
      <Row gap={6}>
        {icon}
        <Text
          style={[size === 'lg' ? F.title : F.h2, { color: C.paper50, flex: 1 }]}
          numberOfLines={1}>
          {title}
        </Text>
        {right}
      </Row>
      {progress ? <Progress value={progress.value} total={progress.total} /> : null}
      {note || noteRight ? (
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[noteFont, { color: C.ink300 }]}>{note}</Text>
          {noteRight ? <Text style={[noteFont, { color: C.red100 }]}>{noteRight}</Text> : null}
        </Row>
      ) : null}
    </View>
  );
}

/* ———————————————— カード / コマ ———————————————— */

type CardTone = 'surface' | 'sunk' | 'accent' | 'ok' | 'warn' | 'ink';

const CARD_BG: Record<CardTone, string> = {
  surface: T.surface,
  sunk: T.sunk,
  accent: T.accentSoft,
  ok: T.okSoft,
  warn: T.warnSoft,
  ink: C.ink900,
};

export function Card({
  children,
  tone = 'surface',
  variant = 'pop',
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  tone?: CardTone;
  /** pop=太枠＋ベタ影 / flat=太枠のみ / soft=細枠のみ */
  variant?: 'pop' | 'flat' | 'soft';
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const body = (
    <View
      style={[
        {
          backgroundColor: CARD_BG[tone],
          borderWidth: variant === 'soft' ? BW.hair : BW.bold,
          borderColor: variant === 'soft' ? T.borderSoft : T.border,
          borderRadius: R.md,
          padding: S.lg,
          gap: S.sm,
        },
        contentStyle,
      ]}>
      {children}
    </View>
  );
  if (variant !== 'pop') return <View style={style}>{body}</View>;
  return (
    <Pop radius={R.md} style={style}>
      {body}
    </Pop>
  );
}

/** マンガのコマ。網点／斜線のトーンを敷ける。number はコマ番号 */
export function Panel({
  children,
  tone = 'none',
  surface = T.surface,
  bg,
  bgRatio,
  bgColor,
  bgHeight,
  bgDrop = 0,
  number,
  caption,
  tilt = 0,
  fill = false,
  shrink = false,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  tone?: ToneKind;
  /** コマの地の色。既定は白。C.ink800 のようにベタで沈めて
      tone="dots-light" を敷くと、黄と赤がいちばん強く出る */
  surface?: string;
  /** コマの地に敷く絵。中身はこの上に重なる */
  bg?: ImageSourcePropType;
  /** bg の縦横比（幅÷高さ）。渡すと**下端に揃えて**敷き、上のはみ出しは切る。
      コマの高さは端末で大きくぶれるので、床を残したい絵はこれを使う */
  bgRatio?: number;
  /** bg が届かない上側を埋める色。絵のいちばん上と同じ色にする */
  bgColor?: string;
  /** bg の高さ(px)を外から決める。**キャラの大きさに背景を連動させる**ために使う
      （→ (tabs)/index.tsx）。渡すとコマ幅に合わせる代わりにこの高さで敷き、
      幅は bgRatio から出して中央に置く。はみ出しはコマが切る */
  bgHeight?: number;
  /** bg をコマの下端からさらに何px沈めるか。**消失点（地平線）を下げる**ために使う。
      縦が足りない端末ではキャラが小さくなるが、地平線が高いままだと
      「部屋の中の小人」に見える。絵ごと沈めて地平線を目の高さに合わせると、
      同じ大きさでも「カメラが低いだけ」に読める（→ (tabs)/index.tsx） */
  bgDrop?: number;
  number?: string;
  caption?: string;
  /** 傾き（度）。±1〜3くらいが効く */
  tilt?: number;
  /** 縦に余っている分を埋める（1画面に収める画面で使う） */
  fill?: boolean;
  /** 縦が足りないときに縮んでよい。
      RNの既定は flexShrink: 0 なので、**途中のViewが1つでも縮まないと
      いちばん内側の flexShrink は効かない**。背の低い端末で
      1画面に収めたいコマは、これを立てて道をつなぐ */
  shrink?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const inner = (
    <View
      style={{
        backgroundColor: surface,
        borderWidth: BW.bold,
        borderColor: T.border,
        borderRadius: R.sm,
        overflow: 'hidden',
        ...(fill ? { flex: 1 } : null),
        ...(shrink ? { flexShrink: 1 } : null),
      }}>
      {bg ? (
        <>
          {bgColor ? <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} /> : null}
          {bgRatio && bgHeight ? (
            /* 高さを外から決める形。幅は比率から出して、**下端・中央**に置く。
               キャラの足元を軸に絵を伸び縮みさせるので、左右にはみ出す
               ぶんはコマの overflow:'hidden' が切る */
            <View
              style={{
                position: 'absolute',
                bottom: -bgDrop,
                left: '50%',
                width: bgHeight * bgRatio,
                height: bgHeight,
                marginLeft: -(bgHeight * bgRatio) / 2,
              }}>
              <Image source={bg} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            </View>
          ) : bgRatio ? (
            /* 縦横比は**外側のView**に持たせる。Image に直接 aspectRatio を
               書いても react-native-web は画像の自然サイズで高さを決めてしまい、
               効かない。上のはみ出しはコマの overflow:'hidden' が切る */
            <View
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, aspectRatio: bgRatio }}>
              <Image source={bg} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            </View>
          ) : (
            <Image
              source={bg}
              resizeMode="cover"
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            />
          )}
        </>
      ) : null}
      <Tone tone={tone} style={[{ padding: S.lg, gap: S.sm }, fill && { flex: 1 }, contentStyle]}>
        {children}
      </Tone>
      {number != null && (
        <View style={styles.panelNumber}>
          <Text style={styles.panelNumberText}>{number}</Text>
        </View>
      )}
      {caption ? (
        <View style={styles.panelCaption}>
          <Text style={[F.hand, { color: T.text }]}>{caption}</Text>
        </View>
      ) : null}
    </View>
  );
  return (
    <Pop
      radius={R.sm}
      style={[
        fill && { flex: 1 },
        shrink && { flexShrink: 1 },
        tilt ? { transform: [{ rotate: `${tilt}deg` }] } : null,
        style,
      ]}>
      {inner}
    </Pop>
  );
}

/* ———————————————— 次にやること ————————————————
   色の役割を画面ごとにブレさせないための2つ。

   赤 ＝ 押せるもの／黄 ＝ 次にやること／黒 ＝ 枠まわり／
   紙と網点 ＝ 地／白 ＝ キャラのコマとフキダシだけ

   黄色は**1画面に1つだけ**使う。2つ出た時点で「次」の意味が消える。 */

/** 黄色いピル。「次にやること」の印 */
export function Pill({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: C.yellow400,
          borderWidth: BW.bold,
          borderColor: T.border,
          borderRadius: R.full,
          paddingHorizontal: 9,
          paddingVertical: 2,
        },
        style,
      ]}>
      {/* ▍ここだけ文字の拡大に上限をつける
          端末の文字サイズ設定は本文には効かせたい。ただし丸い札の中の
          2〜3文字（NEXT / REVIEW）は、2倍まで伸びると札が折り返して
          隣の見出しを押し出す。**中身が飾りのものだけ**頭打ちにする */}
      <Text
        maxFontSizeMultiplier={1.3}
        style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 1, color: C.ink900 }}>
        {label}
      </Text>
    </View>
  );
}

/** ほぼ黒に沈めたコマ。白い網点が薄く乗る。
    黄と赤がいちばん強く出る地なので、その画面でいちばん押してほしいものを入れる。
    **中の文字とアイコンは白（C.paper50）にすること**（既定では黒のまま） */
export function Cassette({
  children,
  compact = false,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <Panel
      surface={C.ink800}
      tone="dots-light"
      style={style}
      contentStyle={[{ padding: compact ? S.sm : S.md, gap: compact ? 6 : S.sm }, contentStyle]}>
      {children}
    </Panel>
  );
}

/* ———————————————— 押した見た目 ————————————————
   **押せるものは全部、この2つのどちらかに揃える**。
   一部だけ返事があると、返事のないものが「効かない」ように見える。

   配線（沈み・触覚・星）は motion.tsx の useTap が持っている。
   ここにあるのは見た目だけ。 */

/** ベタ影のあるもの用。影の位置まで丸ごと落ちる。
    使う側は影のずらし量も `down ? 0 : POP.sm` にすること */
export const sinkPop = (down: boolean, depth: number = POP.sm) => ({
  transform: [
    { translateX: down ? depth : 0 },
    { translateY: down ? depth : 0 },
    { scale: down ? 0.98 : 1 },
  ],
});

/** 影のない平らなもの用（タブ・チップ・文字だけのもの）。
    落ちる先が無いので、きゅっと縮めて返事にする。
    **横に広いものほど控えめに**（画面幅いっぱいの行を0.92で縮めると、
    25pxも痩せてガタつく）。小さいものは 0.92、横長の行は 0.97 くらい */
export const sinkFlat = (down: boolean, scale = 0.92) => ({
  transform: [{ scale: down ? scale : 1 }],
});

/** 押した返事つきの Pressable。中身が押下状態を要らないとき用の手軽版。
    ベタ影を持たない「文字だけの押せるところ」（設定の項目、リンク、
    チュートリアルの とばす／つぎへ など）はこれで包む */
export function Tap({
  children,
  onPress,
  disabled,
  /** 星を出さない。消す・やめる など、**押して気持ちよくしたくない**ところ */
  sparks = true,
  scale = 0.94,
  hitSlop,
  /** 鳴らす音を変える／黙らせる。音を切る口そのものなど */
  sound,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  sparks?: boolean;
  scale?: number;
  hitSlop?: number;
  sound?: SoundName | 'none';
  style?: StyleProp<ViewStyle>;
}) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks, sound });
  return (
    <Pressable
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      hitSlop={hitSlop}
      style={style}>
      <View style={sinkFlat(pressed && !disabled, scale)}>{children}</View>
    </Pressable>
  );
}

/* ———————————————— ボタン ———————————————— */

type BtnVariant = 'primary' | 'secondary' | 'ink' | 'ghost' | 'yellow';

const BTN: Record<BtnVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: T.accent, fg: C.paper0, border: T.border },
  secondary: { bg: T.surface, fg: C.ink900, border: T.border },
  ink: { bg: C.ink900, fg: C.paper50, border: T.border },
  ghost: { bg: 'transparent', fg: C.ink900, border: 'transparent' },
  yellow: { bg: C.yellow400, fg: C.ink900, border: T.border },
};

/* 押しているあいだの地の色。スマホは指がボタンを覆うので、
   沈めるだけでは伝わらない。**指の外にはみ出している縁の色が変わる**のが
   いちばん確実に見える。サイトのホバー色（ds.tsx）と同じ考え方 */
const BTN_PRESS: Record<BtnVariant, string> = {
  primary: T.accentPress,
  secondary: C.paper100,
  ink: C.ink800,
  ghost: 'transparent',
  yellow: C.yellow200,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  /* 沈み・触覚・星をまとめて（motion.tsx の useTap） */
  const { pressed, onPressIn, onPressOut } = useTap({ scale: size === 'lg' ? 1.2 : 1 });
  /* 押せないボタンは**薄くせず、色を落とす**。全体を半透明にすると、
     紙に敷いた網点がボタンを透けて出てきて汚れて見える */
  const v = disabled
    ? { bg: T.sunk, fg: T.disabled, border: T.borderSoft }
    : BTN[variant];
  const dims = {
    sm: { fontSize: 14, py: 9, px: 14, radius: R.sm },
    md: { fontSize: 16, py: 13, px: 20, radius: R.sm },
    lg: { fontSize: 18, py: 16, px: 28, radius: R.md },
  }[size];
  const flat = variant === 'ghost';
  const down = pressed && !disabled && !flat;
  /* 押したら影を**0まで潰す**＝ボタンが影の位置まで落ちきる。
     サイトは1px残すが、スマホでは残すと落ちたのか分からない */
  const offset = flat || disabled ? 0 : down ? 0 : POP.sm;

  const face = (
    <View
      style={{
        backgroundColor: down ? BTN_PRESS[variant] : v.bg,
        borderWidth: BW.bold,
        borderColor: v.border,
        borderRadius: dims.radius,
        paddingVertical: dims.py,
        paddingHorizontal: dims.px,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontFamily: FONT.heading, fontSize: dims.fontSize, color: v.fg, letterSpacing: 0.4 }}>
        {label}
      </Text>
    </View>
  );

  return (
    <Pressable
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      /* 読み上げに「ボタン」と「押せるかどうか」を渡す。
         中の Text は Pressable の中に埋もれるので、名前は明示する */
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={style}>
      {flat ? (
        <View style={sinkFlat(pressed && !disabled)}>{face}</View>
      ) : (
        /* 押すと影が消え、ボタンが影のあった位置まで丸ごと落ちる。
           わずかに縮めているのは、指で隠れていても縁の動きで分かるように */
        <Pop offset={offset} radius={dims.radius} reserve={false} style={{ marginBottom: POP.sm }}>
          <View style={sinkPop(down)}>{face}</View>
        </Pop>
      )}
    </Pressable>
  );
}

/* ———————————————— バッジ / チップ ———————————————— */

type BadgeTone = 'ink' | 'red' | 'soft' | 'blue' | 'yellow' | 'green' | 'paper';

const BADGE: Record<BadgeTone, { bg: string; fg: string; bd: string }> = {
  ink: { bg: C.ink900, fg: C.paper50, bd: C.ink900 },
  red: { bg: C.red500, fg: '#fff', bd: C.ink900 },
  soft: { bg: C.red50, fg: C.red700, bd: C.red500 },
  blue: { bg: C.blue50, fg: C.blue600, bd: C.blue500 },
  yellow: { bg: C.yellow400, fg: C.ink900, bd: C.ink900 },
  green: { bg: C.green50, fg: C.green500, bd: C.green500 },
  paper: { bg: C.paper0, fg: C.ink900, bd: C.ink900 },
};

export function Badge({
  children,
  tone = 'ink',
  style,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}) {
  const t = BADGE[tone];
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: t.bg,
          borderWidth: BW.line,
          borderColor: t.bd,
          borderRadius: R.full,
          paddingHorizontal: 9,
          paddingVertical: 4,
        },
        style,
      ]}>
      {/* 札の中は「修了」「職種別」のような短い印。Pill と同じ理由で頭打ち */}
      <Text
        maxFontSizeMultiplier={1.3}
        style={{ fontFamily: FONT.heading, fontSize: 12, color: t.fg, letterSpacing: 0.3 }}>
        {children}
      </Text>
    </View>
  );
}

/** サイトの Tag（先頭に # が付く細枠チップ） */
export function Chip({
  children,
  active = false,
  style,
}: {
  children: React.ReactNode;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignSelf: 'flex-start',
          alignItems: 'center',
          backgroundColor: active ? C.ink900 : C.paper0,
          borderWidth: BW.hair,
          borderColor: C.ink900,
          borderRadius: R.full,
          paddingHorizontal: 11,
          paddingVertical: 6,
        },
        style,
      ]}>
      <Text style={{ fontFamily: FONT.body, fontSize: 13, color: active ? C.red100 : T.muted }}>#</Text>
      <Text style={{ fontFamily: FONT.body, fontSize: 13, color: active ? C.paper50 : T.body }}>
        {children}
      </Text>
    </View>
  );
}

/* ———————————————— フキダシ ———————————————— */

export function Bubble({
  text,
  variant = 'say',
  tail = 'bottom',
  style,
  font = 'hand',
  compact = false,
  numberOfLines,
}: {
  text: string;
  /** say=丸 / shout=強調（太枠・傾き） / think=考えごと（しっぽが丸） */
  variant?: 'say' | 'shout' | 'think';
  /** しっぽの向き。**しゃべっている人のほうへ向けること**。
      キャラが左横にいる画面（レッスン）は 'left'、
      キャラがフキダシの下にいる画面（ホーム）は既定の 'bottom' */
  tail?: 'bottom' | 'left';
  style?: StyleProp<ViewStyle>;
  font?: 'hand' | 'body';
  /** 画面の縦が足りないとき、文字と余白を詰めて高さを稼ぐ */
  compact?: boolean;
  numberOfLines?: number;
}) {
  const shout = variant === 'shout';
  const think = variant === 'think';
  return (
    <View style={style}>
      <Pop offset={POP.sm} radius={shout ? R.md : R.bubble} reserve={false}>
        <View
          style={{
            backgroundColor: T.surface,
            borderWidth: shout ? BW.heavy : BW.bold,
            borderColor: T.border,
            borderRadius: shout ? R.md : R.bubble,
            paddingVertical: compact ? S.sm : S.md,
            paddingHorizontal: compact ? S.md : S.lg,
          }}>
          <Text
            numberOfLines={numberOfLines}
            style={
              font === 'hand'
                ? {
                    fontFamily: FONT.hand,
                    fontSize: shout ? 19 : compact ? 13.5 : 16,
                    lineHeight: shout ? 29 : compact ? 21 : 27,
                    color: T.text,
                  }
                : { fontFamily: FONT.body, fontSize: compact ? 13 : 15, lineHeight: compact ? 21 : 26, color: T.text }
            }>
            {text}
          </Text>
        </View>
      </Pop>
      {think ? (
        <>
          <View style={[styles.thinkDot, { width: 14, height: 14, bottom: -10, left: 30 }]} />
          <View style={[styles.thinkDot, { width: 8, height: 8, bottom: -22, left: 22 }]} />
        </>
      ) : tail === 'left' ? (
        <>
          <View style={styles.tailLeftOuter} />
          <View style={styles.tailLeftInner} />
        </>
      ) : (
        <>
          <View style={styles.tailOuter} />
          <View style={styles.tailInner} />
        </>
      )}
    </View>
  );
}

/* ▍かつてここに SectionHead（紙の上に置く「キッカー＋見出し＋ひとこと」）が
   あった。画面の見出しは黒帯（ScreenHead）に移したので、紙の上に同じものを
   置くと見出しが2つになる。**戻さないこと**。
   コマの中の小見出しは F.h1 をそのまま使えばいい。 */

/* ———————————————— その他 ———————————————— */

export function Progress({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    /* 進み具合は色の長さでしか出ていないので、読み上げには数で渡す */
    <View
      style={styles.barTrack}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${total}本中 ${value}本`}
      accessibilityValue={{ min: 0, max: total, now: value }}>
      <View style={[styles.barFill, { width: `${pct}%` }]} />
    </View>
  );
}

export function Row({
  children,
  style,
  gap = S.sm,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/** 押せる行。押すと少し沈む（カード全体がボタンのとき用） */
export function PressCard({
  children,
  onPress,
  disabled,
  selected,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { pressed, onPressIn, onPressOut } = useTap();
  const down = pressed && !disabled;
  return (
    <Pressable
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      /* 名前は中の文字がそのまま読まれる（レッスン名・職種名など）。
         ここで渡すのは「押せる」「いま選ばれている」だけ */
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}>
      <Pop
        offset={down ? 0 : POP.sm}
        radius={R.md}
        color={disabled ? T.borderSoft : T.border}
        reserve={false}
        style={{ marginBottom: POP.sm }}>
        <View
          style={[
            {
              /* 使えないカードも**地は不透明のまま**にする。
                 Pressable 全体を薄くすると、紙に敷いた網点がカードを
                 透けて出てきて汚れて見える。薄くするのは中身だけ */
              backgroundColor: disabled ? T.sunk : down ? T.sunk : selected ? T.accentSoft : T.surface,
              borderWidth: selected ? BW.bold : BW.line,
              borderColor: disabled ? T.borderSoft : T.border,
              borderRadius: R.md,
              padding: S.md,
            },
            style,
            sinkPop(down),
          ]}>
          <View style={{ opacity: disabled ? 0.45 : 1 }}>{children}</View>
        </View>
      </Pop>
    </Pressable>
  );
}

export function Muted({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[F.small, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  screenPad: { padding: S.lg, gap: S.xl },

  panelNumber: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: C.ink900,
    paddingHorizontal: 11,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomRightRadius: R.sm,
  },
  panelNumberText: { fontFamily: FONT.display, fontSize: 18, lineHeight: 20, color: C.paper50 },
  panelCaption: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    maxWidth: '70%',
    backgroundColor: C.paper0,
    borderWidth: BW.line,
    borderColor: C.ink900,
    borderRadius: R.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  barTrack: {
    height: 14,
    borderRadius: R.full,
    backgroundColor: T.sunk,
    borderWidth: BW.line,
    borderColor: T.border,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: T.accent },

  /* フキダシのしっぽ：インク色の三角の上に紙色の三角を重ねて縁取りにする */
  tailOuter: {
    position: 'absolute',
    bottom: -16,
    left: 28,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: T.border,
  },
  tailInner: {
    position: 'absolute',
    bottom: -10,
    left: 31,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: T.surface,
  },
  /* 左向きのしっぽ。左横にいるキャラの口元（下寄り）から出す */
  tailLeftOuter: {
    position: 'absolute',
    left: -16,
    bottom: 18,
    width: 0,
    height: 0,
    borderTopWidth: 11,
    borderBottomWidth: 11,
    borderRightWidth: 18,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: T.border,
  },
  tailLeftInner: {
    position: 'absolute',
    left: -10,
    bottom: 21,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: T.surface,
  },
  thinkDot: {
    position: 'absolute',
    backgroundColor: T.surface,
    borderWidth: BW.line,
    borderColor: T.border,
    borderRadius: R.full,
  },
});
