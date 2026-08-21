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
import { periodic, useLoop } from '@/components/loop';
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
import { InterviewPlay } from '@/components/games/interview-game';
import { JudgePlay } from '@/components/games/judge-game';
import { RedlinePlay } from '@/components/games/redline-game';
import { TrimPlay } from '@/components/games/trim-game';
import {
  allowLabel,
  starsOf,
  timeLabel,
  useGameClock,
  type GameScore,
} from '@/components/games/score';
import { SortPlay } from '@/components/games/sort-game';
import { sinkFlat, Tone } from '@/components/ui';
import { SCORED_KINDS } from '@/data/courses';
import type { LessonInteractive } from '@/data/types';
import { gradePrompt, type GradeResult } from '@/lib/grade';
import { playMusic } from '@/lib/music';
import { playClear, playSound } from '@/lib/sound';
import { prepareTokenizer, reloadForStaleChunk, tokenizeText, type TokenChip } from '@/lib/tokenizer';
import { useProgress } from '@/store/progress';
import { BW, C, F, FONT, R, S, T } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/** 打つたびに数えると重いので、少し落ち着いてから数える */
const DEBOUNCE_MS = 140;
/** チップが1枚ずつずれて出るときの間隔。サイトと同じ28ms、頭打ちも同じ400ms */
const CHIP_STEP_MS = 28;
const CHIP_STEP_MAX = 400;

export interface GameMeta {
  name: string;
  icon: IconName;
  rule: string;
  /** 遊び方の1行。タイトルの下に出る */
  how: string;
  /** ゲームの持ち色。タイトルの紋章・上の帯・下線に使う。
      黒地のゲームは別世界なので、紙の側より色数が多くてよい
      （実機で「殺風景」の指摘。ゲームごとに顔を変える） */
  color: string;
}

/* ▍名前は「何をするゲームか」がそのまま分かる形にする
   もとは「仕分け」「指示を組む」のような名詞で、**遊びの種類は
   分かっても、何をしたら正解なのかが伝わらなかった**（実機で
   「これどういう意図？何したら正解？」の声）。タイトル画面でも
   上の帯でも、名前だけで目的が立つように「〜しよう」で揃える */
export const GAME: Record<LessonInteractive['kind'], GameMeta> = {
  sort: {
    name: '正しく仕分けよう',
    icon: 'target',
    rule: '札を2つの箱に振り分ける',
    how: '1枚ずつ出てくる札を、左右どちらの箱に入れるか決めます',
    color: '#ff9f43',
  },
  find: {
    name: '危ない行を見つけよう',
    icon: 'shield',
    rule: '文書を検問する',
    how: '文書を読んで、あやしい行をタップして摘発します',
    color: '#5cc8ff',
  },
  build: {
    name: 'AIに適切な指示を出そう',
    icon: 'hammer',
    rule: '部品を選んで指示を強くする',
    how: '札を選ぶたびに、AIの返しがその場で変わります',
    color: '#ffd23f',
  },
  order: {
    name: '正しい順に並べよう',
    icon: 'compass',
    rule: '仕事の手順を組む',
    how: '「つぎにやること」を選んでいくと、手順が組み上がります',
    color: '#7ee08c',
  },
  fit: {
    /* ▍比喩には正体を添える
       「AIの机」だけだと、机が何の例えなのか分からない（実機で指摘）。
       初出のここで（コンテキスト）と正体を言い、以後は比喩だけで通す */
    name: '要るものだけ載せよう',
    icon: 'folder',
    rule: 'AIの机（コンテキスト）は広さに限りがある',
    how: 'AIの机＝一度に読める量。要るものだけを載せてください',
    color: '#c9a1ff',
  },
  tokenizer: {
    name: 'AIの目で見てみよう',
    icon: 'pen',
    rule: '文章の切れ目をのぞく',
    how: '好きに打つと、AIから見た区切りが出ます。合否はありません',
    color: '#8fd3ff',
  },
  'token-budget': {
    name: 'トークンを枠に収めよう',
    icon: 'target',
    rule: '書いて削って幅に収める',
    how: '書いて削って、決められたトークン数に収めてください',
    color: '#ff8a5c',
  },
  redline: {
    name: '赤ペンを入れよう',
    icon: 'pen',
    rule: 'AIの下書きを直す',
    how: '直す所を押して、どう直すかを選びます',
    color: '#e8c15a',
  },
  trim: {
    name: '指示を削って収めよう',
    icon: 'target',
    rule: '長い指示から要らない行を捨てる',
    how: '消していい行を押して、決められた長さまで削ります',
    color: '#ff6b6b',
  },
  interview: {
    name: '足りないことを聞き出そう',
    icon: 'compass',
    rule: '聞ける回数は決まっている',
    how: 'ふわっとした依頼を、限られた質問で書ける形にします',
    color: '#4dd6c1',
  },
  judge: {
    name: 'どちらを採るか決めよう',
    icon: 'target',
    rule: '2つの出力を見比べる',
    how: '採るほうを選んで、そのあと「なぜ」まで選びます',
    color: '#b8a4ff',
  },
  'ai-prompt': {
    name: '本物のAIに指示を出そう',
    icon: 'bulb',
    rule: '書いて、渡して、採点される',
    how: '本物のAIに指示を渡します。返ってきたものと指示が採点されます',
    color: '#ff8ac2',
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
    case 'redline':
      return spec.allow ?? 2;
    case 'trim':
      return spec.allow ?? 2;
    case 'interview':
      return spec.allow ?? 1;
    case 'judge':
      return spec.allow ?? 2;
    case 'ai-prompt':
      return 2;
    default:
      /* 合否の無いもの（トークナイザー）と、通るまで書き直せるもの */
      return 0;
  }
}

/** ★の出るゲームか。台帳は data/courses（バッジの判定と同じものを見る） */
export function hasStars(kind: LessonInteractive['kind']): boolean {
  return SCORED_KINDS.includes(kind);
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
  /* 「やめる」を押したあとの確認 */
  const [asking, setAsking] = React.useState(false);
  /* タイルが画面を覆い終わったか。覆うまでは中身を出さない */
  const [covered, setCovered] = React.useState(false);

  /* タイルが走り出すのと同時に、駆け上がる音。**覆い終わってからだと遅い** */
  React.useEffect(() => {
    playSound('start');
  }, []);

  /* ▍BGMをゲームの曲に替える
     ここは Modal＝別の窓なので、場面を見ている係（_layout.tsx の
     MusicDirector）からは見えない。開いたら自分で替えて、
     閉じるときにレッスンの曲へ返す（ゲームはレッスンからしか開かない） */
  React.useEffect(() => {
    playMusic('game');
    return () => playMusic('lesson');
  }, []);

  /* ▍開いているあいだ、バッジの祝いを止める
     ★3を取った瞬間にバッジが立つ（→ store/progress.tsx の recordGame）。
     祝いの画面もModalなので、このModalの下に隠れたまま自動で閉じてしまう。
     閉じてから出す。ゲームのクリア画面と祝いが重ならない利点もある */
  const { holdBadges } = useProgress();
  React.useEffect(() => holdBadges(), [holdBadges]);

  /* ▍タイトルは**押すまで消えない**
     もとは1.3秒で自動で先へ進んでいたが、この画面には遊び方と
     難度（何回外せるか）が載っている。読み終える前に消えて
     「何をしていいか分からない」になっていた（実機で指摘）。
     TAP TO START と書いてあるのだから、そのとおりに待つ */

  /* 通ったときの成績。★の数と自己ベストの判定に使う */
  const [score, setScore] = React.useState<GameScore | null>(null);

  const clear = React.useCallback(
    (s: GameScore) => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setScore(s);
      playClear(starsOf(s.misses));
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
            {asking ? (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(20,17,15,0.8)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: S.xl,
                  gap: S.md,
                  zIndex: 10,
                }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 22, color: C.paper0 }}>
                  やめる？
                </Text>
                <Text
                  style={[F.hand, { fontSize: 13.5, color: C.paper100, textAlign: 'center' }]}>
                  {phase === 'clear'
                    ? '成績は記録してあります。'
                    : '途中までの成績は残りません。'}
                </Text>
                <View style={{ alignSelf: 'stretch', gap: S.sm, marginTop: S.sm }}>
                  <GameButton label="つづける" onPress={() => setAsking(false)} />
                  <GameButton label="レッスンに戻る" tone="ghost" onPress={onClose} />
                </View>
              </View>
            ) : null}
            {phase === 'title' ? (
              <TitleScreen meta={g} allow={allowOf(spec)} onSkip={() => setPhase('play')} />
            ) : (
              <View style={{ flex: 1, paddingTop: insets.top }}>
                {/* ▍途中でやめるときは一度きく
                     文字リンク1つで即終了だった。ゲームの成績は通すまで
                     残らないので、誤タップの取り返しがつかない */}
                <GameBar meta={g} onClose={() => setAsking(true)} />
                {phase === 'clear' ? (
                  <ClearScreen
                    meta={g}
                    score={score}
                    best={best}
                    takeaway={spec.takeaway}
                    onClose={onClose}
                    onRetry={retry}
                  />
                ) : spec.kind === 'sort' ? (
                  <SortPlay key={round} spec={spec} onClear={clear} />
                ) : spec.kind === 'find' ? (
                  <FindPlay key={round} spec={spec} onClear={clear} />
                ) : spec.kind === 'build' ? (
                  <BuildPlay key={round} spec={spec} onClear={clear} />
                ) : spec.kind === 'order' ? (
                  <OrderPlay key={round} spec={spec} onClear={clear} />
                ) : spec.kind === 'fit' ? (
                  <FitPlay key={round} spec={spec} onClear={clear} />
                ) : spec.kind === 'redline' ? (
                  <RedlinePlay key={round} spec={spec} onClear={clear} />
                ) : spec.kind === 'trim' ? (
                  <TrimPlay key={round} spec={spec} onClear={clear} />
                ) : spec.kind === 'interview' ? (
                  <InterviewPlay key={round} spec={spec} onClear={clear} />
                ) : spec.kind === 'judge' ? (
                  <JudgePlay key={round} spec={spec} onClear={clear} />
                ) : spec.kind === 'ai-prompt' ? (
                  <AiPromptPlay key={round} spec={spec} onClear={clear} />
                ) : (
                  <TokenPlay
                    /* 他のゲームと同じ鍵を持たせる。いまは★が付かない＝クリア画面に
                       やり直しの口が出ないので効いていないが、出したときに
                       前の文が残ったまま再開する、という取りこぼしを防いでおく */
                    key={round}
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

/* ———————————————— 入りのタイトル ————————————————
   遊び方と難度（何回外せるか）を、始まる前に読ませる場所。
   **押すまで消えない**（自動で進むと、読み終わる前に消える） */

/* 瞬く星ひとつ。明るさと大きさだけを揺らす（→ components/loop.ts）。
   山は**広く**取る。鋭く尖らせると、光っている時間が周期の1割になって
   「ほとんど消えている画面」に見える（舞台の飾りで踏んだ穴と同じ） */
function Twinkle({
  size,
  color,
  sec,
  delay,
}: {
  size: number;
  color: string;
  sec: number;
  delay: number;
}) {
  const t = useLoop(sec, delay);
  const P = [0, 0.2, 0.4, 0.62, 0.82, 1];
  const opacity = periodic(t, 1, P, [0.35, 0.7, 1, 1, 0.7, 0.35]);
  const scale = periodic(t, 1, P, [0.86, 0.98, 1.1, 1.1, 0.98, 0.86]);
  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Icon name="twinkle" size={size} color={color} />
    </Animated.View>
  );
}

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
      {/* 飾りの星。**瞬かせる**——静止画だと、ここで待たされている数秒が
          ただの静止画に見える（実機で指摘）。1つずつ違う速さ・違う出だしで
          明るさと大きさを揺らす。位置は動かさない（散らかって見える） */}
      {(
        [
          { at: { top: '16%', left: '12%' }, size: 16, c: meta.color, sec: 2.6 },
          { at: { top: '11%', right: '18%' }, size: 12, c: C.yellow400, sec: 3.4 },
          { at: { top: '26%', right: '9%' }, size: 20, c: meta.color, sec: 4.2 },
          { at: { bottom: '24%', left: '10%' }, size: 14, c: C.yellow400, sec: 3.0 },
          { at: { bottom: '15%', right: '14%' }, size: 17, c: meta.color, sec: 5.0 },
        ] as const
      ).map((d, i) => (
        <PopIn key={i} delay={500 + i * 120} style={[{ position: 'absolute' }, d.at]}>
          <Twinkle size={d.size} color={d.c} sec={d.sec} delay={i * 700} />
        </PopIn>
      ))}

      {/* ゲームの紋章。持ち色のタイルに白抜きのアイコン */}
      <PopIn delay={60}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: R.md,
            backgroundColor: meta.color,
            borderWidth: BW.heavy,
            borderColor: C.ink900,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: '-5deg' }],
            marginBottom: S.sm,
            /* 黒地の上のベタ影。紙側の Pop と同じ流儀 */
            shadowColor: C.ink900,
          }}>
          <Icon name={meta.icon} size={44} color={C.ink900} />
        </View>
      </PopIn>

      <SlideIn from="bottom" distance={-18} duration={300}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 3, color: meta.color }}>
          MINI GAME
        </Text>
      </SlideIn>

      {/* 名前は横から飛び込んで、行き過ぎてから止まる */}
      <PopIn delay={120}>
        <Text
          style={{
            fontFamily: FONT.display,
            fontSize: 38,
            lineHeight: 52,
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
          backgroundColor: meta.color,
          width: line.interpolate({ inputRange: [0, 1], outputRange: [0, 132] }),
        }}
      />

      <SlideIn from="bottom" distance={14} duration={340} delay={620}>
        {/* 遊び方の1行。ここを読み飛ばされると詰むので、本文並みの大きさで */}
        <Text style={[F.hand, { fontSize: 16, lineHeight: 26, color: C.paper100, textAlign: 'center' }]}>
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
        borderBottomWidth: 3,
        /* 帯の下線もゲームの持ち色。どのゲームにいるかが色で分かる */
        borderBottomColor: meta.color,
      }}>
      {/* タイトルの紋章の小型版。場面がつながって見える */}
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: R.xs,
          backgroundColor: meta.color,
          borderWidth: BW.line,
          borderColor: C.ink900,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '-5deg' }],
        }}>
        <Icon name={meta.icon} size={17} color={C.ink900} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT.heading, fontSize: 17, color: C.paper50 }}>{meta.name}</Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: C.ink300 }}>
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
      accessibilityRole="button"
      accessibilityLabel="やめる"
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
  takeaway,
  onClose,
  onRetry,
}: {
  meta: GameMeta;
  score: GameScore | null;
  /** これまでの自己ベストの★ */
  best: number | null;
  /** おさらい。なぜそれが正解で、何がNGなのか（→ data/types.ts） */
  takeaway?: string;
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
    /* ▍スクロールできる箱にする
       おさらいが長い回や背の低い端末で、中身が縦にあふれて
       端が見切れることがある（実機で「結果の文字が切れる」の指摘）。
       あふれたらスクロールで逃がす */
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: S.xl,
        gap: S.md,
      }}>
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
        {/* ゲーム名は上の帯に出ている。「〜しよう、突破」だと文が
            ねじれるので、ここでは名前を繰り返さない */}
        <Text style={[F.hand, { fontSize: 15, color: C.paper100, textAlign: 'center' }]}>
          {perfect ? 'ノーミスで突破。' : '突破した。'}
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

      {/* ▍おさらい。遊びの中の正誤は分かっても、貫いている原則は
           言わないと伝わらない（実機で「なぜ正解か分からない」の指摘）。
           通った直後＝いちばん飲み込める瞬間にここで言う */}
      {takeaway ? (
        <SlideIn from="bottom" distance={14} delay={700} style={{ alignSelf: 'stretch' }}>
          <View
            style={{
              borderWidth: BW.line,
              borderColor: C.ink700,
              borderRadius: R.sm,
              padding: S.md,
              gap: 5,
              marginTop: S.xs,
            }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5, color: C.yellow400 }}>
              おさらい
            </Text>
            <Text style={{ fontFamily: FONT.body, fontSize: 13.5, lineHeight: 22, color: C.paper100 }}>
              {takeaway}
            </Text>
          </View>
        </SlideIn>
      ) : null}

      <SlideIn
        from="bottom"
        distance={14}
        delay={760}
        style={{ marginTop: S.md, gap: S.sm, alignSelf: 'stretch' }}>
        <GameButton label="レッスンに戻る" onPress={onClose} />
        {/* ▍★3でないときだけ、もう一度を目立たせる
            満点で終えた人にやり直しを勧めても意味がない */}
        {!perfect ? (
          <GameButton label="★3をねらう" tone="ghost" onPress={onRetry} />
        ) : null}
      </SlideIn>
    </ScrollView>
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
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}>
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

/* 凡例に置く、本物と同じ見た目の小さなチップ。
   「漢字 2」のように末尾へ数字を渡すと、本物と同じ黄色の小さな数字になる */
function LegendChip({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  const [text, n] = label.split(' ');
  return (
    <View style={{ backgroundColor: bg, borderRadius: R.xs, paddingHorizontal: 5, paddingVertical: 2 }}>
      <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: fg }}>
        {text}
        {n ? <Text style={{ fontSize: 8, color: C.yellow400 }}> {n}</Text> : null}
      </Text>
    </View>
  );
}

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
  /* BPEの表の様子。**失敗を ready 扱いにしない**（→ 下の注釈） */
  const [load, setLoad] = React.useState<'loading' | 'ready' | 'failed'>('loading');
  /* 「もう一度よみこむ」を押した回数。増やすと下の読み込みが走り直す */
  const [tries, setTries] = React.useState(0);
  /* 何回続けて転んだか。2回目からは画面ごと読み直す（→ 下の読み込み） */
  const fails = React.useRef(0);
  const ready = load === 'ready';

  /* 何枚目から先が「新しく増えたぶん」か。ここから右だけを跳ねさせる
     （全部跳ねさせると、1文字打つたびに画面が波打って読めない） */
  const prevChips = React.useRef(0);

  /* ▍表が落ちてこないときに、黙って詰ませない
     トークンの表は約1MBの別ファイルで、本体とは別に取りにいく（→ lib/tokenizer.ts）。
     電波が細い所やスリープ明けのPWAでは、ここだけ落ちてこないことがある。

     以前はその失敗を握りつぶして「読み込み済み」として扱っていた。すると
     **打てるのにトークン数が0のまま**という状態になり、「トークン収め」は
     20〜35に入りようがないので「収めると押せる」から永久に変わらない。
     レッスン側はゲームを通すまで通せんぼなので、**そのレッスンが詰む**。
     しかも画面には何も出ないので、プレイヤーには壊れたようにしか見えない。

     いまは失敗を失敗として持ち、画面に出して、やり直せるようにする。
     それでもダメなら通せんぼは外す（下の「先へすすむ」）。**表が取れないのは
     プレイヤーのせいではない**ので、学習の進みを人質に取らない */
  React.useEffect(() => {
    let alive = true;
    setLoad('loading');
    /* Webは表の読み込み、ネイティブはAPIへの疎通確認（→ lib/tokenizer.ts）。
       どちらも「失敗＝下の看板とやり直しボタン」に落ちる */
    prepareTokenizer()
      .then(() => alive && setLoad('ready'))
      .catch(() => {
        if (!alive) return;
        fails.current += 1;
        /* ▍**押しても直らない**のがいちばん悪い
           表は名前にハッシュの入った別ファイル。新しい版を配ったあとの
           古い画面は、もう無いファイル名を取りにいくので、何度押しても
           同じところで転ぶ（→ lib/tokenizer.ts の reloadForStaleChunk）。
           1回目は電波かもしれないのでその場で取り直させる。**2回続けて
           転んだら、画面ごと読み直して名前を仕入れ直す**。
           読み直したときはこの画面も作り直されるので、あとは何もしない */
        if (fails.current >= 2 && reloadForStaleChunk()) return;
        setLoad('failed');
      });
    return () => {
      alive = false;
    };
  }, [tries]);

  React.useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      tokenizeText(text)
        .then((r) => {
          setChips((old) => {
            prevChips.current = old.length;
            return r.chips;
          });
          setCount(r.count);
        })
        /* 数えられていたのに途中で失敗した（Webは表の消失、ネイティブは
           電波）。準備からやり直せる看板に落とす */
        .catch(() => setLoad('failed'));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text, ready]);

  const failed = load === 'failed';
  const ok = !!budget && ready && count >= budget.min && count <= budget.max;

  const presets = spec.presets ?? [];

  return (
    <View style={{ flex: 1 }}>
      {/* automaticallyAdjustKeyboardInsets：iOSでキーボードのぶんだけ下に
          余白を足して、書いている欄を隠さない（「入力欄がキーとかぶって
          見えない」の実機報告）。iOS以外では何もしない指定 */}
      <ScrollView
        contentContainerStyle={{ padding: S.lg, gap: S.md }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
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

        {/* ▍表が落ちてこなかったことを、画面で言う
            ここが無いと「打っても0トークンのまま」という、直しようのない
            画面をただ眺めることになる。何が起きたかと、次にできることを出す */}
        {failed ? (
          <PopIn>
            <View
              style={{
                borderWidth: BW.bold,
                borderColor: C.yellow400,
                borderRadius: R.sm,
                backgroundColor: C.ink800,
                padding: S.md,
                gap: S.sm,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Icon name="bang" size={18} color={C.yellow400} />
                <Text style={[F.strong, { flex: 1, color: C.paper50 }]}>
                  トークンの表を読み込めませんでした
                </Text>
              </View>
              <Text style={[F.hand, { fontSize: 13, color: C.paper100 }]}>
                {'区切りを数えるのに、少し大きなデータを取りにいっています。電波の届く所で、もう一度どうぞ。\nそれでも届かないときは、画面を読み直します（進み具合は消えません）。'}
              </Text>
              <GameButton label="もう一度よみこむ" onPress={() => setTries((n) => n + 1)} />
            </View>
          </PopIn>
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
              placeholder={ready ? 'ここに打つ' : failed ? '数えられません' : 'よみこみ中…'}
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
                      color: ok ? T.ok : failed ? T.disabled : T.text,
                    }}>
                    {/* 数えられていないのに 0 と出すと「0トークンだ」と読める */}
                    {failed ? '—' : count}
                  </Text>
                </Bump>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>トークン</Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>
                  / {[...text].length}文字
                </Text>
              </View>
              {budget && !failed ? (
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

        {/* ▍例文と部品は動きが違う
            トークナイザー（合否なし）の例文は**差し替え**——見比べる道具。
            トークン収めの部品は**追記**——組み合わせて文を作る素材。
            差し替えにすると「完成文を1回押して終わり」になってしまう */}
        {presets.length ? (
          <View style={{ gap: 6 }}>
            {budget ? (
              <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5, color: C.yellow400 }}>
                部品（押すと文に足される）
              </Text>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {presets.map((p) => (
                <PresetChip
                  key={p}
                  text={p}
                  onPick={() => (budget ? setText((t) => t + p) : setText(p))}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ▍打つ前の空白を、そのままにしない
            チップが出るまでここは真っ黒な空きだった。**画面の3分の2が
            何も無いまま**だと、そこで何が起きる場所なのか分からない。
            起きることを先に言っておく（打てば消える） */}
        {!chips.length && !failed ? (
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: S.xxl }}>
            <Icon name="pen" size={26} color={C.ink700} />
            <Text style={[F.hand, { fontSize: 12.5, color: C.ink300, textAlign: 'center' }]}>
              {ready ? '打つと、ここに「AIから見た区切り」が出ます' : 'トークンの表をよみこんでいます…'}
            </Text>
          </View>
        ) : null}

        {/* 割れ方。サイトのトークナイザーと同じで、増えたぶんだけ左から跳ねて出る */}
        {chips.length ? (
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5, color: C.yellow400 }}>
              AI SEES
            </Text>
            {/* ▍凡例はチップの隣に置く
                白と赤の意味は、直前のカードでしか言っていなかった。
                読み飛ばしてゲームに入ると、色の意味が分からないまま
                眺めることになる。**見る場所に、見方を書いておく** */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <LegendChip bg={C.paper50} fg={C.ink900} label="あ" />
              <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.ink300 }}>
                ＝1トークン
              </Text>
              <LegendChip bg={C.red500} fg={C.paper0} label="漢字 2" />
              <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.ink300 }}>
                ＝数字ぶんのトークンで1つ
              </Text>
            </View>
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
        {budget && !failed ? <Gauge count={count} min={budget.min} max={budget.max} ok={ok} /> : null}
        {budget ? (
          <GameButton
            /* ▍表が読めないときは通せんぼを外す
               20〜35に入れようがない状態で「収めると押せる」を出し続けると、
               このレッスンから先へ一歩も進めなくなる。**取れなかったのは
               プレイヤーのせいではない**ので、そのときは通す */
            label={failed ? '先へすすむ' : ok ? 'これで決める' : '収めると押せる'}
            /* 収まるまで押せないので、外しようがない。★は出さない */
            onPress={() => onClear({ misses: 0, allow: 0, ms: 0 })}
            disabled={!failed && !ok}
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
      {/* automaticallyAdjustKeyboardInsets：iOSでキーボードのぶんだけ下に
          余白を足して、書いている欄を隠さない（「入力欄がキーとかぶって
          見えない」の実機報告）。iOS以外では何もしない指定 */}
      <ScrollView
        contentContainerStyle={{ padding: S.lg, gap: S.md }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
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

        {/* ▍前提資料。元の文章・読み手など、**これが無いと書きようがないもの**。
             お題だけ渡して「指示を書け」だと材料が無かった（実機で指摘）。
             サーバー側のお題（EXERCISES の given）と同じ内容を出す */}
        {spec.given?.length ? (
          <SlideIn from="right" distance={22} duration={320} delay={40} style={{ gap: 6 }}>
            {spec.given.map((g) => (
              <View
                key={g.label}
                style={{
                  backgroundColor: T.surface,
                  borderWidth: BW.line,
                  borderColor: C.paper100,
                  borderRadius: R.sm,
                  padding: S.md,
                  gap: 3,
                }}>
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1, color: T.muted }}>
                  {g.label}
                </Text>
                <Text style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 21, color: T.text }}>
                  {g.text}
                </Text>
              </View>
            ))}
          </SlideIn>
        ) : null}

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

        {/* 渡す前の空白にも、何を見られるのかを置いておく。
            採点の観点が分からないまま書かせると、当てにいく遊びになる */}
        {!busy && !result ? (
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: S.lg }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink300 }}>
              WHAT GETS SCORED
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
              {['役割', '目的', '条件', '出力形式'].map((m) => (
                <View
                  key={m}
                  style={{
                    borderWidth: BW.hair,
                    borderColor: C.ink700,
                    borderRadius: R.full,
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                  }}>
                  <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, color: C.ink300 }}>{m}</Text>
                </View>
              ))}
            </View>
            <Text style={[F.hand, { fontSize: 12.5, color: C.ink300, textAlign: 'center' }]}>
              渡すと、AIの返しと指示の両方が採点されます
            </Text>
          </View>
        ) : null}

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
