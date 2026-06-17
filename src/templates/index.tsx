import type { TemplateFields, TemplateType } from "@/lib/content/types";
import { RallioTemplate } from "@/templates/rallio-templates";
import { SignalTemplate } from "@/templates/signal-templates";

export function TemplateRenderer({
  fields,
}: {
  templateType?: TemplateType;
  fields: TemplateFields;
}) {
  if (fields.brand_slug === "signal" || fields.signal_template_type) {
    return <SignalTemplate fields={fields} />;
  }

  return <RallioTemplate fields={fields} />;
}
