/* 相棒の「顔サムネイル」を焼く。

   ▍なぜ焼くのか（その場で3Dを出さない理由）
   一覧には13体ぶんが並ぶ。Avatar3D を13個置くと**WebGLのコンテキストが
   足りない**（同時に持てるのは十数個で頭打ち。→ components/capsule-3d.tsx）。
   選ぶ画面は「顔が分かればいい」場所なので、静止画で足りる。

   ▍頭の位置は骨から取る
   モデルの原点や身長はキャラでばらばら（かんばんは0.62倍で背が低い）。
   決め打ちの座標だと、ある人は顔、ある人は胸が写る。**Head の骨の
   ワールド座標**を見て、そこにカメラを向ける。骨が無いときだけ、
   全身の外接箱の上のほうを頭とみなす。

   ▍カメラは頭より少し上に置く（PITCH）
   目の高さに水平に置くと、**下から見上げた顔**になる。鼻の穴が見えて、
   顎が大きく、頭が小さく写る。少し上から見下ろすと素直な証明写真になる。

   ▍骨の重みで頭の頂点を選ぶ手は使えなかった
   「Head に結びついた頂点だけの外接矩形」で枠を取るのが理屈では正しいが、
   このモデル（Tripo生成）は**体の頂点まで Head に結びついている**
   （おっとりで頭の重み付き頂点が全体の74%、下端は足元近く）。
   縦は「外接箱の上端 − Head の骨」がきれいに出るので、そちらで測る。

   使い方:
     node tools/make-faces.mjs
   出力: assets/faces/<アバターID>.png（色違いは <アバターID>-<きせかえID>.png）

   **playwright はリポジトリ直下の node_modules から借りる**
   （アプリ側には入れていない。サイトの og:glossary と同じ借り方）。
   ブラウザは環境が用意しているものを使う（PLAYWRIGHT_BROWSERS_PATH に
   入っている Chromium）。playwright が期待する版と食い違うことがあるので、
   実行ファイルを直接指定している。 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const ROOT = path.join(APP, '..');
const OUT = path.join(APP, 'assets', 'faces');

/** 焼く一覧。data/avatars.ts の AVATARS と SKINS に合わせる。
    **増やしたらここも足す**（台帳を読むのが理想だが、TSを解釈するために
    ビルドを挟むことになるので、13行の重複を許している） */
const LOOKS = [
  ...['ottori', 'nekketsu', 'sensei', 'otenba', 'kanroku', 'neko'].flatMap((id) => [
    { out: id === 'sensei' ? 'senpai' : id, glb: id, tex: `${id}-texture` },
    { out: `${id === 'sensei' ? 'senpai' : id}-sr`, glb: `${id === 'sensei' ? 'senpai' : id}-sr`, tex: `${id === 'sensei' ? 'senpai' : id}-sr-texture` },
  ]),
  /* 色違い（→ data/avatars.ts の SKINS）。モデルは素と同じで、貼る絵だけ違う */
  { out: 'senpai-kin', glb: 'sensei', tex: 'sensei-kin-texture' },
];

/** ▍顔の向きの直し（度・モデルごと）
    素のモデルは**キャラごとに顎の上げ方がばらばら**で、並べると
    「ほとんどが上を向いていて、先輩だけ下を向いている」ように見える。
    マイナスで顎を引き、プラスで顎を上げる。焼くときに Head の骨を
    この角度だけ回してから撮る（**モデル自体は書き換えない**。
    全身で立っているときの見え方や歩きのモーションに波及するため）。

    数字は目で合わせたもの。増やしたら、その並びで見比べて決める。 */
const TILT = {
  ottori: -7,
  'ottori-sr': -6,
  nekketsu: -6,
  'nekketsu-sr': -6,
  sensei: 6, // 先輩だけ逆。素のモデルが下を向いている
  'senpai-sr': -4,
  otenba: -6,
  'otenba-sr': -6,
  kanroku: -8, // いちばん顎が上がっている
  'kanroku-sr': -8,
  neko: -5,
  'neko-sr': -6,
};

const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.html': 'text/html' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = url.startsWith('/three/')
    ? path.join(ROOT, 'node_modules', 'three', url.slice('/three/'.length))
    : path.join(APP, url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(8791, r));

const page = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:transparent}canvas{display:block}</style>
<script type="importmap">
{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

window.shoot = async (glb, tex, size, tilt) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size);
  renderer.setClearColor(0x000000, 0);
  document.body.innerHTML = '';
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  /* モデルはunlit。環境光だけ入れておく（→ avatar/Avatar3D.tsx） */
  scene.add(new THREE.AmbientLight(0xffffff, 2));

  const gltf = await new GLTFLoader().loadAsync(glb);
  const texture = await new THREE.TextureLoader().loadAsync(tex);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      m.map = texture;
      m.needsUpdate = true;
    }
  });
  scene.add(gltf.scene);
  gltf.scene.updateMatrixWorld(true);

  /* 頭の骨をさがす。無ければ全身の上のほうを頭とみなす */
  let head = null;
  gltf.scene.traverse((o) => {
    if (head) return;
    if (o.isBone && /^head$/i.test(o.name)) head = o;
  });
  /* ▍顔の向きを直してから測る
     顎を引かせると髪のてっぺんの高さも変わるので、**枠を測る前に回す**。
     世界のX軸まわりに回す（骨のローカル軸は寝ているので、そのまま
     rotation.x に足すと横に傾く） */
  if (head && tilt) {
    head.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), (tilt * Math.PI) / 180);
    gltf.scene.updateMatrixWorld(true);
  }

  const box = new THREE.Box3().setFromObject(gltf.scene);
  const tall = box.max.y - box.min.y;

  /* ▍頭の高さは「首から頭のてっぺんまで」で測る
     割合の決め打ち（全高の13%など）は使えない。**この人たちは
     頭が大きい**（デフォルメ）ので、割合で切ると顎から下しか写らない。
     Head の骨＝首のあたり、外接箱の上端＝髪のてっぺん。その差が頭。 */
  const at = new THREE.Vector3();
  if (head) head.getWorldPosition(at);
  else at.set((box.min.x + box.max.x) / 2, box.max.y - tall * 0.22, (box.min.z + box.max.z) / 2);
  const headH = Math.max(box.max.y - at.y, tall * 0.12);
  at.y += headH * 0.48;

  /* 頭のまわりに少し余白を残す。**きっちり詰めると、丸く抜いたときに
     かんばん（猫）の耳とおっとりの髪が枠から切れる** */
  const frame = headH * 1.62;
  const fov = 24;
  const dist = frame / 2 / Math.tan((fov / 2) * Math.PI / 180);
  /* 目の高さから水平に撮ると**見上げた顔**になる（鼻の穴が見えて、顎が
     大きく頭が小さく写る）。少し上に置いて見下ろすと証明写真の角度になる */
  const PITCH = (12 * Math.PI) / 180;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 50);
  camera.position.set(at.x, at.y + dist * Math.sin(PITCH), at.z + dist * Math.cos(PITCH));
  camera.lookAt(at);

  renderer.render(scene, camera);
  return { png: renderer.domElement.toDataURL('image/png'), tall, headH, y: at.y };
};
</script>`;
fs.writeFileSync(path.join(APP, '_faces.html'), page);

fs.mkdirSync(OUT, { recursive: true });
/* 環境に入っている Chromium をそのまま使う。**版が合わないと
   「Executable doesn't exist」で落ちる**ので、あるものを探して渡す */
const pw = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
const chrome = fs
  .readdirSync(pw)
  .filter((d) => d.startsWith('chromium-'))
  .map((d) => path.join(pw, d, 'chrome-linux', 'chrome'))
  .find((f) => fs.existsSync(f));
const browser = await chromium.launch(chrome ? { executablePath: chrome } : {});
const tab = await browser.newPage({ viewport: { width: 400, height: 400 } });
tab.on('console', (m) => m.type() === 'error' && console.log('  [console]', m.text().slice(0, 140)));
await tab.goto('http://localhost:8791/_faces.html', { waitUntil: 'load' });

for (const look of LOOKS) {
  const tilt = TILT[look.glb] ?? 0;
  const r = await tab.evaluate(
    ([g, t, s, k]) => window.shoot(g, t, s, k),
    [`/assets/models/${look.glb}.glb`, `/assets/models/${look.tex}.jpg`, 256, tilt],
  );
  const png = Buffer.from(r.png.split(',')[1], 'base64');
  fs.writeFileSync(path.join(OUT, `${look.out}.png`), png);
  console.log(
    `${look.out.padEnd(14)} 全高${r.tall.toFixed(2)} 頭${r.headH.toFixed(2)}` +
      `（全高の${Math.round((r.headH / r.tall) * 100)}%） 顔${tilt > 0 ? '+' : ''}${tilt}° ` +
      `${(png.length / 1024).toFixed(0)}KB`,
  );
}

await browser.close();
server.close();
fs.unlinkSync(path.join(APP, '_faces.html'));
console.log(`\n${LOOKS.length}体ぶんを assets/faces に焼いた`);
