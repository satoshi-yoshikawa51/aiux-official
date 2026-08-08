/* ============================================================
   Google Search Console のデータをAPIで取ってきて、ターミナルに
   レポートとして出すスクリプト。
   「Googleでどう検索されて、何位で、クリックされているか」を見る。

   使い方:
     GA_SERVICE_ACCOUNT_JSON=~/ga-key.json npm run sc:report

     期間を変えるとき: npm run sc:report -- --days=90
     サイトを指定するとき: SC_SITE_URL=sc-domain:comixai.dev
     権限のあるサイト一覧: npm run sc:report -- --sites

   サービスアカウントは ga:report と同じものを使う（キーの環境変数も
   GA_SERVICE_ACCOUNT_JSON で共通）。スコープだけ違う。

   ------------------------------------------------------------
   必要な準備（1回だけ）

   ①Google Cloud で「Google Search Console API」を有効化する
     GA4用に有効化した Analytics Data API とは別のAPIなので、
     もう一度検索して有効化する。課金アカウントは不要。
   ②Search Console → 設定 → ユーザーと権限 → ユーザーを追加
     サービスアカウントのメールアドレスを【制限付き】で追加する
     （データを見るだけなら制限付きで足りる）

   SC_SITE_URL を省略すると、権限のあるサイトから comixai.dev を
   自動で選ぶ。ドメインプロパティなら sc-domain:comixai.dev、
   URLプレフィックスなら https://comixai.dev/ という形式になる。

   ------------------------------------------------------------
   注意: Search Console のデータは2日ほど遅れて入る。
   そのため集計期間は「3日前まで」で取っている（下の LAG_DAYS）。
   直近の数字が見たくても、そこは待つしかない。
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

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const API = "https://searchconsole.googleapis.com/webmasters/v3";
const LAG_DAYS = 3;

const ymd = (d) => d.toISOString().slice(0, 10);
function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return ymd(d);
}

/* 権限のあるサイト一覧。SC_SITE_URL の自動判定にも使う */
async function listSites(token) {
  const res = await fetch(`${API}/sites`, { headers: { authorization: `Bearer ${token}` } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json.error?.message ?? String(res.status);
    /* つまずくのはだいたいこの2つ。どちらかを名指しで案内する */
    const hint = /has not been used|is disabled/.test(message)
      ? "Google Cloud で「Google Search Console API」を有効化してください（Analytics Data API とは別物です）。"
      : "Search Console →設定 →ユーザーと権限 で、サービスアカウントを【制限付き】で追加してください。";
    throw new Error(`サイト一覧を取得できませんでした: ${message}\n${hint}`);
  }
  return json.siteEntry ?? [];
}

async function query(ctx, body) {
  const url = `${API}/sites/${encodeURIComponent(ctx.siteUrl)}/searchAnalytics/query`;
  const json = await postJson(url, ctx.token, {
    startDate: ctx.startDate,
    endDate: ctx.endDate,
    type: "web",
    ...body,
  });
  return json.rows ?? [];
}

const pct = (n) => `${(n * 100).toFixed(1)}%`;
const pos = (n) => n.toFixed(1);

/* クリック数だけで並べると、0クリックの行が同数で並んで
   アルファベット順になってしまう。表示回数を第2キーにする。 */
const byClicks = (a, b) => b.clicks - a.clicks || b.impressions - a.impressions;
const byImpressions = (a, b) => b.impressions - a.impressions || b.clicks - a.clicks;

/* 長い検索語（AIへの指示文がまるごと入ってくることがある）で
   表が横に伸びきらないように切る */
function clip(s, max = 44) {
  return [...s].length > max ? [...s].slice(0, max - 1).join("") + "…" : s;
}

async function main() {
  const days = argNumber("days", 28);
  const creds = loadCredentials();
  const token = await getAccessToken(creds, SCOPE);

  const drillPage = process.argv.slice(2).find((a) => a.startsWith("--page="))?.slice(7);
  const sites = await listSites(token);
  if (process.argv.includes("--sites")) {
    console.log("権限のあるサイト:");
    for (const s of sites) console.log(`  ${s.siteUrl}  (${s.permissionLevel})`);
    return;
  }

  const siteUrl =
    process.env.SC_SITE_URL ??
    sites.find((s) => s.siteUrl.includes("comixai.dev"))?.siteUrl ??
    sites[0]?.siteUrl;
  if (!siteUrl) {
    throw new Error(
      "見られるサイトがありません。\n" +
        "Search Console → 設定 → ユーザーと権限 で\n" +
        `${creds.client_email} を【制限付き】で追加してください。`,
    );
  }

  const ctx = {
    token,
    siteUrl,
    startDate: daysAgo(days + LAG_DAYS),
    endDate: daysAgo(LAG_DAYS),
  };
  /* 同じ長さのひとつ前の期間。増えたのか減ったのかを見るため */
  const prev = {
    ...ctx,
    startDate: daysAgo(days * 2 + LAG_DAYS),
    endDate: daysAgo(days + LAG_DAYS + 1),
  };

  console.log(`\x1b[1mcomixai.dev 検索パフォーマンス\x1b[0m  \x1b[2m${ctx.startDate} 〜 ${ctx.endDate}\x1b[0m`);
  console.log(`\x1b[2m${siteUrl} / ${creds.client_email}\x1b[0m`);

  /* --page=/calendar のように渡すと、そのページ1枚が
     どんな検索語で出ているかだけを見る。タイトルや説明文を
     書き直す前に、ずれているのが順位なのか文言なのかを確かめる。 */
  if (drillPage) {
    await section(`${drillPage} が出ている検索語`, async () => {
      const rows = await query(ctx, {
        dimensions: ["query"],
        rowLimit: 100,
        dimensionFilterGroups: [
          {
            filters: [
              { dimension: "page", operator: "equals", expression: `https://comixai.dev${drillPage}` },
            ],
          },
        ],
      });
      table(
        ["検索語", "表示", "クリック", "CTR", "順位"],
        rows
          .sort(byImpressions)
          .map((r) => [clip(r.keys[0]), num(r.impressions), num(r.clicks), pct(r.ctr), pos(r.position)]),
      );
    });
    return;
  }

  await section("サマリ（前の同じ期間との比較）", async () => {
    const [now, before] = await Promise.all([query(ctx, {}), query(prev, {})]);
    const a = now[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const b = before[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const diff = (x, y, fmt = num) => (b.impressions === 0 ? "-" : `${x > y ? "+" : ""}${fmt(x - y)}`);
    table(
      ["指標", "今回", "前回", "差"],
      [
        ["クリック", num(a.clicks), num(b.clicks), diff(a.clicks, b.clicks)],
        ["表示回数", num(a.impressions), num(b.impressions), diff(a.impressions, b.impressions)],
        ["CTR", pct(a.ctr), pct(b.ctr), diff(a.ctr, b.ctr, pct)],
        /* 掲載順位は小さいほど良いので、下がった＝改善 */
        ["平均掲載順位", pos(a.position), pos(b.position), diff(a.position, b.position, pos)],
      ],
    );
  });

  /* クエリは1回だけ多めに取って、そこから3種類の見方を作る */
  /* クエリは1回だけ多めに取って、そこから何通りかの見方を作る */
  let queries = [];
  await section("クリックされている検索語 Top 20", async () => {
    queries = await query(ctx, { dimensions: ["query"], rowLimit: 5000 });
    table(
      ["検索語", "クリック", "表示", "CTR", "順位"],
      queries
        .slice()
        .sort(byClicks)
        .slice(0, 20)
        .map((r) => [clip(r.keys[0]), num(r.clicks), num(r.impressions), pct(r.ctr), pos(r.position)]),
    );
  });

  await section("表示されている検索語 Top 20（クリックの有無を問わず）", async () => {
    /* 「Googleが何のページとして認識しているか」が出る */
    table(
      ["検索語", "表示", "クリック", "順位"],
      queries
        .slice()
        .sort(byImpressions)
        .slice(0, 20)
        .map((r) => [clip(r.keys[0]), num(r.impressions), num(r.clicks), pos(r.position)]),
    );
  });

  await section("あと一歩の検索語（8〜30位・表示5回以上）", async () => {
    /* 1ページ目の下〜3ページ目。ここを押し上げるのが一番効率がいい。
       ここが空なら、そもそも上位に食い込めているクエリが無いということ。 */
    const data = queries
      .filter((r) => r.position >= 8 && r.position <= 30 && r.impressions >= 5)
      .sort(byImpressions)
      .slice(0, 30);
    table(
      ["検索語", "表示", "クリック", "順位"],
      data.map((r) => [clip(r.keys[0]), num(r.impressions), num(r.clicks), pos(r.position)]),
    );
  });

  await section("順位は取れているのに押されない検索語（10位以内・CTR2%未満）", async () => {
    /* 見えてはいるのにクリックされない＝タイトルや説明文が弱い可能性 */
    const data = queries
      .filter((r) => r.position <= 10 && r.impressions >= 10 && r.ctr < 0.02)
      .sort(byImpressions)
      .slice(0, 20);
    table(
      ["検索語", "表示", "クリック", "CTR", "順位"],
      data.map((r) => [clip(r.keys[0]), num(r.impressions), num(r.clicks), pct(r.ctr), pos(r.position)]),
    );
  });

  /* ページも1回取って2通りに使う */
  let pages = [];
  await section("検索で見られているページ Top 20（表示回数順）", async () => {
    pages = await query(ctx, { dimensions: ["page"], rowLimit: 1000 });
    table(
      ["ページ", "表示", "クリック", "CTR", "順位"],
      pages
        .slice()
        .sort(byImpressions)
        .slice(0, 20)
        .map((r) => [
          /* ドメインを落としてパスだけにする */
          r.keys[0].replace(/^https?:\/\/[^/]+/, "") || "/",
          num(r.impressions),
          num(r.clicks),
          pct(r.ctr),
          pos(r.position),
        ]),
    );
  });

  await section("順位は取れているのに押されないページ（10位以内・表示10回以上・CTR2%未満）", async () => {
    /* 検索語のほうで同じ切り口を見ても、検索回数の少ないクエリは
       Googleが匿名化して返さないので取りこぼす。ページ単位なら見える。 */
    const data = pages
      .filter((r) => r.position <= 10 && r.impressions >= 10 && r.ctr < 0.02)
      .sort(byImpressions)
      .slice(0, 20);
    table(
      ["ページ", "表示", "クリック", "順位"],
      data.map((r) => [
        r.keys[0].replace(/^https?:\/\/[^/]+/, "") || "/",
        num(r.impressions),
        num(r.clicks),
        pos(r.position),
      ]),
    );
  });

  await section("埋もれているページ（30位より下・表示5回以上）", async () => {
    /* 検索結果には出ているが、誰も辿り着けない深さにいるページ。
       表示があるということは需要はあるので、伸ばす候補になる。 */
    const data = pages
      .filter((r) => r.position > 30 && r.impressions >= 5)
      .sort(byImpressions)
      .slice(0, 25);
    table(
      ["ページ", "表示", "順位"],
      data.map((r) => [
        r.keys[0].replace(/^https?:\/\/[^/]+/, "") || "/",
        num(r.impressions),
        pos(r.position),
      ]),
    );
  });

  await section("デバイス別", async () => {
    const rows = await query(ctx, { dimensions: ["device"], rowLimit: 10 });
    table(
      ["デバイス", "クリック", "表示", "CTR", "順位"],
      rows.map((r) => [
        r.keys[0],
        num(r.clicks),
        num(r.impressions),
        pct(r.ctr),
        pos(r.position),
      ]),
    );
  });

  console.log(
    `\n\x1b[2mSearch Console のデータは2日ほど遅れて入るため、${LAG_DAYS}日前までで集計しています。\x1b[0m`,
  );
}

main().catch((e) => {
  console.error(`\n\x1b[31m${e.message}\x1b[0m\n`);
  process.exit(1);
});
