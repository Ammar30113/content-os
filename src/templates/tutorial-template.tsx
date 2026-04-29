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

export function TutorialTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(fields.headline, "Steal this AI workflow", 72);
  const subhead = compactText(
    fields.subhead,
    "A practical prompt pattern you can use today.",
    110,
  );
  const snippet = compactText(
    fields.code_snippet,
    "1. Define the job\n2. Give the agent context\n3. Review before it ships",
    190,
  );

  return (
    <TemplateFrame chip={safeText(fields.bottom_label, "HOW TO")} accent={brand.lime}>
      <TextCard
        eyebrow={safeText(fields.visual_subject, `Step ${safeText(fields.step_number, "01")}`)}
        headline={headline}
        subhead={subhead}
        accent={brand.lime}
        top={154}
      />
      <div
        style={{
          position: "absolute",
          left: 112,
          top: 572,
          width: 856,
          minHeight: 260,
          backgroundColor: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(247,247,242,0.18)",
          display: "flex",
          flexDirection: "column",
          padding: "34px 38px",
          gap: 22,
          zIndex: 3,
        }}
      >
        <div
          style={{
            color: brand.lime,
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Prompt recipe
        </div>
        <div
          style={{
            color: brand.white,
            fontFamily: "Menlo, Consolas, monospace",
            fontSize: snippet.length > 140 ? 25 : 30,
            lineHeight: 1.32,
            whiteSpace: "pre-wrap",
          }}
        >
          {snippet}
        </div>
      </div>
      <BottomBar label={safeText(fields.swipe_hint, "Save this")} />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
