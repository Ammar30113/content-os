import type { TemplateFields } from "@/lib/content/types";
import {
  BottomBar,
  TemplateFrame,
  Watermark,
  brand,
  compactText,
  displayHeadline,
  safeText,
} from "./shared";

export function MemeTemplate({ fields }: { fields: TemplateFields }) {
  const setup = displayHeadline(
    fields.meme_setup || fields.quote || fields.headline,
    "AI agent says it can handle everything",
    70,
  );
  const punchline = displayHeadline(
    fields.meme_punchline || fields.subhead,
    "opens 19 tabs and asks for context",
    74,
  );
  const context = compactText(
    fields.visual_subject,
    "builder humor / workflow pain",
    72,
  );

  return (
    <TemplateFrame chip={safeText(fields.bottom_label, "BUILDER MEME")} accent={brand.coral}>
      <div
        style={{
          position: "absolute",
          left: 112,
          top: 156,
          width: 856,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          zIndex: 3,
        }}
      >
        <div
          style={{
            color: brand.coral,
            fontSize: 19,
            fontWeight: 900,
            letterSpacing: 3.2,
            textTransform: "uppercase",
          }}
        >
          {context}
        </div>
        <div
          style={{
            width: 856,
            minHeight: 284,
            border: "1px solid rgba(247,247,242,0.18)",
            backgroundColor: "rgba(0,0,0,0.48)",
            display: "flex",
            alignItems: "center",
            padding: "36px 42px",
          }}
        >
          <div
            style={{
              color: "rgba(247,247,242,0.84)",
              fontSize: setup.length > 52 ? 42 : 56,
              lineHeight: 1.04,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            {setup}
          </div>
        </div>
        <div
          style={{
            width: 856,
            minHeight: 284,
            border: `1px solid ${brand.coral}`,
            backgroundColor: "rgba(201,130,112,0.12)",
            display: "flex",
            alignItems: "center",
            padding: "36px 42px",
          }}
        >
          <div
            style={{
              color: brand.white,
              fontSize: punchline.length > 52 ? 44 : 62,
              lineHeight: 0.98,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            {punchline}
          </div>
        </div>
      </div>
      <BottomBar
        label={safeText(fields.swipe_hint, "Send this to the builder who needs it")}
        accent={brand.coral}
      />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
