/* ============================================================
   Vercelの古いプレビューデプロイを削除するスクリプト。

   ▍なぜ要るか
   Vercelは過去のデプロイの成果物を全部保管し続け、その合計が
   Deployment Storage（無料枠10GB）に数えられる。このリポジトリは
   1回のデプロイが重く（サイトはpublic/だけで約60MB、アカデミーは
   アセット85MB）、PRのプレビューと毎朝のニュース自動更新の積み重ねで
   実際に10GBを使い切った（2026-09、Vercelから通知）。
   マージ済みPRのプレビューは誰も見ないのに、消すまで残る。

   ▍消すもの・残すもの
   - 消す: プレビュー（target が production でないもの）のうち、
     PRUNE_DAYS（既定30日）より古いもの
   - 残す: 本番（production）は年齢に関係なく全部。
     さらに各プロジェクトの**いちばん新しいプレビュー1件**は、
     どれだけ古くても残す——ブランチ固定のプレビューURLは
     「そのブランチの直近ビルド」を指すので、全部消すと
     開きっぱなしの確認用URLが死ぬため

   ▍動かし方
   GitHub Actions（.github/workflows/prune-vercel.yml、週1＋手動）から
   VERCEL_TOKEN を渡されて動く。トークンはVercelの
   Account Settings → Tokens で作り、リポジトリSecretsに置く。
   **トークンをリポジトリにもログにも書かないこと。**
   ============================================================ */

const TOKEN = process.env.VERCEL_TOKEN;
const DAYS = Number(process.env.PRUNE_DAYS || 30);
if (!TOKEN) {
  console.error('VERCEL_TOKEN がありません。リポジトリSecretsに設定してから動かしてください。');
  process.exit(1);
}
if (!Number.isFinite(DAYS) || DAYS < 3) {
  /* 誤って 0 などを渡すと全プレビューが消える。下限で受け止める */
  console.error(`PRUNE_DAYS=${process.env.PRUNE_DAYS} は使えません（3以上の日数を指定）。`);
  process.exit(1);
}
const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;

async function api(method, path) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 個人スコープと所属チームの両方を見る。このアカウントは無料の
   「チーム」（…-projects）にプロジェクトがぶら下がっているため、
   チームを見ないと1件も見つからない */
const teams = (await api('GET', '/v2/teams?limit=100')).teams ?? [];
const scopes = [
  { q: '', label: '個人' },
  ...teams.map((t) => ({ q: `&teamId=${t.id}`, label: t.name || t.slug })),
];

let totalDeleted = 0;
for (const scope of scopes) {
  let projects = [];
  try {
    projects = (await api('GET', `/v9/projects?limit=100${scope.q}`)).projects ?? [];
  } catch (e) {
    /* トークンの権限がスコープ限定だと個人側が403になる。飛ばして続ける */
    console.warn(`[${scope.label}] プロジェクト一覧が読めないので飛ばす: ${String(e).slice(0, 120)}`);
    continue;
  }

  for (const p of projects) {
    /* 新しい順に返る。ページ送りは pagination.next（タイムスタンプ）を until に渡す */
    const victims = [];
    let keptNewestPreview = false;
    let until = '';
    for (;;) {
      const page = await api(
        'GET',
        `/v6/deployments?projectId=${p.id}&limit=100${scope.q}${until ? `&until=${until}` : ''}`,
      );
      for (const d of page.deployments ?? []) {
        if (d.target === 'production') continue;
        if (!keptNewestPreview) {
          keptNewestPreview = true; // いちばん新しいプレビューは残す（→ 冒頭のメモ）
          continue;
        }
        if (d.created < cutoff) victims.push(d);
      }
      until = page.pagination?.next;
      if (!until) break;
    }

    let deleted = 0;
    for (const d of victims) {
      try {
        await api('DELETE', `/v13/deployments/${d.uid}${scope.q ? `?${scope.q.slice(1)}` : ''}`);
        deleted += 1;
      } catch (e) {
        /* 消せない1件（権限・既に消えた等）で全体を止めない */
        console.warn(`  消せなかった: ${d.uid} ${String(e).slice(0, 120)}`);
      }
      await sleep(150); // レートリミットに当てないための小休止
    }
    totalDeleted += deleted;
    console.log(`[${scope.label}] ${p.name}: ${DAYS}日より古いプレビュー ${victims.length}件中 ${deleted}件を削除`);
  }
}
console.log(`合計 ${totalDeleted} 件を削除した。ストレージのグラフへの反映には少し時間がかかる。`);
