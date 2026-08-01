/* ============================================================
   Google Analytics 4 のデータをAPIで取ってきて、ターミナルに
   レポートとして出すスクリプト。GA4の管理画面を開かずに
   「どこで詰まっているか」「何が検索されているか」を見る。

   使い方:
     GA_PROPERTY_ID=540523898 \
     GA_SERVICE_ACCOUNT_JSON=~/ga-key.json \
     npm run ga:report

     期間を変えるとき: npm run ga:report -- --days=7
     生データを見たいとき: npm run ga:report -- --json

   検索順位のほうは sc-report.mjs（npm run sc:report）。
   認証と表示は report-lib.mjs に置いて共通にしてある。

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

   ------------------------------------------------------------
   ④について（つまずきやすいので）

   GA4は、イベントに付けて送ったパラメータを、管理画面で
   「カスタムディメンション」として登録するまで集計できない。
   登録前に届いたぶんは後から遡って見ることもできない。
   登録した直後は (not set) ばかりになるが、これは失敗ではなく
   「登録より前のデータ」という意味。数日待てば埋まる。

   登録する場所:
     GA4 → 管理 → データの表示 → カスタム定義
     → カスタムディメンションを作成
        範囲: イベント
        イベントパラメータ: 下の CUSTOM_DIMENSIONS の param
   ============================================================ */
import {
  loadCredentials,
  getAccessToken,
  postJson,
  table,
  num,
  section,
  argNumber,
} from "./report-lib.mjs";

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

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const API = "https://analyticsdata.googleapis.com/v1beta";
const DIM_HINT = "カスタムディメンションが未登録かもしれません（GA4 → 管理 → カスタム定義）。";

async function runReport(ctx, body) {
  return postJson(`${API}/properties/${ctx.propertyId}:runReport`, ctx.token, {
    dateRanges: [{ startDate: `${ctx.days}daysAgo`, endDate: "today" }],
    ...body,
  });
}

/* レスポンスを [{ keys: [...], values: [...] }] の素直な配列にする */
function rows(report) {
  return (report.rows ?? []).map((r) => ({
    keys: (r.dimensionValues ?? []).map((d) => d.value),
    values: (r.metricValues ?? []).map((m) => Number(m.value)),
  }));
}

function eventFilter(names) {
  return { filter: { fieldName: "eventName", inListFilter: { values: names } } };
}

async function main() {
  const days = argNumber("days", 28);
  const asJson = process.argv.includes("--json");

  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) {
    throw new Error(
      "環境変数 GA_PROPERTY_ID がありません。\n" +
        "GA4の「管理 → プロパティの詳細」にある9桁の数字です（G-で始まる測定IDとは別物）。",
    );
  }

  const creds = loadCredentials();
  const token = await getAccessToken(creds, SCOPE);
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

  await section(
    "教習所（/claude-app）のコース別 開始→完了",
    async () => {
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
    },
    DIM_HINT,
  );

  await section(
    "どのステップで離脱しているか（course_exit）",
    async () => {
      const r = await runReport(ctx, {
        dimensions: [{ name: "customEvent:course" }, { name: "customEvent:step" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: eventFilter(["course_exit"]),
        limit: 300,
      });
      const data = rows(r)
        .sort((a, b) => b.values[0] - a.values[0])
        .map((x) => [
          x.keys[0],
          x.keys[1] === "0" ? "開始前" : `${x.keys[1]}ステップ目`,
          num(x.values[0]),
        ]);
      table(["コース", "離脱地点", "回数"], data);
    },
    DIM_HINT,
  );

  await section(
    "AI司書で検索された言葉 Top 30",
    async () => {
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
    },
    DIM_HINT,
  );

  await section(
    "シェアされたページ（share_click）",
    async () => {
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
    },
    DIM_HINT,
  );

  await section(
    "CTAのクリック（cta_click）",
    async () => {
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
    },
    DIM_HINT,
  );

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
