/* ============================================================
   デザイントークン。
   Webサイト（src/app/globals.css）の「マンガのインク＋紙」の
   トークンをそのまま移植している。色を足すときは向こうと揃えること。
   ============================================================ */

export const C = {
  /* インク（線・文字） */
  ink900: '#14110f',
  ink800: '#2a2420',
  ink700: '#463e38',
  ink500: '#6e635b',
  ink300: '#a89c92',

  /* 紙（背景） */
  paper0: '#ffffff',
  paper50: '#fbf7ef',
  paper100: '#f4ecdd',
  paper200: '#e9dfc9',

  /* 少年漫画レッド（主アクセント） */
  red50: '#ffe9ea',
  red100: '#ffc9cc',
  red500: '#e60012',
  red600: '#c70010',
  red700: '#a1000c',

  /* AIブルー */
  blue50: '#e7f0ff',
  blue500: '#1a6cff',
  blue600: '#0f54d6',

  /* ハイライト */
  yellow200: '#ffe89a',
  yellow400: '#ffd23f',

  /* 補助セマンティクス */
  green500: '#1fa463',
  green50: '#e4f6ec',
  amber500: '#f08c00',
  amber50: '#fff1db',
} as const;

export const T = {
  bg: C.paper50,
  surface: C.paper0,
  sunk: C.paper100,
  text: C.ink900,
  body: C.ink800,
  muted: C.ink500,
  disabled: C.ink300,
  border: C.ink900,
  borderSoft: C.paper200,
  accent: C.red500,
  accentPress: C.red700,
  accentSoft: C.red50,
  link: C.blue600,
  marker: C.yellow400,
  ok: C.green500,
  okSoft: C.green50,
  warn: C.amber500,
  warnSoft: C.amber50,
} as const;

export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const R = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

/** マンガのコマのような「太いインク枠」。カード全般に使う */
export const inkBorder = {
  borderWidth: 2,
  borderColor: T.border,
  borderRadius: R.md,
} as const;

/** 枠の下と右に落ちる、ベタ塗りの影（マンガのコマ影） */
export const inkShadow = (offset = 3) =>
  ({
    shadowColor: T.border,
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  }) as const;

export const F = {
  /* 端末標準のゴシック。日本語のウェイト差が出るよう
     見出しは 800、本文は 400 を基本にする */
  title: { fontSize: 24, fontWeight: '800', color: T.text, letterSpacing: 0.2 },
  h1: { fontSize: 20, fontWeight: '800', color: T.text },
  h2: { fontSize: 17, fontWeight: '700', color: T.text },
  body: { fontSize: 15, lineHeight: 24, color: T.body },
  small: { fontSize: 13, lineHeight: 20, color: T.muted },
  tiny: { fontSize: 11, lineHeight: 16, color: T.muted },
  label: { fontSize: 12, fontWeight: '700', color: T.muted, letterSpacing: 0.4 },
} as const;
