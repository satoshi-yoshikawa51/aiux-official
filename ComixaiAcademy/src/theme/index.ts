/* ============================================================
   デザイントークン。
   サイトの src/app/globals.css と src/app/ds.tsx を移植したもの。
   数値を変えるときは向こうと揃えること。

   注意: React Native では fontWeight で別ファイルのフォントを
   選んでくれない。太さは必ず fontFamily で指定する（下の Type 参照）。
   ============================================================ */

export const C = {
  ink900: '#14110f',
  ink800: '#2a2420',
  ink700: '#463e38',
  ink500: '#6e635b',
  ink300: '#a89c92',

  paper0: '#ffffff',
  paper50: '#fbf7ef',
  paper100: '#f4ecdd',
  paper200: '#e9dfc9',

  red50: '#ffe9ea',
  red100: '#ffc9cc',
  red500: '#e60012',
  red600: '#c70010',
  red700: '#a1000c',

  blue50: '#e7f0ff',
  blue500: '#1a6cff',
  blue600: '#0f54d6',

  yellow200: '#ffe89a',
  yellow400: '#ffd23f',

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
  accentHover: C.red600,
  accentPress: C.red700,
  accentSoft: C.red50,
  link: C.blue600,
  marker: C.yellow400,
  ok: C.green500,
  okSoft: C.green50,
  warn: C.amber500,
  warnSoft: C.amber50,
} as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** --radius-* */
export const R = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  bubble: 22,
  full: 999,
} as const;

/** --bw-* 線の太さ */
export const BW = { hair: 1, line: 2, bold: 3, heavy: 4 } as const;

/** --shadow-pop-* ずらし量（ベタ塗りの影） */
export const POP = { sm: 3, md: 5, lg: 8 } as const;

/* ———————————————— 文字 ————————————————
   fontFamily は expo-font に登録した名前（_layout.tsx を参照）。 */
export const FONT = {
  /** 見出し・強調（900） */
  display: 'ZenKakuBlack',
  /** 小見出し・ボタン（700） */
  heading: 'ZenKakuBold',
  /** 本文（400） */
  body: 'ZenKakuRegular',
  /** 手書き風。ひとこと・キャプション用 */
  hand: 'YuseiMagic',
  /** キッカー・数字 */
  mono: 'JetBrainsMonoBold',
} as const;

export const F = {
  /** 画面タイトル */
  title: { fontFamily: FONT.display, fontSize: 26, lineHeight: 34, color: T.text, letterSpacing: 0.3 },
  h1: { fontFamily: FONT.display, fontSize: 20, lineHeight: 28, color: T.text, letterSpacing: 0.3 },
  h2: { fontFamily: FONT.display, fontSize: 17, lineHeight: 25, color: T.text, letterSpacing: 0.2 },
  /** 太字の本文（ボタン・リスト見出し） */
  strong: { fontFamily: FONT.heading, fontSize: 15, lineHeight: 23, color: T.text },
  body: { fontFamily: FONT.body, fontSize: 15, lineHeight: 26, color: T.body },
  small: { fontFamily: FONT.body, fontSize: 13, lineHeight: 21, color: T.muted },
  tiny: { fontFamily: FONT.body, fontSize: 11, lineHeight: 17, color: T.muted },
  /** セクションの上に置く小見出し（英数・赤・字間広め） */
  kicker: { fontFamily: FONT.mono, fontSize: 11, lineHeight: 14, color: C.red600, letterSpacing: 1.8 },
  /** 手書き風のひとこと */
  hand: { fontFamily: FONT.hand, fontSize: 14, lineHeight: 22, color: T.muted },
  handLg: { fontFamily: FONT.hand, fontSize: 17, lineHeight: 27, color: T.text },
  /** 数字（進捗・カウント） */
  num: { fontFamily: FONT.mono, fontSize: 13, lineHeight: 18, color: T.muted },
} as const;
