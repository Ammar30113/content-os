import type { TemplateFields } from "@/lib/content/types";
import {
  BottomBar,
  ImagePanel,
  TemplateFrame,
  TextCard,
  Watermark,
  brand,
  compactText,
  displayHeadline,
  safeText,
  safeUrl,
} from "./shared";

export function FounderStoryTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(
    fields.headline,
    "What I learned building in public",
    72,
  );
  const subhead = compactText(
    fields.subhead,
    "Notes from turning ideas into products.",
    112,
  );
  const quote = displayHeadline(
    fields.pull_quote,
    "Build the trust before the feature",
    62,
  );
  const image = safeUrl(fields.portrait_url) || safeUrl(fields.hero_image_url);

  return (
    <TemplateFrame
      chip={safeText(fields.bottom_label, "BUILDING IN PUBLIC")}
      accent={brand.lime}
    >
      {image ? <ImagePanel src={image} height={500} /> : null}
      <div
        style={{
          position: "absolute",
          left: 112,
          top: image ? 668 : 178,
          width: 760,
          padding: "24px 28px",
          backgroundColor: "rgba(0,0,0,0.54)",
          borderLeft: `6px solid ${brand.lime}`,
          color: brand.lime,
          fontSize: quote.length > 44 ? 34 : 42,
          lineHeight: 1.05,
          fontWeight: 900,
          textTransform: "uppercase",
          zIndex: 3,
        }}
      >
        {quote}
      </div>
      <TextCard
        headline={headline}
        subhead={subhead}
        accent={brand.lime}
        top={image ? 800 : 420}
      />
      <BottomBar label={safeText(fields.swipe_hint, "Founder note")} />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
