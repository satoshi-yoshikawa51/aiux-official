/* ============================================================
   アプリの配信まわりを、1か所にまとめたもの。

   ▍URLを2箇所に書かない
   /academy のCTA（3箇所）と、トップページの帯が同じURLを指す。
   別々に持つと、片方だけ古いまま残る。

   ▍バッジはApple公式の絵をそのまま置く
   「App Store からダウンロード」のバッジは**Appleの商標**なので、
   自分で描き直したり、色を変えたり、角を丸め直したりしない
   （サイトの他のロゴと同じ扱い → CLAUDE.md）。
   public/academy/appstore-badge-jp.svg は Apple のサイトから取った
   日本語・黒の公式データそのもの。差し替えるときも公式から取る。

     https://developer.apple.com/assets/elements/badges/download-on-the-app-store-jp.svg

   Appleの決まりで、**高さは40px以上**・まわりに高さの1割の余白を空ける。
   枠や影を足さないこと（このサイトは太い黒枠が基本だが、バッジは例外）。
   ============================================================ */

/* App Storeの配信URL。まだ出していないあいだは null にしておくと、
   ページ全体が「まもなく公開」の見え方に戻る。

   国を指定しない `apps.apple.com/app/id...` の形にしてある。
   見た人の国のストアへAppleが振り分けてくれる */
export const APP_STORE_URL: string | null = "https://apps.apple.com/app/id6802985390";

const BADGE = { src: "/academy/appstore-badge-jp.svg", w: 108.85157, h: 40 };

/** Apple公式のダウンロードバッジ。`height` は40以上（Appleの決まり） */
export function AppStoreBadge({ height = 52 }: { height?: number | string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={BADGE.src}
      alt="App Store からダウンロード"
      width={BADGE.w}
      height={BADGE.h}
      style={{
        height,
        width: "auto",
        display: "block",
        /* まわりの余白。Appleの決まりで、他の要素をバッジに寄せてはいけない
           （高さの1割ぶん空ける）。%指定は親の**幅**を見てしまうので、
           数値で持つ。置く側でも gap を10px以上取ること */
        margin: 6,
      }}
    />
  );
}
