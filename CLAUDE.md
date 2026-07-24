# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このリポジトリについて

吉川聡史（COMIXAI）のオフィシャルサイト **https://comixai.dev**。Next.js 16（App Router）/ React 19 / TypeScript。Vercelにデプロイ。

コメント・コミットメッセージ・UI文言はすべて日本語。既存コードのトーンに合わせること。

## コマンド

```bash
npm run dev          # 開発サーバ（http://localhost:3000）
npm run build        # 本番ビルド ＝ 実質の型チェック／唯一の検証手段
npm run og:glossary  # OGP画像を一括生成（Playwright/Chromium を使用）
```

**テストもLintも設定されていない。** 変更の検証は `npm run build` が通ることで行う（`tsconfig` は `strict: true`）。

## アーキテクチャ

### ページの組み立てパターン

`src/app/<route>/page.tsx` は原則サーバーコンポーネントで、以下を担当する：

1. `export const metadata` — title / description / keywords / `alternates.canonical` / OpenGraph（`/og/...png` を指定）/ twitter card
2. `JSON_LD` 定数 — BreadcrumbList を含む構造化データを `<script type="application/ld+json">` で埋め込む
3. `<Nav home={false} />` → `<Breadcrumb trail={...} />` → 本文 → `<Footer />`
4. インタラクティブ部分は同ディレクトリの別ファイル（`game.tsx` / `browser.tsx` / `player.tsx` 等）に `"use client"` で切り出す

新規ページを足すときは既存ページ（`src/app/nou/page.tsx` などが素直な見本）をそのまま踏襲する。

### 見た目のシステム

- **CSSフレームワークは使っていない。** `src/app/globals.css` の `:root` に約80個のデザイントークン（`--ink-900` `--paper-50` `--red-500` `--radius-sm` `--shadow-pop-sm` など）を定義し、コンポーネントは**インラインstyleから `var(--...)` を参照する**。色やサイズを直値でハードコードしない。
- `src/app/ds.tsx` — `"use client"` のデザインシステムprimitive（`Button` `Card` `Badge` 等）。「マンガのインク＋紙」がテーマで、太い黒枠＋ポップシャドウが基本。
- `src/app/site-chrome.tsx` — `Nav` / `Footer` / `PAGE`（`min(1080px, 92vw)` のページ幅定数）。ナビ項目の追加はここ1箇所。
- `src/app/site-ui.tsx` — `Breadcrumb` / `SectionHead` / `ShareRow` / `RelatedArticleCard` / `toneBg` などページ横断の部品。
- フォントとPhosphorアイコンは npm からセルフホスト（`layout.tsx` でimport）。**外部CDNを足さない**（LCP対策の意図的な設計）。

### コンテンツはTypeScriptで持つ

セクションごとに `data.ts` があり、型付き配列＋`getX(slug)` ヘルパ＋`X_UPDATED` 日付定数をエクスポートする。`[slug]/page.tsx` はそれを元に静的生成し、`sitemap.ts` が全 `data.ts` から `*_UPDATED` を読んで lastModified を組み立てる。

| 場所 | 中身 |
|---|---|
| `src/app/data.ts` | トップの記事／マガジン／SNS／Formspree宛先。README記載の「よくある編集」はここ |
| `glossary/data.ts` + `terms-wave2*.ts` | AI用語集150語（5,000行超。波ごとにファイル分割） |
| `prompts/data.ts` + `recipes-*.ts` | プロンプト集24レシピ |
| `works/data.ts` `guide/data.tsx` `faq/data.ts` `manga/data.ts` `calendar/events.ts` | 各セクションのコンテンツ |

**コンテンツを追加したら**：該当 `data.ts` → `*_UPDATED` 定数 → `sitemap.ts`（新セクションの場合）→ OGP画像（`npm run og:glossary`）の順で更新する。

### 自動更新される生成ファイル（手で編集しない）

GitHub Actions が外部から取得してコミットする：

- `src/app/note-articles.json` — noteの全記事（毎週月曜 8:40 JST）
- `src/app/glossary/article-meta.json`、`src/app/manga/episodes.json` — 同上
- `src/app/calendar/news-headlines.json`、`event-images.json` — AIニュース（毎朝 6:40 JST）

**例外的に手書きなのは `src/app/note-article-meta.json`**。badge / tone / tags / excerpt のキュレーション情報で、生成側より優先される。新記事のメタを整えるときはこれを編集する。

**Claude Codeのサンドボックスからは note.com などの外部サイトに到達できない。** そのため取得は `.github/workflows/refresh-*.yml`（GitHub Actionsランナー）側で行う設計になっている。スクリプトを直接実行してデータを取りにいこうとしないこと。ワークフローには開発ブランチ名を直書きした `push` トリガもあるので、スクリプトを触ったら合わせて確認する。

### APIルート（`src/app/api/`）

`search`（AI司書＝サイト内RAG検索）と `uketsuke`（AI受付）が Claude API を直接fetchで叩く。`ANTHROPIC_API_KEY` が未設定・エラーのときは**AI要約なしの検索結果表示に降格する**フォールバックが入っているので、この挙動を壊さないこと。インスタンス内メモリの簡易レートリミットも同様。

### その他

- `/game` は `public/game/index.html`（自己完結の3Dゲーム）へ `next.config.ts` の rewrites で配信。
- `aiux-official.vercel.app` → `comixai.dev` の308リダイレクトも `next.config.ts` にある。
- `/news`（Prism）と `/zukan` は `robots: { index: false }`。`sitemap.ts` にも意図的に入れていない。
- `PrismNews/` はサイト本体とは無関係の SwiftUI iPhoneアプリ（Xcodeで開くもの）。Webのビルド対象ではない。

## Git

- コミットメッセージは日本語の Conventional Commits：`feat: 〜` `fix: 〜` `chore: 〜` `style: 〜`
- 作業ブランチで開発し、mainへは基本PR経由。
