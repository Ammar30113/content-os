import type { TemplateFields } from "@/lib/content/types";
import type React from "react";
import {
  CANVAS_SIZE,
  compactText,
  displayHeadline,
  safeArray,
  safeText,
} from "@/templates/shared";

const rallio = {
  ink: "#19140F",
  deepInk: "#0F0C09",
  paper: "#F3E5C8",
  cream: "#FFF4DD",
  amber: "#C98236",
  moss: "#76845A",
  muted: "#756B5E",
  line: "rgba(25,20,15,0.22)",
};

export function RallioTemplate({ fields }: { fields: TemplateFields }) {
  const template = fields.rallio_template_type || fields.content_type;

  if (template === "rallio_spot_carousel" || template === "spot_carousel") {
    return <RallioSpotCarouselTemplate fields={fields} />;
  }

  if (template === "rallio_receipt" || template === "receipt_single") {
    return <RallioReceiptTemplate fields={fields} />;
  }

  if (template === "rallio_regular_quote" || template === "regular_quote") {
    return <RallioRegularQuoteTemplate fields={fields} />;
  }

  if (template === "rallio_owner_claim" || template === "owner_claim_carousel") {
    return <RallioOwnerClaimTemplate fields={fields} />;
  }

  return <RallioManifestoTemplate fields={fields} />;
}

function RallioFrame({
  chip,
  fields,
  children,
  footer,
}: {
  chip: string;
  fields: TemplateFields;
  children: React.ReactNode;
  footer?: string;
}) {
  return (
    <div
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundColor: rallio.paper,
        color: rallio.ink,
        display: "flex",
        fontFamily: "Manrope, Inter, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 42% 20%, rgba(255,244,221,0.95) 0%, rgba(243,229,200,0.94) 36%, rgba(214,190,154,0.9) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(25,20,15,0.06) 0%, rgba(25,20,15,0) 48%, rgba(118,132,90,0.12) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 70,
          right: 72,
          bottom: 70,
          border: `1px solid ${rallio.line}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 86,
          padding: "12px 18px",
          border: `1px solid ${rallio.ink}`,
          backgroundColor: rallio.paper,
          color: rallio.ink,
          fontSize: 17,
          fontWeight: 900,
          letterSpacing: 2.2,
          textTransform: "uppercase",
          zIndex: 4,
        }}
      >
        {chip}
      </div>
      <div
        style={{
          position: "absolute",
          top: 68,
          right: 92,
          color: rallio.muted,
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          zIndex: 4,
        }}
      >
        RALLIO / TORONTO + RAJKOT
      </div>
      {children}
      <div
        style={{
          position: "absolute",
          left: 92,
          bottom: 52,
          color: rallio.moss,
          fontSize: 17,
          fontWeight: 900,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          zIndex: 4,
        }}
      >
        {footer || "taste first"}
      </div>
      <div
        style={{
          position: "absolute",
          right: 92,
          bottom: 50,
          color: rallio.muted,
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: 1.4,
          zIndex: 4,
        }}
      >
        {safeText(fields.brand_handle, "@rallio")}
      </div>
    </div>
  );
}

function RallioManifestoTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(
    fields.headline,
    "Local discovery needs better signal",
    76,
  );
  const subhead = compactText(
    fields.subhead,
    "A launch note for the people who know where taste actually lives.",
    120,
  );

  return (
    <RallioFrame chip="Launch note" fields={fields} footer="founding supporter">
      <HeroBlock
        kicker="not another promo app"
        headline={headline}
        subhead={subhead}
      />
      <SideReceipt
        lines={[
          "regulars over ratings",
          "owner context over generic cards",
          "taste over promo chasing",
        ]}
      />
    </RallioFrame>
  );
}

function RallioSpotCarouselTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(
    fields.headline,
    "Three local stops worth remembering",
    70,
  );
  const subhead = compactText(
    fields.subhead,
    "A tight food and drink map for people who like signal over scroll.",
    110,
  );
  const spots = safeArray(fields.info_rows).length
    ? safeArray(fields.info_rows)
    : [
        safeText(fields.business_name, "Coffee before the line forms"),
        "A dinner bar regulars protect",
        "The after-hours walk nobody posts enough",
      ];

  return (
    <RallioFrame chip="Toronto + Rajkot" fields={fields} footer="save the route">
      <HeroBlock kicker="food / drink / regulars" headline={headline} subhead={subhead} />
      <div
        style={{
          position: "absolute",
          left: 126,
          right: 126,
          bottom: 174,
          display: "flex",
          gap: 16,
          zIndex: 4,
        }}
      >
        {spots.slice(0, 3).map((spot, index) => (
          <SpotCard key={`${spot}-${index}`} index={index + 1} label={spot} />
        ))}
      </div>
    </RallioFrame>
  );
}

function RallioReceiptTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(fields.headline, "A receipt for better taste", 68);
  const lines = safeArray(fields.receipt_lines).length
    ? safeArray(fields.receipt_lines)
    : [
        "walk the block before ranking it",
        "ask what regulars order twice",
        "save the places with a real point of view",
      ];

  return (
    <RallioFrame chip="Receipt" fields={fields} footer={safeText(fields.door_label, "Founding supporter")}>
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 160,
          bottom: 134,
          backgroundColor: rallio.cream,
          border: `1px solid ${rallio.line}`,
          boxShadow: "0 18px 60px rgba(25,20,15,0.16)",
          display: "flex",
          flexDirection: "column",
          padding: "58px 54px",
          zIndex: 3,
        }}
      >
        <div
          style={{
            color: rallio.moss,
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 2.6,
            textTransform: "uppercase",
          }}
        >
          Local field receipt
        </div>
        <div
          style={{
            marginTop: 34,
            color: rallio.ink,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: headline.length > 48 ? 54 : 64,
            lineHeight: 0.96,
            fontWeight: 900,
            letterSpacing: -0.8,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 44,
            borderTop: `1px dashed ${rallio.line}`,
            borderBottom: `1px dashed ${rallio.line}`,
            padding: "22px 0",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {lines.slice(0, 4).map((line, index) => (
            <div
              key={`${line}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 24,
                color: rallio.deepInk,
                fontSize: 26,
                lineHeight: 1.12,
                fontWeight: 800,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              <span>{compactText(line, "", 48)}</span>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            color: rallio.muted,
            fontSize: 19,
            fontWeight: 900,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          <span>{safeText(fields.cta_door, "founding_supporter").replaceAll("_", " ")}</span>
          <span>{safeText(fields.subtotal, "Taste-first")}</span>
        </div>
      </div>
    </RallioFrame>
  );
}

function RallioRegularQuoteTemplate({ fields }: { fields: TemplateFields }) {
  const quote = displayHeadline(
    fields.regular_quote || fields.quote || fields.headline,
    "You can tell when a place has regulars.",
    110,
  );
  const attribution = compactText(
    fields.attribution,
    "Toronto + Rajkot regular",
    54,
  );

  return (
    <RallioFrame chip="Regulars said" fields={fields} footer="save the signal">
      <div
        style={{
          position: "absolute",
          left: 130,
          top: 180,
          width: 820,
          display: "flex",
          flexDirection: "column",
          gap: 34,
          zIndex: 4,
        }}
      >
        <div
          style={{
            color: rallio.amber,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 138,
            lineHeight: 0.7,
            fontWeight: 900,
          }}
        >
          &ldquo;
        </div>
        <div
          style={{
            color: rallio.ink,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: quote.length > 78 ? 58 : 70,
            lineHeight: 1.02,
            fontWeight: 900,
            letterSpacing: -0.6,
          }}
        >
          {quote}
        </div>
        <div
          style={{
            width: 300,
            height: 2,
            backgroundColor: rallio.amber,
          }}
        />
        <div
          style={{
            color: rallio.muted,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {attribution}
        </div>
      </div>
    </RallioFrame>
  );
}

function RallioOwnerClaimTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(
    fields.headline,
    "Owners should control their first impression",
    74,
  );
  const steps = safeArray(fields.owner_steps).length
    ? safeArray(fields.owner_steps)
    : [
        "claim the place profile",
        "add the story regulars already know",
        "show the one thing people should order first",
      ];

  return (
    <RallioFrame chip="Owner door" fields={fields} footer="claim your business">
      <HeroBlock
        kicker="for ossington operators"
        headline={headline}
        subhead={compactText(fields.subhead, "The profile should feel like the room, not a listing.", 120)}
      />
      <div
        style={{
          position: "absolute",
          left: 126,
          right: 126,
          bottom: 172,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          zIndex: 4,
        }}
      >
        {steps.slice(0, 3).map((step, index) => (
          <div
            key={`${step}-${index}`}
            style={{
              minHeight: 68,
              border: `1px solid ${rallio.line}`,
              backgroundColor: "rgba(255,244,221,0.5)",
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "16px 22px",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                backgroundColor: index === 1 ? rallio.amber : rallio.moss,
                color: rallio.cream,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 19,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>
            <div
              style={{
                color: rallio.ink,
                fontSize: 26,
                lineHeight: 1.1,
                fontWeight: 900,
              }}
            >
              {compactText(step, "", 70)}
            </div>
          </div>
        ))}
      </div>
    </RallioFrame>
  );
}

function HeroBlock({
  kicker,
  headline,
  subhead,
}: {
  kicker: string;
  headline: string;
  subhead: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 126,
        top: 172,
        width: 828,
        display: "flex",
        flexDirection: "column",
        gap: 28,
        zIndex: 4,
      }}
    >
      <div
        style={{
          color: rallio.moss,
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 3.2,
          textTransform: "uppercase",
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          color: rallio.ink,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: headline.length > 54 ? 64 : 76,
          lineHeight: 0.94,
          fontWeight: 900,
          letterSpacing: -1,
          maxWidth: 760,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          color: rallio.muted,
          fontSize: 30,
          lineHeight: 1.18,
          fontWeight: 800,
          maxWidth: 710,
        }}
      >
        {subhead}
      </div>
    </div>
  );
}

function SideReceipt({ lines }: { lines: string[] }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 126,
        right: 126,
        bottom: 172,
        borderTop: `1px dashed ${rallio.line}`,
        borderBottom: `1px dashed ${rallio.line}`,
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        zIndex: 4,
      }}
    >
      {lines.slice(0, 3).map((line, index) => (
        <div
          key={`${line}-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: rallio.ink,
            fontSize: 25,
            fontWeight: 900,
          }}
        >
          <span>{line}</span>
          <span style={{ color: index === 1 ? rallio.amber : rallio.moss }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}

function SpotCard({ index, label }: { index: number; label: string }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 194,
        border: `1px solid ${rallio.line}`,
        backgroundColor: index === 2 ? "rgba(201,130,54,0.16)" : "rgba(255,244,221,0.42)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 20,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          backgroundColor: index === 2 ? rallio.amber : rallio.moss,
          color: rallio.cream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 900,
        }}
      >
        {index}
      </div>
      <div
        style={{
          color: rallio.ink,
          fontSize: 25,
          lineHeight: 1.05,
          fontWeight: 900,
          textTransform: "uppercase",
        }}
      >
        {compactText(label, "", 44)}
      </div>
    </div>
  );
}
