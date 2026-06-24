import type { PostType, TemplateFields, TemplateType } from "@/lib/content/types";

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

type DoorFamily = "supporter" | "owner" | "city";

// Steps carousels are deliberately instructional and stay single-image, so the
// "download/owner-setup" CTA is never split into a juxtaposition.
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
 * Returns null when the post should stay a single image (non-carousel posts,
 * step carousels, or non-Rallio posts).
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
    return null;
  }

  const valueFields: TemplateFields = {
    ...fields,
    brand_slug: fields.brand_slug || "rallio",
    headline: fields.headline || headline || undefined,
  };

  const gapFields: TemplateFields = {
    brand_slug: "rallio",
    rallio_template_type: "rallio_manifesto",
    // No content_type: keeps the manifesto tile on the ink background with no
    // participation footer, so it reads as a quiet second signal, not a prompt.
    headline: pickStable(GAP_LINES[doorFamily(fields)], postId),
    business_name: fields.business_name,
    launch_neighborhood: fields.launch_neighborhood,
  };

  return [
    { templateType: "creator_economy", fields: valueFields },
    { templateType: "founder_story", fields: gapFields },
  ];
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
