/* ============================================================
   記録の持ち出し（書き出し／読み込み）。

   ▍なぜ要るのか
   進捗はこの端末の中にしか無い（→ store/progress.tsx）。集めた舞台も
   色違いも復習の進み具合も、**端末を変えたら全部消える**。とくにいまは
   Webのプレビューを触っているので、Safariの「Webサイトデータを消去」
   ひとつで飛ぶ。サーバもアカウントも作らずに守る手が、この持ち出し。

   ▍やっていること
   保存はキー1個のJSONなので、封筒をかぶせて文字列にして渡すだけ。
   貼り戻せば、別の端末でも、Web版からアプリ版への引っ越しでも復元できる。

   ▍読み込みは疑ってかかる
   渡ってくる文字列は、切れているかもしれないし、別のアプリのものかも
   しれない。**そのまま state に入れると画面が壊れる**ので、1項目ずつ
   型を見て、知らないIDは既定値に落とす。壊れていたら理由を返して、
   いまの記録には指一本触れない。
   ============================================================ */
import { Platform } from 'react-native';

import { AVATARS, DEFAULT_SKIN_ID, migrateAvatars, SKINS } from '@/data/avatars';
import { DEFAULT_THEME_ID, THEMES } from '@/data/gacha';
import { ROLES } from '@/data/roles';
import type { RoleId } from '@/data/types';
import { EMPTY, type GameRecord, type ProgressState, type QuizRecord } from '@/store/progress';

/** 封筒の名札。よそのJSONを間違って読み込まないための目印 */
const APP = 'comixai-academy';
/** 封筒の版。中身の形を変えたら上げる（読む側は古い版も受け取れるようにする） */
const SAVE_VERSION = 1;

interface Envelope {
  app: string;
  v: number;
  savedAt: number;
  data: unknown;
}

/** 読み込む前に「何が入っているか」を見せるための要約 */
export interface SaveSummary {
  savedAt: number;
  lessons: number;
  badges: number;
  coins: number;
  themes: number;
  avatars: number;
}

export type DecodeResult =
  | { ok: true; state: ProgressState; summary: SaveSummary }
  | { ok: false; reason: string };

/* ———————————————— 書き出し ———————————————— */

export function encodeSave(state: ProgressState, now = Date.now()): string {
  const envelope: Envelope = { app: APP, v: SAVE_VERSION, savedAt: now, data: state };
  return JSON.stringify(envelope);
}

/** 書き出したファイルの名前。日付を入れて、複数取っておけるようにする */
export function saveFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `comixai-academy-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}.json`;
}

/* ———————————————— ファイルでやりとりする（Webだけ） ————————————————

   ▍いちばん失いやすいのがWeb版だから、ここだけ手厚くする
   ホーム画面に置いたWeb版はSafariの「Webサイトデータを消去」で消える。
   クリップボードは**次に何かをコピーした時点で上書きされる**ので、
   置き場所としては弱い。ファイルなら「ファイル」アプリに残せる。
   ネイティブ版は端末のバックアップに乗るので、貼り付けだけで足りる。 */

export const CAN_USE_FILE = Platform.OS === 'web';

/** 記録をJSONファイルとして落とす */
export function downloadSave(text: string, fileName = saveFileName()): void {
  if (!CAN_USE_FILE) return;
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  /* すぐ剥がすと保存が始まらない端末があるので、ひと呼吸おいて捨てる */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** ファイルを選ばせて中身を読む。選ばずに閉じたら null */
export function pickSaveFile(): Promise<string | null> {
  if (!CAN_USE_FILE) return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,text/plain';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file
        .text()
        .then(resolve)
        .catch(() => resolve(null));
    };
    /* 閉じただけのときは onchange が来ない。**待ちっぱなしにしない**ため、
       画面に戻ってきたら諦める（選んでいれば onchange が先に走る） */
    window.addEventListener('focus', () => setTimeout(() => resolve(null), 800), { once: true });
    input.click();
  });
}

/* ———————————————— 読み込み ———————————————— */

export function decodeSave(text: string): DecodeResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: '文字列が空です。' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, reason: '記録の形になっていません。コピーの途中で切れていませんか。' };
  }
  if (!isObj(parsed)) return { ok: false, reason: '記録の形になっていません。' };
  if (parsed.app !== APP) {
    return { ok: false, reason: 'このアプリの記録ではないようです。' };
  }
  /* 未来の版は読まない。**知らない形を推測で入れるほうが危ない**
     （新しい端末で書き出して、古いアプリに読ませたときに起きる） */
  if (typeof parsed.v !== 'number' || parsed.v > SAVE_VERSION) {
    return { ok: false, reason: 'アプリが古いようです。更新してからもう一度どうぞ。' };
  }
  if (!isObj(parsed.data)) return { ok: false, reason: '記録の中身が空です。' };

  /* ▍読み替えは sanitize より**先**にやる
     書き出したのが改名より前かもしれない（古い端末から持ってきた記録が
     いちばん当たりやすい）。sanitize は台帳に無いIDを既定値に落とすので、
     あとに回すと 'sensei' が null になってから渡ることになり、
     読み替えるものが残らない（→ data/avatars.ts） */
  const state = sanitize({
    ...parsed.data,
    ...migrateAvatars({
      avatarId: typeof parsed.data.avatarId === 'string' ? parsed.data.avatarId : null,
      skins: numMap(parsed.data.skins),
    }),
  });
  const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0;
  return {
    ok: true,
    state,
    summary: {
      savedAt,
      lessons: Object.keys(state.done).length,
      badges: Object.keys(state.badges).length,
      coins: state.coins,
      themes: Object.keys(state.themes).length,
      avatars: Object.keys(state.skins).length,
    },
  };
}

/** 何が来ても ProgressState の形にして返す。おかしいものは既定値に落とす */
function sanitize(raw: Record<string, unknown>): ProgressState {
  return {
    version: 1,
    avatarId: pickId(raw.avatarId, AVATARS.map((a) => a.id), null),
    roleId: pickId(raw.roleId, ROLES.map((r) => r.id), null) as RoleId | null,
    done: numMap(raw.done),
    perfect: numMap(raw.perfect),
    badges: numMap(raw.badges),
    days: strList(raw.days).slice(0, 60),
    seenTitle: str(raw.seenTitle, EMPTY.seenTitle),
    seenOpening: bool(raw.seenOpening, EMPTY.seenOpening),
    seenIntro: bool(raw.seenIntro, EMPTY.seenIntro),
    seenTutorial: bool(raw.seenTutorial, EMPTY.seenTutorial),
    gachaCoinsGiven: bool(raw.gachaCoinsGiven, EMPTY.gachaCoinsGiven),
    seenGachaTutorial: bool(raw.seenGachaTutorial, EMPTY.seenGachaTutorial),
    dryStreak: Math.max(0, Math.round(num(raw.dryStreak, 0))),
    quiz: quizMap(raw.quiz),
    games: gameMap(raw.games),
    exams: numMap(raw.exams),
    extras: numMap(raw.extras),
    coins: Math.max(0, Math.round(num(raw.coins, 0))),
    lastBonusDay: str(raw.lastBonusDay, EMPTY.lastBonusDay),
    lastShareDay: str(raw.lastShareDay, EMPTY.lastShareDay),
    shareCount: Math.max(0, Math.round(num(raw.shareCount, 0))),
    themes: numMap(raw.themes),
    /* 装備は**持っていないものを指していたら**既定に戻す。
       ホームは装備中のIDで絵を引くので、ここが外れると背景が消える */
    themeId: pickId(raw.themeId, THEMES.map((t) => t.id), DEFAULT_THEME_ID) ?? DEFAULT_THEME_ID,
    skins: numMap(raw.skins),
    skinId: pickId(raw.skinId, SKINS.map((s) => s.id), DEFAULT_SKIN_ID) ?? DEFAULT_SKIN_ID,
    soundOn: bool(raw.soundOn, EMPTY.soundOn),
    musicOn: bool(raw.musicOn, EMPTY.musicOn),
  };
}

/* ———————————————— 小道具 ———————————————— */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

/** 台帳に載っているIDだけ通す。載っていなければ既定値 */
function pickId(v: unknown, known: string[], fallback: string | null): string | null {
  if (typeof v !== 'string') return fallback;
  // 色違いの「ノーマル」は '' なので、空文字も正当な値として通す
  if (v === '' && fallback === DEFAULT_SKIN_ID) return v;
  return known.includes(v) ? v : fallback;
}

/** ID -> 時刻(ms) の表。数でないものは捨てる */
function numMap(v: unknown): Record<string, number> {
  if (!isObj(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && Number.isFinite(val)) out[k] = val;
  }
  return out;
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function quizMap(v: unknown): Record<string, QuizRecord> {
  if (!isObj(v)) return {};
  const out: Record<string, QuizRecord> = {};
  for (const [k, val] of Object.entries(v)) {
    if (!isObj(val)) continue;
    out[k] = {
      due: Math.max(0, num(val.due, 0)),
      streak: Math.max(0, Math.round(num(val.streak, 0))),
      wrong: Math.max(0, Math.round(num(val.wrong, 0))),
      // 「同じ日に2段進めない」の印。古い記録には無いので、無ければ無いまま
      ...(typeof val.day === 'string' ? { day: val.day } : {}),
    };
  }
  return out;
}

function gameMap(v: unknown): Record<string, GameRecord> {
  if (!isObj(v)) return {};
  const out: Record<string, GameRecord> = {};
  for (const [k, val] of Object.entries(v)) {
    if (!isObj(val)) continue;
    out[k] = {
      // ★は1〜3。ここが外れると成績の表示が崩れる
      stars: Math.min(3, Math.max(0, Math.round(num(val.stars, 0)))),
      misses: Math.max(0, Math.round(num(val.misses, 0))),
      ms: Math.max(0, Math.round(num(val.ms, 0))),
      plays: Math.max(0, Math.round(num(val.plays, 0))),
    };
  }
  return out;
}
