import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { getLiveTopics, type LiveTopic } from "@/lib/content/live-topics";
import {
  buildRouletteBrief,
  selectRouletteSeed,
} from "@/lib/content/topic-roulette";
import { platforms, postTypes } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";

const rouletteInputSchema = z.object({
  post_type: z.enum(postTypes),
  quantity: z.coerce.number().int().min(1).max(20),
  selected_platforms: z
    .array(z.enum(platforms))
    .min(1)
    .optional()
    .default(["instagram"]),
  source: z.enum(["auto", "evergreen", "live"]).optional().default("auto"),
});

const recentPostSchema = z.object({
  headline: z.string().nullable(),
  hook: z.string().nullable(),
  pillar: z.string().nullable(),
});

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = rouletteInputSchema.parse(await request.json());
    const { supabase } = await requireApiUser();

    const { data: recentPosts } = await supabase
      .from("generated_posts")
      .select("headline, hook, pillar")
      .order("created_at", { ascending: false })
      .limit(20);

    const safeRecentPosts = z.array(recentPostSchema).parse(recentPosts || []);
    const liveTopic =
      input.source === "evergreen"
        ? null
        : await pickLiveTopic({
            source: input.source,
            recentPosts: safeRecentPosts,
          });

    if (liveTopic) {
      return jsonOk(buildLiveTopicResponse(liveTopic, input));
    }

    const seed = selectRouletteSeed({
      postType: input.post_type,
      quantity: input.quantity,
      selectedPlatforms: input.selected_platforms,
      recentPosts: safeRecentPosts,
    });
    const selectedAngles = seed.angleVariants.slice(
      0,
      Math.max(1, Math.min(input.quantity, seed.angleVariants.length)),
    );

    return jsonOk({
      title: seed.title,
      brief: buildRouletteBrief(seed, input.quantity),
      source_url: "",
      tone: seed.preferredTone,
      template_hint: seed.templateHint,
      content_mode: "standard",
      selected_platforms: input.selected_platforms,
      roulette: {
        seed_id: seed.id,
        source: "evergreen_bank",
        visual_direction: seed.visualDirection,
        contrast_setup: seed.contrastSetup,
        anti_generic_notes: seed.antiGenericNotes,
        angle_hints: selectedAngles,
      },
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}

type RouletteInput = z.infer<typeof rouletteInputSchema>;
type RecentPost = z.infer<typeof recentPostSchema>;

async function pickLiveTopic({
  source,
  recentPosts,
}: {
  source: RouletteInput["source"];
  recentPosts: RecentPost[];
}): Promise<LiveTopic | null> {
  // In auto mode, use a live topic ~50% of the time. Day-seeded so a single
  // user clicking refresh quickly does not bounce between sources.
  if (source === "auto") {
    const dayOffset = Math.floor(Date.now() / 86_400_000);
    if (dayOffset % 2 === 1) {
      return null;
    }
  }

  const live = await getLiveTopics(8);

  if (!live.topics.length) {
    return null;
  }

  const recentText = recentPosts
    .flatMap((post) => [post.headline, post.hook])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const fresh = live.topics.filter(
    (topic) => !isAlreadyCovered(topic.title, recentText),
  );
  const pool = fresh.length ? fresh : live.topics;

  return pool[0];
}

function isAlreadyCovered(title: string, recentText: string) {
  if (!recentText) {
    return false;
  }

  const tokens = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 5);

  // Cover if at least two distinctive tokens already appeared recently.
  let hits = 0;
  for (const token of tokens) {
    if (recentText.includes(token)) {
      hits += 1;
      if (hits >= 2) {
        return true;
      }
    }
  }

  return false;
}

function buildLiveTopicResponse(topic: LiveTopic, input: RouletteInput) {
  const tone =
    topic.pillar_hint === "founder_story"
      ? ("founder" as const)
      : topic.pillar_hint === "tutorial"
        ? ("tutorial" as const)
        : topic.pillar_hint === "tool_stack"
          ? ("educational" as const)
          : ("news" as const);
  const liveDate = normalizeLiveTopicDate(topic.created_at);
  const discussionUrl = topic.discussion_url || topic.url;
  const externalLine = topic.external_url
    ? `External link: ${topic.external_url}`
    : "";

  const brief = [
    `Live topic surfaced from ${topic.source} (score ${topic.score}, ${topic.comments} comments).`,
    `Live discussion date: ${liveDate}.`,
    "",
    `Story: ${topic.title}`,
    `Source discussion: ${discussionUrl}`,
    externalLine,
    "",
    `Suggested pillar: ${topic.pillar_hint}.`,
    `Hook direction: ${topic.hook_direction}`,
    "",
    "Treat this as a current event. Take a clear builder-to-builder position.",
    "Do not summarize the link. Deliver one sharp lesson, contrast, or workflow takeaway.",
    "If the link is a launch, focus on what changes for builders this week.",
    `If the image uses a date, use ${liveDate}. Do not use an older date from the external article, repo, or product page.`,
  ].filter(Boolean).join("\n");

  return {
    title: topic.title,
    brief,
    source_url: discussionUrl,
    tone,
    template_hint: topic.pillar_hint,
    content_mode: "standard" as const,
    selected_platforms: input.selected_platforms,
    roulette: {
      seed_id: `live:hn:${normalizeIdToken(topic.title)}`,
      source: "live_hackernews",
      visual_direction:
        `Newsroom card. Pull the story title into a sharp builder headline. Use source_name = Hacker News if no logo URL exists. Use date = ${liveDate}; never use an older external artifact date.`,
      contrast_setup:
        "Contrast the headline narrative with the actual builder takeaway readers should act on.",
      anti_generic_notes:
        "Do not paraphrase the article. Take a position. No 'this is huge' or 'game changer' language.",
      angle_hints: [
        {
          working_title: topic.title.slice(0, 80),
          pillar: topic.pillar_hint,
          hook_direction: topic.hook_direction,
          unique_takeaway: "Translate the story into one operating change for AI builders.",
          visual_direction: `News digest template with headline + crisp subhead. Source: Hacker News. Date: ${liveDate}.`,
          do_not_repeat: "Do not echo the article wording. Reframe with a builder lens.",
        },
      ],
    },
  };
}

function normalizeIdToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeLiveTopicDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}
