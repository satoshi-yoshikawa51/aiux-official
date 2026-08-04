/* ============================================================
   4コマのネーム（構成とセリフ）を3案出す支援スクリプト。
   描くのは人間（吉川さん）で、これはネタ出しの壁打ち相手。

   使い方:
     npm run yonkoma -- rag              # 用語集のslugを指定
     npm run yonkoma -- sales-email      # プロンプト集のslugでもよい（自動判別）
     npm run yonkoma -- --list           # 描ける対象と入稿済みの一覧
     npm run yonkoma -- rag --dry        # APIを叩かず、渡すお題だけ確認

   要 ANTHROPIC_API_KEY（--list と --dry は不要）。
   結果はターミナルと docs/yonkoma-names/<slug>.md に出る。
   描き終わったらmdは消してよい（コミットしてもよい。ただの下書き）。

   入稿（描いた絵の置き場所）は docs/yonkoma.md を見ること。
   ============================================================ */
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const NAMES_DIR = path.join(ROOT, "docs/yonkoma-names");
const ART_DIR = path.join(ROOT, "public/yonkoma");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const DRY = flags.has("--dry");
const LIST = flags.has("--list");

const MODEL = "claude-opus-5";

/* ═══════════════ データ読み込み ═══════════════ */

const { TERMS } = await import(pathToFileURL(path.join(ROOT, "src/app/glossary/data.ts")).href);
/* prompts/data.ts は拡張子なしimportを含みnodeから直接読めないため、バッチを直接読む */
const RECIPES = [
  ...(await import(pathToFileURL(path.join(ROOT, "src/app/prompts/recipes-basics.ts")).href)).RECIPES_BASICS,
  ...(await import(pathToFileURL(path.join(ROOT, "src/app/prompts/recipes-biz.ts")).href)).RECIPES_BIZ,
  ...(await import(pathToFileURL(path.join(ROOT, "src/app/prompts/recipes-work.ts")).href)).RECIPES_WORK,
];

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

async function drawn(section, slug) {
  for (const ext of ["webp", "png"]) {
    if (await exists(path.join(ART_DIR, section, `${slug}.${ext}`))) return true;
  }
  return false;
}

/* ═══════════════ --list ═══════════════ */

if (LIST) {
  console.log("── 用語集（150語） ──");
  for (const t of TERMS) {
    console.log(`  ${(await drawn("glossary", t.slug)) ? "✔" : " "} ${t.slug}  ${t.term}`);
  }
  console.log("── プロンプト集（24本） ──");
  for (const r of RECIPES) {
    console.log(`  ${(await drawn("prompts", r.slug)) ? "✔" : " "} ${r.slug}  ${r.title}`);
  }
  console.log("\n✔ = 入稿済み。まだの対象は npm run yonkoma -- <slug> でネームを出せる");
  process.exit(0);
}

const slug = args[0];
if (!slug) {
  console.log("使い方: npm run yonkoma -- <slug>   （一覧は --list）");
  process.exit(1);
}

const term = TERMS.find((t) => t.slug === slug);
const recipe = RECIPES.find((r) => r.slug === slug);
if (!term && !recipe) {
  console.error(`slug「${slug}」は用語集にもプロンプト集にも無い。--list で確認して`);
  process.exit(1);
}

/* ═══════════════ お題を組む ═══════════════ */

const CAST = `- 先輩: AIに詳しい先輩社員。ツッコミ役で、最後にオチをまとめる
- AI新人くん: AIそのものを擬人化した新人。素直だが、言われたことを極端に解釈してボケる
- 部長: 流行りに飛びつく管理職。世間の空気を代弁して無茶を言う`;

const SYSTEM = `あなたは漫画家・AIクリエイターの吉川聡史（COMIXAI）のネーム作りの壁打ち相手です。
本人がこのあと自分で描くので、絵の心配は要りません。構成とセリフの面白さに全振りしてください。

## シリーズの前提
- サイトの解説ページの冒頭に載る4コマ。読者は「AIを仕事で使いたい会社員」
- 文章の解説より先に読まれる。だから正確な説明ではなく「あるある」で掴むのが仕事。細部の正確さは本文が受け持つ
- レギュラーの登場人物（使わなくてもよい。話に合う人だけ出す）:
${CAST}

## ネームの作り方
- 起承転結。4コマ目のオチで必ず落とす
- ボケは「AIに雑に頼んだら、言われた通りに事故る」が基本線。AIは間違えないが、指示の穴を忠実に突く
- 読者が「うちの会社でも見た」と思う実景に置く。抽象論やSFにしない
- セリフは1コマ30字以内。説明ゼリフは禁止。用語の定義はセリフで言わせない（本文が説明する）
- 3案は互いに型を変えること（例: あるある型 / 擬人化暴走型 / ビフォーアフター型 / 部長暴走型）
- 各コマに、描く人向けの構図メモ（カメラの寄り引き、誰がどこにいるか）を短く付ける

## 文体
誇張した煽りは使わない。オチは説教にしない。`;

function buildTopic() {
  if (term) {
    const sections = (term.sections ?? []).map((s) => `- ${s.heading}`).join("\n");
    return {
      section: "glossary",
      title: term.term,
      pageUrl: `/glossary/${term.slug}`,
      prompt: `お題: AI用語「${term.term}」（${term.yomi}）の解説ページに載せる4コマ。

一文定義: ${term.short}

本文の要旨:
${term.body.map((p) => `- ${p}`).join("\n")}
${sections ? `\n本文にある見出し:\n${sections}` : ""}

この用語を「知らない人が最初に読む4コマ」として、ネームを3案ください。`,
    };
  }
  return {
    section: "prompts",
    title: recipe.title,
    pageUrl: `/prompts/${recipe.slug}`,
    prompt: `お題: プロンプト集「${recipe.title}」の解説ページに載せる4コマ。

キャッチ: ${recipe.catch}

このページの構造は「ダメな指示 → 事故る出力 → 直した指示」で、素材はもうコメディの形をしている:
- ダメな指示: ${recipe.badPrompt}
- 実際に返ってくるもの: ${recipe.badResult}
- なぜ事故るか: ${recipe.badWhy.join(" / ")}

この事故を4コマにしてください。直した指示の中身（正解のプロンプト）はコマ内で説明しなくてよい。
「事故った→指示のせいだった」まで落とせば、続きは本文が受け持つ。3案ください。`,
  };
}

const topic = buildTopic();

/* ═══════════════ 生成 ═══════════════ */

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ideas"],
  properties: {
    ideas: {
      type: "array",
      description: "ネーム3案。互いに型を変える",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "punchType", "panels"],
        properties: {
          title: { type: "string", description: "4コマのタイトル案。20字以内" },
          punchType: { type: "string", description: "この案の型（あるある型など）" },
          panels: {
            type: "array",
            description: "起承転結の4コマ",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["chars", "line", "scene"],
              properties: {
                chars: { type: "string", description: "そのコマに出る人物（例: 部長と先輩）" },
                line: { type: "string", description: "セリフ。30字以内" },
                scene: { type: "string", description: "描く人向けの構図メモ。30字以内" },
                note: { type: "string", description: "コマ下ナレーション。不要なら空文字" },
              },
            },
          },
        },
      },
    },
  },
};

if (DRY) {
  console.log("── system ──\n" + SYSTEM + "\n\n── user ──\n" + topic.prompt);
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY が無い。--dry なら渡すお題だけ確認できる");
  process.exit(1);
}

const { default: Anthropic } = await import("@anthropic-ai/sdk");
const client = new Anthropic();

console.log(`「${topic.title}」のネームを3案考え中…`);
const res = await client.messages.create({
  model: MODEL,
  max_tokens: 12000,
  system: SYSTEM,
  output_config: { effort: "high", format: { type: "json_schema", schema: SCHEMA } },
  messages: [{ role: "user", content: topic.prompt }],
});
if (res.stop_reason === "refusal") {
  console.error(`生成が断られた: ${res.stop_details?.category ?? "不明"}`);
  process.exit(1);
}
const { ideas } = JSON.parse(res.content.find((b) => b.type === "text").text);

/* ═══════════════ 出力 ═══════════════ */

const artPath = `public/yonkoma/${topic.section}/${slug}.png`;
let md = `# ${topic.title} — ネーム案\n\n掲載先: ${topic.pageUrl}\n入稿先: \`${artPath}\`（webpでも可）\n\n`;
for (let i = 0; i < ideas.length; i++) {
  const idea = ideas[i];
  md += `## 案${i + 1}: ${idea.title}（${idea.punchType}）\n\n`;
  idea.panels.forEach((p, j) => {
    md += `${j + 1}. **${p.chars}**「${p.line}」\n   - 構図: ${p.scene}${p.note ? `\n   - ナレーション: ${p.note}` : ""}\n`;
  });
  md += "\n";
}

await mkdir(NAMES_DIR, { recursive: true });
const mdPath = path.join(NAMES_DIR, `${slug}.md`);
await writeFile(mdPath, md);
console.log("\n" + md);
console.log(`保存した: docs/yonkoma-names/${slug}.md`);
console.log(`描き上がったら ${artPath} に置くだけで、ページとギャラリーに載る`);
