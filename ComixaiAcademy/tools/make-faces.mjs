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

/** ▍顔の向きの直し（度・モデルごと）は台帳から読む

    素のモデルは**キャラごとに顎の上げ方がばらばら**で、並べると
    「ほとんどが上を向いていて、先輩だけ下を向いている」ように見える。
    直す角度は `src/data/avatars.ts` の `headTilt` が持っていて、
    アプリの3D表示（avatar/Avatar3D.tsx）も同じ値を使う。

    **ここで表を持たない。** 焼いた顔と画面の中の3Dで顎の角度が
    食い違うのがいちばん困るので、数字の出どころは1つにする。
    台帳はTSなので、ビルドを挟まずに済むよう行を読んで拾っている
    （glb の require を見つけたら、その塊の headTilt を対にする）。 */
function readTilts() {
  const src = fs.readFileSync(path.join(APP, 'src', 'data', 'avatars.ts'), 'utf8');
  const tilt = {};
  let model = null;
  for (const line of src.split('\n')) {
    const g = line.match(/glb: require\('@\/assets\/models\/([\w-]+)\.glb'\)/);
    if (g) model = g[1];
    const t = line.match(/^\s*headTilt: (-?[\d.]+),/);
    if (t && model) {
      tilt[model] = Number(t[1]);
      model = null;
    }
  }
  return tilt;
}
const TILT = readTilts();

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

  /* ▍1枚目は**わざと広く**撮る（測るためだけの絵）
     詰めて撮ると顔が枠に当たり、シルエットの外接矩形が画面いっぱいになって
     **測定値が全員同じ**になってしまう（実際それで、猫や熱血が全身に引いた）。 */
  let frame = headH * 2.4;
  const fov = 24;
  /* 目の高さから水平に撮ると**見上げた顔**になる（鼻の穴が見えて、顎が
     大きく頭が小さく写る）。少し上に置いて見下ろすと証明写真の角度になる */
  const PITCH = (12 * Math.PI) / 180;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 50);
  const aim = () => {
    const dist = frame / 2 / Math.tan((fov / 2) * Math.PI / 180);
    camera.position.set(at.x, at.y + dist * Math.sin(PITCH), at.z + dist * Math.cos(PITCH));
    camera.lookAt(at);
    camera.updateMatrixWorld(true);
  };
  aim();
  renderer.render(scene, camera);

  /* ============================================================
     ▍大きさと中心は、**焼いた絵から測って**合わせる

     骨や外接箱で枠を決めると、キャラごとに顔の大きさが揃わない。
     頭の高さを「Headの骨〜てっぺん」で測っているので、**王冠や盛った髪の
     ぶんだけ枠が大きくなり、その子の顔だけ小さく写る**。中心も、Headの骨が
     真ん中にあるとは限らない（おっとりは x=0.041 ずれていて、右に寄っていた）。

     そこで1回撮ってから、その絵のシルエットを測って撮り直す：
     - 細らせる（オープニング）と**ひげ・耳・王冠の飾りが消える**ので、
       残った塊＝顔の輪郭。その幅を全員そろえれば、顔の大きさが揃う
     - 塊の中心を画面の中心に持ってくる（横は完全に中央、縦は少し下げて
       頭のてっぺんの余白を作る）
     - ただし**髪や王冠まで入れた全体**が枠から出るなら、出ないところまで引く
     ============================================================ */
  /** 顔（頭のいちばん広いところ）の幅を、絵の何割にするか */
  const FACE = 0.58;
  /** 首の線を、絵の上から何割の位置に置くか（顎の高さを全員そろえる） */
  const NECK = 0.86;

  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.drawImage(renderer.domElement, 0, 0);
  const px = ctx.getImageData(0, 0, size, size).data;
  const solid = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) solid[i] = px[i * 4 + 3] > 40 ? 1 : 0;
  /* 細らせて、ひげ・毛先・王冠の細い飾りを落とす */
  const r = Math.max(2, Math.round(size * 0.02));
  const thin = new Uint8Array(solid.length);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let ok = 1;
    for (let dy = -r; dy <= r && ok; dy++) for (let dx = -r; dx <= r && ok; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size || !solid[ny * size + nx]) ok = 0;
    }
    thin[y * size + x] = ok;
  }
  /* 行ごとの幅と左右の端 */
  const row = [];
  for (let y = 0; y < size; y++) {
    let x0 = -1, x1 = -1;
    for (let x = 0; x < size; x++) if (thin[y * size + x]) { if (x0 < 0) x0 = x; x1 = x; }
    row.push({ x0, x1, w: x0 < 0 ? 0 : x1 - x0 + 1, cx: x0 < 0 ? 0 : (x0 + x1) / 2 });
  }
  /* 髪・耳・王冠まで入れた本当の上端（細らせる前で見る） */
  let topY = 0;
  for (let y = 0; y < size; y++) {
    let any = 0;
    for (let x = 0; x < size && !any; x++) if (solid[y * size + x]) any = 1;
    if (any) { topY = y; break; }
  }

  /* ▍首の線は**Head の骨を画面に投影して**取る
     「上から下りて幅が落ちた所が首」でも人は取れるが、**猫は取れない**。
     頭が肩に直に乗っていて、くびれが無いうえ、Tポーズの腕がすぐ横に来るので、
     幅が落ちる行が現れない（そのまま腕をいちばん広い行として拾い、
     顔幅91%＝全身、という測定値になった）。骨なら体型によらない。 */
  const anchor = (head ? head.getWorldPosition(new THREE.Vector3()) : at.clone());
  const neckPt = anchor.clone().project(camera);
  const neckY = Math.min(size - 1, Math.max(0, ((1 - neckPt.y) / 2) * size));

  /* ▍横の中心は**左右対称の軸**で決める
     顔の中心をどう定義するかで、ここまで3回はずした：
     - Head の骨 … 骨自体が x=0.041 ずれている子がいる
     - シルエットの真ん中 … 髪の量が左右で違う子でずれる
     - 鼻（頭でいちばん前に出ている点）… **前髪や眼鏡のほうが前に出ている**ので、
       そちらを拾って横にずれる

     人が「真ん中」と感じているのは**左右対称に見える位置**なので、それを直接さがす。
     鏡に映した絵といちばん重なる軸が答え。焼き上がりを測って体感と突き合わせたら、
     ぴたりと一致した（ねっけつ63%・かんろく63%・おっとり59%＝右に寄って見える、
     かんばん39%＝左に寄って見える、先輩52%＝真ん中に見える）。 */
  let faceX = size / 2;
  {
    let bestErr = Infinity;
    for (let ax = size * 0.3; ax <= size * 0.7; ax += 0.5) {
      let err = 0;
      let n = 0;
      for (let y = topY; y <= neckY; y += 2) {
        for (let x = 0; x < size; x += 2) {
          const mx = Math.round(2 * ax - x);
          if (mx < 0 || mx >= size) continue;
          err += Math.abs(solid[y * size + x] - solid[y * size + mx]);
          n++;
        }
      }
      const e = err / Math.max(1, n);
      if (e < bestErr) { bestErr = e; faceX = ax; }
    }
  }

  /* 首から上でいちばん広い行＝頬の線。外接矩形ではなく行の幅で見るのは、
     王冠や盛り髪の高さに引きずられないため */
  let wide = 0;
  let wideY = topY;
  for (let y = topY; y <= neckY; y++) if (row[y].w > wide) { wide = row[y].w; wideY = y; }
  /* はみ出しを見るのも首から上だけ（腕は関係ない） */
  let sideMax = 0;
  for (let y = topY; y <= neckY; y++) {
    for (let x = 0; x < size; x++) {
      if (!solid[y * size + x]) continue;
      sideMax = Math.max(sideMax, Math.abs(x - faceX));
      break;
    }
    for (let x = size - 1; x >= 0; x--) {
      if (!solid[y * size + x]) continue;
      sideMax = Math.max(sideMax, Math.abs(x - faceX));
      break;
    }
  }

  if (wide > 4) {
    const perPx = frame / size; // 注視点の面での、1画素あたりのワールド長
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    /* 顔の幅をそろえる。髪や王冠がはみ出すなら、収まるまで引く */
    const margin = 0.06;
    frame = Math.max(
      (wide * perPx) / FACE,
      ((neckY - topY) * perPx) / (NECK - margin),
      (sideMax * perPx) / (0.5 - margin),
    );
    /* 首の線と顔の中心を、決めた位置へ持っていく */
    const neck = at.clone()
      .add(right.clone().multiplyScalar((faceX - size / 2) * perPx))
      .add(up.clone().multiplyScalar(-(neckY - size / 2) * perPx));
    at.copy(neck).add(up.clone().multiplyScalar((NECK - 0.5) * frame));
    aim();
    renderer.render(scene, camera);
  }

  /* ▍焼き上がりをもう一度測る（そろっているかを数字で見るため）
     「寄っている気がする」を目で追わない。顔の幅と、鼻の横位置を出す。 */
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(renderer.domElement, 0, 0);
  const px2 = ctx.getImageData(0, 0, size, size).data;
  const neckPt2 = anchor.clone().project(camera);
  const neckY2 = ((1 - neckPt2.y) / 2) * size;
  let faceX2 = size / 2;
  {
    let bestErr = Infinity;
    for (let ax = size * 0.3; ax <= size * 0.7; ax += 0.5) {
      let err = 0;
      let n = 0;
      for (let y = 0; y < Math.min(size, Math.round(neckY2)); y += 2) {
        for (let x = 0; x < size; x += 2) {
          const mx = Math.round(2 * ax - x);
          if (mx < 0 || mx >= size) continue;
          err += Math.abs((px2[(y * size + x) * 4 + 3] > 40 ? 1 : 0) - (px2[(y * size + mx) * 4 + 3] > 40 ? 1 : 0));
          n++;
        }
      }
      const e = err / Math.max(1, n);
      if (e < bestErr) { bestErr = e; faceX2 = ax; }
    }
  }
  let got = 0;
  for (let y = 0; y < Math.min(size, Math.round(neckY2)); y++) {
    let x0 = -1, x1 = -1;
    for (let x = 0; x < size; x++) if (px2[(y * size + x) * 4 + 3] > 40) { if (x0 < 0) x0 = x; x1 = x; }
    if (x0 >= 0) got = Math.max(got, x1 - x0 + 1);
  }

  return {
    png: renderer.domElement.toDataURL('image/png'),
    tall, headH,
    /** 焼き上がりでの、頭のいちばん広いところ（ひげ・耳込み）の幅 */
    got: +(got / size).toFixed(3),
    /** 焼き上がりでの、鼻の横位置（0.5 なら真ん中）と首の高さ */
    nose: +(faceX2 / size).toFixed(3),
    neck: +(neckY2 / size).toFixed(3),
  };
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
    `${look.out.padEnd(14)} 顔${tilt > 0 ? '+' : ''}${tilt}° ` +
      `／焼き上がり: 頭の幅${(r.got*100).toFixed(0)}% 対称軸${(r.nose*100).toFixed(1)}% 首の高さ${(r.neck*100).toFixed(0)}% ` +
      `→ ${(png.length / 1024).toFixed(0)}KB`,
  );
}

await browser.close();
server.close();
fs.unlinkSync(path.join(APP, '_faces.html'));
console.log(`\n${LOOKS.length}体ぶんを assets/faces に焼いた`);
