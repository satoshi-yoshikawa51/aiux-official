/* ============================================================
   アバターの台帳。

   ■ 新しいアバターを追加する手順
   （**試して駄目だったやり方の一覧**は README の
     「アバターの見た目を直す（Tripo製モデルの手当て）」にある。
     自動リグの崩れは原因が毎回ちがうので、思いつきで直す前に読むこと）
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

      c. **左右の脚がくっついたまま**のことがある（a も b も効かない）。
         `node tools/_legprobe.mjs` 相当の測り方で内端の距離を見ると、
         おてんばは 0.002 しか離れていなかった（ほかは 0.024〜0.037）。
         離れていないと遠目に黒い筋が1本入り、動かすと片方の面が
         もう片方を突き抜けて薄い刃が飛び出す。
         `node tools/open-leg-gap.mjs <in>.glb <out>.glb --below -0.34 --gap 0.022`
         のあと `cut-leg-web --below -0.20 --own 0.35`（腰寄りの膜は脚の
         ウェイトが4割しか無く、既定の0.5では素通りする）。
         **形の問題なので、ウェイトを直しても1枚も減らない。** 実際 a を
         掛けて255頂点が直っても、裂ける面は150枚のままだった。
   5. 肩に飾り（肩章・パッド）が付いている衣装なら、鎖骨に固定する。
      `node tools/lock-bone-weights.mjs <in>.glb <out>.glb --bone L_Clavicle,R_Clavicle --lock 0.4`
      硬い飾りに鎖骨と上腕が半々に塗られていると、**腕を下ろしたときに
      引き裂かれて、顔の横に金色の欠片が浮く**（王さまで実際に出た）。
      **--feather を0にしない。** きっちり切ると、その線が次の裂け目になる。
   6. あごの下からギザギザが出るなら、頭のすそを細くする。
      `node tools/tuck-head-skirt.mjs <in>.glb <out>.glb --amount 0.10 --depth 0.04`
      裂けているのではなく、**顔が上着を突き抜けて見えている**（面の交差は
      のこぎり状に見える）。服に隠れる帯を数%細くして逃がす。

      順番は 顔の固定 → 肩章の固定 → すその細く。**cut-head-web は
      あごと肩に膜が張るときだけ**（掛けると背中が裂けることがある。
      → READMEの「必ず、真後ろと真上からも見る」）。
   7. 仕上げに、動かしたときだけ出る突起を機械に探させる。
      `node tools/find-spikes.mjs <モデルID>` … 細い出っ張りを見つけて、
      当たった頂点の骨とバインド座標を出す（**ひげと耳も細いので出てくる**。
      動かしたときだけ出るものが直す相手）。
      `node tools/pull-in.mjs <in>.glb <out>.glb --at x,y,z --bone Head --mirror`
      … その場所を内側へ引っ込める。**--bone を必ず指定する**。突き抜けている
      側だけを動かさないと、両方いっしょに下がって位置関係が変わらない。

      引っ込めても消えないものは、面が伸びている（両端を動かしても伸びは残る）。
      `node tools/cut-tearing-faces.mjs <in>.glb <out>.glb --at x,y,z --radius 0.16 --mirror`
      で、その三角形を剛体にする。**--at で範囲を必ず限る**。全体に掛けると
      上着じゅうに割れ目が出る。
   8. この配列にエントリを足す。model が null のあいだは選択画面に
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
  /** 背丈の倍率。既定は1（人間の相棒＝およそ170cmのつもり）。

      ▍**人でないキャラは、ここで縮める**
      Tripoは何を作っても人間と同じくらいの背丈で出してくるので、
      猫が人と同じ大きさで並ぶ。カメラの画角は全員共通なので
      （→ STANDING）、直すならモデル側の倍率しかない。
      縮めても**足元は床に残る**ようにしてある（→ avatar/Avatar3D.tsx）。 */
  scale?: number;
  /** 顔の向きの直し（度）。マイナスで顎を引く、プラスで顎を上げる。

      ▍**素のモデルは、キャラごとに顎の上げ方がばらばら**
      Tripoの生成物なので、並べると「ほとんどが上を向いていて、
      先輩だけ下を向いている」ように見える。GLBは書き換えず、
      表示のたびに Head の骨をこの角度だけ回して揃える
      （→ avatar/Avatar3D.tsx）。

      **ここが唯一の出どころ。** 顔のサムネイルを焼く
      `tools/make-faces.mjs` も、この行を読んで同じ角度を掛ける。
      値を変えたら `node tools/make-faces.mjs` を流し直す。 */
  headTilt?: number;
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
  /** ガチャに出るときのレア度。相棒は素がR・衣装違いがSR。
      最初から選べる2人（initial: true）は景品にならないので使われない */
  rarity: Rarity;
  /** 見た目の違い（SRの衣装名など）。**同じ人の別バージョン**を並べたときに
      見分けるための添え名で、名乗りではない。一覧では
      「おっとり_浴衣ver」のように出す（→ avatarLabel）。
      ホームのキャプションは素の name のまま——あそこは名乗りなので */
  variant?: string;
  /** null = まだGLBが無い（「準備中」表示） */
  model: AvatarModel | null;
  /** 顔のサムネイル（`tools/make-faces.mjs` が焼いた assets/faces/<id>.png）。

      ▍一覧で3Dを出さないための静止画
      相棒を選ぶ画面には13体ぶんが並ぶ。Avatar3D を13個置くと
      WebGLのコンテキストが足りない（→ components/capsule-3d.tsx）。
      顔が分かればいい場所なので、焼いた絵で足りる。
      未記入なら icon と accent の丸に落ちる（画面は壊れない）。 */
  face?: number;
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
    rarity: 'R',
    face: require('@/assets/faces/ottori.png'),
    model: {
      glb: require('@/assets/models/ottori.glb'),
      texture: require('@/assets/models/ottori-texture.jpg'),
      view: STANDING,
      headTilt: -7,
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
    rarity: 'R',
    face: require('@/assets/faces/nekketsu.png'),
    model: {
      glb: require('@/assets/models/nekketsu.glb'),
      texture: require('@/assets/models/nekketsu-texture.jpg'),
      view: STANDING,
      headTilt: -6,
    },
  },
  {
    /* もと「先生」。名前だけ先輩に変えたので、性格とモデル（sensei.glb）は
       そのまま（ファイル名が sensei-*.jpg なのはそのため） */
    id: 'senpai',
    name: '先輩',
    icon: 'person',
    tagline: 'ぶっきらぼうだけど、要所ではちゃんと褒める。',
    personality:
      '女性上司。一人称「私」・二人称「あなた」・指示は「〜して」のテ形。口数少なめ・言い切り型で、照れ隠し気味に労う。絵文字は使わない',
    accent: '#e60012',
    initial: false,
    rarity: 'R',
    face: require('@/assets/faces/senpai.png'),
    model: {
      glb: require('@/assets/models/sensei.glb'),
      texture: require('@/assets/models/sensei-texture.jpg'),
      view: STANDING,
      headTilt: 6,
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
    rarity: 'R',
    face: require('@/assets/faces/otenba.png'),
    model: {
      glb: require('@/assets/models/otenba.glb'),
      texture: require('@/assets/models/otenba-texture.jpg'),
      view: STANDING,
      headTilt: -6,
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
    rarity: 'R',
    face: require('@/assets/faces/kanroku.png'),
    model: {
      glb: require('@/assets/models/kanroku.glb'),
      texture: require('@/assets/models/kanroku-texture.jpg'),
      view: STANDING,
      headTilt: -8,
    },
  },
  {
    /* ▍看板キャラ「かんばん」

       COMIXAIの顔。noteの「マンガでわかる！AI活用」シリーズに何度も
       出ている、あの猫と同じ人物として扱う。**アプリで先に性格を作らない**
       ——向こうで積み上がった人物像に合わせる。

       あちらでの振る舞い：「じゃーん！」と得意げに指をさして登場し、
       その回のテーマを解説する。でも全部を知っているわけではなく、
       「まずは何の項目が必要か？からAIに聞いてみよう」と素直に頼る。
       つまり**教える人ではなく、いっしょに調べる人**。

       IDが `neko` のままなのは、GLBのファイル名がそれだから。
       名乗りとIDが食い違う唯一の相棒（ほかは ottori→おっとり のように揃う）。
       ファイル名を変えるならモデル側の焼き直しからになるので、そのままにした。 */
    id: 'neko',
    name: 'かんばん',
    icon: 'buddy',
    tagline: 'じゃーん！ わかんないことは、AIに聞けばいいんだよ。',
    personality:
      '好奇心旺盛で目立ちたがり。「じゃーん！」と得意げに登場して解説したがる。でも知らないことは素直に「AIに聞いてみよう」と言える——教える人ではなく、いっしょに調べる人。ひらがな多めの短い文、「！」が多い。媚びる「〜だにゃ」は使わない',
    accent: '#e8a33d',
    initial: false,
    rarity: 'R',
    face: require('@/assets/faces/neko.png'),
    model: {
      glb: require('@/assets/models/neko.glb'),
      texture: require('@/assets/models/neko-texture.jpg'),
      view: STANDING,
      headTilt: -5,
      /* ▍**画面で人の6割**に見える値。0.6 ではない
         Tripoは何を作っても同じくらいの背丈で出すが、この猫は頭が大きく、
         素のままだと人より3割高かった。0.6を掛けても画面では0.77倍にしか
         ならない（実測）。狙いは「身長1メートルくらい＝人の6割」なので、
         そこから逆算した値を入れてある。**モデルを焼き直したら測り直すこと。**

         いまは画面で**人の0.8倍**（実測）。1メートルより少し高いが、
         0.6倍は小さすぎた（コマの中で埋もれた）ので、見た目を取った。 */
      scale: 0.62,
    },
  },

  /* ———————————————— ここから SR（衣装違い） ————————————————

     ▍SRは「同じ人の、別の服」
     衣装は形が変わるので**別のGLB**が要る。素の相棒と同じ配列に、
     rarity:'SR' のエントリとして並べる。

     ▍**テクスチャを差し替えるだけの「色違い」は、やめた**
     服だけを塗り替えた色違いを6人ぶん作ったことがある（2026-08）。
     道具を作り込んで、まだら・陰影・はみ出しを数字で詰めるところまで
     やったが、**元の絵が塗りで描いてあるので、どう詰めても
     「塗り直した絵」にしか見えない**。集めたくなる質に届かなかったので、
     機能ごと落とした。作り方は git の履歴に残っている
     （tools/recolor-avatar.mjs と tools/check-recolor.mjs）。

     ▍中身は素の相棒と同じ
     同じ人なので tagline も personality もそのまま。**セリフも素のものが
     出る**——IDの `-sr` を落として引く決まりにしてある
     （→ data/types.ts の voiceIdOf）。ここを個別に書き分けると、
     服を着替えただけで別人になる。 */
  {
    id: 'ottori-sr',
    variant: '浴衣',
    name: 'おっとり',
    icon: 'sprout',
    tagline: 'だいじょうぶ。あなたのペースでいきましょう。',
    personality:
      'おっとりしていて、人を心から信頼している。実はがんばり屋。やさしい敬語で話す照れ屋。相手を否定しない',
    accent: '#d4589a',
    initial: false,
    rarity: 'SR',
    face: require('@/assets/faces/ottori-sr.png'),
    model: {
      glb: require('@/assets/models/ottori-sr.glb'),
      texture: require('@/assets/models/ottori-sr-texture.jpg'),
      view: STANDING,
      headTilt: -6,
    },
  },
  {
    id: 'nekketsu-sr',
    variant: 'タキシード',
    name: 'ねっけつ',
    icon: 'fire',
    tagline: 'やるって決めたなら、とことん付き合うぜ。',
    personality:
      'まっすぐ正直な熱い男。目標のためならあらゆる努力を惜しまない。感動しいですぐ泣く。タメ口で暑苦しい',
    accent: '#1a6cff',
    initial: false,
    rarity: 'SR',
    face: require('@/assets/faces/nekketsu-sr.png'),
    model: {
      glb: require('@/assets/models/nekketsu-sr.glb'),
      texture: require('@/assets/models/nekketsu-sr-texture.jpg'),
      view: STANDING,
      headTilt: -6,
    },
  },
  {
    id: 'senpai-sr',
    variant: '白スーツ',
    name: '先輩',
    icon: 'person',
    tagline: 'ぶっきらぼうだけど、要所ではちゃんと褒める。',
    personality:
      '女性上司。一人称「私」・二人称「あなた」・指示は「〜して」のテ形。口数少なめ・言い切り型で、照れ隠し気味に労う。絵文字は使わない',
    accent: '#e60012',
    initial: false,
    rarity: 'SR',
    face: require('@/assets/faces/senpai-sr.png'),
    model: {
      glb: require('@/assets/models/senpai-sr.glb'),
      texture: require('@/assets/models/senpai-sr-texture.jpg'),
      view: STANDING,
      headTilt: -4,
    },
  },
  {
    id: 'otenba-sr',
    variant: 'ゴシックドレス',
    name: 'おてんば',
    icon: 'palette',
    tagline: 'とりま作ろ？ やってみないと分かんないっしょ。',
    personality:
      'ギャル系で芸術肌。ギャル的な言葉を使う（まじで・とりま・〜じゃん）。根はやさしい。臆さず積極的',
    accent: '#f08c00',
    initial: false,
    rarity: 'SR',
    face: require('@/assets/faces/otenba-sr.png'),
    model: {
      glb: require('@/assets/models/otenba-sr.glb'),
      texture: require('@/assets/models/otenba-sr-texture.jpg'),
      view: STANDING,
      headTilt: -6,
    },
  },
  {
    id: 'kanroku-sr',
    variant: '燕尾服',
    name: 'かんろく',
    icon: 'crown',
    tagline: 'ゆっくりでいい。ただし、決めるときは決めよう。',
    personality:
      '優しい口調だが、数々の修羅場を越えてきた貫禄がある。物事をフラットに判断し、時には厳しい決断もする。家ではやさしいパパ',
    accent: '#6e635b',
    initial: false,
    rarity: 'SR',
    face: require('@/assets/faces/kanroku-sr.png'),
    model: {
      glb: require('@/assets/models/kanroku-sr.glb'),
      texture: require('@/assets/models/kanroku-sr-texture.jpg'),
      view: STANDING,
      headTilt: -8,
    },
  },
  {
    id: 'neko-sr',
    variant: '王さま',
    name: 'かんばん',
    icon: 'buddy',
    tagline: 'じゃーん！ わかんないことは、AIに聞けばいいんだよ。',
    personality:
      '好奇心旺盛で目立ちたがり。「じゃーん！」と得意げに登場して解説したがる。でも知らないことは素直に「AIに聞いてみよう」と言える——教える人ではなく、いっしょに調べる人。ひらがな多めの短い文、「！」が多い。媚びる「〜だにゃ」は使わない',
    accent: '#e8a33d',
    initial: false,
    rarity: 'SR',
    face: require('@/assets/faces/neko-sr.png'),
    model: {
      glb: require('@/assets/models/neko-sr.glb'),
      texture: require('@/assets/models/neko-sr-texture.jpg'),
      view: STANDING,
      headTilt: -6,
      /* N と同じ倍率。王冠のぶんだけ画面では少し高くなるが、
         **同じ人が帽子をかぶっただけ**なので、そこは揃えない */
      scale: 0.62,
    },
  },
];

/** 最初から選べる2人 */
export const INITIAL_AVATAR_IDS = AVATARS.filter((a) => a.initial).map((a) => a.id);

export const DEFAULT_AVATAR_ID = INITIAL_AVATAR_IDS[0];

/** 一覧に出す名前。**同じ人の別バージョン**を見分けるための添え名を付ける
    （「おっとり_浴衣ver」）。ホームのキャプションはここを通さない
    （あそこは名乗りなので素の name）。 */
export function avatarLabel(a: AvatarDef): string {
  return a.variant ? `${a.name}_${a.variant}ver` : a.name;
}

/** そのアバターを持っているか。initial の2人は最初から持っている扱い。
    ガチャで当てたキャラは skins（＝増えたアバター）に入る */
export function ownsAvatar(a: AvatarDef, skins: Record<string, number>): boolean {
  return a.initial || !!skins[a.id];
}

/* ============================================================
   ▍IDを変えたときの読み替え

   「先生」を senpai に改名したとき、**すでに遊んでいる人の記録は
   avatarId: 'sensei' のまま**残る。台帳に無いIDなので getAvatar は
   先頭（おっとり）に落ち、その人の相棒が黙って別人に入れ替わる。

   しかも改名後の先輩は initial: false ＝ ガチャの景品なので、
   **せってい から自分の相棒に戻すこともできない**（当て直すまで伏せ札）。
   使っていた相棒を、こちらの都合で取り上げないための読み替え。

   IDを変えるたびにここへ1行足すこと。**足さないと同じことが起きる。**
   ============================================================ */
const RENAMED: Record<string, string> = { sensei: 'senpai' };

/**
 * 保存してある avatarId / skins を、いまの台帳に合わせて直す。
 * 変えるところが無ければ、渡されたものをそのまま返す（呼び元は
 * 同一性で「直したか」を判定できる）。
 */
export function migrateAvatars<T extends { avatarId: string | null; skins: Record<string, number> }>(
  save: T,
  now = Date.now(),
): T {
  const to = save.avatarId ? RENAMED[save.avatarId] : undefined;
  if (!to) return save;
  /* 使っていた相棒は「持っている」ことにする。**改名でガチャの景品に
     なった人を、いま使っている本人から取り上げない** */
  const skins = save.skins[to] ? save.skins : { ...save.skins, [to]: now };
  return { ...save, avatarId: to, skins };
}

/**
 * アバターを引く。台帳に無いIDなら先頭（＝最初の相棒）に落とす。
 */
export function getAvatar(id: string | null | undefined): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

/** GLBが置いてあるか（＝選べるか）。null のあいだは「準備中」で並べる */
export function isReady(a: AvatarDef): boolean {
  return a.model !== null;
}
