import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { WORD_OF_AI_SYSTEM_PROMPT } from "@/lib/content/brand";
import { getCtaStrategy } from "@/lib/content/cta-strategy";
import { getPersonaCooldown } from "@/lib/content/persona-history";
import { getRecentWinningHooks } from "@/lib/content/winners";
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
import { getWeeklyMemeTrends } from "@/lib/content/meme-trends";
import {
  enforceProductMentionGate,
  PRODUCT_MENTION_CONFIG,
} from "@/lib/content/product-gate";
import { validateGeneratedContentQuality } from "@/lib/content/quality";
import type { Json } from "@/types/database";

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
  info_rows: z.array(z.string()).nullable(),
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
  authority_figure: z.string().nullable(),
  topical_event: z.string().nullable(),
  contrarian_take: z.string().nullable(),
  builder_lesson: z.string().nullable(),
  text_overlay_hook: z.string().nullable(),
  review_notes: z.string().nullable(),
  portrait_url: z.string().nullable(),
});

const openAIContentSchema = z.object({
  pillar: z.enum(templateTypes),
  template_type: z.enum(templateTypes),
  contrast: z.object({
    group_1: z.string(),
    group_2: z.string(),
    differences: z.array(z.string()).min(3).max(5),
  }),
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
  visual_alignment_note: z.string(),
  virality_score: z.object({
    tension: z.number(),
    clarity: z.number(),
    usefulness: z.number(),
    memorability: z.number(),
    total: z.number(),
    revision_notes: z.string(),
  }),
  template_fields: openAITemplateFieldsSchema,
});

const recentPostSchema = z.object({
  headline: z.string().nullable(),
  hook: z.string().nullable(),
  pillar: z.string().nullable(),
  cta: z.string().nullable(),
  hashtags: z.array(z.string()).nullable(),
});

type OpenAIContentPackage = z.infer<typeof openAIContentSchema>;
type GeneratedContentPackage = z.infer<typeof generatedContentSchema>;

const fallbackActionBullets = [
  "defines the job before asking AI to work",
  "gives the model context from the actual workflow",
  "reviews the output before it reaches a customer or audience",
  "turns repeatable tasks into a system instead of a one-off prompt",
  "measures where human judgment still changes the result",
];

const fallbackHashtags = [
  "#ai",
  "#aibuilder",
  "#aitools",
  "#aiagents",
  "#buildinpublic",
  "#indiehacker",
  "#automation",
  "#promptengineering",
  "#aiautomation",
  "#founder",
  "#productivity",
  "#startup",
  "#tech",
  "#llm",
  "#futureofwork",
];

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
    info_rows: fields.info_rows || undefined,
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
    authority_figure: fields.authority_figure || undefined,
    topical_event: fields.topical_event || undefined,
    contrarian_take: fields.contrarian_take || undefined,
    builder_lesson: fields.builder_lesson || undefined,
    text_overlay_hook: fields.text_overlay_hook || undefined,
    review_notes: fields.review_notes || undefined,
    portrait_url: fields.portrait_url || undefined,
  };
}

function createQualityFallbackContent({
  candidate,
  contrast,
  viralityScore,
  visualAlignmentNote,
  failures,
  attempt,
}: {
  candidate: GeneratedContentPackage;
  contrast: OpenAIContentPackage["contrast"];
  viralityScore: OpenAIContentPackage["virality_score"];
  visualAlignmentNote: string;
  failures: string[];
  attempt: number;
}) {
  const hook = scrubGenericCopy(candidate.hook || candidate.headline);
  const headline = scrubGenericCopy(candidate.headline || hook);
  const subhead = scrubGenericCopy(
    candidate.subhead ||
      "The gap is not who uses AI. It is who builds the sharper workflow.",
  );
  const bullets = getFallbackActionBullets(candidate, contrast);
  const finalLine = "This isn't about using more AI. It's about building better loops.";
  const hashtags = normalizeFallbackHashtags(candidate.hashtags);
  const caption = [
    hook,
    "",
    "The weak version adds another tool.",
    "The useful version changes the behavior around the tool.",
    "",
    ...bullets.map((bullet) => `- ${bullet}`),
    "",
    finalLine,
    "",
    hashtags.join(" "),
  ].join("\n");
  const xVersion = buildXFallback(hook, bullets);
  const linkedinVersion = [
    hook,
    "",
    "The workflow gap usually shows up in behavior, not tooling.",
    "",
    ...bullets.slice(0, 4).map((bullet) => `- ${sentenceCase(bullet)}`),
    "",
    finalLine,
  ].join("\n");

  const repaired = generatedContentSchema.parse({
    ...candidate,
    hook,
    headline,
    subhead,
    caption,
    hashtags,
    cta: "Follow @wordofaii for more builder-grade AI workflows.",
    x_version: xVersion,
    linkedin_version: linkedinVersion,
    template_fields: {
      ...candidate.template_fields,
      headline,
      subhead,
      quality_gate: {
        passed: false,
        repaired: true,
        attempt,
        failures,
        contrast,
        visual_alignment_note: visualAlignmentNote,
        virality_score: viralityScore,
        notes: [
          "OpenAI repair attempts did not pass every strict quality rule.",
          "Content OS created a structured review draft instead of failing the run.",
        ],
      },
      review_notes: [
        candidate.template_fields.review_notes,
        "Quality fallback used. Review caption specificity before posting.",
      ]
        .filter(Boolean)
        .join(" "),
    },
  });

  return enforceProductMentionGate(repaired);
}

function getFallbackActionBullets(
  candidate: GeneratedContentPackage,
  contrast: OpenAIContentPackage["contrast"],
) {
  const fromContrast = contrast.differences
    .map((difference) =>
      difference
        .replace(/^[-–•]\s*/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((difference) => hasActionShape(difference));
  const fromVisual = [
    candidate.template_fields.code_snippet ? "uses the prompt recipe shown in the image" : "",
    candidate.template_fields.tools?.length
      ? `tests ${candidate.template_fields.tools.slice(0, 2).join(" and ")} on one real task`
      : "",
    candidate.template_fields.meme_setup ? "turns the joke into a workflow lesson" : "",
  ].filter(Boolean);

  return uniqueStrings([...fromContrast, ...fromVisual, ...fallbackActionBullets]).slice(
    0,
    5,
  );
}

function hasActionShape(value: string) {
  const normalized = value.toLowerCase();

  if (
    /^(lazy|advanced|smart|smarter|casual|intentional|better|expert)\s+(user|users|people|builders)\b/.test(
      normalized,
    )
  ) {
    return false;
  }

  return /\b(accepts|analyzes|asks|assesses|audits|builds|checks|compares|defines|delegates|documents|edits|filters|gives|identifies|maintains|maps|measures|reviews|runs|ships|tests|tracks|uses|verifies|writes)\b/.test(
    normalized,
  );
}

function normalizeFallbackHashtags(hashtags: string[]) {
  const normalized = hashtags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

  return uniqueStrings([...normalized, ...fallbackHashtags]).slice(0, 20);
}

function buildXFallback(hook: string, bullets: string[]) {
  const compact = `${hook} The gap is behavior: ${bullets
    .slice(0, 3)
    .map((bullet) => bullet.replace(/\.$/, ""))
    .join("; ")}.`;

  if (compact.length <= 280) {
    return compact;
  }

  return `${hook} The gap is behavior: define the job, give context, review before shipping.`;
}

function scrubGenericCopy(value: string) {
  return value
    .replace(/ai is a tool/gi, "AI exposes the workflow")
    .replace(/use it wisely/gi, "build the loop deliberately")
    .replace(/embrace the future/gi, "audit the workflow")
    .replace(/stay ahead/gi, "keep the workflow honest")
    .replace(/leverage effectively/gi, "use on a real task")
    .replace(/unlock the power/gi, "find the useful edge")
    .replace(/ready to level up/gi, "ready to tighten the workflow")
    .trim();
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
    const winningHooks = await getRecentWinningHooks(supabase, 5);
    const personaCooldown =
      input.content_mode === "authority_pov"
        ? await getPersonaCooldown(supabase, input.recognizable_figure)
        : null;
    const ctaStrategy = getCtaStrategy(
      input.batch_angle?.pillar ||
        (input.template_hint !== "auto" ? input.template_hint : null),
    );
    const memeTrendContext =
      input.template_hint === "meme" || input.batch_angle?.template_type === "meme"
        ? await getWeeklyMemeTrends(10)
        : null;
    const { apiKey, model } = getOpenAIEnv();
    const openai = new OpenAI({ apiKey });

    let content: z.infer<typeof generatedContentSchema> | null = null;
    let qualityFailures: string[] = [];
    let fallbackCandidate: GeneratedContentPackage | null = null;
    let fallbackQualityContext: {
      contrast: OpenAIContentPackage["contrast"];
      viralityScore: OpenAIContentPackage["virality_score"];
      visualAlignmentNote: string;
      attempt: number;
    } | null = null;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const isRepairPass = qualityFailures.length > 0;
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
              "Depth enforcement is mandatory: after the hook, expand the idea with specific behaviors, concrete contrast, and no motivational filler.",
              "Instagram caption structure is mandatory: 1-line hook, 1-2 lines of tension, 3-5 behavioral bullet points, one strong ending line, then hashtags.",
              "Every bullet must describe an action someone does. Do not write labels like advanced users, casual users, smart users, or better users.",
              "The final line must be a reframe, insight, or filter ending. Examples: This isn't X. It's Y. / Most people miss this. / This is where the workflow breaks.",
              "Do not reuse content across platforms. Instagram is spaced and skimmable, X is compressed and sharper, LinkedIn is slightly expanded but still structured.",
              "Optimize for saves, shares, retention, and usefulness without inventing facts.",
              winningHooks.length > 0
                ? `Voice anchor: this account's most recently approved hooks were — ${winningHooks
                    .map((winner, index) => `(${index + 1}) "${winner.hook}"`)
                    .join(" ")}. Match this hook density, specificity, and rhythm. Do not copy any of these lines verbatim.`
                : "",
              ctaStrategy
                ? `CTA strategy for ${ctaStrategy.pillar}: optimize for ${ctaStrategy.primary_goal}. The CTA must read like one of these shapes — ${ctaStrategy.shapes
                    .map((shape, index) => `(${index + 1}) "${shape}"`)
                    .join(" ")}. Avoid: ${ctaStrategy.avoid.join(" ")} Do not default to "Follow @wordofaii" for this pillar.`
                : "",
              personaCooldown && personaCooldown.on_cooldown
                ? `Persona cooldown: "${personaCooldown.figure}" was used in the last ${personaCooldown.cooldown_days} days. Recent angles already covered: ${personaCooldown.recent_uses
                    .map((use) => `"${use.hook || use.headline || ""}" (${use.days_ago}d ago)`)
                    .join(" | ")}. The hook, takeaway, and contrast for this post must be entirely different from those.`
                : "",
              isRepairPass
                ? "Repair pass: keep the planned angle, but rewrite the weak caption, contrast differences, platform variants, and final line so the output passes the quality gate. Do not soften the hook."
                : "",
              PRODUCT_MENTION_CONFIG.product_mentions_enabled
                ? "Product mentions may be used only when explicitly relevant."
                : "Product mentions are paused. Do not mention Rallio, Raillio, QuoteStack, downloads, app signups, or link-in-bio product asks.",
              qualityFailures.length
                ? `Previous attempt failed quality gate. Fix these issues: ${qualityFailures.join(" ")}`
                : "",
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
                content_mode: input.content_mode,
                quality_gate: {
                  banned_phrases: [
                    "AI is a tool",
                    "use it wisely",
                    "embrace the future",
                    "stay ahead",
                    "leverage effectively",
                    "unlock the power",
                    "ready to level up",
                  ],
                  contrast_required:
                    "Return contrast.group_1, contrast.group_2, and 3-5 action-based differences. Differences must be behaviors like 'writes vague prompts' or 'accepts first output', not labels.",
                  virality_required:
                    "Score tension, clarity, usefulness, and memorability out of 10. Total must be at least 30/40 before returning.",
                  visual_alignment_required:
                    "If the image/template includes steps, a recipe, a framework, a prompt block, or tools, the caption must expand that exact visual idea.",
                },
                authority_pov:
                  input.content_mode === "authority_pov"
                    ? {
                        recognizable_figure: input.recognizable_figure || null,
                        current_event: input.current_event || null,
                        contrarian_take: input.contrarian_take || null,
                        builder_lesson: input.builder_lesson || null,
                        instruction:
                          "Use the recognizable figure/current event to gain authority, then make a confident original builder point. Do not summarize the figure; use them as context for a practical insight.",
                      }
                    : null,
                template_hint: input.template_hint,
                meme_trend_context:
                  memeTrendContext &&
                  (input.template_hint === "meme" ||
                    input.batch_angle?.template_type === "meme")
                    ? {
                        source: memeTrendContext.source,
                        fetched_at: memeTrendContext.fetched_at,
                        trends: memeTrendContext.trends,
                        selected_batch_trend: input.batch_angle
                          ? {
                              title: input.batch_angle.meme_trend_title || null,
                              source: input.batch_angle.meme_trend_source || null,
                              format: input.batch_angle.meme_format || null,
                              adaptation: input.batch_angle.meme_adaptation || null,
                            }
                          : null,
                        instruction:
                          "Use current meme trend context as inspiration for format and setup. Do not copy images, slurs, harassment, or copyrighted visual assets. Make it a Word of AI builder joke.",
                      }
                    : null,
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
                winning_hooks_voice_anchor: winningHooks.length
                  ? {
                      instruction:
                        "These hooks were approved or shipped on this account. Match their voice and specificity, but do not copy them.",
                      hooks: winningHooks,
                    }
                  : null,
                cta_strategy: ctaStrategy
                  ? {
                      pillar: ctaStrategy.pillar,
                      primary_goal: ctaStrategy.primary_goal,
                      preferred_shapes: ctaStrategy.shapes,
                      avoid: ctaStrategy.avoid,
                      instruction:
                        "Use this pillar's primary engagement goal to shape the CTA. Do not default to a follow ask unless the pillar's primary_goal is follow.",
                    }
                  : null,
                persona_cooldown:
                  personaCooldown && personaCooldown.on_cooldown
                    ? {
                        figure: personaCooldown.figure,
                        cooldown_days: personaCooldown.cooldown_days,
                        recent_uses: personaCooldown.recent_uses,
                        instruction:
                          "This figure was used recently. The hook, contrast, takeaway, and CTA must differ entirely from the recent uses listed.",
                      }
                    : null,
                caption_rules: {
                  instagram:
                    "Strong first line, 1-2 line tension, 3-5 action bullets, strong final reframe/filter/insight, then 15-25 varied hashtags. 1-3 emojis max.",
                  x:
                    "Under 280 characters, sharper than Instagram, 0-1 hashtag, no thread unless post_type is thread.",
                  linkedin:
                    "Slightly expanded, still structured, no corporate tone, no long paragraphs.",
                },
                visual_system: {
                  style:
                    "AI Newsroom / Builder Desk. Dark, high-contrast, text-first, sharp, and readable. Do not make fake hero visuals when no real image URL is provided.",
                  template_fields:
                    "Use headline, subhead, visual_subject, swipe_hint, bottom_label, info_rows, source_name, date, tools, stat, quote, pull_quote, code_snippet, meme_setup, meme_punchline, authority_figure, topical_event, contrarian_take, builder_lesson, text_overlay_hook, and review_notes to direct the image and review flow. Add 2-3 short info_rows when the visual would benefit from concrete proof, contrast, or checklist detail. Only include URL fields like hero_image_url, source_logo, source_logo_url, product_logo, and portrait_url when the input/source provides a real URL; otherwise return null.",
                  thumbnail_rule:
                    "The image must still work as a small Instagram grid thumbnail. Keep headline short, direct, and visually punchy.",
                  placeholder_rule:
                    "Never output placeholder labels like Tool A, Tool B, Product X, or Founder Y. Use specific real names from the input or role labels like Research agent, Drafting agent, Review agent.",
                  uploaded_image_rule:
                    "If a real reference image URL is supplied, do not invent fake screenshots, logos, portraits, or product images. Use the supplied URL only when it makes the visual more concrete.",
                  meme_rule:
                    "For meme template, return short meme_setup and meme_punchline fields. The joke should be dry AI-builder humor with a useful point, not offensive, not mean, and not dependent on a copyrighted meme image.",
                  authority_pov_rule:
                    "For authority_pov mode, return authority_figure, topical_event, contrarian_take, builder_lesson, text_overlay_hook, and review_notes. Make the reel_script a short talking-head script with a hook, the authority/current-event setup, the sharp take, and one practical builder takeaway.",
                },
                cta_rotation:
                  PRODUCT_MENTION_CONFIG.product_mentions_enabled
                    ? "Use follow most often. Rallio and QuoteStack mentions should be rare and natural. Never hard sell."
                    : "Use follow CTAs only. Do not mention Rallio, Raillio, QuoteStack, downloads, app signups, or link-in-bio product asks.",
                selected_platform_output:
                  "Always return the full package. Prioritize caption for Instagram, x_version for X, and linkedin_version for LinkedIn based on selected_platforms.",
                planned_output_contract: input.batch_angle
                  ? {
                      pillar_must_equal: input.batch_angle.pillar,
                      template_type_must_equal: input.batch_angle.template_type,
                      cta_should_match: PRODUCT_MENTION_CONFIG.product_mentions_enabled
                        ? input.batch_angle.cta_intent
                        : "follow",
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
        content_mode: input.content_mode,
        authority_figure:
          normalizedTemplateFields.authority_figure || input.recognizable_figure || undefined,
        topical_event:
          normalizedTemplateFields.topical_event || input.current_event || undefined,
        contrarian_take:
          normalizedTemplateFields.contrarian_take || input.contrarian_take || undefined,
        builder_lesson:
          normalizedTemplateFields.builder_lesson || input.builder_lesson || undefined,
      };

      const parsedContent = generatedContentSchema.parse({
        ...parsed,
        pillar:
          input.batch_angle?.pillar ||
          (input.template_hint !== "auto" ? input.template_hint : parsed.pillar),
        template_type:
          input.batch_angle?.template_type ||
          (input.template_hint !== "auto" ? input.template_hint : parsed.template_type),
        template_fields: templateFieldsWithWorkflow,
      });
      const candidate = enforceProductMentionGate(parsedContent);
      fallbackCandidate = candidate;
      fallbackQualityContext = {
        contrast: parsed.contrast,
        viralityScore: parsed.virality_score,
        visualAlignmentNote: parsed.visual_alignment_note,
        attempt,
      };
      const qualityResult = validateGeneratedContentQuality({
        content: candidate,
        contrast: parsed.contrast,
        viralityScore: parsed.virality_score,
        visualAlignmentNote: parsed.visual_alignment_note,
        templateFields: candidate.template_fields,
      });

      if (qualityResult.ok) {
        content = {
          ...candidate,
          template_fields: {
            ...candidate.template_fields,
            quality_gate: {
              passed: true,
              attempt,
              contrast: parsed.contrast,
              visual_alignment_note: parsed.visual_alignment_note,
              virality_score: parsed.virality_score,
              notes: qualityResult.notes,
            },
          },
        };
        break;
      }

      qualityFailures = qualityResult.failures;
    }

    if (!content && fallbackCandidate && fallbackQualityContext) {
      content = createQualityFallbackContent({
        candidate: fallbackCandidate,
        contrast: fallbackQualityContext.contrast,
        viralityScore: fallbackQualityContext.viralityScore,
        visualAlignmentNote: fallbackQualityContext.visualAlignmentNote,
        failures: qualityFailures,
        attempt: fallbackQualityContext.attempt,
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
