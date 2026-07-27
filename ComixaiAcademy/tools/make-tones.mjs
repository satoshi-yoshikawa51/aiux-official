/* スクリーントーン（網点・斜線）のタイル画像を作る。
   サイトの --tone-dots / --tone-lines と同じ見た目を、
   RNの ImageBackground（resizeMode="repeat"）で敷けるPNGにしたもの。

   継ぎ目が出ないよう、模様の周期がタイル幅の約数になるようにしている。 */
import sharp from 'sharp';

const INK = [20, 17, 15]; // --ink-900
const PAPER = [251, 247, 239]; // --paper-50

/** 網点: 9pxごとに半径1.4pxの点（--tone-dots-size: 9px 9px と同じ）。
    ink=黒い点（紙の上用） / paper=白い点（黒地の上用） */
async function dots(file, { size = 9, r = 1.5, alpha = 0.14, rgb = INK } = {}) {
  const px = Buffer.alloc(size * size * 4, 0);
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      // 縁を少しぼかして、拡大しても点がガタつかないようにする
      const a = Math.max(0, Math.min(1, r + 0.5 - d));
      const i = (y * size + x) * 4;
      px[i] = rgb[0];
      px[i + 1] = rgb[1];
      px[i + 2] = rgb[2];
      px[i + 3] = Math.round(a * alpha * 255);
    }
  }
  await sharp(px, { raw: { width: size, height: size, channels: 4 } }).png().toFile(file);
  console.log('->', file);
}

/** 斜線: -45度に2px幅の線を7px間隔（--tone-lines と同じ） */
async function lines(file, period = 9, thick = 2, alpha = 0.14, size = 36) {
  const px = Buffer.alloc(size * size * 4, 0);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const on = (x + y) % period < thick;
      const i = (y * size + x) * 4;
      px[i] = INK[0];
      px[i + 1] = INK[1];
      px[i + 2] = INK[2];
      px[i + 3] = on ? Math.round(alpha * 255) : 0;
    }
  }
  await sharp(px, { raw: { width: size, height: size, channels: 4 } }).png().toFile(file);
  console.log('->', file);
}

await dots('assets/images/tone-dots.png');
/* 黒地に敷く用。黒い点は当然見えないので白い点にする。
   地が暗いぶん少しの差でも目に入るので、濃さは紙の上の半分以下にする */
await dots('assets/images/tone-dots-light.png', { rgb: PAPER, alpha: 0.06 });
await lines('assets/images/tone-lines.png');
