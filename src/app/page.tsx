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
  type Article,
  type Tone,
} from "./data";
import { WORK_DETAILS } from "./works/data";
import Splash from "./splash";
import { WorkCard } from "./works/ui";
import { FEATURED_TERMS } from "./glossary/data";
import { FEATURED_RECIPES } from "./prompts/data";
import { GUIDES } from "./guide/data";
import { EVENTS, dateLabel, isPast } from "./calendar/events";
import newsJson from "./calendar/news-headlines.json";
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
      <a href={NOTE} target="_blank" rel="noopener noreferrer" data-ga="cta_click" data-ga-place="hero-note" style={{ textDecoration: "none" }}>
        <Button variant="primary" size="lg" iconRight={<i className="ph-bold ph-arrow-up-right" />}>
          noteでマンガを読む
        </Button>
      </a>
      <a
        href="#articles"
        data-ga="cta_click"
        data-ga-place="hero-articles"
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
    // 自動再生は「1回試して終わり」にしない。iOSは画面に見えていない
    // 動画の再生を拒むことがあり、開幕のローディング演出で覆われている
    // 間に弾かれると、そのままフォールバック画像のまま固まってしまう。
    // 状況が変わるたび（データが届いた・画面に入った・タブに戻った）に
    // 試し直す。再生中に呼んでも何も起きないので、重ねて安全。
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;

    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    tryPlay();

    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    document.addEventListener("visibilitychange", tryPlay);
    /* ローディング演出が明けるころにもう一度 */
    const timer = window.setTimeout(tryPlay, 3000);

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) tryPlay();
      });
      io.observe(v);
    }

    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
      window.clearTimeout(timer);
      io?.disconnect();
    };
  }, []);

  return (
    <section className="hero-video" style={{ borderBottom: "var(--bw-heavy) solid var(--ink-900)" }}>
      <div className="hero-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-fallback" src="/hero-logo.jpg" alt="COMIXAI — AIを、面白く。わかりやすく。" />
        {/* ———— 背景動画は「最初から」読む ————
            6MBあるので一度 preload="none" にして load後のアイドルまで
            遅らせたことがあるが、逆効果だったので戻した。理由は2つ:
            ・load イベントは全リソースの完了後なので、回線が細いと
              動画の取得開始そのものが何秒も後ろにずれる。結果、
              「再生されないまま離脱」が増えた。
            ・このサイトは開幕にローディング演出(splash.tsx)が最大2.6秒
              かぶるので、その間に読み込むぶんには誰も待たされない。
            測定でも、動画の有無で FCP/LCP は変わらなかった。
            折りたたみより下のサムネ動画も同じ理由で遅延をやめている
            （下の「サムネ動画は遅延させない」の注記を参照）。 */}
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
function SectionHead({ kicker, title, hand }: { kicker: React.ReactNode; title: string; hand?: string }) {
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

/* ═══════════════ Claude教習所バナー（トップの特設導線） ═══════════════ */
function KyoshujoBanner() {
  return (
    <section style={{ maxWidth: PAGE, margin: "0 auto", padding: "40px 0" }}>
      <a
        href="/claude-app"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
        data-ga="cta_click"
        data-ga-place="top-kyoshujo-banner"
      >
        <div
          className="kyoshujo-banner"
          style={{
            display: "grid", gridTemplateColumns: "minmax(0, 11fr) minmax(0, 9fr)", alignItems: "stretch",
            border: "var(--bw-bold) solid var(--ink-900)", borderRadius: 18, overflow: "hidden",
            background: "var(--paper-0)", boxShadow: "var(--shadow-pop)",
          }}
        >
          <div style={{ padding: "28px 28px 26px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: "var(--red-600)", color: "#fff", borderRadius: 999, padding: "3px 12px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 800, letterSpacing: ".08em" }}>
                NEW
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--red-600)", fontWeight: 700 }}>
                さわって覚えるClaude入門
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(24px,3.2vw,34px)", lineHeight: 1.3 }}>
              5分で覚える！Claude教習所
            </div>
            <p style={{ fontSize: 14, lineHeight: 2, color: "var(--text-body)", margin: 0 }}>
              本物そっくりの練習画面を、講師が「どこを押すか」から1つずつ案内。
              <b>1コース約5分・登録不要</b>で、Claudeの使い方が体で覚えられる無料コースです。
            </p>
            <div style={{ marginTop: 4 }}>
              <Button variant="primary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
                無料ではじめる
              </Button>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/claude-app/banner.webp"
            alt="5分で覚える！Claude教習所 — 練習画面を講師が案内"
            style={{ width: "100%", height: "100%", minHeight: 220, objectFit: "cover", display: "block" }}
          />
        </div>
      </a>
    </section>
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
          <a href="/profile" data-ga="cta_click" data-ga-place="top-profile" style={{ textDecoration: "none" }}>
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
    <a href={a.url} target="_blank" rel="noopener noreferrer" data-ga="card_click" data-ga-place={`articles-${mode}`} data-ga-path={a.url} style={{ textDecoration: "none", color: "inherit" }}>
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
        <a href={NOTE_ALL} target="_blank" rel="noopener noreferrer" data-ga="cta_click" data-ga-place="articles-more" style={{ textDecoration: "none" }}>
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
              <a href={`/manga/${m.id}`} data-ga="card_click" data-ga-place="magazines" data-ga-path={`/manga/${m.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}>
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
                <a href={`/manga/${m.id}`} data-ga="card_click" data-ga-place="magazines-link" data-ga-path={`/manga/${m.id}`} style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--red-600)" }}>
                  シリーズ紹介を見る <i className="ph-bold ph-arrow-right" />
                </a>
                <a href={m.url} target="_blank" rel="noopener noreferrer" data-ga="card_click" data-ga-place="magazines-note" data-ga-path={m.url} style={{ textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--text-muted)" }}>
                  noteで読む <i className="ph-bold ph-arrow-up-right" />
                </a>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 34 }}>
          <a href="/manga" data-ga="cta_click" data-ga-place="magazines-more" style={{ textDecoration: "none" }}>
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
                <WorkCard key={w.slug} work={w} place="top-works" />
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <a href="/works" data-ga="cta_click" data-ga-place="works-more" style={{ textDecoration: "none" }}>
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
              data-ga="card_click"
              data-ga-place="top-glossary"
              data-ga-path={`/glossary/${t.slug}`}
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
          <a href="/glossary" data-ga="cta_click" data-ga-place="glossary-more" style={{ textDecoration: "none" }}>
            <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              AI用語集を見る
            </Button>
          </a>
        </div>

        {/* —— AI用語力診断への導線（表紙動画つき） —— */}
        <a href="/quiz" data-ga="card_click" data-ga-place="top-quiz" data-ga-path="/quiz" style={{ textDecoration: "none", color: "inherit", display: "block", maxWidth: 680, margin: "40px auto 0" }}>
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
                ReactはSSRでmuted属性を出力しないため、rawタグで埋め込む。
                srcはHTMLに直接書く（JS実行を待たせない。理由は下の注記） */}
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
                  '<video src="/quiz/top.mp4" poster="/quiz/top.webp" autoplay muted loop playsinline preload="metadata" aria-hidden="true" style="width:100%;height:100%;object-fit:cover;display:block;"></video>',
              }}
            />
          </div>
        </a>

        {/* —— AI歴史絵巻への導線（1950年のサムネつき） —— */}
        <a href="/history" data-ga="card_click" data-ga-place="top-history" data-ga-path="/history" style={{ textDecoration: "none", color: "inherit", display: "block", maxWidth: 680, margin: "18px auto 0" }}>
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
            {/* ———— サムネ動画は遅延させない ————
                一度 IntersectionObserver で「近づいたら読む」に変えたが、
                勢いよくスクロールされると間に合わず、素通りされる間ずっと
                空のままだった。時間差で読む保険も足したが、タイマーが
                動き出すのはJSのハイドレーション後。回線が細いとそれ自体が
                遅く、実測（1.6Mbps）では取得開始が8.5秒になっていた。
                srcをHTMLに直接書けばJSを待たずに済むので、こちらに戻す。
                2本あわせて1.35MBで、ヒーローの背景動画6MBに比べれば軽い。
                ReactはSSRでmuted属性を出力しないため、rawタグで埋め込む */}
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
        <a href="/start" data-ga="card_click" data-ga-place="top-start" data-ga-path="/start" style={{ textDecoration: "none", color: "inherit" }}>
          <Card variant="pop" padding={0} style={{ overflow: "hidden", height: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/start/hero.webp" alt="AIのはじめかた——？の山を越えて進むキャラクター" loading="lazy" style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderBottom: "var(--bw-line) solid var(--ink-900)", display: "block" }} />
            <div style={{ padding: "16px 20px 20px" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, marginBottom: 6 }}><i className="ph-bold ph-rocket-launch" style={{ marginRight: 6, color: "var(--red-500)" }} />AIのはじめかた</div>
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
        使う前の不安には <a href="/faq" data-ga="nav_click" data-ga-place="top-inline" data-ga-path="/faq" style={{ color: "var(--red-600)", fontWeight: 700 }}>AIのよくある質問</a>、
        道具選びに迷ったら <a href="/compare" data-ga="nav_click" data-ga-place="top-inline" data-ga-path="/compare" style={{ color: "var(--red-600)", fontWeight: 700 }}>ChatGPT・Claude・Gemini比較</a> を。あそんだ記録は <a href="/zukan" data-ga="nav_click" data-ga-place="top-inline" data-ga-path="/zukan" style={{ color: "var(--red-600)", fontWeight: 700 }}>COMIXAI図鑑</a> に刻まれます。
      </p>
    </section>
  );
}

/* ═══════════════ COMIXAI NEWS ストリップ（ヒーロー直下） ═══════════════
   「今日イチの話題」1行＋「次のイベント」1行の、そろえた2段構成。
   話題はブックマーク数（はてブ人気）が最大の記事を選ぶ。 */
interface StripNewsItem {
  title: string;
  titleJa?: string;
  url: string;
  lang: string;
  kind?: string;
  count?: number;
}

function NewsStrip() {
  const items = (newsJson as { items: StripNewsItem[] }).items;
  const buzz = items.filter((n) => n.kind === "buzz");
  const topNews =
    buzz.sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0] ??
    items.find((n) => n.lang === "ja") ??
    items[0];
  const nextEvent = EVENTS
    .filter((e) => e.start && !e.tba && !isPast(e))
    .sort((a, b) => (a.start! < b.start! ? -1 : 1))[0];
  if (!topNews && !nextEvent) return null;

  const label = (text: React.ReactNode) => (
    <span
      style={{
        flex: "none",
        width: 92,
        textAlign: "center",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        fontSize: 10.5,
        letterSpacing: "0.08em",
        color: "var(--ink-900)",
        background: "var(--yellow-400)",
        border: "var(--bw-line) solid var(--ink-900)",
        borderRadius: "var(--radius-full)",
        padding: "3px 0",
      }}
    >
      {text}
    </span>
  );
  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    minWidth: 0,
  };
  const textStyle: React.CSSProperties = {
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.6,
    color: "var(--paper-50)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  };

  return (
    <section style={{ background: "var(--ink-900)", borderBottom: "var(--bw-line) solid var(--ink-900)" }}>
      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "14px 0 16px" }}>
        {/* グルーピング用の薄いグレー角丸ボックス */}
        <div
          className="news-strip"
          style={{
            display: "flex",
            gap: 20,
            alignItems: "center",
            background: "rgba(251,247,239,0.06)",
            border: "1px solid rgba(251,247,239,0.22)",
            borderRadius: "var(--radius-lg)",
            padding: "13px 18px",
          }}
        >
          <div style={{ flex: "1 1 auto", minWidth: 0, display: "grid", gap: 8 }}>
            {topNews && (
              <a href={topNews.url} target="_blank" rel="noopener noreferrer" data-ga="card_click" data-ga-place="news-strip" data-ga-path={topNews.url} style={rowStyle}>
                {label(<><i className="ph-bold ph-newspaper" style={{ marginRight: 4 }} />今日の話題</>)}
                <span style={textStyle}>{topNews.titleJa ?? topNews.title}</span>
              </a>
            )}
            {nextEvent && (
              <a href="/calendar#calendar" data-ga="card_click" data-ga-place="news-strip" data-ga-path="/calendar" style={rowStyle}>
                {label(<><i className="ph-bold ph-calendar-blank" style={{ marginRight: 4 }} />イベント</>)}
                <span style={textStyle}>
                  {nextEvent.title}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--yellow-400)", marginLeft: 10 }}>{dateLabel(nextEvent)}</span>
                </span>
              </a>
            )}
          </div>
          <a href="/calendar" data-ga="cta_click" data-ga-place="news-more" style={{ textDecoration: "none", flex: "none" }}>
            <Button variant="yellow" size="sm" iconRight={<i className="ph-bold ph-arrow-right" />}>
              NEWS
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ プロンプト集 ═══════════════ */
function PromptRecipes() {
  return (
    <section
      id="prompts"
      style={{
        background: "var(--paper-100)",
        borderTop: "var(--bw-line) solid var(--ink-900)",
        borderBottom: "var(--bw-line) solid var(--ink-900)",
        backgroundImage: "radial-gradient(var(--tone-dot) 1.3px, transparent 1.4px)",
        backgroundSize: "11px 11px",
      }}
    >
      <div style={{ maxWidth: PAGE, margin: "0 auto", padding: "56px 0 60px" }}>
        <SectionHead kicker="PROMPT RECIPES — プロンプト集" title="コピペで使える、仕事のプロンプト。" hand="失敗例の実演つき・全レシピ現場仕込み" />
        <p style={{ margin: "-8px 0 22px", fontSize: 14, lineHeight: 1.9, color: "var(--text-muted)", maxWidth: 680 }}>
          営業メール、議事録、Excel関数、職務経歴書——「ダメな指示→事故る出力→直した指示」の実演つきで、AIへの頼み方そのものが身につくレシピ集です。
        </p>
        <div className="rv-stagger" style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 880 }}>
          {FEATURED_RECIPES.map((r) => (
            <a
              key={r.slug}
              href={`/prompts/${r.slug}`}
              data-ga="card_click"
              data-ga-place="top-prompts"
              data-ga-path={`/prompts/${r.slug}`}
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
              <i className={"ph-bold " + r.icon} style={{ marginRight: 6, color: "var(--red-500)" }} />
              {r.title}
              <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>のプロンプト</span>
              <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)", marginLeft: 6 }} />
            </a>
          ))}
        </div>
        {/* 職種別ガイド：同じ「仕事で使う」カテゴリの入口としてここに束ねる。
            ガイドは9職種あるが、トップに出すのは**先頭4つだけ**。
            ここは入口なので、全部並べると2段になってこのセクションが重くなる。
            残りは下の「職種別ガイドを見る」から /guide へ */}
        <p style={{ fontFamily: "var(--font-hand)", fontSize: 14.5, color: "var(--text-muted)", margin: "30px 0 12px" }}>
          自分の仕事に引きつけて読むなら、職種別ガイドから↓（全{GUIDES.length}職種）
        </p>
        <div className="rv-stagger" style={{ display: "flex", gap: 12, flexWrap: "wrap", maxWidth: 1000 }}>
          {GUIDES.slice(0, 4).map((g) => (
            <a
              key={g.slug}
              href={`/guide/${g.slug}`}
              data-ga="card_click"
              data-ga-place="top-guide"
              data-ga-path={`/guide/${g.slug}`}
              style={{
                flex: "1 1 180px",
                maxWidth: 250,
                textDecoration: "none",
                color: "inherit",
                border: "var(--bw-line) solid var(--ink-900)",
                borderRadius: "var(--radius-md)",
                background: "var(--paper-0)",
                overflow: "hidden",
                boxShadow: "var(--shadow-pop-sm)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/guide/${g.slug}.webp`}
                alt={g.title}
                loading="lazy"
                style={{ display: "block", width: "100%", height: 96, objectFit: "cover", borderBottom: "var(--bw-line) solid var(--ink-900)" }}
              />
              <span style={{ display: "block", padding: "9px 12px", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 13.5, whiteSpace: "nowrap" }}>
                <i className={"ph-bold " + g.icon} style={{ marginRight: 6, color: "var(--red-500)" }} />
                {g.role.split("・")[0]}のAI活用
                <i className="ph-bold ph-arrow-right" style={{ color: "var(--red-600)", marginLeft: 6 }} />
              </span>
            </a>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 34, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/prompts" data-ga="cta_click" data-ga-place="prompts-more" style={{ textDecoration: "none" }}>
            <Button variant="ink" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              プロンプト集を見る
            </Button>
          </a>
          <a href="/guide" data-ga="cta_click" data-ga-place="guide-more" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="lg" iconRight={<i className="ph-bold ph-arrow-right" />}>
              職種別ガイドを見る
            </Button>
          </a>
        </div>
      </div>
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
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" data-ga="social_click" data-ga-network={s.name} data-ga-place="top" style={{ textDecoration: "none", color: "inherit" }}>
              {Inner}
            </a>
          );
        })}
      </div>

      {/* YouTube チャンネル */}
      <a href={YOUTUBE} target="_blank" rel="noopener noreferrer" data-ga="social_click" data-ga-network="youtube" data-ga-place="top" style={{ textDecoration: "none", color: "inherit" }}>
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
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--paper-200)" }}>@comixai-dev</span>
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
/* 少しスクロールすると右下にキャラクターが吹き出し付きで登場 →
   5秒後（または✕）にポップな退場アニメーションで右端のタブに格納 */
/* タブ格納直後に散らすキラキラ（タブ左側に配置） */
const UKE_SPARKS: { left: number; top: number; size: number; color: string; delay: number }[] = [
  { left: -18, top: -14, size: 15, color: "var(--yellow-400)", delay: 0 },
  { left: -30, top: 12, size: 11, color: "var(--red-500)", delay: 0.1 },
  { left: 4, top: -20, size: 13, color: "var(--yellow-400)", delay: 0.18 },
  { left: -12, top: 34, size: 10, color: "var(--yellow-400)", delay: 0.26 },
  { left: 34, top: -16, size: 11, color: "var(--red-500)", delay: 0.34 },
  { left: -34, top: -6, size: 9, color: "var(--yellow-400)", delay: 0.42 },
];

function UketsukeFab() {
  const [state, setState] = React.useState<"hidden" | "pop" | "exiting" | "docked">("hidden");
  /* 透過webm（VP9アルファ）が再生できるブラウザだけ動画にする。
     SafariはVP9を再生できてもアルファ非対応で黒背景になるため除外。
     Xアプリ等のiOS WKWebViewはUAに"Safari"を含まないので、iOS端末
     そのものでも判定する（Mac風UAのiPadOSはタッチ点数で検出） */
  const [alphaVideo, setAlphaVideo] = React.useState(false);
  React.useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const v = document.createElement("video");
    if (!isIOS && !isSafari && v.canPlayType('video/webm; codecs="vp9"')) setAlphaVideo(true);
  }, []);
  const [sparkle, setSparkle] = React.useState(false);

  React.useEffect(() => {
    /* 同一セッションで2回目以降は最初からタブ格納状態 */
    if (window.sessionStorage.getItem("ukeFabSeen")) {
      setState("docked");
      return;
    }
    /* 少しスクロールしたら登場 */
    const onScroll = () => {
      if (window.scrollY > 300) {
        window.removeEventListener("scroll", onScroll);
        setState("pop");
        window.sessionStorage.setItem("ukeFabSeen", "1");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* 5秒表示したら退場アニメーション→タブ格納 */
  React.useEffect(() => {
    if (state === "pop") {
      const t = window.setTimeout(() => setState("exiting"), 5000);
      return () => window.clearTimeout(t);
    }
    if (state === "exiting") {
      const t = window.setTimeout(() => {
        setState("docked");
        setSparkle(true);
      }, 650);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  /* キラキラは一瞬だけ */
  React.useEffect(() => {
    if (!sparkle) return;
    const t = window.setTimeout(() => setSparkle(false), 1500);
    return () => window.clearTimeout(t);
  }, [sparkle]);

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
          src="/uketsuke/char-icon.webp"
          alt=""
          className="uke-dock-img"
          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 4%", background: "var(--paper-0)", border: "1.5px solid var(--ink-900)", flex: "none" }}
        />
        <span className="uke-dock-label" style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 12.5, color: "var(--ink-900)", lineHeight: 1.3 }}>
          AI相談
        </span>
        {sparkle &&
          UKE_SPARKS.map((s, i) => (
            <span
              key={i}
              className="uke-spark"
              aria-hidden="true"
              style={{ left: s.left, top: s.top, fontSize: s.size, color: s.color, animationDelay: `${s.delay + 0.35}s` }}
            >
              <i className="ph-bold ph-star-four" />
            </span>
          ))}
      </a>
    );
  }

  return (
    <div className={"uke-fab-pop" + (state === "exiting" ? " uke-fab-exit" : "")} style={{ position: "fixed", right: 14, bottom: 12, zIndex: 55, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <div className={state === "exiting" ? "uke-bubble-out" : undefined} style={{ position: "relative" }}>
        <div
          className="uke-fab-bubble"
          style={{
            background: "var(--paper-0)",
            border: "2px solid var(--ink-900)",
            borderRadius: "14px 14px 4px 14px",
            boxShadow: "var(--shadow-pop-sm)",
          }}
        >
          <div className="uke-fab-bubble-title" style={{ fontFamily: "var(--font-heading)", fontWeight: 900, color: "var(--ink-900)" }}>ご相談はこちら！</div>
          <div className="uke-fab-bubble-sub" style={{ lineHeight: 1.7, color: "var(--text-muted)", marginTop: 2 }}>AI受付が用件をまとめます</div>
        </div>
        <button
          type="button"
          aria-label="閉じる"
          onClick={() => setState("exiting")}
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
          <i className="ph-bold ph-x" />
        </button>
      </div>
      <a href="/uketsuke" aria-label="AI受付をひらく" data-ga="cta_click" data-ga-place="uketsuke-fab" style={{ display: "block" }}>
        {/* React は muted 属性をSSRで落とすため video は生HTMLで埋め込む */}
        <span
          className="uke-fab-char"
          style={{ display: "block", aspectRatio: "488 / 522", filter: "drop-shadow(3px 4px 0 rgba(20,17,15,0.25))" }}
          dangerouslySetInnerHTML={{
            __html: alphaVideo
              ? '<video src="/uketsuke/char-alpha.webm" autoplay muted loop playsinline preload="auto" aria-hidden="true" style="width:100%;height:100%;object-fit:contain;display:block;"></video>'
              : /* Safari(iPhone含む)は透過webm非対応 → アルファ付きアニメWebPで動かす */
                '<img src="/uketsuke/char-anim.webp" alt="" style="width:100%;height:100%;object-fit:contain;display:block;">',
          }}
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
          <a href="/uketsuke" data-ga="cta_click" data-ga-place="contact-uketsuke" style={{ textDecoration: "none", display: "block", marginTop: 20, maxWidth: 380 }}>
            <Card variant="pop" hover padding={16} style={{ background: "var(--yellow-400)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/uketsuke/char-icon.webp" alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 4%", border: "2px solid var(--ink-900)", background: "var(--paper-0)", flex: "none" }} />
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
              <p style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.8, color: "var(--text-muted)" }}>
                ※ 3日たっても返信がない場合は、お手数ですが {CONTACT_EMAIL} へ直接ご連絡ください。
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
      <Splash />
      <Nav />
      <HeroVideo />
      <NewsStrip />
      <KyoshujoBanner />
      <Profile />
      <Articles />
      <Magazines />
      <Works />
      <Glossary />
      <StartSection />
      <PromptRecipes />
      <Social />
      <Contact />
      <Footer />
      <UketsukeFab />
    </div>
  );
}
