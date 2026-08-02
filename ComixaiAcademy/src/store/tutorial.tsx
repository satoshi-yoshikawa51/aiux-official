/* ============================================================
   チュートリアル。職種を選び終えたあと、選んだ先生がアプリを案内する。

   ▍タブを光らせる方法
   タブボタンの座標を測ってオーバーレイを重ねる——のはやらない。
   expo-router の Tabs からボタンの位置を取るのは素直でないし、
   端末や安全領域で狂う。

   代わりに**「いまどのタブが光る番か」だけを配る**。TabIcon が自分の名前と
   見比べて、自分の番なら自分でリングを描く。座標の計算がまるごと要らなくなる。

   案内は実際にその画面へ移動してから出す（router.replace）。
   ============================================================ */
import { useRouter } from 'expo-router';
import React from 'react';

import type { IconName } from '@/components/icons';

/** 画面の中で囲う場所の名前。
    タブの glow と同じ考えで、**囲われる側が自分で見比べて自分で描く**
    （→ components/spotlight.tsx）。タブは切り替えても全部そのまま
    載っているので、画面をまたいで同じ名前を使い回さないこと */
export type SpotName =
  | 'home-head'
  | 'home-next'
  | 'learn-next'
  | 'badges-next'
  | 'settings-avatar';

export interface TutorialStep {
  /** 移動先のタブ（expo-router のパス） */
  route: '/' | '/learn' | '/badges' | '/settings';
  /** 光らせるタブアイコンの名前。TabIcon 側がこれと自分を見比べる */
  glow: IconName;
  /** 画面の中で光らせる場所。複数を同時に指してもいい */
  spot?: SpotName | SpotName[];
  /** フキダシを上に出す。**指している場所がフキダシの下敷きになる回**で使う
      （既定は下。下のほうが親指に近くて押しやすい） */
  bubble?: 'top' | 'bottom';
  /** 先生のセリフ */
  say: string;
}

export const TUTORIAL: TutorialStep[] = [
  {
    route: '/',
    glow: 'home',
    spot: 'home-head',
    say: 'ここがホームだ。おれはここに立ってる。上の黒い帯が、あんたの称号と進み具合だな。',
  },
  {
    route: '/',
    glow: 'home',
    spot: 'home-next',
    /* カセットは画面のいちばん下にあり、**ふだんの位置のフキダシが
       まるごと覆ってしまう**（光の左右がはみ出すだけになる）。
       この回だけフキダシを上へ逃がす */
    bubble: 'top',
    say: '下の黒いカセットが「次にやること」。迷ったらこれを押せ。それだけでいい。',
  },
  {
    route: '/learn',
    glow: 'learn',
    /* セリフが指しているのは**一覧の中の1行**なので、上の黒いカセットでは
       なくそちらを囲う。案内が流れるのはオンボーディング直後だけなので、
       次の1本は必ず先頭にあって見えている。

       ▍「赤い枠」とは言わない
       次の1本はふだん赤い枠で示しているが、案内中はその上に黄色い枠が
       重なる。**言っている色と見えている色が食い違う**ので、
       ここでは色ではなく「光ってる」で指す */
    spot: 'learn-next',
    say: 'ここが「まなぶ」。コースとレッスンが全部並んでる。いま光ってるのが、次の1本だ。',
  },
  {
    route: '/badges',
    glow: 'badges',
    spot: 'badges-next',
    say: '終えるとバッジが増える。数がたまると称号が上がる。……まあ、おまけみたいなもんだが、効くぞ。',
  },
  {
    route: '/settings',
    glow: 'settings',
    /* 職種の見出しはアバター5枚のぶんだけ下にあり、フキダシの下敷きになる。
       **見えない光は出さない**——指すのは見出し1つだけにして、
       職種はセリフで「下だ」と言う（案内中もスクロールできる。
       フキダシは box-none なので、後ろの画面に触れる） */
    spot: 'settings-avatar',
    say: '相棒と職種は、ここでいつでも変えられる。職種はこの下だ。変えると、例とプロンプトが差し替わる。',
  },
  {
    /* 締めはどこも囲わない。**全部を指したら、何も指していないのと同じ** */
    route: '/',
    glow: 'home',
    say: '案内は以上だ。あとは手を動かすだけ。1本目からいけ。',
  },
];

/** いまこの場所を指しているか。spot は1つでも配列でもいい */
export function isSpot(step: TutorialStep | null, name: SpotName): boolean {
  if (!step?.spot) return false;
  return Array.isArray(step.spot) ? step.spot.includes(name) : step.spot === name;
}

interface Ctx {
  /** 案内中か */
  active: boolean;
  step: TutorialStep | null;
  /** 何歩目か（1始まり）と全体の数。「2 / 6」の表示に使う */
  index: number;
  total: number;
  start: () => void;
  next: () => void;
  /** 途中でやめる。最後まで見たときも同じ扱い */
  finish: () => void;
}

const TutorialContext = React.createContext<Ctx | null>(null);

export function TutorialProvider({
  children,
  onFinish,
}: {
  children: React.ReactNode;
  /** 見終わった（またはやめた）ときに呼ばれる。保存はここで */
  onFinish: () => void;
}) {
  const router = useRouter();
  const [i, setI] = React.useState<number | null>(null);

  const go = React.useCallback(
    (n: number) => {
      const s = TUTORIAL[n];
      if (s) router.replace(s.route);
      setI(n);
    },
    [router],
  );

  const start = React.useCallback(() => go(0), [go]);

  const finish = React.useCallback(() => {
    setI(null);
    onFinish();
    router.replace('/');
  }, [onFinish, router]);

  const next = React.useCallback(() => {
    if (i === null) return;
    if (i + 1 >= TUTORIAL.length) finish();
    else go(i + 1);
  }, [i, go, finish]);

  const value = React.useMemo<Ctx>(
    () => ({
      active: i !== null,
      step: i === null ? null : TUTORIAL[i],
      index: (i ?? 0) + 1,
      total: TUTORIAL.length,
      start,
      next,
      finish,
    }),
    [i, start, next, finish],
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

/** タブの外（Providerが無いところ）でも呼べるように、既定値を返す */
export function useTutorial(): Ctx {
  return (
    React.useContext(TutorialContext) ?? {
      active: false,
      step: null,
      index: 0,
      total: TUTORIAL.length,
      start: () => {},
      next: () => {},
      finish: () => {},
    }
  );
}
