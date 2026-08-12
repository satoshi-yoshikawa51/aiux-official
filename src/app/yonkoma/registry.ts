/* ============================================================
   手描き4コマの台帳。データファイルは持たず、public/yonkoma/ に
   置かれた画像だけを正とする「置いたら載る」方式。

     public/yonkoma/glossary/<slug>.webp|png  → 用語ページに4コマが出る
     public/yonkoma/prompts/<slug>.webp|png   → レシピページに4コマが出る
     public/yonkoma/og/<section>/<slug>.png   → （任意）OGP画像を差し替える
     public/yonkoma/<section>/<slug>-1.png …  → （任意）動画用のコマ別画像。
                                                 サイトには出ない（yonkoma-video.mjsが使う）

   fsを読むのでサーバーコンポーネント／ビルド時専用。
   入稿＝コミットなので、デプロイのたびに必ず反映される。
   入稿の手順と絵の仕様は docs/yonkoma.md。
   ============================================================ */
import fs from "node:fs";
import path from "node:path";

export type YonkomaSection = "glossary" | "prompts";

const ROOT = path.join(process.cwd(), "public/yonkoma");
const EXTS = ["webp", "png"];

/** その用語/レシピの4コマ画像。無ければnull */
export function yonkomaSrc(section: YonkomaSection, slug: string): string | null {
  for (const ext of EXTS) {
    const rel = `${section}/${slug}.${ext}`;
    if (fs.existsSync(path.join(ROOT, rel))) return `/yonkoma/${rel}`;
  }
  return null;
}

/** 作者が用意したOGP差し替え画像（1200×630）。無ければnull＝既定のOGのまま */
export function yonkomaOg(section: YonkomaSection, slug: string): string | null {
  for (const ext of EXTS) {
    const rel = `og/${section}/${slug}.${ext}`;
    if (fs.existsSync(path.join(ROOT, rel))) return `/yonkoma/${rel}`;
  }
  return null;
}

export interface YonkomaItem {
  section: YonkomaSection;
  slug: string;
  src: string;
  /** ファイル更新時刻。ギャラリーの並び（新しい順）に使う */
  mtime: number;
}

/** 入稿済みの4コマを全部返す（新しい順） */
export function listYonkoma(): YonkomaItem[] {
  const items: YonkomaItem[] = [];
  for (const section of ["glossary", "prompts"] as const) {
    const dir = path.join(ROOT, section);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      const m = file.match(/^(.+)\.(webp|png)$/);
      if (!m) continue;
      /* <slug>-1.png のような動画用のコマ別画像はギャラリーに出さない */
      if (/-\d+$/.test(m[1])) continue;
      items.push({
        section,
        slug: m[1],
        src: `/yonkoma/${section}/${file}`,
        mtime: fs.statSync(path.join(dir, file)).mtimeMs,
      });
    }
  }
  return items.sort((a, b) => b.mtime - a.mtime);
}
