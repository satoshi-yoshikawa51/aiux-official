/* ============================================================
   日刊「今日のAIを4コマで」（/daily）を生成するスクリプト。

   毎朝、AIニュースの見出しから1本えらび、Claude API に4コマの
   構成とセリフを書かせ、コマ割りテンプレートに流し込んで
   PNGに焼き、src/app/daily/entries.json に1件追記する。

   使い方:
     node scripts/generate-daily-manga.mjs            # 本番（要 ANTHROPIC_API_KEY）
     node scripts/generate-daily-manga.mjs --sample   # APIを叩かず見本データで描画だけ試す
     node scripts/generate-daily-manga.mjs --force    # 同じ日付が既にあっても上書きする

   （外部に到達できる環境で実行する。CIからは
     .github/workflows/refresh-daily-manga.yml で毎朝実行される）

   絵の差し替え:
     public/daily/cast/{キャラ}-{表情}.webp（または .png）を置くと、
     そのコマは自動でその絵を使う。無ければ仮のSVG似顔絵で描画され、
     1枚でも仮絵が混じったコマ帯には「仮素材」の帯が出る。
     キャラ = senpai / shinjin / buchou
     表情   = normal / smile / surprise / worry / think / shine
   ============================================================ */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const NEWS_PATH = path.join(ROOT, "src/app/calendar/news-headlines.json");
const ENTRIES_PATH = path.join(ROOT, "src/app/daily/entries.json");
const CAST_DIR = path.join(ROOT, "public/daily/cast");
const OUT_DIR = path.join(ROOT, "public/daily");
const OG_DIR = path.join(ROOT, "public/og/daily");

const ARGS = new Set(process.argv.slice(2));
const SAMPLE = ARGS.has("--sample");
const FORCE = ARGS.has("--force");

const MODEL = "claude-opus-5";
/* 直近この日数のうちに使ったニュースは選び直す（同じ話題の連投を防ぐ） */
const DEDUPE_DAYS = 14;

/* ═══════════════ 登場人物と表情 ═══════════════ */
/* データ側はこの名前しか受け付けない。増やすときは絵も一緒に用意すること */
const CAST = {
  senpai: { name: "先輩", role: "AIに詳しい先輩社員。ツッコミ役で、最後にオチをまとめる" },
  shinjin: { name: "AI新人くん", role: "AIそのものを擬人化した新人。素直だが極端に解釈してボケる" },
  buchou: { name: "部長", role: "流行りに飛びつく管理職。世間の反応を代弁して無茶を言う" },
};
const EXPRESSIONS = ["normal", "smile", "surprise", "worry", "think", "shine"];

/* ═══════════════ デザイントークン（globals.cssと揃える） ═══════════════ */
const INK = "#14110f";
const INK_500 = "#6e635b";
const PAPER_0 = "#ffffff";
const PAPER_50 = "#fbf7ef";
const PAPER_100 = "#f4ecdd";
const YELLOW = "#ffd23f";
const RED = "#e60012";

/* ═══════════════ 小道具 ═══════════════ */
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

/** JSTの YYYY-MM-DD */
function todayJst() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** fontsourceのCSSを読み、フォントURLを絶対file://に書き換えてインライン化 */
async function fontCss(pkg, weights) {
  let css = "";
  for (const w of weights) {
    const cssPath = path.join(ROOT, "node_modules/@fontsource", pkg, `${w}.css`);
    const dirUrl = pathToFileURL(path.join(ROOT, "node_modules/@fontsource", pkg)).href;
    css += (await readFile(cssPath, "utf8")).replaceAll("url(./", `url(${dirUrl}/`);
  }
  return css;
}

/* ═══════════════ 1. ニュースを選ぶ ═══════════════ */

async function loadNews() {
  const json = JSON.parse(await readFile(NEWS_PATH, "utf8"));
  return Array.isArray(json.items) ? json.items : [];
}

async function loadEntries() {
  if (!(await exists(ENTRIES_PATH))) return { entries: [] };
  return JSON.parse(await readFile(ENTRIES_PATH, "utf8"));
}

/** 直近に取り上げたURLを除き、日本語の見出しを候補として返す */
function pickCandidates(items, entries) {
  const used = new Set(entries.slice(0, DEDUPE_DAYS).map((e) => e.source?.url).filter(Boolean));
  return items
    .filter((it) => it.lang === "ja" && it.title && it.url && !used.has(it.url))
    .slice(0, 10);
}

/* ═══════════════ 2. Claudeに4コマを書かせる ═══════════════ */

/* 構造化出力のスキーマ。ここに無いキーは返ってこない */
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pick", "title", "lead", "panels", "takeaway", "share", "terms"],
  properties: {
    pick: { type: "integer", description: "選んだ見出しの番号（0始まり）" },
    title: { type: "string", description: "4コマのタイトル。24字以内の言い切り" },
    lead: { type: "string", description: "この話題を1〜2文で説明するリード。100字前後" },
    panels: {
      type: "array",
      description: "4コマ。起承転結の順",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["cast", "speaker", "line"],
        properties: {
          cast: {
            type: "array",
            description: "そのコマに出る人。1〜2人。左→右の順で描かれる",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["char", "expr"],
              properties: {
                char: { type: "string", enum: Object.keys(CAST) },
                expr: { type: "string", enum: EXPRESSIONS },
              },
            },
          },
          speaker: { type: "integer", description: "castの何番目が喋るか（0始まり）" },
          line: { type: "string", description: "セリフ。30字以内。話し言葉で" },
          note: { type: "string", description: "コマ下のナレーション。不要なら空文字。20字以内" },
        },
      },
    },
    terms: {
      type: "array",
      description: "この回に関係するAI用語集のslug。0〜3個。候補にないslugは書かない",
      items: { type: "string" },
    },
    takeaway: { type: "string", description: "漫画家・吉川聡史としての一言。60〜100字" },
    share: { type: "string", description: "Xに流す投稿文。70字以内。ハッシュタグなし" },
  },
};

const SYSTEM = `あなたは漫画家・AIクリエイターの吉川聡史（COMIXAI）の作画アシスタントです。
毎朝のAIニュースを、4コマ漫画のネタに変換します。

## 登場人物
${Object.entries(CAST)
  .map(([k, v]) => `- ${k}（${v.name}）: ${v.role}`)
  .join("\n")}

## 4コマの作り方
- 起承転結。4コマ目に必ずオチをつける。オチは笑いでも、しみじみでもいい
- ニュースの内容を説明するのではなく、「それが自分の仕事にどう関係するか」を描く
- 専門用語は登場人物の会話でほぐす。カタカナの羅列にしない
- セリフは30字以内。長いセリフは吹き出しからはみ出して描画が壊れる
- 事実として確認できないことは書かない。数字や社名を創作しない
- 見出しから読み取れない詳細は補わず、「わからない」ことを前提にネタを作る

## 文体
です・ます調は使わない。ふだんの会話。誇張した煽りや「〜すぎる」は使わない。`;

function userPrompt(candidates) {
  const list = candidates.map((c, i) => `${i}. ${c.title}（${c.source}）`).join("\n");
  return `今日のAIニュースの見出しです。

${list}

このうち、いちばん4コマにしやすい／読者（AIを仕事で使いたい会社員）に関係が深いものを1本えらんで、4コマ漫画のネームを書いてください。
見出し以外の情報は手元にありません。中身を知っている前提で書かないこと。`;
}

const GLOSSARY_HINT_MAX = 60;

async function loadGlossarySlugs() {
  const mods = ["src/app/glossary/data.ts"];
  const { TERMS } = await import(pathToFileURL(path.join(ROOT, mods[0])).href);
  return TERMS.map((t) => ({ slug: t.slug, term: t.term }));
}

async function askClaude(candidates, glossary) {
  const client = new Anthropic();
  const hint = glossary
    .slice(0, GLOSSARY_HINT_MAX)
    .map((t) => `${t.slug}（${t.term}）`)
    .join(" / ");
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: `${userPrompt(candidates)}

termsに書けるslugの候補（ここにあるものだけ使う。無理に埋めなくていい）:
${hint}`,
      },
    ],
  });
  if (res.stop_reason === "refusal") {
    throw new Error(`Claudeが生成を断った: ${res.stop_details?.category ?? "不明"}`);
  }
  const text = res.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Claudeの応答にテキストが無い");
  return JSON.parse(text);
}

/* ═══════════════ 3. 検証して整える ═══════════════ */

function sanitize(draft, candidates, glossarySlugs) {
  const pick = candidates[draft.pick] ?? candidates[0];
  const panels = (draft.panels ?? []).slice(0, 4).map((p) => {
    const cast = (p.cast ?? [])
      .filter((c) => CAST[c.char])
      .slice(0, 2)
      .map((c) => ({ char: c.char, expr: EXPRESSIONS.includes(c.expr) ? c.expr : "normal" }));
    if (cast.length === 0) cast.push({ char: "shinjin", expr: "normal" });
    const speaker = Number.isInteger(p.speaker) && p.speaker < cast.length ? p.speaker : 0;
    return { cast, speaker, line: String(p.line ?? "").slice(0, 40), note: String(p.note ?? "").slice(0, 24) };
  });
  if (panels.length !== 4) throw new Error(`4コマになっていない（${panels.length}コマ）`);

  const known = new Set(glossarySlugs.map((t) => t.slug));
  return {
    title: String(draft.title ?? "").slice(0, 30),
    lead: String(draft.lead ?? ""),
    source: { title: pick.title, url: pick.url, name: pick.source },
    panels,
    terms: (draft.terms ?? []).filter((s) => known.has(s)).slice(0, 3),
    takeaway: String(draft.takeaway ?? ""),
    share: String(draft.share ?? "").slice(0, 90),
  };
}

/* ═══════════════ 4. 描画 ═══════════════ */

/* 仮のキャラ絵。実素材が入るまでのつなぎで、輪郭と表情だけで見分ける。
   顔の作りをキャラごとに変えてあるので、コマの流れは追える */
function placeholderSvg(char, expr) {
  const eyes = {
    normal: `<circle cx="-26" cy="-6" r="7"/><circle cx="26" cy="-6" r="7"/>`,
    smile: `<path d="M-36 -6 q10 -13 20 0" /><path d="M16 -6 q10 -13 20 0" />`,
    surprise: `<circle cx="-26" cy="-8" r="12"/><circle cx="26" cy="-8" r="12"/>`,
    worry: `<path d="M-38 -14 l22 8" /><path d="M38 -14 l-22 8" /><circle cx="-26" cy="-2" r="6"/><circle cx="26" cy="-2" r="6"/>`,
    think: `<path d="M-36 -6 l20 0" /><path d="M16 -6 l20 0" />`,
    shine: `<path d="M-26 -20 l8 14 l-8 14 l-8 -14 z"/><path d="M26 -20 l8 14 l-8 14 l-8 -14 z"/>`,
  }[expr];
  const mouth = {
    normal: `<path d="M-12 26 l24 0" />`,
    smile: `<path d="M-20 18 q20 22 40 0" />`,
    surprise: `<ellipse cx="0" cy="28" rx="15" ry="19"/>`,
    worry: `<path d="M-18 32 q18 -16 36 0" />`,
    think: `<path d="M-6 28 l20 0" />`,
    shine: `<path d="M-22 16 q22 26 44 0" />`,
  }[expr];
  /* 髪型・小物でキャラを描き分ける */
  const head = {
    senpai: `<path d="M-92 -34 q10 -74 92 -74 q82 0 92 74 q-40 -30 -92 -30 q-30 0 -50 12 z" fill="${INK}"/>`,
    shinjin: `<rect x="-14" y="-146" width="28" height="26" rx="6" fill="${INK}"/><circle cx="0" cy="-152" r="12" fill="${RED}"/><path d="M-92 -40 q14 -68 92 -68 q78 0 92 68 q-46 -22 -92 -22 q-46 0 -92 22 z" fill="${INK}"/>`,
    buchou: `<path d="M-96 -30 q6 -30 30 -40 q-6 20 2 30 z" fill="${INK}"/><path d="M96 -30 q-6 -30 -30 -40 q6 20 -2 30 z" fill="${INK}"/><path d="M-34 44 q34 16 68 0 q-34 26 -68 0 z" fill="${INK}"/>`,
  }[char];
  const body = {
    senpai: `<path d="M-116 250 q10 -104 116 -104 q106 0 116 104 z" fill="${PAPER_0}" stroke="${INK}" stroke-width="8"/><path d="M0 146 l-26 46 l26 58 l26 -58 z" fill="${RED}"/>`,
    shinjin: `<path d="M-112 250 q8 -104 112 -104 q104 0 112 104 z" fill="${YELLOW}" stroke="${INK}" stroke-width="8"/>`,
    buchou: `<path d="M-124 250 q12 -104 124 -104 q112 0 124 104 z" fill="${PAPER_100}" stroke="${INK}" stroke-width="8"/><path d="M-46 150 l46 34 l46 -34" fill="none" stroke="${INK}" stroke-width="8"/>`,
  }[char];
  return `<svg viewBox="-140 -170 280 430" width="280" height="430" xmlns="http://www.w3.org/2000/svg">
  <g>
    ${body}
    <ellipse cx="0" cy="0" rx="96" ry="112" fill="${PAPER_0}" stroke="${INK}" stroke-width="8"/>
    ${head}
    <g fill="${INK}" stroke="${INK}" stroke-width="7" stroke-linecap="round">${eyes}</g>
    <g fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round">${mouth}</g>
  </g>
</svg>`;
}

/** 実素材があればそれを、無ければ仮SVGを返す */
async function castFigure(char, expr) {
  for (const ext of ["webp", "png"]) {
    const p = path.join(CAST_DIR, `${char}-${expr}.${ext}`);
    if (await exists(p)) {
      return { html: `<img class="fig" src="${pathToFileURL(p).href}" alt="" />`, placeholder: false };
    }
  }
  return { html: `<div class="fig">${placeholderSvg(char, expr)}</div>`, placeholder: true };
}

async function panelHtml(panel, index) {
  const figs = [];
  let usedPlaceholder = false;
  for (const c of panel.cast) {
    const f = await castFigure(c.char, c.expr);
    usedPlaceholder = usedPlaceholder || f.placeholder;
    figs.push(f.html);
  }
  const solo = panel.cast.length === 1;
  const speakerLeft = panel.speaker === 0;
  const stage = solo
    ? `<div class="stage solo">${figs[0]}</div>`
    : `<div class="stage duo"><div class="slot left">${figs[0]}</div><div class="slot right flip">${figs[1]}</div></div>`;
  const bubble = `<div class="bubble ${speakerLeft ? "b-left" : "b-right"}"><div class="line">${esc(panel.line)}</div><span class="tail"></span></div>`;
  const note = panel.note ? `<div class="note">${esc(panel.note)}</div>` : "";
  return {
    html: `<div class="panel"><span class="num">${index + 1}</span>${stage}${bubble}${note}</div>`,
    usedPlaceholder,
  };
}

async function stripHtml(entry, fonts) {
  const panels = [];
  let usedPlaceholder = false;
  for (let i = 0; i < entry.panels.length; i++) {
    const p = await panelHtml(entry.panels[i], i);
    usedPlaceholder = usedPlaceholder || p.usedPlaceholder;
    panels.push(p.html);
  }
  const stamp = usedPlaceholder ? `<span class="wip">仮素材</span>` : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts}
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1080px; font-family:"Zen Kaku Gothic New", sans-serif; color:${INK}; background:${INK}; }
.strip { width:1080px; padding:24px 24px 20px; }
.head { display:flex; align-items:baseline; gap:12px; padding:2px 4px 16px; color:${PAPER_50}; }
.head .kicker { font-family:"JetBrains Mono", monospace; font-size:19px; letter-spacing:.16em; font-weight:700; color:${YELLOW}; }
.head .date { font-family:"JetBrains Mono", monospace; font-size:19px; font-weight:700; opacity:.75; margin-left:auto; }
.title { font-size:40px; font-weight:900; line-height:1.3; color:${PAPER_50}; padding:0 4px 18px; }
.panel {
  position:relative; width:1032px; height:520px; margin-bottom:16px; overflow:hidden;
  background:${PAPER_50};
  background-image:radial-gradient(rgba(20,17,15,.10) 1.6px, transparent 1.7px);
  background-size:13px 13px;
  border:5px solid ${INK}; border-radius:12px;
}
.panel:last-of-type { margin-bottom:0; }
.num {
  position:absolute; top:14px; left:18px; z-index:3;
  font-family:"JetBrains Mono", monospace; font-size:22px; font-weight:700; color:${INK_500};
}
.stage { position:absolute; left:0; right:0; bottom:-24px; display:flex; align-items:flex-end; justify-content:center; }
.stage.duo { justify-content:space-between; padding:0 128px; }
.slot.flip { transform:scaleX(-1); }
.fig { display:block; height:430px; width:auto; }
.fig svg { display:block; height:430px; width:auto; }
.bubble {
  position:absolute; top:34px; z-index:2; max-width:560px;
  background:${PAPER_0}; border:4px solid ${INK}; border-radius:26px;
  padding:18px 24px; box-shadow:5px 5px 0 ${INK};
}
.b-left  { left:52px; }
.b-right { right:52px; }
.line { font-size:31px; font-weight:700; line-height:1.55; }
.tail { position:absolute; bottom:-27px; width:0; height:0; border:14px solid transparent; border-top:26px solid ${INK}; }
.b-left  .tail { left:56px; }
.b-right .tail { right:56px; }
.note {
  position:absolute; left:18px; bottom:16px; z-index:3;
  background:${INK}; color:${PAPER_50}; font-size:21px; font-weight:700;
  padding:7px 14px; border-radius:6px;
}
.foot { display:flex; align-items:center; gap:12px; padding:16px 4px 0; color:${PAPER_50}; }
.foot .logo { font-size:24px; font-weight:900; letter-spacing:.02em; }
.foot .logo .mix { color:${RED}; }
.foot .src { font-size:17px; opacity:.7; margin-left:auto; max-width:640px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.wip {
  display:inline-block; background:${YELLOW}; color:${INK}; font-size:15px; font-weight:900;
  padding:3px 10px; border-radius:999px; margin-left:8px;
}
</style></head><body>
<div class="strip">
  <div class="head"><span class="kicker">DAILY — 今日のAIを4コマで</span>${stamp}<span class="date">${entry.date}</span></div>
  <div class="title">${esc(entry.title)}</div>
  ${panels.join("\n")}
  <div class="foot">
    <span class="logo">CO<span class="mix">MIX</span>AI</span>
    <span style="font-size:17px;opacity:.8">comixai.dev/daily</span>
    <span class="src">出典: ${esc(entry.source.name)}「${esc(entry.source.title)}」</span>
  </div>
</div>
</body></html>`;
  return { html, usedPlaceholder };
}

/* OGP（1200×630）。用語集のOG画像と同じ言語で作る */
function ogHtml(entry, fonts) {
  const n = [...entry.title].length;
  const size = n <= 12 ? 78 : n <= 18 ? 64 : 54;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts}
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1200px; height:630px; font-family:"Zen Kaku Gothic New", sans-serif; color:${INK}; }
.stage { width:1200px; height:630px; padding:26px; background:${INK}; }
.frame {
  position:relative; width:100%; height:100%; overflow:hidden;
  background:${PAPER_50};
  background-image:radial-gradient(rgba(20,17,15,.10) 1.6px, transparent 1.7px);
  background-size:13px 13px;
  border:5px solid ${INK}; border-radius:22px;
  padding:42px 54px 36px; display:flex; flex-direction:column;
}
.kicker { font-family:"JetBrains Mono", monospace; font-size:20px; letter-spacing:.16em; font-weight:700; color:${RED}; }
.date { position:absolute; top:42px; right:54px; font-family:"JetBrains Mono", monospace; font-size:20px; font-weight:700; color:${INK_500}; }
.title { font-size:${size}px; font-weight:900; line-height:1.32; margin-top:22px; }
.lead { font-size:23px; line-height:1.85; color:${INK_500}; margin-top:20px; max-width:1000px;
        display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.marker { background:linear-gradient(transparent 62%, ${YELLOW} 62%); }
.bottom { margin-top:auto; display:flex; align-items:baseline; gap:14px; }
.logo { font-size:30px; font-weight:900; }
.logo .mix { color:${RED}; }
.site { font-family:"JetBrains Mono", monospace; font-size:19px; color:${INK_500}; margin-left:auto; }
</style></head><body>
<div class="stage"><div class="frame">
  <div class="kicker">DAILY — 今日のAIを4コマで</div>
  <div class="date">${entry.date}</div>
  <div class="title">${esc(entry.title)}</div>
  <div class="lead">${esc(entry.lead)}</div>
  <div class="bottom">
    <span class="logo">CO<span class="mix">MIX</span>AI</span>
    <span class="site">comixai.dev/daily</span>
  </div>
</div></div>
</body></html>`;
}

/* Playwrightは、ローカルにあればそれを、無ければグローバル導入を使う。
   Chromiumの実体はサンドボックスだけ固定パスなので、無ければPlaywright任せにする */
async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    const npmRoot = execSync("npm root -g").toString().trim();
    ({ chromium } = await import(pathToFileURL(path.join(npmRoot, "playwright/index.mjs")).href));
  }
  const sandboxChrome = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_PATH || ((await exists(sandboxChrome)) ? sandboxChrome : undefined);
  return chromium.launch({ executablePath, args: ["--allow-file-access-from-files"] });
}

/* ═══════════════ 5. 見本データ（--sample） ═══════════════ */

const SAMPLE_DRAFT = {
  pick: 0,
  title: "AIに議事録を任せた日",
  lead: "会議の議事録をAIに任せる会社が増えている。ただ、任せ方を間違えると「全部書いてあるのに何も伝わらない」議事録が出てくる。",
  panels: [
    {
      cast: [{ char: "buchou", expr: "shine" }, { char: "senpai", expr: "normal" }],
      speaker: 0,
      line: "今日から議事録はAIに任せる！",
      note: "月曜の朝",
    },
    {
      cast: [{ char: "shinjin", expr: "smile" }],
      speaker: 0,
      line: "全発言、一言一句そのまま書きました",
      note: "",
    },
    {
      cast: [{ char: "senpai", expr: "surprise" }, { char: "shinjin", expr: "normal" }],
      speaker: 0,
      line: "40ページある…決まったことは？",
      note: "",
    },
    {
      cast: [{ char: "senpai", expr: "think" }, { char: "shinjin", expr: "worry" }],
      speaker: 0,
      line: "「決定事項だけ」って言えばよかった",
      note: "指示が9割",
    },
  ],
  terms: ["prompt-engineering"],
  takeaway: "AIは「書け」と言えば全部書く。ほしいのは記録じゃなくて、次に何をするかの一行だったりする。",
  share: "議事録をAIに任せたら40ページ返ってきた話。指示の粒度って大事。",
};

/* ═══════════════ 実行 ═══════════════ */

async function main() {
  const date = todayJst();
  const store = await loadEntries();
  const entries = store.entries ?? [];

  if (!FORCE && entries.some((e) => e.date === date)) {
    console.log(`${date} の回はもうある。--force で上書きできる`);
    return;
  }

  const glossary = await loadGlossarySlugs();
  const news = await loadNews();
  const candidates = pickCandidates(news, entries);
  if (candidates.length === 0) {
    console.log("使えるニュース見出しが無い。今日はスキップする");
    return;
  }

  let draft;
  if (SAMPLE) {
    draft = SAMPLE_DRAFT;
    console.log("--sample: APIを叩かず見本データで描画する");
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("ANTHROPIC_API_KEY が無い。生成をスキップする（サイトは既存の回のまま動く）");
      return;
    }
    console.log(`候補${candidates.length}本からネームを書かせる…`);
    draft = await askClaude(candidates, glossary);
  }

  const entry = { date, ...sanitize(draft, candidates, glossary) };
  entry.image = `/daily/${date}.png`;
  entry.og = `/og/daily/${date}.png`;

  /* —— 描画 —— */
  const fonts =
    (await fontCss("zen-kaku-gothic-new", [500, 700, 900])) + (await fontCss("jetbrains-mono", [700]));
  const strip = await stripHtml(entry, fonts);
  entry.placeholderArt = strip.usedPlaceholder;

  const browser = await launchBrowser();

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(OG_DIR, { recursive: true });

  const page = await browser.newPage({ viewport: { width: 1080, height: 1200 } });
  await page.setContent(strip.html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT_DIR, `${date}.png`), fullPage: true });
  console.log(`  ✔ public/daily/${date}.png`);

  const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await ogPage.setContent(ogHtml(entry, fonts), { waitUntil: "networkidle" });
  await ogPage.evaluate(() => document.fonts.ready);
  await ogPage.screenshot({ path: path.join(OG_DIR, `${date}.png`) });
  console.log(`  ✔ public/og/daily/${date}.png`);

  await browser.close();

  /* —— 追記 —— */
  const next = [entry, ...entries.filter((e) => e.date !== date)].sort((a, b) => (a.date < b.date ? 1 : -1));
  await mkdir(path.dirname(ENTRIES_PATH), { recursive: true });
  await writeFile(
    ENTRIES_PATH,
    JSON.stringify(
      {
        _comment:
          "日刊4コマ（自動生成）。scripts/generate-daily-manga.mjs が毎朝追記する。手で編集しないこと。",
        updatedAt: new Date().toISOString(),
        entries: next,
      },
      null,
      2
    ) + "\n"
  );
  console.log(`完了: ${date}「${entry.title}」を追加（全${next.length}回）`);
  if (entry.placeholderArt) {
    console.log("  ※ キャラ絵はまだ仮素材。public/daily/cast/ に置けば自動で差し替わる");
  }
}

await main();
