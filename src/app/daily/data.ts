/* ============================================================
   日刊4コマ（/daily）のデータ。

   entries.json は scripts/generate-daily-manga.mjs が毎朝
   追記する自動生成ファイル。手で編集しない。
   ここは型付けと取り出しヘルパだけを持つ。
   ============================================================ */
import entriesJson from "./entries.json";

/** 4コマのうちの1コマ */
export interface DailyPanel {
  /** そのコマに出る人。左→右の順で描かれる */
  cast: { char: string; expr: string }[];
  /** castの何番目が喋るか */
  speaker: number;
  line: string;
  note?: string;
}

export interface DailyEntry {
  /** YYYY-MM-DD（JST）。そのままURLになる */
  date: string;
  title: string;
  /** 話題を1〜2文で説明するリード。ページの導入とmeta descriptionに使う */
  lead: string;
  source: { title: string; url: string; name: string };
  panels: DailyPanel[];
  /** 関連するAI用語集のslug */
  terms: string[];
  /** 吉川の一言 */
  takeaway: string;
  /** Xへ流す文言 */
  share: string;
  image: string;
  og: string;
  /** キャラ絵がまだ仮素材のとき true */
  placeholderArt?: boolean;
}

export const DAILY_ENTRIES: DailyEntry[] = (entriesJson.entries ?? []) as DailyEntry[];

/** 日付降順の先頭 ＝ 最新回 */
export const LATEST_DAILY: DailyEntry | undefined = DAILY_ENTRIES[0];

export const DAILY_UPDATED = LATEST_DAILY?.date ?? "2026-08-05";

export function getDaily(date: string): DailyEntry | undefined {
  return DAILY_ENTRIES.find((e) => e.date === date);
}

/** 前後の回（一覧は日付降順なので、次＝新しい・前＝古い） */
export function neighborsOf(date: string): { newer?: DailyEntry; older?: DailyEntry } {
  const i = DAILY_ENTRIES.findIndex((e) => e.date === date);
  if (i < 0) return {};
  return { newer: DAILY_ENTRIES[i - 1], older: DAILY_ENTRIES[i + 1] };
}

/** 2026-08-05 → 2026年8月5日（火） */
export function formatDailyDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const wd = ["日", "月", "火", "水", "木", "金", "土"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}年${m}月${d}日（${wd}）`;
}
