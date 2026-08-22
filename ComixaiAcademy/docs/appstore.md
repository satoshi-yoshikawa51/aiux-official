# App Store 提出物（下書き）

App Store Connect の入力欄にそのまま貼れる形でまとめてある。
文字数制限がある欄は、制限内に収めた値を用意した。
**アプリの実装が変わったら、ここも合わせて直すこと**（とくに本数・体数の数字）。

## 基本情報

| 欄 | 値 |
| --- | --- |
| アプリ名（30字まで） | COMIXAI アカデミー |
| サブタイトル（30字まで） | 3Dの相棒と、遊んで学ぶ生成AI |
| プライマリカテゴリ | 教育 |
| セカンダリカテゴリ | 仕事効率化 |
| 価格 | 無料（App内課金なし） |
| 年齢制限 | 4+（該当項目すべて「なし」で申告） |
| Bundle ID | dev.comixai.academy |

## プロモーションテキスト（170字まで・審査なしで随時変更可）

> 3Dの相棒といっしょに、1日5分で生成AIのきほんが身につく学習アプリ。17本のレッスン、9種のミニゲーム、AIによるプロンプト添削。登録不要・無料・広告なし。

## 説明文（4000字まで・**このまま貼る**。App Store Connect は装飾記法を解釈しないので、
下の本文には太字の記号を入れていない）

> AIって、けっきょく何ができて、何がダメなの？
> COMIXAI アカデミーは、その疑問に「読む」ではなく「遊ぶ」で答える学習アプリです。3Dの相棒キャラクターがあなたの先生になって、生成AIのきほんから実務での使い方までを1日5分ペースで案内します。
>
> ■ 5つのコース・全17レッスン
> ・AIのきほん — トークン、LLM、ハルシネーション。仕組みを体感で
> ・最初の一週間 — 明日から仕事でAIを使い始める手順
> ・プロンプト道場 — 指示の書き方を、書いて・添削されて覚える
> ・事故らないAI — 機密・著作権・誤情報。やらかす前に知る
> ・これからのAI — エージェント、マルチモーダル、この先の話
>
> ■ 読むだけでは終わらせない
> レッスンの途中に9種類のミニゲームが待っています。文章がトークンに割れる様子をその場で確かめたり、あふれる指示を予算内に収めたり、ダメなプロンプトを削って鍛えたり。章の終わりには修了試験。全問クリアで花火が上がります。
>
> ■ AIがあなたのプロンプトを添削
> プロンプト道場では、書いた指示文を実際にAIが実行し、「どこが良いか・何を足すと変わるか」まで添削して返します。
>
> ■ まちがえた問題は、そのままにしない
> まちがえた問題だけを集めて出し直す復習のしくみ入り。もう一度正解できたら卒業です。
>
> ■ 続けたくなる仕掛け
> ・学習でガチャPがたまり、新しい相棒や舞台が当たるガチャ
> ・当てた景品にはそれぞれ専用のおまけゲームつき
> ・バッジ25種と、AI見習い→AIマスターの称号ランク
> ・あなたの職種（営業・企画・エンジニアなど）を選ぶと、例文がその仕事向けに差し替わる
>
> ■ 安心して使えます
> ・登録不要。ひらいた瞬間から始められます
> ・広告なし・課金なし・完全無料
> ・学習の記録は端末の中だけ。アカウントも個人情報も要りません
>
> 通勤の5分で、AIと働く自分に追いつく。まずは相棒えらびから。

## キーワード（100字まで・カンマ区切り）

> 生成AI,AI学習,プロンプト,ChatGPT,Claude,AIリテラシー,LLM,研修,クイズ,社会人,勉強,入門

（「AI」「アプリ」「無料」はアプリ名や全アプリ共通語なので入れない。48字なので追加余地あり）

## URL

| 欄 | 値 |
| --- | --- |
| サポートURL | https://comixai.dev/academy/support |
| プライバシーポリシーURL | https://comixai.dev/academy/privacy |
| マーケティングURL（任意） | https://comixai.dev |

## App Privacy（プライバシーの回答）

**「データは収集されません」で申告する。** 根拠：

- アカウント・ログインなし。進捗と設定はすべて端末内（AsyncStorage）
- 分析SDK・広告SDK・トラッキングは一切入れていない
- プロンプト道場の採点だけは、書いた文章とお題ID（exerciseId）を
  運営サーバー（comixai.dev/api/academy/grade）へ送るが、**採点を返すためだけに
  処理して保存しない**（Appleの定義では「リクエストの処理に必要な期間を超えて
  保持しないデータ」は“収集”に当たらない）。Anthropic APIの入力も既定で
  モデル学習には使われない
- この設計を変える（ログを残す・分析を入れる）なら、申告も直すこと

## 審査員向けメモ（App Review Information の Notes）

> このアプリにログイン機能はありません。起動してすぐ全機能をお試しいただけます。
> 「プロンプト道場」コース内のAI添削機能は、入力されたテキストを当社サーバー
> （https://comixai.dev）経由でAnthropic社のClaude APIに送信して採点結果を
> 返すものです。テキストはサーバーに保存されません。サーバーに接続できない
> 場合はオフラインの簡易採点に自動で切り替わり、学習は継続できます。
> ガチャ機能はアプリ内で獲得するポイントのみで回すもので、課金要素は
> 一切ありません（ルートボックス規約の対象外）。ガチャの提供割合は
> アプリ内「提供割合をみる」に表示しています。

## スクリーンショット

`docs/screenshots/` に3サイズ×5枚を生成済み（作り方は下）。App Store Connect の
枠に合わせて選ぶ：

| ファイル名 | 実寸 | 入れる枠 |
| --- | --- | --- |
| `iphone65-*` | 1284×2778 | iPhone 6.5インチ |
| `iphone69-*` | 1290×2796 | iPhone 6.9/6.7インチ |
| `ipad13-*` | 2048×2732 | iPad 13インチ |

**iPadぶんは必須**（`app.json` の `supportsTablet: true` ＝ iPadでも配信するため）。

5枚の並び：①ホーム（相棒と舞台）②トークナイザーで遊んでいるところ
③レッスン本文（コピペ用プロンプト）④ガチャ ⑤バッジ・称号

**2枚目は「遊んでいる画面」にする。** レッスンの幕（タイトルカード）で撮ると
絵として静かで、何をするアプリなのかが伝わらない。文字がチップに割れて
トークン数が出ている画面は、このアプリ固有で、説明文の「体感で学ぶ」とも噛み合う。
入れる文は**画面の幅で変える**——iPadは横に広く、短い文だとチップが1行で終わって
下が空くので、長めの文にしてある。

作り直すときは `dist` を静的配信して Playwright で撮る（→ README の検証のやり方）。
シードは「4日連続・6/17本・バッジ8個・舞台は桜並木」にしてある——**まっさらな
記録だと画面がさびしく、進みすぎだと初見の人に響かない**ので、その中間を狙う。

## 提出前の最終チェック（アプリ側）

- [x] 設定の「確認用」（DevFill・3D診断・20枚ぜんぶ見る）を外した（#170）
- [x] `app.json` の `version` を確認（1.0.0）
- [x] 権利の棚卸し完了（BGM=DOVA・Tripo/Midjourney=有料プラン → docs/licenses.md）
- [ ] プライバシーポリシー/サポートページがサイトに公開済みであること

## Guideline 2.1（新規アプリの追加情報）への回答

初回提出で必ず来る定型の質問。**次回からはメモ欄に最初から書いておく**（Appleも
そう案内している）。以下がそのまま貼れる回答。英語で返す——審査は英語で読まれる。

### 回答本文（Notes欄 / 返信にそのまま貼る）

**App Reviewの返信欄は4000字までしか入らない。** 下は3,722字に詰めた版で、
これがそのまま送れる（長い版を書くと送信ボタンで弾かれる）。

```
Thank you for the review. Here is the requested information.

1. Screen recording: attached. Recorded on iPhone 16 Pro Max from app launch, covering onboarding, a lesson with a mini-game and quiz, the AI prompt critique, the gacha, badges and settings. The app has no account registration, no login, no account deletion, no paid content, no user-generated content shared between users, and it requests no permissions (no location, contacts, camera, photos, microphone, or App Tracking Transparency prompts).

2. Devices and OS tested
iPhone 16 Pro Max (iOS <VERSION>), physical device, via TestFlight. Layouts for iPhone SE (375x667 pt), iPhone 16 Pro Max (430x932 pt) and iPad (1024x1366 pt) were also verified by running the same UI code at those dimensions.

3. Functions and target audience
COMIXAI Academy teaches generative-AI literacy to Japanese-speaking working adults who are new to AI. Problem: many office workers have heard of ChatGPT or Claude but do not know what these tools can and cannot do, or how to write an effective prompt; reading a manual rarely makes it stick. Value: 17 short lessons (about 5 minutes each) in 5 courses, guided by a 3D character companion. Each lesson mixes explanation cards, one of 9 kinds of interactive mini-games, and a 3-question quiz; wrong answers are asked again later. One exercise lets the user write a prompt and receive an AI critique of it. No prior knowledge required, rated 4+, free, no ads, no in-app purchases, no subscriptions.

4. Setup and access
No account, login, credentials or sample files are required; all features are available immediately after installing. First launch: opening scene, choose a companion character, choose a job role, a 6-step tutorial, then Home. Lessons start from the red button on Home (Lesson 1 contains the tokenizer mini-game and a quiz, about 3 minutes). The AI prompt critique is in the "プロンプト道場" course on the second tab. The gacha reward feature is the capsule-machine icon at the lower left of the Home panel. Badges are on the third tab, settings on the fourth. Content unlocks in order as lessons are completed; nothing is locked behind a purchase, a region or an account.

5. External services
Our own server, https://comixai.dev, provides two endpoints: /api/tokenize counts tokens for the tokenizer mini-game, and /api/academy/grade powers the prompt critique by forwarding the user's practice prompt to Anthropic's Claude API and returning the feedback. In both cases the submitted text is processed to produce the response and is not stored on our server. The app contains no analytics SDK, no advertising SDK, no third-party sign-in, no payment processing and no tracking. If the device is offline or the server is unreachable, both features fall back automatically and the rest of the app keeps working.

6. Regional differences
None. Identical features and content in every region. The app is Japanese-only and free everywhere, with no geo-gating, no region-specific content and no regional pricing.

7. Regulated industry and third-party material
The app is general education and is not in a regulated industry. Bundled third-party material and our rights: 3 background music tracks from DOVA-SYNDROME, whose terms permit commercial use and inclusion in applications; 12 3D avatar models generated with Tripo on a paid plan, where generated assets belong to the user and may be used commercially; 10 stage background images generated with Midjourney on a paid plan, commercial use permitted under section 4 of their Terms of Service; and three fonts (Zen Kaku Gothic New, Yusei Magic, JetBrains Mono) from Google Fonts under the SIL Open Font License 1.1. No other protected third-party material is included.
```

### 画面収録の撮り方（実機・最新OS・起動から）

**先に設定→記録→「記録をぜんぶ消す」でまっさらにしてから撮る**（Appleは
「起動から通常の利用の流れ」を求めるので、オンボーディングから写っているのが強い）。

1. ホーム画面のアイコンをタップして起動（**アイコンを押すところから**録る）
2. オープニング → 相棒えらび → 職種えらび → 案内6歩（速めに送ってよい）
3. ホームで「はじめる」→ レッスンのカードを数枚 → **トークナイザーで文字を打つ**
   → クイズ1問 → 修了画面
4. ホームに戻ってガチャを1回まわす（**課金が無いことが分かる絵**）
5. 「まなぶ」→ プロンプト道場 → 指示文を書いて**AI添削が返るところ**
   （外部サービスを使う唯一の機能なので、ここは必ず入れる）
6. 「バッジ」→「設定」（ログイン欄が無いこと・記録が端末内であることが見える）

3〜4分に収める。iPhoneの画面収録（コントロールセンター）でよい。
撮れたら App Store Connect の App Review ページで返信に添付する。
