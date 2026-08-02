/* ============================================================
   トークナイザー。サイトの /tokenizer と同じ cl100k_base を使う。

   ▍なぜ遅延読み込みなのか
   BPEの表だけで約1MBある（cl100k_base）。起動時に読むと、使わない人にも
   その分の初期化を払わせることになる。実際に体験カードを開いた時に読む。
   o200k_base は2.2MBあるので採らない。サイトの実験室と同じ表にもしてある。

   ▍日本語は「1トークン＝1文字」ではない
   UTF-8のバイト列をまとめる方式なので、日本語の1文字が2〜3トークンに
   割れることがあり、**1トークンだけをdecodeしても文字として成立しない**
   （置換文字 U+FFFD になる）。表示するときは toChips() を通して、
   文字として読めるところまで束ねること。
   ============================================================ */

export interface TokenChip {
  /** 表示する文字列 */
  text: string;
  /** この塊が何トークンぶんか */
  n: number;
}

interface Enc {
  encode: (s: string) => number[];
  decode: (t: number[]) => string;
}

let cached: Enc | null = null;
let inflight: Promise<Enc> | null = null;

/** BPEの表を読み込む。2回目以降は即返る */
export function loadTokenizer(): Promise<Enc> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = import('gpt-tokenizer/encoding/cl100k_base').then((m) => {
      cached = { encode: m.encode, decode: m.decode };
      return cached;
    });
  }
  return inflight;
}

/** すでに読み込み済みか（読み込み中の表示を出すかの判断に使う） */
export function tokenizerReady(): boolean {
  return cached !== null;
}

/**
 * トークン列を「読める塊」に束ねる。
 * 文字の途中で切れているあいだは次のトークンを足していき、
 * decodeが成立したところで1つのチップにする（サイトの実験室と同じ作法）。
 */
export function toChips(tokens: number[], decode: (t: number[]) => string): TokenChip[] {
  const chips: TokenChip[] = [];
  let buf: number[] = [];
  for (const t of tokens) {
    buf.push(t);
    const s = decode(buf);
    if (s && !s.includes('�')) {
      chips.push({ text: s, n: buf.length });
      buf = [];
    }
  }
  /* 末尾が中途半端に終わった場合（入力の途中など） */
  if (buf.length) chips.push({ text: '…', n: buf.length });
  return chips;
}
