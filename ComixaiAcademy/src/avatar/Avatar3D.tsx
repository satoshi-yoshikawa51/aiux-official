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
}

interface Props {
  avatar: AvatarDef;
  width: number;
  height: number;
  /** モデルの読み込みが終わったら呼ばれる */
  onReady?: () => void;
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
  { avatar, width, height, onReady },
  ref,
) {
  const mixerRef = React.useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = React.useRef<Record<string, THREE.AnimationAction>>({});
  const currentRef = React.useRef<THREE.AnimationAction | null>(null);
  const emoteTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposedRef = React.useRef(false);

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
        camera.position.set(...view.camera);
        camera.lookAt(...view.target);

        const [buffer, texture] = await Promise.all([
          readArrayBuffer(model.glb),
          new Promise<THREE.Texture>((res, rej) =>
            new TextureLoader().load(model.texture, res as (t: unknown) => void, undefined, rej),
          ),
        ]);
        if (disposedRef.current) return;

        const gltf = await new Promise<GLTF>((res, rej) =>
          new GLTFLoader().parse(buffer, '', res, rej),
        );
        if (disposedRef.current) return;

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

        const mixer = new THREE.AnimationMixer(gltf.scene);
        mixerRef.current = mixer;
        for (const clip of gltf.animations) {
          actionsRef.current[clip.name] = mixer.clipAction(clip);
        }
        /* ワンショットのモーションが終わったら待機に戻す */
        mixer.addEventListener('finished', () => playByName(IDLE));
        playByName(IDLE);

        setStatus('ready');
        onReady?.();

        const clock = new THREE.Clock();
        const loop = () => {
          if (disposedRef.current) return;
          requestAnimationFrame(loop);
          mixer.update(clock.getDelta());
          renderer.render(scene, camera);
          gl.endFrameEXP();
        };
        loop();
      } catch (e) {
        console.warn('[Avatar3D] モデルの読み込みに失敗しました', e);
        setStatus('failed');
      }
    },
    [model, onReady, playByName],
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
    <View style={[styles.host, { width, height }]} pointerEvents="none">
      <GLView style={{ width, height }} onContextCreate={onContextCreate} />
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
