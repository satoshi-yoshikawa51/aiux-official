/* 顔と肩の間の「つなぎ」を切り離す。**穴は空けない。**

   ▍何が起きるか
   頭が大きく肩に近いキャラ（看板キャラの猫）だと、Tripoは**あごと肩の間に
   面を張ってしまう**。顔をHead100%で固定すると、この面が「動かない顔」と
   「動く腕」の間で引き伸ばされ、板状のヘンな形が出る。

   ▍削るのではなく、切り離す
   最初はその面を削除した。伸びは消えたが**肩に穴が空いた**（周囲長2.2の大穴）。
   穴を扇状に塞ごうとすると、蓋の三角形がまた顔と腕にまたがるので、
   **削った膜と同じものを作り直す**ことになる（また伸びる）。

   そこで面は残したまま、**頂点を複製して縁で切り離す**:
   - またがった三角形は「顔側」か「腕側」か多数決で決める
   - その三角形の頂点のうち、決めた側に属さないものは複製し、
     複製の側にボーンを100%で付け替える
   結果、面はそのまま（穴なし）で、三角形は片側と一緒に剛体で動く（伸びない）。
   切れ目はあごと肩の隙間に隠れる。

   使い方:
     node tools/cut-head-web.mjs in.glb out.glb

   ※ 顔の固定（fix-head-weights.mjs）の後に実行すること。
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const args = process.argv.slice(2);
const [IN, OUT] = args.filter((a) => !a.startsWith('--'));
/* split = 頂点を複製して切り離す（穴は空かないが合わせ目のフラップが見える）
   delete = またがった面を削除する（すっきりするが穴が空く。裏面描画とセットで） */
const MODE = args.includes('--delete') ? 'delete' : 'split';

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const doc = await io.read(IN);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const names = root.listSkins()[0].listJoints().map((j) => j.getName());
const headIndex = names.indexOf('Head');
/* ▍腕だけでなく脚も「体側」に入れる
   看板キャラ（猫）は、**あごの脇の頂点に太ももが82%乗っている**。
   Tripoの自動スキニングは、頭が大きく手足が短いデフォルメ体型だと
   こういう組み合わせを作る。腕だけを体側とみなしていたころは、この
   三角形が「顔（固定）」と「どちらでもない」の組になって素通りし、
   **手を下ろすと顔の脇にトゲが浮いていた**（idle-aで実寸0.05超えが39枚）。 */
const BODY =
  /^(L|R)_(Clavicle|Upperarm|UpperarmTwist\d*|Forearm|ForearmTwist\d*|Hand|Finger|Thumb|Thigh|ThighTwist\d*|Calf|CalfTwist\d*|Foot|ToeBase)/;

let split = 0;
let dupes = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    const idx = prim.getIndices();
    if (!J || !W || !idx) continue;
    const count = J.getCount();

    /* 頂点の持ち主。1=顔 2=体（腕・脚） 0=どちらでもない */
    const own = new Uint8Array(count);
    const armW = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const j = J.getElement(i, [0, 0, 0, 0]);
      const w = W.getElement(i, [0, 0, 0, 0]);
      let h = 0;
      let a = 0;
      for (let k = 0; k < 4; k++) {
        if (j[k] === headIndex) h += w[k];
        if (BODY.test(names[j[k]] ?? '')) a += w[k];
      }
      armW[i] = a;
      /* ▍**半分ずつで切る。「どちらが多いか」にしてはいけない**
         多いほうに寄せる版を試したことがある。あご下ののこぎりは減ったが、
         切り離す三角形が74枚→459枚に増えて、**お辞儀したときに背中の
         上着が全部ばらばらに裂けた**（前から見ると頭で隠れて気づかない。
         真後ろと真上から見て初めて分かる）。
         剛体にする面は少ないほどよい。ここは「はっきり顔」と「はっきり体」の
         あいだだけに留めて、残った局所の裂けは
         tools/cut-tearing-faces.mjs で場所を限って潰す。 */
      own[i] = h >= 0.5 ? 1 : a >= 0.5 ? 2 : 0;
    }

    /* またがった三角形を、片側に寄せる */
    const extra = []; // {src, side, armSrc}
    const dupIndex = new Map(); // `${src}:${side}` -> 新しい頂点番号
    const newIdx = [];
    for (let t = 0; t < idx.getCount(); t += 3) {
      const vi = [idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2)];
      const o = vi.map((v) => own[v]);
      if (!(o.includes(1) && o.includes(2))) {
        newIdx.push(...vi);
        continue;
      }
      split++;
      if (MODE === 'delete') continue; // 面ごと捨てる
      const side = o.filter((x) => x === 1).length >= o.filter((x) => x === 2).length ? 1 : 2;
      /* 体側に寄せるときは、いちばん体らしい頂点のウェイトを借りる */
      const armSrc = vi.reduce((best, v) => (armW[v] > armW[best] ? v : best), vi[0]);
      newIdx.push(
        ...vi.map((v) => {
          if (own[v] === side) return v;
          const key = `${v}:${side}`;
          if (!dupIndex.has(key)) {
            dupIndex.set(key, count + extra.length);
            extra.push({ src: v, side, armSrc });
            dupes++;
          }
          return dupIndex.get(key);
        }),
      );
    }
    if (!extra.length) {
      prim.setIndices(
        doc
          .createAccessor()
          .setType('SCALAR')
          .setArray(new (idx.getArray().constructor)(newIdx))
          .setBuffer(buffer),
      );
      continue;
    }

    /* すべての属性に、複製ぶんを足す。型はそのまま保つ（GLBを太らせない） */
    for (const semantic of prim.listSemantics()) {
      const acc = prim.getAttribute(semantic);
      const src = acc.getArray();
      const comps = acc.getElementSize();
      const Ctor = src.constructor;
      const out = new Ctor((count + extra.length) * comps);
      out.set(src.subarray(0, count * comps));
      for (let e = 0; e < extra.length; e++) {
        const from = extra[e].src * comps;
        out.set(src.subarray(from, from + comps), (count + e) * comps);
      }
      const next = doc
        .createAccessor()
        .setType(acc.getType())
        .setArray(out)
        .setNormalized(acc.getNormalized())
        .setBuffer(buffer);
      prim.setAttribute(semantic, next);
    }

    /* 複製した頂点のボーンを付け替える */
    const J2 = prim.getAttribute('JOINTS_0');
    const W2 = prim.getAttribute('WEIGHTS_0');
    const jArr = J2.getArray();
    const wArr = W2.getArray();
    const wScale = W2.getNormalized() ? (wArr.constructor === Uint8Array ? 255 : 65535) : 1;
    for (let e = 0; e < extra.length; e++) {
      const at = (count + e) * 4;
      if (extra[e].side === 1) {
        /* 顔側 … Head 100% */
        jArr[at] = headIndex;
        jArr[at + 1] = 0;
        jArr[at + 2] = 0;
        jArr[at + 3] = 0;
        wArr[at] = wScale;
        wArr[at + 1] = 0;
        wArr[at + 2] = 0;
        wArr[at + 3] = 0;
      } else {
        /* 腕側 … いちばん腕らしい頂点のウェイトをそのまま借りる */
        const from = extra[e].armSrc * 4;
        for (let k = 0; k < 4; k++) {
          jArr[at + k] = jArr[from + k];
          wArr[at + k] = wArr[from + k];
        }
      }
    }

    prim.setIndices(
      doc
        .createAccessor()
        .setType('SCALAR')
        .setArray(new (idx.getArray().constructor)(newIdx))
        .setBuffer(buffer),
    );
  }
}

for (const acc of root.listAccessors()) {
  if (acc.listParents().every((p) => p.propertyType === 'Root')) acc.dispose();
}

await io.write(OUT, doc);
console.log(`顔と体をまたぐ三角形を切り離し: ${split}枚（複製した頂点 ${dupes}個・穴は空けない）`);
console.log('->', OUT);
