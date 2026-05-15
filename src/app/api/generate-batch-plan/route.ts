import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import {
  WORD_OF_AI_BATCH_ANGLE_TYPES,
  WORD_OF_AI_PILLARS,
  WORD_OF_AI_SYSTEM_PROMPT,
} from "@/lib/content/brand";
import { getWeeklyMemeTrends } from "@/lib/content/meme-trends";
import { PRODUCT_MENTION_CONFIG } from "@/lib/content/product-gate";
import {
  RALLIO_BRAND,
  RALLIO_SYSTEM_PROMPT,
  mapRallioTemplateToCoreType,
  templateForContentType,
} from "@/lib/content/rallio";
import {
  batchAngleSchema,
  ideaInputSchema,
  rallioContentTypes,
  rallioTemplateTypes,
  templateTypes,
} from "@/lib/content/types";
import {
  assertContentOsSupabaseWriteSafety,
  getOpenAIEnv,
} from "@/lib/env";
import { requireApiUser } from "@/lib/auth";
import { summarizeSourceUrl } from "@/lib/content/source";

const batchPlanSchema = z.object({
  campaign_title: z.string(),
  strategy_summary: z.string(),
  angles: z.array(batchAngleSchema),
});

const recentPostSchema = z.object({
  headline: z.string().nullable(),
  hook: z.string().nullable(),
  pillar: z.string().nullable(),
  cta: z.string().nullable(),
});

function normalizePlanAngles(
  angles: z.infer<typeof batchAngleSchema>[],
  quantity: number,
) {
  return angles.slice(0, quantity).map((angle, index) => ({
    ...angle,
    index: index + 1,
  }));
}

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = ideaInputSchema.parse(await request.json());
    const isRallio = input.brand_slug === "rallio";
    const quantity = input.quantity || 1;
    const { supabase, user } = await requireApiUser();
    const sourceSummary = input.source_url
      ? await summarizeSourceUrl(input.source_url)
      : null;
    const memeTrendContext =
      !isRallio && input.template_hint === "meme"
        ? await getWeeklyMemeTrends(Math.max(quantity + 4, 10))
        : null;

    const { data: idea, error: ideaError } = await supabase
      .from("content_ideas")
      .insert({
        user_id: user.id,
        title: input.title,
        brief: input.brief,
        source_url: input.source_url || null,
        source_summary: sourceSummary,
        status: "draft",
      })
      .select()
      .single();

    if (ideaError || !idea) {
      throw new Error(ideaError?.message || "Could not create campaign idea.");
    }

    const { data: recentPosts } = await supabase
      .from("generated_posts")
      .select("headline, hook, pillar, cta")
      .order("created_at", { ascending: false })
      .limit(10);

    const safeRecentPosts = z.array(recentPostSchema).parse(recentPosts || []);
    const { apiKey, model } = getOpenAIEnv();
    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            isRallio ? RALLIO_SYSTEM_PROMPT : WORD_OF_AI_SYSTEM_PROMPT,
            "Plan a differentiated content campaign before any post is written.",
            "Every angle must be meaningfully different: not just synonyms or reordered wording.",
            "The angle plan should avoid repeating recent hooks, headlines, CTAs, examples, and visual concepts.",
            "Return JSON only.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify(
            isRallio
              ? {
                  task: "Create a batch campaign plan for Rallio Instagram.",
                  brand_slug: "rallio",
                  quantity,
                  topic_or_niche: input.title,
                  brief: input.brief,
                  launch_neighborhood: RALLIO_BRAND.launch_neighborhood,
                  category_focus: RALLIO_BRAND.category_focus,
                  platform: "instagram",
                  selected_platforms: ["instagram"],
                  post_type: input.post_type,
                  tone: input.tone,
                  template_hint: input.template_hint,
                  reference_image_url: input.reference_image_url || null,
                  image_mode: input.image_mode,
                  rallio_seed_metadata: {
                    roulette_seed_id: input.roulette_seed_id || null,
                    content_type: input.rallio_content_type || null,
                    cta_door: input.rallio_cta_door || null,
                    template_type: input.rallio_template_type || null,
                    visual_style: input.rallio_visual_style || RALLIO_BRAND.visual_style,
                    kpi_intent: input.rallio_kpi_intent || null,
                  },
                  allowed_core_template_types: templateTypes,
                  allowed_rallio_template_types: rallioTemplateTypes,
                  allowed_rallio_content_types: rallioContentTypes,
                  allowed_cta_doors: [
                    "founding_supporter",
                    "local_guide",
                    "claim_your_business",
                  ],
                  funnel_cta_policy:
                    "Pick exactly one cta door per angle: founding_supporter, local_guide, or claim_your_business. Use cta_intent = follow in the required schema because product CTAs are not for Word of AI.",
                  output_requirements: [
                    "Return exactly the requested number of angles.",
                    "Every angle must be about Rallio, Toronto + Rajkot, and taste-first food/drink local discovery.",
                    "Every angle must include brand_slug = rallio.",
                    "Every angle must include rallio_template_type, rallio_content_type, rallio_cta_door, rallio_visual_style, and rallio_kpi_intent.",
                    "Set pillar/template_type to the closest core Content OS template type even though rendering will use the Rallio template metadata.",
                    "Set cta_intent to follow for every angle.",
                    "Do not mention Word of AI, QuoteStack, coupons, cashback, price-promo framing, reward hype, instant downloads, or app-store CTAs.",
                    "Do not make Ossington-only claims. Write for Toronto + Rajkot now, with a global expansion path later.",
                    "Always include authority_figure, topical_event, contrarian_take, builder_lesson, meme_trend_title, meme_trend_source, meme_format, and meme_adaptation. Use null unless truly relevant.",
                    "Vary the angle, CTA door, and visual treatment across the batch where possible.",
                  ],
                }
              : {
              task: "Create a batch campaign plan for Word of AI.",
              brand_slug: "word_of_ai",
              quantity,
              topic_or_niche: input.title,
              brief: input.brief,
              source_url: input.source_url || null,
              source_summary: sourceSummary || "No source URL provided.",
              platform: input.platform,
              selected_platforms: input.selected_platforms,
              post_type: input.post_type,
              tone: input.tone,
              content_mode: input.content_mode,
              authority_pov:
                input.content_mode === "authority_pov"
                  ? {
                      recognizable_figure: input.recognizable_figure || null,
                      current_event: input.current_event || null,
                      contrarian_take: input.contrarian_take || null,
                      builder_lesson: input.builder_lesson || null,
                      instruction:
                        "Every angle must position Word of AI beside a recognizable person, company, model, product launch, or current AI event, then land one confident builder lesson.",
                    }
                  : null,
              template_hint: input.template_hint,
              reference_image_url: input.reference_image_url || null,
              image_mode: input.image_mode,
              meme_trends:
                memeTrendContext && input.template_hint === "meme"
                  ? {
                      source: memeTrendContext.source,
                      fetched_at: memeTrendContext.fetched_at,
                      instruction:
                        "Assign a different trend to each planned meme angle when possible. Adapt the format/context to AI builders; do not copy images or make the post depend on the original meme asset.",
                      trends: memeTrendContext.trends,
                    }
                  : null,
              template_policy:
                input.template_hint === "meme"
                  ? "Force every angle to pillar meme and template_type meme. Each angle must use a different meme_trend_title when trends are available."
                  : input.template_hint === "auto"
                  ? "Choose the strongest template per angle."
                  : `Prefer ${input.template_hint} where possible, but still make each angle distinct.`,
              allowed_template_types: templateTypes,
              pillars: WORD_OF_AI_PILLARS,
              angle_type_examples: WORD_OF_AI_BATCH_ANGLE_TYPES,
              weekly_mix_for_10_plus:
                "25% news_digest, 25% tool_stack, 20% tutorial, 10% creator_economy, 10% founder_story, 10% meme.",
              cta_rotation:
                PRODUCT_MENTION_CONFIG.product_mentions_enabled
                  ? "Use follow for most posts. Use rallio or quotestack rarely and never back-to-back."
                  : "Product CTAs are paused. Set cta_intent to follow for every angle. Do not mention Rallio, Raillio, QuoteStack, downloads, app signups, or link-in-bio product asks.",
              recent_posts_to_avoid: safeRecentPosts,
              output_requirements: [
                "Return exactly the requested number of angles.",
                "Each working_title must be unique.",
                "Each hook_direction must imply a different post, not a wording variant.",
                "Each unique_takeaway must teach or argue a different point.",
                "Always include authority_figure, topical_event, contrarian_take, and builder_lesson. Use null for non-authority angles.",
                "If content_mode is authority_pov, every angle must include authority_figure, topical_event, contrarian_take, and builder_lesson.",
                "Use do_not_repeat to name the visual concept to avoid, not only copy to avoid.",
                "Vary visual treatment across angles: news image band, tool cards, prompt block, stat/quote, or founder note.",
                "Always include meme_trend_title, meme_trend_source, meme_format, and meme_adaptation. Use null for non-meme angles.",
                "Always include brand_slug, rallio_template_type, rallio_content_type, rallio_cta_door, rallio_visual_style, and rallio_kpi_intent. For Word of AI, set brand_slug to word_of_ai and all Rallio fields to null.",
                "For quantity 5 or more, use at least 3 distinct pillars unless the user explicitly forced one template.",
                "If template_hint is meme, include meme_trend_title, meme_trend_source, meme_format, and meme_adaptation for every angle.",
              ],
            },
            null,
            2,
          ),
        },
      ],
      text: {
        format: zodTextFormat(batchPlanSchema, "word_of_ai_batch_plan"),
      },
    });

    const parsed = response.output_parsed;

    if (!parsed) {
      throw new Error("OpenAI did not return a structured batch plan.");
    }

    const angles = normalizePlanAngles(parsed.angles, quantity).map((angle) => ({
      ...angle,
      brand_slug: isRallio ? "rallio" : angle.brand_slug || "word_of_ai",
      pillar:
        isRallio && angle.rallio_template_type
          ? mapRallioTemplateToCoreType(angle.rallio_template_type)
          : angle.pillar,
      template_type:
        isRallio && angle.rallio_template_type
          ? mapRallioTemplateToCoreType(angle.rallio_template_type)
          : angle.template_type,
      rallio_template_type:
        isRallio
          ? angle.rallio_template_type ||
            templateForContentType(angle.rallio_content_type || input.rallio_content_type)
          : null,
      rallio_content_type: isRallio
        ? angle.rallio_content_type || input.rallio_content_type || "manifesto_reel"
        : null,
      rallio_cta_door: isRallio
        ? angle.rallio_cta_door || input.rallio_cta_door || "founding_supporter"
        : null,
      rallio_visual_style: isRallio
        ? angle.rallio_visual_style || input.rallio_visual_style || RALLIO_BRAND.visual_style
        : null,
      rallio_kpi_intent: isRallio
        ? angle.rallio_kpi_intent || input.rallio_kpi_intent || "manual_review"
        : null,
      cta_intent:
        PRODUCT_MENTION_CONFIG.product_mentions_enabled && !isRallio
          ? angle.cta_intent
          : "follow",
    }));

    if (angles.length !== quantity) {
      throw new Error(
        `Batch plan returned ${angles.length} angles, expected ${quantity}.`,
      );
    }

    return jsonOk({
      idea,
      plan: {
        campaign_title: parsed.campaign_title,
        strategy_summary: parsed.strategy_summary,
        angles,
      },
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
