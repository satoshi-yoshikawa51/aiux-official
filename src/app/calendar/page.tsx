import type { Metadata } from "next";
import { Nav, Footer, PAGE } from "../site-chrome";
import { Badge, Button, Card } from "../ds";
import { Breadcrumb, SectionHead, ShareRow } from "../site-ui";
import { EVENTS, EVENTS_UPDATED, dateLabel, isPast, todayJst, type AiEvent } from "./events";
import { CalendarView, type CalEvent } from "./calendar-view";
import { NewsThumb } from "./news-thumb";
import { EventBanner } from "./event-banner";
import newsJson from "./news-headlines.json";
import eventImagesJson from "./event-images.json";

const EVENT_IMAGES = (eventImagesJson as { images: Record<string, string> }).images ?? {};

export const metadata: Metadata = {
  title: "AIイベントカレンダー2026｜世界と日本の日程一覧｜COMIXAI",
  description:
    "OpenAI DevDay・NVIDIA GTCなど世界のビッグイベントから、AI博覧会・AI EXPOなど日本の展示会まで、AI主要イベントの日程をカレンダーで一望。毎朝自動更新の「今日のAIニュース」見出しつき。公式発表済みの情報だけを掲載しています。",
  keywords: ["AI イベント 2026", "AI カンファレンス 一覧", "OpenAI DevDay いつ", "AI EXPO 日程", "AI ニュース 今日", "生成AI イベント"],
  alternates: { canonical: "/calendar" },
  openGraph: {
    type: "website",
    siteName: "COMIXAI",
    title: "COMIXAI NEWS｜AIイベントカレンダー＆今日のAIニュース",
    description: "世界と日本のAI主要イベントをカレンダーで一望。毎朝自動更新のニュース見出しつき。",
    url: "/calendar",
    locale: "ja_JP",
    images: [{ url: "/og/games/calendar.png", width: 1200, height: 630, alt: "AIイベントカレンダー｜COMIXAI NEWS" }],
  },
  twitter: { card: "summary_large_image" },
};

interface NewsItem {
  title: string;
  titleJa?: string;
  url: string;
  source: string;
  lang: string;
  kind?: string;
  date: string;
  /** OGP画像（取得できた記事のみ） */
  image?: string;
}

const NEWS = newsJson as { updatedAt: string | null; items: NewsItem[] };

const REGION_BADGE: Record<AiEvent["region"], { label: string; icon: string; tone: "blue" | "red" }> = {
  world: { label: "世界", icon: "ph-globe-hemisphere-east", tone: "blue" },
  japan: { label: "日本", icon: "ph-map-trifold", tone: "red" },
};

function fmtNewsDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function EventCard({ e }: { e: AiEvent }) {
  const rb = REGION_BADGE[e.region];
  return (
    <a href={e.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
      <Card variant="pop" hover padding={18} style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {EVENT_IMAGES[e.id] && <EventBanner src={EVENT_IMAGES[e.id]} />}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <Badge tone={rb.tone}>
            <i className={"ph-bold " + rb.icon} style={{ marginRight: 4 }} />
            {rb.label}
          </Badge>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5 }}>{dateLabel(e)}</span>
        </div>
        <h3 style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16.5, lineHeight: 1.45 }}>{e.title}</h3>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
          <i className="ph-bold ph-map-pin" style={{ marginRight: 4 }} />
          {e.venue}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.85, color: "var(--text-body)" }}>{e.desc}</p>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {e.note ? (
            <span style={{ fontFamily: "var(--font-hand)", fontSize: 12.5, color: "var(--text-muted)" }}>{e.note}</span>
          ) : (
            <span />
          )}
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12.5, color: "var(--red-600)", whiteSpace: "nowrap" }}>
            公式サイト <i className="ph-bold ph-arrow-up-right" />
          </span>
        </div>
      </Card>
    </a>
  );
}

export default function CalendarPage() {
  const today = todayJst();
  const upcoming = EVENTS.filter((e) => !e.tba && !isPast(e, today)).sort((a, b) => (a.start! < b.start! ? -1 : 1));
  const tba = EVENTS.filter((e) => e.tba);
  const past = EVENTS.filter((e) => !e.tba && isPast(e, today)).sort((a, b) => (a.start! < b.start! ? 1 : -1));

  const calEvents: CalEvent[] = EVENTS.filter((e): e is AiEvent & { start: string } => Boolean(e.start)).map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    region: e.region,
    url: e.url,
    venue: e.venue,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://comixai.dev/" },
          { "@type": "ListItem", position: 2, name: "AIイベントカレンダー", item: "https://comixai.dev/calendar" },
        ],
      },
      ...upcoming.map((e) => ({
        "@type": "Event",
        name: e.title,
        startDate: e.start,
        endDate: e.end ?? e.start, // 1日開催は開始日＝終了日（endDate推奨項目対応）
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: e.note?.includes("オンライン")
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
        location: { "@type": "Place", name: e.venue, address: e.region === "japan" ? "日本" : "海外" },
        image: ["https://comixai.dev/og/calendar.png"],
        organizer: { "@type": "Organization", name: e.organizer, url: e.url },
        performer: { "@type": "Organization", name: e.organizer },
        /* 入場無料が明記されているイベントだけofferを出す（不明な料金は書かない） */
        ...(e.note?.includes("無料")
          ? {
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "JPY",
                url: e.url,
                availability: "https://schema.org/InStock",
              },
            }
          : {}),
        url: e.url,
        description: e.desc,
      })),
    ],
  };

  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav home={false} />
      <Breadcrumb trail={[{ name: "ホーム", href: "/" }, { name: "AIイベントカレンダー" }]} />

      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "30px 0 40px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 10 }}>
          COMIXAI NEWS — AIイベント＆ニュース
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(30px,4.8vw,48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
          AIの「今」と「次の予定」を、一枚で。
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 2, color: "var(--text-body)", maxWidth: 680, margin: 0 }}>
          OpenAI DevDayのような世界のビッグイベントから、日本の展示会まで——AI主要イベントの日程をカレンダーで一望できます。あわせて、毎朝自動更新の「今日のAIニュース」見出しも。<strong>公式発表済みの情報だけ</strong>を載せています（最終更新：{EVENTS_UPDATED}）。
        </p>
      </section>

      {/* ═══ 今日のAIニュース ═══ */}
      <section
        style={{
          background: "var(--paper-100)",
          borderTop: "var(--bw-line) solid var(--ink-900)",
          borderBottom: "var(--bw-line) solid var(--ink-900)",
          backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)",
          backgroundSize: "11px 11px",
        }}
      >
        <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "48px 0 52px" }}>
          <SectionHead kicker={<><i className="ph-bold ph-newspaper" style={{ marginRight: 6 }} />DAILY — 今日のAIニュース</>} title="今朝までの、話題の見出し。" hand="毎朝7時ごろ自動更新・出典へ直リンク" />
          {NEWS.items.length === 0 ? (
            <Card variant="flat" padding={22} style={{ maxWidth: 680, margin: "0 auto" }}>
              <p style={{ margin: 0, fontFamily: "var(--font-hand)", fontSize: 15, color: "var(--text-muted)" }}>
                ニュースの初回取得を待っています。毎朝7時ごろに最新の見出しがここに並びます。
              </p>
            </Card>
          ) : (
            <div style={{ display: "grid", gap: 10, maxWidth: 760, margin: "0 auto" }}>
              {NEWS.items.map((n) => (
                <a
                  key={n.url}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "baseline", gap: 12, textDecoration: "none", color: "inherit", background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", padding: "12px 16px", boxShadow: "var(--shadow-pop-sm)" }}
                >
                  <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--red-600)" }}>{fmtNewsDate(n.date)}</span>
                  <span style={{ flex: "1 1 auto", minWidth: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14.5, lineHeight: 1.6 }}>
                    {n.lang === "en" && (
                      <span style={{ display: "inline-block", verticalAlign: "1px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10, color: "var(--blue-600)", border: "1.5px solid var(--blue-500)", borderRadius: "var(--radius-full)", padding: "1px 8px", marginRight: 8, whiteSpace: "nowrap" }}>
                        <i className="ph-bold ph-globe-hemisphere-east" style={{ marginRight: 4 }} />海外
                      </span>
                    )}
                    {n.kind === "buzz" && (
                      <span style={{ display: "inline-block", verticalAlign: "1px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10, color: "var(--red-600)", border: "1.5px solid var(--red-500)", borderRadius: "var(--radius-full)", padding: "1px 8px", marginRight: 8, whiteSpace: "nowrap" }}>
                        <i className="ph-bold ph-fire" style={{ marginRight: 4 }} />話題
                      </span>
                    )}
                    <span title={n.titleJa ? n.title : undefined}>{n.titleJa ?? n.title}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 400, fontSize: 11, color: "var(--text-muted)", marginLeft: 8, whiteSpace: "nowrap" }}>
                      {n.source} <i className="ph-bold ph-arrow-up-right" />
                    </span>
                  </span>
                  {n.image && <NewsThumb src={n.image} />}
                </a>
              ))}
            </div>
          )}
          {NEWS.updatedAt && (
            <p style={{ margin: "14px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
              最終取得：{new Date(new Date(NEWS.updatedAt).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ")}（JST）／見出しの著作権は各媒体に帰属します／
              <i className="ph-bold ph-globe-hemisphere-east" style={{ marginRight: 3 }} />
              海外の見出しは自動翻訳（クリックで原文へ）
            </p>
          )}
        </div>
      </section>

      {/* ═══ カレンダー ═══ */}
      <section id="calendar" style={{ maxWidth: PAGE, margin: "0 auto", padding: "50px 0 20px", scrollMarginTop: 76 }}>
        <SectionHead kicker={<><i className="ph-bold ph-calendar-blank" style={{ marginRight: 6 }} />CALENDAR — イベントカレンダー</>} title="世界と日本の、AIイベント。" hand="クリックで公式サイトへ" />
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <CalendarView events={calEvents} />
        </div>
      </section>

      {/* ═══ 開催予定リスト ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "40px 0 30px" }}>
        <SectionHead kicker="UPCOMING — 開催予定" title="これからのイベント" hand={`全${upcoming.length}件・開催順`} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="articles-grid">
          {upcoming.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>

        {tba.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, margin: "0 0 12px", color: "var(--text-muted)" }}>
              <i className="ph-bold ph-hourglass" style={{ marginRight: 6 }} />
              開催決定・日程待ち
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="articles-grid">
              {tba.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ═══ アーカイブ ═══ */}
      {past.length > 0 && (
        <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "10px 0 40px" }}>
          <details>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, color: "var(--text-muted)", listStyle: "none", padding: "10px 0" }}>
              <i className="ph-bold ph-archive" style={{ marginRight: 6 }} />
              開催済みのイベント（{past.length}件）を見る
            </summary>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 12, opacity: 0.75 }} className="articles-grid">
              {past.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          </details>
        </section>
      )}

      {/* ═══ CTA ═══ */}
      <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "20px 0 54px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-hand)", fontSize: 17, color: "var(--text-muted)", margin: "0 0 18px" }}>
          ニュースの用語が分からなかったら、用語集へ。イベントの前に、基礎固めを。
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/glossary" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              AI用語集（全155語）
            </Button>
          </a>
          <a href="/history" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              AI歴史絵巻で振り返る
            </Button>
          </a>
        </div>
        <div style={{ marginTop: 26 }}>
          <ShareRow path="/calendar" text="AIイベントカレンダー2026＆今日のAIニュース" />
        </div>
      </section>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
