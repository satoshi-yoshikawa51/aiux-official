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

### 既存4枚の絵柄（そろえる先）

`sales` / `marketing` / `office` / `creator` を見て割り出した共通点です。

- **全身ではなく上半身**。キャラクターが画面の半分以上を占める大きさ
- 頭が大きめ、目が大きい、3Dレンダリングのやわらかい造形
- カメラ目線・ひかえめな笑顔
- 背景は**その職種の職場**（事務なら書類棚とプリンタ、創作ならアトリエ）を
  **強くぼかす**。被写界深度が浅く、玉ボケが出ている
- 明るく、彩度は低め。白〜薄いグレーの壁
- 手に職種がわかる小道具を1つ持たせている

**「全身」「centered, standing full body」と書くと引きすぎた絵になり、
既存4枚と並べたときに1枚だけ小さく見えます。**

### いちばん確実に揃える方法

既存の1枚をスタイル参照に渡すこと。プロンプトの末尾に足します。

```
--sref https://comixai.dev/guide/office.webp
```

文章だけで揃えるより、これが一段効きます。

### 男女のバランス

既存4枚は **営業だけが男性**で、マーケ・事務・創作は女性です。9枚を並べたときに
偏らないよう、新しい5職種は **人事・CSが女性、企画・経営・情シスが男性**にしてあります。
これで 4対5。プロンプトの冒頭で指定しているので、外すと女性に寄ります。

### 年齢

既存4枚はいずれも若手です。**経営者・個人事業主だけは40代後半**にしてあります。
「自分で決めて、自分で責任を取る人」なので、若く描くと絵と中身が噛み合いません
（ガイドの本文も、人を雇う前にルールを作る・月いくらまでを決める、という話です）。
`young` と書かないだけでは若く出るので、年代を明示しています。

### コピペ用（5職種ぶん、そのまま貼れる）

#### hr — 人事・採用

```
A young Japanese woman working in HR, character holding a small stack of resumes and a clipboard, an ID badge on a lanyard around the neck, a meeting room with chairs and a whiteboard softly blurred behind, cute 3D animated character, Pixar-like stylized render, oversized expressive eyes, soft rounded shapes, slightly large head, waist-up shot, character large in the frame, looking at the camera with a gentle friendly smile, shallow depth of field with soft bokeh, bright airy lighting, clean desaturated pastel palette, white and light grey walls, high detail --ar 3:2 --style raw --v 7
```

#### support — サポート・CS

```
A young Japanese woman working in customer support, character wearing a headset with a slim microphone, one hand raised in a small reassuring wave, a desk with a laptop and a mug softly blurred behind, cute 3D animated character, Pixar-like stylized render, oversized expressive eyes, soft rounded shapes, slightly large head, waist-up shot, character large in the frame, looking at the camera with a gentle friendly smile, shallow depth of field with soft bokeh, bright airy lighting, clean desaturated pastel palette, white and light grey walls, high detail --ar 3:2 --style raw --v 7
```

#### planner — 企画・PM

```
A young Japanese man working as a project manager, character holding a marker pen, a whiteboard covered with colorful sticky notes softly blurred behind, cute 3D animated character, Pixar-like stylized render, oversized expressive eyes, soft rounded shapes, slightly large head, waist-up shot, character large in the frame, looking at the camera with a gentle friendly smile, shallow depth of field with soft bokeh, bright airy lighting, clean desaturated pastel palette, white and light grey walls, high detail --ar 3:2 --style raw --v 7
```

#### owner — 経営者・個人事業主

```
A Japanese man in his late 40s running his own small business, dependable and warm, short greying hair at the temples and light stubble, character wearing a simple apron over a shirt, holding a tablet and a small stack of invoices, a shop counter with a register and wooden shelves softly blurred behind, cute 3D animated character, Pixar-like stylized render, oversized expressive eyes, soft rounded shapes, slightly large head, waist-up shot, character large in the frame, looking at the camera with a gentle confident smile, shallow depth of field with soft bokeh, bright airy lighting, clean desaturated pastel palette, warm wood and light grey tones, high detail --ar 3:2 --style raw --v 7
```

#### it — 情シス・社内IT

```
A young Japanese man working as a corporate IT administrator, character holding an open laptop, a server rack with small blue status lights softly blurred behind, cute 3D animated character, Pixar-like stylized render, oversized expressive eyes, soft rounded shapes, slightly large head, waist-up shot, character large in the frame, looking at the camera with a calm reassuring smile, shallow depth of field with soft bokeh, bright airy lighting, clean desaturated pastel palette, white and light blue tones, high detail --ar 3:2 --style raw --v 7
```

### うまくいかないとき

| 症状 | 直し方 |
|---|---|
| キャラが小さい・引きすぎ | `waist-up shot, character large in the frame` を先頭寄りに移す |
| 背景がうるさい | `heavily blurred background` に強める |
| 絵柄が既存4枚と違う | `--sref https://comixai.dev/guide/office.webp` を足す |
| 顔が写実的すぎる | `oversized expressive eyes, slightly large head` を前に出す |
| 色が派手 | `desaturated` `muted colors` を足す |

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
