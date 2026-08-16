/* ============================================================
   チュートリアル中に「いま説明している場所」を光らせる。

   ▍タブと同じやり方をする
   座標を測ってオーバーレイを重ねる、はやらない（→ store/tutorial.tsx）。
   案内は**「いまどこを指しているか」という名前だけを配る**ので、
   囲われる側が自分の名前と見比べて、自分で光る。
   画面が変わっても安全領域が変わっても狂わない。

   ▍透明度で「ふわっ」とやるのはやめた
   最初は枠1本を薄く濃くしていたが、線は面積が無いので薄くなった瞬間に
   背景へ沈む。次ににじみ（boxShadow）を足したが、**ぼけた光は
   「何かが光っている」ようには見えても「どこを指しているか」が伝わらない**。

   いまは**大きさで見せている**。枠を 等倍 → 中 → 大 → 特大 と
   4段で外へ飛ばして、また等倍に戻る。段で切り替わるので、
   にじみと違って「広がっている」ことがはっきり分かる。
   等倍の枠は**動かさず出しっぱなし**にして、囲いの本体を保つ。

   ▍外へ出す余地は場所ごとに違う
   コマ（Panel）の中は overflow:'hidden' なので、はみ出した輪は切られる。
   切れた輪は「壊れて見える」ので、**余地の狭いところは room で狭める**。
   画面の端については、タブの土台（app/(tabs)/_layout.tsx）で切っている
   ——切らないとモバイルのブラウザがページごとズームアウトする。
   ============================================================ */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { isSpot, useTutorial, type SpotName } from '@/store/tutorial';
import { BW, C, R } from '@/theme';

/** 1段の持ち時間。4段で約0.9秒ひとまわり */
const STEP_MS = 230;
/** 何段で飛ばすか。0段目＝等倍 */
const STEPS = 4;
/** 段が進むほど少しだけ薄くする。外へ抜けていく向きが出る */
const FADE = [1, 0.95, 0.8, 0.62];
/** 外へ出せる余地の既定値（px）。

    **ここは思ったより狭い。** カードは画面の内余白16pxの内側に置かれ、
    コマの中の行もコマの内余白16pxの内側にいる。16を超えて飛ばすと
    画面の外か、コマの overflow:'hidden' に切られて、輪の左右だけが
    消えた「壊れた枠」になる。なので既定は14に留め、
    **足りないぶんは段の切り替わり（4段ぜんぶ違う大きさ）で見せる**。 */
const ROOM = 14;

/** 黄色を透かして使う。C.yellow400 と同じ色 */
const glow = (a: number) => `rgba(255, 210, 63, ${a})`;

/** チュートリアル（store/tutorial.tsx）が指している場所を光らせる */
export function Spotlight({
  name,
  ...rest
}: {
  name: SpotName;
  children: React.ReactNode;
  radius?: number;
  inset?: number;
  room?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { step } = useTutorial();
  return <Ring on={isSpot(step, name)} {...rest} />;
}

/* ▍光る輪だけを取り出してある
   チュートリアル以外にも「ここを押して」と指したい場面が出てきた
   （ガチャの案内＝1本目のあとに、ホームのガチャの入口を指す）。
   同じ見た目・同じ動きにしたいので、**指す理由**（誰が指しているか）だけを
   外から渡す形にして、描き方はここ1か所に置く */
export function Ring({
  on,
  children,
  /** 枠の角の丸み。囲う相手に合わせる */
  radius = R.sm,
  /** 芯の枠の位置。マイナスで外側に張り出す */
  inset = 0,
  /** 外へ飛ばせる余地。**切られる場所では狭める**（コマの内側など） */
  room = ROOM,
  style,
}: {
  on: boolean;
  children: React.ReactNode;
  radius?: number;
  inset?: number;
  room?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    if (!on) return;
    setPhase(0);
    const id = setInterval(() => setPhase((n) => (n + 1) % STEPS), STEP_MS);
    return () => clearInterval(id);
  }, [on]);

  if (!on) return <View style={style}>{children}</View>;

  /** 外へ o だけ張り出した枠 */
  const frame = (o: number, alpha: number): ViewStyle => ({
    position: 'absolute',
    left: inset - o,
    right: inset - o,
    top: inset - o,
    bottom: inset - o,
    borderRadius: radius + o,
    borderWidth: BW.bold,
    borderColor: glow(alpha),
  });

  /* 0段目は等倍（＝芯の枠に重なる）。あとは room を3つに割って外へ */
  const grow = (phase / (STEPS - 1)) * room;

  return (
    <View style={style}>
      {children}

      {/* ———— 芯の枠 ————
           動かない。飛んでいる輪が外にいるあいだも、
           **どこを囲っているのかが分かる**ようにここは出しっぱなし */}
      <View
        pointerEvents="none"
        style={{
          ...frame(0, 1),
          borderColor: C.yellow400,
          /* 線だけだと白い紙の上で細く見えるので、ごく薄く面を敷く */
          backgroundColor: glow(0.12),
          /* 黒地の上でいちばん効く、控えめなにじみ。**動かさない**
             （動かすと、また「ふわっ」に戻ってしまう） */
          boxShadow: `0px 0px 10px 2px ${glow(0.55)}`,
        }}
      />

      {/* ———— 飛んでいく輪 ————
           等倍 → 中 → 大 → 特大 の4段。段で切り替わるので、
           広がっていることが**ひと目で**分かる */}
      <View pointerEvents="none" style={frame(grow, FADE[phase])} />
    </View>
  );
}
