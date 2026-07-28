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

export interface LessonCard {
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
