/* ============================================================
   動きの部品。画面の切り替えと、出てくるものの「ポン」。

   ▍サイトと同じ気持ちよさにする
   サイトのトークナイザー（src/app/tokenizer/lab.tsx）は、チップが
   `scale(0.3) → 1.1 → 1` の 0.36秒で弾んで出る。しかも**新しく増えた
   ぶんだけ**、28msずつ遅らせて左から順に。あの跳ね方をそのまま移した。

   ▍ネイティブドライバはWebで効かない
   react-native-web の Animated はネイティブドライバを持たない。
   transform と opacity だけを動かしているので、
   `useNativeDriver` を切ってもWebで問題なく動く。
   ============================================================ */
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon } from '@/components/icons';
import { C } from '@/theme';

const NATIVE = Platform.OS !== 'web';

/* ———————————————— 画面の切り替え ————————————————
   カードが差し替わったことを分からせる。**入りだけ**動かしている。
   出も動かすと、中身を差し替えるまでの待ちが要って、送りが重くなる。 */

export function SlideIn({
  children,
  /** どちら側から入るか */
  from = 'right',
  /** 動く量（px） */
  distance = 26,
  duration = 300,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  from?: 'right' | 'left' | 'bottom';
  distance?: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t, duration, delay]);

  const shift = t.interpolate({
    inputRange: [0, 1],
    outputRange: [from === 'left' ? -distance : distance, 0],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [from === 'bottom' ? { translateY: shift } : { translateX: shift }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/* ———————————————— ポンと出る ————————————————
   サイトの tok-pop と同じ形。0.3倍から始めて1.1倍まで行き過ぎ、
   1.0に戻る。**行き過ぎるところが「気持ちよさ」の正体**なので、
   ここを削らないこと。 */

export function PopIn({
  children,
  delay = 0,
  /** false のときは動かさずそのまま出す（すでに出ているものの再描画） */
  animate = true,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(animate ? 0 : 1)).current;

  React.useEffect(() => {
    if (!animate) return;
    const a = Animated.timing(t, {
      toValue: 1,
      duration: 360,
      delay,
      easing: Easing.out(Easing.back(2.4)),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t, delay, animate]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
          transform: [
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/* ———————————————— 値が変わったら跳ねる ————————————————
   数字が入れ替わったことを、数字そのものの動きで知らせる。
   トークン数のように**1文字打つたびに変わる**ものに使う。 */

export function Bump({
  value,
  children,
  style,
}: {
  /** これが変わるたびに跳ねる */
  value: number | string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(0)).current;
  const first = React.useRef(true);

  React.useEffect(() => {
    /* 最初の描画では跳ねない（画面に入った瞬間に全部が動くと騒がしい） */
    if (first.current) {
      first.current = false;
      return;
    }
    t.setValue(0);
    const a = Animated.timing(t, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [value, t]);

  return (
    <Animated.View
      style={[
        style,
        { transform: [{ scale: t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.28, 1] }) }] },
      ]}>
      {children}
    </Animated.View>
  );
}

/* ———————————————— 合格のスタンプ ————————————————
   通った瞬間に、傾いたスタンプが**上から降ってきて止まる**。
   マンガのコマに判子を押す感じ。止まってからは動かさない
   （ずっと動いていると、次に何をすればいいのかが見えなくなる）。 */

export function Stamp({
  children,
  /** 傾き（度） */
  tilt = -8,
  style,
}: {
  children: React.ReactNode;
  tilt?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.back(3)),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
            { rotate: `${tilt}deg` },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/* ———————————————— 星がパッと舞う ————————————————
   サイトの「AI相談」タブが引っ込むときのキラキラ（globals.css の
   uke-twinkle）をそのまま移した。**行って戻らない**のがポイントで、
   0→1.25倍まで一気に開いて、回りながら small になって消える。

   サイトとの違いは1つだけ。あちらは星がその場で瞬くが、こちらは
   中心から外へ少し流している（押した指の下から散る絵にしたい）。

   ▍ボタンの中に星を置いてはいけない
   最初はボタンの内側に描いていた。これだと「つぎへ」のように
   **押すと自分ごと消える**ボタン（レッスンはカードを key で作り直して
   いる）で、星もいっしょに消えて一度も見えない。

   なので星は画面のいちばん上にいる SparkLayer が描き、ボタンは
   「ここで押された」という座標だけを渡す。押した本人が消えても、
   星は最後まで舞う。

     const burst = useSparkBurst();
     <Pressable onPress={(e) => burst(e.nativeEvent.pageX, e.nativeEvent.pageY)}>

   ▍Modal の中には別の層が要る
   ネイティブの Modal は別の窓なので、根元に置いた層は届かない。
   ミニゲームは自前で SparkLayer を持っている。入れ子になったときは
   Context なので**近いほうが勝つ**。 */

/** 星1つぶんの散らばり方。中心からのずれ(px)・大きさ・色・遅れ(ms) */
type SparkSpec = { x: number; y: number; size: number; color: string; delay: number };

/* サイトは6つだが、スマホは画面が近いぶん物足りない。
   数を9つに増やし、ひと回り大きく・広く散らしてある。

   ▍遅れは詰める
   サイトは0.42秒かけて順に出していた。指で押した返事としてはこれが遅く、
   最後の星が出るころには指が離れている。0.12秒まで詰めて、
   **ひと固まりで弾ける**ようにした。順に出る感じはまだ残っている。
   大きい星ほど先に出す（最初のひと目で大きいものが見えるように） */
const SPARKS: SparkSpec[] = [
  { x: -26, y: -20, size: 22, color: C.yellow400, delay: 0 },
  { x: 46, y: 6, size: 19, color: C.yellow400, delay: 0 },
  { x: 24, y: -26, size: 17, color: C.red500, delay: 15 },
  { x: 12, y: 34, size: 16, color: C.yellow400, delay: 30 },
  { x: -44, y: 10, size: 15, color: C.yellow400, delay: 45 },
  { x: -14, y: -40, size: 14, color: C.red500, delay: 60 },
  { x: 0, y: 48, size: 14, color: C.yellow400, delay: 80 },
  { x: -34, y: 40, size: 13, color: C.yellow400, delay: 100 },
  { x: 40, y: -40, size: 12, color: C.red500, delay: 120 },
];

/** 星1つぶんの寿命。サイトは0.75秒だが、指で押した返事としては遅い。
    **押した瞬間に返ってこないと、押した実感につながらない** */
const SPARK_MS = 460;

/** いちばん開くところ。ここが早いほど「パッ」と出る（サイトは0.4）。
    0.2 ＝ 触れてから約90msで開ききる */
const SPARK_PEAK = 0.2;

/** 色が乗りきるところ。開ききるより手前にして、
    **形が完成する前にもう見えている**状態を作る（見え出しは約45ms） */
const SPARK_FADE_IN = 0.1;

function Spark({ spec, scale }: { spec: SparkSpec; scale: number }) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: SPARK_MS,
      delay: spec.delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t, spec.delay]);

  /* 出はじめ → いちばん開くところ → 消えぎわ の3点。
     途中で行き過ぎる（1.25倍）ところが「パッ」の正体 */
  const num = (a: number, b: number, c: number) =>
    t.interpolate({ inputRange: [0, SPARK_PEAK, 1], outputRange: [a, b, c] });
  const deg = (a: string, b: string, c: string) =>
    t.interpolate({ inputRange: [0, SPARK_PEAK, 1], outputRange: [a, b, c] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        /* 色だけは形より先に乗せる。開ききるのを待たずに見え始める */
        opacity: t.interpolate({
          inputRange: [0, SPARK_FADE_IN, SPARK_PEAK, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          { translateX: num(spec.x * 0.55 * scale, spec.x * scale, spec.x * 1.3 * scale) },
          { translateY: num(spec.y * 0.55 * scale, spec.y * scale - 3, spec.y * 1.3 * scale - 12) },
          { scale: num(0, 1.25, 0.15) },
          { rotate: deg('0deg', '45deg', '100deg') },
        ],
      }}>
      <Icon name="twinkle" size={spec.size * scale} color={spec.color} />
    </Animated.View>
  );
}

/** 星を舞わせる。x/y は画面（窓）の座標、scale は散らばりと星の大きさの倍率 */
type BurstFn = (x: number, y: number, scale?: number) => void;

const SparkCtx = React.createContext<BurstFn>(() => {});

/** 星を出したいところで呼ぶ。SparkLayer の外で呼んでも何も起きない（落ちない） */
export const useSparkBurst = () => React.useContext(SparkCtx);

/** ひと組の星が消えきるまで。いちばん遅い星の遅れ＋寿命に、少し余裕を足す */
const SPARK_LIFE_MS = SPARKS[SPARKS.length - 1].delay + SPARK_MS + 100;

export function SparkLayer({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<{ id: number; x: number; y: number; scale: number }[]>([]);
  const seq = React.useRef(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const burst = React.useCallback<BurstFn>((x, y, scale = 1) => {
    const id = (seq.current += 1);
    setItems((v) => [...v, { id, x, y, scale }]);
    /* 舞い終わったら消す。残しておくと、押すたびに透明な星が積もっていく */
    timers.current.push(setTimeout(() => setItems((v) => v.filter((i) => i.id !== id)), SPARK_LIFE_MS));
  }, []);

  return (
    <SparkCtx.Provider value={burst}>
      <View style={{ flex: 1 }}>
        {children}
        {/* 星はいちばん上。触れないので、下のボタンはそのまま押せる */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {items.map((i) => (
            /* 大きさゼロの点を置いて、そこを中心に散らす */
            <View key={i.id} pointerEvents="none" style={{ position: 'absolute', left: i.x, top: i.y }}>
              {SPARKS.map((s, k) => (
                <Spark key={k} spec={s} scale={i.scale} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </SparkCtx.Provider>
  );
}

/* ———————————————— 押した感じ ————————————————
   Pressable の pressed をそのまま使うと、**速く叩いたときに沈んだ姿が
   見えない**。指を離すのが1フレームで、描く前に戻ってしまうため。
   押してから最低 PRESS_HOLD_MS のあいだは沈めたままにする。

   サイト（ds.tsx）は translate(2px,2px)＋影を3px→1px にしている。
   スマホは**指がボタンを覆う**のでこれでは見えない。使う側では
   影を0まで潰して影の位置まで落とし、地の色も一段濃くすること。 */

const PRESS_HOLD_MS = 110;

export function usePressFeel() {
  const [pressed, setPressed] = React.useState(false);
  const downAt = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const onPressIn = React.useCallback(() => {
    clearTimeout(timer.current);
    downAt.current = Date.now();
    setPressed(true);
  }, []);

  const onPressOut = React.useCallback(() => {
    const left = PRESS_HOLD_MS - (Date.now() - downAt.current);
    if (left <= 0) {
      setPressed(false);
      return;
    }
    timer.current = setTimeout(() => setPressed(false), left);
  }, []);

  return { pressed, onPressIn, onPressOut };
}

/* ———————————————— 押せるものの返事、ひとまとめ ————————————————
   沈み・触覚・星をまとめて配る。**押せるものは全部これを通す**。
   一部だけ返事があると、返事のないものが壊れて見える。

   ▍星は「指を離したとき」ではなく「触れた瞬間」に出す
   onPress は指を離したときに来る。ふつうのタップでも0.1秒前後あるので、
   そのぶん丸ごと待たされていた。onPressIn なら触れた瞬間に出る。

   引き換えに、**スクロールし始めた指が押せるものの上にあると、
   一度だけ星が出る**（RNはまず子に触りを渡し、あとからスクロールが
   奪うため）。速さを取ってこちらにしてある。うるさければ、
   下の burst をこのフックの onPress 側へ移せば元に戻る。 */

export function useTap({
  /** 星の大きさの倍率 */
  scale = 1,
  /** 星を出さない（連打させるところ、細かいものなど） */
  sparks = true,
  /** 触覚の強さ。既定は Medium（Light は画面を見ていないと分からない） */
  haptic = 'medium' as 'light' | 'medium' | 'none',
} = {}) {
  const burst = useSparkBurst();
  const { pressed, onPressIn: sink, onPressOut } = usePressFeel();

  const onPressIn = React.useCallback(
    (e: GestureResponderEvent) => {
      sink();
      if (Platform.OS !== 'web' && haptic !== 'none') {
        const style =
          haptic === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium;
        Haptics.impactAsync(style).catch(() => {});
      }
      if (!sparks) return;
      /* 指の座標が取れないとき（読み上げ操作など）は星を出さない。
         出すと画面の左上隅で光ってしまう */
      const { pageX, pageY } = e.nativeEvent;
      if (pageX || pageY) burst(pageX, pageY, scale);
    },
    [sink, burst, scale, sparks, haptic],
  );

  return { pressed, onPressIn, onPressOut };
}

/* ———————————————— タイルで画面を覆う ————————————————
   ゲームに入るときの切り替え。四角いタイルが**パパパパッと**並んで
   画面を埋め、埋まってから中身（タイトル）が出る。

   ▍速さで持たせる演出なので、伸ばさないこと
   1枚は0.16秒。斜めに走らせて、端から端まででも0.6秒に届かない。
   ゆっくりやると「読み込み中」に見えてしまい、逆効果になる。

   ▍なぜ斜めに走らせるのか
   端から順（横一列ずつ）だと拭き取りに見えて、コマが増えていく感じが
   出ない。斜め＋ばらつきにすると、1枚ずつ置かれているように見える。

   ▍タイルを1px大きくしている理由
   ぴったりの大きさだと、並べたときに継ぎ目が髪の毛みたいな線になって
   残る。重ねて潰す。 */

/** タイル1枚の目安（px）。画面幅から割った数で実際の大きさが決まる */
const TILE_TARGET = 78;
/** 1枚が出るのにかかる時間 */
const TILE_MS = 140;
/** 隣のタイルとの間隔。ここが「パパパパパ」の刻み。
    実機で測って、端から端まで（斜め14マス）が0.5秒に収まる値にした */
const TILE_STEP_MS = 22;

/** 0〜1の決まった散らばり。端末やビルドで並びが変わらないようにする */
const fract = (v: number) => v - Math.floor(v);
const jitterAt = (r: number, c: number) => fract(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453);

function Tile({
  left,
  top,
  size,
  delay,
  color,
}: {
  left: number;
  top: number;
  size: number;
  delay: number;
  color: string;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, {
      toValue: 1,
      duration: TILE_MS,
      delay,
      /* 少し行き過ぎてから収まる。重なるぶんには継ぎ目が消えるだけで害がない */
      easing: Easing.out(Easing.back(1.8)),
      useNativeDriver: NATIVE,
    });
    a.start();
    return () => a.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
      }}
    />
  );
}

export function TileIn({
  /** タイルの色。覆ったあとに出す画面の地と**同じ色**にすること
      （違う色にすると、消したときに色が変わったのが見えてしまう） */
  color = C.ink900,
  /** 覆い終わった合図 */
  onDone,
}: {
  color?: string;
  onDone?: () => void;
}) {
  const { width, height } = useWindowDimensions();

  const tiles = React.useMemo(() => {
    const cols = Math.max(3, Math.round(width / TILE_TARGET));
    const size = Math.ceil(width / cols);
    const rows = Math.ceil(height / size);
    const out: { key: string; left: number; top: number; size: number; delay: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push({
          key: `${r}-${c}`,
          left: c * size,
          top: r * size,
          size: size + 1,
          /* 斜めの帯（r+c）で走らせ、帯の中はばらつかせる */
          delay: (r + c + jitterAt(r, c) * 1.4) * TILE_STEP_MS,
        });
      }
    }
    return out;
  }, [width, height]);

  const last = React.useMemo(() => tiles.reduce((m, t) => Math.max(m, t.delay), 0), [tiles]);

  /* onDone は毎回作り直された関数で来ることがある。そのまま deps に置くと
     描画のたびにタイマーが張り直されて**いつまでも終わらない** */
  const done = React.useRef(onDone);
  done.current = onDone;
  React.useEffect(() => {
    const id = setTimeout(() => done.current?.(), last + TILE_MS);
    return () => clearTimeout(id);
  }, [last]);

  /* pointerEvents は既定のまま＝下の画面に触れさせない。
     覆っているあいだに、裏のレッスンのボタンが押せてしまうのを防ぐ */
  return (
    <View style={StyleSheet.absoluteFill}>
      {tiles.map(({ key, ...t }) => (
        <Tile key={key} {...t} color={color} />
      ))}
    </View>
  );
}

/** 動かないただの箱。条件で PopIn と入れ替えたいときに使う */
export function NoMotion({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
}
