import { z } from "zod";

export const platforms = ["instagram", "x", "linkedin"] as const;
export const postTypes = ["single", "carousel", "reel", "thread"] as const;
export const tones = [
  "educational",
  "viral",
  "founder",
  "contrarian",
  "news",
  "tutorial",
] as const;
export const templateTypes = [
  "news_digest",
  "tool_stack",
  "tutorial",
  "creator_economy",
  "founder_story",
  "meme",
] as const;
export const templateHints = ["auto", ...templateTypes] as const;
export const postQuantities = ["1", "3", "5", "10", "20"] as const;
export const ctaIntents = ["follow", "rallio", "quotestack"] as const;
export const imageModes = ["template", "uploaded"] as const;
export const postStatuses = [
  "draft",
  "reviewing",
  "approved",
  "scheduled",
  "published",
  "failed",
  "archived",
] as const;

export const batchAngleSchema = z.object({
  index: z.number().int().min(1).max(20),
  working_title: z.string(),
  pillar: z.enum(templateTypes),
  template_type: z.enum(templateTypes),
  hook_direction: z.string(),
  audience_pain_point: z.string(),
  unique_takeaway: z.string(),
  caption_structure: z.string(),
  cta_intent: z.enum(ctaIntents),
  do_not_repeat: z.string(),
  meme_trend_title: z.string().nullable(),
  meme_trend_source: z.string().nullable(),
  meme_format: z.string().nullable(),
  meme_adaptation: z.string().nullable(),
});

export const recentContextSchema = z.object({
  generated_so_far: z
    .array(
      z.object({
        hook: z.string().nullable().optional(),
        headline: z.string().nullable().optional(),
        pillar: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
});

export const ideaInputSchema = z.object({
  idea_id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Add a sharper idea title."),
  brief: z.string().trim().min(10, "Add a little more context."),
  source_url: z.string().trim().url().optional().or(z.literal("")),
  platform: z.enum(platforms),
  selected_platforms: z.array(z.enum(platforms)).min(1).optional().default(["instagram"]),
  post_type: z.enum(postTypes),
  tone: z.enum(tones),
  template_hint: z.enum(templateHints),
  quantity: z.coerce.number().int().min(1).max(20).optional().default(1),
  generation_count: z.coerce.number().int().min(1).max(20).optional().default(1),
  generation_index: z.coerce.number().int().min(1).max(20).optional().default(1),
  reference_image_url: z.string().trim().url().optional().or(z.literal("")),
  reference_image_asset_id: z.string().uuid().optional(),
  image_mode: z.enum(imageModes).optional().default("template"),
  batch_angle: batchAngleSchema.optional(),
  recent_context: recentContextSchema.optional(),
});

export const templateFieldsSchema = z.object({
  headline: z.string().optional(),
  subhead: z.string().optional(),
  source_name: z.string().optional(),
  source_logo: z.string().optional(),
  source_logo_url: z.string().optional(),
  date: z.string().optional(),
  hero_image_url: z.string().optional(),
  reference_image_url: z.string().optional(),
  reference_image_asset_id: z.string().optional(),
  selected_platforms: z.array(z.enum(platforms)).optional(),
  image_mode: z.enum(imageModes).optional(),
  product_logo: z.string().optional(),
  visual_subject: z.string().optional(),
  swipe_hint: z.string().optional(),
  bottom_label: z.string().optional(),
  tools: z.array(z.string()).optional(),
  tool_logos: z.array(z.string()).optional(),
  step_number: z.string().optional(),
  code_snippet: z.string().optional(),
  stat: z.string().optional(),
  quote: z.string().optional(),
  attribution: z.string().optional(),
  pull_quote: z.string().optional(),
  meme_setup: z.string().optional(),
  meme_punchline: z.string().optional(),
  portrait_url: z.string().optional(),
});

export const generatedContentSchema = z.object({
  pillar: z.enum(templateTypes),
  template_type: z.enum(templateTypes),
  hook: z.string(),
  headline: z.string(),
  subhead: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  cta: z.string(),
  carousel_slides: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
    }),
  ),
  reel_script: z.string(),
  x_version: z.string(),
  linkedin_version: z.string(),
  image_prompt: z.string(),
  template_fields: templateFieldsSchema,
});

export const postUpdateSchema = z.object({
  hook: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  subhead: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
  cta: z.string().nullable().optional(),
  carousel_slides: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
    }),
  ),
  reel_script: z.string().nullable().optional(),
  x_version: z.string().nullable().optional(),
  linkedin_version: z.string().nullable().optional(),
  template_type: z.enum(templateTypes).nullable().optional(),
  template_fields: templateFieldsSchema,
  image_url: z.string().nullable().optional(),
  status: z.enum(postStatuses),
  scheduled_for: z.string().nullable().optional(),
});

export type IdeaInput = z.infer<typeof ideaInputSchema>;
export type BatchAngle = z.infer<typeof batchAngleSchema>;
export type GeneratedContent = z.infer<typeof generatedContentSchema>;
export type TemplateFields = z.infer<typeof templateFieldsSchema>;
export type TemplateType = (typeof templateTypes)[number];

export function normalizeHashtags(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
  }

  if (!value) {
    return [];
  }

  return value
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

export function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function formatTemplateName(value: string | null | undefined) {
  if (!value) {
    return "Auto";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
