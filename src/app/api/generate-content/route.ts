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
  owner_steps: z.array(z.string()).nullable(),
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
    owner_steps: fields.owner_steps || undefined,
  };
}

type RallioFallbackMetadata = {
  contentType?: RallioContentType;
  ctaDoor?: RallioCtaDoor;
  templateType?: RallioTemplateType;
  visualStyle?: string;
  kpiIntent?: string;
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
  const hook = candidate.hook || candidate.headline;
  const headline = candidate.headline || "Local Discovery Needs Better Signal";
  const subhead =
    candidate.subhead ||
    "Local discovery should start with taste, regulars, and owner context.";
  const bullets = uniqueStrings([...rallioFallbackActionBullets]).slice(0, 4);
  const finalLine = "This isn't a promo feed. It's a taste map people can help build.";
  const hashtags = normalizeFallbackHashtags([
    ...(candidate.hashtags || []),
    ...rallioFallbackHashtags,
  ]).slice(0, 16);
  const ctaDoor = normalizeRallioCtaDoor(
    rallioFallback?.contentType || candidate.template_fields.content_type,
    rallioFallback?.ctaDoor || candidate.template_fields.cta_door,
  );
  const cta =
    ctaDoor === "claim_your_business"
      ? "Local owners: use the link in bio when the owner profile door is open."
      : ctaDoor === "local_guide" || ctaDoor === "ossington_30_guide"
        ? "Save this and use the link in bio to request the taste map."
        : "Link in bio to join the Rallio taste-map waitlist.";
  const caption = [
    hook,
    "",
    "The weak local app turns every place into the same card.",
    "The useful one captures why people actually return.",
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
      headline,
      subhead,
      receipt_lines: candidate.template_fields.receipt_lines || bullets.slice(0, 3),
      owner_steps: candidate.template_fields.owner_steps || bullets.slice(0, 3),
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
      .select("headline, hook, pillar")
      .order("created_at", { ascending: false })
      .limit(10);
    const safeRecentPosts = z.array(recentPostSchema).parse(recentPosts || []);
    const { apiKey, model } = getOpenAIEnv();
    const openai = new OpenAI({ apiKey });

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
              "Treat Rallio as a community taste map being built through regulars, spot recommendations, receipts, and waitlist demand.",
              "Do not copy hooks, headlines, or template fields from generated_so_far.",
              "Use one funnel CTA door only. Default to founding_supporter for waitlist growth and local_guide for taste-map saves. Use claim_your_business only when the requested content type is owner_claim_carousel.",
              "Caption shape: 1-line hook, 1-2 lines of tension, 3-5 short bullets describing concrete local behavior, one strong reframe ending, then hashtags.",
              "Do not reuse copy across platforms. Instagram is spaced, X is compressed, LinkedIn is slightly expanded.",
              "Never use exclamation points, download-now copy, app-store CTAs, coupon/cashback/reward language, or 'tag a friend' bait.",
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
                    "Return Instagram-ready Rallio content only. Set selected_platforms to instagram. Use exactly one funnel CTA door. Default to community/feed-growth posts for regulars, spot recommendations, receipts, and taste-map waitlist growth. Use claim_your_business only when the requested content type is owner_claim_carousel. Store Rallio metadata in template_fields.",
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
                    "Use headline, subhead, brand_handle, launch_neighborhood, category_focus, cta_door, content_type, visual_style, rallio_template_type, door_label, bio_rotation_hint, kpi_intent, business_name, spot_category, spot_address, spot_list_name, spot_list_position, spot_list_total, recommender_quote, recommender_name, recommender_neighborhood, recommender_since, regular_quote, regular_neighborhood, regular_since_year, carousel_page, carousel_total, quote, attribution, info_rows, receipt_lines, subtotal, owner_steps, bottom_label, and review_notes. Return every template field; use null when unavailable.",
                  thumbnail_rule:
                    "The image must still work as a small Instagram grid thumbnail. Keep headline short, direct, and visually punchy.",
                  rallio_copy_rule:
                    "No exclamation points. Do not use instant, perks, rewards, discounts, tag-a-friend bait, app-store CTAs, or generic launch/product hooks. Do not repeat Toronto + Rajkot in the same package.",
                  rallio_field_specificity:
                    "spot_category must be specific cuisine or shop type (pizza, ramen, natural wine bar, third-wave coffee, biryani, dive bar). Never return generic words like food, drink, restaurant, place, spot, or eatery. launch_neighborhood must be a real neighborhood, intersection, or street name. Never put brand catchphrases like 'taste map', 'local', or 'community' into launch_neighborhood. Return null if unknown.",
                  rallio_rich_field_guide: [
                    "For rallio_spot_carousel: set business_name to the place name; spot_category to specific cuisine; spot_address to street/intersection (e.g. '93 Ossington Ave'); spot_list_name to the collection title in uppercase (e.g. 'THE OSSINGTON 30'); spot_list_position and spot_list_total as zero-padded strings (e.g. '04', '30'); recommender_quote to one short italic line from a believable regular; recommender_name to a first-name handle (e.g. '@mayachen' or 'Maya'); recommender_neighborhood to a lowercase short area label (e.g. 'ossington'); recommender_since to a two-digit year like \"'22\"; carousel_page and carousel_total to numeric strings like '1' and '6'.",
                    "For rallio_regular_quote: set regular_quote to the full quote; attribution to the regular's first name; regular_neighborhood to the neighborhood they regular at (e.g. 'Little Italy'); regular_since_year to a four-digit year (e.g. '2019'); business_name to the spot they're a regular of.",
                    "For rallio_receipt: set receipt_lines as 'label · value' rows; subtotal to the final number; launch_neighborhood to the neighborhood context for the receipt.",
                    "Return null for any rich field you cannot fill with a concrete, believable value. Never invent stock placeholder addresses, fake handles ending in numbers like @user123, or generic neighborhoods.",
                  ].join(" "),
                },
                cta_rotation:
                  "Use one Rallio funnel door only. Prefer founding_supporter for link-in-bio waitlist growth and local_guide for taste-map saves/requests. Use claim_your_business only for owner_claim_carousel. No app-store, download-now, instant-access, perks, or rewards CTA.",
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
      const baseTemplateFieldsWithWorkflow = {
        ...normalizedTemplateFields,
        reference_image_url: referenceImageUrl,
        reference_image_asset_id: input.reference_image_asset_id,
        selected_platforms: ["instagram" as const],
        image_mode: input.image_mode,
      };
      const templateFieldsWithWorkflow = normalizeRallioMetadata(
        baseTemplateFieldsWithWorkflow,
        rallioFallback,
      );
      const forcedTemplateType = mapRallioTemplateToCoreType(
        templateFieldsWithWorkflow.rallio_template_type ||
          input.batch_angle?.rallio_template_type ||
          input.rallio_template_type,
      );

      const parsedContent = generatedContentSchema.parse({
        ...parsed,
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
