# CLAUDE.md（ComixaiAcademy）

このディレクトリは **Expo / React Native の学習アプリ**。リポジトリ直下の
Next.jsサイトとは別プロジェクトで、ここだけで独立して動く。

**まず `README.md` を読む。** 画面の作法・データの持ち方・レベルデザインまで
全部そこに書いてある。このファイルは「毎回つまずく所」だけの覚え書き。

## 検証の仕方

**テストもLintも無い。** 変更が壊れていないことは、この2つで確かめる。

```bash
npm run typecheck                 # tsc --noEmit（strict）
npx expo export --platform web    # 実質のビルド確認。dist/ が出る
npm run check:extras              # おまけ（data/extras/）が解ける形か
```

**`check:extras` は型チェックの外側を見る。** 「残さなければいけない行の
合計が予算を超えている」＝どう頑張っても解けない問題は、tsc も
expo export も素通りする（実際それで、削るゲーム3本が全部詰んでいた）。
おまけを足したら必ず流すこと。

見え方まで見るときは、`dist` を静的配信して Playwright で撮る。
localStorage の `comixai-academy-v1` に進捗を流し込めば、どの画面からでも始められる。
**Claude Codeのサンドボックスから `*.vercel.app` には到達できない**ので、
実機での見え方はユーザーに頼む（どこを見てほしいかを具体的に書く）。

## 3Dアバターを触るとき

**必ず `README.md` の「アバターの見た目を直す（Tripo製モデルの手当て）」を読む。**
道具を流す順番と、**試して駄目だったやり方の一覧**が書いてある。
自動リグの崩れは原因が毎回ちがうので、思いつきで直すと同じ轍を踏む。

要点だけ：

- **初回は `tools/` の中で `npm install`**。GLB・画像系の依存（sharp等）は
  `tools/package.json` に隔離してある——アプリ本体に入れると、EASのMacで
  sharpがソースビルドに落ちて `npm ci` ごと失敗し、iOSビルドが止まるため
- 直す前に測る。`tools/stretch-report.mjs`（裂ける面）と
  `tools/find-spikes.mjs`（浮いた突起）が場所と骨を教えてくれる
- **GLBを書き換える道具は範囲を限って使う。** 全体に掛けると別の壊れ方をする
- 顔の向きの補正は `src/data/avatars.ts` の `headTilt` が唯一の出どころ。
  変えたら `node tools/make-faces.mjs` で顔サムネイルを焼き直す
- 割れ目から背景が透ける件は `Avatar3D` の `DoubleSide` で塞いである。戻さないこと
- **`three` は `0.162.0` に固定（上げない）。** r163 で WebGL 1 対応が消えたが、
  ネイティブの expo-gl は WebGL 1 相当。上げると実機で
  「THREE.WebGLRenderer: WebGL 1 is not supported since r163」で3Dが全滅する
  （TestFlightで実際に落ちた）。上げてよいのは expo-gl が WebGL 2 になってから
- **Renderer を作る前に必ず `pinFlavor(gl, detectFlavor(gl))`
  （`src/lib/gl-compat.ts`）を通す。** three は `gl.constructor.name` の
  名前だけでWebGL1/2を判定し、expo-gl のネイティブコンテキストでは
  この名前が実体と食い違うことがある。食い違った回はシェーダが組めず、
  エラー画面も出ずに**キャラだけ白くなる**（「ガチャで当てた相棒が出ない」
  として実機で長引いた原因。モデルのファイルは無関係だった）。
  **WebGL1へ決め打ちも駄目**（実体がWebGL2寄りのコンテキストで全滅した）。
  実体のAPIを見て合わせるのが正で、それでも組めない場合は Avatar3D が
  反対の顔で1回だけ作り直す。新しくGLViewを使う部品にも忘れないこと

## 巨大なテーブルをネイティブで組み立てない

**10万件規模のJSオブジェクト/配列の構築を、iOSのHermesにやらせてはいけない。**
トークナイザー（cl100k_base・約10万件）の初期化で、TestFlightビルド9〜13が
**起動4〜5秒で必ずクラッシュ**した。落ちる場所は毎回違う（Object.keys →
new Uint8Array(配列) → concat）が、すべて同じ工程内のGCまわりのメモリ破壊。
場所を1つ塞いでも別の場所で出る＝エンジンの問題で、アプリ側では避けられない。
SDK更新（expo 57.0.14 / Hermes 2段階更新）でも直らなかった。

なので**トークンの計算はサイトのAPIに任せる**（`src/lib/tokenizer.ts` が
ネイティブでは `https://comixai.dev/api/tokenize` を呼ぶ。API実体はサイト側
`src/app/api/tokenize/route.ts`）。Webアプリは従来どおり手元で計算する
（ブラウザのV8では起きない）。**gpt-tokenizer をネイティブの実行経路に
戻さないこと。** patches/ にある gpt-tokenizer のパッチはこの調査の名残
（Web側は同じコードを通るので、害のない安全化として残している）。

クラッシュの調査手順も残しておく：TestFlightで落ちたら、ユーザーの端末の
**設定 → プライバシーとセキュリティ → 解析と改善 → 解析データ** にある
`COMIXAI-….ips` を送ってもらう。exception と faultingThread の frames で
場所が確定する（このファイル群が実際に決め手になった）。

## 手で編集しないもの

- `assets/faces/*.png` … `tools/make-faces.mjs` が焼く
- `assets/models/*.glb` … `tools/` の道具を通す（直接いじらない）
- `src/data/emaki.ts` … `tools/sync-emaki.mjs` がサイト側から同期する

## 書きぶり

コメント・コミットメッセージ・UI文言はすべて日本語。既存コードのトーンに合わせる。
コメントは「何をしているか」ではなく**「なぜそうしたか」「何が駄目だったか」**を書く
（このリポジトリのコメントはそういう作りになっている）。
