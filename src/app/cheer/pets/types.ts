/* ペット定義の型。SVGは draw() が返すマークアップ文字列で持つ。
   画面表示（<svg>に流し込む）と画像保存（canvasへ描く）の両方で使うため、
   Reactコンポーネントではなく文字列にしている。
   絵を差し替えるときは、各ペットのファイルの draw() を丸ごと置き換えればよい。 */
export interface Pet {
  id: string;
  /* 画面に出す名前（カタカナ可） */
  name: string;
  /* クレジット表記用のひらがな名（「◯◯やく」） */
  ja: string;
  /* 性格づけ（前口上・締めの言葉のトーンの元。コメント用） */
  voice: string;
  /* 名言のまえに言う前口上（1セット1〜2行・ひらがな）。ランダムに1つ選ばれる */
  intros: string[][];
  /* 名言のあとに言う締めの一言（同上） */
  outros: string[][];
  /* 配色（draw内から参照） */
  color: string;
  ear: string;
  cheek: string;
  /* viewBox 0 0 150 150 の中身を返す */
  draw: (c: Pet) => string;
}
