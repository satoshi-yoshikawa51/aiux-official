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

**20枚ぜんぶ完成**（N10 / R7 / SR3）。

| ファイル | テーマ | レア度 |
|---|---|---|
| `classroom.jpg` | いつもの教室（初期所持） | N |
| `library.jpg` | 図書室の窓辺 | N |
| `corridor.jpg` | 放課後の廊下 | N |
| `computer-room.jpg` | コンピュータ室 | N |
| `home-desk.jpg` | 家のデスク | N |
| `courtyard.jpg` | 中庭のベンチ | N |
| `entrance-hall.jpg` | 昇降口 | N |
| `cafe.jpg` | カフェの窓際 | N |
| `meeting-room.jpg` | 会議室 | N |
| `rooftop-cloudy.jpg` | 屋上 | N |
| `sakura.jpg` | 桜並木 | R |
| `beach-dawn.jpg` | 朝の海辺 | R |
| `neon-rain.jpg` | 雨のネオン街 | R |
| `festival-night.jpg` | 夏祭りの夜 | R |
| `office-night.jpg` | 夜のオフィス | R |
| `cabin-fire.jpg` | 暖炉の山小屋 | R |
| `rooftop-sunset.jpg` | 夕焼けの屋上 | R |
| `datacenter.jpg` | サーバーの聖堂 | SR |
| `above-clouds.jpg` | 雲海の上の教室 | SR |
| `gold-ink.jpg` | 金インクの原稿の中 | SR |

比率はすべて 0.753（`--ar 3:4` のまま、削らない）。
**地平線は全部 0.5 に固定**していて、絵ごとの数字は持たせていない。

▍いちど絵ごとに読んだが、やめた
Rは絵ごとに地平線が違った（海辺0.47〜夕焼けの屋上0.63）。屋外や光が主役の
絵は空を広く取るぶん地平線が下がるためで、厳密にはそのほうが縮尺は正しい。
ただ**舞台を変えるたびに先生の背丈が変わる**ことになり、それ自体が違和感に
なった。同じ人が同じ背丈で立っているほうが、縮尺の小さなズレより大事。
どうしても合わない絵が出てきたときだけ `horizon` を書いて逃がす。

▍暗い舞台はキャラが沈みやすい
夜のオフィス・雨のネオン街・暖炉の山小屋・夏祭りの夜は地が暗い。
先生は黒スーツなので、**立ち位置の明るさだけは残す**こと（絵の側で
中央下を中間トーンに保つ）。いまの7枚はぎりぎり成立している。

▍MJからは Upscale → Subtle をかけた大きいほうを落とす
2倍（1856x2464）になり、絵は変わらない。Creative のほうは細部を描き足すので
構図が変わる。**画面のプレビューを長押しで保存すると640pxしか取れない**ので、
必ずダウンロードから。

## 飾り（パーティクル）はSRだけ

NとRは絵だけで見せる。**SRの3枚にだけ**粒と光る枠を乗せている
（`components/stage-effect.tsx`）。

| 舞台 | 飾り | 枠 |
|---|---|---|
| サーバーの聖堂 | `motes`（青い光の粒。霧に浮かぶ） | シアン |
| 雲海の上の教室 | `kira`（金のきらめき） | 金 |
| 金インクの原稿の中 | **`kinpaku`（薄片・箔・きらめきの3種混合）** | 金 |

**豪華さは「粒の種類」で出している。** ホームは常駐画面なのでループアニメは
置けない（電池を食い続ける）。動かせないぶん、1粒あたりの作り込みで差をつける。
金箔だけは3種を混ぜていて、これがいちばん豪華な飾り＝目玉の1枚用。

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
