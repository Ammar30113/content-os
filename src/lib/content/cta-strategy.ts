import type { TemplateType } from "@/lib/content/types";

export type CtaStrategy = {
  pillar: TemplateType;
  primary_goal: string;
  shapes: string[];
  avoid: string[];
};

/**
 * Per-pillar CTA strategy. The model still writes the literal CTA string;
 * this just steers it toward the engagement signal that actually compounds
 * for each content pillar.
 *
 * Saves > follows for tutorials. Shares > saves for tool stacks. Replies >
 * everything for founder stories. Tags > likes for memes.
 */
export const CTA_STRATEGY_BY_PILLAR: Record<TemplateType, CtaStrategy> = {
  tutorial: {
    pillar: "tutorial",
    primary_goal: "save",
    shapes: [
      "Save this prompt for the next time the workflow breaks.",
      "Bookmark this if you keep rewriting the same brief from scratch.",
      "Save this and run it on a real task this week.",
    ],
    avoid: [
      "Generic 'follow for more' endings.",
      "Asking the reader to comment with a generic question.",
    ],
  },
  tool_stack: {
    pillar: "tool_stack",
    primary_goal: "share",
    shapes: [
      "Send this to the builder friend who is stack-hopping every week.",
      "Forward this to the operator on your team who keeps adding tools.",
      "Share this with the one builder still pasting between five tabs.",
    ],
    avoid: [
      "Asking for a follow.",
      "Vague 'try it out' lines that do not name a person to send it to.",
    ],
  },
  news_digest: {
    pillar: "news_digest",
    primary_goal: "quote_and_react",
    shapes: [
      "Quote-tweet your take if you disagree.",
      "Repost with one sentence on what this changes for builders this week.",
      "Drop the workflow change you are making because of this.",
    ],
    avoid: [
      "Asking for a follow.",
      "'Stay ahead' or 'don't miss out' urgency bait.",
    ],
  },
  creator_economy: {
    pillar: "creator_economy",
    primary_goal: "save_and_apply",
    shapes: [
      "Save this and try one move with your audience this week.",
      "Steal this and ship it before Friday.",
      "Save this if you keep posting and not seeing the loop close.",
    ],
    avoid: [
      "Hustle bait or 'level up' language.",
      "Calling the reader a creator instead of an operator.",
    ],
  },
  founder_story: {
    pillar: "founder_story",
    primary_goal: "reply",
    shapes: [
      "Reply with the version of this you lived.",
      "What is the one decision you would unmake if you could?",
      "Tell me the lesson you would have written instead.",
    ],
    avoid: [
      "Asking for a follow.",
      "Pitching a product or page.",
      "Generic 'thoughts?' endings with no specific prompt.",
    ],
  },
  meme: {
    pillar: "meme",
    primary_goal: "tag",
    shapes: [
      "Tag the builder who has lived this exact loop.",
      "Send this to the one teammate who needs to see it.",
      "Tag the founder still calling this 'almost done.'",
    ],
    avoid: [
      "Asking for a follow.",
      "Long captions that ruin the punchline.",
    ],
  },
};

export function getCtaStrategy(pillar: string | null | undefined): CtaStrategy | null {
  if (!pillar) return null;
  return CTA_STRATEGY_BY_PILLAR[pillar as TemplateType] ?? null;
}
