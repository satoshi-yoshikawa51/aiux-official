# 職種別ガイドのヒーロー画像

`/guide/<slug>` のページ上部と、`/guide` 一覧・トップページのカードに出る絵。
`public/guide/<slug>.webp`（1200×800）です。

## いまの状態

| slug | 職種 | 画像 |
|---|---|---|
| `sales` | 営業 | Midjourney |
| `marketing` | マーケティング | Midjourney |
| `office` | 事務・バックオフィス | Midjourney |
| `creator` | クリエイター | Midjourney |
| `hr` | 人事・採用 | **仮**（`npm run guide:heroes` が作ったタイポグラフィ） |
| `support` | サポート・CS | **仮** |
| `planner` | 企画・PM | **仮** |
| `owner` | 経営者・個人事業主 | **仮** |
| `it` | 情シス・社内IT | **仮** |

仮画像はサイトと同じ書体・トークンで作ってあるので、そのまま公開しても壊れては
いません。ただし既存4枚は3Dキャラクターの絵なので、一覧に並べると**明らかに毛色が
違います**。絵ができ次第、同じファイル名で上書きしてください。

```bash
npm run guide:heroes          # 絵の無い職種だけ、仮画像を作る
FORCE=1 npm run guide:heroes  # 既存も作り直す（Midjourneyの絵も消えるので注意）
```

## Midjourneyで描くとき

既存4枚と絵柄を揃えるための共通部分です。**この後半をそのまま毎回付けてください。**

```
3D animation style character, Pixar-like, big expressive eyes, soft rounded shapes,
standing full body, centered, blurred bright modern office background with soft bokeh,
clean pastel color palette, soft studio lighting, white and light blue tones,
cheerful and approachable, high detail, --ar 3:2 --style raw --v 7
```

職種ごとに、頭に付ける1文だけ変えます。

### hr — 人事・採用

```
A friendly young Japanese HR staff character holding a clipboard with resumes,
warm welcoming gesture as if greeting a candidate, name badge on lanyard,
```

### support — サポート・CS

```
A cheerful Japanese customer support staff character wearing a headset,
one hand raised in a reassuring gesture, laptop on the desk behind,
```

### planner — 企画・PM

```
A thoughtful Japanese project manager character standing in front of a whiteboard
covered with sticky notes, holding a marker, mid-explanation pose,
```

### owner — 経営者・個人事業主

```
A confident Japanese small business owner character standing in front of
a small shop counter, arms lightly crossed, laptop and a stack of invoices nearby,
```

### it — 情シス・社内IT

```
A calm Japanese corporate IT administrator character holding a laptop,
server rack and network switches softly blurred in the background, shield icon feel,
```

## 差し替えるときの手順

1. Midjourney で 3:2（例 1456×816）で書き出す
2. 1200×800 にリサイズして webp にする

   ```bash
   npx sharp-cli -i 元.png -o public/guide/hr.webp resize 1200 800 --fit cover
   ```

   （`scripts/optimize-images.mjs` を使ってもよい）
3. `public/guide/<slug>.webp` に置く。ファイル名がスラッグと一致していないと出ません
4. `npm run build` が通るのを確認してコミット

画像の参照は `src/app/guide/[slug]/page.tsx` ・ `src/app/guide/page.tsx` ・
`src/app/page.tsx` の3か所にありますが、いずれも `/guide/${g.slug}.webp` と
組み立てているだけなので、**コードを触る必要はありません**。
