/* eslint-disable @next/next/no-img-element */
import type { TemplateFields } from "@/lib/content/types";
import {
  BottomHeadlineBand,
  TemplateFrame,
  Watermark,
  brand,
  displayHeadline,
  getInitials,
  safeArray,
  safeText,
  safeUrl,
} from "./shared";

export function ToolStackTemplate({ fields }: { fields: TemplateFields }) {
  const tools = (safeArray(fields.tools).length
    ? safeArray(fields.tools)
    : ["Research", "Draft", "Ship"]
  ).slice(0, 3);
  const logos = safeArray(fields.tool_logos);
  const headline = displayHeadline(fields.headline, "3 AI tools worth saving", 86);

  return (
    <TemplateFrame chip={safeText(fields.bottom_label, "STACK")} accent={brand.lime}>
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 148,
          width: 952,
          display: "flex",
          gap: 18,
          zIndex: 2,
        }}
      >
        {tools.map((tool, index) => {
          const logo = safeUrl(logos[index]);

          return (
            <div
              key={`${tool}-${index}`}
              style={{
                width: 305,
                height: 492,
                border: "2px solid rgba(247,247,242,0.16)",
                backgroundColor:
                  index === 1 ? "rgba(255,107,74,0.14)" : "rgba(10,10,11,0.72)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "34px 26px 30px",
              }}
            >
              <div
                style={{
                  width: 74,
                  height: 74,
                  backgroundColor: index === 1 ? brand.coral : brand.lime,
                  color: brand.background,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 33,
                  fontWeight: 900,
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 999,
                  backgroundColor: "rgba(0,0,0,0.64)",
                  border: "2px solid rgba(247,247,242,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    width={150}
                    height={150}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <div
                    style={{
                      color: index === 1 ? brand.coral : brand.lime,
                      fontSize: 54,
                      fontWeight: 900,
                    }}
                  >
                    {getInitials(tool)}
                  </div>
                )}
              </div>
              <div
                style={{
                  color: brand.white,
                  fontSize: tool.length > 18 ? 30 : 36,
                  lineHeight: 1,
                  fontWeight: 900,
                  textAlign: "center",
                  textTransform: "uppercase",
                }}
              >
                {tool}
              </div>
            </div>
          );
        })}
      </div>
      <BottomHeadlineBand
        headline={headline}
        subhead={safeText(fields.subhead, "A practical stack for faster creator work.")}
        label={safeText(fields.swipe_hint, "Save this stack")}
        accent={brand.lime}
        minHeight={316}
      />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
