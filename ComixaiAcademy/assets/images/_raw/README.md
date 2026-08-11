Midjourneyで描いた元画像の置き場。
ここに置いて `npm run stage:prepare -- assets/images/_raw/<名前>` を走らせると、
下を削って影を焼き込んだ舞台の絵ができる。

元画像もリポジトリに入れておく（描き直さずに削る量を変えられるように）。

**ファイル名がそのまま舞台テーマのIDになる。** 増やすときは
`src/data/gacha.ts` の THEMES と揃えること。

## 舞台20枚の計画

N10 / R7 / SR3 で、**レア度＝光の量**にしてある。
N は曇り・蛍光灯・低彩度でわざと地味に、R は夕日や炎など光そのものが主役、
SR は光条・鏡面・金。プロンプト全文と `--stylize` の使い分けは
会話ログのプロンプト集を参照。

どのプロンプトにも次の4つは必ず入れる：

- **遠近の指定を、頭・お尻・`--no` の3か所に**。いちばん大事なので、下の
  「▍地平線を画面の中央に」を読むこと
- `--no people, characters` — 外すと必ず人が立ち、キャラの立ち位置が埋まる
- `camera at standing eye level 160cm above the floor, lens axis perfectly level`
  — 無いと俯瞰になり、キャラが床にめり込む
- `wide open ... in the centre foreground` — 中央に木や柱が来ると、
  キャラの頭から生える

## ▍地平線を画面の中央に

**地平線（床の消失点）はカメラの高さにある。だからそこに立つ人の目線は、
必ず地平線と重なる。** ズレたぶんがそのまま「巨人」「小人」として出る。

最初に描いた2枚は地平線が中央より下（0.53）にあり、キャラをコマいっぱいに
立てると目線が地平線のはるか上に来て、**巨人に見えた**。背景を拡大して詰めようと
すると計算上2.4倍要って、そこまで寄せるとベンチも木も空も画面から消える
（実際に試した）。

いまは**絵の地平線の位置をアプリに渡し、そこにキャラの目線が乗る大きさで
キャラを描いている**（`src/data/gacha.ts` の `horizon`）。消失点を画面の
ちょうど中央に置いて描けば、キャラはコマの57%ほどの高さで景色と噛み合う。

絵を足したら、地平線が絵の上から何割の位置にあるかを目で見て `horizon` に入れる
（床と壁の境目、平行線が集まる高さ）。中央に描けていれば 0.5。

▍MJに効かせる書き方
抽象的に `low horizon` と書いても効かない。**3か所で言う**：

1. **先頭**（場面の描写より前。MJは前のほうの語を強く見る）
   `one-point perspective, the horizon line runs exactly through the middle of
   the frame, the floor fills the entire lower half of the image and converges
   to a single vanishing point at the dead centre, camera at standing eye level
   160cm above the floor, lens axis perfectly level,`
2. **末尾で言い換えて繰り返す**
   `, symmetrical one-point perspective, vanishing point dead centre,
   horizon exactly halfway up the frame, ground plane occupying the entire lower half`
3. **逆の構図を禁じる**（黙っていると俯瞰にされる）
   `--no ... high angle, birds eye view, aerial view, top-down view,
   looking down, tilted camera, dutch angle, low angle`

それでも**1発では出ない**。中央から大きくずれた絵は没にして回し直すこと。

## 描けているもの

| ファイル | テーマ | レア度 | 大きさ |
|---|---|---|---|
| `courtyard.jpg` | 中庭のベンチ | N | 1856x2464 |
| `sakura.jpg` | 桜並木 | R | 1856x2464 |

どちらも `--ar 3:4`（0.753）。下を16%削ると **0.897** になり、目標の0.8を超える。

`sakura.jpg` は絵の中で花びらが大量に舞っているので、
**アプリ側の `sakura` エフェクトは重ねない**（重ねるとフキダシが読めない）。

▍MJからは Upscale → Subtle をかけた大きいほうを落とす
2倍（1856x2464）になり、絵は変わらない。Creative のほうは細部を描き足すので
構図が変わる。**画面のプレビューを長押しで保存すると640pxしか取れない**ので、
必ずダウンロードから。表示時は幅1200px前後まで拡大されるので、928pxだと足りない。

## classroom-wide.png（暫定）

`classroom.png` の左右を端の画素で伸ばして横に広げたもの（+126px ずつ）。
**描き直したものではない。**

縦長の絵は狭い端末で大きく拡大され、教室が実物より大きく写って
キャラが小人に見える（→ README の「アバターが立つ背景（舞台）」）。
横に広げると拡大率が下がるので、その場しのぎとして作った。
ぼかしが強い絵なので、伸ばした端は見て分からない。

**本番はMJで引きの構図を描き直すこと**（`--ar 3:4` あたり、
窓と黒板が画面の一部に収まる引き）。描けたらこのファイルは消してよい。
