/* ============================================================
   3Dアバター表示。expo-gl + three.js。

   Web版（サイトの src/app/claude-app/sensei.tsx）と同じ構成だが、
   スマホ向けに2点だけ違う：

   1. GLBはmeshopt圧縮を解いたものを使う
      （meshoptデコーダはWASMで、HermesにはWebAssemblyが無い）
   2. テクスチャはGLBの外に出して、ここで material.map に割り当てる
      （GLB埋め込み画像はRNの画像デコーダを通せないため）

   読み込みに失敗しても学習は続けられるよう、失敗時はアイコンの
   立ち絵にフォールバックする。
   ============================================================ */
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useIsFocused } from 'expo-router';
import { Renderer, TextureLoader } from 'expo-three';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { IDLE, LOOPING, type AvatarMotion } from './motions';
import { Icon, type IconName } from '@/components/icons';
import type { AvatarDef } from '@/data/avatars';
import { pinWebGL1 } from '@/lib/gl-compat';
import { F, T } from '@/theme';

export interface AvatarHandle {
  play: (motion: AvatarMotion) => void;
  /**
   * その動きがこの相棒に入っているか。**相棒ごとにGLBが違うので、
   * 11種が全部そろっているとは限らない**（→ playByName のメモ）。
   * 「歩けないなら歩かせない」のように、演出そのものを変えたいときに使う。
   * モデルを読み終わるまでは false を返す。
   */
  has: (motion: AvatarMotion) => boolean;
  emote: (icon: IconName) => void;
  /**
   * 体の向きを変える（ラジアン、Y軸まわり）。0＝正面。
   * **すぐには向かない。** 描画ループが毎フレーム少しずつ寄せるので、
   * 呼ぶのは1回でよく、あとは勝手に回りきる。
   * 歩いて登場して正面を向く、のような演出に使う（onboarding/intro.tsx）。
   */
  face: (yaw: number) => void;
}

interface Props {
  avatar: AvatarDef;
  width: number;
  height: number;
  /* ▍カメラを少し引く（1＝台帳どおり／1.2＝2割引く）

     画角は台帳（avatars.ts の view）で決めていて、**立っている姿に
     ちょうど合わせてある**。そのため laugh（のけぞって笑う）や bow
     （お辞儀）のように大きく動くモーションだと、**頭が枠の上で切れる**。
     レッスンとクイズの枠は小さいので、そこで目立って出ていた。

     ホームは大きく見せたいので1のまま。芝居をさせる小さい枠だけ引く。 */
  zoom?: number;
  /** モデルの読み込みが終わったら呼ばれる */
  onReady?: () => void;
  /** ▍切り分け用（設定の3D診断だけが使う）
      実機で「特定のモデルだけ黙って描かれない」が出たとき、
      どの工程が犯人かを実機の画面だけで分離するための穴。
      plain: テクスチャを読まず、単色で描く（テクスチャ経路を外す）
      still: アニメーションを一切流さない（ミキサーと足踏み補正を外す） */
  probe?: { plain?: boolean; still?: boolean };
}

/* ============================================================
   ▍歩きは「その場で足踏み」に直してから使う

   walk には**前進が焼き込まれている**（2.4秒で1.1ユニットほど進む。しかも
   先頭が原点から離れているので、再生した瞬間に真横へ1ユニットずれる）。
   そのまま流すと、キャラが自分の枠から出ていって **canvas の端で切れる**。
   一幕（app/intro.tsx）で「出てくるとき右が切れる」として実際に出た。
   移動は画面側（枠ごと translateX で動かす）が受け持つ。

   ▍どの骨に焼かれているかは、キャラによって違う

   先輩（sensei.glb）は Root、あとから足した11体は **Hip** に入っている。
   前は 'Root.position' だけを見ていたので、11体ぶんが素通りしていた。
   骨の名前で決め打ちせず、**大きく動いている位置トラックを探す**。

     sensei     Root  x=0.02  y=0     z=1.12 ←これ
     ottori     Hip   x=0.02  y=1.16 ←これ  z=0.02
     neko       Hip   x=0.02  y=0.87 ←これ  z=0.01

   ▍トラックごと捨てず、**はみ出した軸だけ**寝かせる

   Hip には前進と一緒に腰の上下（歩くバウンド）が入っている。トラックを
   丸ごと落とすと、その気持ちよさまで消える。超えている軸だけを止めて、
   残りはそのまま流す。

   止め先は**その骨の静止姿勢の値**。0 に寄せると、原点から離れた所で
   歩き出すキャラ（先輩は先頭が -0.98）がその場でずれる。静止姿勢に置けば、
   トラックを落としたのと同じ立ち位置になる＝これまでの見え方が変わらない。

   閾値は walk（0.87〜1.37）と、それ以外の全クリップ（最大0.03）の
   あいだを大きく取ってある。新しいモーションを足しても勝手に効く。 */
const TRAVEL = 0.3;

function stripTravel(clip: THREE.AnimationClip, root: THREE.Object3D) {
  for (const t of clip.tracks) {
    if (!t.name.endsWith('.position')) continue;
    const boneName = t.name.slice(0, -'.position'.length);
    for (let axis = 0; axis < 3; axis++) {
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = axis; i < t.values.length; i += 3) {
        if (t.values[i] < lo) lo = t.values[i];
        if (t.values[i] > hi) hi = t.values[i];
      }
      if (hi - lo <= TRAVEL) continue;
      /* 静止姿勢が引けなければ、そのトラックの真ん中に寝かせる
         （少なくとも「行きっぱなし」にはならない） */
      const bone = root.getObjectByName(boneName);
      const rest = bone ? bone.position.getComponent(axis) : (lo + hi) / 2;
      for (let i = axis; i < t.values.length; i += 3) t.values[i] = rest;
    }
  }
}

/* ============================================================
   ▍顔の向きをキャラごとに直す（→ data/avatars.ts の headTilt）

   素のモデルは顎の上げ方がキャラごとにばらばらで、並べると
   「ほとんどが上を向いていて、先輩だけ下を向いている」ように見える。

   直しは**毎フレーム、描いてすぐ戻す**。載せっぱなしにできないのは、
   Head を動かすトラックが入っていないモーションだと、
   ミキサーが姿勢を書き戻してくれず**毎フレーム足されて首が回りきる**ため。
   描く直前に足して、描いたら引く。これならトラックの有無によらない。

   軸は「親から見たX」。three の rotateOnWorldAxis は親の回転を見ない
   （＝実際には premultiply）が、この骨組みでは首の親の横軸が
   世界の横軸とほぼ揃っているので、これで素直に顎が上下する。 */
const TILT_AXIS = new THREE.Vector3(1, 0, 0);

function findHead(root: THREE.Object3D): THREE.Object3D | null {
  let head: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (!head && (o as THREE.Bone).isBone && /^head$/i.test(o.name)) head = o;
  });
  return head;
}

/** アセットをArrayBufferとして読む（fetch(file://)に頼らない） */
async function readArrayBuffer(mod: number): Promise<ArrayBuffer> {
  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return res.arrayBuffer();
  }
  return new File(uri).arrayBuffer();
}

export const Avatar3D = React.forwardRef<AvatarHandle, Props>(function Avatar3D(
  { avatar, width, height, zoom = 1, onReady, probe },
  ref,
) {
  const mixerRef = React.useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = React.useRef<Record<string, THREE.AnimationAction>>({});
  const currentRef = React.useRef<THREE.AnimationAction | null>(null);
  const emoteTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposedRef = React.useRef(false);
  /* 体の向き。root＝いま向いている角度、want＝向きたい角度 */
  const rootRef = React.useRef<THREE.Object3D | null>(null);
  const yawRef = React.useRef(0);
  /* GLコンテキストの世代。枠の寸法が変わるとGLViewを作り直すので、
     **古い描画ループを止める**ために使う。止めないと、破棄済みの
     コンテキストに render して落ちる */
  const genRef = React.useRef(0);

  const [emoteIcon, setEmoteIcon] = React.useState<IconName | null>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'failed'>('loading');
  /* 失敗の中身。リリースビルドでは console.warn がどこにも見えないので、
     フォールバックの画面に小さく出す（実機のスクショで原因が読める） */
  const [errText, setErrText] = React.useState<string | null>(null);

  /* ============================================================
     ▍相棒の差し替えは、**画面が見えているときだけ**反映する

     ガチャで当てた相棒に設定で替えると、GLViewはkeyの変化で作り直される。
     その作り直しが起きるのは**設定画面の裏に隠れたホーム**の上で、iOSは
     隠れている画面のGLコンテキスト作成に失敗することがある（作成イベントが
     来ないまま＝空のキャンバスのまま）。Webでは起きない。実機で
     「ガチャで当てた相棒が出ない」として出た。

     なのでモデルの差し替えはこの liveModel で受けて、画面が前に出てから
     GLViewを作り直す。あわせて前の相棒の残り物（status:'ready' と
     モーション表）を必ず捨てる——'ready' を引き継ぐと、読み込みが
     終わらなかったときに**スピナーも失敗表示も出ない空白**になる。 */
  const focused = useIsFocused();
  const [liveModel, setLiveModel] = React.useState(avatar.model);
  React.useEffect(() => {
    if (!focused || liveModel === avatar.model) return;
    setLiveModel(avatar.model);
    setStatus('loading');
    setErrText(null);
    actionsRef.current = {};
    currentRef.current = null;
    rootRef.current = null;
    mixerRef.current = null;
  }, [focused, avatar.model, liveModel]);

  /* ▍読み込みの見張り
     万一GLコンテキストの作成イベント自体が来ないと、上の catch にも
     掛からず永遠に loading のままになる。見えている画面で20秒待っても
     終わらなければ失敗として畳み、フォールバック（立ち絵＋この文言）を
     出す。実機のスクショで「どこで止まったか」が読めるようにするため */
  React.useEffect(() => {
    if (status !== 'loading' || !focused) return;
    const t = setTimeout(() => {
      if (disposedRef.current) return;
      setErrText((prev) => prev ?? '読み込みが20秒たっても終わりませんでした');
      setStatus((s) => (s === 'loading' ? 'failed' : s));
    }, 20000);
    return () => clearTimeout(t);
  }, [status, focused, liveModel]);

  const model = liveModel;

  /* ▍入っていないモーションを頼まれたら、棒立ちにしない

     相棒ごとにGLBが違うので、**11種のうち何本入っているかは相棒による**。
     実際、あとから足した4体は walk が入っていない（元GLBから対応づけを
     取りこぼした）。前はここで黙って return していたので、`walk` を頼まれた
     相棒は**微動だにしないまま横に滑ってくる**、という絵になっていた。

     待機（idle-a）に落とせば、少なくとも息はしている。**壊れて止まっている**
     のと**別の動きをしている**のとでは、見え方がまるで違う。
     入っていないこと自体は has() で外から分かるので、
     「歩けないなら歩かせない」という演出の判断は呼ぶ側でできる（→ app/intro.tsx）。 */
  const playByName = React.useCallback((name: AvatarMotion) => {
    /* **落とした先の名前で**ループの扱いを決める。頼まれた名前のままだと、
       一度きりの動き（bow など）が待機に落ちたときに LoopOnce が掛かり、
       ひと回りしたところで固まる */
    const key: AvatarMotion = actionsRef.current[name] ? name : 'idle-a';
    const next = actionsRef.current[key];
    if (!next) return;
    const prev = currentRef.current;
    if (prev === next && LOOPING.includes(key)) return;
    next.reset();
    if (LOOPING.includes(key)) {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    } else {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    }
    if (prev && prev !== next) prev.crossFadeTo(next, 0.3, false);
    next.play();
    currentRef.current = next;
  }, []);

  React.useImperativeHandle(
    ref,
    () => ({
      play: playByName,
      has: (motion: AvatarMotion) => !!actionsRef.current[motion],
      emote: (icon: IconName) => {
        setEmoteIcon(icon);
        if (emoteTimer.current) clearTimeout(emoteTimer.current);
        emoteTimer.current = setTimeout(() => setEmoteIcon(null), 1800);
      },
      face: (yaw: number) => {
        yawRef.current = yaw;
        /* まだ読み込み中なら、出てきたときにこの向きで立たせる */
        if (rootRef.current && Math.abs(rootRef.current.rotation.y - yaw) > Math.PI) {
          rootRef.current.rotation.y = yaw;
        }
      },
    }),
    [playByName],
  );

  React.useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      if (emoteTimer.current) clearTimeout(emoteTimer.current);
    };
  }, []);

  const onContextCreate = React.useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      if (!model) return;
      const gen = ++genRef.current;
      try {
        /* WebGL2の運試しを止める（→ lib/gl-compat.ts）。Renderer より先に */
        pinWebGL1(gl);
        const renderer = new Renderer({ gl, alpha: true });
        renderer.setClearColor(0x000000, 0);
        /* ▍シェーダが組めなかったら、黙って白にせず理由を出す
           リンク失敗のとき three は console に吐くだけで描画をスキップする。
           それが「エラーも出ずにキャラが白い」の正体だったので、
           ここで捕まえて失敗表示（スクショで原因が読める形）に落とす */
        renderer.debug.onShaderError = (glc, program, vs, fs) => {
          const cut = (x: string | null) => (x ?? '').trim().slice(0, 110);
          setErrText(
            `シェーダが組めませんでした / ${cut(glc.getProgramInfoLog(program))} / v:${cut(
              glc.getShaderInfoLog(vs),
            )} / f:${cut(glc.getShaderInfoLog(fs))}`,
          );
          setStatus('failed');
        };

        const scene = new THREE.Scene();
        /* モデルはunlit（KHR_materials_unlit）なのでライトは不要。
           unlit以外の素材が混ざったときの保険で環境光だけ入れておく */
        scene.add(new THREE.AmbientLight(0xffffff, 2));

        const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
        const view = model.view;
        const camera = new THREE.PerspectiveCamera(view.fov, aspect, 0.05, 20);
        /* 見ている点からの距離を zoom 倍にする。**画角ではなく位置で引く**——
           fov を広げると、そのぶん背景（＝透過）の面積だけが増えて
           キャラは小さくなるが、切れる位置は変わらない */
        const target = new THREE.Vector3(...view.target);
        const eye = new THREE.Vector3(...view.camera);
        camera.position.copy(target.clone().add(eye.clone().sub(target).multiplyScalar(zoom)));
        camera.lookAt(target);

        const [buffer, texture] = await Promise.all([
          readArrayBuffer(model.glb),
          probe?.plain
            ? Promise.resolve(null)
            : new Promise<THREE.Texture>((res, rej) =>
                new TextureLoader().load(model.texture, res as (t: unknown) => void, undefined, rej),
              ),
        ]);
        if (disposedRef.current || genRef.current !== gen) return;

        const gltf = await new Promise<GLTF>((res, rej) =>
          new GLTFLoader().parse(buffer, '', res, rej),
        );
        if (disposedRef.current || genRef.current !== gen) return;

        /* 外出ししたベースカラーを貼り直す。
           glTFのUVは左上原点なので flipY = false が必須 */
        if (texture) {
          texture.flipY = false;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
        }
        gltf.scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          /* ▍視界判定（frustum culling）を切る

             threeは描く前に境界球で「視界に入っているか」を判定し、
             **球の計算が壊れる（NaN）と、エラーも出さずにただ描かない**。
             実機で せんぱい・かんばん・ねっけつ_タキシード だけが
             「読み込み成功なのに真っ白」になり、3D診断でモデル単位の
             症状と確定した。境界球の計算は数万頂点の数値ループで、
             このアプリで2回踏んだHermesの数値ループ不具合と同じ形
             （データの長さで発症が変わる＝モデルにより出たり出なかったり。
             ブラウザのV8では起きない）。
             キャラ1体を必ず画面に入れて描く用途に視界判定は不要なので、
             判定ごと切って境界球を使う経路を通らなくする */
          mesh.frustumCulled = false;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const mat = m as THREE.MeshBasicMaterial;
            if (texture) {
              mat.map = texture;
            } else {
              /* 切り分け（plain）：テクスチャ抜きの単色。形だけ描ければ
                 幾何は無罪で、犯人はテクスチャ経路と分かる */
              mat.map = null;
              mat.color = new THREE.Color('#e0685f');
            }
            /* ▍裏面も描く（＝割れ目から背景を見せない）

               自動スキニングの粗さで、腕を上げると肩の布が裂けて**背景が
               白く透ける**。手を振る姿で稲妻形の穴になって出ていた。
               裏面を描くと、その穴から見えるのが**体の内側の面**になる。
               貼っている絵は同じなので、まわりと同じ色で埋まる。

               「体の中にもう1枚、膜を貼る」のと同じ効果を、面を足さずに
               得ている（形は1ミリも変わらない。増えるのは塗る手間だけ）。
               モデルはunlitなので、裏返っても色が暗くなることはない。 */
            mat.side = THREE.DoubleSide;
            mat.needsUpdate = true;
          }
        });

        /* ▍背丈の倍率（人でないキャラを縮める → data/avatars.ts の scale）

           ただ scale を掛けると、**原点がどこにあるか次第で足が浮くか
           めり込む**。GLBは量子化されていて原点の位置をファイルから
           読めないので、実測で合わせる：縮める前の足元の高さを覚えて、
           縮めたあとに同じ高さへ戻す。原点が腰にあっても床に立つ。 */
        const scale = model.scale ?? 1;
        if (scale !== 1) {
          const before = new THREE.Box3().setFromObject(gltf.scene).min.y;
          gltf.scene.scale.setScalar(scale);
          gltf.scene.updateMatrixWorld(true);
          const after = new THREE.Box3().setFromObject(gltf.scene).min.y;
          /* ▍実測が数字にならなかったら、動かさない
             この足元合わせを通るのは縮めるキャラ（かんばん）だけで、
             もし実測が Infinity/NaN を返すと position.y が NaN になり、
             **エラーも出ずにキャラだけ消える**（status は ready のまま）。
             「出ないのに失敗表示も無い」の疑い筋として塞いでおく */
          if (Number.isFinite(before) && Number.isFinite(after)) {
            gltf.scene.position.y += before - after;
          }
        }

        scene.add(gltf.scene);
        rootRef.current = gltf.scene;
        gltf.scene.rotation.y = yawRef.current;

        const tilt = ((model.headTilt ?? 0) * Math.PI) / 180;
        const head = tilt ? findHead(gltf.scene) : null;

        /* 切り分け（still）：ミキサーも足踏み補正（stripTravel）も通さず、
           バインドポーズのまま置く。これで描ければ幾何・スキンは無罪で、
           犯人はアニメーション側の数値処理と分かる */
        let mixer: THREE.AnimationMixer | null = null;
        if (!probe?.still) {
          mixer = new THREE.AnimationMixer(gltf.scene);
          mixerRef.current = mixer;
          for (const clip of gltf.animations) {
            /* 静止姿勢を引くのに骨が要る（→ stripTravel のメモ） */
            stripTravel(clip, gltf.scene);
            actionsRef.current[clip.name] = mixer.clipAction(clip);
          }
          /* ワンショットのモーションが終わったら待機に戻す */
          mixer.addEventListener('finished', () => playByName(IDLE));
          playByName(IDLE);
        }

        setStatus('ready');
        onReady?.();

        const clock = new THREE.Clock();
        const loop = () => {
          if (disposedRef.current || genRef.current !== gen) return;
          requestAnimationFrame(loop);
          const dt = clock.getDelta();
          if (mixer) mixer.update(dt);
          /* 向きたい角度へ、毎フレーム少しずつ寄せる。
             一気に代入すると、歩きながらパッと反転して人形に見える */
          const root = rootRef.current;
          if (root) {
            const d = yawRef.current - root.rotation.y;
            root.rotation.y += Math.abs(d) < 0.002 ? d : d * Math.min(1, dt * 7);
          }
          /* 顎の向きの直しを、描く直前に足して描いたら引く（→ TILT_AXIS のメモ） */
          if (head) head.rotateOnWorldAxis(TILT_AXIS, tilt);
          renderer.render(scene, camera);
          if (head) head.rotateOnWorldAxis(TILT_AXIS, -tilt);
          gl.endFrameEXP();
        };
        loop();
      } catch (e) {
        console.warn('[Avatar3D] モデルの読み込みに失敗しました', e);
        const err = e as Error;
        /* three の版も添える。「直したはずのエラーがまだ出る」とき、
           スクショ1枚で古いビルドか新しいビルドかを見分けられる */
        setErrText(
          `${err?.name ?? 'Error'}: ${err?.message ?? String(e)}`.slice(0, 300) +
            `（three r${THREE.REVISION}）`,
        );
        setStatus('failed');
      }
    },
    [model, onReady, playByName, zoom, probe?.plain, probe?.still],
  );

  /* GLBがまだ無いアバター、または読み込みに失敗したとき */
  if (!model || status === 'failed') {
    return (
      <View style={[styles.host, { width, height }, styles.fallback]}>
        <Icon name={avatar.icon} size={Math.min(width, height) * 0.4} color={T.disabled} />
        {status === 'failed' && <Text style={F.tiny}>3D表示に失敗しました</Text>}
        {errText ? (
          <Text style={[F.tiny, { paddingHorizontal: 12, textAlign: 'center' }]} numberOfLines={5}>
            {errText}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    /* 読み上げには「誰がいるか」だけを1つの塊で渡す。中のキャンバスは
       名前の無い図として読まれるだけなので、外側で名前を付けて畳む
       （セリフは隣のフキダシが文字で持っている） */
    <View
      style={[styles.host, { width, height }]}
      pointerEvents="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel={avatar.name}>
      {/* カメラの画角と描画サイズは onContextCreate の1回しか決まらない。
          あとから幅・高さが変わっても追従しないので、**そのときは作り直す**。
          追従しないままだと、古い寸法で焼いた絵が新しい枠に貼られて
          頭が切れる（狭い端末でフキダシの実測後に枠が縮むと起きた）。
          テクスチャ（色違いアバター）が変わったときも同じ理由で作り直す */}
      <GLView
        key={`${width}x${height}x${zoom}x${model.texture}x${probe?.plain ? 'p' : ''}${probe?.still ? 's' : ''}`}
        style={{ width, height }}
        onContextCreate={onContextCreate}
      />
      {status === 'loading' && (
        <View style={styles.overlay}>
          <ActivityIndicator color={T.muted} />
          <Text style={[F.tiny, { marginTop: 6 }]}>{avatar.name}を呼んでいます…</Text>
        </View>
      )}
      {emoteIcon && (
        <View style={styles.emote}>
          <Icon name={emoteIcon} size={28} color={T.accent} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  host: { position: 'relative' },
  fallback: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  emote: { position: 'absolute', top: -4, left: 0, right: 0, alignItems: 'center' },
});
