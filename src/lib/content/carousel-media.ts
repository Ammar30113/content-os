export const MIN_CAROUSEL_SLIDES = 2;

export const CAROUSEL_MEDIA_NOT_READY_MESSAGE =
  "Carousel posts require at least two rendered slides before scheduling or Buffer handoff. Render carousel slides first.";

export function getRenderedCarouselSlideUrls(templateFields: unknown): string[] {
  if (
    !templateFields ||
    typeof templateFields !== "object" ||
    Array.isArray(templateFields)
  ) {
    return [];
  }

  const slides = (templateFields as Record<string, unknown>).slide_image_urls;

  if (!Array.isArray(slides)) {
    return [];
  }

  return slides
    .map((url) => (typeof url === "string" ? url.trim() : ""))
    .filter(Boolean);
}

export function getCarouselMediaIssue(
  postType: string,
  templateFields: unknown,
): string | null {
  if (postType !== "carousel") {
    return null;
  }

  const urls = getRenderedCarouselSlideUrls(templateFields);

  if (urls.length < MIN_CAROUSEL_SLIDES) {
    return CAROUSEL_MEDIA_NOT_READY_MESSAGE;
  }

  if (new Set(urls).size !== urls.length) {
    return "Carousel slides must use unique rendered image URLs before scheduling or Buffer handoff.";
  }

  return null;
}
