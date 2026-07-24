# 同梱フォントについて

このフォルダのTTFは、いずれもオープンライセンスの書体を
`tools/subset-fonts.mjs` で**サブセット化**したものです（合計10.2MB → 2.1MB）。
サイト本体（comixai.dev）と同じ書体を使っています。

| ファイル | 書体 | ライセンス |
| --- | --- | --- |
| ZenKakuGothicNew-Regular / Bold / Black | [Zen Kaku Gothic New](https://fonts.google.com/specimen/Zen+Kaku+Gothic+New) | SIL Open Font License 1.1 |
| YuseiMagic-Regular | [Yusei Magic](https://fonts.google.com/specimen/Yusei+Magic) | SIL Open Font License 1.1 |
| JetBrainsMono-Bold | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | SIL Open Font License 1.1 |

OFL はサブセット化・再配布を認めています（フォント名を変えずに配布可）。

## 収録している文字

「アプリのソースに出てくる全文字」＋「サイト本体のソースに出てくる全文字」＋
ひらがな・カタカナ・英数記号・約物の全域で、いまは 2,088 文字です。

**レッスンを増やして「□」（豆腐）が出たら、サブセットを作り直してください。**

```bash
npm run fonts:subset
```

元のフルセットTTF（`_raw/`、gitignore対象）が無ければ、Google Fonts から自動で取り直します。
