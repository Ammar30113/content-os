import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import {
  WORD_OF_AI_BATCH_ANGLE_TYPES,
  WORD_OF_AI_PILLARS,
  WORD_OF_AI_SYSTEM_PROMPT,
} from "@/lib/content/brand";
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
              post_type: input.post_type,
              tone: input.tone,
              template_hint: input.template_hint,
              template_policy:
                input.template_hint === "auto"
                  ? "Choose the strongest template per angle."
                  : `Prefer ${input.template_hint} where possible, but still make each angle distinct.`,
              allowed_template_types: templateTypes,
              pillars: WORD_OF_AI_PILLARS,
              angle_type_examples: WORD_OF_AI_BATCH_ANGLE_TYPES,
              weekly_mix_for_10_plus:
                "30% news_digest, 25% tool_stack, 20% tutorial, 15% creator_economy, 10% founder_story.",
              cta_rotation:
                "Use follow for most posts. Use rallio or quotestack rarely and never back-to-back.",
              recent_posts_to_avoid: safeRecentPosts,
              output_requirements: [
                "Return exactly the requested number of angles.",
                "Each working_title must be unique.",
                "Each hook_direction must imply a different post, not a wording variant.",
                "Each unique_takeaway must teach or argue a different point.",
                "For quantity 5 or more, use at least 3 distinct pillars unless the user explicitly forced one template.",
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
