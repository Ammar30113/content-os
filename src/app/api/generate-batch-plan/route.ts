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
import {
  batchAngleSchema,
  ideaInputSchema,
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
    const quantity = input.quantity || 1;
    const { supabase, user } = await requireApiUser();
    const sourceSummary = input.source_url
      ? await summarizeSourceUrl(input.source_url)
      : null;
    const memeTrendContext =
      input.template_hint === "meme"
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
            WORD_OF_AI_SYSTEM_PROMPT,
            "Plan a differentiated content campaign before any post is written.",
            "Every angle must be meaningfully different: not just synonyms or reordered wording.",
            "The angle plan should avoid repeating recent hooks, headlines, CTAs, examples, and visual concepts.",
            "Return JSON only.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "Create a batch campaign plan for Word of AI.",
              quantity,
              topic_or_niche: input.title,
              brief: input.brief,
              source_url: input.source_url || null,
              source_summary: sourceSummary || "No source URL provided.",
              platform: input.platform,
              selected_platforms: input.selected_platforms,
              post_type: input.post_type,
              tone: input.tone,
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
                "Use follow for most posts. Use rallio or quotestack rarely and never back-to-back.",
              recent_posts_to_avoid: safeRecentPosts,
              output_requirements: [
                "Return exactly the requested number of angles.",
                "Each working_title must be unique.",
                "Each hook_direction must imply a different post, not a wording variant.",
                "Each unique_takeaway must teach or argue a different point.",
                "Use do_not_repeat to name the visual concept to avoid, not only copy to avoid.",
                "Vary visual treatment across angles: news image band, tool cards, prompt block, stat/quote, or founder note.",
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

    const angles = normalizePlanAngles(parsed.angles, quantity);

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
