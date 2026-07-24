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
- 3D描画に `expo-gl` を使っているので、**Web（`npm run web`）では3Dが動かないことがある**。実機かシミュレータで確認すること
- 型チェック: `npm run typecheck`

ストアに出す段階になったら EAS Build（`npx eas build`）へ。`app.json` の `ios.bundleIdentifier` / `android.package` は `dev.comixai.academy` を仮置きしてある。

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
├── src/store/progress.tsx   進捗・バッジ判定・永続化
├── src/theme/               デザイントークン（サイトの globals.css を移植）
├── assets/models/           sensei.glb と外出ししたテクスチャ
└── tools/                   GLB変換・アイコン生成スクリプト
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
