/* ============================================================
   ガチャの台帳。

   ▍通貨は「ガチャP」
   学習の節目で貯まる（→ store/progress.tsx）:
   ・ログインボーナス +1（1日1回、ホームを開いたとき）
   ・バッジ獲得 +1／称号が上がる +3／修了試験に合格 +2
   買えない・課金しない。**学びの副産物としてだけ**貯まる。

   ▍景品は「舞台テーマ」
   ホームの教室に色と演出を重ねる（→ components/stage-effect.tsx）。
   アバター本体を景品にしないのは、**3Dモデルがまだ先生しか無い**ため。
   モデルが増えたら prize の型を広げてここに足す。

   ▍ダブりは +1P 返す
   小さいプールなので、返さないと後半のハズレ感が強すぎる。
   ============================================================ */

export type Rarity = 'N' | 'R' | 'SR';

export interface StageTheme {
  id: string;
  name: string;
  rarity: Rarity;
  /** 引いたときに出す一言 */
  desc: string;
  /** 舞台（教室の写真）に重ねる色。'transparent'＝素のまま */
  tint: string;
  /** 追加の飾り（→ components/stage-effect.tsx） */
  effect?: 'stars' | 'snow' | 'sakura' | 'rain' | 'kira';
}

/** 最初から持っている素の教室 */
export const DEFAULT_THEME_ID = 'classroom';

export const THEMES: StageTheme[] = [
  {
    id: 'classroom',
    name: 'いつもの教室',
    rarity: 'N',
    desc: 'ここから始まった。',
    tint: 'transparent',
  },
  {
    id: 'asayake',
    name: '朝焼けの教室',
    rarity: 'N',
    desc: '1限より早い時間の色。',
    tint: 'rgba(255,170,110,0.22)',
  },
  {
    id: 'yuugure',
    name: '夕暮れの教室',
    rarity: 'N',
    desc: '居残り学習の色。',
    tint: 'rgba(235,120,20,0.28)',
  },
  {
    id: 'ame',
    name: '雨の日の教室',
    rarity: 'N',
    desc: '雨音は集中力のBGM。',
    tint: 'rgba(70,90,120,0.32)',
    effect: 'rain',
  },
  {
    id: 'sepia',
    name: '思い出のセピア',
    rarity: 'N',
    desc: 'ずっと前からここにいた気がする。',
    tint: 'rgba(110,66,20,0.35)',
  },
  {
    id: 'shinya',
    name: '深夜の自習室',
    rarity: 'N',
    desc: '誰もいない。はかどる。',
    tint: 'rgba(18,26,58,0.45)',
  },
  {
    id: 'sakura',
    name: '桜舞う教室',
    rarity: 'R',
    desc: '春。何かが始まる感じがする。',
    tint: 'rgba(255,170,190,0.22)',
    effect: 'sakura',
  },
  {
    id: 'yuki',
    name: '雪の日の教室',
    rarity: 'R',
    desc: 'しんとした空気。声がよく通る。',
    tint: 'rgba(190,205,230,0.30)',
    effect: 'snow',
  },
  {
    id: 'hoshizora',
    name: '星降る教室',
    rarity: 'SR',
    desc: '窓の外、ぜんぶ星。',
    tint: 'rgba(8,14,44,0.55)',
    effect: 'stars',
  },
  {
    id: 'ougon',
    name: '黄金の教室',
    rarity: 'SR',
    desc: 'マスターの部屋には、金の光が差す。',
    tint: 'rgba(255,196,40,0.30)',
    effect: 'kira',
  },
];

/** ガチャで出るもの（初期所持の教室は入れない） */
export const GACHA_POOL: StageTheme[] = THEMES.filter((t) => t.id !== DEFAULT_THEME_ID);

/** 1回の値段 */
export const SPIN_COST = 3;

/** ダブったとき返すP */
export const DUPE_REFUND = 1;

/** レア度の出やすさ。合計100 */
export const RARITY_WEIGHT: Record<Rarity, number> = { N: 62, R: 28, SR: 10 };

export const RARITY_COLOR: Record<Rarity, string> = {
  N: '#8a8078',
  R: '#1a6cff',
  SR: '#f5b301',
};

export function getTheme(id: string | null | undefined): StageTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** 抽選。レア度を重みで引いてから、その中で等確率 */
export function draw(): StageTheme {
  const total = Object.values(RARITY_WEIGHT).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let rarity: Rarity = 'N';
  for (const [r, w] of Object.entries(RARITY_WEIGHT) as [Rarity, number][]) {
    roll -= w;
    if (roll <= 0) {
      rarity = r;
      break;
    }
  }
  const pool = GACHA_POOL.filter((t) => t.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}
