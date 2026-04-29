/* eslint-disable @next/next/no-img-element */
import type React from "react";

export const CANVAS_SIZE = 1080;
export const brand = {
  background: "#0A0A0B",
  lime: "#B8C28A",
  coral: "#C98270",
  white: "#F7F7F2",
  muted: "#A1A1AA",
  panel: "#151518",
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
            "radial-gradient(circle at 54% 34%, rgba(54,54,58,0.68) 0%, rgba(18,19,21,0.96) 45%, rgba(5,5,6,1) 86%)",
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
            "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.12) 48%, rgba(0,0,0,0.92) 100%)",
        }}
      />
      <AccentRail accent={accent} />
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 72,
          height: 42,
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.28)",
          border: `1px solid ${accent}`,
          color: accent,
          fontSize: 17,
          fontWeight: 900,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          zIndex: 5,
        }}
      >
        {chip}
      </div>
      <div
        style={{
          position: "absolute",
          top: 72,
          right: 72,
          color: "rgba(247,247,242,0.52)",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
          zIndex: 5,
        }}
      >
        WORD OF AI
      </div>
      {children}
    </div>
  );
}

export function AccentRail({ accent = brand.lime }: { accent?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 128,
        bottom: 84,
        width: 2,
        backgroundColor: accent,
        opacity: 0.52,
      }}
    />
  );
}

export function Watermark({
  align = "right",
  color = "rgba(247,247,242,0.58)",
}: {
  align?: "left" | "center" | "right";
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 46,
        left: align === "left" ? 96 : 0,
        right: align === "right" ? 72 : 0,
        display: "flex",
        justifyContent:
          align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        color,
        fontSize: 23,
        fontWeight: 800,
        letterSpacing: 2.3,
        zIndex: 6,
      }}
    >
      @wordofaii
    </div>
  );
}

export function TextCard({
  eyebrow,
  headline,
  subhead,
  accent = brand.lime,
  align = "left",
  top = 186,
}: {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  accent?: string;
  align?: "left" | "center";
  top?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 112,
        top,
        width: 856,
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 28,
        zIndex: 3,
      }}
    >
      {eyebrow ? (
        <div
          style={{
            color: accent,
            fontSize: 19,
            fontWeight: 900,
            letterSpacing: 3.2,
            textTransform: "uppercase",
            textAlign: align,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          color: brand.white,
          fontSize: headline.length > 68 ? 58 : 72,
          lineHeight: 0.96,
          fontWeight: 900,
          letterSpacing: 0,
          textTransform: "uppercase",
          textAlign: align,
          maxWidth: 856,
        }}
      >
        {headline}
      </div>
      {subhead ? (
        <div
          style={{
            color: "rgba(247,247,242,0.78)",
            fontSize: 30,
            lineHeight: 1.22,
            fontWeight: 600,
            textAlign: align,
            maxWidth: 760,
          }}
        >
          {subhead}
        </div>
      ) : null}
    </div>
  );
}

export function BottomBar({
  label,
  accent = brand.lime,
}: {
  label?: string;
  accent?: string;
}) {
  if (!label) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 112,
        bottom: 112,
        color: accent,
        fontSize: 18,
        fontWeight: 900,
        letterSpacing: 3.2,
        textTransform: "uppercase",
        zIndex: 4,
      }}
    >
      {label}
    </div>
  );
}

export function ImagePanel({
  src,
  height = 570,
}: {
  src: string;
  height?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 112,
        top: 148,
        width: 856,
        height,
        border: "2px solid rgba(247,247,242,0.16)",
        backgroundColor: "#060607",
        display: "flex",
        overflow: "hidden",
        zIndex: 2,
      }}
    >
      <img
        src={src}
        alt=""
        width={856}
        height={height}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 180,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.82) 100%)",
        }}
      />
    </div>
  );
}

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

export function displayHeadline(value: unknown, fallback = "", limit = 74) {
  const text = safeText(value, fallback)
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();

  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

export function compactText(value: unknown, fallback = "", limit = 116) {
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
