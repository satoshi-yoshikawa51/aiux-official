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

/* ============================================================
   体験カード。読むだけ・選ぶだけにしないための仕掛け。

   カードに interactive を足すと、本文の下に道具が出る。
   ・tokenizer     … 好きに打って、トークンの割れ方を見る（合否なし）
   ・token-budget  … 決められたトークン数に収める（**通らないと次に進めない**）

   増やすときは、この union に足して src/components/lesson-interactive.tsx に
   描き方を書く。合否のあるものは done を呼ぶこと（呼ばないと先に進めない）。
   ============================================================ */
export type LessonInteractive =
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
      /** これ以上なら合格。届かなくても、書き直せば何度でも出せる */
      pass: number;
      presets?: string[];
    };

export interface LessonCard {
  /** 本文の下に出す体験。読むだけにしないための仕掛け */
  interactive?: LessonInteractive;
  /** アバターの吹き出しセリフ。職種別に差し替えたいときは sayByRole */
  say: string;
  sayByRole?: ByRole<string>;
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

export interface QuizItem {
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
  lessons: Lesson[];
}
