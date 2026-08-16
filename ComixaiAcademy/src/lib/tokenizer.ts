/* ============================================================
   トークナイザー。cl100k_base（GPT-4 / 従来のChatGPT系）を使う。

   ▍サイトの /tokenizer とは表が違う
   あちらは o200k_base（GPT-4o系）。同じ文でもトークン数は一致しない
   （例：「私は会社で事務の仕事をしています。…」がサイト22・アプリ34）。
   これは表の違いであって、どちらかが間違っているわけではない。
   **どちらかに揃えるなら、下の import と、この注意書きを直すこと。**

   ▍なぜ遅延読み込みなのか
   BPEの表だけで約1MBある（cl100k_base）。起動時に読むと、使わない人にも
   その分の初期化を払わせることになる。実際に体験カードを開いた時に読む。
   o200k_base は2.2MBあるので、アプリでは採っていない。

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
  /** 途中で切れたバイト列を内部に持ち越しながら、読めたぶんだけ返す */
  decodeGenerator: (t: Iterable<number>) => Generator<string>;
}

let cached: Enc | null = null;
let inflight: Promise<Enc> | null = null;

/** 落ちてこないまま待ち続けない上限。これを過ぎたら失敗として扱う */
const LOAD_TIMEOUT_MS = 15000;

/**
 * BPEの表を読み込む。2回目以降は即返る。
 *
 * ▍失敗を覚え込まない
 * 表は約1MBの別ファイルで、本体とは別に取りにいく。電波が細い所や、
 * 一度スリープしたPWAでは、ここだけ落ちてこないことがある。
 * かつては失敗した Promise を `inflight` に残していたので、**一度失敗すると
 * その後どれだけ電波が戻っても永久に失敗を返し続けた**（画面を閉じて開き
 * 直しても直らない）。転んだら忘れて、次に呼ばれたら取りにいき直す。
 */
export function loadTokenizer(): Promise<Enc> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    const load = import('gpt-tokenizer/encoding/cl100k_base').then((m) => {
      cached = { encode: m.encode, decode: m.decode, decodeGenerator: m.decodeGenerator };
      return cached;
    });
    /* 返事が来ないまま黙って固まるのがいちばん困る（画面は「よみこみ中…」の
       まま、打つこともできない）。時間で見切りをつけて、呼び元に失敗を返す */
    const timeout = new Promise<Enc>((_, reject) =>
      setTimeout(() => reject(new Error('tokenizer: timeout')), LOAD_TIMEOUT_MS),
    );
    inflight = Promise.race([load, timeout]).catch((e) => {
      inflight = null;
      throw e;
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
 *
 * ▍decode に「�が出るか」で判定してはいけない
 * かつては1トークンずつ足しながら decode して、置換文字（U+FFFD）が
 * 消えたところで区切っていた。ところが gpt-tokenizer の decode は、
 * **末尾の半端なバイトを黙って捨てて返す**。そのため「まだ途中」なのに
 * 文字として成立したように見え、区切りが1つ後ろへずれていた。
 *
 * 実際に出ていた誤り（合計は合っているが、内訳が違う）：
 *   「事務の」 事 ／ 務の×3      → 正しくは 事 ／ 務×2 ／ の
 *   「書類」   書×3 ／ 類        → 正しくは 書×2 ／ 類×2
 *
 * decodeGenerator は半端なバイトを内部に持ち越すので、**読めた瞬間**に
 * だけ文字を返す。これを1トークンずつ流し込んで、返ってきた時点までに
 * 何トークン使ったかを数える。
 */
export function toChips(tokens: number[], enc: Enc): TokenChip[] {
  const chips: TokenChip[] = [];
  /* いま generator に渡し終えた位置と、直前に文字が確定した位置 */
  let at = -1;
  let last = -1;

  function* feed(): Generator<number> {
    for (let i = 0; i < tokens.length; i++) {
      at = i;
      yield tokens[i];
    }
  }

  for (const piece of enc.decodeGenerator(feed())) {
    if (!piece) continue;
    if (at === last && chips.length) {
      /* 1トークンから2回に分けて返ってきた場合。
         新しいチップにすると0トークンの塊ができてしまうので、前にくっつける */
      chips[chips.length - 1].text += piece;
      continue;
    }
    chips.push({ text: piece, n: at - last });
    last = at;
  }

  /* 末尾が中途半端に終わった場合（サロゲートの片割れだけ、など） */
  if (last < tokens.length - 1) chips.push({ text: '…', n: tokens.length - 1 - last });
  return chips;
}
