---
name: short-video
description: COMIXAIのYouTubeショート動画を作る2段階フロー。①お題からシナリオ（5カット構成・テロップ）とMidjourney用素材プロンプトを提案 → ②ユーザーが生成した画像/動画クリップを受け取ったら、ffmpegで完成動画（1080x1920・約23秒・テロップ/クロスフェード/プログレスバー入り）まで組み立てる。「ショート動画作りたい」「ショートのシナリオ出して」「素材できたから動画にして」で発動。
---

# COMIXAI ショート動画制作スキル

過去に short1（AI冬の時代）/ short2（100万トークン）/ short3（AI用語クイズ）で確立した制作フローの再現手順。
**2つのフェーズがあり、ユーザーの状況で判断する**：素材がまだ→フェーズ1、素材を受け取った→フェーズ2。

## 完成形の仕様（変えない）

- 1080×1920（9:16）/ 30fps / H.264 / 約23秒 / 音声なし（BGMはユーザーがYouTubeアプリ側で付ける。無料）
- **5カット × 5.0秒、クロスフェード0.45秒**（合計 5×5.0 − 4×0.45 = 23.2秒）
- テロップはASS字幕（アニメーション付き）、下端に黄色のプログレスバー
- 完成ファイルはSendUserFileで納品し、投稿手順（タイトル・説明文・ハッシュタグ案）を添える

## フェーズ1: シナリオ＋素材プロンプト提案

お題（サイトのコンテンツ、AIの雑学など）を受けたら、以下をセットで出す。

### シナリオ表（5カット）

| カット | 秒数 | 役割 | テロップ | 映像イメージ |
の形式で提案する。役割は基本この型：
1. **フック**（0-4.7s）: 数字・意外性で1秒目に掴む。例「9割が間違う」「AIは2回死にかけた」
2. **展開**: フックの中身を1つだけ
3. **転**: 意外な事実・ひっくり返し
4. **オチ/学び**: 一言で刺さるまとめ
5. **CTA**: 「comixai.dev」+「↑プロフィールから」の定型

テロップ原則:
- 1画面あたり最大2行×15字程度。上部（y≈400-600）と下部（y≈1400-1600）に分けて中央は映像を見せる
- 強調ワードだけ黄色（1カットに1箇所）
- **規制されそうな語を避ける**（過去に「死にかけてた」→「消えかけてます」に変更した実績。死ぬ/殺す/ヤバイ等はタイトル・テロップとも言い換える）
- 絵文字はNoto Sans CJKに無いものが豆腐になる（⏳で事故った）。使うなら「…」「↑」など文字で代替

### Midjourney素材プロンプト（5本）

- カットごとに1本、**全カット別の画像**（同じ素材の使い回しは飽きられる）
- 末尾共通: `--ar 9:16 --no text, letters, words, alphabet, typography, signs, watermark`（16:9等で来ても後段のblur-padで救えるので9:16が理想、程度）
- キャラを出すカットは「the mascot character 〜ing」で書き、orefはユーザーが付ける
- スタイル指定はサイトのトンマナ（soft 3D render / retro manga pop など、そのショートの題材に合わせて統一）
- 静止画でも動画（MJのアニメーション5.2秒クリップ）でもOKと伝える。**動画のほうがリッチ**

## フェーズ2: 素材を受け取ったら組み立て

素材は `/root/.claude/uploads/<セッションID>/` に届く（インラインの画像はtranscript jsonlからbase64抽出）。
作業ディレクトリはスクラッチパッドの `shorts/` を使う。

### 0. 環境準備

```bash
which ffmpeg || (apt-get update && apt-get install -y ffmpeg fonts-noto-cjk)
ls /usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc  # フォント確認
```

### 1. 各カットを1080x1920・5.0秒に正規化

**重要: MJの動画クリップは5.2秒でループするので、必ず `-t 5.0` で切る**（ループの巻き戻りが見えると安っぽい）。

動画素材（blur-pad方式）:
```bash
ffmpeg -y -i in.mp4 -t 5.0 -filter_complex \
 "[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2[bg];[b]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" \
 -r 30 -an -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p seg_0.mp4
```

静止画素材（ゆっくりズームで動画化）:
```bash
ffmpeg -y -loop 1 -i in.png -t 5.0 -filter_complex \
 "[0:v]scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='1+0.0006*on':d=150:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30" \
 -an -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p seg_0.mp4
```

### 2. クロスフェード連結（ベース動画）

オフセットは累積で「カット長 − 0.45」ずつ: 4.55 / 9.10 / 13.65 / 18.20。

```bash
ffmpeg -y -i seg_0.mp4 -i seg_1.mp4 -i seg_2.mp4 -i seg_3.mp4 -i seg_4.mp4 -filter_complex \
 "[0:v][1:v]xfade=transition=fade:duration=0.45:offset=4.55[v1];\
  [v1][2:v]xfade=transition=fade:duration=0.45:offset=9.10[v2];\
  [v2][3:v]xfade=transition=fade:duration=0.45:offset=13.65[v3];\
  [v3][4:v]xfade=transition=fade:duration=0.45:offset=18.20[v4]" \
 -map "[v4]" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p base.mp4
```

### 3. ASS字幕を書く

`examples/short3-quiz.ass` が**完成品の実例**（スタイル定義・アニメタグの正解がすべて入っている）。これを複製してDialogue行だけ差し替えるのが確実。

要点:
- `PlayResX: 1080 / PlayResY: 1920 / ScaledBorderAndShadow: yes`
- フォントは `Noto Sans CJK JP`。BorderStyle=1（縁取り+影。黒帯ボックスは使わない）
- ポップ登場: `{\an5\pos(540,Y)\fscx72\fscy72\t(0,170,\fscx108\fscy108)\t(170,330,\fscx100\fscy100)\fad(110,160)}`
- 下からスッと: `{\an5\move(540,Y+55,540,Y,0,300)\fad(160,160)}`
- 黄色強調: `{\1c&H3FD2FF&}`（ASSはBGR。これで #FFD23F）
- タイミングはカット境界に合わせる（カットNは (N-1)×4.55 〜 N×4.55+0.45 に表示。境界の0.15s前に消すと transitions がきれい）
- 2行出すときは2行目の開始を0.3〜0.9秒遅らせるとリズムが出る

### 4. 字幕焼き込み＋プログレスバー

```bash
ffmpeg -y -i base.mp4 -filter_complex \
 "[0:v]ass=short.ass:fontsdir=/usr/share/fonts/opentype/noto[sub];\
  color=c=0xFFD23F:s=1080x14:d=23.2[bar];\
  [sub][bar]overlay=x='-1080+1080*(t/23.2)':y=1906:shortest=1" \
 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p short-final.mp4
```

### 5. セルフQC（必須）

フレームを抜いて **必ず目視確認** してから納品する:
```bash
for t in 1.5 5.5 10.5 15.5 21.0; do ffmpeg -y -ss $t -i short-final.mp4 -vframes 1 qc_$t.png; done
```
チェック項目: テロップが読める / 豆腐なし / 黄色強調が意図の語に付いている / カット切替がループ巻き戻り前に来ている / バーが右へ進んでいる / 最後がCTA。

### 6. 納品

- `SendUserFile` で mp4 を送る
- 投稿ガイドを添える: タイトル案（規制ワード回避済み）・説明文・ハッシュタグ（#AI #ChatGPT #AI初心者 など3-5個）・「BGMはYouTubeアプリの投稿画面で追加（無料）」・「リンクはプロフィールに設置済みのcomixai.devへ誘導」

## 過去のハマりどころ（再発防止）

- MJクリップは**5.2秒ループ**。5.0秒で切らないと巻き戻りが見える
- 絵文字の豆腐（⏳など）。Noto Sans CJKに無い絵文字は使わない
- ASSの色はBGR順（`&H3FD2FF&`=黄色 #FFD23F）
- タイトルの規制ワード（「死にかけてた」→「消えかけてます」に変えた）
- 各カットに同じ素材を使い回すと単調。5カット全部違う絵にする
- ffmpeg/フォントはコンテナごとに入れ直しが必要（手順0を忘れない）
