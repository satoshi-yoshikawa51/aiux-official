/* ============================================================
   COMIXAI 白紙のLP — LP設計生成API。
   訪問者の3つの回答（職業・AIとの距離・ほしいもの）を受け取り、
   Anthropic Messages API (Claude Sonnet) でその人専用LPの設計JSONを生成する。
   あわせて発行部数の通し番号を採番する（Upstash Redis があれば永続、
   なければ null を返しクライアント側が乱数にフォールバック）。
   ANTHROPIC_API_KEY 未設定・エラー時は { fallback: true } を返し、
   クライアント側はルールベースの fallbackSpec() に切り替わる。
   ============================================================ */
export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

/* —— 簡易レートリミット（インスタンス内メモリ・ベストエフォート） —— */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 20;
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > RATE_WINDOW_MS) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  if (hits.size > 5000) hits.clear(); // 念のためのメモリ保険
  return h.n > RATE_MAX;
}

/* —— コンテンツ台帳（public/lp/index.html の ITEMS と id を揃えること） —— */
const ITEMS: Record<string, { name: string; desc: string }> = {
  kyoshujo: { name: "5分で覚える!Claude教習所", desc: "本物そっくりの練習画面を、講師が1タップずつ案内。登録不要・無料。" },
  start: { name: "AIのはじめかた(無料コース)", desc: "絵巻→マンガ→用語→体験→実践の全3章。順番に進むだけ。" },
  manga: { name: "連載マンガ「マンガでわかる!AI活用」", desc: "現場のAI活用術を全7話のマンガで。活字が苦手でも10分。" },
  quest: { name: "Claude Code Quest", desc: "Claude Codeを、RPGで遊びながら学べる。コマンド不要のライト版も。" },
  emaki: { name: "AI歴史絵巻 EMAKI", desc: "AIの75年を、ひと巻きに。1950年からエージェント時代まで。" },
  prompts: { name: "仕事のプロンプト集", desc: "営業メール・議事録・Excel関数…失敗例の実演つきで頼み方が身につく。" },
  glossary: { name: "AI用語集(図解つき)", desc: "LLM?RAG?MCP?現場目線でサクッと図解。" },
  guide_sales: { name: "営業のAI活用ガイド", desc: "アポ獲得メールから提案書まで、営業の仕事に引きつけて。" },
  guide_marketing: { name: "マーケティングのAI活用ガイド", desc: "調査・分析・コピーづくりをAIで加速する。" },
  guide_office: { name: "事務のAI活用ガイド", desc: "議事録・資料・定型業務を、AIでラクに正確に。" },
  guide_creator: { name: "クリエイターのAI活用ガイド", desc: "制作フローにAIを組み込み、作る速度と幅を広げる。" },
  guide_hr: { name: "人事・採用のAI活用ガイド", desc: "求人票・面接準備・社内文書を、AIで丁寧に速く。" },
  guide_support: { name: "サポート・CSのAI活用ガイド", desc: "問い合わせ対応とナレッジ整備を、AIで底上げする。" },
  guide_planner: { name: "企画・PMのAI活用ガイド", desc: "リサーチ・要件整理・資料づくりをAIで前に進める。" },
  guide_owner: { name: "経営者・個人事業主のAI活用ガイド", desc: "ひとりの手数を増やす。営業も経理も発信もAIと一緒に。" },
  guide_it: { name: "情シス・社内ITのAI活用ガイド", desc: "社内展開・ルール整備・ヘルプデスクをAIで回す。" },
  uketsuke: { name: "AI受付(お仕事相談)", desc: "講演・寄稿・制作・取材。AIと話すだけでお問い合わせが完成。" },
};

/* 職業 → 職種別ガイドid の対応（システムプロンプトにも記載） */
const GUIDE_MAP: Record<string, string> = {
  営業: "guide_sales",
  マーケティング: "guide_marketing",
  "事務・バックオフィス": "guide_office",
  クリエイター: "guide_creator",
  "人事・採用": "guide_hr",
  "サポート・CS": "guide_support",
  "企画・PM": "guide_planner",
  "経営・個人事業主": "guide_owner",
  "情シス・IT": "guide_it",
};

function buildSystemPrompt(): string {
  const list = Object.entries(ITEMS)
    .map(([id, v]) => `- id:${id} / ${v.name} / ${v.desc}`)
    .join("\n");
  const guides = Object.entries(GUIDE_MAP)
    .map(([job, id]) => `${job}=${id}`)
    .join(",");
  return `あなたは「COMIXAI」(comixai.dev)のAIディレクター。運営者は吉川聡史(株式会社ニジボックス室長/週刊少年チャンピオン連載漫画家/AIクリエイター/UXディレクター)。ブランドは「AIを、面白く。わかりやすく。」
訪問者の回答に合わせて、その人専用LPの設計JSONを出力する。
[使えるコンテンツ(idで指定)]
${list}
出力は必ずJSONのみ。前置き・コードフェンス禁止。スキーマ:
{"hero":{"label":"バッジ文言(8字以内,例:営業のあなた専用)","catch":"キャッチコピー(18字以内,その人に刺さる言葉。体言止めや呼びかけ)","sub":"サブコピー(45字以内,COMIXAIがその人に何をくれるか)"},
"diagnosis":"診断ひとこと(35字以内,その人の状況を軽妙に言い当てる)",
"sections":[{"eyebrow":"英字ラベル(例:LEARN)","title":"見出し(14字以内,その人向けの言葉で)","lead":"リード文(50字以内,回答内容を必ず反映)","items":["id","id"]} ×3個],
"cta":{"closing":"締めの一言(30字以内)","main":{"id":"id","text":"ボタン文言10字以内"},"sub":{"id":"id","text":"ボタン文言10字以内"}}}
制約: sectionsは優先度順。itemsは各2個・全体で重複なし。職業に対応するguide_*があれば必ずどこかに入れる(${guides})。「ほぼ触ったことない」ならkyoshujoかstartを最優先セクションに。コピーは軽妙で温かく、押し売りしない。`;
}

/* —— 通し番号（Upstash Redis REST。未設定なら null） —— */
async function nextIssueNumber(): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/incr/comixai:lp:issue`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: number };
    return typeof data.result === "number" ? data.result : null;
  } catch {
    return null;
  }
}

/* —— 生成されたspecの形式チェック（壊れたJSONでLPを組まないための門番） —— */
interface Spec {
  hero: { label: string; catch: string; sub: string };
  diagnosis: string;
  sections: { eyebrow: string; title: string; lead: string; items: string[] }[];
  cta: {
    closing: string;
    main: { id: string; text: string };
    sub: { id: string; text: string };
  };
}
function validateSpec(raw: unknown): Spec | null {
  const s = raw as Spec;
  if (!s || typeof s !== "object") return null;
  if (!s.hero || typeof s.hero.catch !== "string" || typeof s.hero.sub !== "string") return null;
  if (typeof s.hero.label !== "string") return null;
  if (typeof s.diagnosis !== "string") return null;
  if (!Array.isArray(s.sections) || s.sections.length < 3) return null;
  for (const sec of s.sections) {
    if (typeof sec.title !== "string" || typeof sec.lead !== "string") return null;
    sec.eyebrow = typeof sec.eyebrow === "string" ? sec.eyebrow : "SEC";
    sec.items = (Array.isArray(sec.items) ? sec.items : []).filter((id) => ITEMS[id]).slice(0, 2);
  }
  if (!s.cta || typeof s.cta.closing !== "string") return null;
  if (!s.cta.main || !ITEMS[s.cta.main.id]) s.cta.main = { id: "start", text: "はじめてみる" };
  if (!s.cta.sub || !ITEMS[s.cta.sub.id]) s.cta.sub = { id: "uketsuke", text: "相談してみる" };
  return s;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) {
    return Response.json({ fallback: true, reason: "rate_limited", issue: null }, { status: 429 });
  }

  let body: { job?: unknown; level?: unknown; want?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const job = typeof body.job === "string" ? body.job.slice(0, 30) : "";
  const level = typeof body.level === "string" ? body.level.slice(0, 30) : "";
  const want = typeof body.want === "string" ? body.want.slice(0, 30) : "";
  if (!job || !level || !want) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  /* 通し番号は生成の成否に関わらず採番する（フォールバックLPにも奥付が付く） */
  const issuePromise = nextIssueNumber();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ fallback: true, issue: await issuePromise });
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: buildSystemPrompt(),
        messages: [
          {
            role: "user",
            content: `訪問者の回答 → 職業:${job} / AIとの距離:${level} / いまほしいもの:${want}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return Response.json({ fallback: true, reason: "api_error", issue: await issuePromise });
    }
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = (data.content || [])
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text)
      .join("");
    const spec = validateSpec(JSON.parse(text.replace(/```json|```/g, "").trim()));
    if (!spec) {
      return Response.json({ fallback: true, reason: "bad_spec", issue: await issuePromise });
    }
    return Response.json({ spec, issue: await issuePromise });
  } catch {
    return Response.json({ fallback: true, reason: "network", issue: await issuePromise });
  }
}
