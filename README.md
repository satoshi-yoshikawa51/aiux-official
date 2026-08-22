# 吉川聡史 オフィシャルサイト（aiux-official）

AIクリエイター・漫画家・UXディレクター **吉川聡史** のオフィシャルサイト。
note連載・マガジン・SNS・YouTube・お問い合わせを1ページにまとめた、マンガ×UXのサイトです。

本番URL: https://comixai.dev

**Claude Code Quest（ゲーム）とは完全に独立した別プロジェクト**です。別のVercelプロジェクト＝別URLとして公開できます。

## 技術

- Next.js 16（App Router）/ React 19 / TypeScript
- 外部ライブラリ追加なし（フォント＝Google Fonts、アイコン＝Phosphor Icons をCDN読み込み）

## ローカルで動かす

```bash
npm install
npm run dev
```

→ http://localhost:3000

## 公開（Vercelに別プロジェクトとしてデプロイ）

1. このフォルダ（`aiux-official`）を**新しいGitHubリポジトリ**にpush
   ```bash
   git init
   git add -A
   git commit -m "init: 吉川聡史 official site"
   # GitHubで空のリポジトリを作成してから:
   git remote add origin <あなたのリポジトリURL>
   git branch -M main
   git push -u origin main
   ```
2. [Vercel](https://vercel.com) で **Add New… → Project** → このリポジトリを選択
3. フレームワークは自動で「Next.js」と認識されます。そのまま **Deploy**
4. `xxx.vercel.app` の独立URLで公開されます（ゲームとは別URL）。独自ドメインもVercelの **Settings → Domains** から割り当て可能

## よくある編集

すべて `src/app/data.ts` を編集するだけです。

- **新着記事を増やす**: `ARTICLES` 配列の先頭に1件追加（`title` / `url` / `date` / `thumb` / `badge` / `tone` / `likes`）。新着タブは `date` 降順で自動並び替え。
- **人気記事の並び**: `ARTICLES_POPULAR` を `likes` 降順で編集。
- **SNS / YouTube / マガジンのURL**: `SOCIALS` / `YOUTUBE` / `MAGAZINES`。
- **お問い合わせの送信先**: `FORMSPREE_ENDPOINT`（現状 comixai@outlook.jp 宛のFormspree）。
- **メインビジュアルの動画**: `HERO_VIDEO_ID`（YouTubeの動画ID）。

## 同梱している別プロジェクト

このリポジトリには、サイト本体とは独立して動くアプリも入っています。

- **`ComixaiAcademy/`** — スマホアプリ「COMIXAI アカデミー」（Expo / React Native）。
  3Dアバターを選び、職種を選ぶと、その職種向けにレッスンが変化する学習アプリ。
  クリアするとバッジが増え、称号が上がります。サイトの用語集・職種別ガイド・
  プロンプト集を元ネタにしています。詳細は `ComixaiAcademy/README.md`。
  サイト側の紹介ページは `/academy`（`src/app/academy/page.tsx`）。載せている数字と
  スクショはアプリの実装と一対なので、アプリを直したらこちらも直します。
  素材と宣伝物は3つのコマンドで作り直せます——`npm run academy:shots`（審査用スクショ
  → 表示用WebP）、`npm run og:academy`（OGP画像）、`npm run academy:video`
  （SNS用の縦ショート動画・約23秒。出力は `academy-video/` でGit管理外）。
- **`PrismNews/`** — パーソナライズドニュースの iPhoneアプリ（SwiftUI）。

## メモ

- お問い合わせは [Formspree](https://formspree.io) 経由で `comixai@outlook.jp` に届きます。初回はFormspreeの確認メール承認が必要です。
- ヒーローのYouTube動画は、再生できない環境では自動でバナー画像にフォールバックします。
