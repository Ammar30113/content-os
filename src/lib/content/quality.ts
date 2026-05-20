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

function validateCaptionStructure(caption: string) {
  const failures: string[] = [];
  const contentLines = getContentLines(caption);
  const bulletLines = contentLines.filter(isBulletLine);

  if (contentLines.length < 4) {
    failures.push("Caption is too thin. Use a hook, short tension, bullets, and ending.");
  }

  if (bulletLines.length < 3 || bulletLines.length > 5) {
    failures.push("Caption must include 3-5 bullets.");
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

function isBulletLine(line: string) {
  return /^[-–•]\s+\S/.test(line) || /^\d+[.)]\s+\S/.test(line);
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
