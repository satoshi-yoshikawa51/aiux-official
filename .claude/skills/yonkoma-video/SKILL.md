---
name: yonkoma-video
description: 入稿済みの手描き4コマ（public/yonkoma/）を、ページめくり演出つきの縦型ショート動画（1080×1920・約18秒・YouTube Shorts/TikTok/Reels/X共用）にするフロー。「4コマを動画にして」「ショートにして」「yonkoma:video」のほか、新しい4コマがpublic/yonkoma/に入稿されたのを見つけた時や、4コマの話題でSNS展開に触れられた時も、このスキルで動画化を提案・実行する。生成だけでなく検証（フレーム目視）と納品（mp4＋投稿文）までがワンセット。
---

# 4コマショート動画の生成スキル

`scripts/yonkoma-video.mjs` を回して、入稿済み4コマから**カードめくり演出つきのショート動画**を作り、
検証して納品するまでの手順。生成はスクリプトが全部やる。人間（このスキルを読むClaude）の仕事は
**前提確認 → 実行 → フレーム目視での検証 → 納品**の4つ。

## 完成形の仕様（スクリプトが保証する。変えるときは下の「調整」へ）

- 1080×1920 / 30fps / H.264 / 約18秒 / めくりSE入り（BGMは任意）
- クリーム地＋トーンドット背景、赤mono kicker、黄マーカー見出し、フッターにCOMIXAIロゴ
- コマ（カード単体）が紙のカールで右から左へめくれて次のコマが現れる。めくり中だけ
  スピード線（手前濃いめ＋背景薄め の2層）
- 最後は4コマ目がめくれて**CTAカード**（ロゴ＋解説ページURL）が現れ、2.8秒表示
- 出力: `yonkoma-videos/<slug>.mp4` と `<slug>.txt`（タイトル・説明文・タグの下書き）

## 手順

### 1. 前提確認

- 対象の絵があるか: `public/yonkoma/<glossary|prompts>/<slug>.png`（一覧は `npm run yonkoma:list`）
- ffmpegがあるか: 無ければ `npm install --no-save ffmpeg-static`（package.jsonには入れない方針）
- 絵がまだ無いのに動画を頼まれたら、先に入稿が必要なことを伝える（docs/yonkoma.md参照）

### 2. 実行

```bash
npm run yonkoma:video -- <slug>
```

ログの「コマ検出: Nコマ」を確認する。**Nが実際のコマ数と違ったら検出ミス**（下の「うまくいかない時」へ）。
「コマの枠を検出できない → 全体スクロール構成にする」と出た場合も同様に判断する
（枠線の無い自由レイアウトの絵なら正常なフォールバック）。

### 3. 検証（省略しない）

生成のたびに、動画本体からフレームを切り出して目視する。過去の不具合は全部これで見つかった。

```bash
FF=node_modules/ffmpeg-static/ffmpeg   # PATHにあるならffmpegでよい
$FF -i yonkoma-videos/<slug>.mp4 2>&1 | grep Duration   # 設計値（コマ数×3.2+めくり×0.53+2.8）と一致するか
$FF -y -ss <めくり中間> -i yonkoma-videos/<slug>.mp4 -frames:v 1 /tmp/chk1.png   # めくりの絵
$FF -y -sseof -0.5 -i yonkoma-videos/<slug>.mp4 -frames:v 1 /tmp/chk2.png       # 最終フレーム
```

チェック観点:
- めくり中間: 紙が曲がってめくれ、折り目の右から次のコマが見えているか。縞ノイズが出ていないか
- 最終フレーム: **CTAカードだけが表示され、めくった紙の残骸が画面に残っていないか**
- 静止→めくりの継ぎ目で絵が飛んでいないか（怪しければ `--keep` で中間PNGを直接見る）

### 4. 納品

- mp4を`SendUserFile`等でユーザーに渡す（リポジトリにはコミットしない。yonkoma-videos/はgitignore済み）
- `<slug>.txt` の投稿文（タイトル・説明・タグ・遷移先URL）を添える
- 同じmp4を YouTube Shorts / TikTok / Reels / X に使い回せることを伝える

## うまくいかない時

| 症状 | 対処 |
|---|---|
| コマ検出数が違う／検出できない | 絵の隣に `<slug>.panels.json` を置いて座標指定: `[{"top":120,"bottom":640},…]`（元画像のピクセル座標）。ベタ背景の黒帯を枠と誤認するケースは閾値でなくこの手で直す |
| ffmpegが無い | `npm install --no-save ffmpeg-static` |
| 描画が崩れた・原因を見たい | `node --experimental-strip-types scripts/yonkoma-video.mjs <slug> --keep` で中間フレーム（フレームPNG・めくりコマ送り）が/tmpに残る |
| 音を足したい | 権利クリアな音源を `scripts/yonkoma-bgm.mp3` に置くと小音量で自動ミックス |

## 調整ノブ（スクリプト内の定数）

| 何を変えたい | どこ |
|---|---|
| コマの表示時間 | `PANEL_SEC`（3.2秒） |
| めくりの速さ | `FLIP_FRAMES`（16コマ≒0.53秒。速く=12） |
| 紙の硬さ（カールの半径） | `setProgress`内の `R = max(90, W*0.13)`。小さいほど柔らかい |
| めくりの滑らかさ | `FLIP_STRIPS`（27。短冊の数） |
| スピード線の濃さ・本数 | `addLine`呼び出し（手前8本 op0.45 / 背景12本 op0.3） |
| 色・書体 | `FRAME_BASE`。**globals.cssのトークンと揃えること** |

## 実装をいじるときの罠（スクリプトのコメントにも書いてある）

- `backface-visibility`は**子要素に継承されない**。面を裏返すなら中のimg等にも指定する
- PNG入力の既定タイムスタンプは**25fps**。loopフィルタの後は `setpts=N/30/TB` で打ち直さないと尺が伸びて末尾が切れる
- concatに入れる全枝で fps / settb / setsar / format を揃える（揃わないとxfade/concatが落ちる）
- setContentしたページからは `file://` の画像が読めない。**画像は常にdata URLで渡す**
- めくりの走り幅は「カードの左端」でなく**画面の左外**まで。カードは画面より狭いので、途中で止めると紙の束が画面に残る
