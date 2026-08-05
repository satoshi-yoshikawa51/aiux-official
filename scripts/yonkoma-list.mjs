/* ============================================================
   4コマを描ける対象（用語集・プロンプト集のslug）と、
   入稿済み（✔）の一覧を出すだけの小さなスクリプト。

     npm run yonkoma:list

   ネーム・ネタ作りは人間の仕事。ここでは何も生成しない。
   入稿の手順は docs/yonkoma.md。
   ============================================================ */
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ART_DIR = path.join(ROOT, "public/yonkoma");

const { TERMS } = await import(pathToFileURL(path.join(ROOT, "src/app/glossary/data.ts")).href);
/* prompts/data.ts は拡張子なしimportを含みnodeから直接読めないため、バッチを直接読む */
const RECIPES = [
  ...(await import(pathToFileURL(path.join(ROOT, "src/app/prompts/recipes-basics.ts")).href)).RECIPES_BASICS,
  ...(await import(pathToFileURL(path.join(ROOT, "src/app/prompts/recipes-biz.ts")).href)).RECIPES_BIZ,
  ...(await import(pathToFileURL(path.join(ROOT, "src/app/prompts/recipes-work.ts")).href)).RECIPES_WORK,
];

async function drawn(section, slug) {
  for (const ext of ["webp", "png"]) {
    try {
      await access(path.join(ART_DIR, section, `${slug}.${ext}`));
      return true;
    } catch {}
  }
  return false;
}

let done = 0;
console.log("── プロンプト集（24本）── 置き場所: public/yonkoma/prompts/<slug>.png");
for (const r of RECIPES) {
  const d = await drawn("prompts", r.slug);
  if (d) done++;
  console.log(`  ${d ? "✔" : " "} ${r.slug.padEnd(18)} ${r.title}`);
}
console.log("── 用語集（150語）── 置き場所: public/yonkoma/glossary/<slug>.png");
for (const t of TERMS) {
  const d = await drawn("glossary", t.slug);
  if (d) done++;
  console.log(`  ${d ? "✔" : " "} ${t.slug.padEnd(18)} ${t.term}`);
}
console.log(`\n入稿済み: ${done}本。置いてコミットすればページとギャラリーに載る（docs/yonkoma.md）`);
