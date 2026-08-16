/* 「浮いて見える細い突起」を自動でさがす。**直しはしない。測るだけ。**

   ▍なぜ要るのか
   看板キャラSR（王様）は、腕を下ろすと顔や肩のまわりに欠片が浮いて見える。
   ウェイトを直すと、次の欠片が別の場所に出る——顔が上着を突き抜けたり、
   固めた肩章のふちが袖から顔を出したり、原因が毎回ちがう。**目で探して
   1つずつ直していると終わらない**ので、機械に探させる。

   ▍見つけ方
   姿勢をつけて描いた絵からキャラの形（マスク）を取り、**細らせて太らせる**
   （オープニング）。細い出っ張りだけが消えるので、消えた画素が突起の場所。
   そこへレイを飛ばして、当たった三角形の骨とバインド座標を出す。

   ▍ひげと耳は「元から細い」ので出てくる
   除外はしていない。バインド座標を見れば区別がつく（ひげは Head:1 で
   z が大きい前のほう、耳は上）。**動かしたときだけ出るもの**が直す相手。

   使い方:
     node tools/find-spikes.mjs <モデルID> ['[["idle-a",1.0,0],...]']
   出力: 突起の一覧（画面座標・大きさ・当たった頂点の骨とバインド座標）と、
        見つけた場所を赤く塗った絵（scratchpad の neko/spike-*.png）

   直すのは tools/pull-in.mjs（その場所を内側へ引っ込める）。 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const APP = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const ROOT = path.join(APP, '..');
const OUT = process.env.SPIKE_OUT ?? '/tmp/spikes';
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = url.startsWith('/three/') ? path.join(ROOT, 'node_modules', 'three', url.slice(7)) : path.join(APP, url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return void res.writeHead(404).end('x');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(8809, r));

const html = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0}canvas{display:block}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const cache = {};
window.scan = async (glb, tex, size, clip, t, yaw, thin) => {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(size, size); renderer.setClearColor(0x000000, 0);
  document.body.innerHTML = ''; document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 2));
  const gltf = await new GLTFLoader().loadAsync(glb);
  const texture = await new THREE.TextureLoader().loadAsync(tex);
  texture.flipY = false; texture.colorSpace = THREE.SRGBColorSpace;
  let mesh = null;
  gltf.scene.traverse((o) => { if (!o.isMesh) return; mesh = o;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) { m.map = texture; m.needsUpdate = true; } });
  scene.add(gltf.scene);
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const found = gltf.animations.find((a) => a.name === clip);
  if (found) { mixer.clipAction(found).play(); mixer.setTime(t); }
  gltf.scene.updateMatrixWorld(true);

  let head = null;
  gltf.scene.traverse((o) => { if (!head && o.isBone && /^head\$/i.test(o.name)) head = o; });
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const at = head.getWorldPosition(new THREE.Vector3());
  const headH = box.max.y - at.y;
  at.y += headH * 0.1;
  const frame = headH * 2.6, fov = 24;
  const dist = frame/2/Math.tan((fov/2)*Math.PI/180);
  const y = yaw*Math.PI/180;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 50);
  camera.position.set(at.x + dist*Math.sin(y), at.y + dist*Math.sin(12*Math.PI/180), at.z + dist*Math.cos(y));
  camera.lookAt(at);
  camera.updateMatrixWorld(true);
  renderer.render(scene, camera);

  /* マスク（不透明な画素）を作る */
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.drawImage(renderer.domElement, 0, 0);
  const px = ctx.getImageData(0, 0, size, size).data;
  const m = new Uint8Array(size*size);
  for (let i = 0; i < size*size; i++) m[i] = px[i*4+3] > 40 ? 1 : 0;

  /* 細らせて太らせる（半径 thin）。消えた画素＝細い出っ張り */
  const erode = (src, r) => {
    const o = new Uint8Array(src.length);
    for (let yy = 0; yy < size; yy++) for (let xx = 0; xx < size; xx++) {
      let ok = 1;
      for (let dy = -r; dy <= r && ok; dy++) for (let dx = -r; dx <= r && ok; dx++) {
        const nx = xx+dx, ny = yy+dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size || !src[ny*size+nx]) ok = 0;
      }
      o[yy*size+xx] = ok;
    }
    return o;
  };
  const dilate = (src, r) => {
    const o = new Uint8Array(src.length);
    for (let yy = 0; yy < size; yy++) for (let xx = 0; xx < size; xx++) {
      let on = 0;
      for (let dy = -r; dy <= r && !on; dy++) for (let dx = -r; dx <= r && !on; dx++) {
        const nx = xx+dx, ny = yy+dy;
        if (nx >= 0 && ny >= 0 && nx < size && ny < size && src[ny*size+nx]) on = 1;
      }
      o[yy*size+xx] = on;
    }
    return o;
  };
  const opened = dilate(erode(m, thin), thin);
  const lost = new Uint8Array(m.length);
  for (let i = 0; i < m.length; i++) lost[i] = m[i] && !opened[i] ? 1 : 0;

  /* かたまりにまとめる */
  const seen = new Uint8Array(m.length);
  const blobs = [];
  for (let i = 0; i < m.length; i++) {
    if (!lost[i] || seen[i]) continue;
    const stack = [i];
    seen[i] = 1;
    const cell = [];
    while (stack.length) {
      const p = stack.pop();
      cell.push(p);
      const x0 = p % size, y0 = (p - x0) / size;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x0+dx, ny = y0+dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        const q = ny*size+nx;
        if (lost[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    if (cell.length < 12) continue; // ふちのギザギザは無視
    let sx = 0, sy = 0;
    for (const p of cell) { sx += p % size; sy += (p - (p % size)) / size; }
    blobs.push({ n: cell.length, x: Math.round(sx/cell.length), y: Math.round(sy/cell.length), cell });
  }
  blobs.sort((a, b) => b.n - a.n);

  /* かたまりの中心へレイを飛ばして正体を聞く */
  const ray = new THREE.Raycaster();
  const g = mesh.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, ps = g.attributes.position;
  const bones = mesh.skeleton.bones.map((b) => b.name);
  const found2 = [];
  for (const b of blobs.slice(0, 6)) {
    /* 中心が突起から外れることがあるので、かたまりの画素をいくつか試す */
    let hit = null;
    for (const p of [b.cell[0], b.cell[(b.cell.length/2)|0], b.cell[b.cell.length-1]]) {
      const x0 = p % size, y0 = (p - (p % size)) / size;
      ray.setFromCamera(new THREE.Vector2((x0/size)*2-1, -(y0/size)*2+1), camera);
      const hs = ray.intersectObject(mesh, true);
      if (hs.length) { hit = hs[0]; break; }
    }
    found2.push({
      n: b.n, at: [b.x, b.y],
      verts: hit ? [hit.face.a, hit.face.b, hit.face.c].map((v) => ({
        bind: [ps.getX(v), ps.getY(v), ps.getZ(v)].map((x) => +x.toFixed(3)),
        w: [0,1,2,3].map((k) => [bones[si.getComponent(v,k)], +sw.getComponent(v,k).toFixed(2)]).filter(([,x]) => x > 0.02),
      })) : null,
    });
  }
  /* 見つけた場所を赤で塗った絵も返す */
  ctx.fillStyle = 'rgba(255,0,0,0.85)';
  for (const b of blobs.slice(0, 6)) for (const p of b.cell) ctx.fillRect(p % size, (p - (p % size)) / size, 1, 1);
  return { blobs: found2, png: c.toDataURL('image/png') };
};
</script>`;
fs.writeFileSync(path.join(APP, '_spikes.html'), html);
const pw = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
const chrome = fs.readdirSync(pw).filter((d) => d.startsWith('chromium-'))
  .map((d) => path.join(pw, d, 'chrome-linux', 'chrome')).find((f) => fs.existsSync(f));
const browser = await chromium.launch(chrome ? { executablePath: chrome } : {});
const tab = await browser.newPage({ viewport: { width: 700, height: 700 } });
tab.on('console', (m) => m.type() === 'error' && console.log('[c]', m.text().slice(0,140)));
await tab.goto('http://localhost:8809/_spikes.html', { waitUntil: 'load' });

const MODEL = process.argv[2] ?? 'neko-sr';
const JOBS = JSON.parse(process.argv[3] ?? '[["idle-a",1.0,0],["idle-a",1.0,35],["idle-a",1.0,-35],["idle-a",2.2,0],["wave",1.2,0]]');
for (const [clip, t, yaw] of JOBS) {
  const r = await tab.evaluate(([g, tx, s, c, tt, y, th]) => window.scan(g, tx, s, c, tt, y, th),
    [`/assets/models/${MODEL}.glb`, `/assets/models/${MODEL}-texture.jpg`, 700, clip, t, yaw, 3]);
  fs.writeFileSync(path.join(OUT, `spike-${MODEL}-${clip}-${t}-${yaw}.png`), Buffer.from(r.png.split(',')[1], 'base64'));
  console.log(`\n■ ${clip} t=${t} yaw=${yaw}  細い出っ張り ${r.blobs.length}か所`);
  for (const b of r.blobs) {
    console.log(`  ${String(b.n).padStart(5)}px 画面(${b.at.join(',')})`);
    if (b.verts) for (const v of b.verts) console.log(`      バインド[${v.bind.join(',')}] ${v.w.map(([bn,x]) => bn+':'+x).join(' ')}`);
  }
}
await browser.close(); server.close();
fs.unlinkSync(path.join(APP, '_spikes.html'));
