/* ============================================================
   Google Analytics 4 のデータをAPIで取ってきて、ターミナルに
   レポートとして出すスクリプト。GA4の管理画面を開かずに
   「どこで詰まっているか」「何が検索されているか」を見る。

   使い方:
     GA_PROPERTY_ID=123456789 \
     GA_SERVICE_ACCOUNT_JSON=~/ga-key.json \
     npm run ga:report

     期間を変えるとき: npm run ga:report -- --days=7
     生データを見たいとき: npm run ga:report -- --json

   ------------------------------------------------------------
   必要な準備（1回だけ）

   ①Google Cloud で Google Analytics Data API を有効化する
     （課金アカウントの登録は不要。無料の枠内で足りる）
   ②サービスアカウントを作り、JSONキーをダウンロードする
     Google Cloud側のロールは付けなくてよい
   ③GA4の「管理 → プロパティのアクセス管理」で、そのサービス
     アカウントのメールアドレスを【閲覧者】として追加する
   ④GA4の「管理 → カスタム定義」でカスタムディメンションを
     登録する（下の CUSTOM_DIMENSIONS のとおり）

   キーは絶対にリポジトリに置かない。環境変数で渡す。
   GA_SERVICE_ACCOUNT_JSON はファイルパス / JSON文字列 /
   base64 のどれでも受け付ける（CIではbase64が扱いやすい）。

   ------------------------------------------------------------
   ④について（つまずきやすいので）

   GA4は、イベントに付けて送ったパラメータを、管理画面で
   「カスタムディメンション」として登録するまで集計できない。
   登録前に届いたぶんは後から遡って見ることもできない。
   なので、登録は早いほどよい。

   登録する場所:
     GA4 → 管理 → データの表示 → カスタム定義
     → カスタムディメンションを作成
        範囲: イベント
        イベントパラメータ: 下の表の「パラメータ」の文字列
        ディメンション名: 分かればなんでもよい

   未登録のディメンションを使うレポートは、その項目だけ
   スキップして「未登録」と出す。他のレポートは出る。
   ============================================================ */
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

/* このサイトが送っているイベントパラメータ。
   GA4に登録していないと集計できない（上のコメント参照）。 */
const CUSTOM_DIMENSIONS = [
  { param: "course", note: "教習所のコースID" },
  { param: "step", note: "離脱したステップ番号" },
  { param: "steps", note: "コースの全ステップ数" },
  { param: "search_term", note: "AI司書で検索された言葉" },
  { param: "network", note: "シェア先（x / hatena）" },
  { param: "path", note: "シェア元のページ" },
  { param: "place", note: "ボタンの置き場所（result / top など）" },
];

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const API = "https://analyticsdata.googleapis.com/v1beta";

/* ---------- 認証（依存パッケージを足さずにJWTを自前で作る） ---------- */

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function loadCredentials() {
  const raw = process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "環境変数 GA_SERVICE_ACCOUNT_JSON がありません。\n" +
        "サービスアカウントのJSONキーのパス、JSON本文、base64のいずれかを入れてください。",
    );
  }
  let text = raw.trim();
  /* ①ファイルパス ②JSON本文 ③base64 の順に見る */
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

async function getAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: creds.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(creds.private_key, "base64url");
  const assertion = `${header}.${claims}.${signature}`;

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
    throw new Error(`アクセストークンを取得できませんでした: ${body.error_description ?? res.status}`);
  }
  return body.access_token;
}

/* ---------- Data API ---------- */

class GaError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runReport(ctx, body) {
  /* 503 / 429 がたまに返るので数回だけ待って引き直す。
     ここで諦めると、その項目だけ空で出てしまい紛らわしい。 */
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(attempt * 1500);
    const res = await fetch(`${API}/properties/${ctx.propertyId}:runReport`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${ctx.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${ctx.days}daysAgo`, endDate: "today" }],
        ...body,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return json;
    lastError = new GaError(json.error?.message ?? `HTTP ${res.status}`, res.status);
    /* 引数の間違いや権限不足は待っても直らないので即やめる */
    if (res.status !== 503 && res.status !== 429 && res.status < 500) break;
  }
  throw lastError;
}

/* レスポンスを [{ 次元1, 次元2, ..., 数値 }] の素直な配列にする */
function rows(report) {
  return (report.rows ?? []).map((r) => ({
    keys: (r.dimensionValues ?? []).map((d) => d.value),
    values: (r.metricValues ?? []).map((m) => Number(m.value)),
  }));
}

function eventFilter(names) {
  return {
    filter: {
      fieldName: "eventName",
      inListFilter: { values: names },
    },
  };
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

function pad(s, n) {
  return s + " ".repeat(Math.max(0, n - width(s)));
}
function padStart(s, n) {
  return " ".repeat(Math.max(0, n - width(s))) + s;
}

function heading(title) {
  console.log(`\n\x1b[1m■ ${title}\x1b[0m`);
}

function table(headers, data) {
  if (data.length === 0) {
    console.log("  （データなし）");
    return;
  }
  const all = [headers, ...data];
  const widths = headers.map((_, i) => Math.max(...all.map((r) => width(String(r[i] ?? "")))));
  const line = (r, dim) =>
    "  " +
    r
      .map((cell, i) => {
        const s = String(cell ?? "");
        /* 数値の列は右寄せ */
        return i === 0 ? pad(s, widths[i]) : padStart(s, widths[i]);
      })
      .join("  ") +
    (dim ? "" : "");
  console.log("\x1b[2m" + line(headers) + "\x1b[0m");
  for (const r of data) console.log(line(r));
}

function num(n) {
  return n.toLocaleString("ja-JP");
}

/* レポート1本ぶんを実行する。カスタムディメンション未登録などで
   失敗しても、そこだけスキップして続きを出す。 */
async function section(title, fn) {
  heading(title);
  try {
    await fn();
  } catch (e) {
    if (e instanceof GaError && /did not match|not.*valid|Field.*is not/i.test(e.message)) {
      console.log("  \x1b[33m未登録のディメンションがあるため出せません。\x1b[0m");
      console.log(`  \x1b[2m${e.message}\x1b[0m`);
      console.log("  \x1b[2mGA4 → 管理 → カスタム定義 で登録すると出るようになります。\x1b[0m");
    } else {
      console.log(`  \x1b[31m取得に失敗: ${e.message}\x1b[0m`);
    }
  }
}

/* ---------- レポート本体 ---------- */

async function main() {
  const args = process.argv.slice(2);
  const days = Number(args.find((a) => a.startsWith("--days="))?.slice(7) ?? 28);
  const asJson = args.includes("--json");

  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) {
    throw new Error(
      "環境変数 GA_PROPERTY_ID がありません。\n" +
        "GA4の「管理 → プロパティの詳細」にある9桁の数字です（G-で始まる測定IDとは別物）。",
    );
  }

  const creds = loadCredentials();
  const token = await getAccessToken(creds);
  const ctx = { propertyId, token, days };

  console.log(`\x1b[1mcomixai.dev アクセス解析\x1b[0m  \x1b[2m直近${days}日間\x1b[0m`);
  console.log(`\x1b[2mプロパティ ${propertyId} / ${creds.client_email}\x1b[0m`);

  if (asJson) {
    /* 加工前のデータがほしいとき用 */
    const raw = await runReport(ctx, {
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      limit: 200,
    });
    console.log(JSON.stringify(raw, null, 2));
    return;
  }

  await section("サマリ", async () => {
    const r = await runReport(ctx, {
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
      ],
    });
    const v = rows(r)[0]?.values ?? [];
    table(
      ["指標", "値"],
      [
        ["ユーザー", num(v[0] ?? 0)],
        ["セッション", num(v[1] ?? 0)],
        ["表示回数", num(v[2] ?? 0)],
        ["平均滞在", `${Math.round(v[3] ?? 0)}秒`],
      ],
    );
  });

  await section("よく見られているページ Top 20", async () => {
    const r = await runReport(ctx, {
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 20,
    });
    table(
      ["ページ", "表示", "ユーザー"],
      rows(r).map((x) => [x.keys[0], num(x.values[0]), num(x.values[1])]),
    );
  });

  await section("流入元 Top 10", async () => {
    const r = await runReport(ctx, {
      dimensions: [{ name: "sessionDefaultChannelGroup" }, { name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    });
    table(
      ["チャネル / 参照元", "セッション"],
      rows(r).map((x) => [`${x.keys[0]} / ${x.keys[1]}`, num(x.values[0])]),
    );
  });

  await section("イベント数", async () => {
    const r = await runReport(ctx, {
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 40,
    });
    table(
      ["イベント", "回数"],
      rows(r).map((x) => [x.keys[0], num(x.values[0])]),
    );
  });

  await section("教習所（/claude-app）のコース別 開始→完了", async () => {
    const r = await runReport(ctx, {
      dimensions: [{ name: "customEvent:course" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventFilter(["course_start", "course_complete", "course_exit"]),
      limit: 200,
    });
    /* コースを行、イベントを列にして完了率まで出す */
    const byCourse = new Map();
    for (const x of rows(r)) {
      const [course, event] = x.keys;
      const rec = byCourse.get(course) ?? { start: 0, complete: 0, exit: 0 };
      if (event === "course_start") rec.start += x.values[0];
      if (event === "course_complete") rec.complete += x.values[0];
      if (event === "course_exit") rec.exit += x.values[0];
      byCourse.set(course, rec);
    }
    const data = [...byCourse.entries()]
      .sort((a, b) => b[1].start - a[1].start)
      .map(([course, v]) => [
        course,
        num(v.start),
        num(v.complete),
        num(v.exit),
        v.start ? `${Math.round((v.complete / v.start) * 100)}%` : "-",
      ]);
    table(["コース", "開始", "完了", "離脱", "完了率"], data);
  });

  await section("どのステップで離脱しているか（course_exit）", async () => {
    const r = await runReport(ctx, {
      dimensions: [{ name: "customEvent:course" }, { name: "customEvent:step" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventFilter(["course_exit"]),
      limit: 300,
    });
    const data = rows(r)
      .sort((a, b) => b.values[0] - a.values[0])
      .map((x) => [x.keys[0], x.keys[1] === "0" ? "開始前" : `${x.keys[1]}ステップ目`, num(x.values[0])]);
    table(["コース", "離脱地点", "回数"], data);
  });

  await section("AI司書で検索された言葉 Top 30", async () => {
    const r = await runReport(ctx, {
      dimensions: [{ name: "customEvent:search_term" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventFilter(["site_search"]),
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 30,
    });
    table(
      ["検索語", "回数"],
      rows(r).map((x) => [x.keys[0], num(x.values[0])]),
    );
  });

  await section("シェアされたページ（share_click）", async () => {
    const r = await runReport(ctx, {
      dimensions: [
        { name: "customEvent:path" },
        { name: "customEvent:place" },
        { name: "customEvent:network" },
      ],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventFilter(["share_click"]),
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 50,
    });
    table(
      ["ページ", "場所", "シェア先", "回数"],
      rows(r).map((x) => [x.keys[0], x.keys[1], x.keys[2], num(x.values[0])]),
    );
  });

  await section("CTAのクリック（cta_click）", async () => {
    const r = await runReport(ctx, {
      dimensions: [{ name: "customEvent:place" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventFilter(["cta_click"]),
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 30,
    });
    table(
      ["場所", "回数"],
      rows(r).map((x) => [x.keys[0], num(x.values[0])]),
    );
  });

  console.log(
    "\n\x1b[2m登録が必要なカスタムディメンション: " +
      CUSTOM_DIMENSIONS.map((d) => d.param).join(" / ") +
      "\x1b[0m",
  );
}

main().catch((e) => {
  console.error(`\n\x1b[31m${e.message}\x1b[0m\n`);
  process.exit(1);
});
