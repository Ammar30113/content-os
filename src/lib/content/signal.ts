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
  "You are generating Instagram feed-post content for Signal: Urge Reset.",
  "Signal is a private 10-minute urge interruption system for adults who want to notice, interrupt, and redirect unwanted behavioral loops.",
  "Position Signal as private, local-first/on-device, practical, and dignified: no surveillance, no blockers, no shame streaks, no medical claims.",
  "Do not use explicit sexual content. Say urge, loop, pull, late-night phone, bargaining, reset, cue, pattern, redirect, privacy, and identity instead.",
  "Do not quote Atomic Habits, James Clear, or other books verbatim. Use original discipline principles inspired by cue, friction, identity, environment, and compounding behavior.",
  "Feed posts only for now. Instagram is the primary channel. Keep copy direct, calm, and useful.",
].join(" ");

const SIGNAL_DEFAULT_FEED_RHYTHM: SignalContentType[] = [
  "discipline_quote",
  "urge_reset_protocol",
  "pattern_awareness",
  "identity_anchor",
  "privacy_first",
  "app_feature_steps",
  "discipline_quote",
  "slip_review",
  "pattern_awareness",
  "urge_reset_protocol",
  "identity_anchor",
  "discipline_quote",
  "privacy_first",
  "app_feature_steps",
  "pattern_awareness",
  "slip_review",
  "discipline_quote",
  "urge_reset_protocol",
  "identity_anchor",
  "privacy_first",
];

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
  {
    contentType: "discipline_quote",
    title: "Move First, Think Second",
    hookDirection:
      "A short original discipline line about interrupting the loop before negotiating with it.",
    uniqueTakeaway:
      "The first win is creating distance before the mind starts bargaining.",
    captionStructure:
      "Quote hook, one-line tension, 3-5 practical bullets, identity reframe, app CTA.",
    ctaDoor: "app_download",
    kpiIntent: "saves_shares_app_download",
    visualDirection: "Dark quote card with one severe line and a small Signal mark.",
  },
  {
    contentType: "urge_reset_protocol",
    title: "The 10-Minute Reset",
    hookDirection:
      "Explain the SOS protocol as a clear sequence for the moment an urge hits.",
    uniqueTakeaway:
      "Signal is built for the 10-minute window between cue and action.",
    captionStructure:
      "Protocol hook, why the window matters, 5-6 steps, calm app CTA.",
    ctaDoor: "sos_protocol",
    kpiIntent: "app_download_feature_understanding",
    visualDirection: "Protocol card with numbered steps and yellow state accent.",
  },
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
    visualDirection: "Dark map card with trigger rows and green/yellow/red state indicators.",
  },
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
    visualDirection: "Dark identity card with a single anchor line and muted green accent.",
  },
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
    visualDirection: "Minimal privacy card with lock motif and no noisy decoration.",
  },
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
];

export function getSignalContentTypeForSlot(slot: number): SignalContentType {
  const index = Math.max(0, slot - 1) % SIGNAL_DEFAULT_FEED_RHYTHM.length;

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

export function getSignalBatchSlotGuide(slot: number) {
  const contentType = getSignalContentTypeForSlot(slot);
  const occurrenceIndex = countOccurrences(contentType, slot) - 1;
  const seed = getSeedForContentType(contentType, occurrenceIndex);
  const templateType = templateForSignalContentType(contentType);
  const title = getSignalWorkingTitle(contentType, occurrenceIndex, seed.title);

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

export function getSignalTopicSeed(slot = 1) {
  const guide = getSignalBatchSlotGuide(slot);

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
      seed_id: `signal-${slot}-${guide.contentType}`,
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
    ...fields,
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

function countOccurrences(contentType: SignalContentType, slot: number) {
  let count = 0;

  for (let index = 1; index <= slot; index += 1) {
    if (getSignalContentTypeForSlot(index) === contentType) {
      count += 1;
    }
  }

  return count;
}

function getSignalWorkingTitle(
  contentType: SignalContentType,
  occurrenceIndex: number,
  fallback: string,
) {
  const bank: Record<SignalContentType, string[]> = {
    discipline_quote: [
      "Move First, Think Second",
      "Distance Beats Willpower",
      "Do Not Debate The Loop",
      "The Cue Is Information",
      "Friction Is A Feature",
    ],
    urge_reset_protocol: [
      "The 10-Minute Reset",
      "Name It, Move, Redirect",
      "When The Signal Turns Yellow",
      "The SOS Window",
      "Interrupt Before The Bargain",
    ],
    pattern_awareness: [
      "Your Pattern Has A Shape",
      "Late-Night Phone Is A Cue",
      "Boredom Has A Pattern",
      "Track The Danger Window",
      "The Loop Leaves Clues",
    ],
    identity_anchor: [
      "Protect The Person You Are Becoming",
      "Notice Earlier",
      "Identity Before Impulse",
      "Choose The Next Visible Action",
      "Structure Is Self-Respect",
    ],
    privacy_first: [
      "Private Means Private",
      "No Screenshots, No Accounts",
      "A Tool You Can Actually Open",
      "Dignity Is Part Of The System",
      "No Surveillance Needed",
    ],
    slip_review: [
      "No Shame Spiral",
      "Review The Sequence",
      "Information, Not Identity",
      "The Next Reset Starts Earlier",
      "Do Not Turn One Slip Into A Story",
    ],
    app_feature_steps: [
      "What To Do First",
      "Open Signal Before The Loop",
      "From Cue To Redirect",
      "The App Flow In Six Steps",
      "Check In Before You Spiral",
    ],
  };

  return bank[contentType][occurrenceIndex] || fallback;
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
