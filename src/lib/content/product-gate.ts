import type { GeneratedContent } from "@/lib/content/types";

export const PRODUCT_MENTION_CONFIG = {
  product_mentions_enabled: false,
  rallio_entry_mode: "build_in_public",
  launch_threshold_followers: 20000,
  suppressed_products: ["Rallio", "QuoteStack"],
  default_cta: "Follow @wordofaii for sharp AI builder breakdowns.",
} as const;

const PRODUCT_PATTERN = /\b(Rallio|Raillio|QuoteStack)\b/i;

function stripProductLines(value: string) {
  return value
    .split("\n")
    .filter((line) => !PRODUCT_PATTERN.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function productMentionsAreEnabled() {
  return PRODUCT_MENTION_CONFIG.product_mentions_enabled;
}

export function enforceProductMentionGate<T extends GeneratedContent>(
  content: T,
) {
  if (productMentionsAreEnabled()) {
    return content;
  }

  return {
    ...content,
    cta: PRODUCT_MENTION_CONFIG.default_cta,
    caption:
      stripProductLines(content.caption) ||
      `Build sharper AI systems. ${PRODUCT_MENTION_CONFIG.default_cta}`,
    x_version:
      stripProductLines(content.x_version) ||
      "The best AI builders do not chase every tool. They learn what changed, what matters, and what to do next.",
    linkedin_version:
      stripProductLines(content.linkedin_version) ||
      "AI builders win when they can separate signal from noise and turn the shift into a practical workflow.",
    reel_script:
      stripProductLines(content.reel_script) ||
      "Most people watch AI news like spectators. Builders should watch it like operators: what changed, who benefits, and what workflow gets easier now?",
  };
}
