/* ============================================================
   トークン分割API — 学習アプリ（COMIXAIアカデミー）のiOS版のためのもの。

   ▍なぜサーバーでやるのか
   cl100k_base の表（約10万件）をアプリ内で組み立てると、iOSのJSエンジン
   （Hermes）が初期化中のGCで落ちる（TestFlightのビルド9〜13で、
   Object.keys / Uint8Array / concat と場所を変えて全て同じ4〜5秒地点の
   クラッシュを確認）。エンジン側の問題でアプリからは避けようがないので、
   表はここ（V8）で持ち、アプリは結果だけ受け取る。
   **Web版アプリとこのサイトの /tokenizer は従来どおり手元で計算する**
   （ブラウザのV8では問題が起きない）。

   ▍アプリ側の相方は ComixaiAcademy/src/lib/tokenizer.ts。
   chips の区切り方（decodeGenerator で「読めた瞬間」に束ねる）は
   /tokenizer の lab.tsx と同じ理屈。仕様を変えるときは両方を見ること。
   ============================================================ */
import { decodeGenerator, encode } from "gpt-tokenizer/encoding/cl100k_base";

export const runtime = "nodejs";

/* 体験カードの入力欄は短文想定。異常な長文はここで断る */
const MAX_TEXT = 2000;

/* —— 簡易レートリミット（インスタンス内メモリ・ベストエフォート） —— */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 300; // 打鍵ごとに呼ばれる（300ms間引き済み）ので、他のAPIより緩め
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > RATE_WINDOW_MS) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  if (hits.size > 5000) hits.clear();
  return h.n > RATE_MAX;
}

interface Chip {
  text: string;
  n: number;
}

/* トークン列を「読める塊」に束ねる。
   1トークンずつ decodeGenerator に流し込み、文字として読めた瞬間までに
   何トークン使ったかを数える（日本語は1文字が2〜3トークンに割れるため）。
   ComixaiAcademy/src/lib/tokenizer.ts の toChips と同じ実装 */
function toChips(tokens: number[]): Chip[] {
  const chips: Chip[] = [];
  let at = -1;
  let last = -1;

  function* feed(): Generator<number> {
    for (let i = 0; i < tokens.length; i++) {
      at = i;
      yield tokens[i];
    }
  }

  for (const piece of decodeGenerator(feed())) {
    if (!piece) continue;
    if (at === last && chips.length) {
      chips[chips.length - 1].text += piece;
      continue;
    }
    chips.push({ text: piece, n: at - last });
    last = at;
  }

  if (last < tokens.length - 1) chips.push({ text: "…", n: tokens.length - 1 - last });
  return chips;
}

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "しばらく待ってからどうぞ" }, { status: 429 });
  }

  let text: unknown;
  try {
    ({ text } = (await req.json()) as { text?: unknown });
  } catch {
    return Response.json({ error: "JSONで送ってください" }, { status: 400 });
  }
  if (typeof text !== "string" || text.length > MAX_TEXT) {
    return Response.json({ error: `text は${MAX_TEXT}文字までの文字列` }, { status: 400 });
  }

  const tokens = encode(text);
  return Response.json({ count: tokens.length, chips: toChips(tokens) });
}
