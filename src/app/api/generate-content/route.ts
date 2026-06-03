import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { summarizeSourceUrl } from "@/lib/content/source";
import {
  enforceRallioCopySafety,
  mapRallioTemplateToCoreType,
  normalizeRallioCtaDoor,
  normalizeRallioMetadata,
  rallioSignalToTemplateFields,
  RALLIO_BRAND,
  RALLIO_SYSTEM_PROMPT,
} from "@/lib/content/rallio";
import { validateGeneratedContentQuality } from "@/lib/content/quality";
import {
  assertContentOsSupabaseWriteSafety,
  getOpenAIEnv,
} from "@/lib/env";
import {
  generatedContentSchema,
  ideaInputSchema,
  rallioContentTypes,
  rallioCtaDoors,
  rallioTemplateTypes,
  templateTypes,
} from "@/lib/content/types";
import type {
  RallioContentType,
  RallioCtaDoor,
  RallioLocalSignal,
  RallioTemplateType,
} from "@/lib/content/types";
import type { Json } from "@/types/database";

const openAITemplateFieldsSchema = z.object({
  headline: z.string(),
  subhead: z.string(),
  quote: z.string().nullable(),
  attribution: z.string().nullable(),
  bottom_label: z.string().nullable(),
  info_rows: z.array(z.string()).nullable(),
  review_notes: z.string().nullable(),
  brand_handle: z.string().nullable(),
  launch_neighborhood: z.string().nullable(),
  category_focus: z.string().nullable(),
  cta_door: z.enum(rallioCtaDoors).nullable(),
  content_type: z.enum(rallioContentTypes).nullable(),
  visual_style: z.string().nullable(),
  rallio_template_type: z.enum(rallioTemplateTypes).nullable(),
  door_label: z.string().nullable(),
  bio_rotation_hint: z.string().nullable(),
  kpi_intent: z.string().nullable(),
  business_name: z.string().nullable(),
  spot_category: z.string().nullable(),
  spot_address: z.string().nullable(),
  spot_list_name: z.string().nullable(),
  spot_list_position: z.string().nullable(),
  spot_list_total: z.string().nullable(),
  recommender_quote: z.string().nullable(),
  recommender_name: z.string().nullable(),
  recommender_neighborhood: z.string().nullable(),
  recommender_since: z.string().nullable(),
  regular_quote: z.string().nullable(),
  regular_neighborhood: z.string().nullable(),
  regular_since_year: z.string().nullable(),
  carousel_page: z.string().nullable(),
  carousel_total: z.string().nullable(),
  receipt_lines: z.array(z.string()).nullable(),
  subtotal: z.string().nullable(),
  supporter_steps: z.array(z.string()).nullable(),
  owner_steps: z.array(z.string()).nullable(),
  step_audience: z.enum(["supporter", "owner"]).nullable(),
  local_signal_id: z.string().nullable(),
  source_status: z.string().nullable(),
  signature_order: z.string().nullable(),
  sensory_detail: z.string().nullable(),
  participation_prompt: z.string().nullable(),
});

const openAIContentSchema = z.object({
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
  template_fields: openAITemplateFieldsSchema,
});

const recentPostSchema = z.object({
  headline: z.string().nullable(),
  hook: z.string().nullable(),
  pillar: z.string().nullable(),
});

type GeneratedContentPackage = z.infer<typeof generatedContentSchema>;

const rallioFallbackHashtags = [
  "#toronto",
  "#torontofood",
  "#torontofoodie",
  "#torontolife",
  "#torontorestaurants",
  "#ossington",
  "#littleitaly",
  "#localbusiness",
  "#supportlocal",
  "#neighbourhood",
  "#foodguide",
  "#tastemap",
  "#regulars",
  "#rallio",
];

const rallioFallbackActionBullets = [
  "saves spots worth revisiting, not just spots worth scrolling past",
  "notices the details regulars repeat out loud",
  "asks regulars what they would recommend twice",
  "keeps the map narrow enough to stay useful",
  "turns neighborhood recommendations into a clearer map",
];

function normalizeTemplateFields(
  fields: z.infer<typeof openAITemplateFieldsSchema>,
) {
  return {
    headline: fields.headline,
    subhead: fields.subhead,
    quote: fields.quote || undefined,
    attribution: fields.attribution || undefined,
    bottom_label: fields.bottom_label || undefined,
    info_rows: fields.info_rows || undefined,
    review_notes: fields.review_notes || undefined,
    brand_handle: fields.brand_handle || undefined,
    launch_neighborhood: fields.launch_neighborhood || undefined,
    category_focus: fields.category_focus || undefined,
    cta_door: fields.cta_door || undefined,
    content_type: fields.content_type || undefined,
    visual_style: fields.visual_style || undefined,
    rallio_template_type: fields.rallio_template_type || undefined,
    door_label: fields.door_label || undefined,
    bio_rotation_hint: fields.bio_rotation_hint || undefined,
    kpi_intent: fields.kpi_intent || undefined,
    business_name: fields.business_name || undefined,
    spot_category: fields.spot_category || undefined,
    spot_address: fields.spot_address || undefined,
    spot_list_name: fields.spot_list_name || undefined,
    spot_list_position: fields.spot_list_position || undefined,
    spot_list_total: fields.spot_list_total || undefined,
    recommender_quote: fields.recommender_quote || undefined,
    recommender_name: fields.recommender_name || undefined,
    recommender_neighborhood: fields.recommender_neighborhood || undefined,
    recommender_since: fields.recommender_since || undefined,
    regular_quote: fields.regular_quote || undefined,
    regular_neighborhood: fields.regular_neighborhood || undefined,
    regular_since_year: fields.regular_since_year || undefined,
    carousel_page: fields.carousel_page || undefined,
    carousel_total: fields.carousel_total || undefined,
    receipt_lines: fields.receipt_lines || undefined,
    subtotal: fields.subtotal || undefined,
    supporter_steps: fields.supporter_steps || undefined,
    owner_steps: fields.owner_steps || undefined,
    step_audience: fields.step_audience || undefined,
    local_signal_id: fields.local_signal_id || undefined,
    source_status: fields.source_status || undefined,
    signature_order: fields.signature_order || undefined,
    sensory_detail: fields.sensory_detail || undefined,
    participation_prompt: fields.participation_prompt || undefined,
  };
}

type RallioFallbackMetadata = {
  contentType?: RallioContentType;
  ctaDoor?: RallioCtaDoor;
  templateType?: RallioTemplateType;
  visualStyle?: string;
  kpiIntent?: string;
  batchWorkingTitle?: string;
  localSignal?: RallioLocalSignal | null;
  participationPrompt?: string | null;
};

function getRallioFallbackMetadata(
  input: z.infer<typeof ideaInputSchema>,
): RallioFallbackMetadata {
  return {
    contentType:
      input.batch_angle?.rallio_content_type || input.rallio_content_type || undefined,
    ctaDoor: input.batch_angle?.rallio_cta_door || input.rallio_cta_door || undefined,
    templateType:
      input.batch_angle?.rallio_template_type ||
      input.rallio_template_type ||
      undefined,
    visualStyle:
      input.batch_angle?.rallio_visual_style ||
      input.rallio_visual_style ||
      RALLIO_BRAND.visual_style,
    kpiIntent:
      input.batch_angle?.rallio_kpi_intent || input.rallio_kpi_intent || undefined,
    batchWorkingTitle: input.batch_angle?.working_title,
    localSignal: input.batch_angle?.rallio_signal || input.rallio_signal || null,
    participationPrompt:
      input.batch_angle?.participation_prompt || input.participation_prompt || null,
  };
}

function createQualityFallbackContent({
  candidate,
  failures,
  attempt,
  rallioFallback,
}: {
  candidate: GeneratedContentPackage;
  failures: string[];
  attempt: number;
  rallioFallback?: RallioFallbackMetadata;
}) {
  const signal = rallioFallback?.localSignal || null;
  const hook =
    candidate.hook ||
    (signal
      ? `${signal.spot_name} keeps showing up for a reason.`
      : candidate.headline);
  const headline =
    rallioFallback?.batchWorkingTitle ||
    candidate.headline ||
    "Local Discovery Needs Better Signal";
  const subhead =
    candidate.subhead ||
    (signal
      ? `${signal.signature_order} is the kind of local signal a taste map should keep.`
      : "Local discovery should start with taste, regulars, and owner context.");
  const bullets = uniqueStrings([
    ...(signal
      ? [
          `${signal.spot_name} in ${signal.neighborhood}`,
          signal.signature_order,
          signal.sensory_detail,
          signal.participation_prompt,
        ]
      : []),
    ...rallioFallbackActionBullets,
  ]).slice(0, 4);
  const finalLine =
    signal?.participation_prompt ||
    "This isn't a promo feed. It's a taste map people can help build.";
  const hashtags = normalizeFallbackHashtags([
    ...(candidate.hashtags || []),
    ...rallioFallbackHashtags,
  ]).slice(0, 16);
  const ctaDoor = normalizeRallioCtaDoor(
    rallioFallback?.contentType || candidate.template_fields.content_type,
    rallioFallback?.ctaDoor || candidate.template_fields.cta_door,
  );
  const cta =
    ctaDoor === "app_download_supporter"
      ? "Link in bio to download Rallio and start with one spot you actually recommend."
      : ctaDoor === "app_download_owner"
        ? "Owners: link in bio to download Rallio and set up your profile."
        : ctaDoor === "city_request"
          ? "Want your city on the map? Link in bio to tell us where to build next."
          : ctaDoor === "claim_your_business"
            ? "Local owners: use the link in bio when the owner profile door is open."
            : ctaDoor === "local_guide" || ctaDoor === "ossington_30_guide"
              ? "Save this and use the link in bio to request the taste map."
              : "Link in bio to download Rallio and help build the taste map.";
  const caption = [
    hook,
    "",
    signal
      ? `${signal.regular_name} has been a ${signal.neighborhood} regular since ${signal.regular_since_year}.`
      : "The weak local app turns every place into the same card.",
    signal
      ? `The signal: ${signal.regular_quote}`
      : "The useful one captures why people actually return.",
    "",
    ...bullets.map((bullet) => `- ${bullet}`),
    "",
    finalLine,
    "",
    hashtags.join(" "),
  ].join("\n");
  const xVersion = `${hook} The useful local signal is specific: regulars, owner context, repeat visits, and taste notes. ${finalLine}`;
  const linkedinVersion = [
    hook,
    "",
    "The local discovery problem is not a lack of listings.",
    "It is a lack of useful signal.",
    "",
    ...bullets.map((bullet) => `- ${sentenceCase(bullet)}`),
    "",
    finalLine,
  ].join("\n");
  const templateFields = normalizeRallioMetadata(
    {
      ...candidate.template_fields,
      ...rallioSignalToTemplateFields(rallioFallback?.localSignal),
      headline,
      subhead,
      participation_prompt:
        rallioFallback?.participationPrompt ||
        candidate.template_fields.participation_prompt,
      receipt_lines: candidate.template_fields.receipt_lines || bullets.slice(0, 3),
      supporter_steps: candidate.template_fields.supporter_steps,
      owner_steps: candidate.template_fields.owner_steps,
      review_notes: [
        candidate.template_fields.review_notes,
        "Rallio fallback used. Review local specificity before posting.",
      ]
        .filter(Boolean)
        .join(" "),
    },
    rallioFallback,
  );

  const repaired = generatedContentSchema.parse({
    ...candidate,
    hook,
    headline,
    subhead,
    caption,
    hashtags,
    cta,
    x_version: xVersion.slice(0, 280),
    linkedin_version: linkedinVersion,
    template_fields: {
      ...templateFields,
      quality_gate: {
        passed: false,
        repaired: true,
        attempt,
        failures,
        notes: [
          "OpenAI did not pass the quality gate. Rallio fallback was used.",
        ],
      },
    },
  });

  return enforceRallioCopySafety(repaired);
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalized = value.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeFallbackHashtags(hashtags: string[]) {
  const normalized = hashtags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

  return uniqueStrings([...normalized, ...rallioFallbackHashtags]).slice(0, 20);
}

type NoveltyItem = {
  headline?: string | null;
  hook?: string | null;
  pillar?: string | null;
  local_signal_id?: string | null;
  business_name?: string | null;
  spot_category?: string | null;
  launch_neighborhood?: string | null;
  regular_quote?: string | null;
  participation_prompt?: string | null;
};

function validateBatchNovelty(
  content: GeneratedContentPackage,
  generatedSoFar: NoveltyItem[],
  history: NoveltyItem[] = [],
) {
  if (!generatedSoFar.length && !history.length) {
    return [];
  }

  // Exact-match checks span both the current batch and recent post history.
  // Similarity and category/neighborhood pairing stay batch-only so legitimately
  // recurring spots across days are not blocked.
  const dedupeScope = [...generatedSoFar, ...history];
  const currentHeadline = normalizeForNovelty(content.headline);
  const currentHook = normalizeForNovelty(content.hook);
  const currentQuote = normalizeForNovelty(
    content.template_fields.regular_quote ||
      content.template_fields.recommender_quote ||
      content.template_fields.quote,
  );
  const currentSignalId = normalizeForNovelty(content.template_fields.local_signal_id);
  const currentBusiness = normalizeForNovelty(content.template_fields.business_name);
  const currentCategory = normalizeForNovelty(content.template_fields.spot_category);
  const currentNeighborhood = normalizeForNovelty(
    content.template_fields.launch_neighborhood,
  );
  const currentParticipation = normalizeForNovelty(
    content.template_fields.participation_prompt,
  );
  const failures: string[] = [];
  const collectNormalized = (
    items: NoveltyItem[],
    key: keyof NoveltyItem,
  ) => items.map((item) => normalizeForNovelty(item[key])).filter(Boolean);
  const previousHeadlines = collectNormalized(dedupeScope, "headline");
  const previousHooks = collectNormalized(dedupeScope, "hook");
  const previousQuotes = collectNormalized(dedupeScope, "regular_quote");
  const previousSignalIds = collectNormalized(dedupeScope, "local_signal_id");
  const previousBusinesses = collectNormalized(dedupeScope, "business_name");
  const batchHooks = collectNormalized(generatedSoFar, "hook");
  const batchParticipationPrompts = collectNormalized(
    generatedSoFar,
    "participation_prompt",
  );

  if (currentHeadline && previousHeadlines.includes(currentHeadline)) {
    failures.push("Headline duplicates a recent post.");
  }

  if (currentHook && previousHooks.includes(currentHook)) {
    failures.push("Hook duplicates a recent post.");
  }

  if (currentHook && batchHooks.some((hook) => tokenSimilarity(currentHook, hook) > 0.78)) {
    failures.push("Hook is too similar to an earlier post in this batch.");
  }

  if (currentQuote && previousQuotes.includes(currentQuote)) {
    failures.push("Regular quote duplicates a recent post.");
  }

  if (currentSignalId && previousSignalIds.includes(currentSignalId)) {
    failures.push("Local signal duplicates a recent post.");
  }

  if (currentBusiness && previousBusinesses.includes(currentBusiness)) {
    failures.push("Business name duplicates a recent post.");
  }

  if (
    currentParticipation &&
    batchParticipationPrompts.includes(currentParticipation)
  ) {
    failures.push("Participation prompt duplicates an earlier post in this batch.");
  }

  if (
    currentCategory &&
    currentNeighborhood &&
    generatedSoFar.some(
      (post) =>
        normalizeForNovelty(post.spot_category) === currentCategory &&
        normalizeForNovelty(post.launch_neighborhood) === currentNeighborhood,
    )
  ) {
    failures.push("Spot category and neighborhood repeat an earlier batch pairing.");
  }

  return failures;
}

function recentPostToNoveltyItem(post: {
  headline: string | null;
  hook: string | null;
  template_fields: unknown;
}): NoveltyItem {
  const fields =
    post.template_fields && typeof post.template_fields === "object"
      ? (post.template_fields as Record<string, unknown>)
      : {};
  const str = (value: unknown) => (typeof value === "string" ? value : null);

  return {
    headline: post.headline,
    hook: post.hook,
    local_signal_id: str(fields.local_signal_id),
    business_name: str(fields.business_name),
    spot_category: str(fields.spot_category),
    launch_neighborhood: str(fields.launch_neighborhood),
    regular_quote: str(fields.regular_quote),
    participation_prompt: str(fields.participation_prompt),
  };
}

function validateRallioSpecificity(
  content: GeneratedContentPackage,
  localSignal?: RallioLocalSignal | null,
) {
  const failures: string[] = [];
  const fields = content.template_fields;
  const businessName = fields.business_name || "";
  const copyText = [
    content.hook,
    content.headline,
    content.subhead,
    content.caption,
    content.cta,
  ].join(" ");
  if (isGenericBusinessName(businessName)) {
    failures.push(`Business name is too generic: ${businessName}.`);
  }

  if (localSignal && fields.local_signal_id && fields.local_signal_id !== localSignal.id) {
    failures.push("Template local_signal_id does not match the planned local signal.");
  }

  const concreteDetails = [
    fields.business_name,
    fields.spot_address,
    fields.signature_order,
    fields.sensory_detail,
    fields.regular_quote,
    fields.recommender_quote,
    fields.participation_prompt,
    fields.launch_neighborhood,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 3);

  if (!concreteDetails.length) {
    failures.push(
      "Rallio post is missing a concrete local detail such as spot, order, street, sensory note, regular quote, or participation prompt.",
    );
  }

  if (
    localSignal &&
    ![
      localSignal.spot_name,
      localSignal.signature_order,
      localSignal.sensory_detail,
      localSignal.regular_quote,
      localSignal.participation_prompt,
      localSignal.neighborhood,
      localSignal.street,
    ].some((detail) => includesNormalized(copyText, detail))
  ) {
    failures.push("Generated copy did not use the assigned local signal.");
  }

  return failures;
}

function isGenericBusinessName(value: string) {
  const normalized = normalizeForNovelty(value);

  if (!normalized) {
    return false;
  }

  const genericNames = new Set([
    "taco haven",
    "tacos haven",
    "tacos delights",
    "taco delights",
    "the cozy corner cafe",
    "cozy corner cafe",
    "spice market",
    "pasta perfection",
    "cheesy goodness",
    "local favorite",
    "hidden gem",
  ]);

  return (
    genericNames.has(normalized) ||
    /\b(taco|tacos|pizza|pasta|coffee|spice|burger|sushi|ramen)\s+(haven|delight|delights|corner|cafe|spot|place|market|perfection)\b/.test(
      normalized,
    )
  );
}

function includesNormalized(text: string, detail: string) {
  const normalizedText = normalizeForNovelty(text);
  const normalizedDetail = normalizeForNovelty(detail);

  return normalizedDetail.length >= 4 && normalizedText.includes(normalizedDetail);
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = new Set(left.split(" ").filter((token) => token.length > 2));
  const rightTokens = new Set(right.split(" ").filter((token) => token.length > 2));

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;

  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function normalizeForNovelty(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = ideaInputSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();
    const referenceImageUrl = input.reference_image_url || undefined;

    if (input.image_mode === "uploaded" && !referenceImageUrl) {
      throw new Error("Upload a reference image before using it as the final image.");
    }

    const generationCount = input.generation_count || input.quantity || 1;
    const generationIndex = Math.min(input.generation_index || 1, generationCount);
    const generatedSoFar = input.recent_context?.generated_so_far || [];
    let sourceSummary: string | null = null;
    let idea: {
      id: string;
      title: string;
      brief: string | null;
      source_url: string | null;
      source_summary: string | null;
      user_id: string;
    };

    if (input.idea_id) {
      const { data: existingIdea, error: ideaError } = await supabase
        .from("content_ideas")
        .select("id, title, brief, source_url, source_summary, user_id")
        .eq("id", input.idea_id)
        .single();

      if (ideaError || !existingIdea || existingIdea.user_id !== user.id) {
        throw new Error("Campaign idea not found or not owned by current user.");
      }

      idea = existingIdea;
      sourceSummary = existingIdea.source_summary;
    } else {
      sourceSummary = input.source_url
        ? await summarizeSourceUrl(input.source_url)
        : null;

      const { data: newIdea, error: ideaError } = await supabase
        .from("content_ideas")
        .insert({
          user_id: user.id,
          title:
            generationCount > 1
              ? `${input.title} (${generationIndex}/${generationCount})`
              : input.title,
          brief: input.brief,
          source_url: input.source_url || null,
          source_summary: sourceSummary,
        })
        .select("id, title, brief, source_url, source_summary, user_id")
        .single();

      if (ideaError || !newIdea) {
        throw new Error(ideaError?.message || "Could not create idea.");
      }

      idea = newIdea;
    }

    const { data: recentPosts } = await supabase
      .from("generated_posts")
      .select("headline, hook, pillar, template_fields")
      .order("created_at", { ascending: false })
      .limit(10);
    const safeRecentPosts = z.array(recentPostSchema).parse(recentPosts || []);
    const recentHistory = (recentPosts || []).map(recentPostToNoveltyItem);
    const { apiKey, model } = getOpenAIEnv();
    const openai = new OpenAI({ apiKey, timeout: 90_000, maxRetries: 1 });

    let content: GeneratedContentPackage | null = null;
    let qualityFailures: string[] = [];
    let fallbackCandidate: GeneratedContentPackage | null = null;
    let fallbackAttempt = 0;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const isRepairPass = qualityFailures.length > 0;
      const response = await openai.responses.parse({
        model,
        input: [
          {
            role: "system",
            content: [
              RALLIO_SYSTEM_PROMPT,
              "Generate one complete Rallio Instagram post package.",
              "Treat Rallio as live in the App Store, with Toronto + Rajkot as first active markets and a soft city-request invitation for everyone else.",
              "Do not copy hooks, headlines, or template fields from generated_so_far.",
              "Use one funnel CTA door only. Prefer app_download_supporter for supporter launch/action posts, app_download_owner for owner setup posts, city_request for next-city asks, local_guide for taste-map saves, and claim_your_business only when the requested content type is owner_claim_carousel.",
              "Caption shape: 1-line hook, 1-2 lines of tension, 3-5 short bullets describing concrete local behavior or launch steps, one strong reframe ending, then hashtags.",
              "Do not reuse copy across platforms. Instagram is spaced, X is compressed, LinkedIn is slightly expanded.",
              "Never use exclamation points, download-now copy, coupon/cashback/reward language, reservations, Moments, perks, full-global claims, or 'tag a friend' bait.",
              isRepairPass
                ? `Repair pass: previous attempt failed quality. Fix these issues: ${qualityFailures.join(" ")}`
                : "",
            ]
              .filter(Boolean)
              .join(" "),
          },
          {
            role: "user",
            content: JSON.stringify(
              {
                task: input.batch_angle
                  ? "Generate this specific planned post from the batch campaign."
                  : "Generate a complete Rallio Instagram post package.",
                title: idea.title || input.title,
                brief: idea.brief || input.brief,
                source_url: idea.source_url || input.source_url || null,
                source_summary: sourceSummary || "No source URL provided.",
                tone: input.tone,
                rallio_context: {
                  brand: RALLIO_BRAND,
                  roulette_seed_id: input.roulette_seed_id || null,
                  local_signal:
                    input.batch_angle?.rallio_signal || input.rallio_signal || null,
                  participation_prompt:
                    input.batch_angle?.participation_prompt ||
                    input.participation_prompt ||
                    input.batch_angle?.rallio_signal?.participation_prompt ||
                    input.rallio_signal?.participation_prompt ||
                    null,
                  cta_door:
                    input.batch_angle?.rallio_cta_door ||
                    input.rallio_cta_door ||
                    null,
                  content_type:
                    input.batch_angle?.rallio_content_type ||
                    input.rallio_content_type ||
                    null,
                  rallio_template_type:
                    input.batch_angle?.rallio_template_type ||
                    input.rallio_template_type ||
                    null,
                  visual_style:
                    input.batch_angle?.rallio_visual_style ||
                    input.rallio_visual_style ||
                    RALLIO_BRAND.visual_style,
                  kpi_intent:
                    input.batch_angle?.rallio_kpi_intent ||
                    input.rallio_kpi_intent ||
                    null,
                  instruction:
                    "Return Instagram-ready Rallio feed-post content only. Set selected_platforms to instagram. Use exactly one funnel CTA door. Launch batches should mix local recommendation posts, supporter_steps_carousel, owner_steps_carousel, participation_single city requests, and occasional owner_claim_carousel. Do not write Reels or Stories for Rallio in this phase. Use claim_your_business only when the requested content type is owner_claim_carousel. Store Rallio metadata, launch steps, and local signal fields in template_fields.",
                },
                reference_image: referenceImageUrl
                  ? {
                      url: referenceImageUrl,
                      mode:
                        input.image_mode === "uploaded"
                          ? "Use this uploaded image as the final image. Still generate strong copy and editable template fields."
                          : "Use this as source/reference context only.",
                    }
                  : null,
                batch_angle: input.batch_angle || null,
                batch_generation:
                  generationCount > 1
                    ? {
                        current_package: generationIndex,
                        total_packages: generationCount,
                        instruction:
                          "Obey the planned batch angle. This post must be distinct from other batch items in hook, headline, takeaway, CTA, examples, caption shape, and template fields.",
                      }
                    : null,
                batch_slot_contract: input.batch_angle
                  ? {
                      index: input.batch_angle.index,
                      required_working_title: input.batch_angle.working_title,
                      required_content_type: input.batch_angle.rallio_content_type,
                      required_template_type: input.batch_angle.rallio_template_type,
                      required_visual_style: input.batch_angle.rallio_visual_style,
                      duplicate_headlines_to_avoid: generatedSoFar
                        .map((post) => post.headline)
                        .filter(Boolean),
                      required_local_signal: input.batch_angle.rallio_signal || null,
                      required_participation_prompt:
                        input.batch_angle.participation_prompt ||
                        input.batch_angle.rallio_signal?.participation_prompt ||
                        null,
                      instruction:
                        "Use the required working title as the post headline/template headline. Use required_local_signal as the source of truth for the spot, category, neighborhood, order/detail, regular quote, and participation prompt. Do not use a headline from duplicate_headlines_to_avoid.",
                    }
                  : null,
                generated_so_far: generatedSoFar,
                recent_posts_to_avoid: safeRecentPosts,
                caption_rules: {
                  instagram:
                    "Strong first line, 1-2 line tension, 3-5 action bullets, strong final reframe/filter/insight, then 15-25 varied hashtags. 1-3 emojis max.",
                  x:
                    "Under 280 characters, sharper than Instagram, 0-1 hashtag.",
                  linkedin:
                    "Slightly expanded, still structured, no corporate tone, no long paragraphs.",
                },
                visual_system: {
                  style:
                    "Rallio local editorial system. Cream/ink/amber/wheat/moss, Fraunces-style quote cards, spot carousel cards, receipt details, black manifesto tiles, dark owner-utility phone/profile cards.",
                  template_fields:
                    "Use headline, subhead, brand_handle, launch_neighborhood, category_focus, cta_door, content_type, visual_style, rallio_template_type, door_label, bio_rotation_hint, kpi_intent, business_name, spot_category, spot_address, spot_list_name, spot_list_position, spot_list_total, recommender_quote, recommender_name, recommender_neighborhood, recommender_since, regular_quote, regular_neighborhood, regular_since_year, carousel_page, carousel_total, quote, attribution, info_rows, receipt_lines, subtotal, supporter_steps, owner_steps, step_audience, bottom_label, local_signal_id, source_status, signature_order, sensory_detail, participation_prompt, and review_notes. Return every template field; use null when unavailable.",
                  thumbnail_rule:
                    "The image must still work as a small Instagram grid thumbnail. Keep headline short, direct, and visually punchy.",
                  rallio_copy_rule:
                    "No exclamation points. Do not use instant, perks, rewards, discounts, tag-a-friend bait, reservations, Moments, full-global claims, or generic launch/product hooks. Do not repeat Toronto + Rajkot in the same package.",
                  rallio_field_specificity:
                    "spot_category must be specific cuisine or shop type (pizza, ramen, natural wine bar, third-wave coffee, biryani, dive bar). Never return generic words like food, drink, restaurant, place, spot, or eatery. launch_neighborhood must be a real neighborhood, intersection, or street name. Never put brand catchphrases like 'taste map', 'local', or 'community' into launch_neighborhood. Return null if unknown.",
                  rallio_rich_field_guide: [
                    "For rallio_spot_carousel: set business_name to the place name; spot_category to specific cuisine; spot_address to street/intersection (e.g. '93 Ossington Ave'); spot_list_name to the collection title in uppercase (e.g. 'THE OSSINGTON 30'); spot_list_position and spot_list_total as zero-padded strings (e.g. '04', '30'); recommender_quote to one short italic line from a believable regular; recommender_name to a first-name handle (e.g. '@mayachen' or 'Maya'); recommender_neighborhood to a lowercase short area label (e.g. 'ossington'); recommender_since to a two-digit year like \"'22\"; carousel_page and carousel_total to numeric strings like '1' and '6'.",
                    "For rallio_regular_quote: set regular_quote to the full quote; attribution to the regular's first name; regular_neighborhood to the neighborhood they regular at (e.g. 'Little Italy'); regular_since_year to a four-digit year (e.g. '2019'); business_name to the spot they're a regular of.",
                    "For rallio_receipt: set receipt_lines as 'label · value' rows; subtotal to the final number; launch_neighborhood to the neighborhood context for the receipt.",
                    "For rallio_steps with supporter_steps_carousel: set step_audience to 'supporter'; set supporter_steps to exactly these six short steps unless the assigned angle requires shorter phrasing: Download or open Rallio; Choose Supporter and select your city; Browse or search local food and drink spots; Follow places you trust; Create a support post with a real recommendation, photo, or social link; Build Your Taste from picks, live posts, places, and areas. Set cta_door to app_download_supporter.",
                    "For rallio_steps with owner_steps_carousel: set step_audience to 'owner'; set owner_steps to exactly these six short steps unless the assigned angle requires shorter phrasing: Download or open Rallio; Choose Business Owner; Add or claim a free business profile; Keep profile details accurate; Review and approve supporter posts; Track posts, profile clicks, and visits from owner home. Set cta_door to app_download_owner.",
                    "For participation_single feed posts: set headline to the concrete question, set participation_prompt to the same answerable question, use the assigned local signal as the example context, and make the caption invite comments or replies without tag-a-friend bait.",
                    "When a required_local_signal is provided, copy its local_signal_id/source_status into template fields and use its spot_name, category, street, signature_order, sensory_detail, regular_quote, regular_name, regular_since_year, and participation_prompt.",
                    "Return null for any rich field you cannot fill with a concrete, believable value. Never invent stock placeholder addresses, fake handles ending in numbers like @user123, or generic neighborhoods.",
                  ].join(" "),
                },
                cta_rotation:
                  "Use one Rallio funnel door only. Prefer app_download_supporter for supporter launch posts, app_download_owner for owner setup posts, city_request for next-city asks, local_guide for taste-map saves/requests, and claim_your_business only for owner_claim_carousel. No download-now, instant-access, perks, rewards, reservations, Moments, or full-global CTA.",
                planned_output_contract: input.batch_angle
                  ? {
                      pillar_must_equal: input.batch_angle.pillar,
                      template_type_must_equal: input.batch_angle.template_type,
                      cta_should_match:
                        input.batch_angle.rallio_cta_door || input.rallio_cta_door,
                    }
                  : null,
              },
              null,
              2,
            ),
          },
        ],
        text: {
          format: zodTextFormat(openAIContentSchema, "content_os_post_package"),
        },
      });

      const parsed = response.output_parsed;

      if (!parsed) {
        throw new Error("OpenAI did not return a structured content package.");
      }

      const normalizedTemplateFields = normalizeTemplateFields(parsed.template_fields);
      const rallioFallback = getRallioFallbackMetadata(input);
      const signalTemplateFields = rallioSignalToTemplateFields(
        input.batch_angle?.rallio_signal || input.rallio_signal,
      );
      const baseTemplateFieldsWithWorkflow = {
        ...normalizedTemplateFields,
        ...signalTemplateFields,
        participation_prompt:
          input.batch_angle?.participation_prompt ||
          input.participation_prompt ||
          normalizedTemplateFields.participation_prompt ||
          signalTemplateFields.participation_prompt,
        reference_image_url: referenceImageUrl,
        reference_image_asset_id: input.reference_image_asset_id,
        selected_platforms: ["instagram" as const],
        image_mode: input.image_mode,
      };
      const templateFieldsWithWorkflow = normalizeRallioMetadata(
        {
          ...baseTemplateFieldsWithWorkflow,
          headline: input.batch_angle?.working_title || baseTemplateFieldsWithWorkflow.headline,
        },
        rallioFallback,
      );
      const forcedTemplateType = mapRallioTemplateToCoreType(
        templateFieldsWithWorkflow.rallio_template_type ||
          input.batch_angle?.rallio_template_type ||
          input.rallio_template_type,
      );

      const parsedContent = generatedContentSchema.parse({
        ...parsed,
        headline: input.batch_angle?.working_title || parsed.headline,
        pillar: forcedTemplateType,
        template_type: forcedTemplateType,
        template_fields: templateFieldsWithWorkflow,
      });
      let candidate: GeneratedContentPackage;
      try {
        candidate = enforceRallioCopySafety(parsedContent);
      } catch (safetyError) {
        const message =
          safetyError instanceof Error
            ? safetyError.message
            : "Rallio safety gate rejected the generated copy.";
        qualityFailures = [message];
        fallbackCandidate = parsedContent;
        fallbackAttempt = attempt;
        continue;
      }
      fallbackCandidate = candidate;
      fallbackAttempt = attempt;
      const specificityFailures = validateRallioSpecificity(
        candidate,
        input.batch_angle?.rallio_signal || input.rallio_signal,
      );

      if (specificityFailures.length) {
        qualityFailures = specificityFailures;
        continue;
      }

      const noveltyFailures = validateBatchNovelty(
        candidate,
        generatedSoFar,
        recentHistory,
      );

      if (noveltyFailures.length) {
        qualityFailures = noveltyFailures;
        continue;
      }

      const qualityResult = validateGeneratedContentQuality({
        content: candidate,
      });

      if (qualityResult.ok) {
        content = {
          ...candidate,
          template_fields: {
            ...candidate.template_fields,
            quality_gate: {
              passed: true,
              attempt,
              notes: qualityResult.notes,
            },
          },
        };
        break;
      }

      qualityFailures = qualityResult.failures;
    }

    if (!content && fallbackCandidate) {
      content = createQualityFallbackContent({
        candidate: fallbackCandidate,
        failures: qualityFailures,
        attempt: fallbackAttempt,
        rallioFallback: getRallioFallbackMetadata(input),
      });
    }

    if (!content) {
      throw new Error(
        `Content quality gate rejected generated output: ${qualityFailures.join(" ")}`,
      );
    }

    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .insert({
        user_id: user.id,
        idea_id: idea.id,
        platform: "instagram",
        post_type: input.post_type,
        tone: input.tone,
        pillar: content.pillar,
        template_type: content.template_type,
        hook: content.hook,
        headline: content.headline,
        subhead: content.subhead,
        caption: content.caption,
        hashtags: content.hashtags,
        cta: content.cta,
        carousel_slides: content.carousel_slides,
        reel_script: content.reel_script,
        x_version: content.x_version,
        linkedin_version: content.linkedin_version,
        image_prompt: content.image_prompt,
        template_fields: content.template_fields as Json,
        image_url: input.image_mode === "uploaded" ? referenceImageUrl : null,
        status: "draft",
        image_status: input.image_mode === "uploaded" ? "generated" : "not_generated",
      })
      .select()
      .single();

    if (postError || !post) {
      throw new Error(postError?.message || "Could not create generated post.");
    }

    await supabase
      .from("content_ideas")
      .update({ status: "generated" })
      .eq("id", idea.id);

    return jsonOk({ idea, post, content });
  } catch (error) {
    return jsonError(error, 400);
  }
}
