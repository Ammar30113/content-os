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
  const headline = displayHeadline(fields.headline, "3 AI tools worth saving", 72);
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
        top={154}
      />
      <div
        style={{
          position: "absolute",
          left: 112,
          top: 560,
          width: 856,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          zIndex: 3,
        }}
      >
        {tools.map((tool, index) => (
          <div
            key={`${tool}-${index}`}
            style={{
              height: 92,
              backgroundColor: "rgba(0,0,0,0.42)",
              border: "1px solid rgba(247,247,242,0.16)",
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "0 26px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                backgroundColor: index === 1 ? brand.coral : brand.lime,
                color: brand.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 25,
                fontWeight: 900,
              }}
            >
              {index + 1}
            </div>
            <div
              style={{
                color: brand.white,
                fontSize: 34,
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
