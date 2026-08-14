/* 顔が動くたびに歪むのを止める。**顔をバインドポーズの形のまま剛体にする。**

   ▍何が起きるか
   Tripoの自動スキニングは、頭が大きく肩に近いキャラ（看板キャラの猫など）だと
   顔の下側（あご・ほお）に肩や腕のボーンまで塗る。すると腕を振るたびに
   顔がそちらへ引っ張られて溶ける。

   ▍やり方：Headのウェイトが乗っている頂点を、丸ごと Head 100% にする
   顔は剛体でよい（＝最初の丸い顔が、そのまま各モーションに載る）。
   --lock 以上Headが乗っている頂点を 100% にするだけ。幾何は一切見ない。
   襟や肩はHeadがほとんど乗っていないので、そのまま体側に残る。

   ▍先に試して駄目だったやり方（同じ轍を踏まないように）
   - Headが50%以上の頂点だけ直す … いちばん溶けるあごが漏れる（0.3〜0.5だから）
   - 高さで切って上を全部Head … 頭が大きいキャラでは腕と手まで巻き込んで壊れる
   - 頭を楕円体で囲う … 猫は顔の下が広くてはみ出し、逆に襟を飲み込んだ
   - 首で切って面を伝って広げる … **猫は首がくびれていないので切る位置を誤り、
     あごを体側に残してしまった**（輪切りの最小＝首、が成り立たない）
   要するに、この造形では幾何で頭と体を分けられない。ウェイトで分けるのが正解。

   使い方:
     node tools/fix-head-weights.mjs in.glb out.glb [--lock 0.3] [--soften 0.05]
   - --lock   : これ以上Headが乗っていたら顔とみなし、100%固定する
   - --soften : これ以上Headが乗っている（が --lock 未満の）頂点からは、
                腕側のボーンだけ外す。固定した顔との境目をなだらかにするため

   直ったかは wave（手を振る）と arms-crossed（腕を組む）で顔・肩・手を見る。
*/
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const args = process.argv.slice(2);
const [IN, OUT] = args.filter((a) => !a.startsWith('--'));
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const LOCK = opt('lock', 0.3);
const SOFTEN = opt('soften', 0.05);
/** 腕のウェイトがこれ以上ある頂点は「肩かもしれない」とみなす */
const ARMGUARD = opt('armguard', 0.2);
/** 顔の幅からどれだけ外まで顔として許すか */
const MARGIN = opt('margin', 0.05);
/** 顔の芯とみなすHeadウェイト（ここから広げる） */
const SEED = opt('seed', 0.9);

/** 腕側のボーン。顔まわりに乗っていたら外す */
const ARM = /^(L|R)_(Clavicle|Upperarm|UpperarmTwist\d*|Forearm|ForearmTwist\d*|Hand|Finger|Thumb)/;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const doc = await io.read(IN);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const names = root.listSkins()[0].listJoints().map((j) => j.getName());
const headIndex = names.indexOf('Head');
if (headIndex < 0) throw new Error('Head ボーンが見つかりません');
/* ふちを預ける先。頭のすぐ下の首ボーン */
const neckIndex = ['NeckTwist02', 'NeckTwist01', 'Neck'].map((n) => names.indexOf(n)).find((i) => i >= 0) ?? -1;

/* ▍顔と肩を分ける基準は「頭自身の幅」
   ほおと肩は高さも左右位置も重なるので、定数では切れない。
   ただし**腕のウェイトが乗っていない頭の頂点**＝まぎれもない顔、の広がりを
   測れば、それより外に出ているものは顔ではない。看板キャラSRだと
   顔の幅は |x|<=0.48、はみ出していた肩は |x| 0.40〜0.60 だった。 */
let faceHalfWidth = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    const P = prim.getAttribute('POSITION');
    if (!J || !W || !P) continue;
    for (let i = 0; i < J.getCount(); i++) {
      const j = J.getElement(i, [0, 0, 0, 0]);
      const w = W.getElement(i, [0, 0, 0, 0]);
      let h = 0;
      let a = 0;
      for (let k = 0; k < 4; k++) {
        if (j[k] === headIndex) h += w[k];
        if (ARM.test(names[j[k]] ?? '')) a += w[k];
      }
      if (h < LOCK || a >= 0.05) continue;
      faceHalfWidth = Math.max(faceHalfWidth, Math.abs(P.getElement(i, [0, 0, 0])[0]));
    }
  }
}
const OUTSIDE = faceHalfWidth + MARGIN;

let locked = 0;
let softened = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    const P = prim.getAttribute('POSITION');
    const idx = prim.getIndices();
    if (!J || !W || !P || !idx) continue;
    const count = P.getCount();

    const JCtor = J.getArray().constructor;
    const WCtor = W.getArray().constructor;
    const normalized = W.getNormalized();
    const SCALE = normalized ? (WCtor === Uint8Array ? 255 : 65535) : 1;
    const jOut = new JCtor(J.getCount() * 4);
    const wOut = new WCtor(W.getCount() * 4);

    for (let i = 0; i < W.getCount(); i++) {
      const j = J.getElement(i, [0, 0, 0, 0]);
      const w = W.getElement(i, [0, 0, 0, 0]);

      let head = 0;
      let arm = 0;
      for (let k = 0; k < 4; k++) {
        if (j[k] === headIndex) head += w[k];
        if (ARM.test(names[j[k]] ?? '')) arm += w[k];
      }

      const lateral = Math.abs(P.getElement(i, [0, 0, 0])[0]);
      /* 顔の幅より外に出ていて、腕のウェイトも乗っている＝肩・上腕。
         顔の幅は「腕のウェイトが無い頭の頂点」から測ってあるので、
         **ほおは絶対にこちらに落ちない** */
      const isShoulder = lateral > OUTSIDE && arm >= ARMGUARD;

      /* ▍顔の判定は Head のウェイトだけ。ここに条件を足してはいけない。
         肩よけ・つながり・楕円体…と足すたびに、猫の広いほお（|x|は肩と同じ、
         高さも重なる）が巻き添えで外れて顔が溶けた。**5回やって5回とも失敗した。**
         肩は「ふち」の側だけで処理する（下の分岐）。 */
      if (head >= LOCK) {
        /* 顔。バインドポーズの形のまま動くように、Head 100% にする。
           **判定はHeadのウェイトだけ。座標もつながりも見ない。**
           肩よけの条件やつながり判定を足すと、猫の広いほお（|x|が0.6まであり
           肩と同じ幅・同じ高さ）が巻き添えで外れ、顔が溶ける。何度もやった。 */
        j[0] = headIndex;
        w[0] = 1;
        for (let k = 1; k < 4; k++) {
          j[k] = 0;
          w[k] = 0;
        }
        locked++;
      } else if (head > 0 && isShoulder) {
        /* 肩・上腕。Headを捨てて体側に返す（腕と一緒に動いてほしい）。
           首に移すのは駄目。首は頭と一緒に動くので結局顔に引っぱられる */
        for (let k = 0; k < 4; k++) if (j[k] === headIndex) w[k] = 0;
        const sum = w[0] + w[1] + w[2] + w[3];
        if (sum > 0) {
          for (let k = 0; k < 4; k++) w[k] /= sum;
          softened++;
        }
      } else if (head >= SOFTEN) {
        /* 顔のふち（Headが0.05〜0.3）。ここは2種類が混ざっている。

           ▍あご・ほおのふち（中心寄り）
           **Headのぶんは残す。** ここを体に返すと、顔の輪郭が頭から外れて
           結局「顔が溶ける」。腕のボーンだけ落として、腕に引かれないようにする。

           ▍肩・上腕のふち（外側で腕のウェイトも乗っている）
           こちらは**Headを捨てて体側に返す**。残すと肩が顔に引っぱられて
           板状に伸びる（実機で出た黄色い伸び）。 */
        let changed = false;
        for (let k = 0; k < 4; k++) {
          if (w[k] <= 0) continue;
          if (ARM.test(names[j[k]] ?? '')) {
            /* 肩のふちでは腕を残す（腕と一緒に動いてほしい） */
            if (!isShoulder) {
              w[k] = 0;
              changed = true;
            }
          } else if (j[k] === headIndex && isShoulder) {
            w[k] = 0;
            changed = true;
          }
        }
        if (changed) {
          let sum = w[0] + w[1] + w[2] + w[3];
          if (sum <= 0 && neckIndex >= 0) {
            j[0] = neckIndex;
            w[0] = 1;
            sum = 1;
          }
          if (sum > 0) for (let k = 0; k < 4; k++) w[k] /= sum;
          softened++;
        }
      }

      jOut.set(j, i * 4);
      if (SCALE === 1) {
        wOut.set(w, i * 4);
      } else {
        const q = w.map((x) => Math.round(x * SCALE));
        let big = 0;
        for (let k = 1; k < 4; k++) if (q[k] > q[big]) big = k;
        q[big] += SCALE - (q[0] + q[1] + q[2] + q[3]);
        wOut.set(q, i * 4);
      }
    }
    prim.setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(jOut).setBuffer(buffer));
    prim.setAttribute(
      'WEIGHTS_0',
      doc.createAccessor().setType('VEC4').setArray(wOut).setNormalized(normalized).setBuffer(buffer),
    );
  }
}

for (const acc of root.listAccessors()) {
  if (acc.listParents().every((p) => p.propertyType === 'Root')) acc.dispose();
}

await io.write(OUT, doc);
console.log(`顔の幅 |x|<=${faceHalfWidth.toFixed(2)} より外＋腕ありは肩とみなす`);
console.log(`顔として固定(Head100%): ${locked}頂点 / ふちの腕を外した: ${softened}頂点 (lock=${LOCK})`);
console.log('->', OUT);
