import "server-only";

import { z } from "zod";

export type ResearchResult = {
  query: string;
  answer: string;
  sources: ResearchSource[];
  fetched_at: string;
};

export type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
  score: number;
};

const tavilyResponseSchema = z.object({
  query: z.string().optional(),
  answer: z.string().nullable().optional(),
  results: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        content: z.string().optional().default(""),
        score: z.number().optional().default(0),
      }),
    )
    .optional()
    .default([]),
});

export function isResearchEnabled(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

/**
 * Calls Tavily Search API to do live web research on a topic and returns
 * a synthesized answer plus the underlying sources. Used as fact context
 * for content generation so the model isn't reasoning purely from training
 * data on fast-moving AI topics.
 *
 * Returns null when no API key is configured so the caller can no-op
 * gracefully and fall back to existing source_summary behavior.
 */
export async function researchTopic(
  topic: string,
  options: { depth?: "basic" | "advanced"; maxResults?: number } = {},
): Promise<ResearchResult | null> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return null;
  }

  const trimmed = topic.trim();
  if (!trimmed || trimmed.length < 4) {
    return null;
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: trimmed,
        search_depth: options.depth ?? "basic",
        include_answer: true,
        include_raw_content: false,
        max_results: options.maxResults ?? 6,
        topic: "general",
      }),
      // 12s ceiling — generation already takes ~10s with OpenAI, don't
      // double the latency on a slow Tavily call.
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      return null;
    }

    const parsed = tavilyResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      return null;
    }

    const sources: ResearchSource[] = parsed.data.results
      .filter((row) => row.title && row.url)
      .slice(0, options.maxResults ?? 6)
      .map((row) => ({
        title: row.title,
        url: row.url,
        snippet: truncate(row.content, 320),
        score: row.score,
      }));

    return {
      query: parsed.data.query || trimmed,
      answer: (parsed.data.answer || "").trim(),
      sources,
      fetched_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function truncate(value: string, max: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max - 1) + "…";
}
