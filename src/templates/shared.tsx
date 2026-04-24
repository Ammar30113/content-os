import type React from "react";

export const CANVAS_SIZE = 1080;
export const brand = {
  background: "#0A0A0B",
  lime: "#D4FF00",
  coral: "#FF6B4A",
  white: "#F7F7F2",
  muted: "#A1A1AA",
  panel: "#17171A",
};

export function TemplateFrame({
  chip,
  children,
}: {
  chip: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        background: brand.background,
        color: brand.white,
        display: "flex",
        flexDirection: "column",
        padding: 80,
        fontFamily: "Inter, Arial, sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 72,
          background: brand.lime,
          color: brand.background,
          padding: "14px 22px",
          borderRadius: 999,
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: 1.5,
        }}
      >
        {chip}
      </div>
      {children}
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: 70,
          color: "rgba(247, 247, 242, 0.6)",
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        @wordofaii
      </div>
    </div>
  );
}

export const headlineStyle = {
  fontSize: 92,
  lineHeight: 0.9,
  letterSpacing: -3,
  fontWeight: 950,
  color: brand.white,
} satisfies React.CSSProperties;

export const subheadStyle = {
  fontSize: 34,
  lineHeight: 1.18,
  color: brand.muted,
  fontWeight: 600,
} satisfies React.CSSProperties;

export function safeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function safeArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
