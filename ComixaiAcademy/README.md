# COMIXAI アカデミー — スマホアプリ（Expo / React Native）

[comixai.dev](https://comixai.dev) の学習コンテンツを、**3Dアバターと一緒に学ぶスマホアプリ**にしたもの。

- **アバターを選ぶ** → **職種を選ぶ** → ホーム画面にアバターが常駐
- 職種（営業／マーケ／事務／クリエイター）で、レッスンの例とプロンプトが差し替わる
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
├── assets/models/           sensei.glb と外出ししたテクスチャ
├── assets/fonts/            サブセット済みの書体（→ assets/fonts/README.md）
└── tools/                   GLB変換・フォントサブセット・トーン／アイコン生成
                             （アプリ内アイコン＝build-icons / アプリアイコン＝build-app-icon）
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
- **アイコン** — アプリ内の絵文字はすべて `src/components/icons.tsx` のオリジナル（33種）に
  置き換えてある。単色なので、置く場所にあわせて色を渡す（黒地では白抜き、紙の上ではインク）。
  タブは選択中に赤の丸ベタが入る。
- **紙（画面の地）** — `<Screen tone="dots">` で画面いっぱいに網点を敷ける。
  ホームがこれ。コマやカードは、その紙の上に置かれたものとして白く抜く。

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
いまは `npm run stage` が描いた**つなぎ**（教室）で、Midjourneyで描いたものに
差し替える前提。差し替え点は `src/data/stage.ts` の3つだけ。

```ts
export const STAGE = require('@/assets/images/stage-placeholder.png'); // ← 差し替える
export const STAGE_RATIO = 9 / 16;   // 絵の 幅÷高さ
export const STAGE_WALL = '#f7efe0'; // 絵のいちばん上の色
```

#### なぜ下端に揃えて敷くのか

コマの高さは端末で大きくぶれる。実測すると**縦横比が 0.67〜1.10**で、
iPhone SEでは**横長**になる。`cover` の中央切りだと、狭い端末で床が
丸ごと消えてキャラが宙に浮く。

そこで `<Panel bg bgRatio bgColor>` は「**下端に揃えて敷き、上のはみ出しを切る**」。
絵をコマより確実に縦長（9:16）にしておけば、どの端末でも床が残る。
縦に余ったぶんは `bgColor` で埋まるので、絵のいちばん上は平らな壁色にしておく。

#### 構図の決まりごと

差し替える絵もこれに合わせる。合っていないと、狭い端末で破綻する。

| 帯 | 置くもの |
| --- | --- |
| 上 0〜30% | **切られる。かつフキダシが重なる**。何も置かない |
| 30〜50% | 端末によっては切られる。壁だけ |
| 50〜80% | 黒板・窓など「ここがどこか」を語るもの |
| 80〜100% | 床。手前ほど広がる遠近で |
| 中央の下 | キャラの立ち位置。**影の楕円だけ**置いて、他は空ける |

キャラは黒フチのない3Dで、背景が濃いと溶ける。**彩度も明度差も抑える**こと。

#### Midjourneyのプロンプト

`--ar 9:16` は `STAGE_RATIO` に合わせてある（そのまま入れれば切らずに済む）。

**教室（いまのつなぎと同じ画）**

```
empty modern classroom interior, 3D anime style, stylised Pixar-like render,
warm cream and soft beige palette, large window on the left casting a soft light
beam across a pale wooden floor, dark green chalkboard on the right wall,
camera at standing eye level, low horizon with the floor filling the bottom fifth,
wide empty foreground, soft diffused lighting, gentle depth of field,
muted low-contrast colours
--ar 9:16 --style raw --stylize 150 --no people, characters, text, watermark, logo
```

**職員室・オフィス（社会人向けの雰囲気にしたいとき）**

```
empty tidy office corner, 3D anime style, stylised Pixar-like render,
warm cream and light oak palette, tall window with sheer curtains on the left,
low bookshelf and a whiteboard along the back wall, camera at standing eye level,
low horizon with the floor filling the bottom fifth, wide empty foreground,
soft morning light, gentle depth of field, muted low-contrast colours
--ar 9:16 --style raw --stylize 150 --no people, characters, text, watermark, logo
```

**図書室（落ち着いた画にしたいとき）**

```
empty library reading room, 3D anime style, stylised Pixar-like render,
warm paper-cream and walnut palette, tall bookshelves softly out of focus along
the back wall, arched window on the left, camera at standing eye level,
low horizon with the floor filling the bottom fifth, wide empty foreground,
warm diffused light, shallow depth of field, muted low-contrast colours
--ar 9:16 --style raw --stylize 150 --no people, characters, text, watermark, logo
```

効かせどころは決まっていて、外すと使えない絵になる：

- **`--no people, characters`** — 入れないと必ず人が立つ。立ち位置が埋まる
- **`camera at standing eye level` / `low horizon`** — これが無いと俯瞰になり、
  キャラが床にめり込んで見える
- **`wide empty foreground`** — 机や椅子が手前に来ると、キャラが物の中に立つ
- **`muted low-contrast`** — 背景が強いとキャラが背景に溶ける

#### 差し替えたあと

1. 画像を `assets/images/` に置いて、`STAGE` の require を書き換える
2. 比率が 9:16 でなければ `STAGE_RATIO` を実際の 幅÷高さ に直す
3. 絵のいちばん上の色を `STAGE_WALL` に入れる（縦に余ったときの継ぎ目が消える）
4. `npm run stage` は**つなぎを作り直すだけ**。本番の絵とはファイル名が
   別なので上書きはされないが、走らせる必要も無い

確認は `tools/.icon-preview/stage.png`。実測した3端末のコマの比率で切って、
フキダシとキャラの位置を重ねてある。**いちばん横長の iPhone SE で
床と黒板が残っていれば合格**。

### フォントを差し替えたら

日本語フォントはサブセット化して積んでいます（10.2MB → 2.1MB）。
レッスンを増やして「□」が出たら作り直してください。

```bash
npm run fonts:subset
```

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

コースを増やしたら `src/data/badges.ts` に修了バッジを1件足すこと（`Course.badgeId` と同じID）。
バッジの判定条件は `src/store/progress.tsx` の `evaluateBadges()` に集約してある。

## コンテンツの出どころ

- 用語の定義・職種別の手順・FAQ … サイトの `/glossary`・`/guide`・`/prompts`
- 「悪い例→直す」「追い込み方」「役割を与える」などのレッスン … アプリ用の書き下ろし
- 先生の口調 … サイトの Claude教習所（`src/app/claude-app/`）に合わせている
