import "server-only";

import type {
  PostType,
  RallioContentType,
  RallioCtaDoor,
  RallioTemplateType,
  TemplateType,
  Tone,
} from "@/lib/content/types";
import type { GeneratedContent, TemplateFields } from "@/lib/content/types";

export const RALLIO_BRAND = {
  brand_slug: "rallio",
  name: "Rallio",
  handle: "@rallio",
  launch_neighborhood: "local taste map",
  launch_scope: "community waitlist first; Toronto and Rajkot are seed markets, not headline defaults",
  category_focus: "food_drink",
  visual_style: "cream_ink_amber_wheat_moss_editorial",
} as const;

export const RALLIO_SYSTEM_PROMPT = `
You are the Rallio content brain inside Content OS.

Rallio is a community-built taste map for people who trust regulars, local recommendations, and repeat-worthy spots more than generic rankings.

CURRENT LAUNCH CONTEXT
- Product stage: pre-launch / waitlist growth.
- The feed should grow community demand first, then convert through link-in-bio waitlist and taste-map asks.
- Toronto and Rajkot are seed markets, but do not use "Toronto + Rajkot" as repeated headline copy.
- Category focus: food and drink first.
- Audience: neighborhood regulars, food/drink explorers, people who recommend local spots, and independent owners.

VOICE
- Warm, local, specific, confident.
- Taste-first. Regular-aware. Operator-aware only when the post is explicitly for owners.
- Write like someone who notices what regulars order, what lines are worth joining, and which spots people recommend twice.
- No hype. No exclamation points. No "best deals near you". No "download now".
- Rallio is the taste map being built, not a fully launched product to promote.

HARD BANS
- Do not promise instant app access or instant downloads.
- Do not frame Rallio as coupons, cashback, price promos, or generic rewards.
- Do not hype perks. Perks can exist later, but they are not the story.
- Do not say "save money", "exclusive rewards", "free food", or "limited-time deal".
- Do not say it is available everywhere. Toronto and Rajkot are seed-market context, not the default headline.
- Do not use "TAG A FRIEND WHO..." engagement bait.
- Do not use "claim your business" unless the post is explicitly owner-facing.
- Do not make owner-claim posts the default feed rhythm.
- Do not write generic launch/product copy such as "Rallio is launching soon" as the hook.
- Do not use "Toronto + Rajkot" in headlines unless the exact market scope is the point.

FUNNEL CTA DOORS
- founding_supporter: invite people to join the link-in-bio waitlist for the taste map.
- local_guide: invite people to save/request the neighborhood taste map or guide.
- claim_your_business: owner-only utility; invite food/drink owners to claim a community-added profile when that owner door is intentionally selected.

OUTPUT STYLE
- Instagram-first.
- Keep captions scannable and grounded.
- Default rhythm: regular quote, spot card, receipt, manifesto/BTS, then occasional owner utility.
- Every post should make one concrete local behavior feel worth doing: save a spot, notice a detail, quote a regular, request the taste map, or join the waitlist.
- Rallio can be named, but do not hard-sell the app or claim the product is already launched.
`.trim();

export type RallioTopicSeed = {
  id: string;
  title: string;
  brief: string;
  preferredTone: Tone;
  templateHint: TemplateType | "auto";
  rallioTemplateType: RallioTemplateType;
  contentType: RallioContentType;
  ctaDoor: RallioCtaDoor;
  bestPostTypes: PostType[];
  kpiIntent: string;
  visualDirection: string;
  captionStructure: string;
  doNotSay: string;
  angleVariants: Array<{
    working_title: string;
    pillar: TemplateType;
    hook_direction: string;
    unique_takeaway: string;
    visual_direction: string;
    do_not_repeat: string;
    rallioTemplateType: RallioTemplateType;
    contentType: RallioContentType;
    ctaDoor: RallioCtaDoor;
  }>;
};

const RALLIO_DEFAULT_FEED_RHYTHM: RallioContentType[] = [
  "regular_quote",
  "spot_carousel",
  "receipt_single",
  "manifesto_reel",
  "spot_carousel",
  "owner_claim_carousel",
  "bts_story_sequence",
  "regular_quote",
  "spot_carousel",
];

const RALLIO_POST_TYPE_PRIORITY: Record<PostType, RallioContentType[]> = {
  single: ["regular_quote", "spot_carousel", "receipt_single", "manifesto_reel"],
  carousel: ["spot_carousel", "regular_quote", "receipt_single", "manifesto_reel"],
  reel: ["manifesto_reel", "regular_quote", "spot_carousel", "receipt_single"],
  thread: ["regular_quote", "spot_carousel", "receipt_single", "manifesto_reel"],
};

export const rallioTopicSeeds: RallioTopicSeed[] = [
  {
    id: "regulars-quote-feed",
    title: "Regulars make the local taste map",
    brief:
      "Create Rallio content built around a believable quote from a local regular. Make the post feel like community taste, not product marketing. The goal is saves, shares, and link-in-bio waitlist interest for the taste map.",
    preferredTone: "founder",
    templateHint: "creator_economy",
    rallioTemplateType: "rallio_regular_quote",
    contentType: "regular_quote",
    ctaDoor: "founding_supporter",
    bestPostTypes: ["single", "carousel", "reel"],
    kpiIntent: "follower_growth_saves_shares",
    visualDirection:
      "Cream editorial quote card with Fraunces-style italic pull quote, amber dot, local spot label, and small Rallio mark.",
    captionStructure:
      "Regular quote as hook, short observation, 3 community taste signals, link-in-bio waitlist or taste-map CTA.",
    doNotSay:
      "Do not say download now, launching soon, claim your business, coupons, cashback, reward hype, or tag a friend.",
    angleVariants: [
      {
        working_title: "The Tuesday Regular",
        pillar: "creator_economy",
        hook_direction:
          "A regular's weekly habit says more than a five-star average.",
        unique_takeaway:
          "The Rallio feed should make repeat behavior feel like the local signal worth saving.",
        visual_direction: "Regular quote card with one specific habit and local attribution.",
        do_not_repeat: "Do not turn the quote into food critic language.",
        rallioTemplateType: "rallio_regular_quote",
        contentType: "regular_quote",
        ctaDoor: "founding_supporter",
      },
      {
        working_title: "The Recommendation You Trust",
        pillar: "creator_economy",
        hook_direction:
          "People trust the friend who knows the room, not the ranking that flattens every room.",
        unique_takeaway:
          "Community recommendations are the first layer of a better taste map.",
        visual_direction: "Cream pull-quote tile with spot and regular context.",
        do_not_repeat: "Do not mention launch markets in the headline.",
        rallioTemplateType: "rallio_regular_quote",
        contentType: "regular_quote",
        ctaDoor: "founding_supporter",
      },
      {
        working_title: "Not A Critic Line",
        pillar: "founder_story",
        hook_direction:
          "Regulars do not talk like critics. That is why their lines are useful.",
        unique_takeaway:
          "Rallio should preserve everyday taste language before it becomes generic content.",
        visual_direction: "Regular quote card with oversized italic sentence.",
        do_not_repeat: "Do not use restaurant-review cliches.",
        rallioTemplateType: "rallio_regular_quote",
        contentType: "regular_quote",
        ctaDoor: "founding_supporter",
      },
    ],
  },
  {
    id: "spot-card-carousel",
    title: "Community-added spot cards",
    brief:
      "Create Rallio spot-card content that makes one local food/drink place feel worth saving. Treat the post like a taste-map card: category, street, regular quote, and why the spot belongs in the community map.",
    preferredTone: "educational",
    templateHint: "creator_economy",
    rallioTemplateType: "rallio_spot_carousel",
    contentType: "spot_carousel",
    ctaDoor: "local_guide",
    bestPostTypes: ["carousel", "single"],
    kpiIntent: "saves",
    visualDirection:
      "Cream spot carousel cover with numbered card, amber meta line, large serif business name, quote, and regular attribution.",
    captionStructure:
      "Spot name as hook, one taste reason, 3 save-worthy signals, save/request taste-map CTA.",
    doNotSay:
      "Do not imply the full guide is live. Do not claim these are objectively the best spots. Do not use Toronto + Rajkot as the headline.",
    angleVariants: [
      {
        working_title: "One Spot Worth Saving",
        pillar: "creator_economy",
        hook_direction:
          "A good spot card should tell you why regulars keep returning.",
        unique_takeaway:
          "A taste map is built one specific recommendation at a time.",
        visual_direction: "Spot carousel cover with business name, category, street, and regular quote.",
        do_not_repeat: "Do not call it a ranking or top list.",
        rallioTemplateType: "rallio_spot_carousel",
        contentType: "spot_carousel",
        ctaDoor: "local_guide",
      },
      {
        working_title: "The Saveable Detail",
        pillar: "tutorial",
        hook_direction:
          "The useful local detail is the thing a regular tells you before you order.",
        unique_takeaway:
          "Spot cards should carry one detail people can actually use tonight.",
        visual_direction: "Spot carousel slide with one large detail and amber marker.",
        do_not_repeat: "Do not promise app access or live availability.",
        rallioTemplateType: "rallio_spot_carousel",
        contentType: "spot_carousel",
        ctaDoor: "local_guide",
      },
      {
        working_title: "Recommended Twice",
        pillar: "creator_economy",
        hook_direction:
          "The strongest local spots are the ones people recommend twice without being asked.",
        unique_takeaway:
          "Rallio's feed should turn repeat recommendations into a map people want to save.",
        visual_direction: "Cream card with three spot signals and small carousel count marker.",
        do_not_repeat: "Do not write broad market-positioning copy.",
        rallioTemplateType: "rallio_spot_carousel",
        contentType: "spot_carousel",
        ctaDoor: "local_guide",
      },
    ],
  },
  {
    id: "taste-receipt",
    title: "Receipts for local taste",
    brief:
      "Create a Rallio receipt-style post that turns local taste into a short, saveable checklist. Focus on regulars, repeat visits, specific orders, and the kind of detail that belongs in a taste map.",
    preferredTone: "tutorial",
    templateHint: "tutorial",
    rallioTemplateType: "rallio_receipt",
    contentType: "receipt_single",
    ctaDoor: "founding_supporter",
    bestPostTypes: ["single", "carousel"],
    kpiIntent: "saves_waitlist",
    visualDirection:
      "Receipt graphic with cream paper, dashed dividers, mono line items, amber subtotal, and small link-in-bio waitlist cue.",
    captionStructure:
      "Receipt metaphor hook, short local tension, 3-4 taste-map line items, link-in-bio waitlist CTA.",
    doNotSay:
      "Do not mention perks, rewards, discounts, instant access, or claim-your-business copy.",
    angleVariants: [
      {
        working_title: "Taste Receipt",
        pillar: "tutorial",
        hook_direction:
          "If a spot is worth saving, there is usually a receipt of tiny reasons.",
        unique_takeaway:
          "Rallio should make local taste easier to remember than a generic rating.",
        visual_direction: "Receipt card with four local signal line items.",
        do_not_repeat: "Do not make this a product feature list.",
        rallioTemplateType: "rallio_receipt",
        contentType: "receipt_single",
        ctaDoor: "founding_supporter",
      },
      {
        working_title: "What Regulars Notice",
        pillar: "tutorial",
        hook_direction:
          "Regulars notice details that listing pages usually miss.",
        unique_takeaway:
          "The taste map should capture details like order rituals, owner habits, and repeat-worthy timing.",
        visual_direction: "Receipt card with regular-noted line items.",
        do_not_repeat: "Do not use generic checklist language.",
        rallioTemplateType: "rallio_receipt",
        contentType: "receipt_single",
        ctaDoor: "founding_supporter",
      },
      {
        working_title: "Save Before You Forget",
        pillar: "creator_economy",
        hook_direction:
          "The best local recommendations disappear if nobody writes down the reason.",
        unique_takeaway:
          "Rallio can make taste memory visible before the app becomes a broad product.",
        visual_direction: "Receipt graphic with subtotal labelled taste map.",
        do_not_repeat: "Do not say the app is live everywhere.",
        rallioTemplateType: "rallio_receipt",
        contentType: "receipt_single",
        ctaDoor: "local_guide",
      },
    ],
  },
  {
    id: "manifesto-bts",
    title: "The taste map is being built in public",
    brief:
      "Create a black manifesto or BTS-style Rallio post about why the feed is community-first. Make it feel like a motion tile: one sharp line, local taste over product launch, and a waitlist/taste-map CTA.",
    preferredTone: "contrarian",
    templateHint: "founder_story",
    rallioTemplateType: "rallio_manifesto",
    contentType: "manifesto_reel",
    ctaDoor: "founding_supporter",
    bestPostTypes: ["single", "reel"],
    kpiIntent: "shares_waitlist",
    visualDirection:
      "Ink-black manifesto tile with cream serif headline, amber marker, and minimal community-first taste-map copy.",
    captionStructure:
      "One-line belief, short tension, 3 feed principles, link-in-bio waitlist CTA.",
    doNotSay:
      "Do not write generic launch copy. Do not overuse Toronto + Rajkot. Do not mention rewards or owner claims.",
    angleVariants: [
      {
        working_title: "Regulars Over Ratings",
        pillar: "founder_story",
        hook_direction:
          "The local feed gets better when regulars become the signal.",
        unique_takeaway:
          "Rallio is building toward a taste map, not another generic discovery feed.",
        visual_direction: "Black manifesto tile with one large thesis.",
        do_not_repeat: "Do not use app-launch language.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "manifesto_reel",
        ctaDoor: "founding_supporter",
      },
      {
        working_title: "Not A Promo Feed",
        pillar: "founder_story",
        hook_direction:
          "Local discovery does not need louder promos. It needs better memory.",
        unique_takeaway:
          "The first Rallio loop should collect what people would actually recommend.",
        visual_direction: "Ink tile with three small feed principles.",
        do_not_repeat: "Do not use coupon or deal framing.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "manifesto_reel",
        ctaDoor: "founding_supporter",
      },
      {
        working_title: "Build The Map Quietly",
        pillar: "founder_story",
        hook_direction:
          "The best local maps are built from patient recommendations, not launch noise.",
        unique_takeaway:
          "Waitlist growth should feel like helping shape the map before it opens wider.",
        visual_direction: "BTS manifesto tile with link-in-bio waitlist cue.",
        do_not_repeat: "Do not make a city-versus-city point.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "bts_story_sequence",
        ctaDoor: "founding_supporter",
      },
    ],
  },
  {
    id: "owner-claim-flow",
    title: "Owner utility for community-added profiles",
    brief:
      "Create occasional Rallio owner-utility content for food/drink operators whose spots were community-added. Explain the profile claim as a practical way to correct details and add context. Keep it respectful and secondary to the community feed.",
    preferredTone: "founder",
    templateHint: "tutorial",
    rallioTemplateType: "rallio_owner_claim",
    contentType: "owner_claim_carousel",
    ctaDoor: "claim_your_business",
    bestPostTypes: ["carousel"],
    kpiIntent: "business_waitlist",
    visualDirection:
      "Dark owner-claim phone/profile card with moss owner marker, community-added badge, small stats, and takes-about-a-minute CTA.",
    captionStructure:
      "Owner-aware hook, why the community-added profile exists, 3 practical owner steps, link-in-bio owner CTA.",
    doNotSay:
      "Do not sound like sales outreach. Do not promise paid traffic, revenue, perks, rewards, or instant setup.",
    angleVariants: [
      {
        working_title: "Claim The Story Before Launch",
        pillar: "founder_story",
        hook_direction:
          "If regulars added your spot, the profile should still be easy for the owner to correct.",
        unique_takeaway:
          "Claiming is a lightweight owner utility, not the main community-feed story.",
        visual_direction: "Dark phone/profile card with community-added badge and owner CTA.",
        do_not_repeat: "Do not pitch ads.",
        rallioTemplateType: "rallio_owner_claim",
        contentType: "owner_claim_carousel",
        ctaDoor: "claim_your_business",
      },
      {
        working_title: "Better Local Context",
        pillar: "tutorial",
        hook_direction:
          "A local profile should carry owner context without replacing regular recommendations.",
        unique_takeaway:
          "Owner claim posts should help operators add missing context while keeping the feed community-led.",
        visual_direction: "Dark owner utility card with three calm steps.",
        do_not_repeat: "Do not mention coupons, perks, or reward hype.",
        rallioTemplateType: "rallio_owner_claim",
        contentType: "owner_claim_carousel",
        ctaDoor: "claim_your_business",
      },
    ],
  },
];

export function selectRallioSeed({
  postType,
  recentText,
}: {
  postType: PostType;
  quantity: number;
  recentText: string;
}) {
  const defaultSeeds = rallioTopicSeeds.filter(
    (seed) => seed.contentType !== "owner_claim_carousel",
  );
  const preferred = defaultSeeds.filter((seed) =>
    seed.bestPostTypes.includes(postType),
  );
  const priority = RALLIO_POST_TYPE_PRIORITY[postType];
  const pool = sortSeedsByContentPriority(
    preferred.length ? preferred : defaultSeeds,
    priority,
  );
  const recent = normalizeRecentText(recentText);
  const fresh = pool.filter((seed) => !seedMatchesRecent(seed, recent));

  return (fresh.length ? fresh : pool)[0];
}

export function selectRallioAngle(seed: RallioTopicSeed, recentText: string) {
  const recent = normalizeRecentText(recentText);
  const fresh = seed.angleVariants.filter((angle) => !angleMatchesRecent(angle, recent));

  return (fresh.length ? fresh : seed.angleVariants)[0];
}

export function getRallioContentTypeForSlot(slot: number): RallioContentType {
  const index = Math.max(0, slot - 1) % RALLIO_DEFAULT_FEED_RHYTHM.length;

  return RALLIO_DEFAULT_FEED_RHYTHM[index];
}

function sortSeedsByContentPriority(
  seeds: RallioTopicSeed[],
  priority: RallioContentType[],
) {
  return [...seeds].sort((left, right) => {
    const leftIndex = priority.indexOf(left.contentType);
    const rightIndex = priority.indexOf(right.contentType);
    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    return normalizedLeft - normalizedRight;
  });
}

function normalizeRecentText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function seedMatchesRecent(seed: RallioTopicSeed, recent: string) {
  return [
    seed.id,
    seed.title,
    seed.contentType,
    seed.rallioTemplateType,
    ...seed.angleVariants.flatMap((angle) => [
      angle.working_title,
      angle.hook_direction,
      angle.contentType,
      angle.rallioTemplateType,
    ]),
  ].some((value) => recentIncludes(recent, value));
}

function angleMatchesRecent(
  angle: RallioTopicSeed["angleVariants"][number],
  recent: string,
) {
  return [
    angle.working_title,
    angle.hook_direction,
    angle.contentType,
    angle.rallioTemplateType,
  ].some((value) => recentIncludes(recent, value));
}

function recentIncludes(recent: string, value: string) {
  const normalized = normalizeRecentText(value);

  return normalized.length >= 4 && recent.includes(normalized);
}

export function buildRallioRouletteBrief(seed: RallioTopicSeed, quantity: number) {
  const angles = seed.angleVariants
    .slice(0, Math.max(1, Math.min(quantity, seed.angleVariants.length)))
    .map((angle, index) => `${index + 1}. ${angle.working_title}: ${angle.unique_takeaway}`)
    .join("\n");
  const rhythm =
    quantity > 1
      ? Array.from({ length: quantity }, (_, index) => {
          const contentType = getRallioContentTypeForSlot(index + 1);
          const templateType = templateForContentType(contentType);

          return `${index + 1}. ${contentType} / ${templateType}`;
        }).join("\n")
      : "";

  return [
    seed.brief,
    "",
    `Launch scope: ${RALLIO_BRAND.launch_scope}`,
    "Seed markets can be mentioned as context, but headlines should default to neighborhood taste, regulars, and community recommendations.",
    "Category focus: food/drink spots people would recommend twice.",
    "Default feed rhythm: quote, spot card, receipt, manifesto/BTS, then occasional owner utility.",
    quantity > 1
      ? `Use this visual rhythm for this batch unless the user overrides it:\n${rhythm}`
      : "For a single post, use the selected seed as the visual direction.",
    `CTA door: ${seed.ctaDoor}.`,
    `KPI intent: ${seed.kpiIntent}.`,
    `Visual direction: ${seed.visualDirection}`,
    `Caption structure: ${seed.captionStructure}`,
    `Do not say: ${seed.doNotSay}`,
    "",
    "Campaign angles:",
    angles,
  ].join("\n");
}

export function mapRallioTemplateToCoreType(
  rallioTemplateType: RallioTemplateType | null | undefined,
): TemplateType {
  if (rallioTemplateType === "rallio_owner_claim") {
    return "tutorial";
  }

  if (rallioTemplateType === "rallio_receipt") {
    return "tutorial";
  }

  if (rallioTemplateType === "rallio_spot_carousel") {
    return "creator_economy";
  }

  if (rallioTemplateType === "rallio_regular_quote") {
    return "creator_economy";
  }

  return "founder_story";
}

export function normalizeRallioMetadata(
  fields: TemplateFields,
  fallback?: {
    contentType?: RallioContentType;
    ctaDoor?: RallioCtaDoor;
    templateType?: RallioTemplateType;
    visualStyle?: string;
    kpiIntent?: string;
  },
): TemplateFields {
  const contentType: RallioContentType =
    fields.content_type || fallback?.contentType || "regular_quote";
  const ctaDoor = normalizeRallioCtaDoor(
    contentType,
    fields.cta_door || fallback?.ctaDoor || "founding_supporter",
  );
  const rallioTemplateType: RallioTemplateType =
    fields.rallio_template_type ||
    fallback?.templateType ||
    templateForContentType(contentType);

  return {
    ...fields,
    brand_slug: "rallio",
    brand_handle: RALLIO_BRAND.handle,
    launch_neighborhood: cleanNeighborhood(fields.launch_neighborhood),
    category_focus: fields.category_focus || RALLIO_BRAND.category_focus,
    content_type: contentType,
    cta_door: ctaDoor,
    rallio_template_type: rallioTemplateType,
    visual_style: fields.visual_style || fallback?.visualStyle || RALLIO_BRAND.visual_style,
    kpi_intent: fields.kpi_intent || fallback?.kpiIntent || "manual_review",
    door_label: fields.door_label || formatRallioDoorLabel(ctaDoor),
    bio_rotation_hint: fields.bio_rotation_hint || bioHintForDoor(ctaDoor),
  };
}

export function normalizeRallioCtaDoor(
  contentType: RallioContentType | null | undefined,
  ctaDoor: RallioCtaDoor | null | undefined,
): RallioCtaDoor {
  if (contentType === "owner_claim_carousel") {
    return "claim_your_business";
  }

  if (ctaDoor === "claim_your_business") {
    return "founding_supporter";
  }

  return ctaDoor || "founding_supporter";
}

const NEIGHBORHOOD_PLACEHOLDERS = new Set([
  "local taste map",
  "taste map",
  "local",
  "neighborhood",
  "city",
  "n/a",
]);

function cleanNeighborhood(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (NEIGHBORHOOD_PLACEHOLDERS.has(trimmed.toLowerCase())) return undefined;
  return trimmed;
}

export function templateForContentType(
  contentType: RallioContentType | undefined,
): RallioTemplateType {
  if (contentType === "spot_carousel") {
    return "rallio_spot_carousel";
  }

  if (contentType === "receipt_single") {
    return "rallio_receipt";
  }

  if (contentType === "regular_quote") {
    return "rallio_regular_quote";
  }

  if (contentType === "owner_claim_carousel") {
    return "rallio_owner_claim";
  }

  return "rallio_manifesto";
}

export function formatRallioDoorLabel(ctaDoor: RallioCtaDoor) {
  if (ctaDoor === "local_guide" || ctaDoor === "ossington_30_guide") {
    return "Taste map";
  }

  if (ctaDoor === "claim_your_business") {
    return "Owner profile";
  }

  return "Waitlist";
}

export function bioHintForDoor(ctaDoor: RallioCtaDoor) {
  if (ctaDoor === "local_guide" || ctaDoor === "ossington_30_guide") {
    return "Rotate bio to the taste-map guide door for 48 hours after this post.";
  }

  if (ctaDoor === "claim_your_business") {
    return "Rotate bio to the owner profile door only for owner-facing posts.";
  }

  return "Default link-in-bio waitlist door.";
}

export function enforceRallioCopySafety(content: GeneratedContent): GeneratedContent {
  const strictBanned = [
    "download now",
    "instant download",
    "cashback",
    "free food",
    "exclusive rewards",
    "limited-time deal",
    "limited time deal",
    "coupon",
    "coupons",
    "promo code",
    "save money",
    "instant",
    "download the app",
    "app store",
    "available now",
    "now live",
    "tag a friend who",
    "launching soon",
  ];
  const contextualBanned = [
    "deal",
    "deals",
    "discount",
    "discounts",
    "perk",
    "perks",
    "reward",
    "rewards",
  ];
  const joined = [
    content.hook,
    content.headline,
    content.subhead,
    content.caption,
    content.cta,
    content.x_version,
    content.linkedin_version,
  ]
    .join(" ")
    .toLowerCase();
  const hit =
    strictBanned.find((phrase) => joined.includes(phrase)) ||
    findUnsafeContextualTerm(joined, contextualBanned);

  if (hit) {
    throw new Error(`Rallio safety gate blocked banned phrasing: "${hit}".`);
  }

  if (joined.includes("!")) {
    throw new Error("Rallio safety gate blocked exclamation-point feed copy.");
  }

  const marketMentions = joined.match(/toronto\s*\+\s*rajkot/g)?.length || 0;
  if (marketMentions > 1) {
    throw new Error(
      'Rallio safety gate blocked repeated "Toronto + Rajkot" phrasing.',
    );
  }

  const ctaDoor = content.template_fields.cta_door;
  const contentType = content.template_fields.content_type;
  if (ctaDoor === "claim_your_business" && contentType !== "owner_claim_carousel") {
    throw new Error(
      "Rallio safety gate blocked claim_your_business on non-owner content.",
    );
  }

  if (
    ctaDoor !== "claim_your_business" &&
    /\b(claim your business|owner claim|claim the profile|claim it)\b/.test(joined)
  ) {
    throw new Error(
      "Rallio safety gate blocked owner-claim copy on a non-owner post.",
    );
  }

  return content;
}

function findUnsafeContextualTerm(text: string, terms: string[]) {
  for (const term of terms) {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "g");
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      if (!isRejectingContextUse(text, match.index)) {
        return term;
      }
    }
  }

  return null;
}

function isRejectingContextUse(text: string, index: number) {
  const prefix = text.slice(Math.max(0, index - 120), index).toLowerCase();

  return /(no|not|never|without|avoid|avoids|against|instead of|rather than|do not|don't|isn't|is not|not selling|not another|not about|beyond)\s+[\w\s-]{0,80}$/.test(
    prefix,
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
