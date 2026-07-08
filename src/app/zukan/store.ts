"use client";
/* ============================================================
   COMIXAI図鑑の進捗ストア。
   訪問者のブラウザ（localStorage）にだけ記録される。
   サーバー・DB・アカウントは不要（端末をまたぐ同期はしない）。
   各ゲームがクリア時に unlock() を呼び、図鑑ページが読む。
   ============================================================ */

const KEY = "comixai-zukan-v1";

export type ZukanData = Record<string, Record<string, number>>;

export function loadZukan(): ZukanData {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as ZukanData;
  } catch {
    return {};
  }
}

/** 実績を解除する（すでに解除済みなら何もしない） */
export function unlock(category: string, id: string): void {
  if (typeof window === "undefined") return;
  try {
    const d = loadZukan();
    d[category] ??= {};
    if (d[category][id]) return;
    d[category][id] = Date.now();
    localStorage.setItem(KEY, JSON.stringify(d));
    window.dispatchEvent(new CustomEvent("zukan-unlock", { detail: { category, id } }));
  } catch {
    /* プライベートブラウズ等で保存できなくても、遊びには支障なし */
  }
}

export function isUnlocked(d: ZukanData, category: string, id: string): boolean {
  return Boolean(d[category]?.[id]);
}

export function resetZukan(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
