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

import { voiceIdOf, type AvatarId, type ByAvatar } from '@/data/types';

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
  /** セリフを誰の口から出すか。

      'avatar' … その画面に立っているアバターのフキダシに出す。
                 案内のパネルは操作ボタンだけの細い帯になる。
      既定    … 案内のパネル自身が言う（アバターが居ない画面）。

      ▍**同じ先生が2か所で同時にしゃべらないようにするための指定**
      ホームにはアバターのフキダシがあり、そこに挨拶が出ている。
      案内のパネルにもセリフを出すと、同じ人物の声が2つ並んで
      どちらを読めばいいのか分からなくなる。 */
  voice?: 'avatar';
  /** 相棒のセリフ（共通＝先生の言葉） */
  say: string;
  /** 相棒別の書き分け。**未記入なら say に落ちる** */
  sayByAvatar?: ByAvatar<string>;
}

/** 案内のセリフを、選んでいる相棒の口調で返す */
export function stepSay(step: TutorialStep, avatarId: AvatarId | null): string {
  const id = voiceIdOf(avatarId);
  if (id && step.sayByAvatar?.[id] !== undefined) return step.sayByAvatar[id];
  return step.say;
}

/* ▍最初に選べる2人には、必ず書く

   `say` は共通＝先輩（もと先生）の言葉で、書けていない相棒はここに落ちる
   （→ data/voice.ts）。ふだんはそれでいいが、**案内だけは別**。

   最初に選べるのは おっとり と ねっけつ の2人（→ data/avatars.ts）。
   その2人を選んだ人が、アプリで最初に読む文章がこの案内で、そこで
   ぶっきらぼうな先輩の口調が出てくると、**選んだ相手と目の前でしゃべる人が
   別人になる**。第一印象がそこで壊れるので、この6歩だけは2人ぶん書く。

   ▍逆に、ガチャで当たる相棒のぶんは要らない
   案内が走るのは**職種を決めた直後の1回だけ**（→ app/(tabs)/_layout.tsx）。
   そこで選べるのは初期の2人だけで、記録を消してやり直しても同じ2人からになる。
   つまり おてんば・かんろく が案内をしゃべる道は無い。ここに書いても**誰にも
   読まれない**ので、その2人は場面ごとのセリフ（data/voice.ts）だけでいい。

   **初期選択に相棒を足したときは、ここも一緒に書くこと。** */
export const TUTORIAL: TutorialStep[] = [
  {
    route: '/',
    glow: 'home',
    spot: 'home-head',
    voice: 'avatar',
    say: 'ここがホーム。私はここに立ってる。上の黒い帯が、あなたの称号と進み具合ね。',
    sayByAvatar: {
      ottori: 'ここがホームです。わたしはここに立っていますね。上の黒い帯が、あなたの称号と進み具合です。',
      nekketsu: 'ここがホームだ！ おれはずっとここにいる。上の黒い帯が、きみの称号と進み具合だぜ。',
    },
  },
  {
    route: '/',
    glow: 'home',
    spot: 'home-next',
    voice: 'avatar',
    say: '下の黒いカセットが「次にやること」。迷ったらこれを押して。それだけでいい。',
    sayByAvatar: {
      ottori: '下の黒いカセットが「次にやること」です。迷ったら、これを押せば大丈夫ですよ。',
      nekketsu: '下の黒いカセットが「次にやること」だ。迷ったら押せ。考えるより先に手を動かす、それでいい。',
    },
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
    say: 'ここが「まなぶ」。コースとレッスンが全部並んでる。いま光ってるのが、次の1本。',
    sayByAvatar: {
      ottori: 'ここが「まなぶ」です。コースとレッスンが全部並んでいます。いま光っているのが、次の1本ですね。',
      nekketsu: 'ここが「まなぶ」だ。コースもレッスンも全部ここにある。光ってるのが、次の1本だぜ。',
    },
  },
  {
    route: '/badges',
    glow: 'badges',
    spot: 'badges-next',
    say: '終えるとバッジが増えて、数がたまると称号が上がる。……まあ、おまけみたいなものだけど、効くよ。',
    sayByAvatar: {
      ottori: '終えるとバッジが増えて、たまると称号が上がります。……おまけみたいなものですけど、うれしいですよ。',
      nekketsu: '終えるとバッジが増える。たまれば称号が上がるんだ。……ちっぽけに見えるか？ 積んだやつにしか分からん重さだぞ。',
    },
  },
  {
    route: '/settings',
    glow: 'settings',
    /* 職種の見出しはアバター5枚のぶんだけ下にある。**見えない光は出さない**ので
       指すのは見出し1つだけ。案内中は画面を止めている（触ると次へ進む）ので、
       「下だ」と場所を指す言い方もしない——スクロールできないため */
    spot: 'settings-avatar',
    say: '相棒と職種は、ここでいつでも変えられる。職種を変えると、例とプロンプトが差し替わる。',
    sayByAvatar: {
      ottori: '相棒と職種は、ここでいつでも変えられます。職種を変えると、例とプロンプトが差し替わりますよ。',
      nekketsu: '相棒も職種も、ここでいつでも変えられる。職種を変えりゃ、例もプロンプトも丸ごと入れ替わるぜ。',
    },
  },
  {
    /* 締めはどこも囲わない。**全部を指したら、何も指していないのと同じ** */
    route: '/',
    glow: 'home',
    voice: 'avatar',
    say: '案内は以上。あとは手を動かすだけ。1本目、いってみようか。',
    sayByAvatar: {
      ottori: '案内は以上です。あとは、あなたのペースで。1本目、いってみましょうか。',
      nekketsu: '案内は以上だ。あとは手を動かすだけ。……いくぞ、1本目！',
    },
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
  /** 案内パネルの高さ（実測）。

      ▍**パネルは浮かせるが、場所は空けさせる**
      かつては画面の上に浮かべっぱなしにしていて、指している当のものを
      パネルが覆ってしまっていた（ホームのカセット、そのあとはフキダシ）。
      「この回だけ上に逃がす」で凌ごうとしたが、逃がした先にも別のものが
      あって同じことの繰り返しになる。

      いまはパネルが自分の高さを測って配り、**画面がそのぶん下を空ける**
      （→ components/ui.tsx の Screen）。覆うものが無くなるので、
      逃がす必要も、黒帯の高さを決め打ちする必要も無くなった。 */
  panelH: number;
  setPanelH: (h: number) => void;
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
  const [panelH, setPanelH] = React.useState(0);

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
      panelH,
      setPanelH,
      index: (i ?? 0) + 1,
      total: TUTORIAL.length,
      start,
      next,
      finish,
    }),
    [i, panelH, start, next, finish],
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

/** タブの外（Providerが無いところ）でも呼べるように、既定値を返す */
export function useTutorial(): Ctx {
  return (
    React.useContext(TutorialContext) ?? {
      active: false,
      step: null,
      panelH: 0,
      setPanelH: () => {},
      index: 0,
      total: TUTORIAL.length,
      start: () => {},
      next: () => {},
      finish: () => {},
    }
  );
}
