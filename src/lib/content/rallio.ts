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
  launch_neighborhood: "Toronto + Rajkot",
  launch_scope: "Toronto + Rajkot now, global later",
  category_focus: "food_drink",
  visual_style: "cream_ink_amber_moss_receipt",
} as const;

export const RALLIO_SYSTEM_PROMPT = `
You are the Rallio content brain inside Content OS.

Rallio is a taste-first local discovery app for people who want to back the right local spots before they become obvious.

CURRENT LAUNCH CONTEXT
- Launch markets: Toronto + Rajkot
- Expansion path: prove the local loop first, then broaden globally
- Category focus: food and drink first
- Audience: Toronto and Rajkot locals, neighborhood explorers, regulars, independent owners, taste-led supporters
- Product stage: pre-launch / early supporter list

VOICE
- Warm, local, specific, confident.
- Taste-first. City-aware. Owner-aware.
- Write like someone who actually walks local food streets, notices details, and respects operators.
- No hype. No "best deals near you". No "download now".

HARD BANS
- Do not promise instant app access or instant downloads.
- Do not frame Rallio as coupons, cashback, price promos, or generic rewards.
- Do not hype perks. Perks can exist later, but they are not the story.
- Do not say "save money", "exclusive rewards", "free food", or "limited-time deal".
- Do not say it is available everywhere. Write for Toronto + Rajkot now, with global later.

FUNNEL CTA DOORS
- founding_supporter: invite people to join the founding supporter list.
- local_guide: invite people to save or request the Toronto + Rajkot local guide.
- claim_your_business: invite Toronto + Rajkot food/drink owners to claim their business profile when the owner door opens.

OUTPUT STYLE
- Instagram-first.
- Keep captions scannable and grounded.
- Every post should make one concrete local behavior feel worth doing: save a spot, notice a detail, back a local operator, build a taste profile, claim a profile.
- Rallio can be named, but do not hard-sell the app.
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

export const rallioTopicSeeds: RallioTopicSeed[] = [
  {
    id: "local-taste-manifesto",
    title: "Toronto + Rajkot deserve a better local discovery loop",
    brief:
      "Create a Rallio manifesto post about why local discovery should start with taste, regulars, owner context, and local trust instead of generic ratings or promo chasing. Make it work for Toronto + Rajkot now, with global expansion later.",
    preferredTone: "founder",
    templateHint: "founder_story",
    rallioTemplateType: "rallio_manifesto",
    contentType: "manifesto_reel",
    ctaDoor: "founding_supporter",
    bestPostTypes: ["single", "reel", "carousel"],
    kpiIntent: "follower_growth_shares",
    visualDirection:
      "Cream/ink manifesto card with one large thesis, tiny Toronto + Rajkot marker, and founding supporter CTA.",
    captionStructure:
      "One-line local belief, short tension, three specific local-discovery behaviors, one founding supporter CTA.",
    doNotSay:
      "Do not say download now, coupons, cashback, reward hype, or available everywhere.",
    angleVariants: [
      {
        working_title: "Taste Before Promo",
        pillar: "founder_story",
        hook_direction:
          "Local discovery does not need another promo feed. It needs a better taste map.",
        unique_takeaway:
          "The first Rallio loop is about finding the spots people would defend, not ranking every restaurant.",
        visual_direction: "Manifesto card with one thesis line and small neighborhood badge.",
        do_not_repeat: "Do not use promo framing.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "manifesto_reel",
        ctaDoor: "founding_supporter",
      },
      {
        working_title: "The Regulars Know First",
        pillar: "creator_economy",
        hook_direction:
          "The most useful local signal is not a star rating. It is who keeps coming back.",
        unique_takeaway:
          "Rallio should turn regular behavior into a stronger discovery signal.",
        visual_direction: "Regular quote card with a warm pull quote.",
        do_not_repeat: "Do not use app-store language.",
        rallioTemplateType: "rallio_regular_quote",
        contentType: "regular_quote",
        ctaDoor: "founding_supporter",
      },
      {
        working_title: "The Strip Has Memory",
        pillar: "founder_story",
        hook_direction:
          "A good neighborhood app should remember what people actually return to.",
        unique_takeaway:
          "Discovery gets better when it captures taste patterns, not one-off likes.",
        visual_direction: "Receipt-style card with taste notes.",
        do_not_repeat: "Do not mention generic rewards.",
        rallioTemplateType: "rallio_receipt",
        contentType: "receipt_single",
        ctaDoor: "founding_supporter",
      },
    ],
  },
  {
    id: "local-guide",
    title: "The Toronto + Rajkot launch guide",
    brief:
      "Create Rallio content around a curated Toronto + Rajkot food/drink guide. Position it as a taste-led launch map, not a ranking. Focus on why people should save the guide and use it to explore more intentionally.",
    preferredTone: "educational",
    templateHint: "creator_economy",
    rallioTemplateType: "rallio_spot_carousel",
    contentType: "spot_carousel",
    ctaDoor: "local_guide",
    bestPostTypes: ["carousel", "single"],
    kpiIntent: "saves",
    visualDirection:
      "Spot carousel cover with numbered cards, cream background, amber markers, and Toronto + Rajkot guide language.",
    captionStructure:
      "Local hook, why the guide exists, 3 behaviors it helps with, save/request guide CTA.",
    doNotSay:
      "Do not imply the guide is live if not launched. Do not claim these are objectively the best spots.",
    angleVariants: [
      {
        working_title: "Toronto + Rajkot Need A Taste Map",
        pillar: "creator_economy",
        hook_direction:
          "A good local guide should help you choose a night, not just scroll a list.",
        unique_takeaway:
          "The Toronto + Rajkot guide is a launch map for choosing with more context.",
        visual_direction: "Spot carousel with three numbered taste signals.",
        do_not_repeat: "Do not call it a top 30 ranking.",
        rallioTemplateType: "rallio_spot_carousel",
        contentType: "spot_carousel",
        ctaDoor: "local_guide",
      },
      {
        working_title: "Save The Spots You Would Defend",
        pillar: "tutorial",
        hook_direction:
          "The best guide starts with the places people would recommend twice.",
        unique_takeaway:
          "Rallio should help people build a local taste profile from repeat-worthy spots.",
        visual_direction: "Receipt card with three save-worthy signals.",
        do_not_repeat: "Do not promise app access.",
        rallioTemplateType: "rallio_receipt",
        contentType: "receipt_single",
        ctaDoor: "local_guide",
      },
      {
        working_title: "Two Markets, Better Context",
        pillar: "news_digest",
        hook_direction:
          "The launch is focused on purpose: two markets, one category, better signal.",
        unique_takeaway:
          "Starting with Toronto + Rajkot food/drink keeps the product honest and useful before going global.",
        visual_direction: "Manifesto card with one strip/one category framing.",
        do_not_repeat: "Do not claim Rallio is already global.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "manifesto_reel",
        ctaDoor: "local_guide",
      },
    ],
  },
  {
    id: "owner-claim-flow",
    title: "Toronto + Rajkot owners should control their Rallio profile",
    brief:
      "Create Rallio content for Toronto + Rajkot food/drink owners. Explain why claiming a business profile matters before launch: accurate details, better story, owner-approved context. Keep it practical and respectful.",
    preferredTone: "founder",
    templateHint: "tutorial",
    rallioTemplateType: "rallio_owner_claim",
    contentType: "owner_claim_carousel",
    ctaDoor: "claim_your_business",
    bestPostTypes: ["carousel", "single"],
    kpiIntent: "business_waitlist",
    visualDirection:
      "Owner claim carousel with three calm steps and an amber owner marker.",
    captionStructure:
      "Owner-aware hook, why claim exists, 3 practical steps, claim-your-business CTA.",
    doNotSay:
      "Do not sound like sales outreach. Do not promise paid traffic or revenue.",
    angleVariants: [
      {
        working_title: "Claim The Story Before Launch",
        pillar: "founder_story",
        hook_direction:
          "If your spot is on the strip, your profile should not be guessed by an app.",
        unique_takeaway:
          "Claiming gives owners control over details before supporters see the launch guide.",
        visual_direction: "Owner claim card with three steps.",
        do_not_repeat: "Do not pitch ads.",
        rallioTemplateType: "rallio_owner_claim",
        contentType: "owner_claim_carousel",
        ctaDoor: "claim_your_business",
      },
      {
        working_title: "Better Local Context",
        pillar: "tutorial",
        hook_direction:
          "A local profile should explain what makes a spot worth remembering.",
        unique_takeaway:
          "Rallio owner claims should improve context, not create another listing chore.",
        visual_direction: "Receipt card with owner context fields.",
        do_not_repeat: "Do not mention coupons, perks, or reward hype.",
        rallioTemplateType: "rallio_receipt",
        contentType: "receipt_single",
        ctaDoor: "claim_your_business",
      },
    ],
  },
];

export function selectRallioSeed({
  postType,
  quantity,
  recentText,
}: {
  postType: PostType;
  quantity: number;
  recentText: string;
}) {
  const preferred = rallioTopicSeeds.filter((seed) =>
    seed.bestPostTypes.includes(postType),
  );
  const pool = preferred.length ? preferred : rallioTopicSeeds;
  const fresh = pool.filter(
    (seed) => !recentText.toLowerCase().includes(seed.title.toLowerCase().slice(0, 16)),
  );
  const candidates = fresh.length ? fresh : pool;
  const index = Math.abs((quantity * 17 + postType.length) % candidates.length);

  return candidates[index];
}

export function buildRallioRouletteBrief(seed: RallioTopicSeed, quantity: number) {
  const angles = seed.angleVariants
    .slice(0, Math.max(1, Math.min(quantity, seed.angleVariants.length)))
    .map((angle, index) => `${index + 1}. ${angle.working_title}: ${angle.unique_takeaway}`)
    .join("\n");

  return [
    seed.brief,
    "",
    `Launch scope: ${RALLIO_BRAND.launch_scope}`,
    `Launch markets: ${RALLIO_BRAND.launch_neighborhood}`,
    "Category focus: Toronto + Rajkot food/drink.",
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
    fields.content_type || fallback?.contentType || "manifesto_reel";
  const ctaDoor: RallioCtaDoor =
    fields.cta_door || fallback?.ctaDoor || "founding_supporter";
  const rallioTemplateType: RallioTemplateType =
    fields.rallio_template_type ||
    fallback?.templateType ||
    templateForContentType(contentType);

  return {
    ...fields,
    brand_slug: "rallio",
    brand_handle: RALLIO_BRAND.handle,
    launch_neighborhood: RALLIO_BRAND.launch_neighborhood,
    category_focus: RALLIO_BRAND.category_focus,
    content_type: contentType,
    cta_door: ctaDoor,
    rallio_template_type: rallioTemplateType,
    visual_style: fields.visual_style || fallback?.visualStyle || RALLIO_BRAND.visual_style,
    kpi_intent: fields.kpi_intent || fallback?.kpiIntent || "manual_review",
    door_label: fields.door_label || formatRallioDoorLabel(ctaDoor),
    bio_rotation_hint: fields.bio_rotation_hint || bioHintForDoor(ctaDoor),
  };
}

export function templateForContentType(
  contentType: RallioContentType | undefined,
): RallioTemplateType {
  if (contentType === "spot_carousel") {
    return "rallio_spot_carousel";
  }

  if (contentType === "receipt_single" || contentType === "bts_story_sequence") {
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
    return "Toronto + Rajkot guide";
  }

  if (ctaDoor === "claim_your_business") {
    return "Claim your business";
  }

  return "Founding supporter";
}

export function bioHintForDoor(ctaDoor: RallioCtaDoor) {
  if (ctaDoor === "local_guide" || ctaDoor === "ossington_30_guide") {
    return "Rotate bio to Door C for 48 hours after this post.";
  }

  if (ctaDoor === "claim_your_business") {
    return "Rotate bio to Door B for 48 hours after owner-facing posts.";
  }

  return "Default Door A founding supporter list.";
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
  ];
  const contextualBanned = ["deal", "deals", "discount", "discounts", "reward", "rewards"];
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
