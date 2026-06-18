import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { summarizeSourceUrl } from "@/lib/content/source";
import {
  enforceRallioCopySafety,
  mapRallioTemplateToCoreType,
  normalizeRallioCtaDoor,
  normalizeRallioMetadata,
  rallioSignalToTemplateFields,
  RALLIO_BRAND,
  RALLIO_SYSTEM_PROMPT,
} from "@/lib/content/rallio";
import {
  enforceSignalCopySafety,
  mapSignalTemplateToCoreType,
  normalizeSignalMetadata,
  SIGNAL_BRAND,
  SIGNAL_SYSTEM_PROMPT,
} from "@/lib/content/signal";
import { validateGeneratedContentQuality } from "@/lib/content/quality";
import {
  assertContentOsSupabaseWriteSafety,
  getOpenAIEnv,
} from "@/lib/env";
import {
  generatedContentSchema,
  ideaInputSchema,
  brandSlugs,
  rallioContentTypes,
  rallioCtaDoors,
  rallioTemplateTypes,
  signalContentTypes,
  signalCtaDoors,
  signalTemplateTypes,
  templateTypes,
} from "@/lib/content/types";
import type {
  RallioContentType,
  RallioCtaDoor,
  RallioLocalSignal,
  RallioTemplateType,
  SignalContentType,
  SignalCtaDoor,
  SignalTemplateType,
} from "@/lib/content/types";
import type { Json } from "@/types/database";

const openAITemplateFieldsSchema = z.object({
  headline: z.string(),
  subhead: z.string(),
  quote: z.string().nullable(),
  attribution: z.string().nullable(),
  bottom_label: z.string().nullable(),
  info_rows: z.array(z.string()).nullable(),
  review_notes: z.string().nullable(),
  brand_slug: z.enum(brandSlugs).nullable(),
  brand_handle: z.string().nullable(),
  launch_neighborhood: z.string().nullable(),
  category_focus: z.string().nullable(),
  cta_door: z.enum(rallioCtaDoors).nullable(),
  content_type: z.enum(rallioContentTypes).nullable(),
  visual_style: z.string().nullable(),
  rallio_template_type: z.enum(rallioTemplateTypes).nullable(),
  door_label: z.string().nullable(),
  bio_rotation_hint: z.string().nullable(),
  kpi_intent: z.string().nullable(),
  business_name: z.string().nullable(),
  spot_category: z.string().nullable(),
  spot_address: z.string().nullable(),
  spot_list_name: z.string().nullable(),
  spot_list_position: z.string().nullable(),
  spot_list_total: z.string().nullable(),
  recommender_quote: z.string().nullable(),
  recommender_name: z.string().nullable(),
  recommender_neighborhood: z.string().nullable(),
  recommender_since: z.string().nullable(),
  regular_quote: z.string().nullable(),
  regular_neighborhood: z.string().nullable(),
  regular_since_year: z.string().nullable(),
  carousel_page: z.string().nullable(),
  carousel_total: z.string().nullable(),
  receipt_lines: z.array(z.string()).nullable(),
  subtotal: z.string().nullable(),
  supporter_steps: z.array(z.string()).nullable(),
  owner_steps: z.array(z.string()).nullable(),
  step_audience: z.enum(["supporter", "owner"]).nullable(),
  local_signal_id: z.string().nullable(),
  source_status: z.string().nullable(),
  signature_order: z.string().nullable(),
  sensory_detail: z.string().nullable(),
  participation_prompt: z.string().nullable(),
  signal_template_type: z.enum(signalTemplateTypes).nullable(),
  signal_content_type: z.enum(signalContentTypes).nullable(),
  signal_cta_door: z.enum(signalCtaDoors).nullable(),
  signal_visual_style: z.string().nullable(),
  signal_kpi_intent: z.string().nullable(),
  signal_state: z.enum(["green", "yellow", "red"]).nullable(),
  signal_protocol_steps: z.array(z.string()).nullable(),
  signal_trigger: z.string().nullable(),
  signal_redirect_action: z.string().nullable(),
  signal_identity_line: z.string().nullable(),
  signal_privacy_line: z.string().nullable(),
  signal_principle: z.string().nullable(),
  signal_app_feature: z.string().nullable(),
  reel_hook: z.string().nullable(),
  reel_duration_seconds: z.number().nullable(),
  reel_beats: z.array(z.string()).nullable(),
  reel_shot_list: z.array(z.string()).nullable(),
  reel_on_screen_text: z.array(z.string()).nullable(),
  reel_voiceover: z.array(z.string()).nullable(),
  reel_audio_direction: z.string().nullable(),
  reel_cover_text: z.string().nullable(),
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

// Generation can run several OpenAI attempts per post; give the function
// room on Vercel instead of dying mid-batch on the default duration.
export const maxDuration = 300;

type GeneratedContentPackage = z.infer<typeof generatedContentSchema>;

const rallioFallbackHashtags = [
  "#toronto",
  "#torontofood",
  "#torontofoodie",
  "#torontolife",
  "#torontorestaurants",
  "#ossington",
  "#littleitaly",
  "#localbusiness",
  "#supportlocal",
  "#neighbourhood",
  "#foodguide",
  "#tastemap",
  "#regulars",
  "#rallio",
];

const rallioFallbackActionBullets = [
  "saves spots worth revisiting, not just spots worth scrolling past",
  "notices the details regulars repeat out loud",
  "asks regulars what they would recommend twice",
  "keeps the map narrow enough to stay useful",
  "turns neighborhood recommendations into a clearer map",
];

function normalizeTemplateFields(
  fields: z.infer<typeof openAITemplateFieldsSchema>,
) {
  return {
    headline: fields.headline,
    subhead: fields.subhead,
    quote: fields.quote || undefined,
    attribution: fields.attribution || undefined,
    bottom_label: fields.bottom_label || undefined,
    info_rows: fields.info_rows || undefined,
    review_notes: fields.review_notes || undefined,
    brand_slug: fields.brand_slug || undefined,
    brand_handle: fields.brand_handle || undefined,
    launch_neighborhood: fields.launch_neighborhood || undefined,
    category_focus: fields.category_focus || undefined,
    cta_door: fields.cta_door || undefined,
    content_type: fields.content_type || undefined,
    visual_style: fields.visual_style || undefined,
    rallio_template_type: fields.rallio_template_type || undefined,
    door_label: fields.door_label || undefined,
    bio_rotation_hint: fields.bio_rotation_hint || undefined,
    kpi_intent: fields.kpi_intent || undefined,
    business_name: fields.business_name || undefined,
    spot_category: fields.spot_category || undefined,
    spot_address: fields.spot_address || undefined,
    spot_list_name: fields.spot_list_name || undefined,
    spot_list_position: fields.spot_list_position || undefined,
    spot_list_total: fields.spot_list_total || undefined,
    recommender_quote: fields.recommender_quote || undefined,
    recommender_name: fields.recommender_name || undefined,
    recommender_neighborhood: fields.recommender_neighborhood || undefined,
    recommender_since: fields.recommender_since || undefined,
    regular_quote: fields.regular_quote || undefined,
    regular_neighborhood: fields.regular_neighborhood || undefined,
    regular_since_year: fields.regular_since_year || undefined,
    carousel_page: fields.carousel_page || undefined,
    carousel_total: fields.carousel_total || undefined,
    receipt_lines: fields.receipt_lines || undefined,
    subtotal: fields.subtotal || undefined,
    supporter_steps: fields.supporter_steps || undefined,
    owner_steps: fields.owner_steps || undefined,
    step_audience: fields.step_audience || undefined,
    local_signal_id: fields.local_signal_id || undefined,
    source_status: fields.source_status || undefined,
    signature_order: fields.signature_order || undefined,
    sensory_detail: fields.sensory_detail || undefined,
    participation_prompt: fields.participation_prompt || undefined,
    signal_template_type: fields.signal_template_type || undefined,
    signal_content_type: fields.signal_content_type || undefined,
    signal_cta_door: fields.signal_cta_door || undefined,
    signal_visual_style: fields.signal_visual_style || undefined,
    signal_kpi_intent: fields.signal_kpi_intent || undefined,
    signal_state: fields.signal_state || undefined,
    signal_protocol_steps: fields.signal_protocol_steps || undefined,
    signal_trigger: fields.signal_trigger || undefined,
    signal_redirect_action: fields.signal_redirect_action || undefined,
    signal_identity_line: fields.signal_identity_line || undefined,
    signal_privacy_line: fields.signal_privacy_line || undefined,
    signal_principle: fields.signal_principle || undefined,
    signal_app_feature: fields.signal_app_feature || undefined,
    reel_hook: fields.reel_hook || undefined,
    reel_duration_seconds: fields.reel_duration_seconds || undefined,
    reel_beats: fields.reel_beats || undefined,
    reel_shot_list: fields.reel_shot_list || undefined,
    reel_on_screen_text: fields.reel_on_screen_text || undefined,
    reel_voiceover: fields.reel_voiceover || undefined,
    reel_audio_direction: fields.reel_audio_direction || undefined,
    reel_cover_text: fields.reel_cover_text || undefined,
  };
}

type RallioFallbackMetadata = {
  contentType?: RallioContentType;
  ctaDoor?: RallioCtaDoor;
  templateType?: RallioTemplateType;
  visualStyle?: string;
  kpiIntent?: string;
  batchWorkingTitle?: string;
  localSignal?: RallioLocalSignal | null;
  participationPrompt?: string | null;
};

type SignalFallbackMetadata = {
  contentType?: SignalContentType;
  ctaDoor?: SignalCtaDoor;
  templateType?: SignalTemplateType;
  visualStyle?: string;
  kpiIntent?: string;
  batchWorkingTitle?: string;
};

function getRallioFallbackMetadata(
  input: z.infer<typeof ideaInputSchema>,
): RallioFallbackMetadata {
  return {
    contentType:
      input.batch_angle?.rallio_content_type || input.rallio_content_type || undefined,
    ctaDoor: input.batch_angle?.rallio_cta_door || input.rallio_cta_door || undefined,
    templateType:
      input.batch_angle?.rallio_template_type ||
      input.rallio_template_type ||
      undefined,
    visualStyle:
      input.batch_angle?.rallio_visual_style ||
      input.rallio_visual_style ||
      RALLIO_BRAND.visual_style,
    kpiIntent:
      input.batch_angle?.rallio_kpi_intent || input.rallio_kpi_intent || undefined,
    batchWorkingTitle: input.batch_angle?.working_title,
    localSignal: input.batch_angle?.rallio_signal || input.rallio_signal || null,
    participationPrompt:
      input.batch_angle?.participation_prompt || input.participation_prompt || null,
  };
}

function getSignalFallbackMetadata(
  input: z.infer<typeof ideaInputSchema>,
): SignalFallbackMetadata {
  return {
    contentType:
      input.batch_angle?.signal_content_type || input.signal_content_type || undefined,
    ctaDoor: input.batch_angle?.signal_cta_door || input.signal_cta_door || undefined,
    templateType:
      input.batch_angle?.signal_template_type ||
      input.signal_template_type ||
      undefined,
    visualStyle:
      input.batch_angle?.signal_visual_style ||
      input.signal_visual_style ||
      SIGNAL_BRAND.visual_style,
    kpiIntent:
      input.batch_angle?.signal_kpi_intent || input.signal_kpi_intent || undefined,
    batchWorkingTitle: input.batch_angle?.working_title,
  };
}

const rallioFallbackSignalHooks = [
  (signal: RallioLocalSignal) => `${signal.spot_name} keeps showing up for a reason.`,
  (signal: RallioLocalSignal) =>
    `Regulars at ${signal.spot_name} already know the order.`,
  (signal: RallioLocalSignal) =>
    `${signal.neighborhood} keeps recommending ${signal.spot_name} without being asked.`,
];

const rallioFallbackTensionLines = [
  (signal: RallioLocalSignal) => [
    `${signal.regular_name} has been a ${signal.neighborhood} regular since ${signal.regular_since_year}.`,
    `The signal: ${signal.regular_quote}`,
  ],
  (signal: RallioLocalSignal) => [
    `${signal.spot_name} sits on ${signal.street} in ${signal.neighborhood}.`,
    `${signal.regular_name} puts it simply: ${signal.regular_quote}`,
  ],
  (signal: RallioLocalSignal) => [
    `The order regulars repeat: ${signal.signature_order}.`,
    `${sentenceCase(signal.sensory_detail)}.`,
  ],
];

const rallioFallbackXBridges = [
  "The useful local signal is specific: regulars, owner context, repeat visits, and taste notes.",
  "A taste map runs on specifics: the spot, the order, and the reason a regular returns.",
  "Rankings flatten rooms. Regulars remember them.",
];

const rallioFallbackLinkedinLines = [
  [
    "The local discovery problem is not a lack of listings.",
    "It is a lack of useful signal.",
  ],
  [
    "Listings tell you a place exists.",
    "Regulars tell you why it is worth returning.",
  ],
  ["Most feeds collect places.", "A taste map collects reasons."],
];

const rallioFallbackFinalLines = [
  "This isn't a promo feed. It's a taste map people can help build.",
  "The map gets sharper every time a regular writes down the reason.",
  "Local taste survives when someone saves the why, not just the where.",
];

function hashString(value: string) {
  return Array.from(value).reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    7,
  );
}

function sanitizeFallbackCopy(value: string | null | undefined) {
  return (value || "").replace(/!+/g, ".").replace(/\.{2,}/g, ".").trim();
}

function pickFallbackHeadline({
  rallioFallback,
  candidate,
  usedHeadlines,
  useModelCopy,
}: {
  rallioFallback?: RallioFallbackMetadata;
  candidate: GeneratedContentPackage;
  usedHeadlines: Set<string>;
  useModelCopy: boolean;
}) {
  const signal = rallioFallback?.localSignal || null;
  const options = [
    rallioFallback?.batchWorkingTitle,
    useModelCopy ? sanitizeFallbackCopy(candidate.headline) : null,
    ...(signal
      ? [
          `${signal.spot_name} Belongs On The Map`,
          `What Regulars Save In ${signal.neighborhood}`,
          `The ${signal.spot_name} Signal`,
          `Why ${signal.neighborhood} Recommends Twice`,
        ]
      : []),
    "Local Discovery Needs Better Signal",
  ].filter((value): value is string => Boolean(value && value.trim()));
  const fresh = options.find(
    (value) => !usedHeadlines.has(normalizeForNovelty(value)),
  );

  if (fresh) {
    return fresh;
  }

  return signal ? `${options[0]} — ${signal.neighborhood}` : options[0];
}

function createQualityFallbackContent(args: {
  candidate: GeneratedContentPackage;
  failures: string[];
  attempt: number;
  rallioFallback?: RallioFallbackMetadata;
  usedHeadlines: Set<string>;
}) {
  try {
    return assembleFallbackContent({ ...args, useModelCopy: true });
  } catch {
    // The model copy reused in the fallback tripped the Rallio safety gate.
    // Rebuild from deterministic bank copy only, which is audited safe.
    return assembleFallbackContent({ ...args, useModelCopy: false });
  }
}

function assembleFallbackContent({
  candidate,
  failures,
  attempt,
  rallioFallback,
  usedHeadlines,
  useModelCopy,
}: {
  candidate: GeneratedContentPackage;
  failures: string[];
  attempt: number;
  rallioFallback?: RallioFallbackMetadata;
  usedHeadlines: Set<string>;
  useModelCopy: boolean;
}) {
  const signal = rallioFallback?.localSignal || null;
  const headline = pickFallbackHeadline({
    rallioFallback,
    candidate,
    usedHeadlines,
    useModelCopy,
  });
  const variant = hashString(`${signal?.id || ""}:${headline}`);
  const signalHook = signal
    ? rallioFallbackSignalHooks[variant % rallioFallbackSignalHooks.length](signal)
    : "Local discovery needs a better signal than another five-star average.";
  const hook =
    (useModelCopy ? sanitizeFallbackCopy(candidate.hook) : "") || signalHook;
  const subhead =
    (useModelCopy ? sanitizeFallbackCopy(candidate.subhead) : "") ||
    (signal
      ? `${signal.signature_order} is the kind of local signal a taste map should keep.`
      : "Local discovery should start with taste, regulars, and owner context.");
  const bullets = uniqueStrings([
    ...(signal
      ? [
          `${signal.spot_name} in ${signal.neighborhood}`,
          signal.signature_order,
          signal.sensory_detail,
          signal.participation_prompt,
        ]
      : []),
    ...rallioFallbackActionBullets,
  ]).slice(0, 4);
  const finalLine =
    signal?.participation_prompt ||
    rallioFallbackFinalLines[variant % rallioFallbackFinalLines.length];
  const hashtags = normalizeFallbackHashtags([
    ...(useModelCopy ? candidate.hashtags || [] : []),
    ...rallioFallbackHashtags,
  ]).slice(0, 16);
  const ctaDoor = normalizeRallioCtaDoor(
    rallioFallback?.contentType || candidate.template_fields.content_type,
    rallioFallback?.ctaDoor || candidate.template_fields.cta_door,
  );
  const cta =
    ctaDoor === "app_download_supporter"
      ? "Link in bio to download Rallio and start with one spot you actually recommend."
      : ctaDoor === "app_download_owner"
        ? "Owners: link in bio to download Rallio and set up your profile."
        : ctaDoor === "city_request"
          ? "Want your city on the map? Link in bio to tell us where to build next."
          : ctaDoor === "claim_your_business"
            ? "Local owners: use the link in bio when the owner profile door is open."
            : ctaDoor === "local_guide" || ctaDoor === "ossington_30_guide"
              ? "Save this and use the link in bio to request the taste map."
              : "Link in bio to download Rallio and help build the taste map.";
  const tensionLines = signal
    ? rallioFallbackTensionLines[variant % rallioFallbackTensionLines.length](signal)
    : [
        "The weak local app turns every place into the same card.",
        "The useful one captures why people actually return.",
      ];
  const caption = [
    hook,
    "",
    ...tensionLines,
    "",
    ...bullets.map((bullet) => `- ${bullet}`),
    "",
    finalLine,
    "",
    hashtags.join(" "),
  ].join("\n");
  const xVersion = `${hook} ${
    rallioFallbackXBridges[variant % rallioFallbackXBridges.length]
  } ${finalLine}`;
  const linkedinVersion = [
    hook,
    "",
    ...rallioFallbackLinkedinLines[variant % rallioFallbackLinkedinLines.length],
    "",
    ...bullets.map((bullet) => `- ${sentenceCase(bullet)}`),
    "",
    finalLine,
  ].join("\n");
  const templateFields = normalizeRallioMetadata(
    {
      ...candidate.template_fields,
      ...rallioSignalToTemplateFields(rallioFallback?.localSignal),
      headline,
      subhead,
      participation_prompt:
        rallioFallback?.participationPrompt ||
        candidate.template_fields.participation_prompt,
      receipt_lines: candidate.template_fields.receipt_lines || bullets.slice(0, 3),
      supporter_steps: candidate.template_fields.supporter_steps,
      owner_steps: candidate.template_fields.owner_steps,
      review_notes: [
        candidate.template_fields.review_notes,
        "Rallio fallback used. Review local specificity before posting.",
      ]
        .filter(Boolean)
        .join(" "),
    },
    rallioFallback,
  );

  const repaired = generatedContentSchema.parse({
    ...candidate,
    hook,
    headline,
    subhead,
    caption,
    hashtags,
    cta,
    x_version: xVersion.slice(0, 280),
    linkedin_version: linkedinVersion,
    template_fields: {
      ...templateFields,
      quality_gate: {
        passed: false,
        repaired: true,
        attempt,
        failures,
        notes: [
          "OpenAI did not pass the quality gate. Rallio fallback was used.",
          ...(useModelCopy
            ? []
            : ["Model copy tripped the safety gate; deterministic copy used."]),
        ],
      },
    },
  });

  return enforceRallioCopySafety(repaired);
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

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeFallbackHashtags(hashtags: string[]) {
  const normalized = hashtags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

  return uniqueStrings([...normalized, ...rallioFallbackHashtags]).slice(0, 20);
}

// Built once so every request sends a byte-identical system message, letting
// OpenAI prompt caching discount the prefix across attempts and batch slots.
const RALLIO_GENERATION_SYSTEM_PROMPT = [
  RALLIO_SYSTEM_PROMPT,
  "Generate one complete Rallio Instagram post package.",
  "Treat Rallio as live in the App Store, with Toronto + Rajkot as first active markets and a soft city-request invitation for everyone else.",
  "Do not copy hooks, headlines, or template fields from generated_so_far.",
  "Use one funnel CTA door only. Prefer app_download_supporter for supporter launch/action posts, app_download_owner for owner setup posts, city_request for next-city asks, local_guide for taste-map saves, and claim_your_business only when the requested content type is owner_claim_carousel.",
  "Caption shape: 1-line hook, 1-2 lines of tension, 3-5 short bullets describing concrete local behavior or launch steps, one strong reframe ending, then hashtags.",
  "Do not reuse copy across platforms. Instagram is spaced, X is compressed, LinkedIn is slightly expanded.",
  "Never use exclamation points, download-now copy, coupon/cashback/reward language, reservations, Moments, perks, full-global claims, or 'tag a friend' bait.",
  "If a repair_pass block is present in the request, fix exactly those issues while keeping everything else aligned with the contract.",
].join(" ");

const RALLIO_REEL_GENERATION_SYSTEM_PROMPT = [
  RALLIO_SYSTEM_PROMPT,
  "Generate one complete Rallio Instagram reel script package.",
  "Treat Rallio as live in the App Store, with Toronto + Rajkot as first active markets and a soft city-request invitation for everyone else.",
  "Do not copy hooks, headlines, or template fields from generated_so_far.",
  "Use one funnel CTA door only. Prefer app_download_supporter for supporter launch/action posts, app_download_owner for owner setup posts, city_request for next-city asks, and local_guide for taste-map saves.",
  "Reel shape: a 15-30 second script with a sharp first-frame hook, 4-6 beats, on-screen text, optional voiceover, a cover-text line, a caption, and one CTA. This phase creates the script only, not a video asset.",
  "Do not reuse copy across platforms. Instagram is spaced, X is compressed, LinkedIn is slightly expanded.",
  "Never use exclamation points, download-now copy, coupon/cashback/reward language, reservations, Moments, perks, full-global claims, or 'tag a friend' bait.",
  "If a repair_pass block is present in the request, fix exactly those issues while keeping everything else aligned with the contract.",
].join(" ");

const RICH_FIELD_GUIDE_SPOT =
  "For rallio_spot_carousel: set business_name to the place name; spot_category to specific cuisine; spot_address to street/intersection (e.g. '93 Ossington Ave'); spot_list_name to the collection title in uppercase (e.g. 'THE OSSINGTON 30'); spot_list_position and spot_list_total as zero-padded strings (e.g. '04', '30'); recommender_quote to one short italic line from a believable regular; recommender_name to a first-name handle (e.g. '@mayachen' or 'Maya'); recommender_neighborhood to a lowercase short area label (e.g. 'ossington'); recommender_since to a two-digit year like \"'22\"; carousel_page and carousel_total to numeric strings like '1' and '6'.";
const RICH_FIELD_GUIDE_QUOTE =
  "For rallio_regular_quote: set regular_quote to the full quote; attribution to the regular's first name; regular_neighborhood to the neighborhood they regular at (e.g. 'Little Italy'); regular_since_year to a four-digit year (e.g. '2019'); business_name to the spot they're a regular of.";
const RICH_FIELD_GUIDE_RECEIPT =
  "For rallio_receipt: set receipt_lines as 'label · value' rows; subtotal to the final number; launch_neighborhood to the neighborhood context for the receipt.";
const RICH_FIELD_GUIDE_SUPPORTER_STEPS =
  "For rallio_steps with supporter_steps_carousel: set step_audience to 'supporter'; set supporter_steps to exactly these six short steps unless the assigned angle requires shorter phrasing: Download or open Rallio; Choose Supporter and select your city; Browse or search local food and drink spots; Follow places you trust; Create a support post with a real recommendation, photo, or social link; Build Your Taste from picks, live posts, places, and areas. Set cta_door to app_download_supporter.";
const RICH_FIELD_GUIDE_OWNER_STEPS =
  "For rallio_steps with owner_steps_carousel: set step_audience to 'owner'; set owner_steps to exactly these six short steps unless the assigned angle requires shorter phrasing: Download or open Rallio; Choose Business Owner; Add or claim a free business profile; Keep profile details accurate; Review and approve supporter posts; Track posts, profile clicks, and visits from owner home. Set cta_door to app_download_owner.";
const RICH_FIELD_GUIDE_PARTICIPATION =
  "For participation_single feed posts: set headline to the concrete question, set participation_prompt to the same answerable question, use the assigned local signal as the example context, and make the caption invite comments or replies without tag-a-friend bait.";
const RICH_FIELD_GUIDE_REEL =
  "For reel packages: write reel_script as timestamped beats. Set reel_duration_seconds between 15 and 30, reel_beats to 4-6 concise beats, reel_shot_list to concrete shots or screen moments, reel_on_screen_text to short overlays, reel_voiceover to optional narration lines, reel_audio_direction to a practical audio/motion note, and reel_cover_text to the cover line.";
const RICH_FIELD_GUIDE_COMMON = [
  "When a required_local_signal is provided, copy its local_signal_id/source_status into template fields and use its spot_name, category, street, signature_order, sensory_detail, regular_quote, regular_name, regular_since_year, and participation_prompt.",
  "Return null for any rich field you cannot fill with a concrete, believable value. Never invent stock placeholder addresses, fake handles ending in numbers like @user123, or generic neighborhoods.",
];

// Only ship the field guide for the template actually being generated; the
// full set is reserved for manual posts where the template is still open.
function getRichFieldGuide(
  templateType: RallioTemplateType | null | undefined,
  contentType: RallioContentType | null | undefined,
  isReelPackage = false,
) {
  const specific =
    isReelPackage || contentType === "manifesto_reel" || contentType === "bts_story_sequence"
      ? [RICH_FIELD_GUIDE_REEL]
      : contentType === "supporter_steps_carousel"
        ? [RICH_FIELD_GUIDE_SUPPORTER_STEPS]
      : contentType === "owner_steps_carousel"
        ? [RICH_FIELD_GUIDE_OWNER_STEPS]
        : contentType === "participation_single"
          ? [RICH_FIELD_GUIDE_PARTICIPATION]
          : templateType === "rallio_spot_carousel"
            ? [RICH_FIELD_GUIDE_SPOT]
            : templateType === "rallio_regular_quote"
              ? [RICH_FIELD_GUIDE_QUOTE]
              : templateType === "rallio_receipt"
                ? [RICH_FIELD_GUIDE_RECEIPT]
                : templateType === "rallio_steps"
                  ? [RICH_FIELD_GUIDE_SUPPORTER_STEPS, RICH_FIELD_GUIDE_OWNER_STEPS]
                  : templateType === "rallio_manifesto" ||
                      templateType === "rallio_owner_claim"
                    ? []
                    : [
                        RICH_FIELD_GUIDE_SPOT,
                        RICH_FIELD_GUIDE_QUOTE,
                        RICH_FIELD_GUIDE_RECEIPT,
                        RICH_FIELD_GUIDE_SUPPORTER_STEPS,
                        RICH_FIELD_GUIDE_OWNER_STEPS,
                        RICH_FIELD_GUIDE_PARTICIPATION,
                      ];

  return [...specific, ...RICH_FIELD_GUIDE_COMMON].join(" ");
}

function compactPromptText(value: string | null | undefined, max = 120) {
  if (!value) {
    return undefined;
  }

  return value.length > max ? `${value.slice(0, max)}…` : value;
}

type NoveltyItem = {
  headline?: string | null;
  hook?: string | null;
  pillar?: string | null;
  local_signal_id?: string | null;
  business_name?: string | null;
  spot_category?: string | null;
  launch_neighborhood?: string | null;
  regular_quote?: string | null;
  participation_prompt?: string | null;
};

function validateBatchNovelty(
  content: GeneratedContentPackage,
  generatedSoFar: NoveltyItem[],
  history: NoveltyItem[] = [],
  hasPlannedSignal = false,
) {
  if (!generatedSoFar.length && !history.length) {
    return [];
  }

  // Exact-match checks span both the current batch and recent post history.
  // Similarity and category/neighborhood pairing stay batch-only so legitimately
  // recurring spots across days are not blocked.
  const dedupeScope = [...generatedSoFar, ...history];
  // When the signal is assigned by the plan, the model cannot swap the spot,
  // quote, or signal id, so those checks only apply within the current batch.
  // Plan-time selection is responsible for keeping signals fresh across days.
  const signalScope = hasPlannedSignal ? generatedSoFar : dedupeScope;
  const currentHeadline = normalizeForNovelty(content.headline);
  const currentHook = normalizeForNovelty(content.hook);
  const currentQuote = normalizeForNovelty(
    content.template_fields.regular_quote ||
      content.template_fields.recommender_quote ||
      content.template_fields.quote,
  );
  const currentSignalId = normalizeForNovelty(content.template_fields.local_signal_id);
  const currentBusiness = normalizeForNovelty(content.template_fields.business_name);
  const currentCategory = normalizeForNovelty(content.template_fields.spot_category);
  const currentNeighborhood = normalizeForNovelty(
    content.template_fields.launch_neighborhood,
  );
  const currentParticipation = normalizeForNovelty(
    content.template_fields.participation_prompt,
  );
  const failures: string[] = [];
  const collectNormalized = (
    items: NoveltyItem[],
    key: keyof NoveltyItem,
  ) => items.map((item) => normalizeForNovelty(item[key])).filter(Boolean);
  const previousHeadlines = collectNormalized(dedupeScope, "headline");
  const previousHooks = collectNormalized(dedupeScope, "hook");
  const previousQuotes = collectNormalized(signalScope, "regular_quote");
  const previousSignalIds = collectNormalized(signalScope, "local_signal_id");
  const previousBusinesses = collectNormalized(signalScope, "business_name");
  const batchHooks = collectNormalized(generatedSoFar, "hook");
  const batchParticipationPrompts = collectNormalized(
    generatedSoFar,
    "participation_prompt",
  );

  if (currentHeadline && previousHeadlines.includes(currentHeadline)) {
    failures.push("Headline duplicates a recent post.");
  }

  if (currentHook && previousHooks.includes(currentHook)) {
    failures.push("Hook duplicates a recent post.");
  }

  if (currentHook && batchHooks.some((hook) => tokenSimilarity(currentHook, hook) > 0.78)) {
    failures.push("Hook is too similar to an earlier post in this batch.");
  }

  if (currentQuote && previousQuotes.includes(currentQuote)) {
    failures.push("Regular quote duplicates a recent post.");
  }

  if (currentSignalId && previousSignalIds.includes(currentSignalId)) {
    failures.push("Local signal duplicates a recent post.");
  }

  if (currentBusiness && previousBusinesses.includes(currentBusiness)) {
    failures.push("Business name duplicates a recent post.");
  }

  if (
    currentParticipation &&
    batchParticipationPrompts.includes(currentParticipation)
  ) {
    failures.push("Participation prompt duplicates an earlier post in this batch.");
  }

  if (
    currentCategory &&
    currentNeighborhood &&
    generatedSoFar.some(
      (post) =>
        normalizeForNovelty(post.spot_category) === currentCategory &&
        normalizeForNovelty(post.launch_neighborhood) === currentNeighborhood,
    )
  ) {
    failures.push("Spot category and neighborhood repeat an earlier batch pairing.");
  }

  return failures;
}

function recentPostToNoveltyItem(post: {
  headline: string | null;
  hook: string | null;
  template_fields: unknown;
}): NoveltyItem {
  const fields =
    post.template_fields && typeof post.template_fields === "object"
      ? (post.template_fields as Record<string, unknown>)
      : {};
  const str = (value: unknown) => (typeof value === "string" ? value : null);

  return {
    headline: post.headline,
    hook: post.hook,
    local_signal_id: str(fields.local_signal_id),
    business_name: str(fields.business_name),
    spot_category: str(fields.spot_category),
    launch_neighborhood: str(fields.launch_neighborhood),
    regular_quote: str(fields.regular_quote),
    participation_prompt: str(fields.participation_prompt),
  };
}

function validateRallioSpecificity(
  content: GeneratedContentPackage,
  localSignal?: RallioLocalSignal | null,
) {
  const failures: string[] = [];
  const fields = content.template_fields;
  const businessName = fields.business_name || "";
  const copyText = [
    content.hook,
    content.headline,
    content.subhead,
    content.caption,
    content.cta,
  ].join(" ");
  if (isGenericBusinessName(businessName)) {
    failures.push(`Business name is too generic: ${businessName}.`);
  }

  if (localSignal && fields.local_signal_id && fields.local_signal_id !== localSignal.id) {
    failures.push("Template local_signal_id does not match the planned local signal.");
  }

  const concreteDetails = [
    fields.business_name,
    fields.spot_address,
    fields.signature_order,
    fields.sensory_detail,
    fields.regular_quote,
    fields.recommender_quote,
    fields.participation_prompt,
    fields.launch_neighborhood,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 3);

  if (!concreteDetails.length) {
    failures.push(
      "Rallio post is missing a concrete local detail such as spot, order, street, sensory note, regular quote, or participation prompt.",
    );
  }

  if (
    localSignal &&
    ![
      localSignal.spot_name,
      localSignal.signature_order,
      localSignal.sensory_detail,
      localSignal.regular_quote,
      localSignal.participation_prompt,
      localSignal.neighborhood,
      localSignal.street,
    ].some((detail) => includesNormalized(copyText, detail))
  ) {
    failures.push("Generated copy did not use the assigned local signal.");
  }

  return failures;
}

function validateSignalSpecificity(content: GeneratedContentPackage) {
  const failures: string[] = [];
  const fields = content.template_fields;
  const concreteDetails = [
    fields.signal_trigger,
    fields.signal_redirect_action,
    fields.signal_identity_line,
    fields.signal_privacy_line,
    fields.signal_principle,
    fields.signal_app_feature,
    ...(fields.signal_protocol_steps || []),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 3);

  if (!concreteDetails.length) {
    failures.push(
      "Signal post is missing a concrete app detail such as trigger, protocol step, redirect action, identity line, privacy line, or pattern cue.",
    );
  }

  if (!fields.signal_content_type || !fields.signal_template_type) {
    failures.push("Signal post is missing Signal content/template metadata.");
  }

  return failures;
}

function isGenericBusinessName(value: string) {
  const normalized = normalizeForNovelty(value);

  if (!normalized) {
    return false;
  }

  const genericNames = new Set([
    "taco haven",
    "tacos haven",
    "tacos delights",
    "taco delights",
    "the cozy corner cafe",
    "cozy corner cafe",
    "spice market",
    "pasta perfection",
    "cheesy goodness",
    "local favorite",
    "hidden gem",
  ]);

  return (
    genericNames.has(normalized) ||
    /\b(taco|tacos|pizza|pasta|coffee|spice|burger|sushi|ramen)\s+(haven|delight|delights|corner|cafe|spot|place|market|perfection)\b/.test(
      normalized,
    )
  );
}

function includesNormalized(text: string, detail: string) {
  const normalizedText = normalizeForNovelty(text);
  const normalizedDetail = normalizeForNovelty(detail);

  return normalizedDetail.length >= 4 && normalizedText.includes(normalizedDetail);
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = new Set(left.split(" ").filter((token) => token.length > 2));
  const rightTokens = new Set(right.split(" ").filter((token) => token.length > 2));

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;

  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function normalizeForNovelty(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = ideaInputSchema.parse(await request.json());
    const isReelPackage = input.brand_slug === "rallio" && input.post_type === "reel";
    const { supabase, user } = await requireApiUser();
    const referenceImageUrl = input.reference_image_url || undefined;

    if (!isReelPackage && input.image_mode === "uploaded" && !referenceImageUrl) {
      throw new Error("Upload a reference image before using it as the final image.");
    }

    const generationCount = input.generation_count || input.quantity || 1;
    const generationIndex = Math.min(input.generation_index || 1, generationCount);

    if (isReelPackage && (generationCount > 1 || input.batch_angle)) {
      throw new Error("Rallio reel generation is single-package only in this phase.");
    }

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
      .select("headline, hook, pillar, template_fields")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const recentHistory = (recentPosts || []).map(recentPostToNoveltyItem);
    // The novelty gate checks the full window; the model only needs a compact
    // sample, so cap and truncate what gets sent as prompt tokens.
    const recentPostsToAvoid = recentHistory.slice(0, 12).map((post) => ({
      headline: compactPromptText(post.headline),
      hook: compactPromptText(post.hook),
      business_name: compactPromptText(post.business_name),
      regular_quote: compactPromptText(post.regular_quote),
      participation_prompt: compactPromptText(post.participation_prompt),
    }));
    const generatedSoFarForPrompt = generatedSoFar.map((post) => ({
      headline: compactPromptText(post.headline),
      hook: compactPromptText(post.hook),
      business_name: compactPromptText(post.business_name),
      spot_category: compactPromptText(post.spot_category),
      launch_neighborhood: compactPromptText(post.launch_neighborhood),
      participation_prompt: compactPromptText(post.participation_prompt),
    }));
    const usedHeadlines = new Set(
      [...generatedSoFar, ...recentHistory]
        .map((post) => normalizeForNovelty(post.headline))
        .filter(Boolean),
    );
    const duplicateHeadlinesToAvoid = [
      ...new Set(
        [
          ...generatedSoFar.map((post) => post.headline),
          ...recentHistory.map((post) => post.headline),
        ].filter((value): value is string => Boolean(value)),
      ),
    ].slice(0, 24);
    const richFieldGuide = getRichFieldGuide(
      input.batch_angle?.rallio_template_type || input.rallio_template_type,
      input.batch_angle?.rallio_content_type || input.rallio_content_type,
      isReelPackage,
    );
    // Only force the planned working title onto the headline while it is still
    // novel. Re-forcing a title that already shipped made the novelty gate
    // reject every attempt for a reason the model could never fix.
    const plannedWorkingTitle = input.batch_angle?.working_title?.trim() || null;
    const forcedHeadline =
      plannedWorkingTitle &&
      !usedHeadlines.has(normalizeForNovelty(plannedWorkingTitle))
        ? plannedWorkingTitle
        : null;
    const { apiKey, model } = getOpenAIEnv();
    const openai = new OpenAI({ apiKey, timeout: 90_000, maxRetries: 1 });

    if (input.brand_slug === "signal") {
      let signalContent: GeneratedContentPackage | null = null;
      let signalQualityFailures: string[] = [];
      const signalFallback = getSignalFallbackMetadata(input);

      for (let attempt = 1; attempt <= 4; attempt += 1) {
        const isRepairPass = signalQualityFailures.length > 0;
        const response = await openai.responses.parse({
          model,
          input: [
            {
              role: "system",
              content: [
                SIGNAL_SYSTEM_PROMPT,
                "Generate one complete Signal Instagram feed-post package.",
                "Signal is a separate app from Rallio. Do not mention Rallio, taste maps, restaurants, city launches, owners, or local food discovery.",
                "Use original discipline language only. Do not quote Atomic Habits, James Clear, or any book verbatim or by name.",
                "Do not use explicit sexual language, medical claims, cure language, shame streaks, surveillance, blockers, or screenshots.",
                "Caption shape: 1-line hook, one short tension line, 3-5 short bullets, one grounded closing line, then hashtags.",
                "Return Instagram-only metadata: selected_platforms must be [\"instagram\"], brand_slug must be signal, and all Rallio-only fields must be null.",
                "Never use exclamation points, guaranteed outcomes, perfect streak claims, download-now language, coupons, rewards, or tag-a-friend bait.",
                isRepairPass
                  ? `Repair pass: previous attempt failed quality. Fix these issues: ${signalQualityFailures.join(" ")}`
                  : "",
              ]
                .filter(Boolean)
                .join(" "),
            },
            {
              role: "user",
              content: JSON.stringify(
                {
                  task: input.batch_angle
                    ? "Generate this specific planned Signal post from the batch campaign."
                    : "Generate a complete Signal Instagram feed post package.",
                  title: idea.title || input.title,
                  brief: idea.brief || input.brief,
                  source_url: idea.source_url || input.source_url || null,
                  source_summary: sourceSummary || "No source URL provided.",
                  tone: input.tone,
                  signal_context: {
                    brand: SIGNAL_BRAND,
                    roulette_seed_id: input.roulette_seed_id || null,
                    content_type: signalFallback.contentType || null,
                    signal_template_type: signalFallback.templateType || null,
                    cta_door: signalFallback.ctaDoor || null,
                    visual_style: signalFallback.visualStyle || SIGNAL_BRAND.visual_style,
                    kpi_intent: signalFallback.kpiIntent || null,
                    instruction:
                      "Return a Signal feed post about private urge awareness, interruption, redirection, pattern awareness, privacy, or app setup. Keep it dignified and practical. Store Signal metadata in template_fields.",
                  },
                  reference_image: referenceImageUrl
                    ? {
                        url: referenceImageUrl,
                        mode:
                          input.image_mode === "uploaded"
                            ? "Use this uploaded image as the final image. Still generate strong copy and editable template fields."
                            : "Use this as source/reference context only.",
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
                  batch_slot_contract: input.batch_angle
                    ? {
                        index: input.batch_angle.index,
                        required_working_title: input.batch_angle.working_title,
                        required_content_type: input.batch_angle.signal_content_type,
                        required_template_type: input.batch_angle.signal_template_type,
                        required_visual_style: input.batch_angle.signal_visual_style,
                        duplicate_headlines_to_avoid: generatedSoFar
                          .map((post) => post.headline)
                          .filter(Boolean),
                        instruction:
                          "Use the required working title as the post headline/template headline. Do not use a headline from duplicate_headlines_to_avoid.",
                      }
                    : null,
                  generated_so_far: generatedSoFar,
                  recent_posts_to_avoid: recentPostsToAvoid,
                  caption_rules: {
                    instagram:
                      "Strong first line, one tension line, 3-5 action bullets, one grounded final line, then 8-15 varied hashtags. No explicit terms and no motivational poster tone.",
                    x: "Under 280 characters, sharper than Instagram, no hashtags unless truly needed.",
                    linkedin:
                      "Slightly expanded, still private and practical, no long paragraphs and no clinical framing.",
                  },
                  visual_system: {
                    style:
                      "Signal dark-mode behavioral control system. Ink surfaces, off-white type, green/yellow/red state accents, quiet protocol cards, identity anchors, privacy cards, and no shame aesthetic.",
                    template_fields:
                      "Use headline, subhead, quote, attribution, bottom_label, info_rows, review_notes, brand_slug, brand_handle, signal_template_type, signal_content_type, signal_cta_door, signal_visual_style, signal_kpi_intent, signal_state, signal_protocol_steps, signal_trigger, signal_redirect_action, signal_identity_line, signal_privacy_line, signal_principle, signal_app_feature, door_label, bio_rotation_hint. Return every template field; use null when unavailable. Return null for all Rallio-only fields.",
                    field_specificity:
                      "signal_trigger should be a concrete cue like late-night phone, boredom, isolation, stress, or purposeless scrolling. signal_redirect_action should be a concrete action like walk without phone, cold water, leave the room, pushups, write it down, or text someone. signal_protocol_steps should be 4-6 short actions when the template is protocol or steps.",
                    thumbnail_rule:
                      "The image must work as a small Instagram grid thumbnail. Use short, direct headlines and avoid tiny dense copy.",
                  },
                  cta_rotation:
                    "Use one Signal door only: app_download for download/open Signal, sos_protocol for the 10-minute reset, check_in for slip review or reflection, pattern_map for trigger awareness, privacy_first for privacy/trust, identity_anchor for identity posts.",
                  planned_output_contract: input.batch_angle
                    ? {
                        pillar_must_equal: input.batch_angle.pillar,
                        template_type_must_equal: input.batch_angle.template_type,
                        cta_should_match:
                          input.batch_angle.signal_cta_door || input.signal_cta_door,
                      }
                    : null,
                },
                null,
                2,
              ),
            },
          ],
          text: {
            format: zodTextFormat(openAIContentSchema, "content_os_signal_package"),
          },
        });

        const parsed = response.output_parsed;

        if (!parsed) {
          throw new Error("OpenAI did not return a structured Signal package.");
        }

        const normalizedTemplateFields = normalizeTemplateFields(parsed.template_fields);
        const templateFieldsWithWorkflow = normalizeSignalMetadata(
          {
            ...normalizedTemplateFields,
            headline:
              signalFallback.batchWorkingTitle || normalizedTemplateFields.headline,
            reference_image_url: referenceImageUrl,
            reference_image_asset_id: input.reference_image_asset_id,
            selected_platforms: ["instagram" as const],
            image_mode: input.image_mode,
          },
          signalFallback,
        );
        const forcedTemplateType = mapSignalTemplateToCoreType(
          templateFieldsWithWorkflow.signal_template_type ||
            input.batch_angle?.signal_template_type ||
            input.signal_template_type,
        );
        const parsedContent = generatedContentSchema.parse({
          ...parsed,
          headline: signalFallback.batchWorkingTitle || parsed.headline,
          pillar: forcedTemplateType,
          template_type: forcedTemplateType,
          template_fields: templateFieldsWithWorkflow,
        });

        let candidate: GeneratedContentPackage;

        try {
          candidate = enforceSignalCopySafety(parsedContent);
        } catch (safetyError) {
          signalQualityFailures = [
            safetyError instanceof Error
              ? safetyError.message
              : "Signal safety gate rejected the generated copy.",
          ];
          continue;
        }

        const specificityFailures = validateSignalSpecificity(candidate);

        if (specificityFailures.length) {
          signalQualityFailures = specificityFailures;
          continue;
        }

        const noveltyFailures = validateBatchNovelty(
          candidate,
          generatedSoFar,
          recentHistory,
        );

        if (noveltyFailures.length) {
          signalQualityFailures = noveltyFailures;
          continue;
        }

        const qualityResult = validateGeneratedContentQuality({
          content: candidate,
        });

        if (qualityResult.ok) {
          signalContent = {
            ...candidate,
            template_fields: {
              ...candidate.template_fields,
              quality_gate: {
                passed: true,
                attempt,
                notes: qualityResult.notes,
              },
            },
          };
          break;
        }

        signalQualityFailures = qualityResult.failures;
      }

      if (!signalContent) {
        throw new Error(
          `Signal quality gate rejected generated output: ${signalQualityFailures.join(" ")}`,
        );
      }

      const { data: post, error: postError } = await supabase
        .from("generated_posts")
        .insert({
          user_id: user.id,
          idea_id: idea.id,
          platform: "instagram",
          post_type: input.post_type,
          tone: input.tone,
          pillar: signalContent.pillar,
          template_type: signalContent.template_type,
          hook: signalContent.hook,
          headline: signalContent.headline,
          subhead: signalContent.subhead,
          caption: signalContent.caption,
          hashtags: signalContent.hashtags,
          cta: signalContent.cta,
          carousel_slides: signalContent.carousel_slides,
          reel_script: signalContent.reel_script,
          x_version: signalContent.x_version,
          linkedin_version: signalContent.linkedin_version,
          image_prompt: signalContent.image_prompt,
          template_fields: signalContent.template_fields as Json,
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

      return jsonOk({ idea, post, content: signalContent });
    }

    let content: GeneratedContentPackage | null = null;
    let qualityFailures: string[] = [];
    let fallbackCandidate: GeneratedContentPackage | null = null;
    let fallbackAttempt = 0;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const isRepairPass = qualityFailures.length > 0;
      const response = await openai.responses.parse({
        model,
        input: [
          {
            role: "system",
            content: isReelPackage
              ? RALLIO_REEL_GENERATION_SYSTEM_PROMPT
              : RALLIO_GENERATION_SYSTEM_PROMPT,
          },
          {
            role: "user",
            // Static rule blocks lead the payload and dynamic post context
            // trails it, so prompt caching can reuse the shared prefix.
            content: JSON.stringify(
              {
                caption_rules: {
                  instagram:
                    "Strong first line, 1-2 line tension, 3-5 action bullets, strong final reframe/filter/insight, then 15-25 varied hashtags. 1-3 emojis max.",
                  x:
                    "Under 280 characters, sharper than Instagram, 0-1 hashtag.",
                  linkedin:
                    "Slightly expanded, still structured, no corporate tone, no long paragraphs.",
                },
                cta_rotation:
                  "Use one Rallio funnel door only. Prefer app_download_supporter for supporter launch posts, app_download_owner for owner setup posts, city_request for next-city asks, local_guide for taste-map saves/requests, and claim_your_business only for owner_claim_carousel. No download-now, instant-access, perks, rewards, reservations, Moments, or full-global CTA.",
                visual_system: {
                  style:
                    "Rallio local editorial system. Cream/ink/amber/wheat/moss, Fraunces-style quote cards, spot carousel cards, receipt details, black manifesto tiles, dark owner-utility phone/profile cards.",
                  thumbnail_rule: isReelPackage
                    ? "The reel cover text should work as a small Instagram grid thumbnail if a cover is created manually. Keep reel_cover_text short, direct, and visually punchy."
                    : "The image must still work as a small Instagram grid thumbnail. Keep headline short, direct, and visually punchy.",
                  rallio_copy_rule:
                    "No exclamation points. Do not use instant, perks, rewards, discounts, tag-a-friend bait, reservations, Moments, full-global claims, or generic launch/product hooks. Do not repeat Toronto + Rajkot in the same package.",
                  rallio_field_specificity:
                    "spot_category must be specific cuisine or shop type (pizza, ramen, natural wine bar, third-wave coffee, biryani, dive bar). Never return generic words like food, drink, restaurant, place, spot, or eatery. launch_neighborhood must be a real neighborhood, intersection, or street name. Never put brand catchphrases like 'taste map', 'local', or 'community' into launch_neighborhood. Return null if unknown.",
                  template_fields:
                    "Return every template field; use null when a field is not applicable to this template.",
                  rallio_rich_field_guide: richFieldGuide,
                },
                output_economy: {
                  reel_script: isReelPackage
                    ? "Write a timestamped 15-30 second reel script with 4-6 beats."
                    : "Rallio is feed-only in this phase: set reel_script to an empty string.",
                  carousel_slides: isReelPackage
                    ? "Set carousel_slides to an empty array for this script-only reel package."
                    : input.post_type === "carousel"
                      ? "Write 5-7 concise carousel slides."
                      : "Set carousel_slides to an empty array for this single-image post.",
                },
                reel_output_contract: isReelPackage
                  ? {
                      media_status:
                        "Script only. No video file, upload, render, or Buffer handoff exists in this phase.",
                      reel_script:
                        "Use timestamp labels or beat labels so the editor can hand it to a video creator.",
                      image_prompt:
                        "Return only an optional manual cover-image direction. Do not describe a generated video.",
                      carousel_slides: "Return an empty array.",
                    }
                  : null,
                task: isReelPackage
                  ? "Generate a complete Rallio Instagram reel script package."
                  : input.batch_angle
                    ? "Generate this specific planned post from the batch campaign."
                    : "Generate a complete Rallio Instagram post package.",
                title: idea.title || input.title,
                brief: input.batch_angle ? undefined : idea.brief || input.brief,
                source_url: idea.source_url || input.source_url || null,
                source_summary: sourceSummary || "No source URL provided.",
                tone: input.tone,
                rallio_context: {
                  brand: RALLIO_BRAND,
                  roulette_seed_id: input.roulette_seed_id || null,
                  // For batch posts the signal already travels in
                  // batch_slot_contract.required_local_signal; don't pay for
                  // a second copy.
                  local_signal: input.batch_angle
                    ? undefined
                    : input.rallio_signal || null,
                  participation_prompt:
                    input.batch_angle?.participation_prompt ||
                    input.participation_prompt ||
                    input.batch_angle?.rallio_signal?.participation_prompt ||
                    input.rallio_signal?.participation_prompt ||
                    null,
                  cta_door:
                    input.batch_angle?.rallio_cta_door ||
                    input.rallio_cta_door ||
                    null,
                  content_type:
                    input.batch_angle?.rallio_content_type ||
                    input.rallio_content_type ||
                    null,
                  rallio_template_type:
                    input.batch_angle?.rallio_template_type ||
                    input.rallio_template_type ||
                    null,
                  visual_style:
                    input.batch_angle?.rallio_visual_style ||
                    input.rallio_visual_style ||
                    RALLIO_BRAND.visual_style,
                  kpi_intent:
                    input.batch_angle?.rallio_kpi_intent ||
                    input.rallio_kpi_intent ||
                    null,
                  instruction:
                    isReelPackage
                      ? "Return Instagram-ready Rallio reel script content only. Set selected_platforms to instagram. Use exactly one funnel CTA door. Prefer manifesto_reel or bts_story_sequence metadata. Store reel_hook, reel_duration_seconds, reel_beats, reel_shot_list, reel_on_screen_text, reel_voiceover, reel_audio_direction, and reel_cover_text in template_fields. Set carousel_slides to an empty array. Do not imply a video was generated."
                      : "Return Instagram-ready Rallio feed-post content only. Set selected_platforms to instagram. Use exactly one funnel CTA door. Launch batches should mix local recommendation posts, supporter_steps_carousel, owner_steps_carousel, participation_single city requests, and occasional owner_claim_carousel. Do not write Reels or Stories for Rallio in this phase. Use claim_your_business only when the requested content type is owner_claim_carousel. Store Rallio metadata, launch steps, and local signal fields in template_fields.",
                },
                reference_image: referenceImageUrl
                  ? {
                      url: referenceImageUrl,
                      mode:
                        isReelPackage
                          ? "Use this as optional visual reference only. Do not treat it as a final reel asset."
                          : input.image_mode === "uploaded"
                          ? "Use this uploaded image as the final image. Still generate strong copy and editable template fields."
                          : "Use this as source/reference context only.",
                    }
                  : null,
                batch_angle: input.batch_angle
                  ? { ...input.batch_angle, rallio_signal: undefined }
                  : null,
                batch_generation:
                  !isReelPackage && generationCount > 1
                    ? {
                        current_package: generationIndex,
                        total_packages: generationCount,
                        instruction:
                          "Obey the planned batch angle. This post must be distinct from other batch items in hook, headline, takeaway, CTA, examples, caption shape, and template fields.",
                      }
                    : null,
                batch_slot_contract: !isReelPackage && input.batch_angle
                  ? {
                      index: input.batch_angle.index,
                      required_working_title: forcedHeadline,
                      planned_working_title: input.batch_angle.working_title,
                      required_content_type: input.batch_angle.rallio_content_type,
                      required_template_type: input.batch_angle.rallio_template_type,
                      required_visual_style: input.batch_angle.rallio_visual_style,
                      duplicate_headlines_to_avoid: duplicateHeadlinesToAvoid,
                      required_local_signal: input.batch_angle.rallio_signal || null,
                      required_participation_prompt:
                        input.batch_angle.participation_prompt ||
                        input.batch_angle.rallio_signal?.participation_prompt ||
                        null,
                      instruction: forcedHeadline
                        ? "Use the required working title as the post headline/template headline. Use required_local_signal as the source of truth for the spot, category, neighborhood, order/detail, regular quote, and participation prompt. Do not use a headline from duplicate_headlines_to_avoid."
                        : "The planned working title was already used recently, so write a fresh headline with the same intent that does not appear in duplicate_headlines_to_avoid. Use required_local_signal as the source of truth for the spot, category, neighborhood, order/detail, regular quote, and participation prompt.",
                    }
                  : null,
                generated_so_far: generatedSoFarForPrompt,
                recent_posts_to_avoid: recentPostsToAvoid,
                planned_output_contract: input.batch_angle
                  ? {
                      pillar_must_equal: input.batch_angle.pillar,
                      template_type_must_equal: input.batch_angle.template_type,
                      cta_should_match:
                        input.batch_angle.rallio_cta_door || input.rallio_cta_door,
                    }
                  : null,
                repair_pass: isRepairPass
                  ? {
                      attempt,
                      fix_these_issues: qualityFailures,
                    }
                  : undefined,
              },
            ),
          },
        ],
        text: {
          format: zodTextFormat(openAIContentSchema, "content_os_post_package"),
        },
      });

      if (response.usage) {
        console.log(
          `[generate-content] idea=${idea.id} attempt=${attempt} model=${model} input=${response.usage.input_tokens} cached=${response.usage.input_tokens_details?.cached_tokens ?? 0} output=${response.usage.output_tokens}`,
        );
      }

      const parsed = response.output_parsed;

      if (!parsed) {
        throw new Error("OpenAI did not return a structured content package.");
      }

      const normalizedTemplateFields = normalizeTemplateFields(parsed.template_fields);
      const rallioFallback = getRallioFallbackMetadata(input);
      const signalTemplateFields = rallioSignalToTemplateFields(
        input.batch_angle?.rallio_signal || input.rallio_signal,
      );
      const baseTemplateFieldsWithWorkflow = {
        ...normalizedTemplateFields,
        ...signalTemplateFields,
        participation_prompt:
          input.batch_angle?.participation_prompt ||
          input.participation_prompt ||
          normalizedTemplateFields.participation_prompt ||
          signalTemplateFields.participation_prompt,
        reference_image_url: referenceImageUrl,
        reference_image_asset_id: input.reference_image_asset_id,
        selected_platforms: ["instagram" as const],
        image_mode: input.image_mode,
      };
      const templateFieldsWithWorkflow = normalizeRallioMetadata(
        {
          ...baseTemplateFieldsWithWorkflow,
          headline: forcedHeadline || baseTemplateFieldsWithWorkflow.headline,
        },
        rallioFallback,
      );
      const forcedTemplateType = mapRallioTemplateToCoreType(
        templateFieldsWithWorkflow.rallio_template_type ||
          input.batch_angle?.rallio_template_type ||
          input.rallio_template_type,
      );

      const parsedContent = generatedContentSchema.parse({
        ...parsed,
        headline: forcedHeadline || parsed.headline,
        pillar: forcedTemplateType,
        template_type: forcedTemplateType,
        template_fields: templateFieldsWithWorkflow,
      });
      let candidate: GeneratedContentPackage;
      try {
        candidate = enforceRallioCopySafety(parsedContent);
      } catch (safetyError) {
        const message =
          safetyError instanceof Error
            ? safetyError.message
            : "Rallio safety gate rejected the generated copy.";
        qualityFailures = [message];
        fallbackCandidate = parsedContent;
        fallbackAttempt = attempt;
        continue;
      }
      fallbackCandidate = candidate;
      fallbackAttempt = attempt;
      const specificityFailures = validateRallioSpecificity(
        candidate,
        input.batch_angle?.rallio_signal || input.rallio_signal,
      );

      if (specificityFailures.length) {
        qualityFailures = specificityFailures;
        continue;
      }

      const noveltyFailures = validateBatchNovelty(
        candidate,
        generatedSoFar,
        recentHistory,
        Boolean(input.batch_angle?.rallio_signal || input.rallio_signal),
      );

      if (noveltyFailures.length) {
        qualityFailures = noveltyFailures;
        continue;
      }

      const qualityResult = validateGeneratedContentQuality({
        content: candidate,
      });

      if (qualityResult.ok) {
        content = {
          ...candidate,
          template_fields: {
            ...candidate.template_fields,
            quality_gate: {
              passed: true,
              attempt,
              notes: qualityResult.notes,
            },
          },
        };
        break;
      }

      qualityFailures = qualityResult.failures;
    }

    if (!content && fallbackCandidate) {
      content = createQualityFallbackContent({
        candidate: fallbackCandidate,
        failures: qualityFailures,
        attempt: fallbackAttempt,
        rallioFallback: getRallioFallbackMetadata(input),
        usedHeadlines,
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
        platform: "instagram",
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
        image_url:
          !isReelPackage && input.image_mode === "uploaded" ? referenceImageUrl : null,
        status: "draft",
        image_status:
          !isReelPackage && input.image_mode === "uploaded"
            ? "generated"
            : "not_generated",
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
