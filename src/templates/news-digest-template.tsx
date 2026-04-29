import type { TemplateFields } from "@/lib/content/types";
import {
  BottomHeadlineBand,
  HeroVisual,
  SourceBadge,
  TemplateFrame,
  Watermark,
  brand,
  displayHeadline,
  safeText,
  safeUrl,
} from "./shared";

export function NewsDigestTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(fields.headline, "AI just shifted again", 96);
  const sourceName = safeText(fields.source_name, "WORD OF AI");
  const heroImage = safeUrl(fields.hero_image_url);
  const logo =
    safeUrl(fields.product_logo) ||
    safeUrl(fields.source_logo) ||
    safeUrl(fields.source_logo_url);

  return (
    <TemplateFrame chip={safeText(fields.bottom_label, "AI NEWS")} accent={brand.lime}>
      <HeroVisual
        src={heroImage}
        logo={logo}
        subject={safeText(fields.visual_subject, headline)}
        sourceName={sourceName}
        accent={brand.lime}
        variant="news"
        height={734}
      />
      <SourceBadge
        sourceName={sourceName}
        date={safeText(fields.date, "")}
        accent={brand.lime}
      />
      <BottomHeadlineBand
        headline={headline}
        subhead={safeText(fields.subhead, "What changed, why it matters, and what to do next.")}
        label={safeText(fields.swipe_hint, "Swipe for more")}
        accent={brand.lime}
        minHeight={318}
      />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
