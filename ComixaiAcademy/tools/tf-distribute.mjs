/* ============================================================
   TestFlightの配信状態を見て、止まっていれば流す。

   ▍なぜ要るのか
   eas submit が成功しても、それは「Appleにバイナリを渡した」まで。
   その先に (1) Appleの処理（数分〜、まれに失敗する）、
   (2) テスターグループへの配信、の2段があり、ここで止まると
   **テスターのTestFlightには何も出ない**（実際にビルド8が10時間
   届かなかった）。Apple側の状態は手元から見えないので、
   ActionsからASC APIで覗いて、配信漏れなら流し込む。

   ▍やること
   1. 直近のビルドを新しい順に並べて、処理状態を出す
   2. 内部テスターグループと、配信済みビルドを出す
   3. 最新の処理済み（VALID）ビルドがどのグループにも入っていなければ、
      全グループに追加する（＝テスターに届く）

   ▍使い方（Actionsから呼ばれる想定 → .github/workflows/tf-status.yml）
     ASC_KEY_PATH / ASC_KEY_ID / ASC_ISSUER_ID を環境変数で渡す
     node tools/tf-distribute.mjs
   ============================================================ */
import { createSign } from 'node:crypto';
import fs from 'node:fs';

const KEY_PATH = process.env.ASC_KEY_PATH;
const KEY_ID = process.env.ASC_KEY_ID;
const ISSUER_ID = process.env.ASC_ISSUER_ID;
const BUNDLE_ID = process.env.BUNDLE_ID ?? 'dev.comixai.academy';
if (!KEY_PATH || !KEY_ID || !ISSUER_ID) {
  console.error('ASC_KEY_PATH / ASC_KEY_ID / ASC_ISSUER_ID が要る');
  process.exit(1);
}

/* ———— ASC APIの認証（JWT・ES256）。asc-credentials.mjs と同じ作り ———— */
const b64url = (buf) => Buffer.from(buf).toString('base64url');
function jwt() {
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' }),
  );
  const signer = createSign('SHA256');
  signer.update(`${header}.${payload}`);
  const sig = signer.sign({ key: fs.readFileSync(KEY_PATH, 'utf8'), dsaEncoding: 'ieee-p1363' });
  return `${header}.${payload}.${b64url(sig)}`;
}

async function api(method, p, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${p}`, {
    method,
    headers: { authorization: `Bearer ${jwt()}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${method} ${p} -> ${res.status}: ${JSON.stringify(json?.errors ?? json)}`);
  }
  return json;
}

/* ———— アプリ ———— */
const app = (await api('GET', `/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}`)).data[0];
if (!app) {
  console.error(`アプリが見つからない: ${BUNDLE_ID}`);
  process.exit(1);
}

/* ———— 1. 直近のビルドと処理状態 ————
   processingState: PROCESSING（Appleが処理中）/ VALID（配信できる）/
   FAILED・INVALID（このビルドは使えない。原因はメールに来る） */
const builds = (
  await api(
    'GET',
    `/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=6&fields[builds]=version,processingState,uploadedDate,expired`,
  )
).data;
console.log('—— 直近のビルド ——');
for (const b of builds) {
  const a = b.attributes;
  console.log(
    `ビルド${a.version}  ${a.processingState}${a.expired ? '（期限切れ）' : ''}  ${a.uploadedDate}`,
  );
}

/* ———— 2. 内部テスターグループと配信済みビルド ———— */
const groups = (
  await api(
    'GET',
    `/v1/betaGroups?filter[app]=${app.id}&fields[betaGroups]=name,isInternalGroup,hasAccessToAllBuilds`,
  )
).data;
console.log('—— テスターグループ ——');
const groupBuilds = new Map(); // groupId -> Set(buildId)
for (const g of groups) {
  const a = g.attributes;
  /* hasAccessToAllBuilds のグループは自動配信なので、手で足すものは無い */
  const assigned = a.hasAccessToAllBuilds
    ? null
    : (await api('GET', `/v1/betaGroups/${g.id}/builds?fields[builds]=version&limit=50`)).data;
  groupBuilds.set(g.id, assigned ? new Set(assigned.map((b) => b.id)) : null);
  console.log(
    `${a.name}（${a.isInternalGroup ? '内部' : '外部'}）` +
      (a.hasAccessToAllBuilds
        ? ' 全ビルド自動配信'
        : ` 配信済み: ${assigned.map((b) => `ビルド${b.attributes.version}`).join(' ') || 'なし'}`),
  );
}

/* ———— 3. 最新のVALIDビルドを、入っていないグループに流す ———— */
const latest = builds.find((b) => b.attributes.processingState === 'VALID' && !b.attributes.expired);
if (!latest) {
  console.log('配信できる（VALID）ビルドがまだ無い。Appleの処理待ちか、処理失敗のメールを確認');
  process.exit(0);
}
for (const g of groups) {
  const set = groupBuilds.get(g.id);
  if (set === null || set.has(latest.id)) continue; // 自動配信 or 配信済み
  await api('POST', `/v1/betaGroups/${g.id}/relationships/builds`, {
    data: [{ type: 'builds', id: latest.id }],
  });
  console.log(`→ ビルド${latest.attributes.version} を「${g.attributes.name}」に配信した`);
}
console.log(`最新の配信可能ビルド: ビルド${latest.attributes.version}`);
