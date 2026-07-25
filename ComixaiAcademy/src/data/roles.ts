/* ============================================================
   職種。Webサイトの「職種別AI活用ガイド」(/guide) の4職種と
   slug を揃えてある。増やすときは、この配列に足したうえで
   src/data/courses/ 各レッスンの byRole にその職種の文章を足すこと
   （byRole に無い職種は共通文が使われるので、足し忘れても壊れはしない）。
   ============================================================ */
import type { RoleId } from './types';

export interface Role {
  id: RoleId;
  emoji: string;
  /** 職種名 */
  name: string;
  /** ホーム画面で先生が呼ぶときの短い呼称 */
  shortName: string;
  catch: string;
  /** オンボーディングのカードに出す「あなたはこういう人」 */
  fit: string[];
  accent: string;
}

export const ROLES: Role[] = [
  {
    id: 'sales',
    emoji: '🤝',
    name: '営業',
    shortName: '営業',
    catch: '「売る時間」を増やすために、書く・調べるをAIに渡す。',
    fit: ['提案メールに時間を取られる', '商談前のリサーチが毎回しんどい', '議事録と社内報告が溜まる'],
    accent: '#e60012',
  },
  {
    id: 'marketing',
    emoji: '📣',
    name: 'マーケティング',
    shortName: 'マーケ',
    catch: '量産はAI、判断は人間。「AIっぽさ」を出さないのが腕の見せどころ。',
    fit: ['コピーの案出しが枯れる', 'SNSの投稿が回らない', '記事や企画書の骨子づくりが重い'],
    accent: '#1a6cff',
  },
  {
    id: 'office',
    emoji: '🗂️',
    name: '事務・バックオフィス',
    shortName: '事務',
    catch: 'Excelの数式、書類の清書、マニュアル作り。調べながらやる仕事が一番速くなる。',
    fit: ['Excelの関数でいつも詰まる', '手順が自分の頭の中にしかない', '社内文書の言い回しに悩む'],
    accent: '#1fa463',
  },
  {
    id: 'creator',
    emoji: '🎨',
    name: 'クリエイター',
    shortName: '創作',
    catch: 'AIは筆を奪う敵か、最強のアシスタントか。使う側に回った人から答えが出ている。',
    fit: ['告知文や事務作業に時間を取られる', '壁打ち相手がほしい', '権利まわりの話を説明できるようになりたい'],
    accent: '#f08c00',
  },
];

export function getRole(id: RoleId | null | undefined): Role | undefined {
  return ROLES.find((r) => r.id === id);
}
