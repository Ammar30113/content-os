import type { TemplateFields } from "@/lib/content/types";
import {
  BottomHeadlineBand,
  HeroVisual,
  TemplateFrame,
  Watermark,
  brand,
  displayHeadline,
  safeText,
  safeUrl,
} from "./shared";

export function FounderStoryTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(
    fields.headline,
    "What I learned building in public",
    88,
  );
  const portrait = safeUrl(fields.portrait_url) || safeUrl(fields.hero_image_url);
  const pullQuote = safeText(fields.pull_quote, "Build the trust before the feature");

  return (
    <TemplateFrame
      chip={safeText(fields.bottom_label, "BUILDING IN PUBLIC")}
      accent={brand.lime}
    >
      <HeroVisual
        src={portrait}
        subject={safeText(fields.visual_subject, "FOUNDER NOTE")}
        sourceName={safeText(fields.attribution, "WORD OF AI")}
        accent={brand.lime}
        variant="founder"
        height={708}
      />
      <div
        style={{
          position: "absolute",
          left: 86,
          top: 198,
          width: 430,
          padding: "28px 30px",
          backgroundColor: "rgba(0,0,0,0.72)",
          border: "2px solid rgba(212,255,0,0.48)",
          color: brand.lime,
          fontSize: pullQuote.length > 58 ? 31 : 40,
          lineHeight: 1.06,
          fontWeight: 900,
          textTransform: "uppercase",
          zIndex: 4,
        }}
      >
        {`"${pullQuote}"`}
      </div>
      <BottomHeadlineBand
        headline={headline}
        subhead={safeText(fields.subhead, "Notes from turning ideas into products.")}
        label={safeText(fields.swipe_hint, "Founder note")}
        accent={brand.lime}
        minHeight={326}
      />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
