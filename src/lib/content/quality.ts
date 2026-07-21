import "server-only";

import type { GeneratedContent } from "@/lib/content/types";

export type QualityGateInput = {
  content: GeneratedContent;
};

export type QualityGateResult =
  | {
      ok: true;
      notes: string[];
    }
  | {
      ok: false;
      failures: string[];
    };

export function validateGeneratedContentQuality({
  content,
}: QualityGateInput): QualityGateResult {
  const failures = [
    ...validateCaptionStructure(content.caption),
    ...validatePlatformTransformation(content),
  ];

  if (failures.length) {
    return { ok: false, failures };
  }

  return { ok: true, notes: [] };
}

// Protocol and app-step posts legitimately run to six numbered steps, so the
// ceiling is 6, not 5 — the batch seeds ("5-6 steps", "6 numbered in-app
// steps") and this gate must agree or generation deadlocks in repair passes.
export const CAPTION_MIN_BULLETS = 3;
export const CAPTION_MAX_BULLETS = 6;

function validateCaptionStructure(caption: string) {
  const failures: string[] = [];
  const contentLines = getContentLines(caption);
  const bulletLines = contentLines.filter(isBulletLine);

  if (contentLines.length < 4) {
    failures.push("Caption is too thin. Use a hook, short tension, bullets, and ending.");
  }

  if (
    bulletLines.length < CAPTION_MIN_BULLETS ||
    bulletLines.length > CAPTION_MAX_BULLETS
  ) {
    failures.push(
      `Caption must include ${CAPTION_MIN_BULLETS}-${CAPTION_MAX_BULLETS} bullet lines, found ${bulletLines.length}. Start each bullet on its own line with "-", "•", or a number like "1.".`,
    );
  }

  return failures;
}

function validatePlatformTransformation(content: GeneratedContent) {
  const failures: string[] = [];
  const caption = normalizeForSimilarity(content.caption);
  const xVersion = normalizeForSimilarity(content.x_version);
  const linkedinVersion = normalizeForSimilarity(content.linkedin_version);

  if (content.x_version.length > 280) {
    failures.push("X version must stay under 280 characters.");
  }

  if (xVersion && caption.includes(xVersion)) {
    failures.push("X version is copied from Instagram instead of compressed.");
  }

  if (linkedinVersion && linkedinVersion === caption) {
    failures.push("LinkedIn version must be transformed, not reused from Instagram.");
  }

  return failures;
}

function getContentLines(caption: string) {
  return caption
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isMostlyHashtags(line));
}

// Models write bullets with more markers than "-": em dashes, asterisks,
// arrows, and check glyphs all appear in otherwise-valid captions. Missing a
// marker here undercounts bullets and rejects real output, so match every
// marker the generators actually produce, plus "1." / "1)" / "Step 1" steps.
function isBulletLine(line: string) {
  return (
    /^[-–—•▸›→✓✔☑✅]\s*\S/.test(line) ||
    /^\*\s+\S/.test(line) ||
    /^\d+[.):]\s*\S/.test(line) ||
    /^step\s+\d+\b/i.test(line)
  );
}

function isMostlyHashtags(value: string) {
  const tokens = value.split(/\s+/).filter(Boolean);

  if (!tokens.length) {
    return false;
  }

  return tokens.filter((token) => token.startsWith("#")).length / tokens.length > 0.6;
}

function normalizeForSimilarity(value: string) {
  return value
    .toLowerCase()
    .replace(/#[a-z0-9_]+/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
