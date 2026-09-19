/* ============================================================
   きょうの きみに — ペットの台詞生成API。
   Anthropic SDK (Claude Haiku) で、選んだ気持ち・理由・ひとことと
   名言をもとに、ひらがなの短い台詞を JSON で生成する。
   ANTHROPIC_API_KEY 未設定・エラー時は { fallback: true } を返し、
   クライアント側はストック台詞（STOCK）に降格する。
   ============================================================ */
export const runtime = "nodejs";

import Anthropic from "@anthropic-ai/sdk";
import { FEELS, WHYS, QUOTES } from "../../cheer/data";
import { PETS } from "../../cheer/pets";

const MODEL = "claude-haiku-4-5";

/* プロンプト。プレースホルダは fill() で埋める（プロトタイプのRULESそのまま） */
const RULES = `あなたは、落ち込んだ人のそばにいる小さなペットです。役は「\${pet}」。
性格：\${voice}

書き方のルール（絶対）：
- すべて ひらがな（カタカナも可）。漢字は一文字も使わない。
- 4〜6行。1行は8文字以内。句読点は使わない。文節の間は半角スペース。
- 読むより「眺める」ための短さ。説明しない。「だから」「つまり」は禁止。
- 「がんばって」「がんばれ」「おうえん」は禁止。励ましは1割、共感が9割。
- 相手の言葉を1つ拾って返す。相手が書いていなければ気持ちを言い換えて返す。
- 途中に、渡された名言の意味を「〜みたいだよ」「〜っていってた」と受け売りの形で入れる。断言しない。名言の言葉を最後の行でもう一度そっと拾う。
- 「ぜったい」「すごく」のような子どもっぽい強調は1つまで。
- 最後の1〜2行は、自分も参加する（いっしょに、ぼくも）か、相手の今をそのまま肯定する。

お手本：
ひとは
じぶんににたひと
すきになるみたいだよ
きみに
にてるひとぜったいいるよ

ゆっくり あるくひとが
いちばん とおくまで
いけるんだって
きみ いま
とおくに いるよ

ともだちって
ふえたり へったり
するもんだよ
いまは
へってるだけ

相手の状況：
- 気持ち：\${feel}
- 理由：\${why}
- ひとこと：\${note}
使う名言（\${who}）：\${gist}

出力は JSON だけ。{"lines":["…","…"]} の形。コードブロック（\`\`\`）で囲まない。他の文章は書かない。`;

function fill(t: string, m: Record<string, string>): string {
  return t.replace(/\$\{(\w+)\}/g, (_, k) => m[k] ?? "");
}

/* 生成結果の検証。文字数上限はお手本の最長行（12文字）が通るよう14に緩めてある
   （プロトタイプの10だと、お手本に倣った出力が落ち続ける矛盾があった） */
const MAX_LINE_CHARS = 14;
function valid(lines: unknown): lines is string[] {
  if (!Array.isArray(lines) || lines.length < 3 || lines.length > 7) return false;
  return lines.every((l) => lineIssue(l) === null);
}

/* 1行が検証に落ちる理由を返す（診断でも使う）。問題なければ null */
function lineIssue(l: unknown): string | null {
  if (typeof l !== "string") return "not_string";
  const s = l.trim();
  if (!s) return "empty";
  if (s.replace(/\s/g, "").length > MAX_LINE_CHARS) return `too_long(${s.replace(/\s/g, "").length})`;
  if (/[一-鿿]/.test(s)) return "kanji";
  if (/(がんばって|がんばれ|だから|つまり)/.test(s)) return "banned_word";
  return null;
}

/* 返答本文（JSONのみのはず）から lines を取り出す。コードフェンス混入にも耐える */
function parseLines(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]) as { lines?: unknown };
    return j.lines ?? null;
  } catch {
    return null;
  }
}

interface CheerRequest {
  feel: string;
  why: string;
  pet: string;
  quote: number;
  note: string;
}

function sanitize(raw: unknown): CheerRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const feel = typeof b.feel === "string" ? b.feel : "";
  const why = typeof b.why === "string" ? b.why : "";
  const pet = typeof b.pet === "string" ? b.pet : "";
  const quote = typeof b.quote === "number" ? b.quote : -1;
  const note = typeof b.note === "string" ? b.note.slice(0, 60) : "";
  if (!FEELS.some((f) => f.id === feel)) return null;
  if (!WHYS.some((w) => w.id === why)) return null;
  if (!PETS.some((p) => p.id === pet)) return null;
  if (!Number.isInteger(quote) || quote < 0 || quote >= QUOTES[feel].length) return null;
  return { feel, why, pet, quote, note };
}

/* 生成本体。検証に落ちたら1回だけ引き直す（プロトタイプと同じ2回試行）。
   失敗時は理由と、直近の生の出力（診断用）を返す */
async function generateLines(
  apiKey: string,
  prompt: string,
): Promise<{ lines?: string[]; reason?: string; raw?: string; issues?: (string | null)[] }> {
  const client = new Anthropic({ apiKey });
  let raw = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    raw = res.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");
    const lines = parseLines(raw);
    if (valid(lines)) {
      return { lines: lines.map((l) => l.trim()) };
    }
  }
  /* 診断用に、どの行がどのルールで落ちたかも添える */
  const parsed = parseLines(raw);
  const issues = Array.isArray(parsed) ? parsed.map((l) => lineIssue(l)) : ["no_lines_array"];
  return { reason: "invalid", raw: raw.slice(0, 300), issues };
}

function buildPrompt(input: CheerRequest): string {
  const pet = PETS.find((p) => p.id === input.pet)!;
  const quote = QUOTES[input.feel][input.quote];
  return fill(RULES, {
    pet: pet.name,
    voice: pet.voice,
    feel: FEELS.find((f) => f.id === input.feel)!.label,
    why: WHYS.find((w) => w.id === input.why)!.label,
    note: input.note || "（なし）",
    who: quote.who,
    gist: quote.gist,
  });
}

/* 診断用：キーの有無を返す。?probe=1 なら固定入力で実際に1回生成し、
   成功した台詞 or 失敗の理由（HTTPステータス・エラー種別・生出力）を返す。
   プレビューでストック台詞ばかり出るときの切り分けに使う */
/* ブラウザ直開きでも日本語が化けないよう charset を明示する */
function jsonUtf8(data: unknown): Response {
  return new Response(JSON.stringify(data, null, 1), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ai = Boolean(apiKey);
  if (!ai || !new URL(req.url).searchParams.has("probe")) {
    return jsonUtf8({ ai });
  }
  const prompt = buildPrompt({ feel: "sad", why: "none", pet: "inu", quote: 0, note: "" });
  try {
    const r = await generateLines(apiKey!, prompt);
    return jsonUtf8({ ai, probe: r.lines ? "ok" : r.reason, ...r });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return jsonUtf8({
        ai,
        probe: "api_error",
        status: e.status,
        error: e.name,
        message: String(e.message).slice(0, 300),
      });
    }
    return jsonUtf8({ ai, probe: "api_error", error: String(e).slice(0, 300) });
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ fallback: true });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const input = sanitize(body);
  if (!input) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const r = await generateLines(apiKey, buildPrompt(input));
    if (r.lines) {
      return Response.json({ lines: r.lines });
    }
    return Response.json({ fallback: true, reason: r.reason });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return Response.json({ fallback: true, reason: "rate_limited" }, { status: 429 });
    }
    const status = e instanceof Anthropic.APIError ? e.status : undefined;
    return Response.json({ fallback: true, reason: status ? `api_error_${status}` : "api_error" });
  }
}
