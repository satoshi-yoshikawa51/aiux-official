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
├── assets/models/           sensei.glb と外出ししたテクスチャ
├── assets/fonts/            サブセット済みの書体（→ assets/fonts/README.md）
└── tools/                   GLB変換・フォントサブセット・トーン/アイコン生成
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

### アイコンを描き直すとき

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
node tools/build-icons.mjs
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
