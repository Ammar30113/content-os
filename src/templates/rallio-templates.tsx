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

function SpotTagPill({ label }: { label: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 96,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 28px",
        borderRadius: 999,
        backgroundColor: rallio.ink,
        color: rallio.cream,
        fontFamily: "Manrope, Inter, Arial, sans-serif",
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 3.4,
        textTransform: "uppercase",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 14,
          backgroundColor: rallio.amber,
          display: "flex",
        }}
      />
      <span style={{ display: "flex" }}>{label}</span>
    </div>
  );
}

function RallioWatermark({ color = rallio.muted }: { color?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 60,
        bottom: 56,
        color,
        fontFamily: "Fraunces, Georgia, serif",
        fontSize: 28,
        fontStyle: "italic",
        fontWeight: 600,
        letterSpacing: 0.6,
        display: "flex",
      }}
    >
      rallio
    </div>
  );
}

function PageBadge({
  page,
  total,
  color = rallio.ink,
}: {
  page: string;
  total: string;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        right: 60,
        bottom: 132,
        display: "flex",
        alignItems: "center",
        padding: "10px 20px",
        border: `1.5px solid ${color}`,
        color,
        fontFamily: "Manrope, Inter, Arial, sans-serif",
        fontSize: 24,
        fontWeight: 900,
        letterSpacing: 1.6,
      }}
    >
      {`${page}/${total}`}
    </div>
  );
}

function stripLeadingDash(value: string) {
  return value.replace(/^\s*[—–-]\s*/, "").trim();
}

function buildSpotAttribution({
  name,
  neighborhood,
  since,
}: {
  name: string;
  neighborhood: string;
  since: string;
}) {
  if (!name && !neighborhood && !since) return "";
  const nbsp = " ";
  const parts: string[] = [];
  if (name) parts.push(`recommended${nbsp}by${nbsp}${stripLeadingDash(name)}`);
  if (neighborhood) parts.push(neighborhood.toLowerCase());
  if (since) parts.push(`regular${nbsp}since${nbsp}${since}`);
  return `—${nbsp}${parts.join(" / ")}`;
}

function buildQuoteAttribution({
  name,
  neighborhood,
  sinceYear,
}: {
  name: string;
  neighborhood: string;
  sinceYear: string;
}) {
  if (!name && !neighborhood && !sinceYear) return "";
  const cleanName = stripLeadingDash(name);
  const parts: string[] = [];
  if (cleanName) parts.push(cleanName);
  if (neighborhood && sinceYear) {
    parts.push(`${neighborhood} regular since ${sinceYear}`);
  } else if (neighborhood) {
    parts.push(`${neighborhood} regular`);
  } else if (sinceYear) {
    parts.push(`regular since ${sinceYear}`);
  }
  return `— ${parts.join(", ")}`;
}

function RallioSpotCarouselTemplate({ fields }: { fields: TemplateFields }) {
  const business = displayHeadline(
    fields.business_name || fields.headline,
    "Bang Bang",
    40,
  );
  const category = compactText(fields.spot_category, "dessert", 24).toLowerCase();
  const address = compactText(
    fields.spot_address || fields.launch_neighborhood,
    "Ossington Ave",
    40,
  );
  const listName = compactText(
    fields.spot_list_name,
    "THE OSSINGTON 30",
    32,
  ).toUpperCase();
  const listPosition = compactText(fields.spot_list_position, "", 3);
  const listTotal = compactText(fields.spot_list_total, "", 3);
  const headerLine =
    listPosition && listTotal
      ? `${listName} · ${listPosition} OF ${listTotal}`
      : listName;
  const recommenderQuote = displayHeadline(
    fields.recommender_quote || fields.regular_quote || fields.quote,
    "",
    140,
  );
  const recommenderName = compactText(fields.recommender_name, "", 32);
  const recommenderNeighborhood = compactText(
    fields.recommender_neighborhood,
    "",
    32,
  );
  const recommenderSince = compactText(fields.recommender_since, "", 8);
  const attribution = buildSpotAttribution({
    name: recommenderName,
    neighborhood: recommenderNeighborhood,
    since: recommenderSince,
  });
  const page = compactText(fields.carousel_page, "", 3);
  const total = compactText(fields.carousel_total, "", 3);
  const nameFontSize = business.length > 22 ? 138 : business.length > 14 ? 172 : 198;
  const quoteFontSize =
    recommenderQuote.length > 90 ? 40 : recommenderQuote.length > 60 ? 48 : 56;

  return (
    <Canvas background={rallio.wheat}>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 96,
          color: rallio.amber,
          fontFamily: "Manrope, Inter, Arial, sans-serif",
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: 3.8,
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        {headerLine}
      </div>

      <div
        style={{
          position: "absolute",
          left: 96,
          top: 156,
          color: rallio.ink,
          fontFamily: "Manrope, Inter, Arial, sans-serif",
          fontSize: 28,
          fontWeight: 700,
          opacity: 0.78,
          display: "flex",
        }}
      >
        {`${category} · ${address}`}
      </div>

      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: 244,
          color: rallio.ink,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: nameFontSize,
          lineHeight: 0.94,
          fontWeight: 900,
          display: "flex",
        }}
      >
        {business}
      </div>

      {recommenderQuote ? (
        <div
          style={{
            position: "absolute",
            left: 96,
            right: 96,
            bottom: 232,
            color: rallio.ink,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: quoteFontSize,
            lineHeight: 1.2,
            fontStyle: "italic",
            fontWeight: 600,
            display: "flex",
          }}
        >
          {`“${recommenderQuote}”`}
        </div>
      ) : null}

      {attribution ? (
        <div
          style={{
            position: "absolute",
            left: 96,
            right: 220,
            bottom: 146,
            color: rallio.muted,
            fontFamily: "Manrope, Inter, Arial, sans-serif",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 0.4,
            display: "flex",
          }}
        >
          {attribution}
        </div>
      ) : null}

      {page && total ? <PageBadge page={page} total={total} /> : null}
      <RallioWatermark />
    </Canvas>
  );
}

function RallioRegularQuoteTemplate({ fields }: { fields: TemplateFields }) {
  const quote = displayHeadline(
    fields.regular_quote || fields.quote || fields.headline,
    "i'd queue for the morning bun",
    200,
  );
  const name = compactText(
    fields.attribution || fields.recommender_name,
    "Mara",
    36,
  );
  const neighborhood = compactText(
    fields.regular_neighborhood || fields.launch_neighborhood,
    "",
    32,
  );
  const sinceYear = compactText(
    fields.regular_since_year || fields.recommender_since,
    "",
    8,
  );
  const business = compactText(fields.business_name, "", 28);
  const pillLabel = [business, neighborhood]
    .filter(Boolean)
    .map((part) => part.toUpperCase())
    .join(" · ");
  const attributionLine = buildQuoteAttribution({
    name,
    neighborhood,
    sinceYear,
  });
  const fontSize =
    quote.length > 140 ? 74 : quote.length > 80 ? 96 : quote.length > 40 ? 118 : 138;

  return (
    <Canvas background={rallio.cream}>
      {pillLabel ? <SpotTagPill label={pillLabel} /> : null}

      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: pillLabel ? 232 : 160,
          color: rallio.ink,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize,
          lineHeight: 1.08,
          fontStyle: "italic",
          fontWeight: 600,
          display: "flex",
        }}
      >
        {`“${quote}”`}
      </div>

      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 196,
          height: 1.5,
          backgroundColor: rallio.ink,
          opacity: 0.32,
          display: "flex",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 96,
          right: 220,
          bottom: 132,
          color: rallio.ink,
          fontFamily: "Manrope, Inter, Arial, sans-serif",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 0.4,
          display: "flex",
        }}
      >
        {attributionLine || `— ${name}`}
      </div>

      <RallioWatermark />
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
  const neighborhood = compactText(fields.launch_neighborhood, "", 32);

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
            display: "flex",
            flexDirection: "column",
            paddingBottom: 18,
            borderBottom: `1px dashed ${rallio.ink}`,
          }}
        >
          <div
            style={{
              color: rallio.ink,
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Rallio Receipt
          </div>
          {neighborhood ? (
            <div
              style={{
                marginTop: 6,
                color: rallio.muted,
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              {neighborhood}
            </div>
          ) : null}
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
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
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
      <RallioWatermark color={rallio.muted} />
    </Canvas>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
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
      <RallioWatermark color="rgba(245,235,220,0.55)" />
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
          top: 96,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 24px",
          borderRadius: 999,
          backgroundColor: rallio.mossSoft,
          color: rallio.moss,
          fontFamily: "Manrope, Inter, Arial, sans-serif",
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: 3.2,
          textTransform: "uppercase",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 12,
            backgroundColor: rallio.moss,
            display: "flex",
          }}
        />
        <span style={{ display: "flex" }}>Community-added</span>
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
      <RallioWatermark color={rallio.muted} />
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
