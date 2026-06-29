import type { PostType, TemplateFields, TemplateType } from "@/lib/content/types";
import { RALLIO_OWNER_STEPS, RALLIO_SUPPORTER_STEPS } from "@/lib/content/rallio";

// A single rendered carousel slide. `templateType` only satisfies the renderer
// signature; the Rallio renderer routes on `fields.rallio_template_type`.
export type CarouselSlideSpec = {
  templateType: TemplateType;
  fields: TemplateFields;
};

// Instagram (and therefore Buffer) caps a carousel at 10 images.
export const MAX_CAROUSEL_SLIDES = 10;

// Fallbacks only. When source fields are present, the second and third slides
// stay grounded in the same spot, order, and neighborhood as the cover.
const PROOF_FALLBACKS: Record<DoorFamily, string[]> = {
  supporter: [
    "the best local details usually come from someone who keeps showing up.",
    "a repeat order says more than an average rating.",
    "regular habits are what make a taste map useful.",
  ],
  owner: [
    "supporters are already shaping how this place is remembered.",
    "the profile starts with what regulars notice.",
    "local attention becomes useful when the profile stays accurate.",
  ],
  city: [
    "every new city starts with one specific local recommendation.",
    "one regular's order can become the first point on a new map.",
    "the next city starts with the places locals already repeat.",
  ],
};

const QUESTION_FALLBACKS: Record<DoorFamily, string[]> = {
  supporter: [
    "What order would you tell a regular to try first?",
    "Which local detail makes this place worth repeating?",
    "What belongs on the taste map here?",
  ],
  owner: [
    "Ready to shape the profile regulars are helping build?",
    "What should every supporter know about this place?",
    "Which profile detail should the owner confirm first?",
  ],
  city: [
    "Which spot should put your city on the map?",
    "What neighborhood should Rallio map next?",
    "Which local order should start the next city?",
  ],
};

// Compact door labels for the close slide.
const CLOSE_LABELS: Record<DoorFamily, string> = {
  supporter: "add to the taste map",
  owner: "owner profiles",
  city: "request your city",
};

const CLOSE_FOOTERS: Record<DoorFamily, string> = {
  supporter: "reply below",
  owner: "link in bio",
  city: "reply with your city",
};

type DoorFamily = "supporter" | "owner" | "city";

const STEPS_CONTENT_TYPES = new Set([
  "supporter_steps_carousel",
  "owner_steps_carousel",
]);

/**
 * Build the ordered render specs for a Rallio carousel:
 *   - Slide 1: the post's own spot or quote cover.
 *   - Slide 2: one concrete proof point from the same local signal.
 *   - Slide 3: one answerable prompt or audience-specific next step.
 *
 * Returns null when the post should stay a single image (non-carousel posts or
 * non-Rallio posts).
 */
export function buildRallioCarouselSlideSpecs({
  postId,
  postType,
  templateFields,
  headline,
}: {
  postId: string;
  postType: PostType | string;
  templateFields: TemplateFields | null | undefined;
  headline?: string | null;
}): CarouselSlideSpec[] | null {
  if (postType !== "carousel") {
    return null;
  }

  const fields = templateFields ?? {};

  if (fields.signal_template_type || fields.brand_slug === "signal") {
    // Signal carousels are out of scope for the juxtaposition builder.
    return null;
  }

  const contentType = fields.content_type;

  if (contentType && STEPS_CONTENT_TYPES.has(contentType)) {
    return buildRallioStepCarouselSlideSpecs({
      postId,
      fields,
      headline,
      contentType,
    });
  }

  const family = doorFamily(fields);

  const valueFields: TemplateFields = {
    ...fields,
    brand_slug: fields.brand_slug || "rallio",
    headline: fields.headline || headline || undefined,
    carousel_role: "value",
    carousel_page: "1",
    carousel_total: "3",
  };

  const gapFields: TemplateFields = {
    brand_slug: "rallio",
    rallio_template_type: "rallio_manifesto",
    // No content_type: keeps the manifesto tile on the ink background with no
    // participation footer, so it reads as a quiet second signal, not a prompt.
    carousel_role: "gap",
    headline: buildProofLine(fields, family, postId),
    business_name: fields.business_name,
    launch_neighborhood: fields.launch_neighborhood,
    carousel_page: "2",
    carousel_total: "3",
  };

  const closeFields: TemplateFields = {
    brand_slug: "rallio",
    rallio_template_type: "rallio_manifesto",
    carousel_role: "close",
    headline: buildCloseLine(fields, family, `${postId}close`),
    door_label: CLOSE_LABELS[family],
    bottom_label: CLOSE_FOOTERS[family],
    business_name: fields.business_name,
    launch_neighborhood: fields.launch_neighborhood,
    carousel_page: "3",
    carousel_total: "3",
  };

  return [
    { templateType: "creator_economy", fields: valueFields },
    { templateType: "founder_story", fields: gapFields },
    { templateType: "founder_story", fields: closeFields },
  ];
}

function buildProofLine(
  fields: TemplateFields,
  family: DoorFamily,
  seed: string,
) {
  const business = cleanFragment(fields.business_name);
  const order = cleanFragment(fields.signature_order);
  const sensoryDetail = cleanFragment(fields.sensory_detail);
  const neighborhood = cleanFragment(fields.launch_neighborhood);

  if (family === "owner" && business) {
    return order
      ? fitLine(`regulars connect ${business} with ${order}.`)
      : fitLine(`supporters are already shaping how ${business} is remembered.`);
  }

  if (family === "city") {
    if (business && neighborhood) {
      return fitLine(`${business} is one reason ${neighborhood} belongs on the map.`);
    }
    if (order) {
      return fitLine(`${order} is the kind of local detail a city map should keep.`);
    }
  }

  if (order) {
    return fitLine(
      business ? `${business}'s repeat order: ${order}.` : `the repeat order: ${order}.`,
    );
  }

  if (sensoryDetail) {
    return fitLine(`the detail regulars notice: ${sensoryDetail}.`);
  }

  if (business && neighborhood) {
    return fitLine(`${business} is part of how regulars remember ${neighborhood}.`);
  }

  return pickStable(PROOF_FALLBACKS[family], seed);
}

function buildCloseLine(
  fields: TemplateFields,
  family: DoorFamily,
  seed: string,
) {
  const business = cleanFragment(fields.business_name);
  const neighborhood = cleanFragment(fields.launch_neighborhood);
  const category = cleanFragment(fields.spot_category);

  if (family === "city") {
    if (neighborhood) {
      return fitQuestion(`Which ${neighborhood} spot should be mapped next?`);
    }
    return pickStable(QUESTION_FALLBACKS.city, seed);
  }

  if (family === "owner") {
    if (business) {
      return fitQuestion(`Ready to shape the profile for ${business}?`);
    }
    return pickStable(QUESTION_FALLBACKS.owner, seed);
  }

  const participationPrompt = cleanFragment(fields.participation_prompt);
  if (participationPrompt) {
    return fitQuestion(participationPrompt);
  }
  if (business) {
    return fitQuestion(`What would you order first at ${business}?`);
  }
  if (category) {
    return fitQuestion(`Which ${category} belongs on the taste map?`);
  }

  return pickStable(QUESTION_FALLBACKS.supporter, seed);
}

function cleanFragment(value: unknown) {
  return typeof value === "string"
    ? value.trim().replace(/[.!?]+$/g, "")
    : "";
}

function fitLine(value: string, maxLength = 90) {
  if (value.length <= maxLength) return value;

  const shortened = value.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, Math.max(lastSpace, 40)).trim()}.`;
}

function fitQuestion(value: string, maxLength = 86) {
  const question = `${cleanFragment(value)}?`;
  if (question.length <= maxLength) return question;

  const shortened = question.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, Math.max(lastSpace, 40)).trim()}?`;
}

function buildRallioStepCarouselSlideSpecs({
  postId,
  fields,
  headline,
  contentType,
}: {
  postId: string;
  fields: TemplateFields;
  headline?: string | null;
  contentType: NonNullable<TemplateFields["content_type"]>;
}): CarouselSlideSpec[] {
  const isOwner =
    contentType === "owner_steps_carousel" || fields.step_audience === "owner";
  const steps = getStepList(fields, isOwner);
  const firstSteps = steps.slice(0, 3);
  const lastSteps =
    steps.length > 3 ? steps.slice(3, 6) : steps.slice(Math.max(0, steps.length - 3));
  const stepsKey = isOwner ? "owner_steps" : "supporter_steps";
  const baseFields: TemplateFields = {
    ...fields,
    brand_slug: "rallio",
    rallio_template_type: "rallio_steps",
    content_type: contentType,
    step_audience: isOwner ? "owner" : "supporter",
    headline:
      fields.headline ||
      headline ||
      (isOwner ? "Owners: set up the profile" : "Start with one spot"),
  };

  return [
    {
      templateType: "tutorial",
      fields: {
        ...baseFields,
        [stepsKey]: steps,
        carousel_role: "value",
        carousel_page: "1",
        carousel_total: "3",
      },
    },
    {
      templateType: "tutorial",
      fields: {
        ...baseFields,
        headline: isOwner
          ? pickStable(
              [
                "First, make the profile accurate",
                "Start with the profile regulars see",
              ],
              `${postId}owner-first`,
            )
          : pickStable(
              ["First, follow what you trust", "Start with the places you know"],
              `${postId}supporter-first`,
            ),
        [stepsKey]: firstSteps,
        door_label: "steps 01-03",
        carousel_role: "gap",
        carousel_page: "2",
        carousel_total: "3",
      },
    },
    {
      templateType: "tutorial",
      fields: {
        ...baseFields,
        headline: isOwner
          ? pickStable(
              [
                "Then let regulars shape it",
                "Then track the attention coming back",
              ],
              `${postId}owner-close`,
            )
          : pickStable(
              ["Then build Your Taste", "Then turn one rec into a map"],
              `${postId}supporter-close`,
            ),
        [stepsKey]: lastSteps,
        door_label:
          fields.door_label || (isOwner ? "owner setup" : "download rallio"),
        carousel_role: "close",
        carousel_page: "3",
        carousel_total: "3",
      },
    },
  ];
}

function getStepList(fields: TemplateFields, isOwner: boolean): string[] {
  const fieldSteps = isOwner ? fields.owner_steps : fields.supporter_steps;
  const cleanedSteps = Array.isArray(fieldSteps)
    ? fieldSteps.filter(
        (step): step is string => typeof step === "string" && step.trim().length > 0,
      )
    : [];

  if (cleanedSteps.length) {
    return cleanedSteps.slice(0, 6);
  }

  return [...(isOwner ? RALLIO_OWNER_STEPS : RALLIO_SUPPORTER_STEPS)];
}

function doorFamily(fields: TemplateFields): DoorFamily {
  const door = fields.cta_door;
  const contentType = fields.content_type || "";

  if (
    door === "claim_your_business" ||
    door === "app_download_owner" ||
    contentType.startsWith("owner_")
  ) {
    return "owner";
  }

  if (door === "city_request") {
    return "city";
  }

  return "supporter";
}

// Deterministic choice so a given post always renders the same gap line, while
// different posts spread across the bank.
function pickStable<T>(list: T[], seed: string): T {
  if (!list.length) {
    throw new Error("Cannot pick from an empty list.");
  }

  const sum = Array.from(seed).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return list[sum % list.length];
}
