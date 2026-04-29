import type { TemplateFields } from "@/lib/content/types";
import {
  BottomBar,
  TemplateFrame,
  TextCard,
  Watermark,
  brand,
  compactText,
  displayHeadline,
  safeText,
} from "./shared";

export function CreatorEconomyTemplate({ fields }: { fields: TemplateFields }) {
  const heroText = displayHeadline(
    fields.stat || fields.quote,
    "Distribution is the product",
    64,
  );
  const headline = displayHeadline(
    fields.headline,
    "The new creator edge is local trust",
    72,
  );
  const subhead = compactText(
    fields.subhead,
    "Attention compounds when it turns into action.",
    112,
  );

  return (
    <TemplateFrame
      chip={safeText(fields.bottom_label, "CREATOR ECONOMY")}
      accent={brand.coral}
    >
      <div
        style={{
          position: "absolute",
          left: 112,
          top: 172,
          width: 856,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          zIndex: 3,
        }}
      >
        <div
          style={{
            color: brand.coral,
            fontSize: heroText.length > 42 ? 56 : 84,
            lineHeight: 0.96,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {heroText}
        </div>
        {fields.attribution ? (
          <div
            style={{
              color: "rgba(247,247,242,0.72)",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {fields.attribution}
          </div>
        ) : null}
      </div>
      <TextCard
        headline={headline}
        subhead={subhead}
        accent={brand.coral}
        top={534}
      />
      <BottomBar label={safeText(fields.swipe_hint, "Steal the play")} accent={brand.coral} />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
