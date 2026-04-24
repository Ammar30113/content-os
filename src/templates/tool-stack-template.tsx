import type { TemplateFields } from "@/lib/content/types";
import {
  TemplateFrame,
  brand,
  headlineStyle,
  safeArray,
  safeText,
  subheadStyle,
} from "./shared";

export function ToolStackTemplate({ fields }: { fields: TemplateFields }) {
  const tools = safeArray(fields.tools).slice(0, 3);

  return (
    <TemplateFrame chip="STACK">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          gap: 34,
          paddingTop: 40,
        }}
      >
        <div style={{ ...headlineStyle, fontSize: 82 }}>
          {safeText(fields.headline, "3 AI tools worth saving")}
        </div>
        <div style={{ ...subheadStyle, maxWidth: 850 }}>
          {safeText(fields.subhead, "A practical stack for faster creator work.")}
        </div>
        <div style={{ display: "flex", gap: 22, marginTop: 20 }}>
          {(tools.length ? tools : ["Research", "Draft", "Ship"]).map(
            (tool, index) => (
              <div
                key={tool}
                style={{
                  width: 290,
                  minHeight: 180,
                  border: "2px solid rgba(212, 255, 0, 0.28)",
                  borderRadius: 24,
                  background: brand.panel,
                  padding: 26,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 18,
                    background: index === 1 ? brand.coral : brand.lime,
                    color: brand.background,
                    fontSize: 26,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ fontSize: 34, fontWeight: 900 }}>{tool}</div>
              </div>
            ),
          )}
        </div>
      </div>
    </TemplateFrame>
  );
}
