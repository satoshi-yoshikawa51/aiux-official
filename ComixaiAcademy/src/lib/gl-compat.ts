import { Platform } from 'react-native';

/* ============================================================
   ▍threeに、コンテキストの「本当の顔」を教える

   three r162 は `gl.constructor.name` の名前だけでWebGL1/2を判定し、
   WebGL2だと思えば GLSL ES 3.00、WebGL1だと思えば 1.00 のシェーダを組む。
   expo-gl のネイティブコンテキストでは、この名前が実体と食い違うことが
   あり（実機の3D診断で確認）、食い違った回はシェーダが組めず
   **エラー画面も出ずにキャラだけ白くなる**。

   ▍決め打ちは両方向とも失敗済み
   - 名前のままに任せる（従来）：一部のコンテキストだけ白（ビルド23）
   - WebGL1へ決め打ち（前回）：全滅。「SkinnedMesh can only be used with
     WebGL 2. With WebGL 1 OES_texture_float ...」
     「OES_vertex_array_object extension not supported」——WebGL1用の
     拡張名に答えない＝**実体はWebGL2寄り**のコンテキストに、WebGL1の
     描き方を強制していた（ビルド24）

   なので決め打ちをやめる：**そのコンテキストが実際に持っているAPI**
   （WebGL2のコア関数）を見て、実体に合う名前を付ける。
   それでも組めない場合の再試行（反対の顔で作り直す）は Avatar3D 側。
   ============================================================ */

export type GLFlavor = 'gl1' | 'gl2';

/** WebGL2のコア関数を実際に持っているかで、実体の顔を見る */
export function detectFlavor(gl: object): GLFlavor {
  const g = gl as Record<string, unknown>;
  return typeof g.createVertexArray === 'function' && typeof g.texStorage2D === 'function'
    ? 'gl2'
    : 'gl1';
}

/** three が読む constructor.name を、指定の顔に固定する */
export function pinFlavor(gl: object, flavor: GLFlavor): void {
  if (Platform.OS === 'web') return;
  try {
    /* 名前の付いた関数を直接書く（計算プロパティの名前推論に頼らない） */
    const ctor =
      flavor === 'gl2' ? function WebGL2RenderingContext() {} : function WebGLRenderingContext() {};
    Object.defineProperty(gl, 'constructor', { value: ctor, configurable: true });
  } catch {
    /* 固定できない環境でも、描画の試み自体は従来どおり続ける */
  }
}
