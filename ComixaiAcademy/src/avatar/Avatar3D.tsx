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
import { Renderer, TextureLoader } from 'expo-three';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { IDLE, LOOPING, type AvatarMotion } from './motions';
import { Icon, type IconName } from '@/components/icons';
import type { AvatarDef } from '@/data/avatars';
import { F, T } from '@/theme';

export interface AvatarHandle {
  play: (motion: AvatarMotion) => void;
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
}

/* ============================================================
   ▍歩きは「その場で足踏み」に直してから使う

   walk には**前進が焼き込まれている**（Rootの位置が2.4秒で1.12ユニット動く。
   しかも先頭が -0.98 なので、再生した瞬間に真横へ1ユニットずれる）。
   そのまま流すと、キャラが自分の枠から出ていって **canvas の端で切れる**。
   一幕（app/intro.tsx）で「出てくるとき右が切れる」として実際に出た。

   移動は画面側（枠ごと translateX で動かす）が受け持つので、ここでは
   Rootの位置の track だけ落とす。**足の運びや腰の上下は残す**ので、
   歩き方は変わらない。

   落とすのは**大きく動くものだけ**。待機や説明のRootにも数センチの揺れが
   入っていて、それは芝居なので残す。閾値はwalk（1.12）と待機（0.12）の
   あいだを取ってある。新しいモーションを足しても勝手に効く。 */
const TRAVEL = 0.3;

function stripTravel(clip: THREE.AnimationClip) {
  clip.tracks = clip.tracks.filter((t) => {
    if (t.name !== 'Root.position') return true;
    /* 3成分ずつ入っているので、軸ごとに振れ幅を見る */
    for (let axis = 0; axis < 3; axis++) {
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = axis; i < t.values.length; i += 3) {
        if (t.values[i] < lo) lo = t.values[i];
        if (t.values[i] > hi) hi = t.values[i];
      }
      if (hi - lo > TRAVEL) return false;
    }
    return true;
  });
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
  { avatar, width, height, zoom = 1, onReady },
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

  const model = avatar.model;

  const playByName = React.useCallback((name: AvatarMotion) => {
    const next = actionsRef.current[name];
    if (!next) return;
    const prev = currentRef.current;
    if (prev === next && LOOPING.includes(name)) return;
    next.reset();
    if (LOOPING.includes(name)) {
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
        const renderer = new Renderer({ gl, alpha: true });
        renderer.setClearColor(0x000000, 0);

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
          new Promise<THREE.Texture>((res, rej) =>
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
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        gltf.scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const mat = m as THREE.MeshBasicMaterial;
            mat.map = texture;
            mat.needsUpdate = true;
          }
        });

        scene.add(gltf.scene);
        rootRef.current = gltf.scene;
        gltf.scene.rotation.y = yawRef.current;

        const mixer = new THREE.AnimationMixer(gltf.scene);
        mixerRef.current = mixer;
        for (const clip of gltf.animations) {
          stripTravel(clip);
          actionsRef.current[clip.name] = mixer.clipAction(clip);
        }
        /* ワンショットのモーションが終わったら待機に戻す */
        mixer.addEventListener('finished', () => playByName(IDLE));
        playByName(IDLE);

        setStatus('ready');
        onReady?.();

        const clock = new THREE.Clock();
        const loop = () => {
          if (disposedRef.current || genRef.current !== gen) return;
          requestAnimationFrame(loop);
          const dt = clock.getDelta();
          mixer.update(dt);
          /* 向きたい角度へ、毎フレーム少しずつ寄せる。
             一気に代入すると、歩きながらパッと反転して人形に見える */
          const root = rootRef.current;
          if (root) {
            const d = yawRef.current - root.rotation.y;
            root.rotation.y += Math.abs(d) < 0.002 ? d : d * Math.min(1, dt * 7);
          }
          renderer.render(scene, camera);
          gl.endFrameEXP();
        };
        loop();
      } catch (e) {
        console.warn('[Avatar3D] モデルの読み込みに失敗しました', e);
        setStatus('failed');
      }
    },
    [model, onReady, playByName, zoom],
  );

  /* GLBがまだ無いアバター、または読み込みに失敗したとき */
  if (!model || status === 'failed') {
    return (
      <View style={[styles.host, { width, height }, styles.fallback]}>
        <Icon name={avatar.icon} size={Math.min(width, height) * 0.4} color={T.disabled} />
        {status === 'failed' && <Text style={F.tiny}>3D表示に失敗しました</Text>}
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
          頭が切れる（狭い端末でフキダシの実測後に枠が縮むと起きた）。 */}
      <GLView
        key={`${width}x${height}x${zoom}`}
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
