import type { TemplateFields } from "@/lib/content/types";
import {
  TemplateFrame,
  brand,
  centerStackStyle,
  displayHeadline,
  headlineStyle,
  safeText,
  subheadStyle,
} from "./shared";

export function CreatorEconomyTemplate({ fields }: { fields: TemplateFields }) {
  const heroText = fields.stat || fields.quote || "Distribution is the product";

  return (
    <TemplateFrame chip="CREATOR ECONOMY" accent={brand.coral}>
      <div style={{ ...centerStackStyle, maxWidth: 800 }}>
        <div
          style={{
            color: brand.coral,
            fontSize: heroText.length > 30 ? 58 : 88,
            lineHeight: 1,
            letterSpacing: heroText.length > 30 ? 2 : -1,
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          {heroText}
        </div>
        {fields.attribution ? (
          <div
            style={{
              color: "rgba(247, 247, 242, 0.72)",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 2.2,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {fields.attribution}
          </div>
        ) : null}
        <div style={{ ...headlineStyle, fontSize: 48 }}>
          {displayHeadline(fields.headline, "The new creator edge is local trust")}
        </div>
        <div style={{ ...subheadStyle, maxWidth: 700 }}>
          {safeText(fields.subhead, "Attention compounds when it turns into action.")}
        </div>
      </div>
    </TemplateFrame>
  );
}
