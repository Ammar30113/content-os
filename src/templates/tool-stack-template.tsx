import type { TemplateFields } from "@/lib/content/types";
import {
  TemplateFrame,
  brand,
  centerStackStyle,
  displayHeadline,
  headlineStyle,
  safeArray,
  safeText,
  subheadStyle,
} from "./shared";

export function ToolStackTemplate({ fields }: { fields: TemplateFields }) {
  const tools = safeArray(fields.tools).slice(0, 3);

  return (
    <TemplateFrame chip="STACK" accent={brand.lime}>
      <div style={{ ...centerStackStyle, maxWidth: 810 }}>
        <div style={{ ...headlineStyle, fontSize: 56 }}>
          {displayHeadline(fields.headline, "3 AI tools worth saving")}
        </div>
        <div style={{ ...subheadStyle, maxWidth: 700 }}>
          {safeText(fields.subhead, "A practical stack for faster creator work.")}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            width: 560,
            marginTop: 12,
          }}
        >
          {(tools.length ? tools : ["Research", "Draft", "Ship"]).map(
            (tool, index) => (
              <div
                key={tool}
                style={{
                  height: 74,
                  border: "1px solid rgba(247, 247, 242, 0.16)",
                  background: "rgba(10, 10, 11, 0.45)",
                  padding: "0 26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    background: index === 1 ? brand.coral : brand.lime,
                    color: brand.background,
                    fontSize: 22,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 1.5 }}>
                  {tool}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </TemplateFrame>
  );
}
