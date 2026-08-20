/* ============================================================
   トークナイザー。cl100k_base（GPT-4 / 従来のChatGPT系）を使う。

   ▍WebとiOSで、数える場所が違う
   ・Web … 手元で数える。BPEの表（約1MB・10万件）を遅延読み込みして、
     ブラウザ（V8）で encode する。従来どおり。
   ・ネイティブ（iOS）… **サイトのAPI（/api/tokenize）に数えてもらう。**
     表をアプリ内で組み立てると、iOSのJSエンジン（Hermes）が初期化中の
     GCで必ず落ちる（TestFlightビルド9〜13で、Object.keys / Uint8Array /
     concat と場所を変えて同じ4〜5秒地点のクラッシュを確認。エンジン側の
     問題で、個別に避けても別の場所で出る）。アプリからは避けようがない
     ので、表はサーバー（V8）に持たせて結果だけ受け取る。
     API側の実装は サイトの src/app/api/tokenize/route.ts（chipsの
     区切りロジックはこのファイルの toChips と同じもの）。

   ▍サイトの /tokenizer とは表が違う
   あちらは o200k_base（GPT-4o系）。同じ文でもトークン数は一致しない。
   これは表の違いであって、どちらかが間違っているわけではない。

   ▍日本語は「1トークン＝1文字」ではない
   UTF-8のバイト列をまとめる方式なので、日本語の1文字が2〜3トークンに
   割れることがあり、**1トークンだけをdecodeしても文字として成立しない**
   （置換文字 U+FFFD になる）。表示するときは chips（読めるところまで
   束ねた塊）を使うこと。
   ============================================================ */
import { Platform } from 'react-native';

export interface TokenChip {
  /** 表示する文字列 */
  text: string;
  /** この塊が何トークンぶんか */
  n: number;
}

/** 数えた結果。カードはこれだけ見ればよい */
export interface TokenizeResult {
  count: number;
  chips: TokenChip[];
}

interface Enc {
  encode: (s: string) => number[];
  decode: (t: number[]) => string;
  /** 途中で切れたバイト列を内部に持ち越しながら、読めたぶんだけ返す */
  decodeGenerator: (t: Iterable<number>) => Generator<string>;
}

/** 落ちてこないまま待ち続けない上限。これを過ぎたら失敗として扱う */
const LOAD_TIMEOUT_MS = 15000;

const WEB = Platform.OS === 'web';
/** 読み直しを1周期に1回だけに抑える鍵（→ reloadForStaleChunk） */
const RELOAD_KEY = 'comixai-tokenizer-reloaded';

/* ————————————————————————————————
   Web：手元で数える（BPEの表を遅延読み込み）
   ———————————————————————————————— */

let cached: Enc | null = null;
let inflight: Promise<Enc> | null = null;

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
function loadTokenizer(): Promise<Enc> {
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

/* ————————————————————————————————
   ネイティブ：サイトのAPIに数えてもらう
   ———————————————————————————————— */

const TOKENIZE_API = 'https://comixai.dev/api/tokenize';
/** 打鍵ごとの問い合わせは、表の読み込みより短めに見切る */
const REMOTE_TIMEOUT_MS = 12000;

/** 一度でも届いたか（tokenizerReady の判断に使う） */
let remoteOk = false;

async function tokenizeRemote(text: string): Promise<TokenizeResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REMOTE_TIMEOUT_MS);
  try {
    const res = await fetch(TOKENIZE_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`tokenize: ${res.status}`);
    const j = (await res.json()) as Partial<TokenizeResult>;
    if (typeof j.count !== 'number' || !Array.isArray(j.chips)) {
      throw new Error('tokenize: 返事の形が違う');
    }
    remoteOk = true;
    return { count: j.count, chips: j.chips };
  } finally {
    clearTimeout(timer);
  }
}

/* ————————————————————————————————
   カードが使う入口（プラットフォーム共通）
   ———————————————————————————————— */

/**
 * 数える準備をする。体験カードが開いた時に呼び、失敗したら
 * 「もう一度よみこむ」でやり直せるようにする。
 * Webは表の読み込み、ネイティブはAPIへの疎通確認。
 */
export async function prepareTokenizer(): Promise<void> {
  if (WEB) {
    await loadTokenizer();
    return;
  }
  /* 最小の1文字で往復させる。DNS/TLSも温まるので、以後の打鍵が速くなる */
  await tokenizeRemote('。');
}

/** 文をトークンに分けて、数と「読める塊」を返す */
export async function tokenizeText(text: string): Promise<TokenizeResult> {
  if (!WEB) return tokenizeRemote(text);
  const enc = await loadTokenizer();
  const tokens = enc.encode(text);
  return { count: tokens.length, chips: toChips(tokens, enc) };
}

/** すでに数えられる状態か（読み込み中の表示を出すかの判断に使う） */
export function tokenizerReady(): boolean {
  return WEB ? cached !== null : remoteOk;
}

/* ============================================================
   ▍**先に温めておく**（→ app/_layout.tsx が起動後に1回呼ぶ）

   最初のレッスン（basics-1）の体験カードで使う。そこまで来てから
   用意すると、電波が細い所では**カードを開いた目の前で待たされて失敗する**。
   起動して落ち着いたころに裏でやっておけば、たいていはカードに着く前に
   終わっている。Webは表の読み込み、ネイティブはAPIの疎通（＝DNS/TLSの
   ウォームアップ）。失敗しても何もしない（使う場所で改めて呼ばれる）。
   ============================================================ */
export function warmTokenizer(): void {
  if (WEB && (cached || inflight)) return;
  prepareTokenizer().catch(() => {});
}

/* ============================================================
   ▍**古いままの画面を、読み直して直す**（Webだけ）

   表は本体とは別の1MBのファイルで、名前に中身のハッシュが入っている。
   開いたまま新しい版を配ると、**いま開いている画面が知っているファイル名は
   もうサーバーに無い**。SPAの決まりで存在しないパスは index.html に寄せて
   いたので、JSのつもりで**HTMLが返ってきて**読み込みが必ず失敗し、
   「もう一度よみこむ」を押しても同じHTMLが返るだけで永久に直らなかった
   （実機で報告）。配信側は直したが（vercel.json）、**すでに古い画面を
   開いている人は、読み直さないと新しいファイル名を知りようがない**。

   なので、失敗したときに1回だけページを読み直す。同じ周期で何度も
   読み直してループにならないよう、鍵を1つ置いて見張る。
   ============================================================ */
export function reloadForStaleChunk(): boolean {
  if (!WEB || typeof document === 'undefined') return false;
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return false;
    sessionStorage.setItem(RELOAD_KEY, '1');
  } catch {
    /* プライベートモードなどで sessionStorage が使えないときは、
       見張りを持てない。ループを避けるため読み直さない */
    return false;
  }
  location.reload();
  return true;
}

/**
 * トークン列を「読める塊」に束ねる（Webの手元計算用。APIも同じ実装を持つ）。
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
function toChips(tokens: number[], enc: Enc): TokenChip[] {
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
