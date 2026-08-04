/* ============================================================
   登壇・出演・監修などの外部実績。

   ・タイトル・日付・サムネイルは書かない。すべて
     link-cards.json（CIがOGPから取得）を参照して表示する。
     ここに書くのは「どのURLを、どの区分で、誰の主体で出すか」だけ。
   ・掲載条件（広報確認済み）:
       - タイトルとリンクの紹介にとどめ、本文の転載や
         記事内画像の切り出しはしない
       - 実施主体を明記する
       - クライアント名が出る実績は載せない
     この条件を広げないこと。説明文を足したくなったら、
     それが相手の記事の要約になっていないか必ず確認する。
   ・配列の順番がそのまま表示順。各区分とも新しい順に並べる。
   ・scripts/fetch-link-cards.mjs はこのファイルからURLを拾って
     OGPを取りにいくので、URLを足せば自動で対象になる。
   ============================================================ */

export interface RecordGroup {
  /** 区分の見出し */
  label: string;
  /** 一覧での並び順に使う短い説明 */
  note: string;
  icon: string;
  /** 各件に付ける区分バッジ */
  kind: string;
  /** 実施主体。会社の業務として行ったものはその旨を明記する */
  client: string;
  /** カード下部のリンク文言 */
  linkLabel: string;
  /** 新しい順。URLだけを書く（タイトル等はOGPから取る） */
  urls: string[];
}

export const RECORD_GROUPS: RecordGroup[] = [
  {
    label: "登壇・イベント",
    note: "カンファレンスや自社イベントでの講演・パネル",
    icon: "ph-microphone-stage",
    kind: "登壇",
    client: "株式会社ニジボックスの業務として",
    linkLabel: "レポートを読む",
    urls: [
      "https://blog.nijibox.jp/article/ui-ux-camp-2026",
      "https://blog.nijibox.jp/article/ai-shift-claude",
      "https://note.com/researchconf/n/n8e171b7b2e70",
      "https://note.com/nijibox_jp/n/nf09e87702af8",
      "https://blog.nijibox.jp/article/nijiboxcollege-event",
    ],
  },
  {
    label: "解説動画",
    note: "AIの使い方を、つくりながら見せる",
    icon: "ph-play-circle",
    kind: "出演",
    client: "株式会社ニジボックスの業務として",
    linkLabel: "動画を見る",
    urls: [
      "https://www.youtube.com/watch?v=iCXRhKaAB6M",
      "https://www.youtube.com/watch?v=c7ahkpVh2bU",
    ],
  },
  {
    label: "登壇アーカイブ",
    note: "イベント登壇の記録映像",
    icon: "ph-video-camera",
    kind: "登壇",
    client: "株式会社ニジボックスの業務として",
    linkLabel: "アーカイブを見る",
    urls: [
      "https://www.youtube.com/watch?v=g2kTo6uRlF0",
      "https://www.youtube.com/watch?v=yQPFYp9IOkk",
      "https://www.youtube.com/watch?v=qorckco4JFc",
      "https://www.youtube.com/watch?v=Yc4o5rkhBPI",
      "https://www.youtube.com/watch?v=vMu28tJWdXA",
      "https://www.youtube.com/watch?v=N3JFr9wpnpM",
      "https://www.youtube.com/watch?v=A4ofIoto-lk",
    ],
  },
  {
    label: "監修",
    note: "AI活用・制作フローに関する記事の監修",
    icon: "ph-check-square-offset",
    kind: "監修",
    client: "株式会社ニジボックスの業務として",
    linkLabel: "記事を読む",
    urls: [
      "https://blog.nijibox.jp/article/ai_wireframe_2",
      "https://blog.nijibox.jp/article/ai-coding",
      "https://blog.nijibox.jp/article/ai-agents",
      "https://blog.nijibox.jp/article/ai_frontend_tools",
      "https://blog.nijibox.jp/article/ai_wireframe",
      "https://blog.nijibox.jp/article/ai_development_cost",
    ],
  },
  {
    label: "インタビュー",
    note: "キャリアについて",
    icon: "ph-chats-circle",
    kind: "取材",
    client: "株式会社ニジボックスの業務として",
    linkLabel: "記事を読む",
    urls: ["https://www.wantedly.com/companies/nijibox/post_articles/489416"],
  },
  {
    label: "講座",
    note: "個人としてご依頼をいただいた講座",
    icon: "ph-film-slate",
    kind: "講座",
    client: "株式会社FPEC様 ／ 個人活動として実施",
    linkLabel: "実施レポートを読む",
    urls: [
      "https://note.com/aiux_unite/n/n537a83c2d15c",
      "https://note.com/aiux_unite/n/n77f117e59052",
    ],
  },
];

/* 掲載件数は「URLの数」ではなく「実際にカードを出せた数」を使う。
   OGPの取得はCIに任せているので、追加直後のURLはまだカードが無い。
   数え方は record-ui.tsx の RECORD_TOTAL を参照。 */
