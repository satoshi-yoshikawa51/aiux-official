# COMIXAI アカデミー — スマホアプリ（Expo / React Native）

[comixai.dev](https://comixai.dev) の学習コンテンツを、**3Dアバターと一緒に学ぶスマホアプリ**にしたもの。

- **アバターを選ぶ** → **職種を選ぶ** → ホーム画面にアバターが常駐
- 職種（営業／マーケ／事務／創作／人事／サポート／企画／経営／情シスの9種＋「あてはまらない」）で、
  レッスンの例とプロンプトが差し替わる
- レッスンをクリアするとバッジが増え、バッジの数で**称号**が上がる
- 記録は端末内（AsyncStorage）だけ。アカウントもサーバーも使わない

Webサイト本体（Next.js）とは**別プロジェクト**。このディレクトリだけで独立して動く。

## 動かす

```bash
cd ComixaiAcademy
npm install
npx expo start
```

- iPhone / Android の **Expo Go** でQRを読むのが一番早い
- 型チェック: `npm run typecheck`

ストアに出す段階になったら EAS Build（`npx eas build`）へ。`app.json` の `ios.bundleIdentifier` / `android.package` は `dev.comixai.academy` を仮置きしてある。

## Vercelでプレビューを公開する

Web版（`expo export --platform web`）を出せるので、**スマホのブラウザで触れるURL**を
Vercelに置ける。サイト本体とは**別のVercelプロジェクト**にする（同じリポジトリでOK）。

1. Vercel で **Add New… → Project** → このリポジトリ（`aiux-official`）を選ぶ
2. **Root Directory を `ComixaiAcademy` に変更する**（ここだけ必須。既定の `./` のままだと
   サイト本体がビルドされてしまう）
3. Framework Preset は **Other**。ビルドコマンドと出力先は `vercel.json` に書いてあるので、
   画面上では何も入力しなくていい
4. **Deploy**

以降、`ComixaiAcademy/` に変更があったpushだけ再ビルドされる（`vercel.json` の `ignoreCommand`）。
サイト本体のプロジェクトはこの `vercel.json` を読まないので、影響しない。

公開されたURLをiPhoneのSafariで開き、共有 → **「ホーム画面に追加」** すると、
アドレスバー無しのアプリとして起動する（`public/index.html` でその設定を入れている）。

### Web版でできること・できないこと

| | Web（Vercelプレビュー） | ネイティブ（Expo Go / ストア） |
| --- | --- | --- |
| 3Dアバター | ◯ WebGLで動く | ◯ |
| 進捗の保存 | ◯ ただしブラウザのlocalStorage（シークレットタブでは消える） | ◯ |
| 触覚フィードバック | ✗（Web では呼ばない） | ◯ |
| ホーム画面アイコン | △ 「ホーム画面に追加」で近いものになる | ◯ |

**あくまで見た目と流れを確認するためのプレビュー**で、配布物はネイティブアプリのほう。

## 構成

```
ComixaiAcademy/
├── src/app/                 画面（expo-router のファイルベースルーティング）
│   ├── _layout.tsx          ルート。進捗ストアの提供とオンボーディング振り分け
│   ├── onboarding/
│   │   ├── avatar.tsx       STEP1 アバター選択
│   │   └── role.tsx         STEP2 職種選択
│   ├── (tabs)/
│   │   ├── index.tsx        ホーム（アバターが常駐・つづきから）
│   │   ├── learn.tsx        コース／レッスン一覧
│   │   ├── badges.tsx       バッジと称号
│   │   └── settings.tsx     アバター・職種の変更、記録リセット
│   └── lesson/[id].tsx      レッスン（カード送り → クイズ → 結果）
├── src/avatar/
│   ├── Avatar3D.tsx         expo-gl + three.js でGLBを描画
│   └── motions.ts           モーション名（11種）
├── src/data/
│   ├── avatars.ts           アバター台帳（GLB未配置は「準備中」）
│   ├── roles.ts             職種
│   ├── badges.ts            バッジと称号のテーブル
│   ├── types.ts             レッスンの型
│   └── courses/             レッスン本体（5コース17本）
├── src/components/ui.tsx    UI部品（サイトの ds.tsx の移植）
├── src/store/progress.tsx   進捗・バッジ判定・永続化
├── src/theme/               デザイントークン（サイトの globals.css を移植）
├── assets/images/           アプリアイコン・スクリーントーン・舞台の絵
│   └── _raw/                Midjourneyの元画像（加工前。削る量を変えられるよう残す）
├── assets/models/           sensei.glb と外出ししたテクスチャ
├── assets/fonts/            サブセット済みの書体（→ assets/fonts/README.md）
└── tools/                   GLB変換・フォントサブセット・トーン／アイコン／背景の下ごしらえ
                             （アプリ内アイコン＝build-icons / アプリアイコン＝build-app-icon
                              / 背景＝prepare-stage）
```

## 見た目のルール

サイト（`src/app/globals.css` と `src/app/ds.tsx`）の「マンガのインク＋紙」を移植しています。
色・線幅・角丸・影のずらし量は `src/theme/index.ts` に集約してあるので、
サイト側を変えたらこちらも同じ値に揃えてください。

- **書体** — 見出し=Zen Kaku Gothic New 900 / 小見出し・ボタン=700 / 本文=400、
  ひとこと=Yusei Magic（手書き風）、キッカーと数字=JetBrains Mono。
  React Native は `fontWeight` で別ファイルの書体を選べないので、
  太さは必ず `fontFamily`（`FONT.display` など）で指定します。
- **ポップシャドウ** — サイトの `box-shadow: 5px 5px 0 ink` にあたるもの。
  RNの `shadow*` はiOS専用でAndroidではぼかし影になってしまうため、
  `<Pop>` が「同じ形のベタ塗りViewを裏にずらして敷く」方式で描いています。
  ボタンは押すと影が1pxに縮んで本体が2px沈みます（サイトと同じ挙動）。
- **スクリーントーン** — `<Panel tone="dots">` / `"lines"` で網点・斜線を敷けます。
  タイル画像は `npm run tones` で再生成できます。
  （ネイティブは `resizeMode="repeat"`、Webはrepeatに未対応なのでCSSに落としています）
- **コマ** — `<Panel number="1" caption="…" tilt={-1}>` でコマ番号・キャプション・傾き。
- **アイコン** — アプリ内の絵文字はすべて `src/components/icons.tsx` のオリジナル（34種）に
  置き換えてある。単色なので、置く場所にあわせて色を渡す（黒地では白抜き、紙の上ではインク）。
  タブは選択中に赤の丸ベタが入る。

### 動きの演出（`src/components/motion.tsx`）

サイトの気持ちよさを移したものが揃っています。とくに派手な2つ：

- **星がパッと舞う（`SparkLayer` / `useSparkBurst`）** — サイトの「AI相談」タブが
  引っ込むときのキラキラ（`globals.css` の `uke-twinkle`）と同じ動き。
  ボタンを押すと、**指のところから**黄と赤の星が9つ散ります。

  出るのは `onPress`（指を離したとき）ではなく **`onPressIn`（触れた瞬間）**。
  ふつうのタップでも0.1秒前後あるので、そのぶん丸ごと待たされていました。
  引き換えに、スクロールし始めた指が押せるものの上にあると一度だけ星が出ます
  （RNはまず子に触りを渡し、あとからスクロールが奪うため）。速さを取っています。

  描くのは画面のいちばん上に置いた `SparkLayer`（`src/app/_layout.tsx`）で、
  ボタンは座標を渡すだけです。**ボタンの中で描いてはいけません**。
  レッスンはカードを `key` で作り直しているので、「つぎへ」のように
  押すと自分ごと消えるボタンだと、星まで道連れになって一度も見えません。

  ネイティブの `Modal` は別の窓で根元の層が届かないため、
  ミニゲームは自前の `SparkLayer` を持っています（Contextなので近いほうが勝つ）。

- **押した感じ（`useTap`）** — 沈み・触覚・星をまとめて配るフック。
  **押せるものは全部これを通します**。一部だけ返事があると、
  返事のないものが「効かない」ように見えるからです。

  見た目は `ui.tsx` の2つに揃えます。ベタ影のあるものは `sinkPop`
  （影が0まで潰れて**影のあった位置まで丸ごと落ちる**／地の色が一段濃く／
  わずかに縮む）、影のない平らなものは `sinkFlat`（きゅっと縮む）。
  文字だけの押せるところは `<Tap>` で包めば済みます。

  サイト（`ds.tsx`）は `translate(2px,2px)` ＋影3px→1px ですが、
  スマホは**指がボタンを覆う**のでこれでは見えません。指の外にはみ出す
  縁の動きと色の変化で伝えます。

  また `Pressable` の `pressed` をそのまま使うと、**速く叩いたときに
  沈んだ姿が見えません**（指を離すのが1フレームで、描く前に戻る）。
  `usePressFeel` が最低110msは沈めたままにします。

  **押して気持ちよくしたくないものには星を出しません**（`sparks={false}`）。
  「やめる」「記録をぜんぶ消す」「案内をとばす」がそれです。
  絵巻の送りも、14回押すあいだ星が舞い続けると絵が見えなくなるので外してあります。

- **称号ランクアップ（`src/components/rank-up.tsx`）** — **アプリでいちばん派手な画面**。
  称号が上がったとき、レッスンの結果を読ませる**前に**全画面で割り込みます。

  ベタフラッシュ（白く飛ぶ）→ 集中線 → 「RANK UP」を叩きつける →
  前の称号に赤い取り消し線 → 金のメダルが判子のように落ちてくる（着地で
  画面が揺れ、星を5か所から撒く）→ 称号名 → 先生のひとこと → つづける。

  集中線は線ではなく**中心から外へ広がる三角のベタ**（`react-native-svg`）。
  線で描くと端末によって細りすぎて消えるためで、アイコンと同じ理屈です。

  **置き場所は先に確保します**（`Slot`）。出来事が増えるたびに縦に積むと、
  すでに出ているものが上へずれて、組み上がる画がガタつきます。
  足元の「つづける」も同じ理由で高さだけ先に取ってあります。

  途中で触ったら**最後まで一気に進めます（閉じません）**。ご褒美の画面なので、
  うっかり触って見逃すのがいちばん惜しい。組み上がってからもう一度触ると閉じます。

- **タイルで画面を覆う（`TileIn`）** — ミニゲームに入るときの切り替え。
  四角いタイルが斜めにパパパパッと並んで画面を埋め、埋まってからタイトルが出ます。
  **速さで持たせる演出なので伸ばさないこと**。端から端まで0.5秒ほどで、
  ゆっくりやると「読み込み中」に見えて逆効果になります。
  タイルの色は、覆ったあとに出す地と同じ色にしてください（違うと切り替わりが見えます）。

### 画面の組み立て方（全画面共通）

ホームで決めた作法を、他の画面もそのまま踏襲しています。**新しい画面を足すときも同じ形にすること。**

```tsx
<Screen
  header={<ScreenHead kicker="COURSES" title="まなぶ" progress={…} note={…} />}
  tone="dots">
  <Cassette>{/* この画面でいちばん押してほしいもの */}</Cassette>
  <Panel>{/* 中身 */}</Panel>
</Screen>
```

1. **上は黒ベタの帯**（`Screen header` ＝ `ScreenHead`）。枠もベタ影も付けない。
   ステータスバーのぶんは帯自身が飲み込む。下の黒いタブバーと同じ黒で挟むことで、
   **あいだが「紙」として立つ**。ここを浮いた黒カードにすると、その効きが丸ごと消える
   （一度そうして失敗している）。
   レッスン画面だけは帯を Stack のヘッダー（`src/app/_layout.tsx`）が持つ。
2. **地は網点の紙**（`Screen tone="dots"`）。帯とタブバーには掛からない。
3. **いちばん押してほしいものは黒いカセット**（`<Cassette>` ＝ ほぼ黒の地に白い網点）。
   赤と黄がいちばん強く出るのはこの上なので、**1画面に1つだけ**。
   中の文字とアイコンは白（`C.paper50`）にする。
4. **黄色いピル**（`<Pill label="NEXT" />`）は「次にやること」の印。これも**1画面に1つだけ**。
   2つ出た時点で「次」の意味が消える。せっていのように「次」が無い画面には置かない。
5. **見出しは帯が持つ**。紙の上にページ見出しを置かない（見出しが2つになる）。
   コマの中の小見出しは `F.h1` をそのまま使う。

色の役割は画面をまたいで固定です。

| 色 | 意味 |
|---|---|
| 赤 | 押せるもの |
| 黄 | 次にやること（1画面に1つ） |
| 黒 | 枠まわり（帯・タブバー・カセット） |
| 紙＋網点 | 地 |
| 白 | コマの中身。**紙にすでに網点が敷いてあるので、コマに `tone="dots"` を重ねない**（地と見分けが付かなくなる）。斜線 `tone="lines"` は別物なので使ってよい |

背の低い画面（`useWindowDimensions().height < 700`）では、`ScreenHead compact` と
`Cassette compact` で余白を詰めて本文に高さを回します。ホームはこれでアバターの取り分を稼いでいます。

### アプリ内のアイコンを描き直すとき

タブでの表示は22px前後しかないので、**PNGにせずSVG（ベクター）で持つ**こと。
この小ささではPNGは@3xでも輪郭が甘くなるうえ、色ごとに書き出しが要る。

小さいサイズの鉄則:

- **線で描かず「ベタのシルエットから穴を抜く」**（`fillRule="evenodd"`）。
  細い線は黒地の上で溶けて消える
- 24×24グリッド。抜き（マンガのベタに入れるハイライト）は最低2単位の幅を取る
- 1アイコンの要素は3つまで
- 抜きを斜めにして中央へ向けると「目」に見えてしまう。文字行のつもりなら水平に置く

歯車や星は目分量だと歪むので、座標を計算して作る。形の定義も確認用の書き出しも
`tools/build-icons.mjs` に集約してある:

```bash
npm run icons:ui     # = node tools/build-icons.mjs
#  -> realsize.png  22pxで実際にラスタライズして8倍に拡大（端末で見える通り）
#  -> sheet.png     22/44/88px＋白抜き／黒版の一覧
#  -> src/components/icon-paths.ts  アプリが読むパスデータ（自動生成）
```

**必ず realsize.png で判断すること。** 大きい絵だけで見ると、端末では潰れている、
ということが起きる。実際、この工程で「本の抜きが目に見える」「スパナが判別できない」
「パレットが顔に見える」を見つけて直している。

パスデータは `icon-paths.ts` に自動生成されるので**手で書き写さない**。
見た目の大きさの差は `src/components/icons.tsx` の `OPTICAL` で微調整する。

アイコンを増やすときは `tools/build-icons.mjs` の `ICONS` に足して再実行すれば、
型（`IconName`）まで通る。

### アプリアイコンと起動画面

ホーム画面に出るアイコンは別のツール。**PNGを手で触らず、ここから全サイズ焼く。**

```bash
npm run icons:app     # = node tools/build-app-icon.mjs
#  -> assets/images/ の6枚 ＋ public/app-icon.png
#  -> tools/.icon-preview/app-icon.png        120px（iPhoneの60pt）で焼いて5倍
#  -> tools/.icon-preview/app-icon-masks.png  Androidの3種のマスク＋起動画面
```

絵は「黄色の地に網点、黒ベタの角帽、赤いキラリ」。形は `tools/build-app-icon.mjs`
の `CAP_BOARD` / `CAP_TASSEL` / `M`（配置の比率）にまとまっている。

書き出し先ごとに約束ごとが違うので、ツール側で吸収してある：

| 出力 | 約束ごと |
| --- | --- |
| `icon.png` (1024) | iOS・ストア用。**透過なし・角丸なし**（iOSが自分で丸める） |
| `android-icon-foreground.png` (512) | 見えるのは**中央66%（72dp/108dp）の円**だけ。`markFitted()` がそこに収まる倍率を計算している |
| `android-icon-background.png` (512) | 黄色＋網点のベタ |
| `android-icon-monochrome.png` (432) | テーマアイコン。システムが色を塗るので**白の形だけ**。キラリは団子に見えるので入れない |
| `splash-icon.png` (512) | 紙色の上に置くので、**タイルごと角丸**で出す。大きさは `app.json` の `imageWidth` |
| `public/app-icon.png` (512) | 「ホーム画面に追加」で出るもの。iOSは透過を黒で合成するので**透過なし** |

**判断は `app-icon.png` の実寸のコマで行う。** ホーム画面では60pt＝120px程度に
しかならない。この工程で「房が板から切り離された棒に見える」「房とアタマが
くっついて潰れる」「Androidのマスクで帽子のフチが欠ける」を見つけて直している。

### アバターが立つ背景（舞台）

ホームのコマには、アバターがそこに立って見えるよう絵を敷いている。
Midjourneyで描いた元画像を `tools/prepare-stage.mjs` で整えたもの。

```
assets/images/_raw/classroom.png   元画像（MJの出力そのまま）
        ↓  npm run stage:prepare
assets/images/stage-classroom.jpg  コマに敷くもの
```

差し替え点は `src/data/stage.ts` の3つだけで、値はツールが出してくれる。

```ts
export const STAGE = require('@/assets/images/stage-classroom.jpg');
export const STAGE_RATIO = 0.637;    // 絵の 幅÷高さ
export const STAGE_WALL = '#736340'; // 絵のいちばん上の色
```

#### なぜ下端に揃えて敷くのか

コマの高さは端末で大きくぶれる。実測すると**縦横比が 0.67〜1.10**で、
iPhone SEでは**横長**になる。`cover` の中央切りだと、狭い端末で床が
丸ごと消えてキャラが宙に浮く。

そこで `<Panel bg bgRatio bgColor>` は「**下端に揃えて敷き、上のはみ出しを切る**」。
絵をコマより確実に縦長にしておけば、どの端末でも床が残る。
**`STAGE_RATIO` は実測の最小 0.672 より小さくすること。**
超えると縦長のコマで上に隙間が出る（`bgColor` で埋まるが、絵の
いちばん上が単色でないかぎり継ぎ目に見える）。ツールが警告を出す。

#### MJの出力はそのままでは使えない

`low horizon` と書いても、**MJは地平線を絵の真ん中あたりに置く**。
実際に上がってきた絵も地平線58%・床42%だった。上は端末によって
切られるので、このまま敷くと横長のコマで床だけの絵になる。

`prepare-stage.mjs` が**下（床）を削って地平線を下げる**のはそのため。
削るほど良いわけではなく、削ると比率が横長に寄って上記の上限に
ぶつかる。いまは12%削って 0.560 → 0.637（地平線58% → 66%）。

あわせて、立ち位置に**やわらかい楕円の影を焼き込む**。3Dのキャラは
影を持たないので、これが無いと床に貼りついて見える。

#### なぜぼかすのか（いちばん効く処理）

3Dのキャラは固定のカメラで描かれていて、MJが描いた部屋の遠近とは
一致しない。実測したところ、この絵の**地平線はキャラの顎を通っていた**
（本来は目の高さに来る）。ズレ自体は12%ほどだが、背景がくっきりして
いると脳が窓や床の大きさとキャラを比べてしまい、**「小人が立っている」**
ように見える。

ぼかすと背景が「遠く」として処理されて、比べるのをやめる。
アバター系のアプリが軒並み背景をぼかしているのはこのため。
あわせて明るさと彩度を少し落とし、キャラを前に出す。

遠近のズレの残りは、ホーム側で `AVATAR_ZOOM`（`src/app/(tabs)/index.tsx`）
を上げて詰めている。3Dのカメラは選択画面と共用なので触らず、
キャンバスだけを大きくして足元を揃えたまま上へはみ出させている。

```bash
npm run stage:prepare -- assets/images/_raw/classroom.png
CROP_BOTTOM=0.16 npm run stage:prepare -- 元.png   # 削る量を変える
BLUR=12          npm run stage:prepare -- 元.png   # もっとぼかす（0で無効）
BRIGHTNESS=0.85  npm run stage:prepare -- 元.png   # もっと沈める
SHADOW=0.45      npm run stage:prepare -- 元.png   # 影を濃くする
```

確認は `tools/.icon-preview/stage.png`。実測した3端末のコマの比率で
切って、フキダシとキャラの位置を重ねてある。**いちばん横長の
iPhone SE で床と窓と黒板が残っていれば合格**。

出力はJPEG。透過が要らないので、PNGだと2.4MBのところが**48KB**で済む
（ぼかすと情報量が減るぶん、さらに小さくなる）。

#### 構図の決まりごと

描き直すときは、切られる前提で組む。

| 帯 | 置くもの |
| --- | --- |
| 上 0〜30% | **切られる。かつフキダシが重なる**。何も置かない |
| 30〜50% | 端末によっては切られる。壁だけ |
| 50〜80% | 黒板・窓など「ここがどこか」を語るもの |
| 80〜100% | 床。手前ほど広がる遠近で |
| 中央の下 | キャラの立ち位置。何も置かない |

キャラは黒フチのない3Dで、背景が濃いと溶ける。**彩度も明度差も抑える**こと。

#### Midjourneyのプロンプト

`--ar 9:16` で出す（削ったあとに 0.637 前後になる）。

```
empty modern classroom interior, 3D anime style, stylised Pixar-like render,
warm cream and soft beige palette, large window on the left casting a soft light
beam across a pale wooden floor, dark green chalkboard on the right wall,
camera at standing eye level, extremely low horizon, wall filling the top four
fifths of the frame, wide empty foreground, soft diffused lighting,
gentle depth of field, muted low-contrast colours
--ar 9:16 --style raw --stylize 150 --no people, characters, text, watermark, logo
```

外すと使えない絵になる指定：

- **`--no people, characters`** — 入れないと必ず人が立ち、立ち位置が埋まる
- **`camera at standing eye level`** — 無いと俯瞰になり、キャラが床にめり込む
- **`wide empty foreground`** — 机や椅子が手前に来ると、キャラが物の中に立つ
- **`muted low-contrast`** — 背景が強いとキャラが溶ける

なお `extremely low horizon` を入れても効きは弱い。**削る前提で頼むほうが早い。**

つなぎの絵が要るとき（元画像がまだ無いなど）は `npm run stage` で
`tools/build-stage.mjs` がベクターの教室を描く。

### フォントを差し替えたら

日本語フォントはサブセット化して積んでいます（10.2MB → 2.1MB）。
レッスンを増やして「□」が出たら作り直してください。

```bash
npm run fonts:subset
```

## オープニング（AIの75年）

初回起動のときだけ `/opening` が出て、サイトの `/history` の年表を1コマずつ見せます。
真ん中に動画、左右に送りの三角、6秒で自動送り、下に**いつでも押せる**「本編にすすむ」。

### 「ダウンロード画面」にはしていない

一度そう作ろうとしてやめました。**ストアから落とした時点で中身は全部端末に入っている**
ので、進捗バーを出しても中身のない演出になります。ソシャゲにあれがあるのは、本体を
薄く出して**インストール後に中身を取りにいっている**からで、あの進捗は本物です。

うちは全部同梱なので、出すなら偽の進捗になる。**AIリテラシーを教えるアプリが、入口で
嘘の進捗を見せるのは筋が通りません。** なのでオープニング演出として作ってあり、
止めない・急かさない・いつでも飛ばせる形にしています。

裏でホームの重いもの（アバターのGLB・舞台）を先読みしていますが、**進捗は出しません**。
見せるほどの待ちではないし、出せばそれこそ演出になります。

### 動画はアプリに積まない

mp4は14本で7MB。**1回しか見ない画面のためにアプリを7MB太らせない**ので、
サイト（`comixai.dev/history/`）から取りにいきます。

- 静止画（webp・14枚で1.2MB）は**アプリに積んである**。これが常に下に敷いてあり、
  動画が届いたら上に重なる
- **電波が悪くても絵巻は成立する**（動きが無いだけ）。止まらない
- 配信元を変えたいときは `EMAKI_ORIGIN=http://localhost:8091 npm run emaki`

動画は **H.264（avc1）**。iOS/Androidともハードウェアで再生できますが、
**headless Chromium は H.264 を持っていない**ので、Playwrightでの自動確認では
静止画のまま映ります（`canPlayType` が空を返す）。動きの確認は実機かデスクトップの
Chrome/Safariでやってください。

**`playsInline` を外さないこと。** iOS Safari は `playsinline` の付いていない
`<video>` を、再生した瞬間に全画面へ持っていきます。コマの中で再生させたいので、
`VideoView` に `playsInline` と `fullscreenOptions={{ enable: false }}` を渡しています
（一度これを忘れて、1コマ進むたびに全画面になりました）。

**`VideoView` は「箱で囲って、中で100%」にすること。** `left/right/top/bottom` だけを
指定しても、react-native-web は `<video>` を素の大きさのまま置いてしまい、コマから
はみ出して下の文章に被ります。外側の `View` で位置と `overflow: 'hidden'` を決め、
`VideoView` 自身は `width: '100%', height: '100%'` にします。

`<Panel bg>` の `Image` でもまったく同じ罠を踏んでいます（`ui.tsx` のコメント参照）。
**react-native-web では、上下左右の指定だけでメディア要素は縮まない**と覚えておくこと。

### 素材の取り込み

コマのデータと絵は自動生成なので、手で編集しない。

```bash
npm run emaki   # サイトの src/app/history/eras.ts から取り込む
```

- `src/data/emaki.ts` … 年・タイトル・本文・ツッコミ・トーン・動画URL（生成物）
- `assets/images/emaki/*.webp` … コマ絵（サイトの public/history からコピー）

2回目以降は出ません（`seenOpening` を保存している）。**記録をリセットしても
出し直しません**——初回だけの導入であって、見返したいものではないため。

## チュートリアル（先生がアプリを案内する）

職種を選び終えると、選んだ先生が6歩でアプリを案内します（`src/store/tutorial.tsx`）。
実際にその画面へ移動し、**該当するタブを黄色いリングで光らせながら**説明します。

### タブを光らせる方法

**タブボタンの座標は測りません。** expo-router の `Tabs` からボタンの位置を取るのは
素直でなく、端末や安全領域で狂います。代わりに「いまどのタブが光る番か」だけを配り、
`TabIcon` が自分の名前と見比べて**自分でリングを描きます**。座標の計算がまるごと要りません。

描くときの順番に注意すること。

- リングは**いちばん最後に描く**。先に描くと、選択中の赤い丸ベタに塗りつぶされて消える
  （Webでは position:absolute の兄弟が後勝ちで上に来る）。`zIndex: 2` も要る
- 出しっぱなしのリング＋広がって消えるリングの2枚重ね。**広がるだけだと、
  消えている時間のほうが長くて見落とす**
- 広がるほうの倍率は控えめに。タブバーに切られることがある

### 吹き出しに3Dアバターを置いていない理由

先生の顔を出したいところですが、`GLView` をもう1つ立てるとホームのアバターと2重に
なります。読み込み直しも起きえて、非力な端末では効きます。ホームの回では**本物の
アバターが後ろに立っている**ので、吹き出しはアイコンと名前だけにしてあります。

吹き出しは `(tabs)/_layout.tsx` に住んでいます（タブの外に置くと、タブを切り替える
たびに消えるため）。下端の余白は `TAB.height + insets.bottom`。固定値にすると
ホームインジケーターのある端末で隠れます。

案内を見終えるか「とばす」を押すと `seenTutorial` を保存して、二度と出ません。
**記録のリセットでは出し直します**（アバターや職種も選び直すことになるので）。

## アバターを追加する

台帳（`src/data/avatars.ts`）には先生のほかに4体分のエントリが**枠だけ**入っている。
`model: null` のあいだは選択画面に「準備中」と出るだけで選べないので、
GLBができた順に埋めていけばいい。

1. GLBを用意する。**アニメーション名は `src/avatar/motions.ts` の11種に揃える**
   （`laugh` / `wave` / `bow` / `idle-a` / `arms-crossed` / `walk` / `scared` / `angry` / `worried` / `idle-b` / `explain`）
2. スマホ向けに変換する

   ```bash
   node tools/transcode-avatar.mjs 元.glb assets/models/senpai.glb assets/models/senpai-texture.jpg
   ```

3. `src/data/avatars.ts` の該当エントリの `model` を埋める

   ```ts
   model: {
     glb: require('@/assets/models/senpai.glb'),
     texture: require('@/assets/models/senpai-texture.jpg'),
     view: STANDING,
   },
   ```

### なぜ変換が要るのか

サイトで使っている `public/claude-app/sensei.glb` は、そのままでは端末アプリで動かない。

| 元GLBの仕様 | 端末で困ること | 変換後 |
| --- | --- | --- |
| `EXT_meshopt_compression` | デコーダがWASM。HermesにWebAssemblyが無い | 展開して埋め込み |
| `EXT_texture_webp`（GLB埋め込み） | RNの画像デコーダを通せない | JPEGとして**GLBの外**に出し、実行時に `material.map` へ割り当て |
| 380,790トライアングル / 4096pxテクスチャ | スマホのリアルタイム描画には重い | 45,692トライアングル / 1024px |

結果、**3.9MB → GLB 1.9MB + テクスチャ 119KB**。
`tools/transcode-avatar.mjs` がこの3つをまとめてやる（`RATIO` / `TEX_SIZE` 環境変数で調整可）。

## レッスンを増やす

`src/data/courses/` に1ファイル1コース。`index.ts` の `COURSES` に足せば一覧・進捗・バッジ判定に自動で入る。

職種で内容を変えたいところは、共通のキーの隣に `〜ByRole` を書く：

```ts
{
  say: '最初は、失敗しても平気な仕事から渡せ。',
  sayByRole: { sales: 'いきなり顧客向けメールを書かせるな。' },
  body: '共通の本文',
  bodyByRole: { office: '事務職向けの本文' },
  promptByRole: { marketing: 'マーケ向けのコピペ用プロンプト' },
}
```

`ByRole` に無い職種は共通のものが使われるので、**書き忘れても壊れない**。

### 体験カード（読むだけにしない仕掛け）

カードに `interactive` を足すと、本文の下に道具が出ます。選択式のクイズだけだと
飽きるので、**手を動かす場所**をレッスンの中に挟むための仕組みです。

```ts
{
  say: '好きに打ってみろ。区切りが見えるはずだ。',
  heading: 'AIの目線で見てみる',
  body: '…',
  interactive: { kind: 'tokenizer', presets: ['こんにちは'] },
}
```

| kind | 中身 | 合否 |
|---|---|---|
| `tokenizer` | 打った文字がどうトークンに割れるか見る | なし |
| `token-budget` | 決めた範囲のトークン数に収める | **あり。通らないと次に進めない** |
| `ai-prompt` | 実際にAIに指示を出し、成果物と指示を採点してもらう | 点は出るが**進行は止めない** |

**先に進めなくするのは `token-budget` だけ。** トークン数は誰がやっても同じ答えに
なるので、止めても必ず抜けられます。`ai-prompt` の点はAIの判断で揺れるので、
**揺れるもので通せんぼをしません。**

合否のあるものは、条件を満たしたら `onDone(true)` を呼びます。レッスン側
（`src/app/lesson/[id].tsx`）がこれを見て「つぎへ」を出します。増やすときは
`src/data/types.ts` の `LessonInteractive` に足して、`src/components/lesson-interactive.tsx`
に描き方を書いてください。**体験は職種で出し分けません**（全職種共通の道具）。

#### トークナイザーについて

サイトの `/tokenizer` と同じ **cl100k_base** を使っています（`src/lib/tokenizer.ts`）。

- **BPEの表だけで約1MBある**ので、`import()` で遅延読み込みしている。
  Web版では別ファイルに分かれ、体験カードを開くまで落ちてこない
- `o200k_base` は2.2MBあるので採らない
- **日本語は1トークン＝1文字ではない。** UTF-8のバイト列をまとめる方式なので、
  1トークンだけをdecodeしても文字として成立しないことがある（置換文字になる）。
  表示は必ず `toChips()` を通し、**文字として読めるところまで束ねる**こと。
  赤いチップがその「束ねた塊」で、右の数字がトークン数

#### AI採点（`ai-prompt`）

書いたプロンプトを**実際にClaudeに渡して実行させ、その結果ごと採点**します。

```
アプリ  ──POST──▶  comixai.dev/api/academy/grade  ──▶  Claude Haiku
        ◀── {output, score, good, improve, missing}
```

**APIキーはアプリに置きません。** 鍵はサイト側（Vercelの環境変数
`ANTHROPIC_API_KEY`）にあり、**費用は吉川持ち**です。だからアプリが送るのは
`exerciseId` と書いた文だけで、**お題の中身（システムプロンプト）はサーバーが持ちます**。
アプリに持たせると、そこを書き換えて鍵にタダ乗りされます。

お題を増やすときは**2か所**に足すこと。片方だけだと fallback に落ちます。

1. アプリ: カードの `interactive.exerciseId`
2. サイト: `src/app/api/academy/grade/route.ts` の `EXERCISES`

##### 費用の歯止め

1リクエストあたり **0.5円ほど**（Haiku、出力700トークン上限）。歯止めは4段:

| 場所 | 中身 |
|---|---|
| `max_tokens` | 700。**ここがいちばん効く** |
| 入力 | 600字まで |
| IPごと | 10分に12回 |
| 全体 | 1日 `ACADEMY_DAILY_MAX`（既定1500 ≒ 750円/日） |

ただし**カウンタはインスタンス内メモリなので、Vercelでは複数インスタンスに
分かれてすり抜けます。** 事故（連打・ループ）を止める一次防波堤であって、
本当の歯止めにはなりません。**Anthropicのコンソールで月額の上限を掛けてください。**
そこだけが確実な天井です。

##### 繋がらないときは簡易採点に落ちる

鍵が無い・上限に達した・通信できない——どの場合も `fallback: true` が返り、
アプリは**AIなしの簡易採点**（役割・目的・条件・出力形式の4語があるかを見るだけ）
に降格します。点も合否も出るので、**学習は止まりません**。この降格を壊さないこと。

#### 課題の範囲の決め方

`token-budget` の `min`/`max` は、**自然に書いた答えが上限を少し超える**あたりに置きます。
日本語は1文字≒1トークン前後なので、`20〜35` なら30〜40字ぶん。狭すぎると
削るだけの作業になり、広すぎると何も学ばずに通ってしまいます。

### 職種を増やすとき

1. `src/data/types.ts` の `RoleId` に足す
2. `src/data/roles.ts` に1件足す（アイコン・名前・キャッチ・当てはまる人3つ）
3. `src/data/courses/` の **`〜ByRole` 全16か所**にその職種の文章を書く
   （`basics.ts` 1・`prompt.ts` 6・`work.ts` 9）
4. サイトの `src/app/guide/data.tsx` にも同じ slug でガイドを足す。
   ヒーロー画像は `docs/guide-hero-prompts.md` を見ること

`ByRole` を埋めなくても落ちませんが、**「職種別」の札を出しておいて中身が共通のまま**
というのがいちばん白けます。書けないなら職種を足さないほうがましです。

書き漏らしはこれで見つかります。

```bash
python3 - <<'PY'
import re, pathlib
ROLES = ['sales','marketing','office','creator','hr','support','planner','owner','it']
for f in sorted(pathlib.Path("src/data/courses").glob("*.ts")):
    src = f.read_text()
    for m in re.finditer(r'(\w+ByRole):\s*\{', src):
        i, depth = m.end(), 1
        while depth:
            depth += {'{': 1, '}': -1}.get(src[i], 0); i += 1
        keys = re.findall(r'^\s{12}(\w+):', src[m.end():i], re.M)
        miss = [r for r in ROLES if r not in keys]
        if miss:
            print(f"{f.name}:{src[:m.start()].count(chr(10))+1} {m.group(1)} 欠け={miss}")
PY
```

なお `'other'`（あてはまらない）は**わざと byRole を持ちません**。共通文がそのまま出るのが
正しい挙動なので、上のチェックの `ROLES` にも入れないこと。画面側は `role.generic` を見て
「◯◯向けで表示中」ではなく「共通の内容で表示中」と出し分けています。

コースを増やしたら `src/data/badges.ts` に修了バッジを1件足すこと（`Course.badgeId` と同じID）。
バッジの判定条件は `src/store/progress.tsx` の `evaluateBadges()` に集約してある。

## コンテンツの出どころ

- 用語の定義・職種別の手順・FAQ … サイトの `/glossary`・`/guide`・`/prompts`
- 「悪い例→直す」「追い込み方」「役割を与える」などのレッスン … アプリ用の書き下ろし
- 先生の口調 … サイトの Claude教習所（`src/app/claude-app/`）に合わせている
