/* ============================================================
   アバターGLBに入っているアニメーション名。
   Webサイトの src/app/claude-app/sensei.tsx と同じ命名で揃えている。
   新しいアバターGLBを足すときも、この11種の名前を使うこと。
   ============================================================ */

export const MOTIONS = [
  'laugh',
  'wave',
  'bow',
  'idle-a',
  'arms-crossed',
  'walk',
  'scared',
  'angry',
  'worried',
  'idle-b',
  'explain',
] as const;

export type AvatarMotion = (typeof MOTIONS)[number];

/** ループし続けるモーション。それ以外は一度だけ再生して待機に戻る */
export const LOOPING: AvatarMotion[] = ['idle-a', 'idle-b', 'explain', 'arms-crossed', 'walk'];

export const IDLE: AvatarMotion = 'idle-a';
