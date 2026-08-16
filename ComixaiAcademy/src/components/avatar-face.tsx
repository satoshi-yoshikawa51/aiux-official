/* ============================================================
   相棒の顔サムネイル。選ぶ画面の「左の丸」を、色の丸から顔にする部品。

   ▍1か所にまとめる理由
   顔が要るのは3か所ある——相棒えらび（オンボーディング）・せってい・
   ガチャの「あつめたアバター」。同じ丸を3回書くと、丸みや枠の太さが
   だんだん食い違う。実際バッジで同じ取りこぼしをやっている
   （→ components/badge-art.tsx）。

   ▍3Dは出さない
   一覧には13体ぶんが並ぶ。Avatar3D を13個置くとWebGLのコンテキストが
   足りない（→ components/capsule-3d.tsx）。`tools/make-faces.mjs` が
   焼いた静止画を出す。

   ▍焼けていない相棒は、これまでどおり色の丸
   台帳に face が無ければ swatch（またはキャラの色）の丸に落ちる。
   モデルがまだ無い「準備中」のキャラがここに来る。
   ============================================================ */
import React from 'react';
import { Image, View } from 'react-native';

import { BW, C } from '@/theme';

interface Props {
  /** 顔の絵（`require(...)`）。無ければ色の丸になる */
  face?: number;
  /** face が無いときに塗る色 */
  swatch: string;
  /** 直径（pt） */
  size: number;
  /** 未入手・準備中のときに薄くする */
  dim?: boolean;
  /** ▍色違いの「その色」を右下に小さく出す
      色違いは**服だけ**を塗り替えている（髪はムラが出るのでやめた
      → data/avatars.ts の SKINS）。顔サムネイルは首から上なので、
      「おっとり」と「おっとり_ももズボンver」が**まったく同じ絵**になる。
      名前を読まないと見分けられないのでは丸を出している意味がないため、
      色違いのカードにだけ、その色の点を添える。 */
  chip?: string;
}

export function AvatarFace({ face, swatch, size, dim = false, chip }: Props) {
  const circle = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        /* 顔の下は紙より少し沈めた色。**透過のまま置くと、白いカードの上で
           輪郭が消えて丸に見えない** */
        backgroundColor: face ? C.paper100 : swatch,
        borderWidth: size >= 30 ? BW.line : 1.5,
        borderColor: C.ink900,
        overflow: 'hidden',
        opacity: dim ? 0.45 : 1,
      }}>
      {face ? (
        /* 焼いた絵は正方形で、顔が真ん中に来るようにしてある。
           丸く抜くので cover でいっぱいに広げる。

           ▍**大きさを size で書かない**（枠の内側は size より小さい）
           枠は内側に引かれるので、中身が置ける幅は size - 枠の太さ×2。
           そこへ size ちょうどの絵を入れると、**絵が枠の太さぶん右下へ
           ずれて、右と下が切れる**（34ptの丸で2ptずれ＝顔が右に寄って見えた）。
           100% なら枠の内側にぴったり収まり、中央のまま。 */
        <Image source={face} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
      ) : (
        /* 色の丸。上半分に光を入れて、カプセルと同じ流儀に揃える */
        <View
          style={{
            height: size / 2,
            backgroundColor: 'rgba(255,255,255,0.4)',
            borderTopLeftRadius: size / 2,
            borderTopRightRadius: size / 2,
          }}
        />
      )}
    </View>
  );
  if (!chip || !face) return circle;
  const d = Math.round(size * 0.34);
  return (
    <View style={{ width: size, height: size }}>
      {circle}
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: chip,
          borderWidth: size >= 30 ? BW.line : 1.5,
          borderColor: C.ink900,
          opacity: dim ? 0.45 : 1,
        }}
      />
    </View>
  );
}
