import type { TemplateFields } from "@/lib/content/types";
import { TemplateFrame, brand, headlineStyle, safeText, subheadStyle } from "./shared";

export function FounderStoryTemplate({ fields }: { fields: TemplateFields }) {
  return (
    <TemplateFrame chip="BUILDING IN PUBLIC">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          gap: 32,
        }}
      >
        {fields.portrait_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fields.portrait_url}
            alt=""
            width={150}
            height={150}
            style={{
              borderRadius: 999,
              border: `5px solid ${brand.lime}`,
              objectFit: "cover",
            }}
          />
        ) : null}
        {fields.pull_quote ? (
          <div
            style={{
              color: brand.lime,
              fontSize: 58,
              lineHeight: 1.02,
              fontWeight: 950,
              maxWidth: 850,
            }}
          >
            “{fields.pull_quote}”
          </div>
        ) : null}
        <div style={{ ...headlineStyle, fontSize: 72 }}>
          {safeText(fields.headline, "What I learned building in public")}
        </div>
        <div style={{ ...subheadStyle, maxWidth: 840 }}>
          {safeText(fields.subhead, "Notes from turning ideas into products.")}
        </div>
      </div>
    </TemplateFrame>
  );
}
