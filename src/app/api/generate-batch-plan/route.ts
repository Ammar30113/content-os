import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
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
    const quantity = input.quantity || 1;
    const { supabase, user } = await requireApiUser();
    const sourceSummary = input.source_url
      ? await summarizeSourceUrl(input.source_url)
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
      .select("headline, hook, pillar")
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
            RALLIO_SYSTEM_PROMPT,
            "Plan a differentiated Rallio Instagram campaign before any post is written.",
            "Every angle must be meaningfully different: not just synonyms or reordered wording.",
            "Avoid repeating recent hooks, headlines, and visual concepts.",
            "Return JSON only.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "Create a batch campaign plan for Rallio Instagram.",
              quantity,
              topic_or_niche: input.title,
              brief: input.brief,
              source_url: input.source_url || null,
              source_summary: sourceSummary || "No source URL provided.",
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
                visual_style:
                  input.rallio_visual_style || RALLIO_BRAND.visual_style,
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
                "Pick exactly one cta door per angle. Prefer founding_supporter for link-in-bio waitlist growth and local_guide for taste-map saves. Use claim_your_business only for an explicitly owner-facing utility angle.",
              feed_rhythm:
                "Default campaign rhythm: regular_quote, spot_carousel, receipt_single, manifesto_reel or bts_story_sequence, then occasional owner_claim_carousel. For quantity 5+, include at least 3 community/feed-growth angles before any owner-claim angle.",
              recent_posts_to_avoid: safeRecentPosts,
              output_requirements: [
                "Return exactly the requested number of angles.",
                "Every angle must be about Rallio as a community taste map for food/drink discovery.",
                "Every angle must include rallio_template_type, rallio_content_type, rallio_cta_door, rallio_visual_style, and rallio_kpi_intent.",
                "Set pillar/template_type to the closest core Content OS template type even though rendering uses the Rallio template metadata.",
                "Do not mention coupons, cashback, price-promo framing, perks, reward hype, instant access, instant downloads, app-store CTAs, or exclamation-point promo copy.",
                "Do not use Toronto + Rajkot as repeated headline copy. Mention seed markets only when the exact scope matters.",
                "Do not write generic launch/product angles. Rallio is the taste map being built, not a fully launched product to promote.",
                "Do not assign claim_your_business unless rallio_content_type is owner_claim_carousel and the angle is explicitly for food/drink owners.",
                "Vary the angle, CTA door, and visual treatment across the batch where possible.",
              ],
            },
            null,
            2,
          ),
        },
      ],
      text: {
        format: zodTextFormat(batchPlanSchema, "rallio_batch_plan"),
      },
    });

    const parsed = response.output_parsed;

    if (!parsed) {
      throw new Error("OpenAI did not return a structured batch plan.");
    }

    const angles = normalizePlanAngles(parsed.angles, quantity).map((angle) => ({
      ...angle,
      pillar: angle.rallio_template_type
        ? mapRallioTemplateToCoreType(angle.rallio_template_type)
        : angle.pillar,
      template_type: angle.rallio_template_type
        ? mapRallioTemplateToCoreType(angle.rallio_template_type)
        : angle.template_type,
      rallio_template_type:
        angle.rallio_template_type ||
        templateForContentType(
          angle.rallio_content_type || input.rallio_content_type,
        ),
      rallio_content_type:
        angle.rallio_content_type || input.rallio_content_type || "regular_quote",
      rallio_cta_door:
        angle.rallio_cta_door || input.rallio_cta_door || "founding_supporter",
      rallio_visual_style:
        angle.rallio_visual_style ||
        input.rallio_visual_style ||
        RALLIO_BRAND.visual_style,
      rallio_kpi_intent:
        angle.rallio_kpi_intent || input.rallio_kpi_intent || "manual_review",
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
