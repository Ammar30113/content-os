import assert from "node:assert/strict";
import test from "node:test";

import sharp from "sharp";

import {
  convertImageToInstagramJpeg,
  convertTemplateToInstagramJpeg,
} from "../src/lib/images/render";

const PORTRAIT_WIDTH = 1080;
const PORTRAIT_HEIGHT = 1350; // 4:5, Instagram's 2026 feed + grid-safe size

async function solidSquare(background: string) {
  return sharp({
    create: { width: 1080, height: 1080, channels: 3, background },
  })
    .png()
    .toBuffer();
}

test("templates are padded to a 4:5 portrait (never cropped)", async () => {
  const output = await convertTemplateToInstagramJpeg(await solidSquare("#0a0a0b"));
  const meta = await sharp(output).metadata();

  assert.equal(meta.width, PORTRAIT_WIDTH);
  assert.equal(meta.height, PORTRAIT_HEIGHT);
});

test("uploaded images are covered to the same 4:5 portrait", async () => {
  const landscape = await sharp({
    create: { width: 1600, height: 900, channels: 3, background: "#3b6ea5" },
  })
    .png()
    .toBuffer();

  const output = await convertImageToInstagramJpeg(landscape);
  const meta = await sharp(output).metadata();

  assert.equal(meta.width, PORTRAIT_WIDTH);
  assert.equal(meta.height, PORTRAIT_HEIGHT);
});
