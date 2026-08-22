import { Platform } from 'react-native';

/* ============================================================
   ▍threeのWebGL2判定を、ネイティブでは「WebGL1」に固定する

   three r162 は `gl.constructor.name === 'WebGL2RenderingContext'` という
   **名前頼り**でWebGL2かどうかを決め、WebGL2だと思うと GLSL ES 3.00 の
   シェーダを組む。expo-gl のネイティブコンテキストではこの名前が
   **コンテキストごとにブレる**（実機の3D診断で、12個中一部だけが
   WebGL2扱いになり「EXT_color_buffer_float not supported」を出した）。
   WebGL2扱いになったコンテキストでは3.00のシェーダがリンクできず、
   `THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false` を残して
   **エラー画面も出ずにキャラだけ白くなる**。

   「ガチャで当てた相棒が出ない」の正体はこれ——モデルの中身ではなく、
   その描画に使われた**コンテキストの当たり外れ**だった（だからGLBを
   いくら比較しても差が出なかった）。

   expo-gl は WebGL1 相当として扱う、がこのアプリの前提（three 0.162 固定の
   理由と同じ → CLAUDE.md）。判定を運に任せず、こちらで固定する。
   ============================================================ */
export function pinWebGL1(gl: object): void {
  if (Platform.OS === 'web') return;
  try {
    /* three が読むのは gl.constructor.name だけ。インスタンス側に
       WebGL1の顔をした constructor を置いて、名前の運試しを終わらせる */
    Object.defineProperty(gl, 'constructor', {
      value: function WebGLRenderingContext() {},
      configurable: true,
    });
  } catch {
    /* 固定できない環境でも、描画の試み自体は従来どおり続ける */
  }
}
