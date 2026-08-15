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
```

見え方まで見るときは、`dist` を静的配信して Playwright で撮る。
localStorage の `comixai-academy-v1` に進捗を流し込めば、どの画面からでも始められる。
**Claude Codeのサンドボックスから `*.vercel.app` には到達できない**ので、
実機での見え方はユーザーに頼む（どこを見てほしいかを具体的に書く）。

## 3Dアバターを触るとき

**必ず `README.md` の「アバターの見た目を直す（Tripo製モデルの手当て）」を読む。**
道具を流す順番と、**試して駄目だったやり方の一覧**が書いてある。
自動リグの崩れは原因が毎回ちがうので、思いつきで直すと同じ轍を踏む。

要点だけ：

- 直す前に測る。`tools/stretch-report.mjs`（裂ける面）と
  `tools/find-spikes.mjs`（浮いた突起）が場所と骨を教えてくれる
- **GLBを書き換える道具は範囲を限って使う。** 全体に掛けると別の壊れ方をする
- 顔の向きの補正は `src/data/avatars.ts` の `headTilt` が唯一の出どころ。
  変えたら `node tools/make-faces.mjs` で顔サムネイルを焼き直す
- 割れ目から背景が透ける件は `Avatar3D` の `DoubleSide` で塞いである。戻さないこと

## 手で編集しないもの

- `assets/faces/*.png` … `tools/make-faces.mjs` が焼く
- `assets/models/*.glb` … `tools/` の道具を通す（直接いじらない）
- `src/data/emaki.ts` … `tools/sync-emaki.mjs` がサイト側から同期する

## 書きぶり

コメント・コミットメッセージ・UI文言はすべて日本語。既存コードのトーンに合わせる。
コメントは「何をしているか」ではなく**「なぜそうしたか」「何が駄目だったか」**を書く
（このリポジトリのコメントはそういう作りになっている）。
