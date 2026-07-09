import { Nav, Footer } from "./site-chrome";
import { Button } from "./ds";

export default function NotFound() {
  return (
    <div style={{ background: "var(--paper-50)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav home={false} />
      <section style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 16px" }}>
        <div style={{ textAlign: "center", maxWidth: 520 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "clamp(64px,14vw,110px)", lineHeight: 1, letterSpacing: "-0.04em", color: "var(--ink-900)" }}>
            4<span style={{ color: "var(--red-500)" }}>0</span>4
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/quiz/grades/hiyoko.webp"
            alt="困っているキャラクター"
            style={{ width: 150, height: 150, objectFit: "cover", borderRadius: "50%", border: "4px solid var(--ink-900)", boxShadow: "var(--shadow-pop)", margin: "18px auto 20px", transform: "rotate(-4deg)" }}
          />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(22px,4vw,30px)", margin: "0 0 12px", lineHeight: 1.5 }}>
            このページ、<br />ハルシネーションかも。
          </h1>
          <p style={{ fontSize: 14.5, lineHeight: 2, color: "var(--text-body)", margin: "0 0 8px" }}>
            お探しのページは存在しないか、移動しました。
            それっぽいURLを自信満々に案内された場合は——出典の確認、大事です。
          </p>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px" }}>
            ※「ハルシネーション」の意味が気になった人は、いい機会なので用語集へ
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="md" iconRight={<i className="ph-bold ph-house" />}>
                トップへ戻る
              </Button>
            </a>
            <a href="/glossary/hallucination" style={{ textDecoration: "none" }}>
              <Button variant="ink" size="md" iconRight={<i className="ph-bold ph-arrow-right" />}>
                ハルシネーションとは
              </Button>
            </a>
            <a href="/play" style={{ textDecoration: "none" }}>
              <Button variant="secondary" size="md" iconRight={<i className="ph-bold ph-game-controller" />}>
                あそびばへ
              </Button>
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
