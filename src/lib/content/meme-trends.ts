import "server-only";

import { z } from "zod";

export type MemeTrend = {
  rank: number;
  title: string;
  source: string;
  url: string;
  score: number;
  format_hint: string;
};

const TREND_SUBREDDITS = [
  "ProgrammerHumor",
  "ChatGPT",
  "ArtificialInteligence",
  "memes",
  "dankmemes",
];

const redditListingSchema = z.object({
  data: z.object({
    children: z.array(
      z.object({
        data: z.object({
          title: z.string(),
          permalink: z.string(),
          subreddit: z.string(),
          score: z.number().optional().default(0),
          over_18: z.boolean().optional().default(false),
          stickied: z.boolean().optional().default(false),
        }),
      }),
    ),
  }),
});

const fallbackTrends: MemeTrend[] = [
  {
    rank: 1,
    title: "AI agent says it finished, then asks for the same context again",
    source: "fallback",
    url: "",
    score: 0,
    format_hint: "expectation vs reality",
  },
  {
    rank: 2,
    title: "Founder automates one task and accidentally creates three review tasks",
    source: "fallback",
    url: "",
    score: 0,
    format_hint: "automation irony",
  },
  {
    rank: 3,
    title: "The model is smart, the workflow is still chaos",
    source: "fallback",
    url: "",
    score: 0,
    format_hint: "smart tool, messy system",
  },
  {
    rank: 4,
    title: "AI tools tab count becomes the real productivity metric",
    source: "fallback",
    url: "",
    score: 0,
    format_hint: "tool fatigue",
  },
  {
    rank: 5,
    title: "When the agent needs a manager and the manager is also an agent",
    source: "fallback",
    url: "",
    score: 0,
    format_hint: "recursive agent problem",
  },
];

export async function getWeeklyMemeTrends(limit = 10) {
  const results = await Promise.allSettled(
    TREND_SUBREDDITS.map((subreddit) => fetchSubredditTop(subreddit)),
  );
  const trends = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => b.score - a.score)
    .filter(dedupeTrendTitles)
    .slice(0, limit)
    .map((trend, index) => ({
      ...trend,
      rank: index + 1,
    }));

  return {
    fetched_at: new Date().toISOString(),
    source:
      trends.length > 0
        ? "reddit_top_week"
        : "fallback_builder_meme_formats",
    trends: trends.length ? trends : fallbackTrends.slice(0, limit),
  };
}

async function fetchSubredditTop(subreddit: string): Promise<MemeTrend[]> {
  const response = await fetch(
    `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=12`,
    {
      headers: {
        "User-Agent": "ContentOS/1.0 by wordofaii",
      },
      next: {
        revalidate: 60 * 60,
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const parsed = redditListingSchema.safeParse(await response.json());

  if (!parsed.success) {
    return [];
  }

  return parsed.data.data.children
    .map((child) => child.data)
    .filter((post) => !post.over_18 && !post.stickied)
    .filter((post) => post.title.length >= 12 && post.title.length <= 160)
    .map((post, index) => ({
      rank: index + 1,
      title: post.title,
      source: `r/${post.subreddit}`,
      url: `https://www.reddit.com${post.permalink}`,
      score: post.score || 0,
      format_hint: inferFormatHint(post.title),
    }));
}

function dedupeTrendTitles(trend: MemeTrend, index: number, trends: MemeTrend[]) {
  const normalized = normalizeTrendTitle(trend.title);

  return (
    trends.findIndex(
      (candidate) => normalizeTrendTitle(candidate.title) === normalized,
    ) === index
  );
}

function normalizeTrendTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function inferFormatHint(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("when ")) {
    return "when-this-happens reaction";
  }

  if (normalized.includes("me ") || normalized.includes("my ")) {
    return "relatable first-person pain";
  }

  if (normalized.includes("vs") || normalized.includes("versus")) {
    return "versus comparison";
  }

  if (normalized.includes("pov")) {
    return "POV setup";
  }

  if (normalized.includes("every")) {
    return "every-builder pattern";
  }

  return "setup and punchline";
}
