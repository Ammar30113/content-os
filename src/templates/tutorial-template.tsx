import type { TemplateFields } from "@/lib/content/types";
import { TemplateFrame, brand, headlineStyle, safeText, subheadStyle } from "./shared";

export function TutorialTemplate({ fields }: { fields: TemplateFields }) {
  return (
    <TemplateFrame chip="HOW TO">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          gap: 30,
        }}
      >
        {fields.step_number ? (
          <div
            style={{
              fontSize: 150,
              lineHeight: 0.8,
              color: brand.lime,
              fontWeight: 950,
            }}
          >
            {fields.step_number}
          </div>
        ) : null}
        <div style={{ ...headlineStyle, fontSize: 78 }}>
          {safeText(fields.headline, "Steal this AI workflow")}
        </div>
        <div style={{ ...subheadStyle, maxWidth: 840 }}>
          {safeText(fields.subhead, "A practical prompt pattern you can use today.")}
        </div>
        {fields.code_snippet ? (
          <div
            style={{
              marginTop: 20,
              border: "2px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 24,
              background: "#111114",
              padding: 30,
              fontSize: 27,
              lineHeight: 1.28,
              color: "#E7E7E0",
              fontFamily: "Menlo, Consolas, monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {fields.code_snippet}
          </div>
        ) : null}
      </div>
    </TemplateFrame>
  );
}
