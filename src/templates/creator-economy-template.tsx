import type { TemplateFields } from "@/lib/content/types";
import { TemplateFrame, brand, headlineStyle, safeText, subheadStyle } from "./shared";

export function CreatorEconomyTemplate({ fields }: { fields: TemplateFields }) {
  const heroText = fields.stat || fields.quote || "Distribution is the product";

  return (
    <TemplateFrame chip="CREATOR ECONOMY">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          gap: 30,
        }}
      >
        <div
          style={{
            color: brand.lime,
            fontSize: heroText.length > 28 ? 74 : 126,
            lineHeight: 0.9,
            letterSpacing: -3,
            fontWeight: 950,
            maxWidth: 880,
          }}
        >
          {heroText}
        </div>
        {fields.attribution ? (
          <div style={{ color: brand.coral, fontSize: 30, fontWeight: 800 }}>
            {fields.attribution}
          </div>
        ) : null}
        <div style={{ ...headlineStyle, fontSize: 58, maxWidth: 880 }}>
          {safeText(fields.headline, "The new creator edge is local trust")}
        </div>
        <div style={{ ...subheadStyle, maxWidth: 850 }}>
          {safeText(fields.subhead, "Attention compounds when it turns into action.")}
        </div>
      </div>
    </TemplateFrame>
  );
}
