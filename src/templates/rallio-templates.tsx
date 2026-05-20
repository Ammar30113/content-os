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
  cream: "#F5EBDC",
  wheat: "#EDD9B4",
  moss: "#5F8A6E",
  mossSoft: "rgba(95,138,110,0.18)",
  amber: "#C8923A",
  muted: "#71685F",
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

function Canvas({
  background,
  children,
}: {
  background: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundColor: background,
        display: "flex",
        fontFamily: "Manrope, Inter, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function RallioSpotCarouselTemplate({ fields }: { fields: TemplateFields }) {
  const business = displayHeadline(
    fields.business_name || fields.headline,
    "Bang Bang",
    40,
  );
  const category = compactText(fields.spot_category, "dessert", 24).toUpperCase();
  const area = compactText(
    fields.launch_neighborhood || fields.bottom_label,
    "ossington",
    32,
  ).toUpperCase();
  const fontSize = business.length > 22 ? 132 : business.length > 14 ? 168 : 196;

  return (
    <Canvas background={rallio.wheat}>
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 132,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            color: rallio.ink,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize,
            lineHeight: 0.95,
            fontWeight: 900,
          }}
        >
          {business}
        </div>
        <div
          style={{
            marginTop: 26,
            color: rallio.ink,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: 4,
          }}
        >
          {`${category} · ${area}`}
        </div>
      </div>
    </Canvas>
  );
}

function RallioRegularQuoteTemplate({ fields }: { fields: TemplateFields }) {
  const quote = displayHeadline(
    fields.regular_quote || fields.quote || fields.headline,
    "i'd queue for the morning bun",
    200,
  );
  const attribution = compactText(
    fields.attribution || fields.business_name,
    "Mara",
    36,
  );
  const fontSize =
    quote.length > 140 ? 68 : quote.length > 80 ? 88 : quote.length > 40 ? 110 : 132;

  return (
    <Canvas background={rallio.cream}>
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: 150,
          color: rallio.ink,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize,
          lineHeight: 1.05,
          fontStyle: "italic",
          fontWeight: 600,
        }}
      >
        {`“${quote}”`}
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 132,
          color: rallio.ink,
          fontSize: 38,
          fontWeight: 600,
        }}
      >
        {`— ${attribution}`}
      </div>
    </Canvas>
  );
}

function RallioReceiptTemplate({ fields }: { fields: TemplateFields }) {
  const rows = getReceiptRows(fields, [
    { label: "Bang Bang", value: "14" },
    { label: "Bar Isabel", value: "9" },
    { label: "Sunline", value: "6" },
  ]).slice(0, 5);
  const total = compactText(fields.subtotal, "29", 8);

  return (
    <Canvas background={rallio.cream}>
      <div
        style={{
          position: "absolute",
          left: 132,
          top: 168,
          width: 596,
          padding: "30px 38px 30px 38px",
          border: `2px solid ${rallio.ink}`,
          backgroundColor: rallio.cream,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            color: rallio.ink,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: "uppercase",
            paddingBottom: 18,
            borderBottom: `1px dashed ${rallio.ink}`,
          }}
        >
          Rallio Receipt
        </div>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {rows.map((row, idx) => (
            <ReceiptRow key={`${row.label}-${idx}`} label={row.label} value={row.value} />
          ))}
        </div>
        <div
          style={{
            marginTop: 16,
            paddingTop: 18,
            borderTop: `1px dashed ${rallio.ink}`,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 28,
            fontWeight: 900,
            color: rallio.ink,
            letterSpacing: 1.8,
            textTransform: "uppercase",
          }}
        >
          <span>Total</span>
          <span>{total}</span>
        </div>
      </div>
    </Canvas>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 24,
        fontWeight: 700,
        color: rallio.ink,
      }}
    >
      <span>{compactText(label, "", 28)}</span>
      <span>{compactText(value, "", 6)}</span>
    </div>
  );
}

function RallioManifestoTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(
    fields.headline,
    "you've been doing rallio's job for free.",
    96,
  );
  const fontSize = headline.length > 70 ? 88 : headline.length > 40 ? 108 : 132;

  return (
    <Canvas background={rallio.ink}>
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 132,
          color: rallio.cream,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize,
          lineHeight: 1.02,
          fontStyle: "italic",
          fontWeight: 600,
        }}
      >
        {headline}
      </div>
    </Canvas>
  );
}

function RallioOwnerClaimTemplate({ fields }: { fields: TemplateFields }) {
  const business = displayHeadline(
    fields.business_name || fields.headline,
    "Sunline Cafe",
    40,
  );
  const note = compactText(
    fields.subhead || fields.bottom_label,
    "unclaimed · claim takes about a min",
    72,
  );
  const fontSize = business.length > 22 ? 132 : business.length > 14 ? 168 : 196;

  return (
    <Canvas background={rallio.cream}>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 140,
          padding: "16px 28px",
          backgroundColor: rallio.mossSoft,
          color: rallio.moss,
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: 3.4,
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        Community-added
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 174,
          color: rallio.ink,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize,
          lineHeight: 0.95,
          fontWeight: 900,
        }}
      >
        {business}
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 124,
          color: rallio.muted,
          fontSize: 30,
          fontWeight: 600,
        }}
      >
        {note}
      </div>
    </Canvas>
  );
}

function getReceiptRows(
  fields: TemplateFields,
  fallback: { label: string; value: string }[],
) {
  const fromReceipt = safeArray(fields.receipt_lines);
  if (fromReceipt.length) {
    return fromReceipt.map(parseReceiptLine);
  }

  const fromInfoRows = safeArray(fields.info_rows);
  if (fromInfoRows.length) {
    return fromInfoRows.map(parseReceiptLine);
  }

  return fallback;
}

function parseReceiptLine(line: string): { label: string; value: string } {
  const match = line.match(/^(.+?)\s*(?:[-—:·|]\s*|\s{2,})(\S+)\s*$/);
  if (match) {
    return { label: match[1].trim(), value: match[2].trim() };
  }
  return { label: safeText(line, ""), value: "" };
}
