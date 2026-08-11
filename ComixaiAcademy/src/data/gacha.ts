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

/** 地平線の既定値。絵は消失点が画面の中央に来るように描く（→ StageArt.horizon） */
export const DEFAULT_HORIZON = 0.5;

/** 舞台の絵。1枚ごとに比率・壁色・拡大率が違うので、まとめて持つ。
    比率と壁色は npm run stage:prepare が出したものをそのまま貼る */
export interface StageArt {
  src: number;
  /** 幅÷高さ。コマを覆う最小の大きさで敷くのに要る */
  ratio: number;
  /** 絵のいちばん上の色。コマが縦に余ったぶんを埋めて継ぎ目を消す */
  wall: string;
  /* ▍地平線（床の消失点）が絵の上から何割の位置にあるか。既定 0.5

     **ふだんは書かない。** 絵は消失点が画面のちょうど中央に来るように
     描いているので、既定の0.5で噛み合う。

     ▍なぜ全部0.5に固定したか
     もとは絵ごとに読んだ値を入れていた（0.47〜0.63）。厳密にはそのほうが
     縮尺は正しい。でも**舞台を変えるたびに先生の背丈が変わる**ことになり、
     それ自体が違和感になった。同じ人が同じ背丈で立っているほうが、
     縮尺の小さなズレより大事だと判断した。

     どうしても合わない絵が出てきたときだけ、その絵にこれを書いて逃がす。 */
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
  effect?: 'kira' | 'motes' | 'kinpaku';
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

/* ▍色を重ねるだけのテーマは全部引退させた
   朝焼け・夕暮れ・雨・セピア・深夜・雪・星降る教室・黄金の教室は、舞台の絵が
   1枚しか無かった頃に「教室に色を重ねる」だけで種類を増やしていたもの。
   **専用の絵を持つテーマがそろって役割がかぶった**ので、2026-08に外した。

   降りもの（rain / snow / kira / ember）とSRの光る枠の仕組みは
   components/stage-effect.tsx に残してある。**SRの絵が描けたら、その絵に
   合うものを選んで乗せる**——絵を見てから決める、という順番にした。

   持っていた人の記録（state.themes）はそのまま残るが、一覧に出ないだけで
   害はない。装備していた場合は getTheme() が素の教室に落とす。 */
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
      ratio: 0.7532,
      wall: '#8b8070',
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
    },
  },
  {
    id: 'entrance-hall',
    name: '昇降口',
    rarity: 'N',
    desc: '行ってきます、の場所。',
    tint: 'transparent',
    swatch: '#a8836a',
    art: {
      src: require('@/assets/images/stage-entrance-hall.jpg'),
      ratio: 0.7532,
      wall: '#756c60',
    },
  },
  {
    id: 'cafe',
    name: 'カフェの窓際',
    rarity: 'N',
    desc: '一杯ぶんの時間で、ひとつ覚える。',
    tint: 'transparent',
    swatch: '#c98f5a',
    art: {
      src: require('@/assets/images/stage-cafe.jpg'),
      ratio: 0.7532,
      wall: '#92755e',
    },
  },
  {
    id: 'meeting-room',
    name: '会議室',
    rarity: 'N',
    desc: '「で、AIで何ができるの？」と聞かれる部屋。',
    tint: 'transparent',
    swatch: '#a99a80',
    art: {
      src: require('@/assets/images/stage-meeting-room.jpg'),
      ratio: 0.7532,
      wall: '#837664',
    },
  },
  {
    id: 'rooftop-cloudy',
    name: '屋上',
    rarity: 'N',
    desc: '行き詰まったら、空を見る。',
    tint: 'transparent',
    swatch: '#9aa2a8',
    art: {
      src: require('@/assets/images/stage-rooftop-cloudy.jpg'),
      ratio: 0.7532,
      wall: '#948f8d',
    },
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
    },
  },
  {
    id: 'rooftop-sunset',
    name: '夕焼けの屋上',
    rarity: 'R',
    desc: 'ここで見た夕日は覚えている。',
    tint: 'transparent',
    swatch: '#f08a3c',
    art: {
      src: require('@/assets/images/stage-rooftop-sunset.jpg'),
      ratio: 0.7532,
      wall: '#896a54',
    },
  },
  {
    id: 'neon-rain',
    name: '雨のネオン街',
    rarity: 'R',
    desc: '雨の日は、街のほうが光る。',
    tint: 'transparent',
    swatch: '#ff5fa2',
    art: {
      src: require('@/assets/images/stage-neon-rain.jpg'),
      ratio: 0.7532,
      wall: '#383644',
    },
  },
  {
    id: 'office-night',
    name: '夜のオフィス',
    rarity: 'R',
    desc: '街の灯りが全部、誰かの仕事。',
    tint: 'transparent',
    swatch: '#3f6fb8',
    art: {
      src: require('@/assets/images/stage-office-night.jpg'),
      ratio: 0.7532,
      wall: '#272c34',
    },
  },
  {
    id: 'beach-dawn',
    name: '朝の海辺',
    rarity: 'R',
    desc: '水平線は、いつ見ても水平。',
    tint: 'transparent',
    swatch: '#f2b6a0',
    art: {
      src: require('@/assets/images/stage-beach-dawn.jpg'),
      ratio: 0.7532,
      wall: '#aa8c83',
    },
  },
  {
    id: 'festival-night',
    name: '夏祭りの夜',
    rarity: 'R',
    desc: '浴衣でAIの話をしてもいい。',
    tint: 'transparent',
    swatch: '#e0452f',
    art: {
      src: require('@/assets/images/stage-festival-night.jpg'),
      ratio: 0.7532,
      wall: '#57392e',
    },
  },
  {
    id: 'cabin-fire',
    name: '暖炉の山小屋',
    rarity: 'R',
    desc: '火のそばで読むと、よく入る。',
    tint: 'transparent',
    swatch: '#e07a2c',
    art: {
      src: require('@/assets/images/stage-cabin-fire.jpg'),
      ratio: 0.7532,
      wall: '#4a2d1f',
    },
  },
  {
    id: 'datacenter',
    name: 'サーバーの聖堂',
    rarity: 'SR',
    desc: 'AIが動いている、その場所。',
    tint: 'transparent',
    swatch: '#4fc3f7',
    effect: 'motes',
    glow: 'cyan',
    art: {
      src: require('@/assets/images/stage-datacenter.jpg'),
      ratio: 0.7532,
      wall: '#324855',
    },
  },
  {
    id: 'above-clouds',
    name: '雲海の上の教室',
    rarity: 'SR',
    desc: 'ここまで来たか。',
    tint: 'transparent',
    swatch: '#ffd27a',
    effect: 'kira',
    glow: 'gold',
    art: {
      src: require('@/assets/images/stage-above-clouds.jpg'),
      ratio: 0.7532,
      wall: '#8d7a69',
    },
  },
  {
    id: 'gold-ink',
    name: '金インクの原稿の中',
    rarity: 'SR',
    desc: 'インクとトーンでできた世界。COMIXAIの故郷。',
    tint: 'transparent',
    swatch: '#e8c15a',
    effect: 'kinpaku',
    glow: 'gold',
    art: {
      src: require('@/assets/images/stage-gold-ink.jpg'),
      ratio: 0.7532,
      wall: '#988877',
    },
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
  /* そのレア度の景品がまだ1つも無いことがある（絵を入れ替えている最中など）。
     空のまま引くと undefined が返って画面が落ちるので、全体から引き直す */
  const pool = GACHA_POOL.filter((t) => t.rarity === rarity);
  const from = pool.length > 0 ? pool : GACHA_POOL;
  return from[Math.floor(Math.random() * from.length)];
}
