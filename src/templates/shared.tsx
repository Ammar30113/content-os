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
        background:
          "radial-gradient(circle at 50% 42%, #626262 0%, #404145 34%, #151619 63%, #050607 100%)",
        color: brand.white,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 86,
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
            "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.18) 34%, rgba(0,0,0,0.18) 66%, rgba(0,0,0,0.88) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 78,
          left: 86,
          color: accent,
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 5,
          textTransform: "uppercase",
          opacity: 0.9,
        }}
      >
        {chip}
      </div>
      {children}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          color: "rgba(247, 247, 242, 0.72)",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 2.8,
        }}
      >
        @wordofaii
      </div>
    </div>
  );
}

export const headlineStyle = {
  fontSize: 58,
  lineHeight: 1.02,
  letterSpacing: 4.5,
  fontWeight: 900,
  color: brand.white,
  textAlign: "center",
  textTransform: "uppercase",
} satisfies React.CSSProperties;

export const subheadStyle = {
  fontSize: 34,
  lineHeight: 1.32,
  color: "#F1F1EE",
  fontWeight: 500,
  textAlign: "center",
} satisfies React.CSSProperties;

export const metaStyle = {
  color: "rgba(247, 247, 242, 0.66)",
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: 2.4,
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

export function displayHeadline(value: unknown, fallback = "") {
  const text = safeText(value, fallback);

  return text.length > 86 ? `${text.slice(0, 83).trim()}...` : text;
}

export function safeArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
