/* ============================================================
   学習コンテンツの型定義。
   「職種で内容が少し変わる」を素直に表現するため、本文とプロンプト例は
   共通のテキスト（body）と職種別のテキスト（byRole）を両方持てるようにし、
   画面側で「選ばれている職種のものがあればそちらを使う」ようにしている。
   ============================================================ */
import type { IconName } from '@/components/icons';
import type { AvatarMotion } from '@/avatar/motions';

/* サイトの職種別ガイド（comixai.dev/guide）のスラッグと揃えてある。
   'other' だけはガイドに対応するページが無く、アプリの中だけの選択肢
   （どれにも当てはまらない人が先に進めるようにするためのもの）。
   'other' は byRole に一切書かないこと。共通文がそのまま出るのが正しい */
export type RoleId =
  | 'sales'
  | 'marketing'
  | 'office'
  | 'creator'
  | 'hr'
  | 'support'
  | 'planner'
  | 'owner'
  | 'it'
  | 'other';

export type ByRole<Tvalue> = Partial<Record<RoleId, Tvalue>>;

/** アバターのid（'sensei' 'senpai' …）で引く。→ src/data/avatars.ts */
export type AvatarId = string;

/* ============================================================
   セリフをアバター別に持つための入れ物。

   ▍なぜ要るのか
   フキダシの中身は**そのキャラがしゃべっている言葉**なので、相棒を
   変えたら口調も変わらないとおかしい。先輩は「テンション高め・タメ口」、
   相棒は「無感情・簡潔・数字で語る」と性格が決めてあるのに、いまは
   全員が先生の言葉で話していた（→ avatars.ts の personality）。

   ▍書けていないぶんは先生の言葉が出る
   1人あたり80本ほどあるので、一度に書き切る前提にしない。
   **未記入なら共通（＝先生）にそのまま落ちる**ので、モデルを足した
   キャラから少しずつ埋めていける。
   ============================================================ */
export type ByAvatar<Tvalue> = Partial<Record<AvatarId, Tvalue>>;

/* ============================================================
   体験カード。読むだけ・選ぶだけにしないための仕掛け。

   カードに interactive を足すと、本文の下に道具が出る。
   ▍打たせるものは、ごく一部でいい
   はじめは「打って結果を見る」ものばかりだった。17本中3本にしか体験が無く、
   しかもその3本すべてがテキスト入力で、残り14本は**読んでクイズ1問**だった。
   スマホで長文を打つのはそれ自体が面倒なので、体験の入口がそこだと入らない。

   なので**指1本で成立するもの**を軸にし、打つのは prompt-1 の1本だけ残した
   （本物のAIに渡す手ざわりは、それはそれで価値があるため）。

   ・sort          … 流れてくるものを左右に振り分ける（ウソ/ホント、入れていい/ダメ）
   ・find          … 文書の中の危ない行をタップして摘発する
   ・build         … 指示の部品を選ぶと、出力がその場で変わる
   ・fit           … 資料を選んで、限られた広さに詰める
   ・order         … 工程を正しい順に並べる
   ・tokenizer     … 好きに打って、トークンの割れ方を見る（合否なし）
   ・token-budget  … 決められたトークン数に収める
   ・ai-prompt     … 本物のAIに指示を渡して採点される

   **どれも、通らないとレッスンの先へ進めない**（合否の無いトークナイザーは
   「わかった」まで見れば通る。→ app/lesson/[id].tsx の gated）

   増やすときは、この union に足して src/components/mini-game.tsx に
   遊び方を書く。合否のあるものは onClear を呼ぶこと（呼ばないと先に進めない）。
   ============================================================ */

/** 仕分けの1枚 */
export interface SortItem {
  text: string;
  /** true なら「右」の箱が正解 */
  right: boolean;
  /** 答え合わせのときに出す一言 */
  why: string;
}

/** 組み立ての部品ひと組 */
export interface BuildSlot {
  /** 「役割」「形式」など、選ばせる軸の名前 */
  label: string;
  options: {
    name: string;
    /** これを選んだときに出力がどう変わるか（1〜2行） */
    result: string;
    /* ▍ゴールに沿う札。**各軸にちょうど1つ**だけ立てる

       もとは「弱い札」だけに印を付けて、それ以外はどれでも正解にして
       いた。良い選び方は1つとは限らない、という考えだったが、遊ぶ側から
       すると**何を選べば正解なのか分からない**（実機で指摘）。しかも
       「（指定しない）」のような明らかな外れが混ざるぶん、実質2択にも
       見えていた。

       いまは**先にゴールを1行で見せて、そこに効く札を1つだけ正解にする**。
       外れの札も「一見それっぽい」ものにして、ゴールと突き合わせないと
       選べないようにする。

       ▍ゴールに、正解の札の言葉をそのまま書かない
       「3年間いっしょに働いた同じ部署の人に〜」というゴールの下に
       「3年間一緒に働いた同じ部署の人」という札を出していた（実機で
       「ゴールで言ってるじゃん」の指摘）。**ゴールは状況と、良い結果が
       どういうものかだけを言う。** 札はそこから考えて選ぶ。
       ゴールが決めてしまう軸（この回なら「誰に」）は、軸ごと別のものに
       差し替える——ここでは「何に触れるか・長さ・どう締めるか」にした。 */
    ok?: boolean;
    /** 外れの札に書く。**ゴールに対して**なぜ届かないのか（決めたあとに出す） */
    why?: string;
  }[];
}

/** 並べる工程の1つ */
export interface OrderStep {
  name: string;
  /** 正しい位置に置けたときに出す一言 */
  why: string;
  /** まだ早いのに押したときに出す一言 */
  tooEarly: string;
}

/** 赤入れする原稿の1行 */
export interface RedlineItem {
  text: string;
  /** 直しの要る行だけ書く。無い行を押したら外れ */
  fix?: {
    /** どこが悪いのか。押した瞬間に出す（選ぶ前に読ませる） */
    problem: string;
    /** 直し方の候補。**正解は1つ**（ok を立てる） */
    choices: { text: string; ok?: boolean; why: string }[];
  };
}

/** 詰めるときに机へ載せる資料 */
export interface FitItem {
  name: string;
  /** 占める広さ */
  cost: number;
  /** この仕事に要るものか */
  needed: boolean;
  why: string;
}
/* ▍takeaway（おさらい）
   クリア画面に出す「なぜそれが正解か・何がNGか」の1〜2文。
   遊んでいる最中の正誤は分かっても、**貫いている原則**は言わないと
   伝わらない（実機で「なんでそれで正解かわからず納得感がない」の指摘）。
   合否のあるゲームには必ず書く */
export type LessonInteractive = (
  | {
      kind: 'sort';
      /** 何をどう仕分けるのか（1行）。**ゲーム中ずっと出しておく**。
          無いと、札と箱だけが並んで「何をしていいか分からない」画面になる */
      brief: string;
      /** 左右の箱の名前。左＝right:false、右＝right:true */
      left: string;
      right: string;
      items: SortItem[];
      /** 何枚まで間違えて通れるか */
      allow: number;
    }
  | {
      kind: 'find';
      /** 何を探すのか（1行） */
      brief: string;
      /** 文書の行。危ない行は bad を立てる */
      lines: { text: string; bad?: boolean; why?: string }[];
      /** 何回まで外して通れるか。省略すると1回 */
      allow?: number;
    }
  | {
      kind: 'build';
      brief: string;
      /** ▍このゲームのゴール。**始まってすぐ、常に画面に出す**
          「何をしたら正解か」が無いと、札を読み比べても決められない */
      goal: string;
      slots: BuildSlot[];
      /** 全部選び終わったときに出す締め */
      wrap: string;
      /** 何回まで外して通れるか。省略すると1軸まで */
      allow?: number;
    }
  | {
      kind: 'order';
      brief: string;
      /** **正しい順に書く**。画面には並べ替えて出す */
      steps: OrderStep[];
      wrap: string;
      /** 何回まで外して通れるか。省略すると2回（順番は当てにいきにくいので少し甘め） */
      allow?: number;
    }
  | {
      kind: 'fit';
      brief: string;
      /** 机の広さ */
      capacity: number;
      items: FitItem[];
      /** 何回まで外して通れるか。省略すると1回 */
      allow?: number;
    }
  | {
      kind: 'tokenizer';
      /** 押すと入る例文 */
      presets?: string[];
    }
  | {
      kind: 'token-budget';
      /** この範囲に収める（両端を含む） */
      min: number;
      max: number;
      /** 何を書かせるか */
      brief: string;
      presets?: string[];
    }
  | {
      kind: 'ai-prompt';
      /**
       * サイト側 /api/academy/grade の台帳にあるお題のID。
       * **お題の中身はサーバーが持つ。** アプリから渡すのはIDだけ
       * （中身を持たせると、そこを書き換えてAPIキーにタダ乗りされる）。
       * 増やすときは src/app/api/academy/grade/route.ts の EXERCISES にも足すこと
       */
      exerciseId: string;
      /** 画面に出すお題。サーバー側の brief と食い違わないようにする */
      brief: string;
      /** ▍前提資料。元の文章・読み手・状況など、**これが無いと書きようがないもの**。
          お題だけ渡して「指示を書け」だと、何を材料に書けばいいのか分からない
          （実機で指摘）。サーバー側 EXERCISES の given と揃えること */
      given?: { label: string; text: string }[];
      /** これ以上なら合格。届かなくても、書き直せば何度でも出せる */
      pass: number;
      presets?: string[];
    }
  | {
      /* ▍赤入れ（SRのおまけ用 → data/extras/）
         AIが書いた下書きに、赤ペンを入れて直していく。
         「書かせて終わりにしない」を、手を動かして体で覚える回。

         直す所を押す → 直し方を3つから選ぶ、の2段構え。
         押すだけの `find` と違い、**どう直すか**まで選ばせる */
      kind: 'redline';
      brief: string;
      lines: RedlineItem[];
      /** 何回まで外して通れるか。省略すると2回 */
      allow?: number;
    }
) & {
  /** クリア画面に出す「おさらい」。なぜそれが正解で、何がNGなのか */
  takeaway?: string;
};

export interface LessonCard {
  /** 本文の下に出す体験。読むだけにしないための仕掛け */
  interactive?: LessonInteractive;
  /** アバターの吹き出しセリフ。職種別に差し替えたいときは sayByRole、
      相棒別に書き分けたいときは sayByAvatar（→ resolveCard の優先順） */
  say: string;
  sayByRole?: ByRole<string>;
  sayByAvatar?: ByAvatar<string>;
  /** 再生するモーション（省略時は説明モーション） */
  motion?: AvatarMotion;
  /** 頭上に出すエモート */
  emote?: IconName;
  /** カード見出し */
  heading?: string;
  /** 本文。職種別に差し替えたいときは bodyByRole */
  body?: string;
  bodyByRole?: ByRole<string>;
  /** コピーできるプロンプト例（職種別の例を出す用途） */
  prompt?: string;
  promptByRole?: ByRole<string>;
  /** 箇条書き */
  bullets?: string[];
  bulletsByRole?: ByRole<string[]>;
}

/* ============================================================
   クイズ1問。

   ▍id は履歴の鍵。**一度決めたら変えない**
   間違えた問題は復習に回り、日を置いて戻ってくる（→ store/progress.tsx の
   quiz、app/review.tsx）。その記録をこのidで引くので、**idを変えると
   その人の「まだ直っていない問題」が行方不明になる**。
   問題文を直すのは構わないが、idはそのまま。差し替えるなら新しいidにする。

   ▍`${レッスンid}-q${通し番号}` で付ける
   順番から自動で作らないのは、あいだに1問足した瞬間に**それ以降の
   全部の履歴がずれる**から。書いた本人が明示的に持つ。 */
export interface QuizItem {
  id: string;
  q: string;
  choices: string[];
  /** choices のインデックス */
  answer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  /** 目安時間（分） */
  minutes: number;
  summary: string;
  cards: LessonCard[];
  quiz: QuizItem[];
  /* ▍「あなたの現場だと」——職種を選んだ意味が出るところ

     オンボーディングで「選んだ職種にあわせて例とプロンプトが変わります」と
     約束しているのに、**書き分けは78カード中16か所しかなかった**。
     8割のカードは誰が選んでも同じで、約束と実体が合っていない。

     そこで**全レッスンに1枚ずつ**、その職種の現場に落とした話を置く。
     カードとして持たずにここに置いてあるのは、カードの配列に職種別を
     混ぜると、レッスンごとに枚数が変わって進み具合の点がずれるため
     （→ courses/index.ts の lessonCards が最後に1枚足す）。

     ▍'other' には書かない
     「あてはまらない」を選んだ人には共通文が出るのが正しい。ここが
     空なら、そもそもこのカードが出ない。 */
  roleNote?: ByRole<string>;
}

export interface Course {
  id: string;
  icon: IconName;
  title: string;
  desc: string;
  /** role = 職種によって中身が変化するコース */
  kind: 'common' | 'role';
  /** 全レッスン修了で得られるバッジID */
  badgeId: string;
  /* ▍先に終えておくと良いコース

     5つのコースがいつでも開けるので、`basics-1`（トークンの話）を飛ばして
     `next-2`（RAG）に行くと確実に迷子になる。推奨順は一覧に書いてあるが、
     **順序そのものの設計が無かった**。

     ▍ロックはしない
     鍵をかけると、知っている人まで足止めする。開けるが、
     **開ける前に「先にこれ」と言う**（まなぶタブが出す）。 */
  needs?: string;
  lessons: Lesson[];
}
