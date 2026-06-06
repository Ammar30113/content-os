import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import {
  RALLIO_BRAND,
  RALLIO_SYSTEM_PROMPT,
  getRallioBatchSlotGuide,
  getRallioSignalOffset,
  mapRallioTemplateToCoreType,
  normalizeRallioCtaDoor,
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
    const signalOffset = getRallioSignalOffset(idea.id);
    const { apiKey, model } = getOpenAIEnv();
    const openai = new OpenAI({ apiKey, timeout: 90_000, maxRetries: 1 });

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
                "local_guide",
                "claim_your_business",
                "app_download_supporter",
                "app_download_owner",
                "city_request",
              ],
              funnel_cta_policy:
                "Pick exactly one cta door per angle. Prefer app_download_supporter for supporter setup/action posts, app_download_owner for owner setup posts, city_request for next-city asks, local_guide for taste-map saves, and claim_your_business only for owner_claim_carousel.",
              feed_rhythm:
                "Default launch campaign rhythm: 40% local recommendation posts, 25% supporter_steps_carousel action posts, 15% owner_steps_carousel or owner_claim_carousel posts, and 20% city_request or participation_single posts. For quantity 5+, include at least one supporter step post, one owner step or owner utility post, and one participation or city-request post. Do not plan Reels or Stories for Rallio in this phase.",
              required_slot_plan:
                quantity > 1
                  ? Array.from({ length: quantity }, (_, index) => {
                      const guide = getRallioBatchSlotGuide(
                        index + 1,
                        signalOffset,
                      );

                      return {
                        index: guide.slot,
                        working_title: guide.workingTitle,
                        rallio_content_type: guide.contentType,
                        rallio_template_type: guide.templateType,
                        visual_style: guide.visualStyle,
                        cta_door: guide.ctaDoor,
                        unique_takeaway: guide.uniqueTakeaway,
                        local_signal: guide.localSignal,
                        participation_prompt: guide.participationPrompt,
                      };
                    })
                  : null,
              recent_posts_to_avoid: safeRecentPosts,
              output_requirements: [
                "Return exactly the requested number of angles.",
                "Every angle must be about Rallio as a community taste map for food/drink discovery.",
                "Every angle must include brand_slug = rallio.",
                "Every angle must include rallio_template_type, rallio_content_type, rallio_cta_door, rallio_visual_style, and rallio_kpi_intent.",
                "Set pillar/template_type to the closest core Content OS template type even though rendering uses the Rallio template metadata.",
                "Do not mention coupons, cashback, price-promo framing, perks, reward hype, instant access, instant downloads, reservations, Moments, full-global availability, or exclamation-point promo copy.",
                "Do not use Toronto + Rajkot as repeated headline copy. Mention Toronto + Rajkot as first active markets only when the exact launch scope matters.",
                "Rallio is live in the App Store, but do not claim full global density. For people outside Toronto + Rajkot, ask them to request the next city or neighborhood.",
                "Do not assign claim_your_business unless rallio_content_type is owner_claim_carousel and the angle is explicitly for food/drink owners.",
                "Use app_download_owner only for owner_steps_carousel. Use app_download_supporter for supporter_steps_carousel. Use city_request for soft-global participation prompts.",
                "supporter_steps_carousel must explain: download/open Rallio, choose Supporter and city, browse/search spots, follow places, create a support post, and build Your Taste.",
                "owner_steps_carousel must explain: download/open Rallio, choose Business Owner, add or claim a free profile, keep details accurate, review/approve supporter posts, and track posts/profile clicks/visits.",
                "Use each required_slot_plan local_signal as source context. Do not swap it for a generic fake restaurant.",
                "Every non-owner angle must include a participation prompt or taste-map response ask in the angle.",
                "Vary the angle, CTA door, local signal, spot category, neighborhood, and visual treatment across the batch where possible.",
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

    const rawAngles = normalizePlanAngles(parsed.angles, quantity);
    const angles = rawAngles.map((angle, index) => {
      const slotGuide = getRallioBatchSlotGuide(index + 1, signalOffset);
      const shouldApplySlotGuide = quantity > 1;
      const rallioContentType =
        shouldApplySlotGuide
          ? slotGuide.contentType
          : angle.rallio_content_type || input.rallio_content_type || "regular_quote";
      const rallioTemplateType =
        shouldApplySlotGuide
          ? slotGuide.templateType
          : angle.rallio_template_type || templateForContentType(rallioContentType);
      const coreTemplateType = mapRallioTemplateToCoreType(rallioTemplateType);

      return {
        ...angle,
        brand_slug: "rallio",
        working_title: shouldApplySlotGuide
          ? slotGuide.workingTitle
          : angle.working_title,
        pillar: coreTemplateType,
        template_type: coreTemplateType,
        hook_direction: shouldApplySlotGuide
          ? slotGuide.hookDirection
          : angle.hook_direction,
        unique_takeaway: shouldApplySlotGuide
          ? slotGuide.uniqueTakeaway
          : angle.unique_takeaway,
        caption_structure: shouldApplySlotGuide
          ? slotGuide.captionStructure
          : angle.caption_structure,
        do_not_repeat: shouldApplySlotGuide
          ? slotGuide.doNotRepeat
          : angle.do_not_repeat,
        participation_prompt: shouldApplySlotGuide
          ? slotGuide.participationPrompt
          : angle.participation_prompt,
        rallio_signal: shouldApplySlotGuide
          ? slotGuide.localSignal
          : angle.rallio_signal || null,
        rallio_template_type: rallioTemplateType,
        rallio_content_type: rallioContentType,
        rallio_cta_door: normalizeRallioCtaDoor(
          rallioContentType,
          shouldApplySlotGuide
            ? slotGuide.ctaDoor
            : angle.rallio_cta_door || input.rallio_cta_door,
        ),
        rallio_visual_style:
          shouldApplySlotGuide
            ? slotGuide.visualStyle
            : angle.rallio_visual_style ||
              input.rallio_visual_style ||
              RALLIO_BRAND.visual_style,
        rallio_kpi_intent:
          shouldApplySlotGuide
            ? slotGuide.kpiIntent
            : angle.rallio_kpi_intent || input.rallio_kpi_intent || "manual_review",
      };
    });

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
