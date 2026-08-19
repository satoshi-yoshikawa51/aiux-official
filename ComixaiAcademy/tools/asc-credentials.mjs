/* ============================================================
   App Store Connect APIで、iOSの署名まわりを非対話で用意する。

   ▍なぜ要るのか
   eas build --non-interactive は、証明書が無いとき「対話モードで
   やり直せ」と言って止まる（実際に初回のActionsで止まった）。
   手元にMacもターミナルも無い前提なので、対話の代わりに
   App Store Connect APIキーで同じことをやる：

     1. Bundle IDの登録（無ければ）
     2. 配布証明書の発行（鍵はこの場で作る。Appleの上限2枚に
        当たったら、いちばん古いものを失効させて空ける）
     3. App Store用プロビジョニングプロファイルの発行
     4. EASが読める credentials.json に書き出す

   毎回作り直す（＝前回の鍵をどこにも保存しない）。証明書の失効は
   配信済みのTestFlight/App Storeビルドには影響しない。

   ▍使い方（Actionsから呼ばれる想定）
     ASC_KEY_PATH / ASC_KEY_ID / ASC_ISSUER_ID / BUNDLE_ID を環境変数で渡す
     node tools/asc-credentials.mjs
   ============================================================ */
import { execFileSync } from 'node:child_process';
import { createSign, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const KEY_PATH = process.env.ASC_KEY_PATH;
const KEY_ID = process.env.ASC_KEY_ID;
const ISSUER_ID = process.env.ASC_ISSUER_ID;
const BUNDLE_ID = process.env.BUNDLE_ID ?? 'dev.comixai.academy';
if (!KEY_PATH || !KEY_ID || !ISSUER_ID) {
  console.error('ASC_KEY_PATH / ASC_KEY_ID / ASC_ISSUER_ID が要る');
  process.exit(1);
}

const OUT = path.join(process.cwd(), 'credentials');
fs.mkdirSync(OUT, { recursive: true });

/* ———— ASC APIの認証（JWT・ES256） ———— */
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
    headers: {
      authorization: `Bearer ${jwt()}`,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${method} ${p} -> ${res.status}: ${JSON.stringify(json?.errors ?? json)}`);
  }
  return json;
}

const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'] });

/* ———— 1. Bundle ID ———— */
let bundle = (
  await api('GET', `/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE_ID)}`)
).data.find((b) => b.attributes.identifier === BUNDLE_ID);
if (!bundle) {
  console.log(`Bundle ID ${BUNDLE_ID} を登録する`);
  bundle = (
    await api('POST', '/v1/bundleIds', {
      data: {
        type: 'bundleIds',
        attributes: { identifier: BUNDLE_ID, name: 'COMIXAI Academy', platform: 'IOS' },
      },
    })
  ).data;
} else {
  console.log(`Bundle ID ${BUNDLE_ID} は登録済み`);
}

/* ———— 2. 配布証明書 ———— */
/* 鍵とCSRはこの場で作る。CNは分かりやすさのためだけ */
const keyPem = path.join(OUT, 'dist-key.pem');
const csrPem = path.join(OUT, 'dist.csr');
sh('openssl', ['genrsa', '-out', keyPem, '2048']);
sh('openssl', ['req', '-new', '-key', keyPem, '-out', csrPem, '-subj', '/CN=COMIXAI Academy CI/O=satoshi yoshikawa/C=JP']);
const csr = fs.readFileSync(csrPem, 'utf8');

/* Appleは配布証明書を2枚までしか持てない。埋まっていたら古い方を失効させる。
   （失効しても、配信済みのビルドは動き続ける） */
const existing = (await api('GET', '/v1/certificates?filter[certificateType]=IOS_DISTRIBUTION&limit=20')).data;
if (existing.length >= 2) {
  const oldest = existing.sort(
    (a, b) => new Date(a.attributes.expirationDate) - new Date(b.attributes.expirationDate),
  )[0];
  console.log(`証明書が上限（${existing.length}枚）なので、古い1枚を失効させる: ${oldest.id}`);
  await api('DELETE', `/v1/certificates/${oldest.id}`);
}

console.log('配布証明書を発行する');
const cert = (
  await api('POST', '/v1/certificates', {
    data: { type: 'certificates', attributes: { certificateType: 'IOS_DISTRIBUTION', csrContent: csr } },
  })
).data;
const certDer = path.join(OUT, 'dist.der');
const certPem = path.join(OUT, 'dist.pem');
fs.writeFileSync(certDer, Buffer.from(cert.attributes.certificateContent, 'base64'));
sh('openssl', ['x509', '-inform', 'DER', '-in', certDer, '-out', certPem]);

/* EASが読むのは p12。中身が新しすぎる暗号だと読めない道具があるので -legacy で固める */
const p12Pass = randomBytes(16).toString('hex');
const p12Path = path.join(OUT, 'dist.p12');
sh('openssl', ['pkcs12', '-export', '-legacy', '-inkey', keyPem, '-in', certPem, '-out', p12Path, '-passout', `pass:${p12Pass}`]);

/* ———— 3. プロビジョニングプロファイル ———— */
/* 名前は一意でないといけない。CI製の古いものは掃除してから作る */
const profiles = (await api('GET', '/v1/profiles?filter[profileType]=IOS_APP_STORE&limit=50')).data;
for (const p of profiles) {
  if (p.attributes.name.startsWith('comixai-academy-ci')) {
    console.log(`古いプロファイルを消す: ${p.attributes.name}`);
    await api('DELETE', `/v1/profiles/${p.id}`);
  }
}
console.log('App Store用プロファイルを発行する');
const profile = (
  await api('POST', '/v1/profiles', {
    data: {
      type: 'profiles',
      attributes: { name: `comixai-academy-ci-${Date.now()}`, profileType: 'IOS_APP_STORE' },
      relationships: {
        bundleId: { data: { type: 'bundleIds', id: bundle.id } },
        certificates: { data: [{ type: 'certificates', id: cert.id }] },
      },
    },
  })
).data;
const profilePath = path.join(OUT, 'appstore.mobileprovision');
fs.writeFileSync(profilePath, Buffer.from(profile.attributes.profileContent, 'base64'));

/* ———— 4. credentials.json ———— */
fs.writeFileSync(
  path.join(process.cwd(), 'credentials.json'),
  JSON.stringify(
    {
      ios: {
        provisioningProfilePath: 'credentials/appstore.mobileprovision',
        distributionCertificate: { path: 'credentials/dist.p12', password: p12Pass },
      },
    },
    null,
    2,
  ),
);
console.log('できた: credentials.json（証明書とプロファイルは credentials/ の中）');
