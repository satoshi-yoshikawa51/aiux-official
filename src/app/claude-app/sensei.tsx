"use client";
/* ============================================================
   講師キャラ「先生」— three.jsでGLBを描画する小型ビュー。

   - モデル: /claude-app/sensei.glb（イラスト調unlit・meshopt圧縮・約3.9MB）
   - モーション（GLB内の名前）:
     laugh, wave, bow, idle-a, arms-crossed, walk,
     scared, angry, worried, idle-b, explain
   - refで play("explain") のように操作。ワンショット再生後は待機に戻る
   - 頭上の絵文字エモート（💡❗✨）は emote() で表示
   ============================================================ */
import React from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export type SenseiMotion =
  | "laugh" | "wave" | "bow" | "idle-a" | "arms-crossed" | "walk"
  | "scared" | "angry" | "worried" | "idle-b" | "explain";

/* ループし続けるモーション（それ以外はワンショット→idleに戻す） */
const LOOPING: SenseiMotion[] = ["idle-a", "idle-b", "explain", "arms-crossed", "walk"];
const IDLE: SenseiMotion = "idle-a";

export interface SenseiHandle {
  play: (name: SenseiMotion) => void;
  emote: (emoji: string) => void;
}

export const Sensei = React.forwardRef<SenseiHandle, { width?: number; height?: number }>(
  function Sensei({ width = 150, height = 200 }, ref) {
    const hostRef = React.useRef<HTMLDivElement>(null);
    const mixerRef = React.useRef<THREE.AnimationMixer | null>(null);
    const actionsRef = React.useRef<Record<string, THREE.AnimationAction>>({});
    const currentRef = React.useRef<THREE.AnimationAction | null>(null);
    const [emoteChar, setEmoteChar] = React.useState<string | null>(null);
    const emoteTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [ready, setReady] = React.useState(false);

    const playByName = React.useCallback((name: SenseiMotion) => {
      const actions = actionsRef.current;
      const next = actions[name];
      if (!next) return;
      const prev = currentRef.current;
      if (prev === next && LOOPING.includes(name)) return;
      next.reset();
      if (LOOPING.includes(name)) {
        next.setLoop(THREE.LoopRepeat, Infinity);
      } else {
        next.setLoop(THREE.LoopOnce, 1);
        next.clampWhenFinished = true;
      }
      if (prev && prev !== next) {
        prev.crossFadeTo(next, 0.3, false);
      }
      next.play();
      currentRef.current = next;
    }, []);

    React.useImperativeHandle(ref, () => ({
      play: playByName,
      emote: (emoji: string) => {
        setEmoteChar(emoji);
        if (emoteTimer.current) clearTimeout(emoteTimer.current);
        emoteTimer.current = setTimeout(() => setEmoteChar(null), 1800);
      },
    }), [playByName]);

    React.useEffect(() => {
      const host = hostRef.current;
      if (!host) return;
      let disposed = false;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.setSize(width, height);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      /* unlitモデルなのでライト不要。念のため環境光のみ（unlit以外の素材対策） */
      scene.add(new THREE.AmbientLight(0xffffff, 2));
      const camera = new THREE.PerspectiveCamera(26, width / height, 0.05, 20);
      camera.position.set(0, 0.62, 2.35);
      camera.lookAt(0, 0.48, 0);

      const clock = new THREE.Clock();
      let raf = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        const dt = clock.getDelta();
        mixerRef.current?.update(dt);
        renderer.render(scene, camera);
      };

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load("/claude-app/sensei.glb", (gltf) => {
        if (disposed) return;
        scene.add(gltf.scene);
        const mixer = new THREE.AnimationMixer(gltf.scene);
        mixerRef.current = mixer;
        for (const clip of gltf.animations) {
          actionsRef.current[clip.name] = mixer.clipAction(clip);
        }
        /* ワンショット終了→待機に戻る */
        mixer.addEventListener("finished", () => playByName(IDLE));
        playByName(IDLE);
        setReady(true);
        loop();
      });

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        renderer.dispose();
        host.removeChild(renderer.domElement);
      };
      // width/heightは初期値のみ使用（リサイズ非対応の小型ビュー）
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div ref={hostRef} style={{ position: "relative", width, height, pointerEvents: "none" }}>
        {!ready && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", fontSize: 11, color: "#999", paddingBottom: 12 }}>
            先生を呼んでいます…
          </div>
        )}
        {emoteChar && (
          <div
            style={{
              position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
              fontSize: 30, animation: "sensei-pop .35s ease-out", textShadow: "0 2px 6px rgba(0,0,0,.2)",
            }}
          >
            {emoteChar}
          </div>
        )}
        <style>{`@keyframes sensei-pop { from { transform: translateX(-50%) scale(.3); opacity: 0 } to { transform: translateX(-50%) scale(1); opacity: 1 } }`}</style>
      </div>
    );
  },
);
