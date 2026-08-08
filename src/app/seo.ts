/* ============================================================
   検索結果に出るタイトルの長さを揃えるための小さな道具。

   Googleは検索結果のタイトルを全角30字あたりで切る。切られるのは
   末尾なので、「｜AI用語集｜COMIXAI」のようなお尻の飾りが長いと、
   肝心の中身のほうが消える。用語名の長さが1語ずつ違う用語集や
   作品ページでは、固定の文字列を足すやり方だと調整できない。

   seoTitle は head（絶対に残したい部分）を先に置き、後ろの語は
   入るぶんだけ足す。入らない語は飛ばして次を見るので、
   長い説明が落ちてもサイト名だけは残せる。

     seoTitle("プロンプトエンジニアリングとは？わかりやすく解説", "AI用語集", "COMIXAI")
       → "プロンプトエンジニアリングとは？わかりやすく解説"（後ろは入らないので落ちる）
     seoTitle("RAGとは？わかりやすく解説", "AI用語集", "COMIXAI")
       → "RAGとは？わかりやすく解説｜AI用語集｜COMIXAI"

   静的なページのタイトルはこれを使わず、短い文字列を直接書く。
   長さが変わらないので、実物を目で見て決めたほうが良いものになる。
   ============================================================ */

/** 検索結果でタイトルが切られない目安（全角換算） */
const TITLE_LIMIT = 30;

/** 全角を1、半角を0.5として数える */
export function titleWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    /* 半角英数・記号と半角カナ以外は全角とみなす */
    w += c <= 0x7f || (c >= 0xff61 && c <= 0xff9f) ? 0.5 : 1;
  }
  return w;
}

/**
 * head の後ろに tails を「入るぶんだけ」つないだタイトルを返す。
 * tails は大事な順に並べる（入らないものは飛ばして次を見る）。
 */
export function seoTitle(head: string, ...tails: (string | undefined)[]): string {
  let out = head;
  for (const t of tails) {
    if (!t) continue;
    const piece = `｜${t}`;
    if (titleWidth(out) + titleWidth(piece) > TITLE_LIMIT) continue;
    out += piece;
  }
  return out;
}
