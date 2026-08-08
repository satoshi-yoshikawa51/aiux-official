/* ============================================================
   ga-report.mjs / sc-report.mjs で共通に使う部品。

   ①Googleのサービスアカウント認証（依存パッケージなし）
   ②ターミナルに表を出す（日本語で桁が揃うように全角を2で数える）

   認証はどちらのスクリプトも同じサービスアカウントを使う。
   違うのはスコープ（GAは analytics.readonly、Search Console は
   webmasters.readonly）だけ。
   ============================================================ */
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

/* ---------- 認証 ---------- */

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/* GA_SERVICE_ACCOUNT_JSON は ①ファイルパス ②JSON本文 ③base64 の
   どれでも受け付ける（CIではbase64が扱いやすい）。
   キーは絶対にリポジトリに置かない。 */
export function loadCredentials() {
  const raw = process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "環境変数 GA_SERVICE_ACCOUNT_JSON がありません。\n" +
        "サービスアカウントのJSONキーのパス、JSON本文、base64のいずれかを入れてください。",
    );
  }
  let text = raw.trim();
  if (!text.startsWith("{")) {
    try {
      text = readFileSync(text.replace(/^~/, process.env.HOME ?? "~"), "utf8").trim();
    } catch {
      text = Buffer.from(text, "base64").toString("utf8").trim();
    }
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("GA_SERVICE_ACCOUNT_JSON をJSONとして読めませんでした。");
  }
  if (!json.client_email || !json.private_key) {
    throw new Error("JSONキーに client_email / private_key がありません。");
  }
  return json;
}

/* サービスアカウントのJWTを自前で署名してアクセストークンに交換する。
   googleapis パッケージを入れずに済ませるため。 */
export async function getAccessToken(creds, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: creds.client_email,
      scope,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${signer.sign(creds.private_key, "base64url")}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `アクセストークンを取得できませんでした: ${body.error_description ?? res.status}`,
    );
  }
  return body.access_token;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 503 / 429 がたまに返るので数回だけ待って引き直す。
   ここで諦めると、その項目だけ空で出てしまい紛らわしい。 */
export async function postJson(url, token, body) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(attempt * 1500);
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return json;
    lastError = new ApiError(json.error?.message ?? `HTTP ${res.status}`, res.status);
    /* 引数の間違いや権限不足は待っても直らないので即やめる */
    if (res.status !== 503 && res.status !== 429 && res.status < 500) break;
  }
  throw lastError;
}

/* ---------- 表示 ---------- */

/* 全角を2文字ぶんとして数える。日本語混じりでも桁が揃うように */
function width(s) {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    w += (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe6f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd)
      ? 2
      : 1;
  }
  return w;
}

const pad = (s, n) => s + " ".repeat(Math.max(0, n - width(s)));
const padStart = (s, n) => " ".repeat(Math.max(0, n - width(s))) + s;

export function heading(title) {
  console.log(`\n\x1b[1m■ ${title}\x1b[0m`);
}

/* 1列目は左寄せ、それ以降（数値）は右寄せ */
export function table(headers, data) {
  if (data.length === 0) {
    console.log("  （データなし）");
    return;
  }
  const all = [headers, ...data];
  const widths = headers.map((_, i) => Math.max(...all.map((r) => width(String(r[i] ?? "")))));
  const line = (r) =>
    "  " +
    r
      .map((cell, i) => {
        const s = String(cell ?? "");
        return i === 0 ? pad(s, widths[i]) : padStart(s, widths[i]);
      })
      .join("  ");
  console.log("\x1b[2m" + line(headers) + "\x1b[0m");
  for (const r of data) console.log(line(r));
}

export const num = (n) => n.toLocaleString("ja-JP");

/* レポート1本ぶんを実行する。1つ失敗しても続きを出す。
   hint は「よくある原因」の案内文（未登録・未設定など）。 */
export async function section(title, fn, hint) {
  heading(title);
  try {
    await fn();
  } catch (e) {
    console.log(`  \x1b[31m取得に失敗: ${e.message}\x1b[0m`);
    if (hint) console.log(`  \x1b[2m${hint}\x1b[0m`);
  }
}

/* --days=7 のような引数を読む */
export function argNumber(name, fallback) {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
}
