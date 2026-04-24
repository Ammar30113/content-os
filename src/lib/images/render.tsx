import "server-only";

import { ImageResponse } from "@vercel/og";

import type { TemplateFields, TemplateType } from "@/lib/content/types";
import { TemplateRenderer } from "@/templates";
import { CANVAS_SIZE } from "@/templates/shared";

export async function renderTemplatePng(
  templateType: TemplateType,
  fields: TemplateFields,
) {
  const response = new ImageResponse(
    <TemplateRenderer templateType={templateType} fields={fields} />,
    {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
    },
  );

  return Buffer.from(await response.arrayBuffer());
}
