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

const GRID_SAFE_INSET = 168;
const GRID_SAFE_WIDTH = CANVAS_SIZE - GRID_SAFE_INSET * 2;

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

  if (
    template === "rallio_steps" ||
    template === "supporter_steps_carousel" ||
    template === "owner_steps_carousel"
  ) {
    return <RallioStepsTemplate fields={fields} />;
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
        left: GRID_SAFE_INSET,
        top: 96,
        maxWidth: GRID_SAFE_WIDTH,
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
      <span style={{ display: "flex" }}>{compactText(label, "", 34)}</span>
    </div>
  );
}

function RallioWatermark({ color = rallio.muted }: { color?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        right: GRID_SAFE_INSET,
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
        right: GRID_SAFE_INSET,
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

function normalizeShortSince(value: unknown) {
  const raw = safeText(value, "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");

  if (raw.startsWith("'") && digits.length >= 2) {
    return `'${digits.slice(-2)}`;
  }

  if (digits.length >= 2) {
    return `'${digits.slice(-2)}`;
  }

  return compactText(raw, "", 4);
}

function normalizeFullSinceYear(value: unknown) {
  const raw = safeText(value, "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");

  if (digits.length >= 4) {
    return digits.slice(-4);
  }

  if (digits.length >= 2) {
    const shortYear = Number(digits.slice(-2));
    const century = shortYear <= 26 ? "20" : "19";

    return `${century}${String(shortYear).padStart(2, "0")}`;
  }

  return compactText(raw, "", 4);
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
  const fallbackListName = fields.launch_neighborhood
    ? `${fields.launch_neighborhood} taste map`
    : "local taste map";
  const listName = compactText(
    fields.spot_list_name,
    fallbackListName,
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
  const recommenderSince = normalizeShortSince(
    fields.recommender_since || fields.regular_since_year,
  );
  const attribution = buildSpotAttribution({
    name: recommenderName,
    neighborhood: recommenderNeighborhood,
    since: recommenderSince,
  });
  const page = compactText(fields.carousel_page, "", 3);
  const total = compactText(fields.carousel_total, "", 3);
  const hasPageBadge = Boolean(page && total);
  const attributionText = compactText(attribution, "", hasPageBadge ? 72 : 92);
  const nameFontSize = business.length > 22 ? 118 : business.length > 14 ? 148 : 174;
  const quoteFontSize =
    recommenderQuote.length > 90 ? 34 : recommenderQuote.length > 60 ? 42 : 50;

  return (
    <Canvas background={rallio.wheat}>
      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          top: 96,
          maxWidth: GRID_SAFE_WIDTH,
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
          left: GRID_SAFE_INSET,
          top: 156,
          maxWidth: GRID_SAFE_WIDTH,
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
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
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
            left: GRID_SAFE_INSET,
            right: GRID_SAFE_INSET,
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
            left: GRID_SAFE_INSET,
            right: hasPageBadge ? GRID_SAFE_INSET + 128 : GRID_SAFE_INSET,
            bottom: 146,
            color: rallio.muted,
            fontFamily: "Manrope, Inter, Arial, sans-serif",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 0.4,
            display: "flex",
          }}
        >
          {attributionText}
        </div>
      ) : null}

      {hasPageBadge ? <PageBadge page={page} total={total} /> : null}
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
    normalizeFullSinceYear(fields.regular_since_year || fields.recommender_since),
    "",
    4,
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
    quote.length > 160
      ? 60
      : quote.length > 120
        ? 70
        : quote.length > 80
          ? 82
          : quote.length > 40
            ? 98
            : 118;

  return (
    <Canvas background={rallio.cream}>
      {pillLabel ? <SpotTagPill label={pillLabel} /> : null}

      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
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
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
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
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
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
          left: GRID_SAFE_INSET,
          top: 168,
          width: 584,
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
  if (fields.carousel_role === "close") {
    return <RallioCarouselCloseTemplate fields={fields} />;
  }

  const isParticipation = fields.content_type === "participation_single";
  const headline = displayHeadline(
    isParticipation ? fields.participation_prompt || fields.headline : fields.headline,
    isParticipation
      ? "Which spot belongs on the taste map?"
      : "you've been doing rallio's job for free.",
    96,
  );
  const fontSize = headline.length > 70 ? 78 : headline.length > 40 ? 96 : 118;
  const contextLabel = compactText(
    [fields.business_name, fields.launch_neighborhood]
      .filter(Boolean)
      .join(" · "),
    "taste-map question",
    42,
  );

  return (
    <Canvas background={isParticipation ? rallio.cream : rallio.ink}>
      {isParticipation ? (
        <SpotTagPill label={contextLabel} />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
          bottom: isParticipation ? 236 : 132,
          color: isParticipation ? rallio.ink : rallio.cream,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize,
          lineHeight: 1.02,
          fontStyle: "italic",
          fontWeight: 600,
        }}
      >
        {headline}
      </div>
      {isParticipation ? (
        <div
          style={{
            position: "absolute",
            left: GRID_SAFE_INSET,
            right: GRID_SAFE_INSET,
            bottom: 124,
            color: rallio.muted,
            borderTop: `2px solid ${rallio.ink}`,
            paddingTop: 28,
            fontFamily: "Manrope, Inter, Arial, sans-serif",
            fontSize: 28,
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <span style={{ display: "flex" }}>reply with the spot regulars know</span>
          <span style={{ display: "flex", color: rallio.amber }}>taste map</span>
        </div>
      ) : null}
      <RallioWatermark color={isParticipation ? rallio.muted : "rgba(245,235,220,0.55)"} />
    </Canvas>
  );
}

function RallioCarouselCloseTemplate({ fields }: { fields: TemplateFields }) {
  const closeLine = displayHeadline(
    fields.headline,
    "the map remembers spots like this.",
    90,
  );
  const doorLabel = compactText(fields.door_label, "the local taste map", 36);
  const bottomLabel = compactText(fields.bottom_label, "link in bio", 36);
  const closeSize = closeLine.length > 60 ? 76 : closeLine.length > 36 ? 92 : 112;

  return (
    <Canvas background={rallio.cream}>
      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
          top: 280,
          color: rallio.ink,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: closeSize,
          lineHeight: 1.04,
          fontStyle: "italic",
          fontWeight: 600,
          display: "flex",
        }}
      >
        {closeLine}
      </div>
      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
          bottom: 124,
          color: rallio.muted,
          fontFamily: "Manrope, Inter, Arial, sans-serif",
          fontSize: 26,
          fontWeight: 800,
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          borderTop: "2px solid rgba(12,10,8,0.32)",
          paddingTop: 28,
        }}
      >
        <span style={{ display: "flex" }}>{bottomLabel}</span>
        <span style={{ display: "flex", color: rallio.amber }}>{doorLabel}</span>
      </div>
      <RallioWatermark color={rallio.muted} />
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
  const fontSize = business.length > 22 ? 112 : business.length > 14 ? 142 : 168;

  return (
    <Canvas background={rallio.cream}>
      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          top: 96,
          maxWidth: GRID_SAFE_WIDTH,
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
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
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
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
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

function RallioStepsTemplate({ fields }: { fields: TemplateFields }) {
  const isOwner =
    fields.step_audience === "owner" || fields.content_type === "owner_steps_carousel";
  const fallbackSteps = isOwner
    ? [
        "Download or open Rallio.",
        "Choose Business Owner.",
        "Add or claim a free business profile.",
        "Keep profile details accurate.",
        "Review and approve supporter posts.",
        "Track posts, profile clicks, and visits.",
      ]
    : [
        "Download or open Rallio.",
        "Choose Supporter and select your city.",
        "Browse or search local spots.",
        "Follow places you trust.",
        "Create a support post with a real recommendation.",
        "Build Your Taste from picks, posts, places, and areas.",
      ];
  const providedSteps = safeArray(isOwner ? fields.owner_steps : fields.supporter_steps);
  const steps = (providedSteps.length ? providedSteps : fallbackSteps).slice(0, 6);
  const headline = displayHeadline(
    fields.headline,
    isOwner ? "Owners: claim the profile" : "Start with one spot",
    58,
  );
  const subhead = isOwner
    ? "Claim a free profile, approve supporter posts, and track attention."
    : "Follow trusted places, share one real recommendation, and build Your Taste.";
  const background = isOwner ? rallio.ink : rallio.cream;
  const foreground = isOwner ? rallio.cream : rallio.ink;
  const muted = isOwner ? "rgba(245,235,220,0.68)" : rallio.muted;
  const accent = isOwner ? rallio.moss : rallio.amber;
  const pillLabel = isOwner
    ? "OWNER SETUP · TORONTO + RAJKOT FIRST"
    : "APP STORE LAUNCH · TORONTO + RAJKOT FIRST";
  const headlineSize = headline.length > 40 ? 56 : headline.length > 24 ? 64 : 72;

  return (
    <Canvas background={background}>
      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          top: 86,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "13px 24px",
          borderRadius: 999,
          backgroundColor: isOwner ? "rgba(95,138,110,0.22)" : rallio.ink,
          color: isOwner ? rallio.cream : rallio.cream,
          fontFamily: "Manrope, Inter, Arial, sans-serif",
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 2.8,
          textTransform: "uppercase",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 12,
            backgroundColor: accent,
            display: "flex",
          }}
        />
        <span style={{ display: "flex" }}>{pillLabel}</span>
      </div>

      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
          top: 168,
          color: foreground,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: headlineSize,
          lineHeight: 0.96,
          fontWeight: 900,
          display: "flex",
        }}
      >
        {headline}
      </div>

      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
          top: 322,
          color: muted,
          fontFamily: "Manrope, Inter, Arial, sans-serif",
          fontSize: 26,
          lineHeight: 1.28,
          fontWeight: 700,
          display: "flex",
        }}
      >
        {subhead}
      </div>

      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
          top: 404,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {steps.map((step, index) => (
          <div
            key={`${step}-${index}`}
            style={{
              minHeight: 62,
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
              paddingBottom: 16,
              borderBottom: `1px solid ${isOwner ? "rgba(245,235,220,0.14)" : "rgba(12,10,8,0.13)"}`,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 42,
                backgroundColor: accent,
                color: isOwner ? rallio.ink : rallio.cream,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                flex: 1,
                color: foreground,
                fontFamily: "Manrope, Inter, Arial, sans-serif",
                fontSize: 25,
                lineHeight: 1.18,
                fontWeight: 800,
                display: "flex",
              }}
            >
              {compactText(step, "", 86)}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: GRID_SAFE_INSET,
          right: GRID_SAFE_INSET,
          bottom: 94,
          color: muted,
          fontFamily: "Manrope, Inter, Arial, sans-serif",
          fontSize: 26,
          fontWeight: 800,
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          borderTop: `2px solid ${isOwner ? "rgba(245,235,220,0.26)" : "rgba(12,10,8,0.32)"}`,
          paddingTop: 28,
        }}
      >
        <span style={{ display: "flex" }}>link in bio</span>
        <span style={{ display: "flex", color: accent }}>
          {compactText(fields.door_label, isOwner ? "Owner setup" : "Download Rallio", 24)}
        </span>
      </div>

      <RallioWatermark color={isOwner ? "rgba(245,235,220,0.55)" : rallio.muted} />
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
  // Grab the last short token (number or short word) after the last separator
  const lastSep = line.match(/^(.+)\s*[-—:·|]\s*(\S{1,8})\s*$/);
  if (lastSep) {
    return { label: lastSep[1].trim(), value: lastSep[2].trim() };
  }
  // Fallback: last token after 2+ spaces
  const spaceSep = line.match(/^(.+?)\s{2,}(\S+)\s*$/);
  if (spaceSep) {
    return { label: spaceSep[1].trim(), value: spaceSep[2].trim() };
  }
  return { label: safeText(line, ""), value: "" };
}
