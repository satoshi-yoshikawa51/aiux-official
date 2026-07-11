"use client";
/* ============================================================
   吉川聡史 オフィシャルサイト — single-page site
   Hero（YouTube背景動画）→ プロフィール → 記事（新着/人気）
   → マガジン → SNS / YouTube → お問い合わせ → フッター
   ============================================================ */
import React from "react";
import { Button, Badge, Tag, Card, MangaPanel, SpeechBubble, Tabs, Input } from "./ds";
import {
  NOTE,
  NOTE_ALL,
  YOUTUBE,
  MAGAZINES,
  ARTICLES_NEW,
  ARTICLES_POPULAR,
  ROLES,
  FACTS,
  SOCIALS,
  FORMSPREE_ENDPOINT,
  CONTACT_EMAIL,
  BANNER,
  type Article,
  type Tone,
} from "./data";
import { WORK_DETAILS } from "./works/data";
import { WorkCard } from "./works/ui";
import { FEATURED_TERMS } from "./glossary/data";
import { PAGE, Nav, Footer } from "./site-chrome";

const HERO_INTRO =
  "株式会社ニジボックス室長・吉川聡史。マンガとUXの力で、むずかしいAIを「現場で使える武器」に変えていきます。";

const toneBg = (tone: Tone): string =>
  ({
    yellow: "var(--yellow-400)",
    red: "var(--red-500)",
    ink: "var(--ink-900)",
    blue: "var(--blue-500)",
    paper: "var(--paper-100)",
  }[tone] || "var(--paper-100)");

const fmtDate = (d?: string) => (d || "").replace(/-/g, ".");

/* CTA — 暗い背景用（白いゴーストボタン） */
function HeroActionsLight() {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <a href={NOTE} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <Button variant="primary" size="lg" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
          noteでマンガを読む
        </Button>
      </a>
      <a
        href="#articles"
        style={{
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: 17,
          color: "var(--paper-50)",
          padding: "14px 22px",
          borderRadius: "var(--radius-pill)",
          border: "var(--bw-bold) solid var(--paper-50)",
          background: "rgba(20,17,15,0.32)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        注目の記事を見る
      </a>
    </div>
  );
}

/* ═══════════════ Hero（背景動画・自前ホスト） ═══════════════ */
function HeroVideo() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    // 一部ブラウザの自動再生対策として明示的に再生を試みる（失敗時は
    // poster画像のまま）。YouTubeプレイヤーは使わないので、再生/一時停止
    // マークやロゴなどの余計なUIは一切出ない。
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  return (
    <section className="hero-video" style={{ borderBottom: "var(--bw-heavy) solid var(--ink-900)" }}>
      <div className="hero-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-fallback" src={BANNER} alt="COMIXAI" />
        <video
          ref={videoRef}
          className="hero-bg-video"
          src="/hero.mp4"
          poster="/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(18,15,13,0.88) 0%, rgba(18,15,13,0.64) 42%, rgba(18,15,13,0.34) 72%, rgba(18,15,13,0.2) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(18,15,13,0.3) 0%, rgba(18,15,13,0) 28%, rgba(18,15,13,0) 60%, rgba(18,15,13,0.5) 100%)",
          }}
        />
      </div>
      <div className="hero-content" style={{ maxWidth: PAGE, margin: "0 auto" }}>
        <div style={{ maxWidth: 600 }}>
          <div className="hero-enter-badge" style={{ display: "inline-block" }}>
            <Badge tone="red" style={{ marginBottom: 20, boxShadow: "var(--shadow-pop-sm)" }}>
              AIクリエイター × 漫画家
            </Badge>
          </div>
          <h1
            aria-label="AIを、面白く。わかりやすく。"
            style={{
              position: "relative",
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "clamp(40px, 6.4vw, 72px)",
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "0.01em",
              color: "var(--paper-50)",
              textShadow: "0 2px 18px rgba(0,0,0,0.55)",
            }}
          >
            <span className="hero-burst" aria-hidden="true" />
            <span aria-hidden="true">
              {["A", "I", "を", "、"].map((c, i) => (
                <span key={i} className="ht-ch" style={{ "--c": i } as React.CSSProperties}>
                  {c}
                </span>
              ))}
              {["面", "白", "く", "。"].map((c, i) => (
                <span key={"e" + i} className="ht-ch ht-em" style={{ "--c": i + 4, color: "var(--yellow-400)" } as React.CSSProperties}>
                  {c}
                </span>
              ))}
              <br />
              {["わ", "か", "り", "や", "す", "く", "。"].map((c, i) => (
                <span key={"w" + i} className="ht-ch" style={{ "--c": i + 8 } as React.CSSProperties}>
                  {c}
                </span>
              ))}
            </span>
          </h1>
          <p
            className="hero-enter"
            style={
              {
                fontSize: 17,
                lineHeight: 1.9,
                color: "var(--paper-100)",
                maxWidth: 480,
                margin: "20px 0 30px",
                textShadow: "0 1px 10px rgba(0,0,0,0.6)",
                "--i": 5,
              } as React.CSSProperties
            }
          >
            {HERO_INTRO}
          </p>
          <div className="hero-enter" style={{ "--i": 6 } as React.CSSProperties}>
            <HeroActionsLight />
          </div>
        </div>
      </div>
      <a href="#profile" className="hero-scroll-cue" aria-label="下へスクロール">
        <span>Scroll</span>
        <i className="ph-bold ph-caret-double-down" />
      </a>
    </section>
  );
}

/* ═══════════════ Section head ═══════════════ */
function SectionHead({ kicker, title, hand }: { kicker: string; title: string; hand?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 8 }}>
        {kicker}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(26px,3.4vw,36px)", margin: 0, lineHeight: 1.2 }}>{title}</h2>
        {hand && <span style={{ fontFamily: "var(--font-hand)", color: "var(--text-muted)", fontSize: 16 }}>{hand}</span>}
      </div>
    </div>
  );
}

/* ═══════════════ プロフィール ═══════════════ */
function Profile() {
  return (
    <section
      id="profile"
      style={{
        background: "var(--ink-900)",
        borderTop: "var(--bw-bold) solid var(--ink-900)",
        borderBottom: "var(--bw-bold) solid var(--ink-900)",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1.3px, transparent 1.4px)",
        backgroundSize: "13px 13px",
      }}
    >
      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "58px 0 62px", color: "var(--paper-50)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--yellow-400)", fontWeight: 700, marginBottom: 8 }}>
          PROFILE
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(26px,3.4vw,36px)", margin: "0 0 6px" }}>
          5つの顔を持つ、AIの伝道者
        </h2>
        <p style={{ color: "var(--paper-200)", fontSize: 16, lineHeight: 1.9, maxWidth: 640, margin: "0 0 34px" }}>
          AIクリエイター・漫画家・UXディレクター・映像ディレクター・ゲームプランナー。多彩な現場の視点で、生成AIの「面白さ」と「使いどころ」を伝えています。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 36 }} className="roles-grid">
          {ROLES.map((r) => (
            <div
              key={r.jp}
              style={{
                background: "var(--paper-50)",
                border: "var(--bw-line) solid var(--ink-900)",
                borderRadius: "var(--radius-md)",
                padding: "16px 14px",
                boxShadow: "var(--shadow-pop-sm)",
                color: "var(--ink-900)",
              }}
            >
              <i className={"ph-bold " + r.icon} style={{ fontSize: 24, color: "var(--red-500)" }} />
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16, marginTop: 8 }}>{r.jp}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em", marginTop: 3 }}>{r.en}</div>
              {r.note && <div style={{ fontSize: 11, color: "var(--red-600)", marginTop: 8, fontWeight: 700, lineHeight: 1.4 }}>{r.note}</div>}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 0,
            border: "var(--bw-line) solid var(--paper-200)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
          className="facts-grid"
        >
          {FACTS.map((f, i) => (
            <div
              key={f.k}
              style={{
                display: "flex",
                gap: 14,
                padding: "16px 18px",
                borderBottom: i < FACTS.length - 2 ? "1px solid rgba(244,236,221,0.18)" : "none",
                borderRight: i % 2 === 0 ? "1px solid rgba(244,236,221,0.18)" : "none",
              }}
            >
              <span style={{ flex: "none", width: 52, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", color: "var(--yellow-400)", paddingTop: 3, fontWeight: 700 }}>
                {f.k}
              </span>
              <span style={{ fontSize: 15, lineHeight: 1.7, color: "var(--paper-50)" }}>{f.v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 30 }}>
          <a href="/profile" style={{ textDecoration: "none" }}>
            <Button variant="yellow" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
              詳しいプロフィールを見る
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 記事カセット ═══════════════ */
function Meta({ a, mode }: { a: Article; mode: "new" | "popular" }) {
  if (mode === "popular") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--red-600)", whiteSpace: "nowrap" }}>
        <i className="ph-bold ph-heart" /> {a.likes}
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
      <i className="ph-bold ph-calendar-blank" /> {fmtDate(a.date)}
    </span>
  );
}

function Thumb({ a, h }: { a: Article; h: number | string }) {
  return (
    <div style={{ position: "relative", height: h, background: toneBg(a.tone), borderBottom: "var(--bw-bold) solid var(--ink-900)", overflow: "hidden", flex: "none" }}>
      {a.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.thumb} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(20,17,15,0.16) 1.4px, transparent 1.5px)", backgroundSize: "10px 10px" }} />
      )}
      <span style={{ position: "absolute", top: 0, left: 0 }}>
        <Badge tone="ink" style={{ borderRadius: "0 0 var(--radius-sm) 0", fontSize: 11 }}>
          {a.badge}
        </Badge>
      </span>
    </div>
  );
}

function ArticleCard({ a, mode }: { a: Article; mode: "new" | "popular" }) {
  return (
    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
      <Card variant="pop" hover padding={0} style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
        <Thumb a={a} h={150} />
        <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginBottom: 9 }}>
            <Meta a={a} mode={mode} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16.5, lineHeight: 1.5, textWrap: "pretty" }}>{a.title}</h3>
          <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.8, color: "var(--text-muted)", textWrap: "pretty" }}>{a.excerpt}</p>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {a.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12.5, color: "var(--red-600)", whiteSpace: "nowrap" }}>
              読む <i className="ph-bold ph-arrow-up-right" />
            </span>
          </div>
        </div>
      </Card>
    </a>
  );
}

function Articles() {
  const [tab, setTab] = React.useState<"new" | "popular">("new");
  const list = tab === "popular" ? ARTICLES_POPULAR : ARTICLES_NEW;
  return (
    <section id="articles" style={{ maxWidth: PAGE, margin: "0 auto", padding: "62px 0 56px" }}>
      <SectionHead kicker="ARTICLES — 記事" title="noteの記事" hand="新着・人気から、どうぞ。" />
      <div style={{ marginBottom: 26 }}>
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as "new" | "popular")}
          items={[
            { value: "new", label: "新着" },
            { value: "popular", label: "人気" },
          ]}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="articles-grid">
        {list.map((a) => (
          <ArticleCard key={a.title} a={a} mode={tab} />
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 34 }}>
        <a href={NOTE_ALL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
            noteで記事一覧を見る
          </Button>
        </a>
      </div>
    </section>
  );
}

/* ═══════════════ マガジン ═══════════════ */
function Magazines() {
  return (
    <section
      id="magazines"
      style={{
        background: "var(--paper-100)",
        borderTop: "var(--bw-line) solid var(--ink-900)",
        borderBottom: "var(--bw-line) solid var(--ink-900)",
        backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)",
        backgroundSize: "11px 11px",
      }}
    >
      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "60px 0 64px" }}>
        <SectionHead kicker="MAGAZINE — noteマガジン" title="シリーズで読む" hand="まとめ読み・フォローはこちら" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }} className="mag-grid">
          {MAGAZINES.map((m) => (
            <Card key={m.id} variant="pop" hover padding={0} style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
              <a href={`/manga/${m.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ position: "relative", aspectRatio: "900/300", borderBottom: "var(--bw-bold) solid var(--ink-900)", overflow: "hidden", background: toneBg(m.tone) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.cover} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <span style={{ position: "absolute", top: 10, left: 10 }}>
                    <Badge tone="red">{m.label}</Badge>
                  </span>
                </div>
                <div style={{ padding: "16px 18px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 19, lineHeight: 1.4, textWrap: "pretty" }}>{m.title}</h3>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8, color: "var(--text-muted)", textWrap: "pretty" }}>{m.desc}</p>
                </div>
              </a>
              <div style={{ padding: "0 18px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <a href={`/manga/${m.id}`} style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                  シリーズ紹介を見る <i className="ph-bold ph-arrow-right" />
                </a>
                <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-muted)" }}>
                  noteで読む <i className="ph-bold ph-arrow-up-right" />
                </a>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 34 }}>
          <a href="/manga" style={{ textDecoration: "none" }}>
            <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              連載シリーズ一覧を見る
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ つくったもの（WORKS） ═══════════════ */
const WORK_CATS: { key: "ゲーム" | "ニュース" | "ツール"; icon: string }[] = [
  { key: "ゲーム", icon: "ph-game-controller" },
  { key: "ニュース", icon: "ph-newspaper" },
  { key: "ツール", icon: "ph-wrench" },
];

function Works() {
  return (
    <section id="works" style={{ maxWidth: PAGE, margin: "0 auto", padding: "62px 0 56px" }}>
      <SectionHead kicker="WORKS — つくったもの" title="つくったもの" hand="遊べる・読める、AIプロダクト集" />
      {WORK_CATS.map((cat) => {
        const items = WORK_DETAILS.filter((w) => w.category === cat.key);
        if (!items.length) return null;
        return (
          <div key={cat.key} style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <i className={"ph-bold " + cat.icon} style={{ fontSize: 20, color: "var(--ink-900)" }} />
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17 }}>{cat.key}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="articles-grid">
              {items.map((w) => (
                <WorkCard key={w.slug} work={w} />
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <a href="/works" style={{ textDecoration: "none" }}>
          <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
            つくったもの一覧を見る
          </Button>
        </a>
      </div>
    </section>
  );
}

/* ═══════════════ AI用語集 ═══════════════ */
function Glossary() {
  return (
    <section
      id="glossary"
      style={{
        background: "var(--paper-100)",
        borderTop: "var(--bw-line) solid var(--ink-900)",
        borderBottom: "var(--bw-line) solid var(--ink-900)",
        backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)",
        backgroundSize: "11px 11px",
      }}
    >
      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "56px 0 60px" }}>
        <SectionHead kicker="GLOSSARY — AI用語集" title="いまさら聞けない、AI用語。" hand="図解つき・現場目線でサクッと" />
        <div className="rv-stagger" style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 880 }}>
          {FEATURED_TERMS.map((t) => (
            <a
              key={t.slug}
              href={`/glossary/${t.slug}`}
              style={{
                textDecoration: "none",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 14,
                color: "var(--ink-900)",
                background: "var(--paper-0)",
                border: "var(--bw-line) solid var(--ink-900)",
                borderRadius: "var(--radius-full)",
                padding: "10px 18px",
                boxShadow: "var(--shadow-pop-sm)",
              }}
            >
              {t.term}
              <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>とは</span>
              <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)", marginLeft: 6 }} />
            </a>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 34 }}>
          <a href="/glossary" style={{ textDecoration: "none" }}>
            <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              AI用語集を見る
            </Button>
          </a>
        </div>

        {/* —— AI用語力診断への導線（表紙動画つき） —— */}
        <a href="/quiz" style={{ textDecoration: "none", color: "inherit", display: "block", maxWidth: 680, margin: "40px auto 0" }}>
          <div
            className="quiz-banner"
            style={{
              background: "var(--ink-900)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-pop)",
              padding: "26px 42px",
              display: "flex",
              alignItems: "center",
              gap: 28,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 260px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--yellow-400)", fontWeight: 700, marginBottom: 6 }}>
                QUIZ — 腕試し
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(19px,3vw,25px)", color: "var(--paper-50)", lineHeight: 1.4 }}>
                あなたのAI用語力は、何級？
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.8, color: "rgba(251,247,239,0.75)", marginTop: 4 }}>
                毎回変わる12問・3分で5段階判定。1問ごとに解説つき。
              </div>
              <div style={{ marginTop: 16 }}>
                <Button variant="yellow" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
                  診断してみる
                </Button>
              </div>
            </div>
            {/* 表紙動画のワイプ（タイトルの右）。PCでは右端、スマホでは折り返して中央。
                ReactはSSRでmuted属性を出力しないため、rawタグで埋め込む */}
            <div
              style={{
                width: 148,
                height: 148,
                flex: "none",
                margin: "0 auto",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid var(--paper-50)",
                background: "var(--yellow-400)",
                transform: "rotate(3deg)",
              }}
              dangerouslySetInnerHTML={{
                __html:
                  '<video src="/quiz/top.mp4" autoplay muted loop playsinline preload="metadata" aria-hidden="true" style="width:100%;height:100%;object-fit:cover;display:block;"></video>',
              }}
            />
          </div>
        </a>

        {/* —— AI歴史絵巻への導線（1950年のサムネつき） —— */}
        <a href="/history" style={{ textDecoration: "none", color: "inherit", display: "block", maxWidth: 680, margin: "18px auto 0" }}>
          <div
            className="quiz-banner"
            style={{
              background: "var(--paper-0)",
              border: "var(--bw-line) solid var(--ink-900)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-pop)",
              padding: "26px 42px",
              display: "flex",
              alignItems: "center",
              gap: 28,
              flexWrap: "wrap",
            }}
          >
            {/* 表紙動画のワイプ。ReactはSSRでmuted属性を出力しないため、rawタグで埋め込む */}
            <div
              style={{
                width: 148,
                height: 148,
                flex: "none",
                margin: "0 auto",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "3px solid var(--ink-900)",
                transform: "rotate(-3deg)",
                boxShadow: "5px 5px 0 rgba(20,17,15,0.85)",
              }}
              dangerouslySetInnerHTML={{
                __html:
                  '<video src="/history/cover.mp4" poster="/history/cover.webp" autoplay muted loop playsinline preload="metadata" aria-hidden="true" style="width:100%;height:100%;object-fit:cover;display:block;"></video>',
              }}
            />
            <div style={{ flex: "1 1 260px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", color: "var(--red-600)", fontWeight: 700, marginBottom: 6 }}>
                EMAKI — AI歴史絵巻
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(19px,3vw,25px)", color: "var(--ink-900)", lineHeight: 1.4 }}>
                AIの75年を、ひと巻きに。
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.8, color: "var(--text-muted)", marginTop: 4 }}>
                1950年の「機械は考えられるか？」から、冬の時代、ChatGPT、エージェントまで。スクロールすると時代が進む、読む絵巻です。
              </div>
              <div style={{ marginTop: 16 }}>
                <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
                  絵巻を読む
                </Button>
              </div>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}

/* ═══════════════ AIのはじめかた・あそびば ═══════════════ */
function StartSection() {
  return (
    <section id="ai-start" style={{ maxWidth: PAGE, margin: "0 auto", padding: "62px 0 56px" }}>
      <SectionHead kicker="START — はじめての人へ" title="AI、何から始める？" hand="迷ったら、ここから" />
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <a href="/start" style={{ textDecoration: "none", color: "inherit" }}>
          <Card variant="pop" padding={0} style={{ overflow: "hidden", height: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/start/hero.webp" alt="AIのはじめかた——？の山を越えて進むキャラクター" loading="lazy" style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderBottom: "var(--bw-line) solid var(--ink-900)", display: "block" }} />
            <div style={{ padding: "16px 20px 20px" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, marginBottom: 6 }}>🚀 AIのはじめかた</div>
              <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.85, color: "var(--text-body)" }}>
                誰でも今日から始められる無料の学習コース。絵巻→マンガ→用語→体験ゲーム→実践の全3章。順番に進むだけでAIの基礎が身につきます。
              </p>
              <Button variant="primary" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
                コースを見る
              </Button>
            </div>
          </Card>
        </a>
      </div>
      <p style={{ margin: "16px 0 0", fontSize: 13.5, lineHeight: 1.9, color: "var(--text-muted)" }}>
        使う前の不安には <a href="/faq" style={{ color: "var(--red-600)", fontWeight: 700 }}>AIのよくある質問</a>、
        道具選びに迷ったら <a href="/compare" style={{ color: "var(--red-600)", fontWeight: 700 }}>ChatGPT・Claude・Gemini比較</a> を。あそんだ記録は <a href="/zukan" style={{ color: "var(--red-600)", fontWeight: 700 }}>COMIXAI図鑑</a> に刻まれます。
      </p>
    </section>
  );
}

/* ═══════════════ SNS + YouTube ═══════════════ */
function Social() {
  return (
    <section id="social" style={{ maxWidth: PAGE, margin: "0 auto", padding: "60px 0 20px" }}>
      <SectionHead kicker="FOLLOW — SNS" title="つながる" hand="各SNSで発信中！" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="social-grid">
        {SOCIALS.map((s) => {
          const disabled = !s.set;
          const Inner = (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 18px",
                background: "var(--paper-0)",
                border: "var(--bw-bold) solid var(--ink-900)",
                borderRadius: "var(--radius-md)",
                boxShadow: disabled ? "none" : "var(--shadow-pop-sm)",
                opacity: disabled ? 0.55 : 1,
                transition: "transform var(--dur-fast) var(--ease-pop), box-shadow var(--dur-fast)",
              }}
              className={disabled ? "" : "social-card"}
            >
              <span
                style={{
                  flex: "none",
                  width: 46,
                  height: 46,
                  borderRadius: "var(--radius-full)",
                  border: "var(--bw-line) solid var(--ink-900)",
                  background: "var(--ink-900)",
                  color: "var(--paper-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className={"ph-bold " + s.icon} style={{ fontSize: 22 }} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16 }}>{s.name}</span>
                <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.handle}
                </span>
              </span>
              {!disabled && <i className="ph-bold ph-arrow-up-right" style={{ marginLeft: "auto", color: "var(--text-muted)" }} />}
            </div>
          );
          return disabled ? (
            <div key={s.name} title="URL未設定">
              {Inner}
            </div>
          ) : (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
              {Inner}
            </a>
          );
        })}
      </div>

      {/* YouTube チャンネル */}
      <a href={YOUTUBE} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, alignItems: "stretch" }} className="yt-grid">
          <div
            className="social-card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "20px 22px",
              background: "var(--ink-900)",
              border: "var(--bw-bold) solid var(--ink-900)",
              borderRadius: "var(--radius-md)",
              color: "var(--paper-50)",
              boxShadow: "var(--shadow-pop-sm)",
              transition: "transform var(--dur-fast) var(--ease-pop), box-shadow var(--dur-fast)",
            }}
          >
            <span
              style={{
                flex: "none",
                width: 56,
                height: 56,
                borderRadius: "var(--radius-md)",
                background: "var(--red-500)",
                border: "var(--bw-line) solid var(--paper-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="ph-bold ph-youtube-logo" style={{ fontSize: 30, color: "#fff" }} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 19 }}>YouTube</h3>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--paper-200)" }}>@aiux-unite</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.7, color: "var(--paper-200)" }}>
                動画でもAI活用を発信中。チャンネルを見る <i className="ph-bold ph-arrow-up-right" />
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 18,
              background: "var(--paper-0)",
              border: "var(--bw-bold) solid var(--ink-900)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-pop-sm)",
            }}
          >
            <SpeechBubble variant="shout" fill="var(--yellow-400)" tail="bottom-left" style={{ fontSize: 15 }}>
              動画も要チェック！
            </SpeechBubble>
          </div>
        </div>
      </a>
    </section>
  );
}

/* ═══════════════ AI受付フローティング導線 ═══════════════ */
/* 右下にキャラクターが吹き出し付きで登場 → 数秒後に右端のタブに格納 */
function UketsukeFab() {
  const [state, setState] = React.useState<"hidden" | "pop" | "docked">("hidden");

  React.useEffect(() => {
    /* 同一セッションで2回目以降は最初からタブ格納状態 */
    if (window.sessionStorage.getItem("ukeFabSeen")) {
      setState("docked");
      return;
    }
    const t = window.setTimeout(() => {
      setState("pop");
      window.sessionStorage.setItem("ukeFabSeen", "1");
    }, 1400);
    return () => window.clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (state !== "pop") return;
    const t = window.setTimeout(() => setState("docked"), 8000);
    return () => window.clearTimeout(t);
  }, [state]);

  if (state === "hidden") return null;

  if (state === "docked") {
    return (
      <a
        href="/uketsuke"
        className="uke-fab-dock"
        aria-label="AI受付でご相談"
        style={{
          position: "fixed",
          right: 0,
          bottom: 26,
          zIndex: 55,
          display: "flex",
          alignItems: "center",
          gap: 7,
          textDecoration: "none",
          background: "var(--yellow-400)",
          border: "2px solid var(--ink-900)",
          borderRight: "none",
          borderRadius: "999px 0 0 999px",
          padding: "6px 10px 6px 7px",
          boxShadow: "var(--shadow-pop-sm)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uketsuke/char.webp"
          alt=""
          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 4%", background: "var(--paper-0)", border: "1.5px solid var(--ink-900)", flex: "none" }}
        />
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 12.5, color: "var(--ink-900)", lineHeight: 1.3 }}>
          AI相談
        </span>
      </a>
    );
  }

  return (
    <div className="uke-fab-pop" style={{ position: "fixed", right: 14, bottom: 12, zIndex: 55, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <div style={{ position: "relative" }}>
        <div
          style={{
            background: "var(--paper-0)",
            border: "2px solid var(--ink-900)",
            borderRadius: "14px 14px 4px 14px",
            boxShadow: "var(--shadow-pop-sm)",
            padding: "10px 14px",
            maxWidth: 220,
          }}
        >
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14.5, color: "var(--ink-900)" }}>ご相談はこちら！</div>
          <div style={{ fontSize: 12, lineHeight: 1.7, color: "var(--text-muted)", marginTop: 2 }}>AI受付が用件をまとめます</div>
        </div>
        <button
          type="button"
          aria-label="閉じる"
          onClick={() => setState("docked")}
          style={{
            position: "absolute",
            top: -10,
            left: -10,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--ink-900)",
            color: "var(--paper-50)",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
      <a href="/uketsuke" aria-label="AI受付をひらく" style={{ display: "block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uketsuke/char.webp"
          alt="AI受付のキャラクター"
          style={{ width: 96, height: "auto", display: "block", filter: "drop-shadow(3px 4px 0 rgba(20,17,15,0.25))" }}
        />
      </a>
    </div>
  );
}

/* ═══════════════ お問い合わせ ═══════════════ */
function Contact() {
  const [state, setState] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = React.useState("");
  const configured = !FORMSPREE_ENDPOINT.includes("REPLACE_WITH_FORM_ID");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (!configured) {
      const body = `お名前: ${data.get("name")}\nメール: ${data.get("email")}\n\n${data.get("message")}`;
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("【オフィシャルサイト】お問い合わせ")}&body=${encodeURIComponent(body)}`;
      return;
    }
    setState("sending");
    setErr("");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (res.ok) {
        setState("done");
        form.reset();
      } else {
        const j = await res.json().catch(() => ({}));
        setErr((j.errors && j.errors.map((x: { message: string }) => x.message).join(" / ")) || "送信に失敗しました。");
        setState("error");
      }
    } catch {
      setErr("通信エラーが発生しました。");
      setState("error");
    }
  }

  return (
    <section id="contact" style={{ maxWidth: PAGE, margin: "0 auto", padding: "56px 0 70px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 36, alignItems: "start" }} className="contact-grid">
        <div>
          <SectionHead kicker="CONTACT — お問い合わせ" title="お仕事のご相談" />
          <p style={{ fontSize: 15.5, lineHeight: 1.95, color: "var(--text-body)", maxWidth: 380 }}>
            講演・寄稿・制作・取材などのご相談はお気軽に。いただいたご相談には、メールにて返信いたします。
          </p>
          <div style={{ marginTop: 22 }}>
            <SpeechBubble variant="say" tail="bottom-left" style={{ fontSize: 16 }}>
              一緒に、AIを面白く！
            </SpeechBubble>
          </div>
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-muted)" }}>
            <i className="ph-bold ph-envelope-simple" /> {CONTACT_EMAIL}
          </div>
          {/* AI受付への導線 */}
          <a href="/uketsuke" style={{ textDecoration: "none", display: "block", marginTop: 20, maxWidth: 380 }}>
            <Card variant="pop" hover padding={16} style={{ background: "var(--yellow-400)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/uketsuke/char.webp" alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 4%", border: "2px solid var(--ink-900)", background: "var(--paper-0)", flex: "none" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 14.5, color: "var(--ink-900)" }}>
                    文章を考えるのが面倒なら、AI受付へ
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-900)", opacity: 0.75, marginTop: 2 }}>
                    AIと話すだけでお問い合わせが完成 <i className="ph-bold ph-arrow-right" />
                  </div>
                </div>
              </div>
            </Card>
          </a>
        </div>

        <Card variant="pop" padding={24}>
          {state === "done" ? (
            <div style={{ textAlign: "center", padding: "26px 10px" }}>
              <SpeechBubble variant="shout" fill="var(--yellow-400)" style={{ fontSize: 22 }}>
                送信できました！
              </SpeechBubble>
              <p style={{ marginTop: 22, fontSize: 15, lineHeight: 1.9, color: "var(--text-body)" }}>
                お問い合わせありがとうございます。
                <br />
                内容を確認のうえ、ご返信いたします。
              </p>
              <div style={{ marginTop: 14 }}>
                <Button variant="secondary" size="md" onClick={() => setState("idle")}>
                  続けて送信する
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
              <input type="text" name="_gotcha" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
              <input type="hidden" name="_subject" value="【オフィシャルサイト】お問い合わせ" />
              <Input label="お名前" name="name" placeholder="山田 太郎" required />
              <Input label="メールアドレス" name="email" type="email" placeholder="you@example.com" hint="ご返信先になります" required />
              <div style={{ display: "grid", gap: 6 }}>
                <label htmlFor="c-msg" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>
                  お問い合わせ内容
                </label>
                <textarea
                  id="c-msg"
                  name="message"
                  required
                  rows={5}
                  placeholder="ご相談内容をご記入ください"
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-body)",
                    fontSize: 16,
                    color: "var(--text-strong)",
                    background: "var(--paper-0)",
                    border: "var(--bw-line) solid var(--ink-900)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 12px",
                    lineHeight: 1.7,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {state === "error" && (
                <div style={{ fontSize: 13, color: "var(--red-600)", fontWeight: 700 }}>
                  <i className="ph-bold ph-warning" /> {err}
                </div>
              )}
              <Button type="submit" variant="primary" size="lg" block disabled={state === "sending"} iconRight={<i className="ph-bold ph-paper-plane-tilt" />}>
                {state === "sending" ? "送信中…" : "送信する"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </section>
  );
}

/* ═══════════════ Page ═══════════════ */
export default function Page() {
  return (
    <div id="top" style={{ background: "var(--paper-50)", minHeight: "100vh" }}>
      <Nav />
      <HeroVideo />
      <Profile />
      <Articles />
      <Magazines />
      <Works />
      <Glossary />
      <StartSection />
      <Social />
      <Contact />
      <Footer />
      <UketsukeFab />
    </div>
  );
}
