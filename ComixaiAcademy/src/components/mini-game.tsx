/* ============================================================
   ミニゲーム。レッスンの中の体験を、**別画面として**立ち上げる。

   ▍なぜ別画面にするのか
   本文カードの中に入力欄が生えているだけだと、見た目をどう飾っても
   「読み物の続き」にしか見えない。手を動かすところは、
   **入る前と出たあとで画面ごと変わる**ほうがゲームになる。

   なのでここでは：
   ・全画面（Modal）で開く。レッスンの進み具合バーも先生も出さない
   ・地を黒に沈める。紙（レッスン）と地続きに見せない
   ・入りはタイルがパパパパッと並んで画面を埋める。ここでレッスンが消える
   ・埋まってからタイトルが動く。読ませるためではなく、**切り替わりの合図**
   ・終わると CLEAR が降ってきて、星が舞い、押して戻る

   先生を出していないのは意図。ここは説明を聞く場ではなく手を動かす場で、
   フキダシがあると目線がそちらへ行く。戻ればレッスンの先生がいる。

   ▍演出の部品は motion.tsx にある
   跳ね方（サイトのトークナイザーと同じ 0.3→1.1→1）もそちら。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
import {
  Bump,
  PopIn,
  SlideIn,
  SparkLayer,
  Stamp,
  TileIn,
  useSparkBurst,
  useTap,
} from '@/components/motion';
import { BuildPlay } from '@/components/games/build-game';
import { FindPlay } from '@/components/games/find-game';
import { FitPlay } from '@/components/games/fit-game';
import { OrderPlay } from '@/components/games/order-game';
import {
  allowLabel,
  starsOf,
  timeLabel,
  useGameClock,
  type GameScore,
} from '@/components/games/score';
import { SortPlay } from '@/components/games/sort-game';
import { sinkFlat, Tone } from '@/components/ui';
import type { LessonInteractive } from '@/data/types';
import { gradePrompt, type GradeResult } from '@/lib/grade';
import { loadTokenizer, toChips, type TokenChip } from '@/lib/tokenizer';
import { BW, C, F, FONT, R, S, T } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/** 打つたびに数えると重いので、少し落ち着いてから数える */
const DEBOUNCE_MS = 140;
/** チップが1枚ずつずれて出るときの間隔。サイトと同じ28ms、頭打ちも同じ400ms */
const CHIP_STEP_MS = 28;
const CHIP_STEP_MAX = 400;
/** タイトルを見せている時間。**待たせすぎない**。押せば飛ばせる。
    前にタイル演出が0.6秒ほど入るので、そのぶん短くしてある */
const TITLE_MS = 1300;

export interface GameMeta {
  name: string;
  icon: IconName;
  rule: string;
  /** 遊び方の1行。タイトルの下に出る */
  how: string;
}

export const GAME: Record<LessonInteractive['kind'], GameMeta> = {
  sort: {
    name: '仕分け',
    icon: 'target',
    rule: '2つの箱に振り分ける',
    how: '1枚ずつ出てくる札を、左右どちらの箱に入れるか決めます',
  },
  find: {
    name: '検問',
    icon: 'shield',
    rule: '危ない行を見つける',
    how: '文書を読んで、あやしい行をタップして摘発します',
  },
  build: {
    name: '指示を組む',
    icon: 'hammer',
    rule: '部品を選んで指示にする',
    how: '札を選ぶたびに、AIの返しがその場で変わります',
  },
  order: {
    name: '手順を組む',
    icon: 'compass',
    rule: '正しい順に並べる',
    how: '「つぎにやること」を選んでいくと、手順が組み上がります',
  },
  fit: {
    name: 'つくえの上',
    icon: 'folder',
    rule: '限られた広さに詰める',
    how: 'AIの作業机は狭い。要るものだけを載せてください',
  },
  tokenizer: {
    name: 'トークナイザー',
    icon: 'pen',
    rule: 'AIの切れ目を見る',
    how: '好きに打つと、AIから見た区切りが出ます。合否はありません',
  },
  'token-budget': {
    name: 'トークン収め',
    icon: 'target',
    rule: '決められた幅に収める',
    how: '書いて削って、決められたトークン数に収めてください',
  },
  'ai-prompt': {
    name: 'AIに指示を出す',
    icon: 'bulb',
    rule: '書いて、渡して、採点される',
    how: '本物のAIに指示を渡します。返ってきたものと指示が採点されます',
  },
};

type Phase = 'title' | 'play' | 'clear';

/* 何回まで外して通れるか。ゲームごとの既定値はここに1か所だけ置く。
   タイトル画面と入口カードが、始める前にこれを出す
   （同じ「MINI GAME」の看板で難度が3段階違うのに、
   プレイヤーからは見えない、というのが元の状態だった） */
export function allowOf(spec: LessonInteractive): number {
  switch (spec.kind) {
    case 'sort':
      return spec.allow;
    case 'find':
      return spec.allow ?? 1;
    case 'build':
      return spec.allow ?? 1;
    case 'order':
      return spec.allow ?? 2;
    case 'fit':
      return spec.allow ?? 2;
    case 'ai-prompt':
      return 2;
    default:
      /* 合否の無いもの（トークナイザー）と、通るまで書き直せるもの */
      return 0;
  }
}

/** ★の出ないゲーム。ここに入るものは成績を記録しない */
export function hasStars(kind: LessonInteractive['kind']): boolean {
  return kind !== 'tokenizer' && kind !== 'token-budget';
}

export function MiniGame({
  spec,
  onClose,
  onCleared,
  best = null,
}: {
  spec: LessonInteractive;
  onClose: () => void;
  /** これまでの自己ベストの★。無ければ null。クリア画面で更新を出す */
  best?: number | null;
  /** 合否のあるゲームを通ったとき。レッスン側の通せんぼを解き、成績を記録する */
  onCleared: (score: GameScore) => void;
}) {
  const insets = useSafeAreaInsets();
  const g = GAME[spec.kind];
  const [phase, setPhase] = React.useState<Phase>('title');
  /* やり直すたびに増やす。中身のstateを丸ごと作り直すための鍵 */
  const [round, setRound] = React.useState(0);
  /* タイルが画面を覆い終わったか。覆うまでは中身を出さない */
  const [covered, setCovered] = React.useState(false);

  /* タイトルは自動で終わる。押したら飛ばせる。
     数え始めるのは**タイルが覆い終わってから**。先に数え始めると、
     タイルを見ているあいだにタイトルの持ち時間が減っていく */
  React.useEffect(() => {
    if (phase !== 'title' || !covered) return;
    const t = setTimeout(() => setPhase('play'), TITLE_MS);
    return () => clearTimeout(t);
  }, [phase, covered]);

  /* 通ったときの成績。★の数と自己ベストの判定に使う */
  const [score, setScore] = React.useState<GameScore | null>(null);

  const clear = React.useCallback(
    (s: GameScore) => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setScore(s);
      onCleared(s);
      setPhase('clear');
    },
    [onCleared],
  );

  /* ▍もう一度やる口を、クリア画面に置く
     ★3を取りにいく人と、外して悔しい人の両方がここで戻る。
     ラウンドの鍵を進めて中身を作り直す（同じ画面のまま state だけ消す） */
  const retry = React.useCallback(() => {
    setScore(null);
    setRound((r) => r + 1);
    setPhase('play');
  }, []);

  /* ▍入りはタイル。Modal の fade は使わない
     ふわっと重なると、レッスンの上にもう1枚乗ったようにしか見えない。
     四角がパパパパッと並んで画面を埋めるほうが「始まる」感じが出る。

     そのため transparent＝下のレッスンを見せたまま、タイルで塗り潰す。
     タイルの色は覆ったあとに出す地（ink900）と同じなので、
     覆い終わって中身に差し替わっても、色が変わったようには見えない。

     Modal は**1つのまま**中身だけ差し替える。transparent は端末に出す
     ときに効くもので、あとから切り替えても反映されないことがある */
  return (
    <Modal visible animationType="none" transparent onRequestClose={onClose}>
      {!covered ? (
        <TileIn color={C.ink900} onDone={() => setCovered(true)} />
      ) : (
        /* Modal は別の窓なので、根元（_layout.tsx）の星の層は届かない。
           ゲームの中の星はここが描く */
        <SparkLayer>
        <View style={{ flex: 1, backgroundColor: C.ink900 }}>
          {/* 地は黒＋白い網点。紙（レッスン）と地続きに見せない */}
          <Tone tone="dots-light" style={{ flex: 1 }}>
            {phase === 'title' ? (
              <TitleScreen meta={g} allow={allowOf(spec)} onSkip={() => setPhase('play')} />
            ) : (
              <View style={{ flex: 1, paddingTop: insets.top }}>
                <GameBar meta={g} onClose={onClose} />
                {phase === 'clear' ? (
                  <ClearScreen meta={g} score={score} best={best} onClose={onClose} onRetry={retry} />
                ) : spec.kind === 'sort' ? (
                  <GameScroll>
                    <SortPlay key={round} spec={spec} onClear={clear} />
                  </GameScroll>
                ) : spec.kind === 'find' ? (
                  <GameScroll>
                    <FindPlay key={round} spec={spec} onClear={clear} />
                  </GameScroll>
                ) : spec.kind === 'build' ? (
                  <GameScroll>
                    <BuildPlay key={round} spec={spec} onClear={clear} />
                  </GameScroll>
                ) : spec.kind === 'order' ? (
                  <GameScroll>
                    <OrderPlay key={round} spec={spec} onClear={clear} />
                  </GameScroll>
                ) : spec.kind === 'fit' ? (
                  <GameScroll>
                    <FitPlay key={round} spec={spec} onClear={clear} />
                  </GameScroll>
                ) : spec.kind === 'ai-prompt' ? (
                  <AiPromptPlay key={round} spec={spec} onClear={clear} />
                ) : (
                  <TokenPlay
                    spec={spec}
                    onClear={clear}
                    /* 合否の無いゲーム（トークナイザー）は「わかった」で終わり。
                       CLEAR画面は出さないが、**遊んだ印は付ける**ので
                       レッスンに戻ったとき入口にCLEARが出る */
                    onFinish={() => {
                      /* 合否の無いゲーム。★は出さないので満点で通す */
                      onCleared({ misses: 0, allow: 0, ms: 0 });
                      onClose();
                    }}
                  />
                )}
              </View>
            )}
          </Tone>
        </View>
        </SparkLayer>
      )}
    </Modal>
  );
}

/* 指1本のゲーム共通の器。中身が縦に伸びるので、スクロールさせる。
   下は少し多めに空ける（決めるボタンが画面の縁に貼り付くと押しにくい） */
function GameScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

/* ———————————————— 入りのタイトル ————————————————
   読ませるためではなく、**画面が切り替わったことを分からせる**ため。
   だから短い。1.7秒で勝手に終わるし、押せばすぐ飛ぶ。 */

function TitleScreen({
  meta,
  allow,
  onSkip,
}: {
  meta: GameMeta;
  allow: number;
  onSkip: () => void;
}) {
  /* 合否の無いゲームには出さない */
  const allowStars = allow > 0;
  /* 黄色い下線が左から伸びる。名前が着地したあとに走らせる */
  const line = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const a = Animated.timing(line, {
      toValue: 1,
      duration: 420,
      delay: 380,
      easing: Easing.out(Easing.cubic),
      /* 幅はネイティブドライバに載らない */
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [line]);

  return (
    <Pressable
      onPress={onSkip}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, gap: S.sm }}>
      <SlideIn from="bottom" distance={-18} duration={300}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 3, color: C.yellow400 }}>
          MINI GAME
        </Text>
      </SlideIn>

      {/* 名前は横から飛び込んで、行き過ぎてから止まる */}
      <PopIn delay={120}>
        <Text
          style={{
            fontFamily: FONT.display,
            fontSize: 34,
            lineHeight: 46,
            color: C.paper0,
            textAlign: 'center',
          }}>
          {meta.name}
        </Text>
      </PopIn>

      <Animated.View
        style={{
          height: 5,
          borderRadius: R.full,
          backgroundColor: C.yellow400,
          width: line.interpolate({ inputRange: [0, 1], outputRange: [0, 132] }),
        }}
      />

      <SlideIn from="bottom" distance={14} duration={340} delay={620}>
        <Text style={[F.hand, { fontSize: 14, color: C.paper100, textAlign: 'center' }]}>
          {meta.how}
        </Text>
      </SlideIn>

      {/* ▍難度は、始める前に言う
          同じ「MINI GAME」の看板で、通れるミスの数が0〜2までばらついている。
          プレイヤーから見えないと、厳しいほうが理不尽に感じる */}
      {allow > 0 || allowStars ? (
        <SlideIn from="bottom" distance={14} duration={340} delay={760}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: BW.line,
              borderColor: C.ink700,
              borderRadius: R.full,
              paddingHorizontal: S.md,
              paddingVertical: 6,
              marginTop: S.xs,
            }}>
            <Icon name="bang" size={12} color={C.red500} />
            <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 0.8, color: C.paper100 }}>
              {allowLabel(allow)}
            </Text>
            <Icon name="star" size={12} color={C.yellow400} />
            <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 0.8, color: C.paper100 }}>
              ノーミスで★3
            </Text>
          </View>
        </SlideIn>
      ) : null}

      <SlideIn from="bottom" distance={10} duration={300} delay={1000} style={{ marginTop: S.lg }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 2, color: C.ink300 }}>
          TAP TO START
        </Text>
      </SlideIn>
    </Pressable>
  );
}

/* ———————————————— 上の帯 ————————————————
   レッスンの黒帯と同じ役だが、こちらは**ゲームの名前とやめる口だけ**。
   進み具合も称号も出さない。ゲーム中に見せる意味がない */

function GameBar({ meta, onClose }: { meta: GameMeta; onClose: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: S.sm,
        paddingHorizontal: S.lg,
        paddingTop: S.sm,
        paddingBottom: S.md,
        borderBottomWidth: BW.line,
        borderBottomColor: C.ink800,
      }}>
      <Icon name={meta.icon} size={17} color={C.yellow400} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT.heading, fontSize: 15, color: C.paper50 }}>{meta.name}</Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: 1, color: C.ink300 }}>
          {meta.rule}
        </Text>
      </View>
      <QuitButton onPress={onClose} />
    </View>
  );
}

/* やめる。**ここは星を出さない**。ゲームをやめる口なので、
   押して気持ちいいものにしてはいけない。文字が白く起きるだけにする */
function QuitButton({ onPress }: { onPress: () => void }) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light' });
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      hitSlop={10}
      style={{ paddingVertical: 6, paddingHorizontal: 4 }}>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          letterSpacing: 1,
          color: pressed ? C.paper50 : C.ink300,
        }}>
        やめる
      </Text>
    </Pressable>
  );
}

/* ———————————————— 通ったあと ———————————————— */

function ClearScreen({
  meta,
  score,
  best,
  onClose,
  onRetry,
}: {
  meta: GameMeta;
  score: GameScore | null;
  /** これまでの自己ベストの★ */
  best: number | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  /* スタンプが落ちた瞬間から星を散らす。**★3のときだけ多く撒く**。
     毎回同じだけ撒くと、通したこと自体の重みが一定になってしまう */
  const burst = useSparkBurst();
  const { width, height } = useWindowDimensions();
  const stars = score ? starsOf(score.misses) : 3;
  const perfect = stars >= 3;
  /* 自己ベストを更新したか。**同点は更新にしない**（毎回出ると意味が薄れる） */
  const renewed = best !== null && stars > best;

  React.useEffect(() => {
    const times = perfect ? [260, 620, 980, 1340] : [260, 900];
    const ids = times.map((ms) =>
      setTimeout(() => burst(width / 2, height / 2 - 60, perfect ? 2.6 : 1.8), ms),
    );
    return () => ids.forEach(clearTimeout);
  }, [burst, width, height, perfect]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, gap: S.md }}>
      <Stamp tilt={-6}>
        <View
          style={{
            borderWidth: 4,
            borderColor: C.yellow400,
            borderRadius: R.md,
            paddingHorizontal: S.xl,
            paddingVertical: S.sm,
          }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 40, lineHeight: 52, color: C.yellow400 }}>
            CLEAR
          </Text>
        </View>
      </Stamp>

      {/* ★。ミスの数だけで決まる（タイムでは変わらない） */}
      {score ? (
        <SlideIn from="bottom" distance={14} delay={340}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <Icon
                key={i}
                name="star"
                size={30}
                color={i < stars ? C.yellow400 : C.ink700}
              />
            ))}
          </View>
        </SlideIn>
      ) : null}

      <SlideIn from="bottom" distance={14} delay={460}>
        <Text style={[F.hand, { fontSize: 15, color: C.paper100, textAlign: 'center' }]}>
          {perfect ? `${meta.name}、ノーミス突破。` : `${meta.name}、突破。`}
        </Text>
      </SlideIn>

      {/* 成績。タイムは記録としてだけ出す（★には効かない） */}
      {score ? (
        <SlideIn from="bottom" distance={14} delay={560}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.ink300, letterSpacing: 0.6 }}>
            MISS {score.misses} / {score.allow}
            {score.ms > 0 ? `   ${timeLabel(score.ms)}` : ''}
          </Text>
        </SlideIn>
      ) : null}

      {renewed ? (
        <SlideIn from="bottom" distance={14} delay={660}>
          <Text style={{ fontFamily: FONT.heading, fontSize: 13, color: C.yellow400 }}>
            自己ベスト更新
          </Text>
        </SlideIn>
      ) : null}

      <SlideIn from="bottom" distance={14} delay={760} style={{ marginTop: S.md, gap: S.sm }}>
        <GameButton label="レッスンに戻る" onPress={onClose} />
        {/* ▍★3でないときだけ、もう一度を目立たせる
            満点で終えた人にやり直しを勧めても意味がない */}
        {!perfect ? (
          <GameButton label="★3をねらう" tone="ghost" onPress={onRetry} />
        ) : null}
      </SlideIn>
    </View>
  );
}

/* 黒地の上のボタン。黄色がいちばん強く出る */
function GameButton({
  label,
  onPress,
  disabled,
  tone = 'yellow',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'yellow' | 'ghost';
}) {
  const yellow = tone === 'yellow';
  /* ここは押しても何も起きなかった。ゲームの中でいちばん叩くボタンなので、
     紙の上の Button と同じだけ手ごたえを付ける（motion.tsx の useTap）。
     黒地なので星がいちばん効く */
  const { pressed, onPressIn, onPressOut } = useTap();
  const down = pressed && !disabled;

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} disabled={disabled}>
      <View
        style={{
          /* 押しているあいだは一段沈んだ黄色に。黒地なので、
             縁の色が変わるだけでもはっきり分かる */
          backgroundColor: disabled
            ? C.ink800
            : yellow
              ? down
                ? C.yellow200
                : C.yellow400
              : down
                ? C.ink800
                : 'transparent',
          borderWidth: BW.bold,
          borderColor: disabled ? C.ink700 : yellow ? (down ? C.yellow200 : C.yellow400) : C.paper100,
          borderRadius: R.sm,
          paddingVertical: 13,
          paddingHorizontal: S.xl,
          alignItems: 'center',
          transform: [{ translateY: down ? 2 : 0 }, { scale: down ? 0.97 : 1 }],
        }}>
        <Text
          style={{
            fontFamily: FONT.heading,
            fontSize: 15,
            letterSpacing: 0.4,
            color: disabled ? C.ink500 : yellow ? C.ink900 : C.paper50,
          }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/* 例文のチップ。細かいので星は出さない（横に並んだ小さいものから
   毎回9つ飛ぶと、何を押したのか分からなくなる）。縮みと触覚だけ */
function PresetChip({ text, onPick }: { text: string; onPick: () => void }) {
  const { pressed, onPressIn, onPressOut } = useTap({ sparks: false, haptic: 'light' });
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPick}>
      <View
        style={[
          {
            borderWidth: BW.line,
            borderColor: pressed ? C.yellow400 : C.ink700,
            backgroundColor: pressed ? C.ink800 : 'transparent',
            borderRadius: R.full,
            paddingHorizontal: 11,
            paddingVertical: 6,
          },
          sinkFlat(pressed),
        ]}>
        <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: C.paper100 }} numberOfLines={1}>
          {text.length > 18 ? text.slice(0, 18) + '…' : text}
        </Text>
      </View>
    </Pressable>
  );
}

/* ———————————————— 目標のゲージ ————————————————
   「あと何トークン」を字で言うだけだと近づいている感じが出ない。
   目標の帯へ伸びていくのを見せる。黒地なので線は明るい色で引く */

function Gauge({ count, min, max, ok }: { count: number; min: number; max: number; ok: boolean }) {
  /* 上限の少し先まで目盛りを取る。行き過ぎたことも見えるようにするため */
  const span = max * 1.5;
  const w = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(w, {
      toValue: Math.min(1, count / span),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [count, span, w]);

  return (
    <View style={{ gap: 5 }}>
      <View
        style={{
          height: 18,
          borderRadius: R.full,
          borderWidth: BW.line,
          borderColor: C.ink700,
          backgroundColor: C.ink800,
          overflow: 'hidden',
        }}>
        <View
          style={{
            position: 'absolute',
            left: `${(min / span) * 100}%` as `${number}%`,
            width: `${((max - min) / span) * 100}%` as `${number}%`,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(31, 164, 99, 0.35)',
            borderLeftWidth: BW.line,
            borderRightWidth: BW.line,
            borderColor: T.ok,
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: ok ? T.ok : C.red500,
            opacity: ok ? 1 : 0.75,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9.5, color: C.ink300 }}>0</Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9.5, color: T.ok }}>
          {min} — {max}
        </Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9.5, color: C.ink300 }}>
          {Math.round(span)}
        </Text>
      </View>
    </View>
  );
}

/* ———————————————— トークン系のプレイ画面 ———————————————— */

function TokenPlay({
  spec,
  onClear,
  onFinish,
}: {
  spec: Extract<LessonInteractive, { kind: 'tokenizer' | 'token-budget' }>;
  /** 合否のあるゲームを通った（CLEAR画面へ） */
  onClear: (score: GameScore) => void;
  /** 合否の無いゲームを見終わった（そのまま閉じる） */
  onFinish: () => void;
}) {
  const budget = spec.kind === 'token-budget' ? spec : null;

  const [text, setText] = React.useState('');
  const [chips, setChips] = React.useState<TokenChip[]>([]);
  const [count, setCount] = React.useState(0);
  const [ready, setReady] = React.useState(false);

  /* 何枚目から先が「新しく増えたぶん」か。ここから右だけを跳ねさせる
     （全部跳ねさせると、1文字打つたびに画面が波打って読めない） */
  const prevChips = React.useRef(0);

  React.useEffect(() => {
    let alive = true;
    loadTokenizer()
      .then(() => alive && setReady(true))
      .catch(() => {
        /* 表が読めなくても、ゲーム自体は開いたままにする */
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      loadTokenizer()
        .then((enc) => {
          const ids = enc.encode(text);
          setChips((old) => {
            prevChips.current = old.length;
            return toChips(ids, enc);
          });
          setCount(ids.length);
        })
        .catch(() => {});
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text, ready]);

  const ok = !!budget && count >= budget.min && count <= budget.max;

  const presets = spec.presets ?? [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.md }} keyboardShouldPersistTaps="handled">
        {/* お題 */}
        {budget ? (
          <SlideIn from="right" distance={22} duration={320}>
            <View
              style={{
                backgroundColor: C.yellow400,
                borderRadius: R.sm,
                padding: S.md,
                gap: S.sm,
              }}>
              <Text
                style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.ink900 }}>
                {budget.min}〜{budget.max} トークンに収める
              </Text>
              <Text style={{ fontFamily: FONT.heading, fontSize: 15, color: C.ink900 }}>
                {budget.brief}
              </Text>
            </View>
          </SlideIn>
        ) : null}

        {/* 打つところ。ここだけ紙にする（黒地に長文を書かせない） */}
        <SlideIn from="right" distance={22} duration={320} delay={80}>
          <View
            style={{
              backgroundColor: T.surface,
              borderWidth: BW.bold,
              borderColor: ok ? T.ok : C.paper100,
              borderRadius: R.sm,
              overflow: 'hidden',
            }}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              editable={ready}
              autoFocus={Platform.OS === 'web'}
              placeholder={ready ? 'ここに打つ' : 'よみこみ中…'}
              placeholderTextColor={T.disabled}
              style={{
                minHeight: 104,
                padding: S.md,
                fontFamily: FONT.body,
                fontSize: 15,
                lineHeight: 24,
                color: T.text,
                textAlignVertical: 'top',
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTopWidth: BW.line,
                borderTopColor: T.borderSoft,
                paddingHorizontal: S.md,
                paddingVertical: S.sm,
                backgroundColor: T.sunk,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {/* 数が変わるたびに跳ねる。**打った手応え**がここに出る */}
                <Bump value={count}>
                  <Text
                    style={{
                      fontFamily: FONT.display,
                      fontSize: 24,
                      lineHeight: 28,
                      color: ok ? T.ok : T.text,
                    }}>
                    {count}
                  </Text>
                </Bump>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>トークン</Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>
                  / {[...text].length}文字
                </Text>
              </View>
              {budget ? (
                <Text style={[F.hand, { color: ok ? T.ok : T.muted, fontSize: 13 }]}>
                  {ok
                    ? 'ぴったり'
                    : count === 0
                      ? 'まだ書いていない'
                      : count < budget.min
                        ? `あと${budget.min - count}`
                        : `${count - budget.max}多い`}
                </Text>
              ) : null}
            </View>
          </View>
        </SlideIn>

        {/* 例文 */}
        {presets.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {presets.map((p) => (
              <PresetChip key={p} text={p} onPick={() => setText(p)} />
            ))}
          </ScrollView>
        ) : null}

        {/* 割れ方。サイトのトークナイザーと同じで、増えたぶんだけ左から跳ねて出る */}
        {chips.length ? (
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5, color: C.yellow400 }}>
              AI SEES
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {chips.map((c, i) => {
                const isNew = i >= prevChips.current;
                return (
                  <PopIn
                    key={i}
                    animate={isNew}
                    delay={isNew ? Math.min((i - prevChips.current) * CHIP_STEP_MS, CHIP_STEP_MAX) : 0}>
                    <View
                      style={{
                        /* 2トークン以上でやっと1つの文字列になった塊は色を変える。
                           「日本語は文字数とトークン数が一致しない」がこれで目に入る */
                        backgroundColor: c.n > 1 ? C.red500 : C.paper50,
                        borderRadius: R.xs,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                      }}>
                      <Text
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 13,
                          color: c.n > 1 ? C.paper0 : C.ink900,
                        }}>
                        {c.text === ' ' ? '␣' : c.text.replace(/\n/g, '⏎')}
                        {c.n > 1 ? (
                          <Text style={{ fontSize: 9, color: C.yellow400 }}> {c.n}</Text>
                        ) : null}
                      </Text>
                    </View>
                  </PopIn>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* 下の帯。ゲージと「決める」はいつも同じ場所に置く */}
      <View
        style={{
          borderTopWidth: BW.line,
          borderTopColor: C.ink800,
          padding: S.lg,
          gap: S.md,
          backgroundColor: C.ink900,
        }}>
        {budget ? <Gauge count={count} min={budget.min} max={budget.max} ok={ok} /> : null}
        {budget ? (
          <GameButton
            label={ok ? 'これで決める' : '収めると押せる'}
            /* 収まるまで押せないので、外しようがない。★は出さない */
            onPress={() => onClear({ misses: 0, allow: 0, ms: 0 })}
            disabled={!ok}
          />
        ) : (
          <GameButton label="わかった" onPress={onFinish} />
        )}
      </View>
    </View>
  );
}

/* ———————————————— AIに指示を出す ———————————————— */

function AiPromptPlay({
  spec,
  onClear,
}: {
  spec: Extract<LessonInteractive, { kind: 'ai-prompt' }>;
  onClear: (score: GameScore) => void;
}) {
  const elapsed = useGameClock();
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<GradeResult | null>(null);
  /* 届かなかった回数。1発で通せば★3 */
  const [misses, setMisses] = React.useState(0);
  const passed = !!result && result.score >= spec.pass;

  const submit = async () => {
    if (busy || text.trim().length < 5) return;
    setBusy(true);
    setResult(null);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const r = await gradePrompt(spec.exerciseId, text.trim());
    setResult(r);
    if (r.score < spec.pass) setMisses((n) => n + 1);
    setBusy(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        r.score >= spec.pass
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.md }} keyboardShouldPersistTaps="handled">
        <SlideIn from="right" distance={22} duration={320}>
          <View style={{ backgroundColor: C.yellow400, borderRadius: R.sm, padding: S.md, gap: 4 }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.ink900 }}>
              {spec.pass}点以上で合格
            </Text>
            <Text style={{ fontFamily: FONT.heading, fontSize: 15, color: C.ink900 }}>
              {spec.brief}
            </Text>
          </View>
        </SlideIn>

        <SlideIn from="right" distance={22} duration={320} delay={80}>
          <View
            style={{
              backgroundColor: T.surface,
              borderWidth: BW.bold,
              borderColor: passed ? T.ok : C.paper100,
              borderRadius: R.sm,
              overflow: 'hidden',
            }}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              editable={!busy}
              placeholder={'ここに指示を書く\n（役割・目的・条件・出力形式）'}
              placeholderTextColor={T.disabled}
              style={{
                minHeight: 140,
                padding: S.md,
                fontFamily: FONT.body,
                fontSize: 15,
                lineHeight: 24,
                color: T.text,
                textAlignVertical: 'top',
              }}
            />
          </View>
        </SlideIn>

        {busy ? <Thinking /> : null}

        {result ? (
          <SlideIn from="bottom" distance={18} duration={340} style={{ gap: S.md }}>
            <View
              style={{
                backgroundColor: passed ? 'rgba(31, 164, 99, 0.18)' : 'rgba(240, 140, 0, 0.18)',
                borderWidth: BW.bold,
                borderColor: passed ? T.ok : T.warn,
                borderRadius: R.sm,
                padding: S.md,
                gap: 6,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={passed ? 'perfect' : 'bulb'} size={20} color={passed ? T.ok : T.warn} />
                <PopIn>
                  <Text
                    style={{ fontFamily: FONT.display, fontSize: 28, lineHeight: 34, color: C.paper0 }}>
                    {result.score}
                    <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: C.ink300 }}>点</Text>
                  </Text>
                </PopIn>
                <Text
                  style={{
                    fontFamily: FONT.heading,
                    fontSize: 13,
                    flex: 1,
                    textAlign: 'right',
                    color: C.paper50,
                  }}>
                  {passed ? '合格' : `あと${spec.pass - result.score}点`}
                </Text>
              </View>
              {result.good ? (
                <Text style={{ fontFamily: FONT.body, fontSize: 13.5, lineHeight: 22, color: C.paper50 }}>
                  ◎ {result.good}
                </Text>
              ) : null}
              {result.improve ? (
                <Text style={{ fontFamily: FONT.body, fontSize: 13.5, lineHeight: 22, color: C.paper50 }}>
                  → {result.improve}
                </Text>
              ) : null}
              {result.missing.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                  {result.missing.map((m, i) => (
                    <PopIn key={m} delay={i * CHIP_STEP_MS}>
                      <View
                        style={{
                          borderWidth: BW.hair,
                          borderColor: C.ink300,
                          borderRadius: R.full,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}>
                        <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, color: C.paper100 }}>
                          {m}
                        </Text>
                      </View>
                    </PopIn>
                  ))}
                </View>
              ) : null}
            </View>

            {result.output ? (
              <View style={{ gap: 5 }}>
                <Text
                  style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5, color: C.yellow400 }}>
                  AI WROTE
                </Text>
                <View
                  style={{
                    backgroundColor: C.ink800,
                    borderRadius: R.sm,
                    padding: S.md,
                  }}>
                  <Text
                    style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 22, color: C.paper50 }}>
                    {result.output}
                  </Text>
                </View>
              </View>
            ) : null}

            {result.offline ? (
              <Text
                style={{ fontFamily: FONT.mono, fontSize: 10, color: C.ink300, textAlign: 'center' }}>
                いまAIに繋がらないので、簡易採点で出しています
              </Text>
            ) : null}
          </SlideIn>
        ) : null}
      </ScrollView>

      <View
        style={{
          borderTopWidth: BW.line,
          borderTopColor: C.ink800,
          padding: S.lg,
          gap: S.sm,
          backgroundColor: C.ink900,
        }}>
        <GameButton
          label={busy ? 'AIが書いています…' : result ? 'もう一度ためす' : 'AIに渡す'}
          onPress={submit}
          disabled={busy || text.trim().length < 5}
          tone={passed ? 'ghost' : 'yellow'}
        />
        {passed ? (
          <GameButton
            label="これで決める"
            onPress={() => onClear({ misses, allow: 2, ms: elapsed() })}
          />
        ) : null}
      </View>
    </View>
  );
}

/* 待っているあいだの3つの点。順に膨らむ。
   進捗バーは出さない——**何割終わったかを知らないので、出せば嘘になる** */
function Thinking() {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 3, duration: 1050, easing: Easing.linear, useNativeDriver: NATIVE }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      {[0, 1, 2].map((n) => (
        <Animated.View
          key={n}
          style={{
            width: 9,
            height: 9,
            borderRadius: R.full,
            backgroundColor: C.yellow400,
            transform: [
              {
                scale: t.interpolate({
                  inputRange: [n - 0.5, n, n + 0.5, n + 2.5, n + 3],
                  outputRange: [1, 1.7, 1, 1, 1.7],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
        />
      ))}
      <Text style={[F.hand, { fontSize: 12.5, marginLeft: 4, color: C.paper100 }]}>
        返事を待っています…
      </Text>
    </View>
  );
}
