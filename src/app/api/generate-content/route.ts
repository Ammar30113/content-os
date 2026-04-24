import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
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

const openAITemplateFieldsSchema = z.object({
  headline: z.string(),
  subhead: z.string(),
  source_name: z.string().nullable(),
  source_logo: z.string().nullable(),
  date: z.string().nullable(),
  tools: z.array(z.string()).nullable(),
  tool_logos: z.array(z.string()).nullable(),
  step_number: z.string().nullable(),
  code_snippet: z.string().nullable(),
  stat: z.string().nullable(),
  quote: z.string().nullable(),
  attribution: z.string().nullable(),
  pull_quote: z.string().nullable(),
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

async function summarizeSourceUrl(sourceUrl: string) {
  try {
    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(7000),
      headers: {
        "User-Agent": "Content OS internal research bot",
      },
    });

    if (!response.ok) {
      return `Unavailable: source returned HTTP ${response.status}.`;
    }

    const text = await response.text();
    const cleanText = text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      return "Unavailable: source did not contain readable text.";
    }

    return cleanText.slice(0, 1800);
  } catch (error) {
    return `Unavailable: ${
      error instanceof Error ? error.message : "source fetch failed"
    }.`;
  }
}

function normalizeTemplateFields(
  fields: z.infer<typeof openAITemplateFieldsSchema>,
) {
  return {
    headline: fields.headline,
    subhead: fields.subhead,
    source_name: fields.source_name || undefined,
    source_logo: fields.source_logo || undefined,
    date: fields.date || undefined,
    tools: fields.tools || undefined,
    tool_logos: fields.tool_logos || undefined,
    step_number: fields.step_number || undefined,
    code_snippet: fields.code_snippet || undefined,
    stat: fields.stat || undefined,
    quote: fields.quote || undefined,
    attribution: fields.attribution || undefined,
    pull_quote: fields.pull_quote || undefined,
    portrait_url: fields.portrait_url || undefined,
  };
}

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = ideaInputSchema.parse(await request.json());
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
      })
      .select()
      .single();

    if (ideaError || !idea) {
      throw new Error(ideaError?.message || "Could not create idea.");
    }

    const { apiKey, model } = getOpenAIEnv();
    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.parse({
      model,
      input: [
        {
          role: "system",
          content:
            "You are Content OS for Word of AI (@wordofaii), a sharp AI/tech media brand. Generate practical, save-worthy social content for a smart Gen Z, founder, and AI-curious audience. Avoid corporate fluff, fake claims, and hard selling. Rallio may be mentioned lightly only when local discovery, creator economy, or founder context makes it natural. QuoteStack should be rare and only natural in founder/B2B context.",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "Generate a complete social post package.",
              title: input.title,
              brief: input.brief,
              source_url: input.source_url || null,
              source_summary: sourceSummary || "No source URL provided.",
              platform: input.platform,
              post_type: input.post_type,
              tone: input.tone,
              template_hint: input.template_hint,
              content_focus: [
                "AI news",
                "AI tools",
                "creator economy",
                "local discovery",
                "founder build-in-public",
                "practical prompts/tutorials",
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

    const content = generatedContentSchema.parse({
      ...parsed,
      template_fields: normalizeTemplateFields(parsed.template_fields),
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
        status: "draft",
        image_status: "not_generated",
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
