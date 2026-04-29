/* eslint-disable @next/next/no-img-element */
import type React from "react";

export const CANVAS_SIZE = 1080;
export const brand = {
  background: "#0A0A0B",
  gridEdge: "#050607",
  gridMid: "#575757",
  gridSoft: "#252629",
  lime: "#D4FF00",
  coral: "#FF6B4A",
  white: "#F7F7F2",
  muted: "#A1A1AA",
  panel: "#17171A",
};

export function TemplateFrame({
  chip,
  accent = brand.lime,
  children,
}: {
  chip: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundColor: brand.background,
        color: brand.white,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 50% 28%, rgba(97,97,97,0.78) 0%, rgba(40,41,44,0.82) 34%, rgba(10,10,11,1) 76%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 28%, rgba(0,0,0,0.1) 72%, rgba(0,0,0,0.9) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 64,
          height: 44,
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          backgroundColor: accent,
          color: brand.background,
          fontSize: 19,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: "uppercase",
          zIndex: 5,
        }}
      >
        {chip}
      </div>
      {children}
    </div>
  );
}

export function Watermark({
  align = "right",
  color = "rgba(247, 247, 242, 0.66)",
}: {
  align?: "left" | "center" | "right";
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 38,
        left: align === "left" ? 64 : 0,
        right: align === "right" ? 64 : 0,
        display: "flex",
        justifyContent:
          align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        color,
        fontSize: 23,
        fontWeight: 800,
        letterSpacing: 2.4,
        zIndex: 6,
      }}
    >
      @wordofaii
    </div>
  );
}

export function BottomHeadlineBand({
  headline,
  subhead,
  label,
  accent = brand.lime,
  minHeight = 292,
}: {
  headline: string;
  subhead?: string;
  label?: string;
  accent?: string;
  minHeight?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: minHeight,
        backgroundColor: "rgba(0, 0, 0, 0.93)",
        borderTop: "2px solid rgba(247,247,242,0.84)",
        padding: "36px 60px 68px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        zIndex: 4,
      }}
    >
      {label ? (
        <div
          style={{
            color: accent,
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 2.8,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      ) : null}
      <div
        style={{
          color: brand.white,
          fontSize: headline.length > 68 ? 45 : 55,
          lineHeight: 0.96,
          fontWeight: 900,
          letterSpacing: 0,
          textAlign: "center",
          textTransform: "uppercase",
          maxWidth: 960,
        }}
      >
        {headline}
      </div>
      {subhead ? (
        <div
          style={{
            color: "rgba(247,247,242,0.78)",
            fontSize: 23,
            lineHeight: 1.18,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 840,
          }}
        >
          {subhead}
        </div>
      ) : null}
    </div>
  );
}

export function HeroVisual({
  src,
  subject,
  sourceName,
  logo,
  accent = brand.lime,
  variant = "news",
  height = 680,
}: {
  src?: string;
  subject?: string;
  sourceName?: string;
  logo?: string;
  accent?: string;
  variant?: "news" | "tool" | "tutorial" | "creator" | "founder";
  height?: number;
}) {
  const initials = getInitials(sourceName || subject || "AI");

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={1080}
          height={height}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <AbstractVisual
          subject={subject || sourceName || "AI SYSTEM UPDATE"}
          initials={initials}
          accent={accent}
          variant={variant}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.68) 100%)",
        }}
      />
      {logo ? (
        <img
          src={logo}
          alt=""
          width={104}
          height={104}
          style={{
            position: "absolute",
            right: 64,
            top: 52,
            width: 104,
            height: 104,
            objectFit: "contain",
            backgroundColor: "rgba(0,0,0,0.72)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        />
      ) : null}
    </div>
  );
}

function AbstractVisual({
  subject,
  initials,
  accent,
  variant,
}: {
  subject: string;
  initials: string;
  accent: string;
  variant: "news" | "tool" | "tutorial" | "creator" | "founder";
}) {
  const secondary = variant === "creator" ? brand.coral : brand.white;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background:
          variant === "tutorial"
            ? "linear-gradient(135deg, #101113 0%, #25272b 52%, #070708 100%)"
            : "radial-gradient(circle at 50% 42%, #646464 0%, #2c2d31 42%, #070708 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 140,
          width: 900,
          height: 320,
          border: "2px solid rgba(247,247,242,0.12)",
          transform: "rotate(-5deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 96,
          top: 116,
          width: 184,
          height: 184,
          backgroundColor: accent,
          color: brand.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: initials.length > 2 ? 54 : 74,
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: 0,
        }}
      >
        {initials}
      </div>
      <div
        style={{
          position: "absolute",
          left: 108,
          bottom: 116,
          width: 220,
          height: 220,
          borderRadius: 999,
          border: `18px solid ${accent}`,
          opacity: 0.82,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 138,
          bottom: 146,
          width: 160,
          height: 160,
          borderRadius: 999,
          border: `10px solid ${secondary}`,
          opacity: 0.56,
        }}
      />
      <div
        style={{
          color: "rgba(247,247,242,0.9)",
          fontSize: subject.length > 24 ? 40 : 52,
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: 0,
          textAlign: "center",
          textTransform: "uppercase",
          maxWidth: 650,
        }}
      >
        {subject}
      </div>
    </div>
  );
}

export function SourceBadge({
  sourceName,
  date,
  accent = brand.lime,
}: {
  sourceName?: string;
  date?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 118,
        display: "flex",
        gap: 12,
        alignItems: "center",
        zIndex: 6,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          backgroundColor: accent,
        }}
      />
      <div
        style={{
          color: "rgba(247,247,242,0.84)",
          fontSize: 21,
          fontWeight: 800,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {safeText(sourceName, "WORD OF AI")}
        {date ? ` / ${date}` : ""}
      </div>
    </div>
  );
}

export const headlineStyle = {
  fontSize: 58,
  lineHeight: 1.02,
  letterSpacing: 0,
  fontWeight: 900,
  color: brand.white,
  textAlign: "center",
  textTransform: "uppercase",
} satisfies React.CSSProperties;

export const subheadStyle = {
  fontSize: 34,
  lineHeight: 1.32,
  color: "#F1F1EE",
  fontWeight: 600,
  textAlign: "center",
} satisfies React.CSSProperties;

export const metaStyle = {
  color: "rgba(247, 247, 242, 0.66)",
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: 0,
  textTransform: "uppercase",
  textAlign: "center",
} satisfies React.CSSProperties;

export const centerStackStyle = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: 760,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 36,
} satisfies React.CSSProperties;

export function safeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function safeUrl(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.startsWith("https://") || trimmed.startsWith("http://")
    ? trimmed
    : undefined;
}

export function displayHeadline(value: unknown, fallback = "", limit = 92) {
  const text = safeText(value, fallback);

  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

export function safeArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function getInitials(value: string) {
  const words = value
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean);

  if (!words.length) {
    return "AI";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
