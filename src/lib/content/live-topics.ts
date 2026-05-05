import "server-only";

import { z } from "zod";

import type { TemplateType } from "@/lib/content/types";

export type LiveTopic = {
  rank: number;
  title: string;
  url: string;
  source: string;
  score: number;
  comments: number;
  created_at: string;
  pillar_hint: TemplateType;
  hook_direction: string;
};

const algoliaHitSchema = z.object({
  objectID: z.string(),
  title: z.string().nullable().optional(),
  story_title: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  story_url: z.string().nullable().optional(),
  points: z.number().nullable().optional(),
  num_comments: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  _tags: z.array(z.string()).optional().default([]),
});

const algoliaResponseSchema = z.object({
  hits: z.array(algoliaHitSchema),
});

const HN_QUERIES = [
  "AI agents",
  "LLM",
  "prompt engineering",
  "indie hacker",
  "OpenAI",
  "Anthropic",
];

const AI_SIGNALS = [
  "ai",
  "agent",
  "llm",
  "gpt",
  "claude",
  "openai",
  "anthropic",
  "prompt",
  "model",
  "rag",
  "embedding",
  "fine-tune",
  "langchain",
  "copilot",
  "diffusion",
  "transformer",
];

export async function getLiveTopics(limit = 6): Promise<{
  fetched_at: string;
  source: string;
  topics: LiveTopic[];
}> {
  const results = await Promise.allSettled(
    HN_QUERIES.map((query) => fetchHnQuery(query)),
  );
  const merged = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((topic) => isAiAdjacent(topic.title))
    .sort((a, b) => b.score - a.score)
    .filter(dedupeByTitle)
    .slice(0, limit)
    .map((topic, index) => ({ ...topic, rank: index + 1 }));

  return {
    fetched_at: new Date().toISOString(),
    source: merged.length > 0 ? "hackernews_front_72h" : "no_live_topics",
    topics: merged,
  };
}

async function fetchHnQuery(query: string): Promise<LiveTopic[]> {
  const since = Math.floor((Date.now() - 72 * 60 * 60 * 1000) / 1000);
  const url =
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}` +
    `&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=15`;
  const response = await fetch(url, {
    headers: { "User-Agent": "ContentOS/1.0 by wordofaii" },
    next: { revalidate: 60 * 30 },
  });

  if (!response.ok) {
    return [];
  }

  const parsed = algoliaResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    return [];
  }

  return parsed.data.hits
    .map((hit, index) => {
      const title = (hit.title || hit.story_title || "").trim();

      if (!title || title.length < 12 || title.length > 200) {
        return null;
      }

      const targetUrl = hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
      const score = hit.points || 0;

      if (score < 10) {
        return null;
      }

      return {
        rank: index + 1,
        title,
        url: targetUrl,
        source: "Hacker News",
        score,
        comments: hit.num_comments || 0,
        created_at: hit.created_at || new Date().toISOString(),
        pillar_hint: inferPillar(title),
        hook_direction: inferHookDirection(title),
      } satisfies LiveTopic;
    })
    .filter((topic): topic is LiveTopic => topic !== null);
}

function isAiAdjacent(title: string) {
  const normalized = title.toLowerCase();
  return AI_SIGNALS.some((signal) => normalized.includes(signal));
}

function dedupeByTitle(topic: LiveTopic, index: number, list: LiveTopic[]) {
  const normalized = normalizeTitle(topic.title);
  return (
    list.findIndex((candidate) => normalizeTitle(candidate.title) === normalized) ===
    index
  );
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function inferPillar(title: string): TemplateType {
  const normalized = title.toLowerCase();

  if (
    normalized.includes("show hn") ||
    normalized.includes("launch") ||
    normalized.includes("release") ||
    normalized.includes("introducing")
  ) {
    return "news_digest";
  }

  if (
    normalized.includes("vs ") ||
    normalized.includes("compare") ||
    normalized.includes("stack") ||
    normalized.includes("alternatives")
  ) {
    return "tool_stack";
  }

  if (
    normalized.includes("how i") ||
    normalized.includes("how to") ||
    normalized.includes("guide") ||
    normalized.includes("tutorial") ||
    normalized.includes("built")
  ) {
    return "tutorial";
  }

  if (
    normalized.includes("solo") ||
    normalized.includes("indie") ||
    normalized.includes("founder") ||
    normalized.includes("$") ||
    normalized.includes("mrr") ||
    normalized.includes("arr")
  ) {
    return "founder_story";
  }

  return "news_digest";
}

function inferHookDirection(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("show hn")) {
    return "Teach the lesson behind why this Show HN actually works for builders.";
  }

  if (normalized.includes("vs ") || normalized.includes("alternatives")) {
    return "Reframe the comparison around the workflow choice, not the feature list.";
  }

  if (normalized.startsWith("ask hn")) {
    return "Use the question as the tension, then deliver one clear builder answer.";
  }

  if (normalized.includes("$") || normalized.includes("mrr") || normalized.includes("arr")) {
    return "Skip the revenue worship. Surface the operating decision that made it possible.";
  }

  if (normalized.includes("launch") || normalized.includes("release") || normalized.includes("introducing")) {
    return "Translate the launch into what changes for builders this week, not the marketing copy.";
  }

  return "Take a clear builder-to-builder position on what this means for the workflow.";
}
