import type { TemplateFields, TemplateType } from "@/lib/content/types";
import { RallioTemplate } from "@/templates/rallio-templates";

export function TemplateRenderer({
  fields,
}: {
  templateType?: TemplateType;
  fields: TemplateFields;
}) {
  return <RallioTemplate fields={fields} />;
}
