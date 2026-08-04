/* ============================================================
   外部実績（登壇・動画・監修）のカード。

   見た目はサイト標準の縦型カード（site-ui の RelatedArticleCard と
   同じ作り）に揃える。ここだけ独自のスタイルを作らないこと。

   出すのは OGP のタイトルとサムネイル、区分バッジ、リンク文言だけ。
   説明文は入れない（掲載条件が「タイトルとリンクの紹介にとどめる」
   ため。相手の記事の要約になってしまう）。
   ============================================================ */
import { Badge, Card } from "../ds";
import { RECORD_GROUPS, TOP_RECORD_URLS, type RecordGroup } from "./records";
import linkCards from "./link-cards.json";

interface LinkCard {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  date: string;
}
const CARDS = (linkCards as { cards?: Record<string, LinkCard> }).cards ?? {};

export function getCard(url: string): LinkCard | undefined {
  return CARDS[url];
}

/** OGPがまだ取れていないURLは出さない（タイトルなしのカードを並べない） */
export function cardsOf(group: RecordGroup): LinkCard[] {
  return group.urls.map((u) => CARDS[u]).filter((c): c is LinkCard => Boolean(c?.title));
}

/** 画面に出せる実績の総数。URLの数ではなくカードの数で数える */
export const RECORD_TOTAL = RECORD_GROUPS.reduce((n, g) => n + cardsOf(g).length, 0);

/** カードが1件以上ある区分だけ。0件の区分は見出しもバッジも出さない */
export const RECORD_FILLED = RECORD_GROUPS.filter((g) => cardsOf(g).length > 0);

/** トップに出す代表3件。records.ts の TOP_RECORD_URLS の順に並べる。
    区分（バッジと「動画を見る」等の文言）はURLの持ち主から引く。 */
export const TOP_RECORDS = TOP_RECORD_URLS.map((url) => {
  const card = CARDS[url];
  const group = RECORD_GROUPS.find((g) => g.urls.includes(url));
  return card?.title && group ? { card, group } : null;
}).filter((x): x is { card: LinkCard; group: RecordGroup } => x !== null);

export function RecordCard({
  card,
  group,
  place,
}: {
  card: LinkCard;
  group: RecordGroup;
  place: string;
}) {
  return (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      data-ga="card_click"
      data-ga-place={place}
      data-ga-path={card.url}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card variant="pop" hover padding={0} style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", aspectRatio: "1200/630", borderBottom: "var(--bw-bold) solid var(--ink-900)", overflow: "hidden", background: "var(--paper-100)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <span style={{ position: "absolute", top: 10, left: 10 }}>
            <Badge tone="ink">{group.kind}</Badge>
          </span>
        </div>
        <div style={{ padding: "14px 16px 15px", display: "flex", flexDirection: "column", flex: 1 }}>
          <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, lineHeight: 1.55, textWrap: "pretty" }}>
            {card.title}
          </h3>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {card.siteName || new URL(card.url).hostname}
            </span>
            <span style={{ flex: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
              {group.linkLabel} <i className="ph-bold ph-arrow-up-right" />
            </span>
          </div>
        </div>
      </Card>
    </a>
  );
}

/** 3列のカード格子（スマホは articles-grid のルールで1列になる） */
export function RecordGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="articles-grid">
      {children}
    </div>
  );
}
