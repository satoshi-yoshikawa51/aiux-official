# 同梱アセットの権利まわり（公開前の棚卸し）

ストアに出す＝**再配布**なので、アプリに同梱しているものを全部並べて、
出どころとライセンスを確認した。**全項目、確認済み**（2026-08-19、吉川さんに確認）。

| もの | 出どころ | ライセンス | 備考 |
| --- | --- | --- | --- |
| フォント3書体（Zen Kaku Gothic New / Yusei Magic / JetBrains Mono） | Google Fonts | SIL OFL 1.1 | サブセット再配布可。詳細は `assets/fonts/README.md` |
| 効果音 11種（`assets/sounds/*.wav`） | 自前合成（`tools/build-sounds.mjs`） | 自作 | 素材サイトから拾っていない |
| BGM 3曲（`assets/music/*.mp3`） | DOVA-SYNDROME | DOVA-SYNDROME利用規約 | 商用利用可・アプリ組み込み可・クレジット表記は任意。音楽ファイル単体での再配布は不可だが、アプリ同梱はこれに当たらない |
| 3Dアバター 12体（`assets/models/*.glb`） | Tripo（**有料プラン**で生成） | 生成物はユーザー帰属・商用利用可 | 無料枠だと条件が違うが、有料プランなので問題なし |
| 舞台背景 10枚（`assets/stages/`） | Midjourney（**有料プラン**で生成） | 商用利用可（規約 4. Copyright and Trademark） | |
| アプリアイコン・スプラッシュ | 自作（`tools/build-app-icon.mjs`） | 自作 | |
| UIアイコン（`src/components/icon-paths.ts`） | 自作SVGパス | 自作 | Phosphor等の流用ではない |
| 4コマ・絵巻（`assets/images/emaki/`） | 吉川さんの手描き（サイトから同期） | 自作 | |
| npm依存（three, gpt-tokenizer ほか） | npm | MIT等 | コードのライセンスで、アプリ同梱に支障なし |

## メモ

- クレジット表記が必須のものは無い。任意で載せるなら、置き場は
  「設定画面の一番下」か「/academy/support のページ末尾」のどちらかに揃える
- **BGMを追加・差し替えるときは、その曲もDOVAか、規約を確認してからにする**
- BGMの曲ページURLは控えを残しておくと安心（DOVAは曲ごとのページがある）。
  分かったらこの下に追記する
