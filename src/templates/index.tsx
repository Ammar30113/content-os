import type { TemplateFields, TemplateType } from "@/lib/content/types";
import { CreatorEconomyTemplate } from "@/templates/creator-economy-template";
import { FounderStoryTemplate } from "@/templates/founder-story-template";
import { NewsDigestTemplate } from "@/templates/news-digest-template";
import { ToolStackTemplate } from "@/templates/tool-stack-template";
import { TutorialTemplate } from "@/templates/tutorial-template";

export function TemplateRenderer({
  templateType,
  fields,
}: {
  templateType: TemplateType;
  fields: TemplateFields;
}) {
  if (templateType === "tool_stack") {
    return <ToolStackTemplate fields={fields} />;
  }

  if (templateType === "tutorial") {
    return <TutorialTemplate fields={fields} />;
  }

  if (templateType === "creator_economy") {
    return <CreatorEconomyTemplate fields={fields} />;
  }

  if (templateType === "founder_story") {
    return <FounderStoryTemplate fields={fields} />;
  }

  return <NewsDigestTemplate fields={fields} />;
}
