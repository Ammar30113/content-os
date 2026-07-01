import "server-only";

import sharp from "sharp";

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function validateImageUpload(file: File) {
  const extension =
    IMAGE_EXTENSIONS_BY_MIME[file.type as keyof typeof IMAGE_EXTENSIONS_BY_MIME];

  if (!extension) {
    throw new Error("Uploaded image must be JPEG, PNG, or WebP.");
  }

  if (!file.size) {
    throw new Error("Uploaded image is empty.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Uploaded image must be 10 MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Image dimensions could not be read.");
    }
  } catch {
    throw new Error("Uploaded file is not a valid image.");
  }

  return {
    buffer,
    contentType: file.type,
    extension,
  };
}
