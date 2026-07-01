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

// Instagram's 2026 profile grid crops every thumbnail to 3:4 portrait, so a 1:1 square
// post loses roughly a third of its width on the grid. We output 4:5 portrait
// (1080x1350) instead: it is Instagram's native feed size, and the 3:4 grid only trims a
// thin, safe strip from the sides.
const OUTPUT_WIDTH = CANVAS_SIZE; // 1080
const OUTPUT_HEIGHT = 1350; // 4:5 portrait
const PORTRAIT_PAD = Math.round((OUTPUT_HEIGHT - CANVAS_SIZE) / 2); // 135 per band

const INSTAGRAM_JPEG = {
  quality: 90,
  progressive: false,
  chromaSubsampling: "4:2:0",
} as const;

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

  return convertTemplateToInstagramJpeg(pngBuffer);
}

// Templates render on a 1080x1080 brand-colored canvas with grid-safe inset content, so
// we PAD (never crop) up to 4:5 and replicate the solid brand-color edge into the new
// top/bottom bands — nothing in the design is lost and the bands stay seamless.
export async function convertTemplateToInstagramJpeg(input: Buffer) {
  return sharp(input)
    .rotate()
    .resize(CANVAS_SIZE, CANVAS_SIZE, { fit: "cover" })
    .extend({
      top: PORTRAIT_PAD,
      bottom: PORTRAIT_PAD,
      left: 0,
      right: 0,
      background: "#0a0a0b",
      extendWith: "copy",
    })
    .flatten({ background: "#0a0a0b" })
    .toColorspace("srgb")
    .jpeg(INSTAGRAM_JPEG)
    .toBuffer();
}

// Uploaded photos have no safe brand background to pad against, so we cover-crop them to
// the same 4:5 portrait frame that fills Instagram's feed and grid.
export async function convertImageToInstagramJpeg(input: Buffer) {
  return sharp(input)
    .rotate()
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: "cover" })
    .flatten({ background: "#0a0a0b" })
    .toColorspace("srgb")
    .jpeg(INSTAGRAM_JPEG)
    .toBuffer();
}
