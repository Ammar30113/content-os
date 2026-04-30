import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { WORD_OF_AI_SYSTEM_PROMPT } from "@/lib/content/brand";
import {
  generatedContentSchema,
  ideaInputSchema,
  templateTypes,
} from "@/lib/content/types";
import {
  assertContentOsSupabaseWriteSafety,
  getOpenAIEnv,
} from "@/lib/env";
import { requireApiUser } from "@/lib/auth";
import { summarizeSourceUrl } from "@/lib/content/source";

const openAITemplateFieldsSchema = z.object({
  headline: z.string(),
  subhead: z.string(),
  source_name: z.string().nullable(),
  source_logo: z.string().nullable(),
  source_logo_url: z.string().nullable(),
  date: z.string().nullable(),
  hero_image_url: z.string().nullable(),
  product_logo: z.string().nullable(),
  visual_subject: z.string().nullable(),
  swipe_hint: z.string().nullable(),
  bottom_label: z.string().nullable(),
  tools: z.array(z.string()).nullable(),
  tool_logos: z.array(z.string()).nullable(),
  step_number: z.string().nullable(),
  code_snippet: z.string().nullable(),
  stat: z.string().nullable(),
  quote: z.string().nullable(),
  attribution: z.string().nullable(),
  pull_quote: z.string().nullable(),
  meme_setup: z.string().nullable(),
  meme_punchline: z.string().nullable(),
  portrait_url: z.string().nullable(),
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
  cta: z.string().nullable(),
  hashtags: z.array(z.string()).nullable(),
});

function normalizeTemplateFields(
  fields: z.infer<typeof openAITemplateFieldsSchema>,
) {
  return {
    headline: fields.headline,
    subhead: fields.subhead,
    source_name: fields.source_name || undefined,
    source_logo: fields.source_logo || fields.source_logo_url || undefined,
    source_logo_url: fields.source_logo_url || fields.source_logo || undefined,
    date: fields.date || undefined,
    hero_image_url: fields.hero_image_url || undefined,
    product_logo: fields.product_logo || undefined,
    visual_subject: fields.visual_subject || undefined,
    swipe_hint: fields.swipe_hint || undefined,
    bottom_label: fields.bottom_label || undefined,
    tools: fields.tools || undefined,
    tool_logos: fields.tool_logos || undefined,
    step_number: fields.step_number || undefined,
    code_snippet: fields.code_snippet || undefined,
    stat: fields.stat || undefined,
    quote: fields.quote || undefined,
    attribution: fields.attribution || undefined,
    pull_quote: fields.pull_quote || undefined,
    meme_setup: fields.meme_setup || undefined,
    meme_punchline: fields.meme_punchline || undefined,
    portrait_url: fields.portrait_url || undefined,
  };
}

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = ideaInputSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();
    const selectedPlatforms = input.selected_platforms?.length
      ? input.selected_platforms
      : [input.platform];
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
      .select("headline, hook, pillar, cta, hashtags")
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
            "Generate one complete social post package.",
            "If a batch_angle is provided, treat it as the source of truth for this post's angle, pillar, visual direction, and CTA intent.",
            "Do not copy hooks, headlines, examples, caption structure, or template fields from generated_so_far.",
            "Avoid generic non-positions. Take a clear builder-to-builder point of view.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: input.batch_angle
                ? "Generate this specific planned post from the batch campaign."
                : "Generate a complete social post package.",
              title: idea.title || input.title,
              brief: idea.brief || input.brief,
              source_url: idea.source_url || input.source_url || null,
              source_summary: sourceSummary || "No source URL provided.",
              platform: input.platform,
              selected_platforms: selectedPlatforms,
              post_type: input.post_type,
              tone: input.tone,
              template_hint: input.template_hint,
              reference_image: referenceImageUrl
                ? {
                    url: referenceImageUrl,
                    mode:
                      input.image_mode === "uploaded"
                        ? "Use this uploaded image as the final image_url. Still generate strong copy and editable template fields."
                        : "Use this as source/reference context. It may be used as hero_image_url only when it improves the template.",
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
                  "Strong first line, short paragraphs, direct builder voice, 1-3 emojis max, 15-25 varied hashtags.",
                x:
                  "Under 280 characters, punchy, 0-1 hashtag, no thread unless post_type is thread.",
              },
              visual_system: {
                style:
                  "AI Newsroom / Builder Desk. Dark, high-contrast, text-first, sharp, and readable. Do not make fake hero visuals when no real image URL is provided.",
                template_fields:
                  "Use headline, subhead, visual_subject, swipe_hint, bottom_label, source_name, date, tools, stat, quote, pull_quote, code_snippet, meme_setup, and meme_punchline to direct the image. Only include URL fields like hero_image_url, source_logo, source_logo_url, product_logo, and portrait_url when the input/source provides a real URL; otherwise return null.",
                thumbnail_rule:
                  "The image must still work as a small Instagram grid thumbnail. Keep headline short, direct, and visually punchy.",
                placeholder_rule:
                  "Never output placeholder labels like Tool A, Tool B, Product X, or Founder Y. Use specific real names from the input or role labels like Research agent, Drafting agent, Review agent.",
                uploaded_image_rule:
                  "If a real reference image URL is supplied, do not invent fake screenshots, logos, portraits, or product images. Use the supplied URL only when it makes the visual more concrete.",
                meme_rule:
                  "For meme template, return short meme_setup and meme_punchline fields. The joke should be dry AI-builder humor with a useful point, not offensive, not mean, and not dependent on a copyrighted meme image.",
              },
              cta_rotation:
                "Use follow most often. Rallio and QuoteStack mentions should be rare and natural. Never hard sell.",
              selected_platform_output:
                "Always return the full package. Prioritize caption for Instagram, x_version for X, and linkedin_version for LinkedIn based on selected_platforms.",
              planned_output_contract: input.batch_angle
                ? {
                    pillar_must_equal: input.batch_angle.pillar,
                    template_type_must_equal: input.batch_angle.template_type,
                    cta_should_match: input.batch_angle.cta_intent,
                  }
                : null,
              content_focus: [
                "AI news",
                "AI tools",
                "creator economy",
                "local discovery",
                "founder build-in-public",
                "practical prompts/tutorials",
                "builder memes",
              ],
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
    const templateFieldsWithWorkflow = {
      ...normalizedTemplateFields,
      hero_image_url:
        normalizedTemplateFields.hero_image_url ||
        (input.image_mode === "template" ? referenceImageUrl : undefined),
      reference_image_url: referenceImageUrl,
      reference_image_asset_id: input.reference_image_asset_id,
      selected_platforms: selectedPlatforms,
      image_mode: input.image_mode,
    };

    const content = generatedContentSchema.parse({
      ...parsed,
      pillar: input.batch_angle?.pillar || parsed.pillar,
      template_type: input.batch_angle?.template_type || parsed.template_type,
      template_fields: templateFieldsWithWorkflow,
    });

    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .insert({
        user_id: user.id,
        idea_id: idea.id,
        platform: input.platform,
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
        template_fields: content.template_fields,
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
