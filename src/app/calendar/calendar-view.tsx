"use client";
/* 月めくりできるイベントカレンダー。
   日セルに開催マーク（🌏世界=青 / 🗾日本=赤）を出し、
   下にその月のイベントを一覧表示する。 */
import React from "react";

export interface CalEvent {
  id: string;
  title: string;
  start: string; // YYYY-MM-DD
  end?: string;
  region: "world" | "japan";
  url: string;
  venue: string;
}

const REGION_COLOR: Record<CalEvent["region"], string> = {
  world: "var(--blue-500)",
  japan: "var(--red-500)",
};

const ym = (d: Date) => d.getFullYear() * 12 + d.getMonth();
/* 閲覧者のタイムゾーンに依存しないよう、日付文字列から直接 年*12+月 を計算する */
const ymStr = (s: string) => Number(s.slice(0, 4)) * 12 + (Number(s.slice(5, 7)) - 1);

export function CalendarView({ events }: { events: CalEvent[] }) {
  const months = events.map((e) => ymStr(e.start));
  const minYm = Math.min(...months);
  const maxYm = Math.max(...months);
  const [shown, setShown] = React.useState(() => {
    const now = new Date();
    return Math.min(Math.max(ym(now), minYm), maxYm);
  });

  const year = Math.floor(shown / 12);
  const month = shown % 12; // 0-11
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = first.getDay(); // 日曜=0

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const dayKey = (d: number) => `${year}-${pad2(month + 1)}-${pad2(d)}`;

  const eventsOn = (d: number) => {
    const key = dayKey(d);
    return events.filter((e) => e.start <= key && key <= (e.end ?? e.start));
  };
  const monthEvents = events
    .filter((e) => ymStr(e.start) === shown || (e.end && ymStr(e.end) === shown))
    .sort((a, b) => (a.start < b.start ? -1 : 1));

  const todayKey = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const navBtn = (dir: -1 | 1, disabled: boolean) => (
    <button
      type="button"
      onClick={() => setShown((s) => s + dir)}
      disabled={disabled}
      aria-label={dir === -1 ? "前の月" : "次の月"}
      style={{
        width: 36,
        height: 36,
        borderRadius: "var(--radius-full)",
        border: "var(--bw-line) solid var(--ink-900)",
        background: disabled ? "var(--paper-100)" : "var(--yellow-400)",
        color: disabled ? "var(--text-disabled)" : "var(--ink-900)",
        cursor: disabled ? "default" : "pointer",
        boxShadow: disabled ? "none" : "var(--shadow-pop-sm)",
        fontSize: 15,
      }}
    >
      <i className={"ph-bold " + (dir === -1 ? "ph-caret-left" : "ph-caret-right")} />
    </button>
  );

  return (
    <div style={{ border: "var(--bw-bold) solid var(--ink-900)", borderRadius: "var(--radius-lg)", background: "var(--paper-0)", boxShadow: "var(--shadow-pop)", overflow: "hidden" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", background: "var(--ink-900)" }}>
        {navBtn(-1, shown <= minYm)}
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(18px,2.6vw,23px)", color: "var(--paper-50)" }}>
          {year}年{month + 1}月
        </div>
        {navBtn(1, shown >= maxYm)}
      </div>

      {/* 曜日ヘッダー */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "var(--bw-line) solid var(--ink-900)" }}>
        {["日", "月", "火", "水", "木", "金", "土"].map((w, i) => (
          <div key={w} style={{ textAlign: "center", padding: "8px 0", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 12.5, color: i === 0 ? "var(--red-600)" : i === 6 ? "var(--blue-600)" : "var(--text-muted)" }}>
            {w}
          </div>
        ))}
      </div>

      {/* 日グリッド */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {cells.map((d, i) => {
          const evs = d ? eventsOn(d) : [];
          const isToday = d !== null && dayKey(d) === todayKey;
          return (
            <div
              key={i}
              style={{
                minHeight: 52,
                padding: "6px 4px",
                borderTop: i >= 7 ? "1px solid rgba(20,17,15,0.08)" : "none",
                background: isToday ? "var(--yellow-200)" : evs.length > 0 ? "var(--paper-50)" : "transparent",
                textAlign: "center",
              }}
            >
              {d !== null && (
                <>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: isToday || evs.length > 0 ? 700 : 400, color: evs.length > 0 ? "var(--ink-900)" : "var(--text-muted)" }}>
                    {d}
                  </div>
                  <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 3, flexWrap: "wrap" }}>
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} title={e.title} style={{ width: 7, height: 7, borderRadius: "50%", background: REGION_COLOR[e.region], display: "inline-block" }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* その月のイベント */}
      <div style={{ borderTop: "var(--bw-line) solid var(--ink-900)", padding: "14px 16px 16px", background: "var(--paper-50)" }}>
        {monthEvents.length === 0 ? (
          <p style={{ margin: 0, fontFamily: "var(--font-hand)", fontSize: 14, color: "var(--text-muted)", textAlign: "center" }}>
            この月に掲載イベントはありません
          </p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {monthEvents.map((e) => (
              <a
                key={e.id}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", borderRadius: "var(--radius-md)", padding: "9px 12px", boxShadow: "var(--shadow-pop-sm)" }}
              >
                <span style={{ flex: "none", width: 9, height: 9, borderRadius: "50%", background: REGION_COLOR[e.region] }} />
                <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5 }}>
                  {Number(e.start.slice(8, 10))}日{e.end && e.end !== e.start ? `〜${Number(e.end.slice(8, 10))}日` : ""}
                </span>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.title}
                </span>
                <i className="ph-bold ph-arrow-up-right" style={{ marginLeft: "auto", flex: "none", color: "var(--text-muted)", fontSize: 13 }} />
              </a>
            ))}
          </div>
        )}
        <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "var(--text-muted)", textAlign: "center" }}>
          <span style={{ color: "var(--blue-500)" }}>●</span> 世界のイベント
          <span style={{ color: "var(--red-500)", marginLeft: 12 }}>●</span> 日本のイベント
        </p>
      </div>
    </div>
  );
}
