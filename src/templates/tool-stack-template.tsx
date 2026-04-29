import type { TemplateFields } from "@/lib/content/types";
import {
  BottomBar,
  TemplateFrame,
  TextCard,
  Watermark,
  brand,
  compactText,
  displayHeadline,
  safeArray,
  safeText,
} from "./shared";

const defaultTools = ["Research agent", "Drafting agent", "Review agent"];

export function ToolStackTemplate({ fields }: { fields: TemplateFields }) {
  const tools = normalizeTools(fields.tools);
  const headline = displayHeadline(fields.headline, "3 AI tools worth saving", 74);
  const subhead = compactText(
    fields.subhead,
    "A practical stack for faster creator work.",
    110,
  );

  return (
    <TemplateFrame chip={safeText(fields.bottom_label, "STACK")} accent={brand.lime}>
      <TextCard
        eyebrow={safeText(fields.visual_subject, "Builder stack")}
        headline={headline}
        subhead={subhead}
        accent={brand.lime}
        top={184}
      />
      <div
        style={{
          position: "absolute",
          left: 112,
          bottom: 172,
          width: 856,
          display: "flex",
          flexDirection: "row",
          gap: 14,
          zIndex: 3,
        }}
      >
        {tools.map((tool, index) => (
          <div
            key={`${tool}-${index}`}
            style={{
              minHeight: 76,
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.42)",
              border: "1px solid rgba(247,247,242,0.16)",
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                backgroundColor: index === 1 ? brand.coral : brand.lime,
                color: brand.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>
            <div
              style={{
                color: brand.white,
                fontSize: tool.length > 18 ? 20 : 23,
                lineHeight: 1.1,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {tool}
            </div>
          </div>
        ))}
      </div>
      <BottomBar label={safeText(fields.swipe_hint, "Save this stack")} />
      <Watermark align="right" />
    </TemplateFrame>
  );
}

function normalizeTools(value: unknown) {
  const tools = safeArray(value)
    .map((tool) => safeText(tool))
    .filter(Boolean)
    .map((tool, index) =>
      /^tool\s+[a-z]$/i.test(tool) ? defaultTools[index] || tool : tool,
    );

  return (tools.length ? tools : defaultTools).slice(0, 3);
}
