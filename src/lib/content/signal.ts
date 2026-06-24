import "server-only";

import type {
  GeneratedContent,
  SignalContentType,
  SignalCtaDoor,
  SignalTemplateType,
  TemplateFields,
  TemplateType,
} from "@/lib/content/types";

export const SIGNAL_BRAND = {
  brand_slug: "signal",
  name: "Signal: Urge Reset",
  handle: "@signal.reset",
  category_focus: "private urge reset and behavioral interruption",
  visual_style:
    "Dark-mode behavioral control system. Ink surfaces, soft off-white type, green/yellow/red state accents, quiet protocol cards, no shame aesthetic.",
};

export const SIGNAL_SYSTEM_PROMPT = [
  "You are the Signal content writer. You write Instagram feed posts for Signal: Urge Reset, a private 10-minute tool that helps adults notice, interrupt, and redirect an unwanted behavioral loop before it takes over.",
  "Write to one person at the moment a pull is building: late at night, alone, tired, already bargaining with themselves. Speak like a calm, direct friend who has been there - never a coach, a clinician, or a hype account.",
  "The core promise is dignity. Signal is private, local-first, and on-device: no surveillance, no accountability screenshots, no blockers, no shame streaks, no medical claims, no guarantees. Never imply the reader is broken.",
  "Voice: plain, grounded, quiet, confident. Short sentences. Second person. Concrete over abstract - name the cue, the room, the action, the 10-minute window. No motivational-poster lines, no therapy-speak, no buzzwords, no hype.",
  "One idea per post. Earn the first line so it stops the scroll without clickbait or fake urgency. Leave the reader with one usable action, not a lecture.",
  "Never use explicit sexual language. Use the shared vocabulary instead: urge, loop, pull, late-night phone, bargaining, cue, trigger, pattern, reset, redirect, distance, privacy, identity.",
  "Do not quote books, authors, studies, or named experts. Use original discipline principles drawn from cue, friction, environment, identity, and compounding behavior.",
  "Instagram feed posts only. No exclamation points. No download-now urgency, coupons, rewards, or tag-a-friend bait. Close with one calm, specific call to action that fits the post.",
].join(" ");

const SIGNAL_DEFAULT_FEED_RHYTHM: SignalContentType[] = [
  "urge_reset_protocol",
  "pattern_awareness",
  "discipline_quote",
  "app_feature_steps",
  "privacy_first",
  "pattern_awareness",
  "urge_reset_protocol",
  "identity_anchor",
  "pattern_awareness",
  "discipline_quote",
  "app_feature_steps",
  "urge_reset_protocol",
  "slip_review",
  "pattern_awareness",
  "privacy_first",
  "urge_reset_protocol",
  "discipline_quote",
  "app_feature_steps",
  "identity_anchor",
  "slip_review",
];

// Rotates the feed rhythm, seeds, and titles per batch so consecutive
// campaigns don't start from the same slot/headline order.
export function getSignalRhythmOffset(seed?: string | null) {
  if (!seed) {
    return 0;
  }

  return Array.from(seed).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) % SIGNAL_DEFAULT_FEED_RHYTHM.length;
}

type SignalTopicSeed = {
  contentType: SignalContentType;
  title: string;
  hookDirection: string;
  uniqueTakeaway: string;
  captionStructure: string;
  ctaDoor: SignalCtaDoor;
  kpiIntent: string;
  visualDirection: string;
};

const signalTopicSeeds: SignalTopicSeed[] = [
  // ===== discipline_quote (4) =====
  {
    contentType: "discipline_quote",
    title: "Move First, Think Second",
    hookDirection:
      "An original discipline line about creating distance before the mind starts bargaining with the urge.",
    uniqueTakeaway:
      "The first win is opening space between the cue and the action, not winning an argument.",
    captionStructure:
      "Severe one-line hook, one tension line, 3-5 practical bullets on distance over willpower, identity reframe, app CTA.",
    ctaDoor: "app_download",
    kpiIntent: "saves_shares_app_download",
    visualDirection:
      "Dark quote card, one severe line, small Signal mark, muted accent.",
  },
  {
    contentType: "discipline_quote",
    title: "Don't Debate The Loop",
    hookDirection:
      "Frame the urge as an argument you cannot win by reasoning; you win by leaving the situation.",
    uniqueTakeaway:
      "You do not out-argue a pull. You change the room and let the timer run.",
    captionStructure:
      "Hook on the trap of negotiating, one tension line, 3 bullets on exit over debate, short reframe, app CTA.",
    ctaDoor: "app_download",
    kpiIntent: "saves_shares_app_download",
    visualDirection:
      "Dark quote card with a single line and quiet red-to-green accent.",
  },
  {
    contentType: "discipline_quote",
    title: "Friction Is A Feature",
    hookDirection:
      "Make the case that adding friction to the next step beats trying to grow more willpower.",
    uniqueTakeaway:
      "Design the moment so the easy path is the one you actually want.",
    captionStructure:
      "Hook on friction over willpower, one tension line, 3-4 concrete friction bullets, reframe, app CTA.",
    ctaDoor: "app_download",
    kpiIntent: "saves_app_feature_interest",
    visualDirection:
      "Dark quote card with a structural, almost architectural feel.",
  },
  {
    contentType: "discipline_quote",
    title: "The Cue Is Just Information",
    hookDirection:
      "Reframe the urge as data about your state, not a command you must obey.",
    uniqueTakeaway: "Noticing the cue early turns a reflex into a choice.",
    captionStructure:
      "Hook on cue-as-data, one tension line, 3 bullets on reading the signal, reframe, app CTA.",
    ctaDoor: "app_download",
    kpiIntent: "saves_shares_app_download",
    visualDirection: "Dark quote card with a small yellow state dot.",
  },
  // ===== urge_reset_protocol (4) =====
  {
    contentType: "urge_reset_protocol",
    title: "The 10-Minute Reset",
    hookDirection:
      "Explain the SOS protocol as a clear sequence for the moment an urge hits.",
    uniqueTakeaway:
      "Signal is built for the 10-minute window between cue and action.",
    captionStructure:
      "Protocol hook, why the window matters, 5-6 steps, calm Start SOS CTA.",
    ctaDoor: "sos_protocol",
    kpiIntent: "app_download_feature_understanding",
    visualDirection: "Protocol card with numbered steps and yellow state accent.",
  },
  {
    contentType: "urge_reset_protocol",
    title: "Interrupt Before The Bargain",
    hookDirection:
      "Show why starting the timer the instant you notice beats waiting until the pull is loud.",
    uniqueTakeaway:
      "The reset works best before negotiation starts, not after.",
    captionStructure:
      "Hook on timing, one tension line, 4-5 steps that begin at first notice, Start SOS CTA.",
    ctaDoor: "sos_protocol",
    kpiIntent: "app_download_feature_understanding",
    visualDirection:
      "Protocol card emphasizing the first step, yellow accent.",
  },
  {
    contentType: "urge_reset_protocol",
    title: "Outlast The Spike",
    hookDirection:
      "Explain that an urge is a wave that peaks and falls; the protocol is how you ride the ten minutes.",
    uniqueTakeaway:
      "You do not have to resist forever, only outlast a short spike.",
    captionStructure:
      "Wave hook, one line on why it passes, 5 steps for the peak, calm Start SOS CTA.",
    ctaDoor: "sos_protocol",
    kpiIntent: "app_download_feature_understanding",
    visualDirection:
      "Protocol card with a rising-then-falling line motif, yellow accent.",
  },
  {
    contentType: "urge_reset_protocol",
    title: "Change The Room, Start The Clock",
    hookDirection:
      "Pair a physical location change with starting the timer as the very first move.",
    uniqueTakeaway:
      "Moving your body and your location is what makes the next ten minutes work.",
    captionStructure:
      "Hook on environment shift, one tension line, 5 steps starting with a room change, Start SOS CTA.",
    ctaDoor: "sos_protocol",
    kpiIntent: "app_download_feature_understanding",
    visualDirection:
      "Protocol card with a location-change first step and yellow accent.",
  },
  // ===== pattern_awareness (4) =====
  {
    contentType: "pattern_awareness",
    title: "Your Pattern Has A Shape",
    hookDirection:
      "Make invisible triggers visible: boredom, isolation, late-night phone, scrolling, stress.",
    uniqueTakeaway:
      "The pattern map turns scattered moments into usable signal.",
    captionStructure:
      "Pattern hook, common trigger tension, 3-5 observed signals, pattern-map CTA.",
    ctaDoor: "pattern_map",
    kpiIntent: "saves_app_feature_interest",
    visualDirection:
      "Dark map card with trigger rows and green/yellow/red indicators.",
  },
  {
    contentType: "pattern_awareness",
    title: "Track The Danger Window",
    hookDirection:
      "Point out that most pulls cluster in a predictable hour and place.",
    uniqueTakeaway:
      "When you know your window, you can plan the redirect in advance.",
    captionStructure:
      "Hook on timing clusters, one tension line, 3-4 window examples, pattern-map CTA.",
    ctaDoor: "pattern_map",
    kpiIntent: "saves_app_feature_interest",
    visualDirection:
      "Dark map card with an hour-by-hour strip and a highlighted window.",
  },
  {
    contentType: "pattern_awareness",
    title: "The Loop Leaves Clues",
    hookDirection:
      "Show the small tells that precede a slip: last app opened, posture, mood, time.",
    uniqueTakeaway: "The setup is more trackable than the slip itself.",
    captionStructure:
      "Hook on tells, one tension line, 4 clue bullets, pattern-map CTA.",
    ctaDoor: "pattern_map",
    kpiIntent: "saves_app_feature_interest",
    visualDirection:
      "Dark map card with subtle clue rows and a green resolve state.",
  },
  {
    contentType: "pattern_awareness",
    title: "Map The Trigger, Not The Guilt",
    hookDirection:
      "Redirect attention from feeling bad to recording the conditions around the pull.",
    uniqueTakeaway:
      "What you can map, you can plan for; guilt maps nothing.",
    captionStructure:
      "Hook on mapping over guilt, one tension line, 3-4 condition bullets, pattern-map CTA.",
    ctaDoor: "pattern_map",
    kpiIntent: "saves_app_feature_interest",
    visualDirection:
      "Dark map card contrasting a guilt row with mapped condition rows.",
  },
  // ===== identity_anchor (3) =====
  {
    contentType: "identity_anchor",
    title: "Become The Person Who Notices Earlier",
    hookDirection:
      "Frame discipline as identity plus environment, not raw willpower.",
    uniqueTakeaway:
      "Signal helps people remember what they are protecting before the loop takes over.",
    captionStructure:
      "Identity hook, willpower reframe, 3-5 anchoring bullets, app CTA.",
    ctaDoor: "identity_anchor",
    kpiIntent: "shares_saves_identity",
    visualDirection:
      "Dark identity card with a single anchor line and muted green accent.",
  },
  {
    contentType: "identity_anchor",
    title: "Protect What You're Building",
    hookDirection:
      "Anchor the reset to the concrete thing the loop quietly costs the person.",
    uniqueTakeaway:
      "Naming what you protect makes the redirect feel worth it.",
    captionStructure:
      "Hook on what's at stake, one tension line, 3 anchoring bullets, app CTA.",
    ctaDoor: "identity_anchor",
    kpiIntent: "shares_saves_identity",
    visualDirection:
      "Dark identity card with one line and a small green accent.",
  },
  {
    contentType: "identity_anchor",
    title: "Identity Before Impulse",
    hookDirection:
      "Make the case that you act like who you decide to be, not how you feel in the moment.",
    uniqueTakeaway:
      "A small decided action in the window is a vote for the person you are becoming.",
    captionStructure:
      "Identity hook, feeling-vs-decision tension, 3-4 bullets, quiet reframe, app CTA.",
    ctaDoor: "identity_anchor",
    kpiIntent: "shares_saves_identity",
    visualDirection: "Dark identity card with a decisive single line.",
  },
  // ===== privacy_first (3) =====
  {
    contentType: "privacy_first",
    title: "Private Means Private",
    hookDirection:
      "Differentiate Signal from surveillance, screenshots, accounts, or shame accountability.",
    uniqueTakeaway:
      "A private tool is easier to use at the exact moment someone needs it.",
    captionStructure:
      "Privacy hook, trust tension, 3-5 no-surveillance bullets, download CTA.",
    ctaDoor: "privacy_first",
    kpiIntent: "trust_download",
    visualDirection:
      "Minimal privacy card with lock motif and no noisy decoration.",
  },
  {
    contentType: "privacy_first",
    title: "Nothing Leaves Your Phone",
    hookDirection:
      "State plainly that data stays on-device: no accounts, no cloud, no audience.",
    uniqueTakeaway:
      "On-device is not a feature line; it is what makes the worst moment usable.",
    captionStructure:
      "Plain privacy hook, one tension line, 3 on-device bullets, trust CTA.",
    ctaDoor: "privacy_first",
    kpiIntent: "trust_download",
    visualDirection:
      "Minimal privacy card, single lock glyph, deep ink background.",
  },
  {
    contentType: "privacy_first",
    title: "Help Without An Audience",
    hookDirection:
      "Contrast shame-based accountability with quiet, private support.",
    uniqueTakeaway:
      "You do not need a watcher to change; you need a tool you trust.",
    captionStructure:
      "Hook on no-audience, trust tension, 3 bullets, download CTA.",
    ctaDoor: "privacy_first",
    kpiIntent: "trust_download",
    visualDirection:
      "Minimal privacy card with one quiet line and muted accent.",
  },
  // ===== app_feature_steps (3) =====
  {
    contentType: "app_feature_steps",
    title: "What To Do When The Signal Turns Yellow",
    hookDirection:
      "Give step-by-step app actions without overpromising or sounding clinical.",
    uniqueTakeaway:
      "Signal turns a vague urge into a short sequence: name it, move, redirect, reflect.",
    captionStructure:
      "Step hook, one-line context, 5-6 steps, app CTA.",
    ctaDoor: "app_download",
    kpiIntent: "download_feature_understanding",
    visualDirection: "App steps card with green/yellow/red status language.",
  },
  {
    contentType: "app_feature_steps",
    title: "From Cue To Redirect In Six Taps",
    hookDirection:
      "Walk through the exact in-app flow from the first tap to logging what helped.",
    uniqueTakeaway:
      "The flow is short on purpose so it works when focus is low.",
    captionStructure:
      "Flow hook, one-line context, 6 numbered in-app steps, app CTA.",
    ctaDoor: "app_download",
    kpiIntent: "download_feature_understanding",
    visualDirection:
      "App steps card showing a six-step flow with state accents.",
  },
  {
    contentType: "app_feature_steps",
    title: "Set Up The Yellow Alert",
    hookDirection:
      "Show how to configure Signal before the danger window so it is ready in advance.",
    uniqueTakeaway:
      "The work is done before the urge, so the app is ready when focus is low.",
    captionStructure:
      "Setup hook, one-line context, 5-6 setup steps, app CTA.",
    ctaDoor: "app_download",
    kpiIntent: "download_feature_understanding",
    visualDirection:
      "App setup card with a configured yellow-state alert and state accents.",
  },
  // ===== slip_review (2) =====
  {
    contentType: "slip_review",
    title: "No Shame Spiral",
    hookDirection:
      "Show slip review as information gathering without binge logic or self-attack.",
    uniqueTakeaway:
      "Reviewing the sequence helps the next interruption happen earlier.",
    captionStructure:
      "Slip-review hook, shame spiral reframe, 3-5 review prompts, app CTA.",
    ctaDoor: "check_in",
    kpiIntent: "saves_trust",
    visualDirection: "Quiet review card with red-to-green recovery posture.",
  },
  {
    contentType: "slip_review",
    title: "Review The Sequence, Not Yourself",
    hookDirection:
      "Separate the event from identity: study what happened right before, calmly.",
    uniqueTakeaway:
      "One slip is data about the setup, not proof about the person.",
    captionStructure:
      "Hook on sequence over self, one tension line, 3-4 calm review prompts, check-in CTA.",
    ctaDoor: "check_in",
    kpiIntent: "saves_trust",
    visualDirection: "Quiet review card moving from red to green, no harsh language.",
  },
];

export function getSignalContentTypeForSlot(
  slot: number,
  rhythmOffset = 0,
): SignalContentType {
  const index =
    (Math.max(0, slot - 1) + rhythmOffset) % SIGNAL_DEFAULT_FEED_RHYTHM.length;

  return SIGNAL_DEFAULT_FEED_RHYTHM[index];
}

export function templateForSignalContentType(
  contentType: SignalContentType,
): SignalTemplateType {
  if (contentType === "urge_reset_protocol") {
    return "signal_protocol";
  }

  if (contentType === "pattern_awareness") {
    return "signal_pattern";
  }

  if (contentType === "privacy_first") {
    return "signal_privacy";
  }

  if (contentType === "app_feature_steps") {
    return "signal_steps";
  }

  if (contentType === "slip_review") {
    return "signal_state";
  }

  return "signal_quote";
}

export function mapSignalTemplateToCoreType(
  templateType?: SignalTemplateType | null,
): TemplateType {
  if (templateType === "signal_protocol" || templateType === "signal_steps") {
    return "tutorial";
  }

  if (templateType === "signal_pattern" || templateType === "signal_state") {
    return "tool_stack";
  }

  if (templateType === "signal_privacy") {
    return "founder_story";
  }

  return "creator_economy";
}

export function getSignalBatchSlotGuide(slot: number, offset = 0) {
  const rhythmOffset = offset % SIGNAL_DEFAULT_FEED_RHYTHM.length;
  const contentType = getSignalContentTypeForSlot(slot, rhythmOffset);
  const occurrenceIndex = countOccurrences(contentType, slot, rhythmOffset) - 1;
  const seed = getSeedForContentType(contentType, occurrenceIndex + offset);
  const templateType = templateForSignalContentType(contentType);
  const title = getSignalWorkingTitle(contentType, occurrenceIndex, seed.title, offset);

  return {
    slot,
    brandSlug: "signal" as const,
    workingTitle: title,
    contentType,
    templateType,
    coreTemplateType: mapSignalTemplateToCoreType(templateType),
    ctaDoor: normalizeSignalCtaDoor(contentType, seed.ctaDoor),
    visualStyle: seed.visualDirection,
    kpiIntent: seed.kpiIntent,
    hookDirection: seed.hookDirection,
    uniqueTakeaway: seed.uniqueTakeaway,
    captionStructure: seed.captionStructure,
    doNotRepeat:
      "Do not repeat a previous Signal hook, book-style quote structure, protocol angle, trigger example, or CTA wording in this batch.",
    slotBrief: [contentType, templateType, title, seed.hookDirection].join(" - "),
  };
}

export function getSignalTopicSeed(slot = 1, offset = 0) {
  const guide = getSignalBatchSlotGuide(slot, offset);

  return {
    brand_slug: "signal" as const,
    title: guide.workingTitle,
    brief: [
      "Create an original Signal Instagram feed post for adults who want private urge awareness, interruption, and redirection.",
      guide.hookDirection,
      guide.uniqueTakeaway,
      "Use original discipline language. Do not quote books or mention explicit adult content.",
    ].join(" "),
    tone: "contrarian" as const,
    template_hint: guide.coreTemplateType,
    selected_platforms: ["instagram" as const],
    signal_content_type: guide.contentType,
    signal_cta_door: guide.ctaDoor,
    signal_template_type: guide.templateType,
    signal_visual_style: guide.visualStyle,
    signal_kpi_intent: guide.kpiIntent,
    roulette: {
      seed_id: `signal-${slot}-${offset}-${guide.contentType}`,
      source: "signal_bank" as const,
      visual_direction: guide.visualStyle,
      contrast_setup:
        "Signal is not a blocker or shame streak. It is a private reset system for the moment before the loop takes over.",
      anti_generic_notes:
        "Avoid generic motivation, explicit content, medical promises, and direct book quotes.",
    },
  };
}

export function normalizeSignalCtaDoor(
  contentType: SignalContentType | null | undefined,
  ctaDoor: SignalCtaDoor | null | undefined,
): SignalCtaDoor {
  if (contentType === "urge_reset_protocol") {
    return "sos_protocol";
  }

  if (contentType === "pattern_awareness") {
    return "pattern_map";
  }

  if (contentType === "privacy_first") {
    return "privacy_first";
  }

  if (contentType === "identity_anchor") {
    return "identity_anchor";
  }

  if (contentType === "slip_review") {
    return "check_in";
  }

  return ctaDoor || "app_download";
}

// Rallio-only fields must never survive on a Signal post, so a leaked taste-map
// field can never pull a Signal post toward the Rallio template or copy.
const RALLIO_ONLY_FIELD_KEYS = [
  "rallio_template_type",
  "content_type",
  "cta_door",
  "launch_neighborhood",
  "category_focus",
  "business_name",
  "spot_category",
  "spot_address",
  "spot_list_name",
  "spot_list_position",
  "spot_list_total",
  "recommender_quote",
  "recommender_name",
  "recommender_neighborhood",
  "recommender_since",
  "regular_quote",
  "regular_neighborhood",
  "regular_since_year",
  "receipt_lines",
  "subtotal",
  "supporter_steps",
  "owner_steps",
  "step_audience",
  "local_signal_id",
  "source_status",
  "signature_order",
  "sensory_detail",
  "participation_prompt",
  "carousel_page",
  "carousel_total",
  "carousel_role",
] as const;

function omitTemplateFields(
  fields: TemplateFields,
  keys: readonly string[],
): TemplateFields {
  const result: TemplateFields = { ...fields };

  for (const key of keys) {
    delete (result as Record<string, unknown>)[key];
  }

  return result;
}

export function normalizeSignalMetadata(
  fields: TemplateFields,
  fallback?: {
    contentType?: SignalContentType;
    ctaDoor?: SignalCtaDoor;
    templateType?: SignalTemplateType;
    visualStyle?: string;
    kpiIntent?: string;
  },
): TemplateFields {
  const contentType =
    fallback?.contentType || fields.signal_content_type || "discipline_quote";
  const ctaDoor = normalizeSignalCtaDoor(
    contentType,
    fallback?.ctaDoor || fields.signal_cta_door || "app_download",
  );
  const templateType =
    fallback?.templateType ||
    fields.signal_template_type ||
    templateForSignalContentType(contentType);

  return {
    ...omitTemplateFields(fields, RALLIO_ONLY_FIELD_KEYS),
    brand_slug: "signal",
    brand_handle: SIGNAL_BRAND.handle,
    selected_platforms: ["instagram"],
    signal_content_type: contentType,
    signal_cta_door: ctaDoor,
    signal_template_type: templateType,
    signal_visual_style:
      fallback?.visualStyle || fields.signal_visual_style || SIGNAL_BRAND.visual_style,
    signal_kpi_intent: fallback?.kpiIntent || fields.signal_kpi_intent || "manual_review",
    signal_protocol_steps:
      fields.signal_protocol_steps || protocolStepsForContentType(contentType),
    signal_state: fields.signal_state || stateForContentType(contentType),
    door_label: fields.door_label || labelForSignalCtaDoor(ctaDoor),
    bio_rotation_hint:
      fields.bio_rotation_hint || "Route Signal posts to the Signal App Store/link-in-bio door.",
  };
}

export function enforceSignalCopySafety(content: GeneratedContent): GeneratedContent {
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
  const bannedPhrases = [
    "atomic habits",
    "james clear",
    "quote from",
    "as the book says",
    "cure",
    "treatment",
    "clinical therapy",
    "diagnose",
    "guaranteed",
    "never relapse",
    "perfect streak",
    "accountability screenshot",
    "surveillance screenshot",
    "block every site",
  ];
  const explicitTerms = [
    "porn",
    "pornography",
    "masturbation",
    "sexual content",
    "adult content",
  ];
  const hit = [...bannedPhrases, ...explicitTerms].find((phrase) =>
    joined.includes(phrase),
  );

  if (hit) {
    throw new Error(`Signal safety gate blocked phrasing: "${hit}".`);
  }

  if (joined.includes("!")) {
    throw new Error("Signal safety gate blocked exclamation-point promo copy.");
  }

  if (content.template_fields.brand_slug !== "signal") {
    throw new Error("Signal safety gate requires brand_slug = signal.");
  }

  if (content.template_fields.selected_platforms?.some((platform) => platform !== "instagram")) {
    throw new Error("Signal posts are Instagram-only in this phase.");
  }

  return content;
}

function getSeedForContentType(
  contentType: SignalContentType,
  occurrenceIndex: number,
) {
  const matches = signalTopicSeeds.filter((seed) => seed.contentType === contentType);

  return matches[occurrenceIndex % matches.length] || signalTopicSeeds[0];
}

function countOccurrences(
  contentType: SignalContentType,
  slot: number,
  rhythmOffset = 0,
) {
  let count = 0;

  for (let index = 1; index <= slot; index += 1) {
    if (getSignalContentTypeForSlot(index, rhythmOffset) === contentType) {
      count += 1;
    }
  }

  return count;
}

function getSignalWorkingTitle(
  contentType: SignalContentType,
  occurrenceIndex: number,
  fallback: string,
  variantOffset = 0,
) {
  const bank: Record<SignalContentType, string[]> = {
    discipline_quote: [
      "Move First, Think Second",
      "Distance Beats Willpower",
      "Don't Debate The Loop",
      "The Cue Is Just Information",
      "Friction Is A Feature",
      "You Can't Argue The Urge Down",
      "Leave The Room, Not The Argument",
      "Win The First Ten Seconds",
    ],
    urge_reset_protocol: [
      "The 10-Minute Reset",
      "Name It, Move, Redirect",
      "When The Signal Turns Yellow",
      "The SOS Window",
      "Interrupt Before The Bargain",
      "Ten Minutes Buys The Choice",
      "Outlast The Spike",
      "Start The Timer First",
    ],
    pattern_awareness: [
      "Your Pattern Has A Shape",
      "Late-Night Phone Is A Cue",
      "Boredom Has A Pattern",
      "Track The Danger Window",
      "The Loop Leaves Clues",
      "Same Hour, Same Room",
      "Map The Trigger, Not The Guilt",
      "Notice The Setup, Not Just The Slip",
    ],
    identity_anchor: [
      "Protect The Person You Are Becoming",
      "Notice Earlier",
      "Identity Before Impulse",
      "Choose The Next Visible Action",
      "Structure Is Self-Respect",
      "Remember What It Costs You",
      "Act On The Decision, Not The Feeling",
      "You Are Not The Urge",
    ],
    privacy_first: [
      "Private Means Private",
      "No Screenshots, No Accounts",
      "A Tool You Can Actually Open",
      "Dignity Is Part Of The System",
      "No Surveillance Needed",
      "Nothing Leaves Your Phone",
      "Help Without An Audience",
      "On-Device, On Your Side",
    ],
    slip_review: [
      "No Shame Spiral",
      "Review The Sequence",
      "Information, Not Identity",
      "The Next Reset Starts Earlier",
      "Don't Turn One Slip Into A Story",
      "Study The Tape, Skip The Verdict",
      "What Happened Right Before",
      "One Slip Is Data, Not Proof",
    ],
    app_feature_steps: [
      "What To Do First",
      "Open Signal Before The Loop",
      "From Cue To Redirect",
      "The App Flow In Six Steps",
      "Check In Before You Spiral",
      "Six Taps, One Reset",
      "Your First 10 Minutes In Signal",
      "Set Up The Yellow Alert",
    ],
  };
  const titles = bank[contentType];
  const index = (occurrenceIndex + variantOffset) % titles.length;

  return titles[index] || fallback;
}

function protocolStepsForContentType(contentType: SignalContentType) {
  if (contentType === "app_feature_steps") {
    return [
      "Open Signal",
      "Name the current state",
      "Pick the trigger",
      "Start the SOS timer",
      "Move your body",
      "Log what helped",
    ];
  }

  return [
    "Name the cue",
    "Change the room",
    "Move for two minutes",
    "Choose one redirect",
    "Let the timer finish",
    "Record the signal",
  ];
}

function stateForContentType(contentType: SignalContentType) {
  if (contentType === "slip_review") {
    return "red" as const;
  }

  if (contentType === "urge_reset_protocol" || contentType === "pattern_awareness") {
    return "yellow" as const;
  }

  return "green" as const;
}

function labelForSignalCtaDoor(ctaDoor: SignalCtaDoor) {
  const labels: Record<SignalCtaDoor, string> = {
    app_download: "Open Signal",
    sos_protocol: "Start SOS",
    check_in: "Run a check-in",
    pattern_map: "See the pattern",
    privacy_first: "Private reset",
    identity_anchor: "Anchor identity",
  };

  return labels[ctaDoor];
}
