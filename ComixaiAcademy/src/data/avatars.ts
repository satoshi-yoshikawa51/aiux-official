/* ============================================================
   アバターの台帳。

   ■ 新しいアバターを追加する手順
   1. Tripoなどで作った GLB を用意する。Tripo製はアニメ名が NlaTrack.00x に
      なっているので、tools/anim-names/<id>.json に
      { "NlaTrack.003": "angry", ... } という形で
      src/avatar/motions.ts の11種への対応表を書く（表に無いものは捨てられる）。
   2. `RATIO=0.04 SIMPLIFY_ERROR=0.0008 LOCK_BORDER=1 \
        ANIM_NAMES=tools/anim-names/<id>.json node tools/transcode-avatar.mjs \
        <入力.glb> assets/models/<id>.glb assets/models/<id>-texture.jpg`
      を実行（減量・unlit化・テクスチャ外出しをまとめてやってくれる）。
      Tripo v2.5の生モデル（約200万tri）で約7.7万tri・2.5MBになる。
      RATIOだけ上げると靴とズボンの境目が溶けるので、LOCK_BORDERとセットで扱う。
   3. ブラウザで見て、全モーションで前傾（下向き）していたら姿勢を起こす。
      キャラのバインドポーズによっては、モーションを載せても背骨が起き上がらず、
      ずっとうつむいたままになる。
      `node tools/fix-posture.mjs <in>.glb <out>.glb Spine01=12 Spine02=8 NeckTwist01=8`
      （おっとりだけ 14/10/10。角度はモデルごとに要調整）
   4. 脚まわりを直す。Tripoは脚がくっついた姿勢で生成するので、程度の差はあれ
      どのキャラにも次の2つが入っている（元モデルの時点で。圧縮とは無関係）。
      a. 内ももの頂点に反対側の脚のウェイトが乗っている（開くと膜のように伸びる）
         `node tools/fix-leg-weights.mjs <in>.glb <out>.glb --below -0.16 --blend 0.08`
      b. 左右の脚をつなぐ余計な面が張られている（靴の間が埋まる）
         `node tools/cut-leg-web.mjs <in>.glb <out>.glb --below -0.30`
      必ず a → b の順で（bは左右の帰属をウェイトで判定するため）。
      股（y=-0.25あたり）はズボンとして本来つながっているので、
      --below を -0.30 より上げると穴が開く。
   5. この配列にエントリを足す。model が null のあいだは選択画面に
      「準備中」として並ぶだけで、選べないので、GLBを置く前に
      エントリだけ先に書いても壊れない。
      initial: false にすると**ガチャの景品**になる（→ data/gacha.ts の GACHA_POOL）。
   ============================================================ */
import type { IconName } from '@/components/icons';
import type { Rarity } from '@/data/gacha';

export interface AvatarView {
  /** 画角。小さいほど望遠＝歪みが減る */
  fov: number;
  /** カメラ位置 [x, y, z] */
  camera: [number, number, number];
  /** 注視点 [x, y, z] */
  target: [number, number, number];
}

export interface AvatarModel {
  /** require('@/assets/models/xxx.glb') — Metroのアセット参照 */
  glb: number;
  /** ベースカラーのテクスチャ（GLBから外出ししたもの） */
  texture: number;
  view: AvatarView;
}

export interface AvatarDef {
  id: string;
  name: string;
  /** GLB未配置のときに出す代役のアイコン */
  icon: IconName;
  tagline: string;
  /** 口調・性格のメモ（セリフを書き分けるときの指針） */
  personality: string;
  accent: string;
  /** true = 最初から選べる。false = ガチャの景品（→ data/gacha.ts） */
  initial: boolean;
  /** ガチャに出るときのレア度。initial: true のキャラでは使われない */
  rarity: Rarity;
  /** null = まだGLBが無い（「準備中」表示） */
  model: AvatarModel | null;
}

/* 全身がだいたい収まる標準の画角。Web版(sensei.tsx)と同じ値。

   ▍ここを触ってもコマの中でのキャラの大きさは変わらない
   縦の画角が固定なので、**見えるworldの高さは枠の画素数に関係なく一定**。
   つまり見た目の大きさは置き場の高さで決まる（→ (tabs)/index.tsx の
   AVATAR_RATIO）。fov を広げると同じ距離ではむしろ小さくなり、距離を
   詰めて補正しても伸び幅は数%で、広角の歪みが出るだけだった。 */
const STANDING: AvatarView = {
  fov: 26,
  camera: [0, 0.62, 2.35],
  target: [0, 0.48, 0],
};

/* 最初の2人（initial: true）を先頭に置く。残りはガチャで増える。
   並び順がそのまま設定画面とガチャの「あつめたアバター」の並びになる */
export const AVATARS: AvatarDef[] = [
  {
    id: 'ottori',
    name: 'おっとり',
    icon: 'sprout',
    tagline: 'だいじょうぶ。あなたのペースでいきましょう。',
    personality:
      'おっとりしていて、人を心から信頼している。実はがんばり屋。やさしい敬語で話す照れ屋。相手を否定しない',
    accent: '#d4589a',
    initial: true,
    rarity: 'N',
    model: {
      glb: require('@/assets/models/ottori.glb'),
      texture: require('@/assets/models/ottori-texture.jpg'),
      view: STANDING,
    },
  },
  {
    id: 'nekketsu',
    name: 'ねっけつ',
    icon: 'fire',
    tagline: 'やるって決めたなら、とことん付き合うぜ。',
    personality:
      'まっすぐ正直な熱い男。目標のためならあらゆる努力を惜しまない。感動しいですぐ泣く。タメ口で暑苦しい',
    accent: '#1a6cff',
    initial: true,
    rarity: 'N',
    model: {
      glb: require('@/assets/models/nekketsu.glb'),
      texture: require('@/assets/models/nekketsu-texture.jpg'),
      view: STANDING,
    },
  },
  {
    /* もと「先生」。名前だけ先輩に変えたので、性格とモデル（sensei.glb）は
       そのまま。色違いは この人にだけ付いている（→ SKINS） */
    id: 'senpai',
    name: '先輩',
    icon: 'person',
    tagline: 'ぶっきらぼうだけど、要所ではちゃんと褒める。',
    personality:
      '女性上司。一人称「私」・二人称「あなた」・指示は「〜して」のテ形。口数少なめ・言い切り型で、照れ隠し気味に労う。絵文字は使わない',
    accent: '#e60012',
    initial: false,
    rarity: 'N',
    model: {
      glb: require('@/assets/models/sensei.glb'),
      texture: require('@/assets/models/sensei-texture.jpg'),
      view: STANDING,
    },
  },
  {
    id: 'otenba',
    name: 'おてんば',
    icon: 'palette',
    tagline: 'とりま作ろ？ やってみないと分かんないっしょ。',
    personality:
      'ギャル系で芸術肌。ギャル的な言葉を使う（まじで・とりま・〜じゃん）。根はやさしい。臆さず積極的',
    accent: '#f08c00',
    initial: false,
    rarity: 'N',
    model: {
      glb: require('@/assets/models/otenba.glb'),
      texture: require('@/assets/models/otenba-texture.jpg'),
      view: STANDING,
    },
  },
  {
    id: 'kanroku',
    name: 'かんろく',
    icon: 'crown',
    tagline: 'ゆっくりでいい。ただし、決めるときは決めよう。',
    personality:
      '優しい口調だが、数々の修羅場を越えてきた貫禄がある。物事をフラットに判断し、時には厳しい決断もする。家ではやさしいパパ',
    accent: '#6e635b',
    initial: false,
    rarity: 'N',
    model: {
      glb: require('@/assets/models/kanroku.glb'),
      texture: require('@/assets/models/kanroku-texture.jpg'),
      view: STANDING,
    },
  },
];

/** 最初から選べる2人 */
export const INITIAL_AVATAR_IDS = AVATARS.filter((a) => a.initial).map((a) => a.id);

export const DEFAULT_AVATAR_ID = INITIAL_AVATAR_IDS[0];

/** そのアバターを持っているか。initial の2人は最初から持っている扱い。
    ガチャで当てたキャラは skins（＝増えたアバター）に入る */
export function ownsAvatar(a: AvatarDef, skins: Record<string, number>): boolean {
  return a.initial || !!skins[a.id];
}

/* ============================================================
   ▍色違いアバター
   「金髪の先生」のような色違いを、**独立した1体のアバター**として
   扱う（選べるアバターがガチャでどんどん増えていく建て付け。
   キャラ本体のモデルが増えたら、それもガチャの景品に足す）。
   性格・セリフはベースのキャラ（avatarId）から引き継ぐ——
   色が変わっても同じ人。

   GLBは共通で、テクスチャの差し替えだけで成立する。
   テクスチャは tools/recolor-sensei.mjs が元の1枚から生成する
   （髪だけ塗り替える。作り方はツールの冒頭コメントに）。
   ガチャの景品になる（→ data/gacha.ts の GACHA_POOL）。
   ============================================================ */

export interface AvatarSkin {
  id: string;
  /** どのキャラの色違いか（性格・セリフはこのキャラのもの） */
  avatarId: string;
  name: string;
  rarity: Rarity;
  /** 引いたときに出す一言 */
  desc: string;
  /** 選択UIで見せる髪の色 */
  swatch: string;
  texture: number;
}

/* ▍レア度は「同じキャラで3段」に積む（これから揃えていく方針）
     N  … キャラ本体（→ AVATARS）
     R  … 色違い。tools/recolor-sensei.mjs で髪を塗り替える（→ このSKINS）
     SR … 衣装を変えたモデルを別途つくって足す
   つまり1人につきN・R・SRが1組そろう形を目指す。

   いま入っているのは先輩の金髪（R）だけ。銀・桃・緋も同じツールで
   作れるので、景品の数を増やしたくなったら生成してここに足す。
   SRは別モデルになるので、SKINS ではなく AVATARS 側に
   rarity: 'SR' のエントリとして足すことになる。 */
export const SKINS: AvatarSkin[] = [
  {
    id: 'kin',
    avatarId: 'senpai',
    name: 'せんぱい_金髪ver',
    rarity: 'R',
    desc: '金色。教室がまぶしい。',
    swatch: '#d8a61c',
    texture: require('@/assets/models/sensei-kin-texture.jpg'),
  },
];

/** '' ＝ 素の色（きせかえ無し） */
export const DEFAULT_SKIN_ID = '';

export function getSkin(id: string | null | undefined): AvatarSkin | null {
  return SKINS.find((s) => s.id === id) ?? null;
}

/**
 * アバターを引く。skinId を渡すと、その色違いのテクスチャを貼った
 * 姿で返す（名前・性格はそのまま。**色が変わっても同じ人**）。
 * 別のアバターのきせかえを渡されたときは素の姿で返す。
 */
export function getAvatar(id: string | null | undefined, skinId?: string): AvatarDef {
  const base = AVATARS.find((a) => a.id === id) ?? AVATARS[0];
  if (!skinId || !base.model) return base;
  const skin = getSkin(skinId);
  if (!skin || skin.avatarId !== base.id) return base;
  return { ...base, model: { ...base.model, texture: skin.texture } };
}

/**
 * ガチャのアバター景品IDを、切り替えに使う組に直す。
 * キャラ本体が当たったなら skinId は空（素の姿）、
 * 色違いが当たったなら「元のキャラ＋その色」を返す。
 */
export function lookOfPrize(prizeId: string): { avatarId: string; skinId: string } | null {
  const skin = getSkin(prizeId);
  if (skin) return { avatarId: skin.avatarId, skinId: skin.id };
  const base = AVATARS.find((a) => a.id === prizeId);
  return base ? { avatarId: base.id, skinId: DEFAULT_SKIN_ID } : null;
}

export function isReady(a: AvatarDef): boolean {
  return a.model !== null;
}
