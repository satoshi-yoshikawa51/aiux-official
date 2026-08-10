/* ============================================================
   アバターの台帳。

   ■ 新しいアバターを追加する手順
   1. Tripoなどで作った GLB を用意する。アニメーション名は
      src/avatar/motions.ts の11種に揃えること。
   2. `node tools/transcode-avatar.mjs <入力.glb> assets/models/<id>.glb assets/models/<id>-texture.jpg`
      を実行（meshopt/WebPを展開し、スマホ向けに減量してくれる）。
   3. この配列の該当エントリの model を埋める。
      model が null のあいだは選択画面に「準備中」として並ぶだけで、
      選べないので、GLBを置く前にエントリだけ先に書いても壊れない。
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

export const AVATARS: AvatarDef[] = [
  {
    id: 'sensei',
    name: '先生',
    icon: 'person',
    tagline: 'ぶっきらぼうだけど、要所ではちゃんと褒める。',
    personality: '女性上司。一人称「私」・二人称「あなた」・指示は「〜して」のテ形。口数少なめ・言い切り型で、照れ隠し気味に労う。絵文字は使わない',
    accent: '#e60012',
    model: {
      glb: require('@/assets/models/sensei.glb'),
      texture: require('@/assets/models/sensei-texture.jpg'),
      view: STANDING,
    },
  },
  {
    id: 'senpai',
    name: '先輩',
    icon: 'person',
    tagline: '軽いノリで先に失敗しておいてくれる人。',
    personality: 'テンション高め・タメ口寄り。失敗談から入る',
    accent: '#1a6cff',
    model: null,
  },
  {
    id: 'kouhai',
    name: '後輩',
    icon: 'person',
    tagline: '一緒に覚える。教えると自分の理解が深まるタイプ。',
    personality: '敬語・素直・質問が多い。教える側に回らせる相手',
    accent: '#1fa463',
    model: null,
  },
  {
    id: 'shishou',
    name: '師匠',
    icon: 'person',
    tagline: '遠回りに見えて、いちばん深いところを突いてくる。',
    personality: '老練・比喩多め・結論を先に言わない',
    accent: '#6e635b',
    model: null,
  },
  {
    id: 'aibou',
    name: '相棒',
    icon: 'person',
    tagline: 'AIのことはAIに聞け。淡々と、正確に。',
    personality: '無感情・簡潔・数字で語る',
    accent: '#f08c00',
    model: null,
  },
];

export const DEFAULT_AVATAR_ID = 'sensei';

/* ============================================================
   ▍きせかえ（色違い）
   GLBは共通で、テクスチャの差し替えだけで成立する。
   テクスチャは tools/recolor-sensei.mjs が元の1枚から生成する
   （髪だけ塗り替える。作り方はツールの冒頭コメントに）。
   ガチャの景品になる（→ data/gacha.ts の GACHA_POOL）。
   ============================================================ */

export interface AvatarSkin {
  id: string;
  /** どのアバターの色違いか */
  avatarId: string;
  name: string;
  rarity: Rarity;
  /** 引いたときに出す一言 */
  desc: string;
  /** 選択UIで見せる髪の色 */
  swatch: string;
  texture: number;
}

export const SKINS: AvatarSkin[] = [
  {
    id: 'gin',
    avatarId: 'sensei',
    name: '銀髪の先生',
    rarity: 'R',
    desc: '雪の日みたいに、しんとした色。',
    swatch: '#aeb6bf',
    texture: require('@/assets/models/sensei-gin-texture.jpg'),
  },
  {
    id: 'momo',
    avatarId: 'sensei',
    name: '桃色の先生',
    rarity: 'R',
    desc: '春の気配。ちょっと照れてる……わけではない。',
    swatch: '#e2698e',
    texture: require('@/assets/models/sensei-momo-texture.jpg'),
  },
  {
    id: 'kin',
    avatarId: 'sensei',
    name: '金髪の先生',
    rarity: 'SR',
    desc: '金色。教室がまぶしい。',
    swatch: '#d8a61c',
    texture: require('@/assets/models/sensei-kin-texture.jpg'),
  },
  {
    id: 'hiiro',
    avatarId: 'sensei',
    name: '緋色の先生',
    rarity: 'SR',
    desc: '燃えるような緋色。本気の日の色。',
    swatch: '#b81f2d',
    texture: require('@/assets/models/sensei-hiiro-texture.jpg'),
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

export function isReady(a: AvatarDef): boolean {
  return a.model !== null;
}
