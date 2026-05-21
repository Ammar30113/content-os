import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/dist/compiled/@vercel/og/index.node.js";
import sharp from "sharp";

import type { TemplateFields, TemplateType } from "@/lib/content/types";
import { TemplateRenderer } from "@/templates";
import { CANVAS_SIZE } from "@/templates/shared";

const FONTS_DIR = join(process.cwd(), "src", "lib", "fonts");

const fonts = [
  {
    name: "Fraunces",
    data: readFileSync(join(FONTS_DIR, "Fraunces.ttf")),
    weight: 800 as const,
    style: "normal" as const,
  },
  {
    name: "Fraunces",
    data: readFileSync(join(FONTS_DIR, "Fraunces-Italic.ttf")),
    weight: 600 as const,
    style: "italic" as const,
  },
  {
    name: "Manrope",
    data: readFileSync(join(FONTS_DIR, "Manrope.otf")),
    weight: 700 as const,
    style: "normal" as const,
  },
  {
    name: "JetBrains Mono",
    data: readFileSync(join(FONTS_DIR, "JetBrainsMono.ttf")),
    weight: 700 as const,
    style: "normal" as const,
  },
];

export async function renderTemplatePng(
  templateType: TemplateType,
  fields: TemplateFields,
) {
  const response = new ImageResponse(
    <TemplateRenderer templateType={templateType} fields={fields} />,
    {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      fonts,
    },
  );

  return Buffer.from(await response.arrayBuffer());
}

export async function renderTemplateJpeg(
  templateType: TemplateType,
  fields: TemplateFields,
) {
  const pngBuffer = await renderTemplatePng(templateType, fields);

  return convertImageToInstagramJpeg(pngBuffer);
}

export async function convertImageToInstagramJpeg(input: Buffer) {
  return sharp(input)
    .rotate()
    .resize(CANVAS_SIZE, CANVAS_SIZE, { fit: "cover" })
    .flatten({ background: "#0a0a0b" })
    .toColorspace("srgb")
    .jpeg({
      quality: 90,
      progressive: false,
      chromaSubsampling: "4:2:0",
    })
    .toBuffer();
}
