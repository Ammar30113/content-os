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

export function NewsDigestTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(fields.headline, "AI just shifted again", 74);
  const subhead = compactText(
    fields.subhead,
    "What changed, why it matters, and what to do next.",
    112,
  );
  const sourceName = safeText(fields.source_name, "WORD OF AI");
  const heroImage = safeUrl(fields.hero_image_url);
  const date = safeText(fields.date, "");

  return (
    <TemplateFrame chip={safeText(fields.bottom_label, "AI NEWS")} accent={brand.lime}>
      {heroImage ? <ImagePanel src={heroImage} height={540} /> : null}
      <TextCard
        eyebrow={date ? `${sourceName} / ${date}` : sourceName}
        headline={headline}
        subhead={subhead}
        accent={brand.lime}
        top={heroImage ? 720 : 206}
      />
      <BottomBar label={safeText(fields.swipe_hint, "Swipe for context")} />
      <Watermark align="right" />
    </TemplateFrame>
  );
}
