import type { TemplateFields } from "@/lib/content/types";
import {
  TemplateFrame,
  brand,
  centerStackStyle,
  displayHeadline,
  headlineStyle,
  metaStyle,
  safeText,
  subheadStyle,
} from "./shared";

export function NewsDigestTemplate({ fields }: { fields: TemplateFields }) {
  return (
    <TemplateFrame chip="AI NEWS" accent={brand.lime}>
      <div
        style={{
          position: "absolute",
          right: 86,
          top: 76,
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "rgba(247, 247, 242, 0.72)",
          fontSize: 21,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
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
        <span>{safeText(fields.source_name, "WORD OF AI")}</span>
      </div>
      <div style={centerStackStyle}>
        <div style={headlineStyle}>
          {displayHeadline(fields.headline, "AI just shifted again")}
        </div>
        <div style={{ ...subheadStyle, maxWidth: 720 }}>
          {safeText(fields.subhead, "What changed, why it matters, and what to do next.")}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 92,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          ...metaStyle,
          color: brand.lime,
        }}
      >
        {safeText(fields.date, new Date().toLocaleDateString("en-US"))}
      </div>
    </TemplateFrame>
  );
}
