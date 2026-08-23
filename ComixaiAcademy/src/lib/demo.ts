/* ============================================================
   体験モード（URLに ?demo=1）

   宣伝LP（comixai.dev/academy）が、メインビジュアルのスマホの中に
   このWeb版を iframe で埋めている。**その小窓で動くときの決まりごと**を
   ここ1か所に集めてある。

   ▍宣伝用に作り直さない
   見せたいのは本物なので、別ビルドは作らない。宣伝のために似せて
   作ったものは、本体を直すたびに静かにずれていく。
   **同じビルドの振る舞いを、旗1本で細める**ほうがずれようがない。

   ▍細めているのは3つだけ
   ・入口の演出（絵巻・アバター選び・職種選び・案内）を飛ばして、
     いきなりホームから始める。数十秒で閉じられる場所なので、
     入口を通させるとホームに着く前に閉じられる
   ・遊べるのは1本目（basics-1）だけ。ほかのレッスンと修了試験は鍵
   ・ガチャは「かんばん」だけが出て、Pは減らない

   ▍記録は残さない
   人のブラウザに、見ただけの進捗を書き込まない。閉じれば消える
   （→ store/progress.tsx の ProgressProvider）。
   ============================================================ */
import { Platform } from 'react-native';

function detect(): boolean {
  if (Platform.OS !== 'web') return false;
  try {
    return new URLSearchParams(window.location.search).has('demo');
  } catch {
    /* 埋め込み先によっては location を読めないことがある。
       読めなければ、ふつうのアプリとして動かす */
    return false;
  }
}

/** 体験モードか。**見るのは起動時の1回だけ**——画面を移ると
    expo-router がURLからクエリを落とすので、後から読んでも分からない */
export const DEMO = detect();

/** 体験モードで遊べる唯一のレッスン（「1-1 AIって、何をしている？」） */
export const DEMO_LESSON_ID = 'basics-1';

/** 体験モードのガチャで必ず出る相棒。'neko'＝かんばん（→ data/avatars.ts） */
export const DEMO_PRIZE_ID = 'neko';
