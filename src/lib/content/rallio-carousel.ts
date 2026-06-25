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

// The "two legos" gap lines. Each is the SECOND signal in the juxtaposition:
// a true tension placed next to the value slide so the reader supplies the
// conclusion themselves. None of these are calls to action.
const GAP_LINES: Record<DoorFamily, string[]> = {
  supporter: [
    "none of this is written down anywhere.",
    "and it only lives in one regular's head.",
    "no map remembers this yet.",
    "it disappears the day they stop coming.",
  ],
  owner: [
    "the owner has never seen this.",
    "a regular added it. the owner hasn't.",
    "this profile is community-added, not owner-claimed.",
    "the people who run it aren't in the room yet.",
  ],
  city: [
    "your city isn't on the map yet.",
    "the map stops at two cities. for now.",
    "nobody has built this for your block.",
    "this is the part of the map still blank.",
  ],
};

// The quiet third slide. A soft implication, never a command — the reader has
// already drawn the conclusion from slides one and two.
const CLOSE_LINES: Record<DoorFamily, string[]> = {
  supporter: [
    "the map remembers spots like this.",
    "taste like this is worth keeping.",
    "this is what the map is built from.",
  ],
  owner: [
    "regulars started it. owners can shape it.",
    "the profile is already out there.",
    "this is the part owners can step into.",
  ],
  city: [
    "the map grows one neighborhood at a time.",
    "this is how the map reaches a new city.",
    "every city starts with one spot.",
  ],
};

// Soft door labels for the close slide. Not imperatives.
const CLOSE_LABELS: Record<DoorFamily, string> = {
  supporter: "the local taste map",
  owner: "owner profiles",
  city: "request your city",
};

type DoorFamily = "supporter" | "owner" | "city";

const STEPS_CONTENT_TYPES = new Set([
  "supporter_steps_carousel",
  "owner_steps_carousel",
]);

/**
 * Build the ordered render specs for a Rallio carousel using the juxtaposition
 * ("two legos") structure:
 *   - Slide 1: the post's own value tile (same as the single cover).
 *   - Slide 2: the gap/tension tile, which the reader connects on the swipe.
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
  };

  const gapFields: TemplateFields = {
    brand_slug: "rallio",
    rallio_template_type: "rallio_manifesto",
    // No content_type: keeps the manifesto tile on the ink background with no
    // participation footer, so it reads as a quiet second signal, not a prompt.
    carousel_role: "gap",
    headline: pickStable(GAP_LINES[family], postId),
    business_name: fields.business_name,
    launch_neighborhood: fields.launch_neighborhood,
  };

  const closeFields: TemplateFields = {
    brand_slug: "rallio",
    rallio_template_type: "rallio_manifesto",
    carousel_role: "close",
    headline: pickStable(CLOSE_LINES[family], `${postId}close`),
    door_label: CLOSE_LABELS[family],
  };

  return [
    { templateType: "creator_economy", fields: valueFields },
    { templateType: "founder_story", fields: gapFields },
    { templateType: "founder_story", fields: closeFields },
  ];
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
