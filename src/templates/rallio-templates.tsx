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
  ink: "#0C0A08",
  deepInk: "#080604",
  cream: "#F5EBDC",
  amber: "#C8923A",
  wheat: "#EDD9B4",
  moss: "#5F8A6E",
  muted: "#71685F",
  line: "rgba(12,10,8,0.22)",
  inkLine: "rgba(245,235,220,0.18)",
};

type FrameTone = "cream" | "ink";

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
  tone = "cream",
}: {
  chip: string;
  fields: TemplateFields;
  children: React.ReactNode;
  footer?: string;
  tone?: FrameTone;
}) {
  const isInk = tone === "ink";
  const foreground = isInk ? rallio.cream : rallio.ink;
  const quiet = isInk ? "rgba(245,235,220,0.68)" : rallio.muted;
  const frameLine = isInk ? rallio.inkLine : rallio.line;
  const location = compactText(
    fields.launch_neighborhood,
    "taste map",
    34,
  ).toUpperCase();

  return (
    <div
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundColor: isInk ? rallio.ink : rallio.cream,
        color: foreground,
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
          background: isInk
            ? "linear-gradient(145deg, rgba(12,10,8,1) 0%, rgba(18,15,12,1) 58%, rgba(35,29,21,1) 100%)"
            : "radial-gradient(circle at 48% 18%, rgba(255,248,235,0.9) 0%, rgba(245,235,220,0.98) 42%, rgba(237,217,180,0.96) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isInk
            ? "linear-gradient(90deg, rgba(200,146,58,0.13) 0%, rgba(200,146,58,0) 32%, rgba(95,138,110,0.18) 100%)"
            : "linear-gradient(135deg, rgba(12,10,8,0.05) 0%, rgba(12,10,8,0) 48%, rgba(95,138,110,0.12) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 66,
          top: 66,
          right: 66,
          bottom: 66,
          border: `1px solid ${frameLine}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 88,
          padding: "13px 18px",
          border: `1px solid ${isInk ? rallio.amber : rallio.ink}`,
          backgroundColor: isInk ? "rgba(12,10,8,0.9)" : rallio.cream,
          color: isInk ? rallio.amber : rallio.ink,
          fontSize: 17,
          fontWeight: 900,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          zIndex: 4,
        }}
      >
        {chip}
      </div>
      <div
        style={{
          position: "absolute",
          top: 66,
          right: 88,
          color: quiet,
          fontSize: 17,
          fontWeight: 900,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          zIndex: 4,
        }}
      >
        RALLIO / {location}
      </div>
      {children}
      <div
        style={{
          position: "absolute",
          left: 88,
          bottom: 50,
          color: isInk ? rallio.amber : rallio.moss,
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
          right: 88,
          bottom: 46,
          color: quiet,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 28,
          fontStyle: "italic",
          fontWeight: 900,
          zIndex: 4,
        }}
      >
        {safeText(fields.brand_handle, "@rallio").replace("@", "")}
      </div>
    </div>
  );
}

function RallioManifestoTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(
    fields.headline,
    "Regulars over ratings",
    82,
  );
  const subhead = compactText(
    fields.subhead,
    "A taste map should start with the places people would recommend twice.",
    118,
  );
  const principles = getLines(fields, [
    "community recommendations",
    "local taste before launch noise",
    "link in bio to join the waitlist",
  ]);

  return (
    <RallioFrame chip="Manifesto" fields={fields} footer="link in bio waitlist" tone="ink">
      <div
        style={{
          position: "absolute",
          left: 118,
          top: 172,
          width: 844,
          display: "flex",
          flexDirection: "column",
          gap: 30,
          zIndex: 4,
        }}
      >
        <div
          style={{
            color: rallio.amber,
            fontSize: 19,
            fontWeight: 900,
            letterSpacing: 3.2,
            textTransform: "uppercase",
          }}
        >
          The rhythm rule
        </div>
        <div
          style={{
            color: rallio.cream,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: headline.length > 48 ? 72 : 94,
            lineHeight: 0.94,
            fontWeight: 900,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            color: "rgba(245,235,220,0.76)",
            fontSize: 31,
            lineHeight: 1.18,
            fontWeight: 800,
            maxWidth: 735,
          }}
        >
          {subhead}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 118,
          right: 118,
          bottom: 168,
          borderTop: `1px solid ${rallio.inkLine}`,
          paddingTop: 28,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          zIndex: 4,
        }}
      >
        {principles.slice(0, 3).map((line, index) => (
          <div
            key={`${line}-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              color: rallio.cream,
              fontSize: 26,
              fontWeight: 900,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                backgroundColor: index === 1 ? rallio.amber : rallio.moss,
                borderRadius: 99,
              }}
            />
            <span>{compactText(line, "", 68)}</span>
          </div>
        ))}
      </div>
    </RallioFrame>
  );
}

function RallioSpotCarouselTemplate({ fields }: { fields: TemplateFields }) {
  const business = displayHeadline(
    fields.business_name || fields.headline,
    "Bang Bang Ice Cream & Bakery",
    48,
  );
  const category = compactText(fields.spot_category, "dessert", 28);
  const spotNumber = compactText(fields.spot_number, "04 of 30", 18).toUpperCase();
  const address = compactText(fields.bottom_label || fields.subhead, "93 Ossington Ave", 48);
  const quote = compactText(
    fields.regular_quote || fields.quote,
    "dessert lines that still feel worth joining.",
    88,
  );
  const attribution = compactText(
    fields.attribution,
    "recommended by a local regular",
    74,
  );

  return (
    <RallioFrame chip="Spot card" fields={fields} footer="swipe the route">
      <div
        style={{
          position: "absolute",
          left: 82,
          top: 132,
          right: 82,
          bottom: 124,
          border: `1px solid ${rallio.line}`,
          backgroundColor: "rgba(237,217,180,0.42)",
          display: "flex",
          flexDirection: "column",
          padding: "58px 50px",
          zIndex: 3,
        }}
      >
        <div
          style={{
            color: rallio.amber,
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 3.6,
            textTransform: "uppercase",
          }}
        >
          The taste map - {spotNumber}
        </div>
        <div
          style={{
            marginTop: 28,
            color: rallio.ink,
            fontSize: 30,
            lineHeight: 1.05,
            fontWeight: 900,
          }}
        >
          {category} - {address}
        </div>
        <div
          style={{
            marginTop: 54,
            color: rallio.deepInk,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: business.length > 30 ? 86 : 118,
            lineHeight: 0.92,
            fontWeight: 900,
          }}
        >
          {business}
        </div>
        <div
          style={{
            marginTop: "auto",
            color: rallio.ink,
            fontSize: 30,
            lineHeight: 1.18,
            fontStyle: "italic",
            fontWeight: 600,
            maxWidth: 720,
          }}
        >
          &quot;{quote}&quot;
        </div>
        <div
          style={{
            marginTop: 18,
            color: rallio.muted,
            fontSize: 25,
            lineHeight: 1.2,
            fontWeight: 800,
          }}
        >
          - {attribution}
        </div>
      </div>
      <CountBadge label="1/6" />
    </RallioFrame>
  );
}

function RallioReceiptTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(fields.headline, "A receipt for better taste", 64);
  const lines = getLines(fields, [
    "ask what regulars order twice",
    "save the line worth joining",
    "notice the owner detail",
    "join the taste-map waitlist",
  ]);
  const subtotal = compactText(fields.subtotal, "taste map", 34).toUpperCase();

  return (
    <RallioFrame chip="Receipt" fields={fields} footer="save the signal">
      <div
        style={{
          position: "absolute",
          left: 176,
          right: 176,
          top: 146,
          bottom: 124,
          backgroundColor: rallio.cream,
          border: `1px solid ${rallio.line}`,
          boxShadow: "0 22px 70px rgba(12,10,8,0.18)",
          display: "flex",
          flexDirection: "column",
          padding: "52px 50px",
          zIndex: 3,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: rallio.moss,
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: 2.7,
            textTransform: "uppercase",
          }}
        >
          <span>Rallio taste receipt</span>
          <span>{safeText(fields.date, "today")}</span>
        </div>
        <div
          style={{
            marginTop: 34,
            color: rallio.ink,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: headline.length > 42 ? 54 : 66,
            lineHeight: 0.96,
            fontWeight: 900,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 40,
            borderTop: `1px dashed ${rallio.line}`,
            borderBottom: `1px dashed ${rallio.line}`,
            padding: "24px 0",
            display: "flex",
            flexDirection: "column",
            gap: 17,
          }}
        >
          {lines.slice(0, 4).map((line, index) => (
            <ReceiptLine key={`${line}-${index}`} index={index + 1} label={line} />
          ))}
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: rallio.muted,
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span>{safeText(fields.door_label, "Waitlist")}</span>
          <span style={{ color: rallio.amber }}>{subtotal}</span>
        </div>
      </div>
    </RallioFrame>
  );
}

function RallioRegularQuoteTemplate({ fields }: { fields: TemplateFields }) {
  const quote = displayHeadline(
    fields.regular_quote || fields.quote || fields.headline,
    "I go on Tuesdays because the octopus is on Tuesdays and I'm not above scheduling around it.",
    154,
  );
  const business = compactText(
    fields.business_name || fields.bottom_label,
    "Bar Isabel",
    28,
  );
  const area = compactText(fields.launch_neighborhood, "Little Italy", 32);
  const attribution = compactText(
    fields.attribution,
    "Priya, local regular since 2019",
    78,
  );

  return (
    <RallioFrame chip="Regulars quote" fields={fields} footer="taste-map waitlist">
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 142,
          padding: "18px 28px",
          border: `2px solid ${rallio.ink}`,
          display: "flex",
          alignItems: "center",
          gap: 18,
          color: rallio.ink,
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: 2.6,
          textTransform: "uppercase",
          zIndex: 4,
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            backgroundColor: rallio.amber,
            borderRadius: 99,
          }}
        />
        <span>
          {business} - {area}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 122,
          right: 112,
          top: 292,
          color: rallio.ink,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: quote.length > 118 ? 60 : 74,
          lineHeight: 1.08,
          fontStyle: "italic",
          fontWeight: 900,
          zIndex: 4,
        }}
      >
        &quot;{quote}&quot;
      </div>
      <div
        style={{
          position: "absolute",
          left: 122,
          right: 122,
          bottom: 178,
          height: 2,
          backgroundColor: rallio.ink,
          zIndex: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 122,
          bottom: 124,
          color: rallio.muted,
          fontSize: 28,
          fontWeight: 800,
          zIndex: 4,
        }}
      >
        - {attribution}
      </div>
    </RallioFrame>
  );
}

function RallioOwnerClaimTemplate({ fields }: { fields: TemplateFields }) {
  const business = displayHeadline(
    fields.business_name || fields.headline,
    "Sunline Cafe",
    42,
  );
  const category = compactText(fields.spot_category, "cafe", 22);
  const address = compactText(fields.bottom_label || fields.subhead, "626 Dundas St W", 36);
  const steps = safeArray(fields.owner_steps).length
    ? safeArray(fields.owner_steps)
    : [
        "correct the profile details",
        "add the story regulars already know",
        "tell people what to order first",
      ];

  return (
    <RallioFrame chip="Owner utility" fields={fields} footer="owner profile door">
      <CountBadge label="1/5 - owners" color={rallio.moss} />
      <div
        style={{
          position: "absolute",
          left: 126,
          top: 228,
          width: 890,
          height: 660,
          backgroundColor: rallio.moss,
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 188,
          width: 890,
          minHeight: 660,
          backgroundColor: rallio.ink,
          color: rallio.cream,
          display: "flex",
          flexDirection: "column",
          padding: "58px 58px",
          zIndex: 3,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            width: 360,
            padding: "13px 18px",
            backgroundColor: "rgba(95,138,110,0.18)",
            color: rallio.cream,
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 2.8,
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 99,
              backgroundColor: rallio.moss,
            }}
          />
          Community-added
        </div>
        <div
          style={{
            marginTop: 48,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: business.length > 24 ? 70 : 88,
            lineHeight: 0.95,
            fontWeight: 900,
          }}
        >
          {business}
        </div>
        <div
          style={{
            marginTop: 18,
            color: "rgba(245,235,220,0.64)",
            fontSize: 30,
            fontWeight: 800,
          }}
        >
          local - {category} - {address}
        </div>
        <div
          style={{
            marginTop: 42,
            borderTop: `1px solid ${rallio.inkLine}`,
            paddingTop: 32,
            display: "flex",
            gap: 58,
          }}
        >
          <OwnerStat value="14" label="posts" />
          <OwnerStat value="42" label="regulars" />
          <OwnerStat value="218" label="visits" />
        </div>
        <div
          style={{
            marginTop: 36,
            backgroundColor: rallio.amber,
            color: rallio.ink,
            minHeight: 86,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 38px",
            fontSize: 34,
            fontWeight: 900,
          }}
        >
          <span>Takes about a minute</span>
          <span style={{ fontSize: 42 }}>{"->"}</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 106,
          color: rallio.ink,
          fontSize: 33,
          lineHeight: 1.16,
          fontWeight: 900,
          zIndex: 4,
        }}
      >
        your customers are already <span style={{ fontStyle: "italic" }}>building</span>{" "}
        your profile.
      </div>
      <div
        style={{
          position: "absolute",
          left: 98,
          bottom: 78,
          color: rallio.muted,
          fontSize: 16,
          fontWeight: 800,
          zIndex: 4,
        }}
      >
        {compactText(steps[0], "", 76)}
      </div>
    </RallioFrame>
  );
}

function CountBadge({
  label,
  color = "rgba(12,10,8,0.72)",
}: {
  label: string;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        right: 76,
        top: 108,
        minWidth: 92,
        height: 58,
        padding: "0 22px",
        borderRadius: 30,
        backgroundColor: color,
        color: rallio.cream,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        fontWeight: 900,
        zIndex: 5,
      }}
    >
      {label}
    </div>
  );
}

function ReceiptLine({ index, label }: { index: number; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 24,
        color: rallio.deepInk,
        fontSize: 25,
        lineHeight: 1.12,
        fontWeight: 800,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <span>{compactText(label, "", 48)}</span>
      <span>{String(index).padStart(2, "0")}</span>
    </div>
  );
}

function OwnerStat({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span
        style={{
          color: rallio.amber,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 58,
          lineHeight: 0.9,
          fontWeight: 900,
        }}
      >
        {value}
      </span>
      <span
        style={{
          color: "rgba(245,235,220,0.58)",
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 2.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function getLines(fields: TemplateFields, fallback: string[]) {
  const fromReceipt = safeArray(fields.receipt_lines);
  if (fromReceipt.length) {
    return fromReceipt;
  }

  const fromInfoRows = safeArray(fields.info_rows);
  if (fromInfoRows.length) {
    return fromInfoRows;
  }

  return fallback;
}
