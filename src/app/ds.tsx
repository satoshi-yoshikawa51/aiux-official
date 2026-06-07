"use client";
/* ============================================================
   AI＆UX design-system primitives (manga ink + paper).
   Ported from the design bundle to typed React components.
   ============================================================ */
import React from "react";

type CSS = React.CSSProperties;

/* ---------------- Button ---------------- */
type ButtonVariant = "primary" | "secondary" | "ink" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  variant?: ButtonVariant;
  size?: Size;
  block?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: CSS;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  type = "button",
  style = {},
  ...rest
}: ButtonProps) {
  const sizes: Record<Size, { fontSize: number; padding: string; gap: number; radius: string }> = {
    sm: { fontSize: 14, padding: "8px 14px", gap: 6, radius: "var(--radius-sm)" },
    md: { fontSize: 16, padding: "11px 20px", gap: 8, radius: "var(--radius-sm)" },
    lg: { fontSize: 18, padding: "15px 28px", gap: 10, radius: "var(--radius-md)" },
  };
  const s = sizes[size] || sizes.md;
  const variants: Record<ButtonVariant, CSS> = {
    primary: { background: "var(--red-500)", color: "var(--text-on-accent)", border: "var(--bw-bold) solid var(--ink-900)", boxShadow: "var(--shadow-pop-sm)" },
    secondary: { background: "var(--paper-0)", color: "var(--ink-900)", border: "var(--bw-bold) solid var(--ink-900)", boxShadow: "var(--shadow-pop-sm)" },
    ink: { background: "var(--ink-900)", color: "var(--paper-50)", border: "var(--bw-bold) solid var(--ink-900)", boxShadow: "var(--shadow-pop-sm)" },
    ghost: { background: "transparent", color: "var(--ink-900)", border: "var(--bw-bold) solid transparent", boxShadow: "none" },
  };
  const v = variants[variant] || variants.primary;
  const base: CSS = {
    display: block ? "flex" : "inline-flex",
    width: block ? "100%" : "auto",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    fontSize: s.fontSize,
    lineHeight: 1,
    letterSpacing: "var(--ls-heading)",
    padding: s.padding,
    borderRadius: s.radius,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition:
      "transform var(--dur-fast) var(--ease-pop), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast)",
    userSelect: "none",
    ...v,
    ...style,
  };
  const reset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "";
    e.currentTarget.style.boxShadow = (v.boxShadow as string) ?? "none";
  };
  return (
    <button
      type={type}
      disabled={disabled}
      style={base}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translate(2px,2px)";
        e.currentTarget.style.boxShadow = variant === "ghost" ? "none" : "1px 1px 0 var(--ink-900)";
      }}
      onMouseUp={reset}
      onMouseEnter={(e) => {
        if (disabled || variant === "ghost") return;
        if (variant === "primary") e.currentTarget.style.background = "var(--red-600)";
        if (variant === "secondary") e.currentTarget.style.background = "var(--paper-100)";
        if (variant === "ink") e.currentTarget.style.background = "var(--ink-800)";
      }}
      onMouseLeave={(e) => {
        reset(e);
        e.currentTarget.style.background = (v.background as string) ?? "";
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

/* ---------------- Badge ---------------- */
type BadgeTone = "ink" | "red" | "soft" | "blue" | "yellow" | "green" | "paper";
interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "style"> {
  tone?: BadgeTone;
  outline?: boolean;
  style?: CSS;
}
export function Badge({ children, tone = "ink", outline = true, style = {}, ...rest }: BadgeProps) {
  const tones: Record<BadgeTone, { bg: string; fg: string; bd: string }> = {
    ink: { bg: "var(--ink-900)", fg: "var(--paper-50)", bd: "var(--ink-900)" },
    red: { bg: "var(--red-500)", fg: "#fff", bd: "var(--ink-900)" },
    soft: { bg: "var(--red-50)", fg: "var(--red-700)", bd: "var(--red-500)" },
    blue: { bg: "var(--blue-50)", fg: "var(--blue-600)", bd: "var(--blue-500)" },
    yellow: { bg: "var(--yellow-400)", fg: "var(--ink-900)", bd: "var(--ink-900)" },
    green: { bg: "var(--green-50)", fg: "var(--green-500)", bd: "var(--green-500)" },
    paper: { bg: "var(--paper-0)", fg: "var(--ink-900)", bd: "var(--ink-900)" },
  };
  const t = tones[tone] || tones.ink;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 12,
        lineHeight: 1,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        padding: "5px 9px 6px",
        borderRadius: "var(--radius-full)",
        background: t.bg,
        color: t.fg,
        border: outline ? `2px solid ${t.bd}` : "none",
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ---------------- Tag ---------------- */
interface TagProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "style"> {
  active?: boolean;
  style?: CSS;
}
export function Tag({ children, active = false, onClick, style = {}, ...rest }: TagProps) {
  const clickable = typeof onClick === "function";
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        fontSize: 13,
        lineHeight: 1,
        whiteSpace: "nowrap",
        padding: "7px 12px",
        borderRadius: "var(--radius-full)",
        background: active ? "var(--ink-900)" : "var(--paper-0)",
        color: active ? "var(--paper-50)" : "var(--text-body)",
        border: "1px solid var(--ink-900)",
        cursor: clickable ? "pointer" : "default",
        transition: "background var(--dur-fast), color var(--dur-fast)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (clickable && !active) e.currentTarget.style.background = "var(--paper-100)";
      }}
      onMouseLeave={(e) => {
        if (clickable && !active) e.currentTarget.style.background = "var(--paper-0)";
      }}
      {...rest}
    >
      <span style={{ color: active ? "var(--red-100)" : "var(--text-muted)", marginRight: 2 }}>#</span>
      {children}
    </span>
  );
}

/* ---------------- Card ---------------- */
type CardVariant = "pop" | "soft" | "flat";
interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "style"> {
  variant?: CardVariant;
  hover?: boolean;
  padding?: number | string;
  style?: CSS;
}
export function Card({ children, variant = "pop", hover = false, padding = 20, style = {}, ...rest }: CardProps) {
  const variants: Record<CardVariant, CSS> = {
    pop: { background: "var(--paper-0)", border: "var(--bw-bold) solid var(--ink-900)", boxShadow: "var(--shadow-pop)" },
    soft: { background: "var(--paper-0)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-soft)" },
    flat: { background: "var(--paper-0)", border: "var(--bw-line) solid var(--ink-900)", boxShadow: "none" },
  };
  const v = variants[variant] || variants.pop;
  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        padding,
        transition: "transform var(--dur-base) var(--ease-pop), box-shadow var(--dur-base) var(--ease-out)",
        ...v,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!hover) return;
        e.currentTarget.style.transform = "translate(-2px,-2px)";
        e.currentTarget.style.boxShadow = variant === "pop" ? "var(--shadow-pop-lg)" : "var(--shadow-soft-lg)";
      }}
      onMouseLeave={(e) => {
        if (!hover) return;
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = (v.boxShadow as string) ?? "none";
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------- MangaPanel ---------------- */
type PanelTone = "none" | "dots" | "lines";
type PanelWeight = "line" | "bold" | "heavy";
interface MangaPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "style"> {
  tone?: PanelTone;
  number?: string;
  caption?: string;
  tilt?: number;
  weight?: PanelWeight;
  style?: CSS;
}
export function MangaPanel({
  children,
  tone = "none",
  number,
  caption,
  tilt = 0,
  weight = "bold",
  style = {},
  ...rest
}: MangaPanelProps) {
  const toneBg: CSS =
    tone === "dots"
      ? { backgroundImage: "var(--tone-dots)", backgroundSize: "var(--tone-dots-size)" }
      : tone === "lines"
      ? { backgroundImage: "var(--tone-lines)" }
      : {};
  const borderW = weight === "heavy" ? "var(--bw-heavy)" : weight === "line" ? "var(--bw-line)" : "var(--bw-bold)";
  return (
    <div
      style={{
        position: "relative",
        background: "var(--paper-0)",
        border: `${borderW} solid var(--ink-900)`,
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-pop)",
        overflow: "hidden",
        transform: tilt ? `rotate(${tilt}deg)` : "none",
        ...toneBg,
        ...style,
      }}
      {...rest}
    >
      {number != null && (
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 2,
            background: "var(--ink-900)",
            color: "var(--paper-50)",
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: 18,
            lineHeight: 1,
            padding: "7px 11px 9px",
            borderBottomRightRadius: "var(--radius-sm)",
          }}
        >
          {number}
        </span>
      )}
      {children}
      {caption && (
        <span
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            background: "var(--paper-0)",
            border: "var(--bw-line) solid var(--ink-900)",
            borderRadius: 4,
            fontFamily: "var(--font-hand)",
            fontSize: 13,
            padding: "3px 8px",
            maxWidth: "70%",
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
}

/* ---------------- SpeechBubble ---------------- */
type BubbleVariant = "say" | "shout" | "think";
interface SpeechBubbleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "style"> {
  variant?: BubbleVariant;
  tail?: string;
  fill?: string;
  font?: "hand" | "heading" | "body";
  style?: CSS;
}
export function SpeechBubble({
  children,
  variant = "say",
  tail = "bottom-left",
  fill = "var(--paper-0)",
  font = "hand",
  style = {},
  ...rest
}: SpeechBubbleProps) {
  const fontFamily =
    font === "hand" ? "var(--font-hand)" : font === "heading" ? "var(--font-heading)" : "var(--font-body)";
  const isShout = variant === "shout";
  const isThink = variant === "think";
  const [side, end] = tail.split("-");
  const tailPos: CSS = {};
  if (side === "bottom") {
    tailPos.bottom = -13;
    (tailPos as Record<string, number>)[end || "left"] = 28;
  }
  if (side === "top") {
    tailPos.top = -13;
    (tailPos as Record<string, number>)[end || "left"] = 28;
  }
  if (side === "left") {
    tailPos.left = -13;
    tailPos.top = 26;
  }
  if (side === "right") {
    tailPos.right = -13;
    tailPos.top = 26;
  }
  const radius = isShout ? "var(--radius-md)" : "var(--radius-bubble)";
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        background: fill,
        color: "var(--ink-900)",
        border: "var(--bw-line) solid var(--ink-900)",
        borderRadius: radius,
        padding: "16px 20px",
        fontFamily,
        fontSize: 17,
        lineHeight: 1.55,
        boxShadow: "var(--shadow-pop-sm)",
        clipPath: isShout
          ? "polygon(0% 8%, 4% 0%, 12% 7%, 22% 0%, 32% 7%, 44% 0%, 56% 7%, 68% 0%, 80% 7%, 92% 0%, 98% 8%, 100% 20%, 96% 32%, 100% 46%, 96% 60%, 100% 74%, 96% 88%, 90% 100%, 78% 94%, 66% 100%, 54% 94%, 42% 100%, 30% 94%, 18% 100%, 8% 93%, 2% 82%, 6% 68%, 0% 54%, 4% 40%, 0% 26%)"
          : "none",
        ...style,
      }}
      {...rest}
    >
      {children}
      {!isShout && (
        <>
          <span
            style={{
              position: "absolute",
              width: 20,
              height: 20,
              background: fill,
              border: "var(--bw-line) solid var(--ink-900)",
              transform: "rotate(45deg)",
              ...tailPos,
              clipPath:
                side === "bottom"
                  ? "polygon(0 0, 100% 100%, 0 100%)"
                  : side === "top"
                  ? "polygon(100% 0, 100% 100%, 0 0)"
                  : side === "left"
                  ? "polygon(0 0, 0 100%, 100% 100%)"
                  : "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />
          {isThink && (
            <span
              style={{
                position: "absolute",
                bottom: -22,
                left: 16,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: fill,
                border: "var(--bw-line) solid var(--ink-900)",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- Tabs ---------------- */
export interface TabItem {
  value: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
}
interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  style?: CSS;
}
export function Tabs({ items = [], value, defaultValue, onChange, style = {} }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value);
  const active = value !== undefined ? value : internal;
  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  return (
    <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: "var(--bw-bold) solid var(--ink-900)", ...style }}>
      {items.map((it) => {
        const on = it.value === active;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={on}
            onClick={() => select(it.value)}
            style={{
              position: "relative",
              border: "none",
              background: on ? "var(--ink-900)" : "transparent",
              color: on ? "var(--paper-50)" : "var(--text-body)",
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 15,
              padding: "10px 16px",
              cursor: "pointer",
              borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
              transition: "background var(--dur-fast), color var(--dur-fast)",
              marginBottom: "-3px",
            }}
            onMouseEnter={(e) => {
              if (!on) e.currentTarget.style.background = "var(--paper-100)";
            }}
            onMouseLeave={(e) => {
              if (!on) e.currentTarget.style.background = "transparent";
            }}
          >
            {it.label}
            {it.badge != null && (
              <span style={{ marginLeft: 6, fontSize: 12, color: on ? "var(--red-100)" : "var(--text-muted)" }}>
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Input ---------------- */
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: CSS;
  wrapStyle?: CSS;
}
export function Input({ label, hint, error, leading, trailing, id, style = {}, wrapStyle = {}, ...rest }: InputProps) {
  const inputId = id || (label ? "in-" + label.replace(/\s+/g, "-") : undefined);
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? "var(--red-500)" : "var(--ink-900)";
  return (
    <div style={{ display: "grid", gap: 6, ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--paper-0)",
          border: `var(--bw-line) solid ${borderColor}`,
          borderRadius: "var(--radius-sm)",
          padding: "0 12px",
          boxShadow: focus ? "var(--ring)" : "none",
          transition: "box-shadow var(--dur-fast)",
        }}
      >
        {leading && <span style={{ color: "var(--text-muted)", display: "inline-flex" }}>{leading}</span>}
        <input
          id={inputId}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus && rest.onFocus(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur && rest.onBlur(e);
          }}
          {...rest}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: 16,
            color: "var(--text-strong)",
            padding: "11px 0",
            minWidth: 0,
            ...style,
          }}
        />
        {trailing && <span style={{ color: "var(--text-muted)", display: "inline-flex" }}>{trailing}</span>}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 12.5, color: error ? "var(--red-600)" : "var(--text-muted)" }}>{error || hint}</span>
      )}
    </div>
  );
}
