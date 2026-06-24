import type { TemplateFields, TemplateType } from "@/lib/content/types";
import { RallioTemplate } from "@/templates/rallio-templates";
import { SignalTemplate } from "@/templates/signal-templates";

export function TemplateRenderer({
  fields,
}: {
  templateType?: TemplateType;
  fields: TemplateFields;
}) {
  // brand_slug is authoritative. A Rallio post must never render with the Signal
  // template even if a stray signal_* field leaked into its template fields, and
  // vice versa.
  if (fields.brand_slug === "rallio") {
    return <RallioTemplate fields={fields} />;
  }

  if (fields.brand_slug === "signal" || fields.signal_template_type) {
    return <SignalTemplate fields={fields} />;
  }

  return <RallioTemplate fields={fields} />;
}
