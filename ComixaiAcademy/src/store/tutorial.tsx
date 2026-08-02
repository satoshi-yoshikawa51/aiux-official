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

export interface TutorialStep {
  /** 移動先のタブ（expo-router のパス） */
  route: '/' | '/learn' | '/badges' | '/settings';
  /** 光らせるタブアイコンの名前。TabIcon 側がこれと自分を見比べる */
  glow: IconName;
  /** 先生のセリフ */
  say: string;
}

export const TUTORIAL: TutorialStep[] = [
  {
    route: '/',
    glow: 'home',
    say: 'ここがホームだ。おれはここに立ってる。上の黒い帯が、あんたの称号と進み具合だな。',
  },
  {
    route: '/',
    glow: 'home',
    say: '真ん中の黒いカセットが「次にやること」。迷ったらこれを押せ。それだけでいい。',
  },
  {
    route: '/learn',
    glow: 'learn',
    say: 'ここが「まなぶ」。コースとレッスンが全部並んでる。赤い枠が付いてるのが、次の1本だ。',
  },
  {
    route: '/badges',
    glow: 'badges',
    say: '終えるとバッジが増える。数がたまると称号が上がる。……まあ、おまけみたいなもんだが、効くぞ。',
  },
  {
    route: '/settings',
    glow: 'settings',
    say: '相棒と職種は、ここでいつでも変えられる。職種を変えると、例とプロンプトが差し替わる。',
  },
  {
    route: '/',
    glow: 'home',
    say: '案内は以上だ。あとは手を動かすだけ。1本目からいけ。',
  },
];

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
