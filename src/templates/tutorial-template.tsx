import type { TemplateFields } from "@/lib/content/types";
import {
  BottomHeadlineBand,
  TemplateFrame,
  Watermark,
  brand,
  displayHeadline,
  safeText,
} from "./shared";

export function TutorialTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(fields.headline, "Steal this AI workflow", 86);
  const snippet = safeText(
    fields.code_snippet,
    "Role: operator\nTask: turn this messy workflow into a repeatable AI system\nOutput: steps, risks, next action",
  );

  return (
    <TemplateFrame chip={safeText(fields.bottom_label, "HOW TO")} accent={brand.lime}>
      <div
        style={{
          position: "absolute",
          left: 78,
          top: 150,
          width: 924,
          height: 468,
          backgroundColor: "rgba(0,0,0,0.7)",
          border: "2px solid rgba(247,247,242,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <div
          style={{
            height: 66,
            borderBottom: "1px solid rgba(247,247,242,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
          }}
        >
          <div
            style={{
              color: brand.lime,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Prompt block
          </div>
          <div
            style={{
              color: "rgba(247,247,242,0.56)",
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {safeText(fields.step_number, "01")}
          </div>
        </div>
        <div
          style={{
            padding: "34px 38px",
            color: "#F7F7F2",
            fontFamily: "Menlo, Consolas, monospace",
            fontSize: snippet.length > 170 ? 24 : 30,
            lineHeight: 1.26,
            whiteSpace: "pre-wrap",
            display: "flex",
            flex: 1,
            alignItems: "center",
          }}
        >
          {snippet}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 76,
          top: 112,
          width: 122,
          height: 122,
          backgroundColor: brand.lime,
          color: brand.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 56,
          fontWeight: 900,
          zIndex: 3,
        }}
      >
        {safeText(fields.step_number, "01")}
      </div>
      <BottomHeadlineBand
        headline={headline}
        subhead={safeText(fields.subhead, "A practical prompt pattern you can use today.")}
        label={safeText(fields.swipe_hint, "Save this")}
        accent={brand.lime}
        minHeight={330}
      />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
