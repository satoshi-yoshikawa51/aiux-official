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
import { AVATARS, SKINS } from '@/data/avatars';
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
  /** 舞台ごとに動きが違う（→ components/stage-effect.tsx）
      streaks=線が下から上へ / pika=その場で瞬く / burst=中央から放射状に */
  effect?: 'streaks' | 'pika' | 'burst';
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
    effect: 'streaks',
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
    effect: 'pika',
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
    /* ▍この絵にだけ、ごく薄い金茶を敷く
       紙が白いので、金の粒が地に溶けて見えなくなる。少し沈めると
       粒が立ち、金屏風のような色味になってSRらしさも増す */
    tint: 'rgba(74,48,10,0.13)',
    swatch: '#e8c15a',
    effect: 'burst',
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

/* ガチャで出るもの（初期所持の教室と、最初から選べる2人は入れない）。

   キャラ景品は2種類ある。**どちらも同じ「アバターが1体増える」体験**なので、
   同じ kind: 'avatar' に混ぜて、持ち物は state.skins にまとめて入れる。
   - キャラ本体（AVATARSのinitial:false）… 別のGLB。IDはアバターID
   - 色違い（SKINS）… GLB共通でテクスチャ違い。IDはスキンID */
export const GACHA_POOL: GachaPrize[] = [
  ...THEMES.filter((t) => t.id !== DEFAULT_THEME_ID).map(
    (t): GachaPrize => ({ kind: 'theme', id: t.id, name: t.name, rarity: t.rarity, desc: t.desc }),
  ),
  ...AVATARS.filter((a) => !a.initial && a.model).map(
    (a): GachaPrize => ({
      kind: 'avatar',
      id: a.id,
      name: a.name,
      rarity: a.rarity,
      desc: a.tagline,
    }),
  ),
  ...SKINS.map(
    (s): GachaPrize => ({ kind: 'avatar', id: s.id, name: s.name, rarity: s.rarity, desc: s.desc }),
  ),
];

/** 1回の値段 */
export const SPIN_COST = 3;

/** ダブったとき返すP */
export const DUPE_REFUND = 1;

/* ▍救済（天井）
   特定の1本（例：SRの金インク）を素の確率だけで狙うと1回あたり約1%で、
   通しプレイのシミュレーションでは全称号の到達が中央値46日・
   運の悪い1%は386日かかっていた。**この回数つづけて新しいものが
   出なかったら、次の1回は持っていない景品から確定で出す**。
   これだけで最悪ケースが100日前後まで縮む。課金の無いガチャなので、
   渋らせて得るものが無い。抽選そのものは store/progress.tsx の
   spinGacha がやる（持ち物を見る必要があるため）。 */
export const PITY_AFTER = 10;

/* ============================================================
   ▍出やすさは「レア度 → 種類」の順で決める

   レア度が先。**遊ぶ人が感じているのはレア度のほう**で、SRの出た回数が
   設計と食い違うと、ここが一番わかりやすく嘘になる。

   ▍種類（背景／キャラ）は、そのレア度の中でだけ効く
   キャラ（色違い）は**Nを1つも持っていない**（RとSRだけ）。だから
   「N65%」と「キャラ30%」は同時には成立しない——Nを引いた時点で
   必ず背景になるので、キャラ30%を守ろうとするとR・SRの中身がキャラ
   だらけになり、レア度の比率が崩れる。レア度を優先して、種類の重みは
   **両方の在庫があるレア度の中でだけ**使う。

   結果として全体では 背景89.5% / キャラ10.5% になる。実際の数字は
   odds() が在庫から計算して画面に出すので、ここの重みだけ直せばよい
   （→ app/gacha.tsx の「提供割合」）。

   キャラにNの色違いを足せば、そのまま 背景70/キャラ30 に近づく。 */

/** レア度の出やすさ。合計100 */
export const RARITY_WEIGHT: Record<Rarity, number> = { N: 60, R: 30, SR: 10 };

/* ▍種類（背景／キャラ）の重みは持たない

   前は「同じレア度の中で 背景70：キャラ30」も掛けていた。が、これは
   **在庫の数で1本あたりの確率が勝手に動く**。実際こうなっていた：

     R  … 色違いが1本しか無い → その1本が枠の30%を独占して 9%
           （R舞台1枚の3倍。いちばん出やすい景品が色違い）
     SR … アバターが6体に増えた → 30%を6体で分けて 1体0.25%
           （400回に1回。SR舞台1枚の1/5で、目玉がいちばん遠い）

   同じ重みなのに、増やすほど薄まり、減らすほど濃くなる。**在庫を足すたびに
   出やすさが逆立ちする**ので、種類での重み付けはやめた。
   いまは「レア度を引く → **そのレア度の中は全部等確率**」だけ。
   景品を足しても、そのレア度の中で均等に薄まるだけになる。 */

/** レア度の色。**カプセルの色と同じ割り当てにしてある**
    （→ components/capsule-3d.tsx）。青いカプセルが落ちてきたのに
    一覧のNの字が灰色だと、色が何を指しているのか結びつかない。
    Nを灰色にしていたのは、カプセルが無かった頃の名残り */
export const RARITY_COLOR: Record<Rarity, string> = {
  N: '#1a6cff',
  R: '#e60012',
  SR: '#f5b301',
};

export function getTheme(id: string | null | undefined): StageTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

const RARITIES: Rarity[] = ['N', 'R', 'SR'];

/** 在庫のあるレア度だけを対象にした重み。
    絵を入れ替えている最中などに、景品が1つも無いレア度が出ても
    そこへ吸い込まれないようにする（空を引くと画面が落ちる） */
function liveRarityWeights(): { rarity: Rarity; w: number }[] {
  const live = RARITIES.filter((r) => GACHA_POOL.some((p) => p.rarity === r));
  const list = live.length > 0 ? live : RARITIES;
  return list.map((r) => ({ rarity: r, w: RARITY_WEIGHT[r] }));
}

/** 抽選。レア度を引いて、**その中は等確率**（種類は見ない → 上のメモ） */
export function draw(): GachaPrize {
  const weights = liveRarityWeights();
  const total = weights.reduce((a, b) => a + b.w, 0);
  let roll = Math.random() * total;
  let rarity: Rarity = weights[weights.length - 1].rarity;
  for (const k of weights) {
    roll -= k.w;
    if (roll <= 0) {
      rarity = k.rarity;
      break;
    }
  }

  const pool = GACHA_POOL.filter((p) => p.rarity === rarity);
  /* そのレア度が空でも落ちないように、最後は全体から引く */
  const from = pool.length > 0 ? pool : GACHA_POOL;
  return from[Math.floor(Math.random() * from.length)];
}

/* ———————————————— 提供割合 ————————————————
   画面に出す数字は**在庫から計算する**（→ app/gacha.tsx）。
   舞台やアバターを足すたびに書き直す形だと、いつか必ず食い違う。 */

export interface OddsCell {
  rarity: Rarity;
  kind: GachaPrize['kind'];
  /** その枠に入っている景品の数 */
  count: number;
  /** その枠が出る確率（%） */
  pct: number;
}

export interface Odds {
  cells: OddsCell[];
  byRarity: { rarity: Rarity; pct: number; count: number }[];
  byKind: { kind: GachaPrize['kind']; pct: number; count: number }[];
}

export function odds(): Odds {
  const weights = liveRarityWeights();
  const total = weights.reduce((a, b) => a + b.w, 0);
  const cells: OddsCell[] = [];

  for (const { rarity, w } of weights) {
    const share = (w / total) * 100;
    const inRarity = GACHA_POOL.filter((p) => p.rarity === rarity);
    if (inRarity.length === 0) continue;
    /* 表は種類で分けて見せる（何がどれだけ入っているか分かるように）が、
       確率は**本数の比でそのまま割る**。中は等確率なので */
    for (const kind of ['theme', 'avatar'] as const) {
      const count = inRarity.filter((p) => p.kind === kind).length;
      if (count === 0) continue;
      cells.push({ rarity, kind, count, pct: (share * count) / inRarity.length });
    }
  }

  const sum = (list: OddsCell[]) => list.reduce((a, c) => a + c.pct, 0);
  const count = (list: OddsCell[]) => list.reduce((a, c) => a + c.count, 0);
  return {
    cells,
    byRarity: RARITIES.map((r) => {
      const list = cells.filter((c) => c.rarity === r);
      return { rarity: r, pct: sum(list), count: count(list) };
    }).filter((r) => r.count > 0),
    byKind: (['theme', 'avatar'] as const).map((k) => {
      const list = cells.filter((c) => c.kind === k);
      return { kind: k, pct: sum(list), count: count(list) };
    }).filter((k) => k.count > 0),
  };
}
