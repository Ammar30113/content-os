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

export function TutorialTemplate({ fields }: { fields: TemplateFields }) {
  return (
    <TemplateFrame chip="HOW TO" accent={brand.lime}>
      <div style={{ ...centerStackStyle, maxWidth: 780 }}>
        {fields.step_number ? (
          <div
            style={{
              fontSize: 112,
              lineHeight: 0.9,
              color: brand.lime,
              fontWeight: 950,
              letterSpacing: -2,
            }}
          >
            {fields.step_number}
          </div>
        ) : null}
        <div style={{ ...headlineStyle, fontSize: 58 }}>
          {displayHeadline(fields.headline, "Steal this AI workflow")}
        </div>
        <div style={{ ...subheadStyle, maxWidth: 700 }}>
          {safeText(fields.subhead, "A practical prompt pattern you can use today.")}
        </div>
        {fields.code_snippet ? (
          <div
            style={{
              marginTop: 6,
              border: "1px solid rgba(247, 247, 242, 0.16)",
              background: "rgba(10, 10, 11, 0.52)",
              padding: 26,
              fontSize: 23,
              lineHeight: 1.28,
              color: "#E7E7E0",
              fontFamily: "Menlo, Consolas, monospace",
              whiteSpace: "pre-wrap",
              maxWidth: 710,
            }}
          >
            {fields.code_snippet}
          </div>
        ) : null}
      </div>
    </TemplateFrame>
  );
}
