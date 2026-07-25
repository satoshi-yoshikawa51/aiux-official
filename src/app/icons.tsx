/* ============================================================
   オリジナルアイコン（マンガのベタ＋白抜き）。

   形の定義は ComixaiAcademy/tools/build-icons.mjs にあり、
   パスデータ（icon-paths.ts）はそこから自動生成される。
   サイトとスマホアプリで同じ形を共有しているので、
   このファイルの隣の icon-paths.ts は手で編集しないこと。

   ■ 作りの前提（小さいサイズで潰れないための鉄則）
   ・線で描かず「ベタのシルエットから穴を抜く」（fillRule="evenodd"）
   ・24×24グリッド。抜きは最低2単位の幅
   ・色は currentColor。置いた場所のCSSの color を継ぐので、
     Phosphorの <i> と同じ感覚で差し替えられる
   ============================================================ */
import { ICON_PATHS, type IconName } from "./icon-paths";

export type { IconName };

/** 見た目の大きさを揃えるための微調整（形の面積差を目で合わせたもの） */
const OPTICAL: Partial<Record<IconName, number>> = {
  home: 1.06,
  settings: 0.93,
  star: 0.94,
  perfect: 0.96,
  play: 0.95,
  check: 1.02,
  bang: 1.04,
};

export function Icon({
  name,
  size = 24,
  className,
  style,
  title,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** 意味のあるアイコンのときだけ渡す。無いときは装飾として読み上げから隠す */
  title?: string;
}) {
  const s = OPTICAL[name] ?? 1;
  const vb = 24 / s;
  const min = 12 - vb / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${min} ${min} ${vb} ${vb}`}
      className={className}
      style={{ display: "block", ...style }}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <path d={ICON_PATHS[name]} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/**
 * HTML文字列に埋め込む用（profile/body.ts のように
 * dangerouslySetInnerHTML で描画する箇所で使う）。
 */
export function iconSvg(name: IconName, size = 24): string {
  const s = OPTICAL[name] ?? 1;
  const vb = 24 / s;
  const min = 12 - vb / 2;
  return (
    `<svg width="${size}" height="${size}" viewBox="${min} ${min} ${vb} ${vb}" ` +
    `aria-hidden="true" style="display:block">` +
    `<path d="${ICON_PATHS[name]}" fill="currentColor" fill-rule="evenodd"/></svg>`
  );
}
