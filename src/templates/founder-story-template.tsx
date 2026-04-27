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

export function FounderStoryTemplate({ fields }: { fields: TemplateFields }) {
  return (
    <TemplateFrame chip="BUILDING IN PUBLIC" accent={brand.lime}>
      <div style={{ ...centerStackStyle, maxWidth: 790 }}>
        {fields.portrait_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fields.portrait_url}
            alt=""
            width={126}
            height={126}
            style={{
              borderRadius: 999,
              border: `4px solid ${brand.lime}`,
              objectFit: "cover",
            }}
          />
        ) : null}
        {fields.pull_quote ? (
          <div
            style={{
              color: brand.lime,
              fontSize: 48,
              lineHeight: 1.08,
              fontWeight: 950,
              letterSpacing: 1.4,
              textAlign: "center",
            }}
          >
            “{fields.pull_quote}”
          </div>
        ) : null}
        <div style={{ ...headlineStyle, fontSize: 50 }}>
          {displayHeadline(fields.headline, "What I learned building in public")}
        </div>
        <div style={{ ...subheadStyle, maxWidth: 690 }}>
          {safeText(fields.subhead, "Notes from turning ideas into products.")}
        </div>
      </div>
    </TemplateFrame>
  );
}
