/* ============================================================
   ガチャの台帳。

   ▍通貨は「ガチャP」
   学習の節目で貯まる（→ store/progress.tsx）:
   ・ログインボーナス +1（1日1回、ホームを開いたとき）
   ・バッジ獲得 +1／称号が上がる +3／修了試験に合格 +2
   買えない・課金しない。**学びの副産物としてだけ**貯まる。

   ▍景品は「舞台テーマ」と「アバター」
   舞台テーマはホームの教室に色と演出を重ねる
   （→ components/stage-effect.tsx）。アバターは先生の色違い
   （金髪の先生＝独立した1体として扱う。GLB共通・テクスチャ差し替えで
   成立する → data/avatars.ts の SKINS）。**選べるアバターはガチャで
   増えていく**のが建て付けで、相棒たちの3Dモデルができたら
   キャラ本体もこのプールに足す。

   ▍ダブりは +1P 返す
   小さいプールなので、返さないと後半のハズレ感が強すぎる。
   ============================================================ */
import { SKINS } from '@/data/avatars';
import { CLASSROOM } from '@/data/stage';

export type Rarity = 'N' | 'R' | 'SR';

/** 舞台の絵。1枚ごとに比率・壁色・拡大率が違うので、まとめて持つ。
    比率と壁色は npm run stage:prepare が出したものをそのまま貼る */
export interface StageArt {
  src: number;
  /** 幅÷高さ。コマを覆う最小の大きさで敷くのに要る */
  ratio: number;
  /** 絵のいちばん上の色。コマが縦に余ったぶんを埋めて継ぎ目を消す */
  wall: string;
  /* ▍地平線（床の消失点）が絵の上から何割の位置にあるか

     これを渡すと、**キャラの目線がそこに来る大きさ**に自動で縮める。
     渡さないと今までどおりコマいっぱいに立つ。

     ▍なぜ要るのか
     写真でも絵でも、地平線はカメラの高さにある。だから**そこに立つ人の
     目線は必ず地平線と重なる**。キャラの目線が地平線より上にあれば
     「カメラより背が高い人」＝巨人に、下にあれば小人に見える。

     コマいっぱいにキャラを立てると目線はコマの上17%に来る。絵の地平線が
     上から53%（＝実際に描かれた中庭）だと、その差がまるごと巨人に見える
     ぶんになる。**背景を拡大して詰めることはできない**——計算上2.4倍要って、
     そこまで寄せるとベンチも木も空も画面から消える（実際に試した）。
     残る手はキャラを縮めること。

     ▍新しく描くときは 0.5
     消失点を画面のちょうど中央に置いて描く。するとキャラはコマの
     57%ほどの高さになり、景色と噛み合う。値は「絵のどこに地平線が
     あるか」を目で見て入れる（床と壁の境目・平行線が集まる高さ）。 */
  horizon?: number;
}

export interface StageTheme {
  id: string;
  name: string;
  rarity: Rarity;
  /** 引いたときに出す一言 */
  desc: string;
  /** 舞台に重ねる色。'transparent'＝素のまま */
  tint: string;
  /** 追加の飾り（→ components/stage-effect.tsx） */
  effect?: 'stars' | 'snow' | 'sakura' | 'rain' | 'kira' | 'ember';
  /** 専用の絵。**無いテーマは素の教室に色を重ねる**（もとの作り）。
      絵が描けたものから art を足していく → assets/images/_raw/README.md */
  art?: StageArt;
  /** SRだけの縁飾り。コマの内側に光る枠が出て、棚でもひと目で分かる */
  glow?: 'gold' | 'cyan';
  /** せっていの丸ポチの色。絵つきのテーマは tint が透明なので、
      その絵らしい色をここに書く（→ (tabs)/settings.tsx） */
  swatch?: string;
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
    art: CLASSROOM,
  },
  {
    id: 'courtyard',
    name: '中庭のベンチ',
    rarity: 'N',
    desc: '昼休みの15分でも進む。',
    tint: 'transparent',
    swatch: '#8aa970',
    art: {
      src: require('@/assets/images/stage-courtyard.jpg'),
      ratio: 0.8966,
      wall: '#837763',
      /* 旧い指示（引きの構図）で描いた絵なので、地平線が中央より下にある */
      horizon: 0.48,
    },
  },
  {
    id: 'library',
    name: '図書室の窓辺',
    rarity: 'N',
    desc: '本の匂いは集中力を上げる。',
    tint: 'transparent',
    swatch: '#8a5a33',
    art: {
      src: require('@/assets/images/stage-library.jpg'),
      ratio: 0.7532,
      wall: '#785943',
      horizon: 0.5,
    },
  },
  {
    id: 'corridor',
    name: '放課後の廊下',
    rarity: 'N',
    desc: '誰もいない廊下は、少し広い。',
    tint: 'transparent',
    swatch: '#c9b48a',
    art: {
      src: require('@/assets/images/stage-corridor.jpg'),
      ratio: 0.7532,
      wall: '#72664f',
      horizon: 0.5,
    },
  },
  {
    id: 'computer-room',
    name: 'コンピュータ室',
    rarity: 'N',
    desc: 'ここで初めて機械に触った人もいる。',
    tint: 'transparent',
    swatch: '#9fb2c4',
    art: {
      src: require('@/assets/images/stage-computer-room.jpg'),
      ratio: 0.7532,
      wall: '#98a4b0',
      horizon: 0.5,
    },
  },
  {
    id: 'home-desk',
    name: '家のデスク',
    rarity: 'N',
    desc: '通勤ゼロ。今日もここから。',
    tint: 'transparent',
    swatch: '#d8b98f',
    art: {
      src: require('@/assets/images/stage-home-desk.jpg'),
      ratio: 0.7532,
      wall: '#86674f',
      horizon: 0.5,
    },
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
    name: '桜並木',
    rarity: 'R',
    desc: '春。何かが始まる感じがする。',
    tint: 'transparent',
    swatch: '#f0a6b8',
    /* 絵の中で花びらが大量に舞っているので、**飾りは重ねない**。
       重ねるとフキダシの文字が読めなくなる */
    art: {
      src: require('@/assets/images/stage-sakura.jpg'),
      ratio: 0.7532,
      wall: '#9d7867',
      /* 地平線の読みは目分量。厳密には0.60あたりだが、少しキャラを
         大きく見せたいので上げてある（上げるほどキャラが育つ） */
      horizon: 0.5,
    },
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
    glow: 'cyan',
  },
  {
    id: 'ougon',
    name: '黄金の教室',
    rarity: 'SR',
    desc: 'マスターの部屋には、金の光が差す。',
    tint: 'rgba(255,196,40,0.30)',
    effect: 'kira',
    glow: 'gold',
  },
];

/** ガチャで出るもの1件。舞台とアバターを同じ形に揃える */
export interface GachaPrize {
  kind: 'theme' | 'avatar';
  id: string;
  name: string;
  rarity: Rarity;
  desc: string;
}

/** ガチャで出るもの（初期所持の教室は入れない） */
export const GACHA_POOL: GachaPrize[] = [
  ...THEMES.filter((t) => t.id !== DEFAULT_THEME_ID).map(
    (t): GachaPrize => ({ kind: 'theme', id: t.id, name: t.name, rarity: t.rarity, desc: t.desc }),
  ),
  ...SKINS.map(
    (s): GachaPrize => ({ kind: 'avatar', id: s.id, name: s.name, rarity: s.rarity, desc: s.desc }),
  ),
];

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
export function draw(): GachaPrize {
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
