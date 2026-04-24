import type { TemplateFields } from "@/lib/content/types";
import { TemplateFrame, brand, headlineStyle, safeText, subheadStyle } from "./shared";

export function NewsDigestTemplate({ fields }: { fields: TemplateFields }) {
  return (
    <TemplateFrame chip="AI NEWS">
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 82,
          display: "flex",
          alignItems: "center",
          gap: 16,
          color: brand.muted,
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {fields.source_logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fields.source_logo}
            alt=""
            width={48}
            height={48}
            style={{ borderRadius: 12 }}
          />
        ) : null}
        <span>{safeText(fields.source_name, "Word of AI")}</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          gap: 32,
        }}
      >
        <div style={headlineStyle}>{safeText(fields.headline, "AI just shifted again")}</div>
        <div style={{ ...subheadStyle, maxWidth: 820 }}>
          {safeText(fields.subhead, "What changed, why it matters, and what to do next.")}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 70,
          color: brand.lime,
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        {safeText(fields.date, new Date().toLocaleDateString("en-US"))}
      </div>
    </TemplateFrame>
  );
}
