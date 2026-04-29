import type { TemplateFields } from "@/lib/content/types";
import {
  BottomHeadlineBand,
  TemplateFrame,
  Watermark,
  brand,
  displayHeadline,
  safeText,
} from "./shared";

export function CreatorEconomyTemplate({ fields }: { fields: TemplateFields }) {
  const heroText = safeText(
    fields.stat || fields.quote,
    "Distribution is the product",
  );
  const headline = displayHeadline(
    fields.headline,
    "The new creator edge is local trust",
    88,
  );

  return (
    <TemplateFrame
      chip={safeText(fields.bottom_label, "CREATOR ECONOMY")}
      accent={brand.coral}
    >
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 150,
          width: 936,
          height: 454,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 42,
            width: 936,
            height: 298,
            border: "2px solid rgba(255,107,74,0.35)",
            backgroundColor: "rgba(0,0,0,0.34)",
            transform: "rotate(-2deg)",
          }}
        />
        <div
          style={{
            color: brand.coral,
            fontSize: heroText.length > 42 ? 58 : 92,
            lineHeight: 0.98,
            fontWeight: 900,
            letterSpacing: 0,
            textAlign: "center",
            textTransform: "uppercase",
            maxWidth: 820,
            zIndex: 2,
          }}
        >
          {heroText}
        </div>
        {fields.attribution ? (
          <div
            style={{
              color: "rgba(247,247,242,0.78)",
              fontSize: 25,
              fontWeight: 800,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              zIndex: 2,
            }}
          >
            {fields.attribution}
          </div>
        ) : null}
      </div>
      <BottomHeadlineBand
        headline={headline}
        subhead={safeText(fields.subhead, "Attention compounds when it turns into action.")}
        label={safeText(fields.swipe_hint, "Steal the play")}
        accent={brand.coral}
        minHeight={330}
      />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
