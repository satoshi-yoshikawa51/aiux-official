/* ============================================================
   相棒の色違い（R）テクスチャを作る。**キャラを選べる版**。

     node tools/recolor-avatar.mjs <モデルID> --diagnose
     node tools/recolor-avatar.mjs <モデルID> --hmin 340 --hmax 30 --lmax 0.35 \
       --hue 34 --light 0.45 --sat 0.55 --out <id>-r

   ▍**焼いたら必ず tools/check-recolor.mjs で測る。**
   目で見て「なんか変」で止めると同じ所を何度も踏む。見るのは4つ——
   陰影の残り／まだらな島／まるごと残った島／肌と目のはみ出し。

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
      塗る色は --hue / --light / --sat（出来上がりの平均をどこへ置くか）

   ▍**島は「服の単位」ではない。** ここでいちばん時間を溶かした
   Tripoのアトラスは胴を横帯に割るので、1つの島がジャケットとインナー、
   猫の黄色い腕と緑の袖、ニットとレギンスを**またぐ**。島の平均だけで
   選ぶと、必ずどちらかが染みになる。またいでいる島は
   --plmin/--plmax（画素の明度で切る）か --strict（画素の色相で切る）で
   中を分ける。またいでいるかどうかは、診断テクスチャを
   **モデルに貼って3Dで見る**のがいちばん早い。

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
/* ============================================================
   ▍色の指定は「**塗る範囲の平均をどこへ動かすか**」で書く

   もとは --sat と --lift で、彩度は決め打ち・明度は累乗だった。
   これだと布の折り目も縫い目も全部おなじ色になり、遠目に塗り絵に見える。
   しかも「暗い服を明るく振る」と相対の差が潰れるので、**同じ数字を
   入れてもキャラごとに平らさが変わる**（紺のズボンは 0.19±47% が
   0.50±15% になっていた）。

   いまは塗る範囲の平均を測って、**平均だけを動かし、ずれはそのまま足す**。
   比で持ち込む形（tgt * (l/mL)^c）も試したが、暗い服を明るく振ると
   縫い目だけが**ひび割れのように黒く**残った——比で持つと、暗い画素ほど
   大きく開くため。足し算なら、影の深さが元のまま平行移動する。

   - --light  出来上がりの平均の明度（省略で元のまま）
   - --sat    出来上がりの平均の彩度（省略で元のまま）
   - --contrast 陰影の強さ。1で元のまま、小さいほど平ら。既定1
   - --shadow   影側だけの強さ。**暗い服を明るい色に振るときは要る**。
                布に焼かれた縫い目やAOは、紺のうちは見えないのに、
                明るくすると**ひび割れのように黒い線**で浮く。既定は
                「明るくしたぶんだけ影を薄くする」（元の平均÷目標の平均）。
   ============================================================ */
const LIGHT = opt('light', null) === null ? null : Number(opt('light'));
const SAT = opt('sat', null) === null ? null : Number(opt('sat'));
const CONTRAST = Number(opt('contrast', 1));
const SHADOW = opt('shadow', null) === null ? null : Number(opt('shadow'));
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
/** ▍選んだ島の中でも、色が違いすぎる画素は弱く塗る（--strict）
    2値で切ると境目が点々になるので、色相がどれだけ外れているかで薄くする。
    --strict-fade は「何度ぶんで0まで落とすか」（既定30度） */
const STRICT = args.includes('--strict');
const STRICT_FADE = Number(opt('strict-fade', 30));
/* ▍**島を選ぶ色相の窓は、画素を塗る窓より広くできる**（--island-hmin/hmax）
   看板キャラの猫は、袖の島が黄色い腕と緑のシャツをまたいでいる。島の平均は
   黄緑（色相47・71）になるので、塗る窓（85〜175）では選べない。かといって
   塗る窓を47まで下げると、黄色い体まで青くなる。
   **選ぶのは広く、塗るのは狭く**——を分けて、あいだは --strict に任せる。 */
const IHMIN = opt('island-hmin', null) === null ? HMIN : Number(opt('island-hmin'));
const IHMAX = opt('island-hmax', null) === null ? HMAX : Number(opt('island-hmax'));
/* ============================================================
   ▍**1つの島に、上着とインナーが同居していることがある**（--plmin/--plmax）

   先輩のアトラスは、胴の島がジャケットとインナーTシャツをまたいでいる。
   島ごと塗ると、ジャケットを生成りに振ったときにTシャツまで
   持ち上がって**真っ白に飛ぶ**（実際そうなった）。逆にインナーを黒へ
   落とすと、同じ島に載っているジャケットの一部が黒い染みになる。

   島は「どのチャートを触るか」までしか決められないので、
   **その中のどの画素かは明度で切る**。上着は0.15〜0.25、インナーは
   0.45〜0.60 と、絵の上では十分に離れている。
   境目は --pfade（既定0.06）でなめらかにする。 */
const PLMIN = opt('plmin', null) === null ? null : Number(opt('plmin'));
const PLMAX = opt('plmax', null) === null ? null : Number(opt('plmax'));
const PFADE = Number(opt('pfade', 0.06));
if (!ID) {
  console.error('使い方: node tools/recolor-avatar.mjs <モデルID> --diagnose');
  process.exit(1);
}

const DIR = new URL('../assets/models/', import.meta.url).pathname;
/* ▍二度塗り（--in）
   1枚の色違いで**2か所を別の色に**したいことがある（せんぱいは
   ジャケットを生成りにして、インナーを黒に）。島の地図はGLBから作るので
   何度でも掛けられるが、2回目は**1回目の出来上がりを読む**必要がある。
   `--in <ID>` で元になるテクスチャだけ差し替える（GLBは <モデルID> のまま）。
   ※ 2回目の島の色は1回目の結果で測られる。条件は塗ったあとの色で書くこと。 */
const SRC = `${DIR}${opt('in', ID)}-texture.jpg`;
/* ▍**島の色を測るテクスチャは、塗るテクスチャと別にできる**（--stats）
   二度塗りの2回目は、1回目で塗った色の上で島を選ぶことになる。先輩は
   胴の島がジャケットとインナーをまたいでいるので、1回目でジャケットを
   生成りにすると島の平均が生成りに寄って、**同じ島がもう選べなくなる**。
   選ぶのは素の色で、塗るのは1回目の上で——を分けられるようにする。 */
const STATS_SRC = `${DIR}${opt('stats', opt('in', ID))}-texture.jpg`;
const GLB = `${DIR}${ID}.glb`;
/* ▍テクスチャの一辺は**画像から読む**。決め打ちにしない
   先輩だけ1024で、あとの相棒は512。1024のつもりで読むと、
   配列の外を触って色の統計が全部NaNになる（最初それで詰まった）。 */
const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const SIZE = info.width;
if (info.width !== info.height) throw new Error('正方形のテクスチャを想定しています');
/** 「どこを塗るか」を決めるときに見る色。--stats を省けば塗る絵と同じ */
const sel = STATS_SRC === SRC ? { data, info } : await sharp(STATS_SRC).raw().toBuffer({ resolveWithObject: true });
const sdata = sel.data;
const sch = sel.info.channels;
if (sel.info.width !== SIZE) throw new Error('--stats のテクスチャは同じ大きさにしてください');

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
  const i = p * sch;
  const [h, s, l] = rgbToHsl(sdata[i] / 255, sdata[i + 1] / 255, sdata[i + 2] / 255);
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
/* ▍**小さい島も拾う。** 200画素で切っていたころ、赤いスーツの襟に
   125画素の紺の島が残って、遠目に染みに見えた。診断の表は --top で
   絞れるので、閾値は下げてよい */
const MIN_ISLAND = Number(opt('min-island', 40));
const rows = [...stats.entries()]
  .filter(([, st]) => st.n >= MIN_ISLAND)
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
const inHue = (h, lo = HMIN, hi = HMAX) => {
  if (XHMIN !== null && XHMAX !== null && between(h, XHMIN, XHMAX)) return false;
  if (lo === null || hi === null) return true;
  return between(h, lo, hi);
};
/** 色相の輪の上での距離（度） */
const hueGap = (h, lo, hi) => {
  if (HMIN === null || HMAX === null) return 0;
  if (between(h, lo, hi)) return 0;
  const d = (a, b) => { const x = Math.abs(a - b) % 360; return x > 180 ? 360 - x : x; };
  return Math.min(d(h, lo), d(h, hi));
};

/* ▍「白目がある」だけで目とみなさない。**顔の高さも見る**
   明るくて彩度の無い画素は、白いシャツのふちや金具にもある。高さを見ずに
   切ったせいで、ねっけつは上着の襟と袖口の島が「目」になり、そこだけ
   紺のまま残った（赤い上着に紺のまだら）。 */
const allY = [...box.values()];
const bodyMin = Math.min(...allY.map((b) => b.minY));
const bodyMax = Math.max(...allY.map((b) => b.maxY));
const EYE_YMIN = Number(opt('eye-ymin', bodyMin + (bodyMax - bodyMin) * 0.72));
const upperHalf = (isl) => (box.get(isl)?.maxY ?? -99) >= EYE_YMIN;

/* 白目だらけの島＝目そのもの。塗らないし、拾い足しからも外す */
const eyeIslands = new Set(rows.filter((r) => r.白目 > 0.03 && upperHalf(r.島)).map((r) => r.島));
const hasEyeIslands = new Set(
  [...stats.entries()].filter(([isl, st]) => st.white >= 12 && upperHalf(isl)).map(([isl]) => isl),
);

const pick = new Set(ISLANDS);
if (!ISLANDS.length) {
  for (const r of rows) {
    const b = box.get(r.島);
    if (!inHue(r.色相, IHMIN, IHMAX)) continue;
    if (r.彩度 < SMIN || r.彩度 > SMAX) continue;
    if (r.明度 < LMIN || r.明度 > LMAX) continue;
    if (b.maxY < YMIN || b.minY > YMAX) continue;
    /* ▍瞳ガードは eyeIslands（＝顔の高さも見る）で判定する。
       ここで白目の割合だけを見ていたころ、**赤いスーツの襟と袖口と腿に
       紺の染みが残った**。白い縁取りのある島が「目」と誤判定されて、
       まるごと塗り残されていた。 */
    if (KEEP_EYES && eyeIslands.has(r.島)) continue;
    pick.add(r.島);
  }
  if (!pick.size) {
    console.error('条件に合う島がありません（--diagnose で表を見てください）');
    process.exit(1);
  }
  const px = rows.filter((r) => pick.has(r.島)).reduce((a, r) => a + r.画素, 0);
  console.log(`選んだ島: ${pick.size}個 / ${px}画素（テクスチャの${((px / (SIZE * SIZE)) * 100).toFixed(1)}%）`);
}

/* ============================================================
   ▍塗る強さは0か1ではなく、**0〜1の重み**で持つ

   もとは「塗る／塗らない」の2値だった。すると、島の中に条件から
   外れる画素が混ざったとき——布のいちばん濃い影、縫い目、境目の
   ぼかし——**そこだけ元の色で residual として残り、黒い点々が散る**。
   実際、6体すべてで「5〜95%だけ塗られた島」が8〜20個あった
   （→ tools/check-recolor.mjs が数える）。

   重みにすれば、合わない画素は**弱く塗られる**だけで、点にならない。
   最後に3x3で軽くならして、1画素だけ浮くのも消す。
   ============================================================ */
const w = new Float32Array(SIZE * SIZE);
/* 画素単位で拾ったところ（＝顔の島の中の前髪）。瞳ガードはここにだけ効かせる */
const fromEdge = new Uint8Array(SIZE * SIZE);
/** 明度の窓（--plmin/--plmax）で落とした画素。ふちを広げるときも避ける */
const gated = new Uint8Array(SIZE * SIZE);
let edged = 0;
for (let p = 0; p < SIZE * SIZE; p++) {
  const isl = islandMap[p];
  if (isl < 0) continue;
  const i = p * sch;
  const [h, sPx, l] = rgbToHsl(sdata[i] / 255, sdata[i + 1] / 255, sdata[i + 2] / 255);
  /* 明度の窓（→ --plmin/--plmax のメモ）。窓の外は0、境目はなめらかに */
  const lGate =
    (PLMIN === null ? 1 : smooth(PLMIN - PFADE, PLMIN + PFADE, l)) *
    (PLMAX === null ? 1 : 1 - smooth(PLMAX - PFADE, PLMAX + PFADE, l));
  if (lGate < 0.5) gated[p] = 255;
  if (pick.has(isl)) {
    /* ▍選んだ島の中でも、色が違いすぎる画素は弱くする（--strict）
       看板キャラの猫は、シャツと体の境目が黄緑のぼかしで描いてある。
       島ごと全部塗ると黄色い体に水色のしみが浮き、はっきり切ると
       境目が点々になる。**間を取って、離れるほど薄く塗る。** */
    w[p] = (STRICT ? Math.max(0, 1 - hueGap(h, HMIN, HMAX) / STRICT_FADE) : 1) * lGate;
    continue;
  }
  if (!EDGE) continue;
  const bx = box.get(isl);
  if (bx && (bx.maxY < YMIN || bx.minY > YMAX)) continue;
  if (KEEP_EYES && eyeIslands.has(isl)) continue;
  if (l < EDGE_LMAX && sPx >= SMIN && sPx <= SMAX && inHue(h)) { w[p] = lGate; fromEdge[p] = 255; edged++; }
}
if (EDGE) console.log(`顔の島の中から拾った画素: ${edged}`);

/* ▍瞳を守る（→ 下のメモ）。守る所は重み0 */
if (KEEP_EYES) {
  const white = new Uint8Array(SIZE * SIZE);
  const dark = new Uint8Array(SIZE * SIZE);
  for (let p = 0; p < SIZE * SIZE; p++) {
    const i = p * sch;
    const [, s, l] = rgbToHsl(sdata[i] / 255, sdata[i + 1] / 255, sdata[i + 2] / 255);
    if (l > 0.75 && s < 0.18 && hasEyeIslands.has(islandMap[p])) white[p] = 255;
    if (l < 0.55) dark[p] = 255;
  }
  /* ▍白目から、**暗い所づたいに**広げる（何画素で切るか、ではなく）
     瞳・まつげ・アイラインは白目と絵の上でつながっているので、暗い画素を
     たどれば島の切れ目に関係なく全部拾える。前髪へ逃げないよう頭打ちにする。 */
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
      if (fromEdge[np]) w[np] = 0;
      q.push(np);
    }
  }
  const near = dilate(white, EYE_R);
  for (let p = 0; p < SIZE * SIZE; p++) if (near[p] && dark[p] && fromEdge[p]) w[p] = 0;
}

/* ============================================================
   ▍ふちを2画素ぶん広げる。**アトラスの余白（島と島のあいだ）にも広げる**

   ここを島の中だけに限ると、**塗った服に黒い線が走る**。線の正体は
   縫い目でも影でもなく、**島の境目の余白**（Tripoがにじみ止めに元の色を
   広げてある所）で、描画のときの線形補間でそこを拾ってしまう。
   おっとりのズボンに膝と内股のひび割れが出たのがこれだった。

   ただし**2画素まで**。6画素まで広げたことがあるが、黒い上着の縫い目に
   白い線が走った（隣り合う別の島の余白まで塗ってしまう）。
   ============================================================ */
{
  const grown = dilate(Uint8Array.from(w, (v) => (v > 0.5 ? 255 : 0)), 2);
  for (let p = 0; p < SIZE * SIZE; p++) if (grown[p] && !gated[p] && w[p] < 1) w[p] = Math.max(w[p], 1);
  const sm = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    let sum = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const ny = y + dy, nx = x + dx;
      if (ny < 0 || ny >= SIZE || nx < 0 || nx >= SIZE) continue;
      sum += w[ny * SIZE + nx]; n++;
    }
    sm[y * SIZE + x] = sum / n;
  }
  w.set(sm);
}

/* ============================================================
   ▍塗り方：**色相だけ置き換えて、陰影は元の比で残す**

   もとは `hslToRgb(HUE, SAT, pow(l, LIFT))`——彩度も明度も決め打ちで、
   布の折り目も縫い目も全部おなじ色になっていた。暗い服を明るい色に
   振ったとき、絶対のばらつきは残っても**相対の差が潰れて**、遠目に
   ただの塗り絵になる（紺のズボン 明度0.19±0.09＝47% が、
   桃 0.50±0.08＝15% になっていた）。

   いまは塗る範囲の平均を測って、**平均だけを目標へ移し、ばらつきは
   比で持ち上げる**。--contrast はその比をどれだけ効かせるか（1で完全）。
   ============================================================ */
let mL = 0, mS = 0, mW = 0;
for (let p = 0; p < SIZE * SIZE; p++) {
  if (w[p] <= 0.01) continue;
  const i = p * info.channels;
  const [, s, l] = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
  mL += l * w[p]; mS += s * w[p]; mW += w[p];
}
mL /= Math.max(1e-6, mW);
mS /= Math.max(1e-6, mW);
const tgtL = LIGHT === null ? mL : LIGHT;
const tgtS = SAT === null ? mS : SAT;
/* 明るくしたぶんだけ影を薄くする（→ 上のメモ）。暗くするときは1のまま */
const shadowK = SHADOW === null ? Math.min(1, mL / Math.max(0.02, tgtL)) : SHADOW;
console.log(
  `塗る範囲の素の色: 明度${mL.toFixed(2)} 彩度${mS.toFixed(2)} → 明度${tgtL.toFixed(2)} 彩度${tgtS.toFixed(2)}` +
    `（影の強さ ${shadowK.toFixed(2)}）`,
);

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const out = Buffer.alloc(SIZE * SIZE * 3);
let painted = 0;
for (let p = 0; p < SIZE * SIZE; p++) {
  const i = p * info.channels;
  const r0 = data[i] / 255, g0 = data[i + 1] / 255, b0 = data[i + 2] / 255;
  const k = w[p];
  if (k <= 0.01) {
    out[p * 3] = r0 * 255; out[p * 3 + 1] = g0 * 255; out[p * 3 + 2] = b0 * 255;
    continue;
  }
  const [, s, l] = rgbToHsl(r0, g0, b0);
  /* 平均からのずれを足す。影側だけ弱める（→ 上のメモ）。両端で止める */
  const dev = l - mL;
  const l2 = clamp(tgtL + dev * CONTRAST * (dev < 0 ? shadowK : 1), 0.02, 0.97);
  /* ▍彩度は**比で**運ぶ。足し算だと0を割って灰色になる
     生成りのジャケット（目標0.18）は、塗る範囲の平均が0.39だった。
     足し算だと平均より鈍い画素が 0.18-0.17＝0.01 まで落ちて、
     **上着の下半分だけ無彩色の灰色**になった（実際そう出た）。
     比なら、鈍い画素は鈍いまま・0を割らない。 */
  const s2 = clamp(tgtS * (1 + CONTRAST * (s - mS) / Math.max(0.05, mS)), 0, 1);
  const [r1, g1, b1] = hslToRgb(HUE, s2, l2);
  out[p * 3] = (r0 + (r1 - r0) * k) * 255;
  out[p * 3 + 1] = (g0 + (g1 - g0) * k) * 255;
  out[p * 3 + 2] = (b0 + (b1 - b0) * k) * 255;
  if (k > 0.5) painted++;
}
const file = `${DIR}${OUT}-texture.jpg`;
await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 3 } })
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(file);
console.log(`塗った（${painted}画素 / 瞳ガード${KEEP_EYES ? 'あり' : 'なし'}）`);
console.log('->', file);
