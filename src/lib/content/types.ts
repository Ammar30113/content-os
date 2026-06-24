import { z } from "zod";

export const platforms = ["instagram", "x", "linkedin"] as const;
export const brandSlugs = ["rallio", "signal"] as const;
export const postTypes = ["single", "carousel", "reel", "thread"] as const;
export const tones = [
  "educational",
  "founder",
  "contrarian",
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
export const rallioCtaDoors = [
  "founding_supporter",
  "local_guide",
  "ossington_30_guide",
  "claim_your_business",
  "app_download_supporter",
  "app_download_owner",
  "city_request",
] as const;
export const rallioContentTypes = [
  "participation_single",
  "supporter_steps_carousel",
  "owner_steps_carousel",
  "manifesto_reel",
  "spot_carousel",
  "receipt_single",
  "regular_quote",
  "owner_claim_carousel",
  "bts_story_sequence",
] as const;
export const rallioTemplateTypes = [
  "rallio_manifesto",
  "rallio_spot_carousel",
  "rallio_receipt",
  "rallio_regular_quote",
  "rallio_owner_claim",
  "rallio_steps",
] as const;
export const signalCtaDoors = [
  "app_download",
  "sos_protocol",
  "check_in",
  "pattern_map",
  "privacy_first",
  "identity_anchor",
] as const;
export const signalContentTypes = [
  "discipline_quote",
  "urge_reset_protocol",
  "pattern_awareness",
  "identity_anchor",
  "privacy_first",
  "slip_review",
  "app_feature_steps",
] as const;
export const signalTemplateTypes = [
  "signal_quote",
  "signal_protocol",
  "signal_state",
  "signal_pattern",
  "signal_privacy",
  "signal_steps",
] as const;
export const imageModes = ["template", "uploaded"] as const;
export const videoStatuses = [
  "not_required",
  "missing",
  "uploaded",
  "failed",
] as const;
export const videoSources = ["manual_url", "upload"] as const;
export const postStatuses = [
  "draft",
  "reviewing",
  "approved",
  "scheduled",
  "published",
  "failed",
  "archived",
] as const;

export const rallioLocalSignalSchema = z.object({
  id: z.string(),
  spot_name: z.string(),
  neighborhood: z.string(),
  street: z.string(),
  category: z.string(),
  signature_order: z.string(),
  sensory_detail: z.string(),
  regular_quote: z.string(),
  regular_name: z.string(),
  regular_since_year: z.string(),
  participation_prompt: z.string(),
  cta_door: z.enum(rallioCtaDoors),
  source_status: z.string(),
});

export const batchAngleSchema = z.object({
  index: z.number().int().min(1).max(20),
  brand_slug: z.enum(brandSlugs).optional().default("rallio"),
  working_title: z.string(),
  pillar: z.enum(templateTypes),
  template_type: z.enum(templateTypes),
  hook_direction: z.string(),
  audience_pain_point: z.string(),
  unique_takeaway: z.string(),
  caption_structure: z.string(),
  do_not_repeat: z.string(),
  rallio_template_type: z.enum(rallioTemplateTypes).nullable(),
  rallio_content_type: z.enum(rallioContentTypes).nullable(),
  rallio_cta_door: z.enum(rallioCtaDoors).nullable(),
  rallio_visual_style: z.string().nullable(),
  rallio_kpi_intent: z.string().nullable(),
  rallio_signal: rallioLocalSignalSchema.nullable().optional(),
  participation_prompt: z.string().nullable().optional(),
  signal_template_type: z.enum(signalTemplateTypes).nullable().optional(),
  signal_content_type: z.enum(signalContentTypes).nullable().optional(),
  signal_cta_door: z.enum(signalCtaDoors).nullable().optional(),
  signal_visual_style: z.string().nullable().optional(),
  signal_kpi_intent: z.string().nullable().optional(),
});

export const recentContextSchema = z.object({
  generated_so_far: z
    .array(
      z.object({
        hook: z.string().nullable().optional(),
        headline: z.string().nullable().optional(),
        pillar: z.string().nullable().optional(),
        local_signal_id: z.string().nullable().optional(),
        business_name: z.string().nullable().optional(),
        spot_category: z.string().nullable().optional(),
        launch_neighborhood: z.string().nullable().optional(),
        regular_quote: z.string().nullable().optional(),
        participation_prompt: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
});

export const ideaInputSchema = z
  .object({
    idea_id: z.string().uuid().optional(),
    brand_slug: z.enum(brandSlugs).optional().default("rallio"),
    title: z.string().trim().min(3, "Add a sharper idea title."),
    brief: z.string().trim().default(""),
    source_url: z.string().trim().url().optional().or(z.literal("")),
    platform: z.enum(platforms),
    selected_platforms: z
      .array(z.enum(platforms))
      .min(1)
      .optional()
      .default(["instagram"]),
    post_type: z.enum(postTypes),
    tone: z.enum(tones),
    template_hint: z.enum(templateHints),
    quantity: z.coerce.number().int().min(1).max(20).optional().default(1),
    generation_count: z.coerce.number().int().min(1).max(20).optional().default(1),
    generation_index: z.coerce.number().int().min(1).max(20).optional().default(1),
    reference_image_url: z.string().trim().url().optional().or(z.literal("")),
    reference_image_asset_id: z.string().uuid().optional(),
    image_mode: z.enum(imageModes).optional().default("template"),
    roulette_seed_id: z.string().trim().optional().or(z.literal("")),
    rallio_content_type: z.enum(rallioContentTypes).optional(),
    rallio_cta_door: z.enum(rallioCtaDoors).optional(),
    rallio_template_type: z.enum(rallioTemplateTypes).optional(),
    rallio_visual_style: z.string().trim().optional().or(z.literal("")),
    rallio_kpi_intent: z.string().trim().optional().or(z.literal("")),
    rallio_signal: rallioLocalSignalSchema.optional(),
    participation_prompt: z.string().trim().optional().or(z.literal("")),
    signal_content_type: z.enum(signalContentTypes).optional(),
    signal_cta_door: z.enum(signalCtaDoors).optional(),
    signal_template_type: z.enum(signalTemplateTypes).optional(),
    signal_visual_style: z.string().trim().optional().or(z.literal("")),
    signal_kpi_intent: z.string().trim().optional().or(z.literal("")),
    batch_angle: batchAngleSchema.optional(),
    recent_context: recentContextSchema.optional(),
  })
  .superRefine((input, ctx) => {
    if (input.post_type === "reel" && input.brand_slug !== "rallio") {
      ctx.addIssue({
        code: "custom",
        path: ["post_type"],
        message: "Reels are only available for Rallio.",
      });
    }

    if (input.brief.trim().length < 10) {
      ctx.addIssue({
        code: "custom",
        path: ["brief"],
        message: "Add a little more context.",
      });
    }
  });

export const templateFieldsSchema = z
  .object({
    headline: z.string().optional(),
    subhead: z.string().optional(),
    reference_image_url: z.string().optional(),
    reference_image_asset_id: z.string().optional(),
    selected_platforms: z.array(z.enum(platforms)).optional(),
    brand_slug: z.enum(brandSlugs).optional(),
    brand_handle: z.string().optional(),
    launch_neighborhood: z.string().optional(),
    category_focus: z.string().optional(),
    cta_door: z.enum(rallioCtaDoors).optional(),
    content_type: z.enum(rallioContentTypes).optional(),
    visual_style: z.string().optional(),
    rallio_template_type: z.enum(rallioTemplateTypes).optional(),
    door_label: z.string().optional(),
    bio_rotation_hint: z.string().optional(),
    kpi_intent: z.string().optional(),
    business_name: z.string().optional(),
    spot_category: z.string().optional(),
    spot_address: z.string().optional(),
    spot_list_name: z.string().optional(),
    spot_list_position: z.string().optional(),
    spot_list_total: z.string().optional(),
    recommender_quote: z.string().optional(),
    recommender_name: z.string().optional(),
    recommender_neighborhood: z.string().optional(),
    recommender_since: z.string().optional(),
    regular_quote: z.string().optional(),
    regular_neighborhood: z.string().optional(),
    regular_since_year: z.string().optional(),
    carousel_page: z.string().optional(),
    carousel_total: z.string().optional(),
    carousel_role: z.enum(["value", "gap", "close"]).optional(),
    receipt_lines: z.array(z.string()).optional(),
    subtotal: z.string().optional(),
    supporter_steps: z.array(z.string()).optional(),
    owner_steps: z.array(z.string()).optional(),
    step_audience: z.enum(["supporter", "owner"]).optional(),
    info_rows: z.array(z.string()).optional(),
    quote: z.string().optional(),
    attribution: z.string().optional(),
    bottom_label: z.string().optional(),
    review_notes: z.string().optional(),
    local_signal_id: z.string().optional(),
    source_status: z.string().optional(),
    signature_order: z.string().optional(),
    sensory_detail: z.string().optional(),
    participation_prompt: z.string().optional(),
    signal_template_type: z.enum(signalTemplateTypes).optional(),
    signal_content_type: z.enum(signalContentTypes).optional(),
    signal_cta_door: z.enum(signalCtaDoors).optional(),
    signal_visual_style: z.string().optional(),
    signal_kpi_intent: z.string().optional(),
    signal_state: z.enum(["green", "yellow", "red"]).optional(),
    signal_protocol_steps: z.array(z.string()).optional(),
    signal_trigger: z.string().optional(),
    signal_redirect_action: z.string().optional(),
    signal_identity_line: z.string().optional(),
    signal_privacy_line: z.string().optional(),
    signal_principle: z.string().optional(),
    signal_app_feature: z.string().optional(),
    reel_hook: z.string().optional(),
    reel_duration_seconds: z.number().optional(),
    reel_beats: z.array(z.string()).optional(),
    reel_shot_list: z.array(z.string()).optional(),
    reel_on_screen_text: z.array(z.string()).optional(),
    reel_voiceover: z.array(z.string()).optional(),
    reel_audio_direction: z.string().optional(),
    reel_cover_text: z.string().optional(),
    image_mode: z.enum(imageModes).optional(),
  })
  .passthrough();

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
  video_url: z.string().trim().url().nullable().optional().or(z.literal("")),
  video_status: z.enum(videoStatuses).optional(),
  video_error: z.string().nullable().optional(),
  video_source: z.enum(videoSources).nullable().optional(),
  status: z.enum(postStatuses),
  scheduled_for: z.string().nullable().optional(),
});

export type IdeaInput = z.infer<typeof ideaInputSchema>;
export type BatchAngle = z.infer<typeof batchAngleSchema>;
export type GeneratedContent = z.infer<typeof generatedContentSchema>;
export type TemplateFields = z.infer<typeof templateFieldsSchema>;
export type Platform = (typeof platforms)[number];
export type BrandSlug = (typeof brandSlugs)[number];
export type PostType = (typeof postTypes)[number];
export type Tone = (typeof tones)[number];
export type TemplateType = (typeof templateTypes)[number];
export type RallioCtaDoor = (typeof rallioCtaDoors)[number];
export type RallioContentType = (typeof rallioContentTypes)[number];
export type RallioTemplateType = (typeof rallioTemplateTypes)[number];
export type SignalCtaDoor = (typeof signalCtaDoors)[number];
export type SignalContentType = (typeof signalContentTypes)[number];
export type SignalTemplateType = (typeof signalTemplateTypes)[number];
export type RallioLocalSignal = z.infer<typeof rallioLocalSignalSchema>;
export type VideoStatus = (typeof videoStatuses)[number];
export type VideoSource = (typeof videoSources)[number];

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
