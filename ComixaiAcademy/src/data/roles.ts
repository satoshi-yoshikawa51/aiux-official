/* ============================================================
   職種。Webサイトの「職種別AI活用ガイド」(/guide) と slug を揃えてある
   （末尾の 'other' だけはアプリ専用で、対応するガイドページは無い）。

   増やすときは、この配列に足したうえで src/data/courses/ 各レッスンの
   byRole にその職種の文章を足すこと。byRole に無い職種は共通文に落ちるので
   足し忘れても壊れはしないが、「職種別」の札を出しておいて中身が同じだと
   いちばん白ける。書き分けるところは全部で16か所ある。
   ============================================================ */
import type { IconName } from '@/components/icons';
import type { RoleId } from './types';

export interface Role {
  id: RoleId;
  icon: IconName;
  /** 職種名 */
  name: string;
  /** ホーム画面で先生が呼ぶときの短い呼称 */
  shortName: string;
  catch: string;
  /** オンボーディングのカードに出す「あなたはこういう人」 */
  fit: string[];
  accent: string;
  /** 職種を決めずに進む選択肢。「◯◯向けで表示中」の言い回しを変えるのに使う */
  generic?: boolean;
}

export const ROLES: Role[] = [
  {
    id: 'sales',
    icon: 'chart',
    name: '営業',
    shortName: '営業',
    catch: '「売る時間」を増やすために、書く・調べるをAIに渡す。',
    fit: ['提案メールに時間を取られる', '商談前のリサーチが毎回しんどい', '議事録と社内報告が溜まる'],
    accent: '#e60012',
  },
  {
    id: 'marketing',
    icon: 'megaphone',
    name: 'マーケティング',
    shortName: 'マーケ',
    catch: '量産はAI、判断は人間。「AIっぽさ」を出さないのが腕の見せどころ。',
    fit: ['コピーの案出しが枯れる', 'SNSの投稿が回らない', '記事や企画書の骨子づくりが重い'],
    accent: '#1a6cff',
  },
  {
    id: 'office',
    icon: 'folder',
    name: '事務・バックオフィス',
    shortName: '事務',
    catch: 'Excelの数式、書類の清書、マニュアル作り。調べながらやる仕事が一番速くなる。',
    fit: ['Excelの関数でいつも詰まる', '手順が自分の頭の中にしかない', '社内文書の言い回しに悩む'],
    accent: '#1fa463',
  },
  {
    id: 'creator',
    icon: 'palette',
    name: 'クリエイター',
    shortName: '創作',
    catch: 'AIは筆を奪う敵か、最強のアシスタントか。使う側に回った人から答えが出ている。',
    fit: ['告知文や事務作業に時間を取られる', '壁打ち相手がほしい', '権利まわりの話を説明できるようになりたい'],
    accent: '#f08c00',
  },
  {
    id: 'hr',
    icon: 'person',
    name: '人事・採用',
    shortName: '人事',
    catch: '書類は速く、判断は慎重に。人を扱う仕事だからこその線引きがある。',
    fit: ['求人票とスカウト文が追いつかない', '面接の質問が毎回その場しのぎ', '社内文書の言い回しに時間を取られる'],
    accent: '#1a6cff',
  },
  {
    id: 'support',
    icon: 'buddy',
    name: 'サポート・CS',
    shortName: 'CS',
    catch: '「返す」仕事はいちばん効く。速さと、怒られたときの冷静さが手に入る。',
    fit: ['同じ問い合わせに何度も答えている', '厳しい問い合わせの返信に消耗する', 'FAQを整える時間がない'],
    accent: '#1fa463',
  },
  {
    id: 'planner',
    icon: 'compass',
    name: '企画・PM',
    shortName: '企画',
    catch: '書かせるより、壁打ちさせる。決める前の思考をAIと往復する。',
    fit: ['議事録から論点を抜くのに時間がかかる', '相談相手がいないまま決めている', '段取りの抜けが後で出てくる'],
    accent: '#f08c00',
  },
  {
    id: 'owner',
    icon: 'rocket',
    name: '経営者・個人事業主',
    shortName: '経営',
    catch: 'ひとりで全部やる人ほど効く。何から入れるかだけ、間違えなければいい。',
    fit: ['得意でない仕事まで全部自分でやっている', '何にいくら払うか決めきれない', '発信が続かない'],
    accent: '#e60012',
  },
  {
    id: 'it',
    icon: 'shield',
    name: '情シス・社内IT',
    shortName: '情シス',
    catch: '自分が使うためではなく、全員に使わせるために学ぶ。',
    fit: ['社内のAIルールを決めろと言われた', '勝手に使われているのが怖い', 'どのツールを選べばいいかわからない'],
    accent: '#6e635b',
  },
  /* どれにも当てはまらない人が先に進めるようにするための選択肢。
     byRole を持たないので、レッスンは共通文のまま出る */
  {
    id: 'other',
    icon: 'mask',
    name: 'あてはまらない',
    shortName: '共通',
    catch: '決めずに進む。中身は共通のまま出る。あとからいつでも変えられる。',
    fit: ['上のどれとも違う', 'いくつも兼ねている', 'まだ決めたくない'],
    accent: '#6e635b',
    generic: true,
  },
];

export function getRole(id: RoleId | null | undefined): Role | undefined {
  return ROLES.find((r) => r.id === id);
}
