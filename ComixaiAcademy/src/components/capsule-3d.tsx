/* ============================================================
   ガチャのカプセル（3D）。expo-gl + three.js。

   ▍なぜ3Dにするか
   カプセルは「何が出たか」を最初に教えてくれる部品で、この画面の主役。
   平たい丸だと、レア度の色を塗り分けても**ただの丸い色面**にしか
   見えない。上半分が透けて、光沢が回って、開くと蓋が飛ぶ——という
   立体の振る舞いがあって初めて「カプセル」として読める。

   ▍色でレア度を先に知らせる
     青 ＝ N ／ 赤 ＝ R ／ 金 ＝ SR
   開ける前に色で分かるので、落ちてきた瞬間がいちばん盛り上がる。
   台帳側の RARITY_COLOR も同じ割り当てにしてある（→ data/gacha.ts）。

   ▍GLのコンテキストは作り直さない
   ブラウザは同時に持てるWebGLコンテキストの数が十数個で頭打ちになる。
   まわすたびにこの部品を出し入れすると、10回ほどで**いちばん古い
   コンテキストが黙って失われる**（画面が真っ白なカプセルになる）。
   一度出したら置いたままにして、色も開閉も ref 経由で描画ループに
   渡す。呼ぶ側は opacity で見え隠れさせる。
   ============================================================ */
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import React from 'react';
import { View } from 'react-native';
import * as THREE from 'three';

import type { Rarity } from '@/data/gacha';

/** レア度ごとの見た目。body＝下半分（不透明）、lid＝上半分（透ける）、seam＝合わせ目 */
const LOOK: Record<Rarity, { body: number; lid: number; seam: number; glow: number }> = {
  N: { body: 0x1a6cff, lid: 0x9cc4ff, seam: 0x0e3f96, glow: 0x000000 },
  R: { body: 0xe60012, lid: 0xff9a9a, seam: 0x8c000b, glow: 0x1a0000 },
  /* 金だけ自分から光らせる。反射だけだと、紙の上では黄土色に沈む */
  SR: { body: 0xf5b301, lid: 0xffe9a8, seam: 0x8a6100, glow: 0x4a3200 },
};

/** 開くのにかける秒数。蓋が飛んでから景品のカードに切り替える */
export const CAPSULE_OPEN_MS = 480;

/* ———— 枠の中で球が占める割合 ————
   画角と距離で決まる。**呼ぶ側はこれを使って寸法を決めること**——
   直接0.55などと書くと、ここを触ったときに黙ってズレる。

   FOV 28度・距離6.6 → 見えている高さは 2 × 6.6 × tan(14°) = 3.291。
   球の直径は 1.8 なので 1.8 / 3.291。 */
const FOV = 28;
const DIST = 6.6;
const RAD = 0.9;
export const CAPSULE_FILL =
  (RAD * 2) / (2 * DIST * Math.tan(((FOV / 2) * Math.PI) / 180));

interface Props {
  rarity: Rarity;
  /** 一辺（正方形で描く） */
  size: number;
  /** true にすると蓋が飛ぶ。false に戻すと閉じた姿に戻る */
  open?: boolean;
}

export function Capsule3D({ rarity, size, open = false }: Props) {
  const rarityRef = React.useRef(rarity);
  const openRef = React.useRef(open);
  const disposed = React.useRef(false);
  React.useEffect(() => {
    rarityRef.current = rarity;
  }, [rarity]);
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);
  React.useEffect(() => {
    disposed.current = false;
    return () => {
      disposed.current = true;
    };
  }, []);

  const onContextCreate = React.useCallback(async (gl: ExpoWebGLRenderingContext) => {
    const renderer = new Renderer({ gl, alpha: true });
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      FOV,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      20,
    );
    /* ▍上下に余白を残す
       蓋が飛ぶぶんの逃げ場が要る。ぎりぎりに詰めると、**飛んでいる蓋が
       枠の上で真横に切れる**（実機で「上が切れている」と出た）。 */
    camera.position.set(0, 0.3, DIST);
    camera.lookAt(0, 0, 0);

    /* 光は3つ。左上から主光（光沢の芯）、右下から弱い返し（下半分が
       黒く潰れないように）、全体に環境光。プラスチックの艶が出る配合 */
    scene.add(new THREE.AmbientLight(0xffffff, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.55);
    key.position.set(-2.2, 3.2, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.75);
    fill.position.set(2.6, -1.4, -1.8);
    scene.add(fill);

    const look = LOOK[rarityRef.current];
    const bodyMat = new THREE.MeshPhongMaterial({
      color: look.body,
      emissive: look.glow,
      shininess: 85,
      specular: 0xa0a0a0,
    });
    /* 上半分は薄いプラスチック。裏側も見えるので DoubleSide */
    const lidMat = new THREE.MeshPhongMaterial({
      color: look.lid,
      transparent: true,
      opacity: 0.62,
      shininess: 150,
      specular: 0xffffff,
      side: THREE.DoubleSide,
    });
    const seamMat = new THREE.MeshPhongMaterial({ color: look.seam, shininess: 60 });

    const group = new THREE.Group();
    group.rotation.x = -0.16;
    scene.add(group);

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(RAD, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      bodyMat,
    );
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(RAD, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      lidMat,
    );
    /* 合わせ目のリング。ここが無いと、上下が別々の球に見える */
    const seam = new THREE.Mesh(new THREE.TorusGeometry(RAD, 0.052, 10, 64), seamMat);
    seam.rotation.x = Math.PI / 2;
    group.add(body, lid, seam);

    const clock = new THREE.Clock();
    let t = 0; // 開き具合 0→1
    let shown: Rarity | null = rarityRef.current;

    const loop = () => {
      if (disposed.current) return;
      requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);

      /* 色を差し替える（作り直さない） */
      if (shown !== rarityRef.current) {
        shown = rarityRef.current;
        const n = LOOK[shown];
        bodyMat.color.setHex(n.body);
        bodyMat.emissive.setHex(n.glow);
        lidMat.color.setHex(n.lid);
        seamMat.color.setHex(n.seam);
      }

      /* ずっとゆっくり回す。止まっていると板に見える */
      group.rotation.y += dt * 1.15;

      const want = openRef.current ? 1 : 0;
      const step = dt / (CAPSULE_OPEN_MS / 1000);
      t = want > t ? Math.min(1, t + step) : Math.max(0, t - step * 2.5);

      /* ▍蓋は「遠くへ飛んでいく」形にする
         上へ飛ばすだけだと枠の上で切れる。**上がりながら小さくなって
         薄れる**ようにすると、遠ざかって見えるうえに枠から出ない。
         いちばん上まで来ても 1.0 + 0.9×0.55 = 1.5 で、見えている
         高さの半分（1.65）に収まる。下半分は少し沈めて「開いた」ことを見せる */
      lid.position.y = 1.0 * t * t;
      lid.rotation.z = 1.3 * t;
      lid.scale.setScalar(1 - 0.45 * t);
      lidMat.opacity = 0.62 * Math.pow(1 - t, 1.6);
      body.position.y = -0.18 * t;
      seam.position.y = -0.18 * t;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    loop();
  }, []);

  return (
    <View
      style={{ width: size, height: size }}
      pointerEvents="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel="カプセル">
      {/* 寸法が変わったときだけ作り直す。**色では作り直さない**
          （→ 冒頭のメモ。まわすたびに作り直すとGLが尽きる） */}
      <GLView key={size} style={{ width: size, height: size }} onContextCreate={onContextCreate} />
    </View>
  );
}
