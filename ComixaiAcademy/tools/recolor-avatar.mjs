/* ============================================================
   相棒の色違い（R）テクスチャを作る。**キャラを選べる版**。

     node tools/recolor-avatar.mjs <モデルID> --diagnose
     node tools/recolor-avatar.mjs <モデルID> --hmin 340 --hmax 30 --lmax 0.35 \
       --hue 34 --sat 0.45 --lift 0.55 --out <id>-r

   ▍先に `recolor-sensei.mjs` があるのに、なぜ別に作るのか
   あちらは**先輩の髪だけ**を狙って調律してある（頭に届く寒色の島／
   毛先のリングは彩度85%以上／瞳を守る、など）。ほかのキャラは
   髪の色も服の色も違うので、同じしきい値は当たらない。こちらは
   「どの島を塗るか」を人が決める作りにして、判定の当てずっぽうを無くす。

   ▍やり方は2段階
   1. `--diagnose` … UVアイランドごとに色を振った診断テクスチャを書き出し、
      島ごとの大きさ・色・モデル上の高さを表で出す。**どれが髪でどれが服か**を
      目と数字で確かめる（画素の色だけでは、髪と服が同じ色域に住んでいて分離できない）
   2. 条件で島を選んで塗り替える。**島番号を1つずつ並べる形では回らない**——
      Tripoのアトラスは細かく割れていて、髪だけで数十の島になる（おっとりで
      いちばん大きい島でもテクスチャの2.5%）。島の**平均の色と高さ**で選ぶ：
        --hmin/--hmax  色相の範囲（340→30 のようにまたいで指定できる）
        --smin/--smax  彩度の範囲
        --lmin/--lmax  明度の範囲（髪と肌は色相が近いので、ここで分ける）
        --ymin/--ymax  モデル上の高さ（足元-1〜頭上1）
      塗る色は --hue / --sat / --lift（明度の持ち上げ。1=そのまま、小さいほど明るく）

   ▍島の番号は、そのGLBの中でだけ意味がある
   頂点をつないで作る番号なので、**モデルを焼き直したら変わる**。
   決めた番号は data/avatars.ts の SKINS のコメントに残すこと。
   ============================================================ */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const ID = args.find((a) => !a.startsWith('--'));
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const DIAGNOSE = args.includes('--diagnose');
const ISLANDS = String(opt('island', '')).split(',').filter(Boolean).map(Number);
const HMIN = opt('hmin', null) === null ? null : Number(opt('hmin'));
const HMAX = opt('hmax', null) === null ? null : Number(opt('hmax'));
/* 除外する色相の範囲（服の色を外すのに使う） */
const XHMIN = opt('xhmin', null) === null ? null : Number(opt('xhmin'));
const XHMAX = opt('xhmax', null) === null ? null : Number(opt('xhmax'));
const SMIN = Number(opt('smin', 0));
const SMAX = Number(opt('smax', 1));
const LMIN = Number(opt('lmin', 0));
const LMAX = Number(opt('lmax', 1));
const YMIN = Number(opt('ymin', -99));
const YMAX = Number(opt('ymax', 99));
const HUE = Number(opt('hue', 44));
const SAT = Number(opt('sat', 0.6));
const LIFT = Number(opt('lift', 1));
const OUT = opt('out', `${ID}-r`);
const KEEP_EYES = !args.includes('--no-eye-guard');
/** 白目からどれだけ離れた暗い画素までを「瞳・まつげ」とみなすか（画素）。
    大きくすると、**目のそばを通る前髪まで守って染め残す**（おっとりで斑点に
    なった）。小さくするとまつげの外側が染まる。3〜4がちょうどいい */
const EYE_R = Number(opt('eye-radius', 3));
/* ▍顔の島に描き込まれた前髪を拾う（--edge）
   Tripoのアトラスは、顔のチャートの中に前髪まで描いてある。島ごと塗ると
   顔まで染まるので、**選ばれなかった島の中の、髪の色をした画素だけ**を塗る。
   これが無いと、前髪と後れ毛だけ元の色で残る（おっとりで実際に残った）。 */
const EDGE = args.includes('--edge');
/** ▍拾い足しだけ、別の明るさで切る（--edge-lmax）
    島は**平均の色**で選ぶので、髪の明るい毛先の島まで拾おうとすると
    --lmax を上げることになる。ところが --edge は画素ごとなので、同じ値まで
    上げると**顔の島の肌が丸ごと入ってしまう**（おてんばで頬が紫になった）。
    島は緩く、拾い足しは厳しく——を別々に指定できるようにする。 */
const EDGE_LMAX = Number(opt('edge-lmax', LMAX));
/** 選んだ島の中でも、画素の色が範囲外なら塗らない（→ 塗る所のコメント） */
const STRICT = args.includes('--strict');
if (!ID) {
  console.error('使い方: node tools/recolor-avatar.mjs <モデルID> --diagnose');
  process.exit(1);
}

const DIR = new URL('../assets/models/', import.meta.url).pathname;
const SRC = `${DIR}${ID}-texture.jpg`;
const GLB = `${DIR}${ID}.glb`;
/* ▍テクスチャの一辺は**画像から読む**。決め打ちにしない
   先輩だけ1024で、あとの相棒は512。1024のつもりで読むと、
   配列の外を触って色の統計が全部NaNになる（最初それで詰まった）。 */
const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const SIZE = info.width;
if (info.width !== info.height) throw new Error('正方形のテクスチャを想定しています');

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ---------- GLBを読む（recolor-sensei.mjs と同じ読み方） ---------- */
function readGlb(p) {
  const buf = fs.readFileSync(p);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString());
  const bin = buf.subarray(20 + jsonLen + 8);
  const accessor = (idx) => {
    const acc = json.accessors[idx];
    const view = json.bufferViews[acc.bufferView];
    const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type];
    const spec = {
      5126: { size: 4, read: 'readFloatLE', div: 1 },
      5125: { size: 4, read: 'readUInt32LE', div: 1 },
      5123: { size: 2, read: 'readUInt16LE', div: 65535 },
      5122: { size: 2, read: 'readInt16LE', div: 32767 },
      5121: { size: 1, read: 'readUInt8', div: 255 },
    }[acc.componentType];
    if (!spec) throw new Error(`未対応のcomponentType: ${acc.componentType}`);
    const stride = view.byteStride ?? comps * spec.size;
    const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    const out = new Float32Array(acc.count * comps);
    const div = acc.normalized ? spec.div : 1;
    for (let e = 0; e < acc.count; e++)
      for (let c = 0; c < comps; c++)
        out[e * comps + c] = bin[spec.read](base + e * stride + c * spec.size) / div;
    return out;
  };
  return { json, accessor };
}

function buildIslands(tris, vertCount) {
  const parent = new Int32Array(vertCount);
  for (let i = 0; i < vertCount; i++) parent[i] = i;
  const find = (a) => {
    while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; }
    return a;
  };
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let t = 0; t < tris.length; t += 3) {
    union(tris[t], tris[t + 1]);
    union(tris[t + 1], tris[t + 2]);
  }
  const islandOfTri = new Int32Array(tris.length / 3);
  for (let t = 0; t < islandOfTri.length; t++) islandOfTri[t] = find(tris[t * 3]);
  return islandOfTri;
}

function fillTriangle(map, value, x0, y0, x1, y1, x2, y2) {
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)) - 1);
  const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(y0, y1, y2)) + 1);
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)) - 1);
  const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(x0, x1, x2)) + 1);
  const edge = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + 0.5, py = y + 0.5;
    const d0 = edge(x0, y0, x1, y1, px, py);
    const d1 = edge(x1, y1, x2, y2, px, py);
    const d2 = edge(x2, y2, x0, y0, px, py);
    if ((d0 >= 0 && d1 >= 0 && d2 >= 0) || (d0 <= 0 && d1 <= 0 && d2 <= 0)) map[y * SIZE + x] = value;
  }
}

function dilate(mask, times) {
  let src = mask;
  for (let n = 0; n < times; n++) {
    const dst = new Uint8Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (!src[y * SIZE + x]) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const ny = y + dy, nx = x + dx;
        if (ny >= 0 && ny < SIZE && nx >= 0 && nx < SIZE) dst[ny * SIZE + nx] = 255;
      }
    }
    src = dst;
  }
  return src;
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d > 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m];
}

/* ---------- 島を作る ---------- */
const { json, accessor } = readGlb(GLB);
const islandMap = new Int32Array(SIZE * SIZE).fill(-1);
const box = new Map(); // isl -> {minY,maxY,minX,maxX,minZ,maxZ}
for (const mesh of json.meshes) {
  for (const prim of mesh.primitives) {
    const pos = accessor(prim.attributes.POSITION);
    const uv = accessor(prim.attributes.TEXCOORD_0);
    const raw = prim.indices !== undefined ? accessor(prim.indices) : null;
    const tris = raw ? Int32Array.from(raw) : Int32Array.from({ length: pos.length / 3 }, (_, i) => i);
    const islandOfTri = buildIslands(tris, pos.length / 3);
    for (let t = 0; t < islandOfTri.length; t++) {
      const isl = islandOfTri[t];
      const vi = [tris[t * 3], tris[t * 3 + 1], tris[t * 3 + 2]];
      const b = box.get(isl) ?? { minY: 1e9, maxY: -1e9, minX: 1e9, maxX: -1e9, minZ: 1e9, maxZ: -1e9 };
      for (const v of vi) {
        b.minX = Math.min(b.minX, pos[v * 3]); b.maxX = Math.max(b.maxX, pos[v * 3]);
        b.minY = Math.min(b.minY, pos[v * 3 + 1]); b.maxY = Math.max(b.maxY, pos[v * 3 + 1]);
        b.minZ = Math.min(b.minZ, pos[v * 3 + 2]); b.maxZ = Math.max(b.maxZ, pos[v * 3 + 2]);
      }
      box.set(isl, b);
      fillTriangle(islandMap, isl,
        uv[vi[0] * 2] * SIZE, uv[vi[0] * 2 + 1] * SIZE,
        uv[vi[1] * 2] * SIZE, uv[vi[1] * 2 + 1] * SIZE,
        uv[vi[2] * 2] * SIZE, uv[vi[2] * 2 + 1] * SIZE);
    }
  }
}

/* 島ごとの色をまとめる */
const stats = new Map();
for (let p = 0; p < SIZE * SIZE; p++) {
  const isl = islandMap[p];
  if (isl < 0) continue;
  const i = p * info.channels;
  const [h, s, l] = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
  const st = stats.get(isl) ?? { n: 0, hx: 0, hy: 0, s: 0, l: 0, white: 0 };
  st.n++;
  /* 白目（明るくて彩度の無い画素）の数。目の島を見分けるのに使う */
  if (l > 0.7 && s < 0.2) st.white++;
  /* 色相は角度なので、平均は単位ベクトルの和で取る */
  st.hx += Math.cos((h * Math.PI) / 180);
  st.hy += Math.sin((h * Math.PI) / 180);
  st.s += s;
  st.l += l;
  stats.set(isl, st);
}
const rows = [...stats.entries()]
  .filter(([, st]) => st.n >= 200)
  .map(([isl, st]) => {
    let h = (Math.atan2(st.hy, st.hx) * 180) / Math.PI;
    if (h < 0) h += 360;
    const b = box.get(isl);
    return {
      島: isl,
      画素: st.n,
      色相: Math.round(h),
      彩度: +(st.s / st.n).toFixed(2),
      明度: +(st.l / st.n).toFixed(2),
      高さ: `${b.minY.toFixed(2)}〜${b.maxY.toFixed(2)}`,
      白目: +(st.white / st.n).toFixed(3),
    };
  })
  .sort((a, b) => b.画素 - a.画素);

/* ▍UV座標を指すと、そこの島を教える（--at u,v）
   「この見えている部分がどの島か」を突き止める道具。画面の点からUVは
   scratch の uvat.mjs（レイキャスト）で出す。**島の判定を疑うときに使う**
   ——おっとりの片目だけが染まったのは、瞳が白目を1画素も含まない別の
   小さな島に分かれていたからで、この2段構えで初めて分かった。 */
for (const a of args.filter((_, i) => args[i - 1] === '--at')) {
  const [u, v] = a.split(',').map(Number);
  const p = Math.min(SIZE - 1, Math.round(v * SIZE)) * SIZE + Math.min(SIZE - 1, Math.round(u * SIZE));
  const isl = islandMap[p];
  const st = stats.get(isl);
  const b = box.get(isl);
  console.log(`UV(${u}, ${v}) → 島 ${isl}`, st
    ? `画素${st.n} 白目${(st.white / st.n).toFixed(3)} 明度${(st.l / st.n).toFixed(2)} 高さ${b.minY.toFixed(2)}〜${b.maxY.toFixed(2)}`
    : '（島に載っていない）');
}

if (DIAGNOSE) {
  /* ▍表は「上から20個」では足りないことがある
     かんろくは上着（濃紺）の島が細かく割れていて、上位20個が全部そこで
     埋まった。**髪の島が1つも表に出てこない。** 高さで絞れるように
     --ymin/--ymax を診断でも効かせて、--top で行数を増やせるようにする。 */
  const shown = rows.filter((r) => {
    const b = box.get(r.島);
    return !(b.maxY < YMIN || b.minY > YMAX);
  });
  console.table(shown.slice(0, Number(opt('top', 20))));
  /* 島ごとに色を振った診断テクスチャ。元の明暗は残して、色だけ置き換える */
  const outBuf = Buffer.alloc(SIZE * SIZE * 3);
  const hueOf = new Map(rows.map((r, i) => [r.島, (i * 137.5) % 360]));
  for (let p = 0; p < SIZE * SIZE; p++) {
    const i = p * info.channels;
    const isl = islandMap[p];
    const [, , l] = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    const [r, g, b] = hueOf.has(isl)
      ? hslToRgb(hueOf.get(isl), 0.75, 0.25 + l * 0.5)
      : [0.1, 0.1, 0.1];
    outBuf[p * 3] = r * 255; outBuf[p * 3 + 1] = g * 255; outBuf[p * 3 + 2] = b * 255;
  }
  const dest = process.env.DIAG_OUT ?? '/tmp';
  await sharp(outBuf, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .png().toFile(path.join(dest, `${ID}-islands.png`));
  console.log(`診断テクスチャ → ${path.join(dest, `${ID}-islands.png`)}`);
  console.log('（番号の並びは上の表と同じ順に色を振ってある。表の上から 黄→緑→青…）');
  process.exit(0);
}

/* ---------- 塗る島を決める ---------- */
/** 色相は輪なので、340→30 のようにまたぐ指定を許す */
const between = (h, lo, hi) => (lo <= hi ? h >= lo && h <= hi : h >= lo || h <= hi);
const inHue = (h) => {
  if (XHMIN !== null && XHMAX !== null && between(h, XHMIN, XHMAX)) return false;
  if (HMIN === null || HMAX === null) return true;
  return between(h, HMIN, HMAX);
};
const pick = new Set(ISLANDS);
/* ▍「白目がある」だけで目とみなしてはいけない。**顔の高さも見る**
   明るくて彩度の無い画素は、白いシャツのふちや金具のハイライトにもある。
   高さを見ずに切ったせいで、ねっけつは**上着の襟と袖口の島が「目」に
   なり**、そこだけ紺のまま残った（赤い上着に紺のまだら）。
   目は顔にしか無いので、体の上のほうだけを対象にする。 */
const allY = [...box.values()];
const bodyMin = Math.min(...allY.map((b) => b.minY));
const bodyMax = Math.max(...allY.map((b) => b.maxY));
const EYE_YMIN = Number(opt('eye-ymin', bodyMin + (bodyMax - bodyMin) * 0.72));
const upperHalf = (isl) => (box.get(isl)?.maxY ?? -99) >= EYE_YMIN;
/** 白目だらけの島＝目そのもの。塗らないだけでなく、--edge の拾い足しからも外す */
const eyeIslands = new Set(rows.filter((r) => r.白目 > 0.03 && upperHalf(r.島)).map((r) => r.島));
/** ▍こちらは「**この島のどこかに目がある**」というだけの、ゆるい判定
    おっとりは左右の目でアトラス上の入り方がまるで違う。片方は目だけの
    小さな島（白目9.9%）で、もう片方は**顔の大きな塊の隅**にいる（白目1.2%）。
    後者は上の判定に掛からないので、**片目だけが桜色に染まった**。
    塗る／塗らないをこの緩さで決めると顔まで残ってしまうので、
    下の「瞳のたどり」の**起点をどこから探すか**にだけ使う。 */
const hasEyeIslands = new Set(
  [...stats.entries()].filter(([isl, st]) => st.white >= 12 && upperHalf(isl)).map(([isl]) => isl),
);
if (!ISLANDS.length) {
  for (const r of rows) {
    const b = box.get(r.島);
    if (!inHue(r.色相)) continue;
    if (r.彩度 < SMIN || r.彩度 > SMAX) continue;
    if (r.明度 < LMIN || r.明度 > LMAX) continue;
    if (b.maxY < YMIN || b.minY > YMAX) continue;
    /* ▍白目を含む島は、目そのもの。髪の色に近くても塗らない
       おてんばの瞳は暗い茶色で、島の平均が髪とほぼ同じ。条件だけで拾うと
       **目が丸ごと染まる**（紫の瞳になった）。白目が混じっているかどうかで
       見分ける——髪の島に白目ほど白い画素はほとんど無い。 */
    if (KEEP_EYES && r.白目 > 0.03) continue;
    pick.add(r.島);
  }
  if (!pick.size) {
    console.error('条件に合う島がありません（--diagnose で表を見てください）');
    process.exit(1);
  }
  const px = rows.filter((r) => pick.has(r.島)).reduce((a, r) => a + r.画素, 0);
  console.log(`選んだ島: ${pick.size}個 / ${px}画素（テクスチャの${((px / (SIZE * SIZE)) * 100).toFixed(1)}%）`);
}
let mask = new Uint8Array(SIZE * SIZE);
/* 画素単位で拾ったところ（＝顔の島の中の前髪）。瞳ガードはここにだけ効かせる */
const fromEdge = new Uint8Array(SIZE * SIZE);
let edged = 0;
for (let p = 0; p < SIZE * SIZE; p++) {
  if (pick.has(islandMap[p])) { mask[p] = 255; continue; }
  if (!EDGE || islandMap[p] < 0) continue;
  /* ▍拾い足しも、高さの範囲の中だけ
     --edge は画素の色だけを見るので、放っておくと**体じゅうの暗い画素**を
     拾う（かんろくは上着が濃紺の暗い色で、髪と明度がほとんど同じ）。
     その島がモデルのどのあたりにあるかで、まず足切りする。 */
  const bx = box.get(islandMap[p]);
  if (bx && (bx.maxY < YMIN || bx.minY > YMAX)) continue;
  /* ▍目の島には、そもそも入らない
     白目のまわりを守るやり方（下の guard）は、**白目から数画素の範囲**しか
     効かない。かんろくの瞳は大きくて、まん中まで届かず**瞳が灰色に
     染まった**。目は島ごと避けるのがいちばん確実。 */
  if (KEEP_EYES && eyeIslands.has(islandMap[p])) continue;
  const i = p * info.channels;
  const [h, sPx, l] = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
  if (l < EDGE_LMAX && sPx >= SMIN && sPx <= SMAX && inHue(h)) { mask[p] = 255; fromEdge[p] = 255; edged++; }
}
mask = dilate(mask, 2);
/* ▍にじませるのは2画素まで。**アトラスの余白を埋めにいってはいけない**
   島と島のあいだの余白には島番号が付かないので、そこも塗ってしまえば
   ミップマップで元の色がにじみ出るのを防げる——と思って、塗った所から
   余白を伝って6画素ぶん広げたことがある。**効果は無く、害だけあった**：
   ねっけつの袖に残る紺の染みは消えず（あれは余白ではなく別のUV島）、
   かんろくは**黒い上着の縫い目に白い線**が走った（隣り合う髪の島の
   余白が白くなり、上着のふちが線形補間でそれを拾う）。
   ふちのぼかしは、この2画素で足りている。 */
if (EDGE) console.log(`顔の島の中から拾った画素: ${edged}`);

/* ▍瞳を守る（→ recolor-sensei.mjs のメモ）
   白目（明るくて彩度の無い画素）のまわりの暗い画素は、瞳・まつげ・
   アイライン。髪を塗るときは必ずここを外す。

   **ただし、髪の島の中では効かせない。** 髪にも明るいハイライトがあるので、
   そのまわりの暗い画素まで守ってしまい、**髪がまだらに染め残る**
   （おっとりで実際に斑点だらけになった）。瞳がいるのは顔の島なので、
   画素単位で拾ったところ（fromEdge）にだけ掛ければ足りる。 */
const guard = new Uint8Array(SIZE * SIZE);
if (KEEP_EYES) {
  const white = new Uint8Array(SIZE * SIZE);
  const dark = new Uint8Array(SIZE * SIZE);
  for (let p = 0; p < SIZE * SIZE; p++) {
    const i = p * info.channels;
    const [, s, l] = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    /* ▍白目の判定は**目のある島の中だけ**
       明るくて彩度の無い画素は、白いシャツにも髪のハイライトにもある。
       島を見ずに拾うと、そこから下の「たどり」が服や髪へ流れ出す
       （おっとりでベルトが黒く残り、前髪に黒い筋が走った）。 */
    if (l > 0.75 && s < 0.18 && hasEyeIslands.has(islandMap[p])) white[p] = 255;
    if (l < 0.55) dark[p] = 255;
  }
  /* ▍白目から、**暗い所づたいに**広げる（何画素で切るか、ではなく）
     前は白目のまわり EYE_R 画素を守っていた。おっとりの片目だけが
     桜色に染まったのがこれで、瞳がひとつの小さなUV島に分かれていて
     （白目を含まないので「目の島」の判定にも掛からない）、外周
     数画素ぶんしか守れていなかった。

     瞳・まつげ・アイラインは**白目と絵の上でつながっている**ので、
     暗い画素をたどれば島の切れ目に関係なく全部拾える。
     たどりすぎて前髪へ逃げないよう、白目からの距離で頭打ちにする。 */
  const MAX = Number(opt('eye-reach', 26));
  const q = [];
  const dist = new Int16Array(SIZE * SIZE).fill(-1);
  for (let p = 0; p < SIZE * SIZE; p++) if (white[p]) { dist[p] = 0; q.push(p); }
  for (let h = 0; h < q.length; h++) {
    const p = q[h];
    if (dist[p] >= MAX) continue;
    const x = p % SIZE, y = (p / SIZE) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue;
      const np = ny * SIZE + nx;
      if (dist[np] >= 0 || !dark[np]) continue;
      dist[np] = dist[p] + 1;
      guard[np] = 255;
      q.push(np);
    }
  }
  /* 白目のすぐ外側は、暗くなくても守る（アイラインのふちのぼかし） */
  const near = dilate(white, EYE_R);
  for (let p = 0; p < SIZE * SIZE; p++) if (near[p] && dark[p]) guard[p] = 255;
}

const out = Buffer.alloc(SIZE * SIZE * 3);
let painted = 0;
for (let p = 0; p < SIZE * SIZE; p++) {
  const i = p * info.channels;
  const r0 = data[i] / 255, g0 = data[i + 1] / 255, b0 = data[i + 2] / 255;
  if (!mask[p] || (guard[p] && fromEdge[p])) {
    out[p * 3] = r0 * 255; out[p * 3 + 1] = g0 * 255; out[p * 3 + 2] = b0 * 255;
    continue;
  }
  const [hPx, sPx, l] = rgbToHsl(r0, g0, b0);
  /* ▍ふちの「混ざった色」は残す（--strict）
     看板キャラの猫は、シャツと体の境目が**黄緑のぼかし**で描いてある。
     島ごと塗ると、そのぼかしまで色が変わって、黄色い体の上に**水色の
     しみ**が浮いた（緑のうちは黄色と馴染んでいて目立たなかった）。
     島で場所を決めたうえで、**画素の色が指定した範囲に入っているかを
     もう一度見る**。境目のぼかしは元のまま残るので、自然につながる。 */
  if (STRICT && !(inHue(hPx) && sPx >= SMIN && sPx <= SMAX)) {
    out[p * 3] = r0 * 255; out[p * 3 + 1] = g0 * 255; out[p * 3 + 2] = b0 * 255;
    continue;
  }
  const [r, g, b] = hslToRgb(HUE, SAT, Math.pow(l, LIFT));
  out[p * 3] = r * 255; out[p * 3 + 1] = g * 255; out[p * 3 + 2] = b * 255;
  painted++;
}
const file = `${DIR}${OUT}-texture.jpg`;
await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 3 } })
  .jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toFile(file);
console.log(`塗った（${painted}画素 / 瞳ガード${KEEP_EYES ? 'あり' : 'なし'}）`);
console.log('->', file);
