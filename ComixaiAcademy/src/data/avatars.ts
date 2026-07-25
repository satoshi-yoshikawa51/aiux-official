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

/** 全身がだいたい収まる標準の画角。Web版(sensei.tsx)と同じ値 */
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
    personality: '口数少なめ・言い切り型。照れ隠し気味に労う。絵文字は使わない',
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

export function getAvatar(id: string | null | undefined): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export function isReady(a: AvatarDef): boolean {
  return a.model !== null;
}
