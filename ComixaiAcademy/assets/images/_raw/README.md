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

**N10枚は完成。** 消失点を強く指示してからは、**10枚とも `horizon: 0.5` の
まま噛み合っている**（1枚も調整していない）。切り方もどれも「削らない」で済む。

| ファイル | テーマ | レア度 | 比率 | horizon |
|---|---|---|---|---|
| `classroom.jpg` | いつもの教室（初期所持） | N | 0.753 | 0.50 |
| `library.jpg` | 図書室の窓辺 | N | 0.753 | 0.50 |
| `corridor.jpg` | 放課後の廊下 | N | 0.753 | 0.50 |
| `computer-room.jpg` | コンピュータ室 | N | 0.753 | 0.50 |
| `home-desk.jpg` | 家のデスク | N | 0.753 | 0.50 |
| `courtyard.jpg` | 中庭のベンチ | N | 0.753 | 0.50 |
| `entrance-hall.jpg` | 昇降口 | N | 0.753 | 0.50 |
| `cafe.jpg` | カフェの窓際 | N | 0.753 | 0.50 |
| `meeting-room.jpg` | 会議室 | N | 0.753 | 0.50 |
| `rooftop-cloudy.jpg` | 屋上 | N | 0.753 | 0.50 |
| `sakura.jpg` | 桜並木 | R | 0.753 | 0.50 |

寸法の答え合わせ：黒板の下端が肩、ロッカーとフェンスが同じ背丈、
机とカウンターが腰、ホワイトボードが頭の高さ。どれも実物どおりに出ている。

`sakura.jpg` は絵の中で花びらが大量に舞っているので、
**アプリ側の `sakura` エフェクトは重ねない**（重ねるとフキダシが読めない）。

▍MJからは Upscale → Subtle をかけた大きいほうを落とす
2倍（1856x2464）になり、絵は変わらない。Creative のほうは細部を描き足すので
構図が変わる。**画面のプレビューを長押しで保存すると640pxしか取れない**ので、
必ずダウンロードから。

## 色を重ねるだけのテーマは全部引退させた

朝焼け・夕暮れ・雨・セピア・深夜・雪・星降る教室・黄金の教室は、舞台の絵が
1枚しか無かった頃に「教室に色を重ねる」だけで種類を増やしていたもの。
専用の絵を持つテーマがそろって役割がかぶったので外した（2026-08）。

**降りものとSRの光る枠の仕組みは残してある**（`components/stage-effect.tsx`）。
rain / snow / sakura / kira / ember と、金・シアンの縁飾り。
**SRの絵が描けたら、その絵を見てから合うものを乗せる**——先に決め打ちせず、
絵に合わせて選ぶ、という順番にした。

## これから描くもの

R7枚（夕焼けの屋上・雨のネオン街・夜のオフィス・朝の海辺・夏祭りの夜・
暖炉の山小屋。桜並木は完了）と、SR3枚（サーバーの聖堂・雲海の上の教室・
金インクの原稿の中）。プロンプトは会話ログのプロンプト集から。
