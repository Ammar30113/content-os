import "server-only";

import type { GeneratedContent, TemplateFields } from "@/lib/content/types";

export type ContentContrast = {
  group_1: string;
  group_2: string;
  differences: string[];
};

export type ViralityScore = {
  tension: number;
  clarity: number;
  usefulness: number;
  memorability: number;
  total: number;
  revision_notes: string;
};

export type QualityGateInput = {
  content: GeneratedContent;
  contrast: ContentContrast;
  viralityScore: ViralityScore;
  visualAlignmentNote: string;
  templateFields: TemplateFields;
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

const bannedPhrases = [
  "ai is a tool",
  "use it wisely",
  "embrace the future",
  "stay ahead",
  "leverage effectively",
  "unlock the power",
  "take your ai game",
  "game-changing",
  "ready to level up",
  "in today's fast-paced",
  "the future is here",
  "work smarter not harder",
];

const weakEndings = [
  "it's time to improve",
  "it is time to improve",
  "stay ahead",
  "keep learning",
  "embrace the future",
  "level up",
  "use it wisely",
];

const vagueDifferenceTerms = [
  "casual users",
  "advanced users",
  "better users",
  "smarter users",
  "more advanced",
  "efficient",
  "effective",
  "wisely",
  "properly",
  "responsibly",
];

const actionVerbs = [
  "accepts",
  "adds",
  "asks",
  "audits",
  "builds",
  "checks",
  "compares",
  "copies",
  "defines",
  "documents",
  "edits",
  "gives",
  "maps",
  "measures",
  "pastes",
  "prompts",
  "rejects",
  "reviews",
  "rewrites",
  "runs",
  "ships",
  "tests",
  "tracks",
  "turns",
  "uses",
  "writes",
];

export function validateGeneratedContentQuality({
  content,
  contrast,
  viralityScore,
  visualAlignmentNote,
  templateFields,
}: QualityGateInput): QualityGateResult {
  const failures = [
    ...validateGenericPhrases(content),
    ...validateCaptionStructure(content.caption),
    ...validateEnding(content.caption),
    ...validateContrast(contrast),
    ...validatePlatformTransformation(content),
    ...validateVisualAlignment(content, templateFields, visualAlignmentNote),
    ...validateViralityScore(viralityScore),
  ];

  if (failures.length) {
    return {
      ok: false,
      failures,
    };
  }

  return {
    ok: true,
    notes: [
      `contrast: ${contrast.group_1} vs ${contrast.group_2}`,
      `virality_score: ${viralityScore.total}/40`,
      visualAlignmentNote,
    ].filter(Boolean),
  };
}

function validateGenericPhrases(content: GeneratedContent) {
  const text = [
    content.hook,
    content.headline,
    content.subhead,
    content.caption,
    content.x_version,
    content.linkedin_version,
    content.cta,
  ]
    .join("\n")
    .toLowerCase();

  return bannedPhrases
    .filter((phrase) => text.includes(phrase))
    .map((phrase) => `Banned generic phrase detected: "${phrase}".`);
}

function validateCaptionStructure(caption: string) {
  const failures: string[] = [];
  const contentLines = getContentLines(caption);
  const bulletLines = contentLines.filter(isBulletLine);
  const paragraphs = caption
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !isMostlyHashtags(paragraph));

  if (contentLines.length < 6) {
    failures.push("Instagram caption is too thin. Use hook, tension, 3-5 bullets, and ending.");
  }

  if (bulletLines.length < 3 || bulletLines.length > 5) {
    failures.push("Instagram caption must include 3-5 behavioral bullet points.");
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length > 280) {
      failures.push("Caption has a long text block. Keep every paragraph to 1-2 short lines.");
      break;
    }
  }

  return failures;
}

function validateEnding(caption: string) {
  const finalLine = getFinalContentLine(caption).toLowerCase();

  if (!finalLine) {
    return ["Caption needs a strong final line."];
  }

  if (weakEndings.some((ending) => finalLine.includes(ending))) {
    return [`Weak ending rejected: "${getFinalContentLine(caption)}".`];
  }

  const hasReframe =
    /(this|it) (isn.t|is not) .{2,80}\. (it.s|it is) .{2,120}/i.test(finalLine);
  const hasInsight = finalLine.includes("most people don't realize this") ||
    finalLine.includes("most people don’t realize this");
  const hasFilter = finalLine.includes("this is where most people lose");

  if (!hasReframe && !hasInsight && !hasFilter) {
    return [
      "Final line must be a reframe, insight, or filter ending. Example: This isn't X. It's Y.",
    ];
  }

  return [];
}

function validateContrast(contrast: ContentContrast) {
  const failures: string[] = [];

  if (!contrast.group_1 || !contrast.group_2) {
    failures.push("Contrast needs group_1 and group_2.");
  }

  if (contrast.group_1.toLowerCase() === contrast.group_2.toLowerCase()) {
    failures.push("Contrast groups must be meaningfully different.");
  }

  if (contrast.differences.length < 3 || contrast.differences.length > 5) {
    failures.push("Contrast needs 3-5 concrete behavioral differences.");
  }

  for (const difference of contrast.differences) {
    const normalized = difference.toLowerCase();
    const hasVagueTerm = vagueDifferenceTerms.some((term) =>
      normalized.includes(term),
    );
    const hasActionVerb = actionVerbs.some((verb) =>
      new RegExp(`\\b${verb}\\b`).test(normalized),
    );

    if (hasVagueTerm) {
      failures.push(`Contrast difference is vague: "${difference}".`);
    }

    if (!hasActionVerb) {
      failures.push(`Contrast difference must describe an action: "${difference}".`);
    }
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

function validateVisualAlignment(
  content: GeneratedContent,
  fields: TemplateFields,
  visualAlignmentNote: string,
) {
  const failures: string[] = [];
  const caption = content.caption.toLowerCase();
  const alignmentNote = visualAlignmentNote.trim();

  if (!alignmentNote) {
    failures.push("Visual alignment note is required.");
  }

  if (fields.code_snippet && !/(prompt|recipe|framework|step|workflow)/i.test(caption)) {
    failures.push("Caption must reference the prompt/framework shown in the image.");
  }

  if (
    fields.tools?.length &&
    !fields.tools.some((tool) => caption.includes(tool.toLowerCase())) &&
    !caption.includes("stack")
  ) {
    failures.push("Caption must expand the tools/stack shown in the image.");
  }

  if (fields.step_number && !/(step|first|next|then)/i.test(caption)) {
    failures.push("Caption must expand the step shown in the image.");
  }

  return failures;
}

function validateViralityScore(score: ViralityScore) {
  const failures: string[] = [];

  if (score.tension < 7) {
    failures.push("Virality score tension is below 7.");
  }

  if (score.clarity < 7) {
    failures.push("Virality score clarity is below 7.");
  }

  if (score.usefulness < 7) {
    failures.push("Virality score usefulness is below 7.");
  }

  if (score.memorability < 7) {
    failures.push("Virality score memorability is below 7.");
  }

  if (score.total < 30) {
    failures.push("Total virality score must be at least 30/40.");
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

function getFinalContentLine(caption: string) {
  return getContentLines(caption).at(-1) || "";
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
