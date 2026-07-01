import type { BrandSlug } from "@/lib/content/types";
import type { Json } from "@/types/database";

export type PostBrandFilter = BrandSlug | "unassigned";

type PostWithTemplateFields = {
  template_fields: Json;
};

export function getPostBrandSlug(templateFields: Json): BrandSlug | null {
  if (
    !templateFields ||
    typeof templateFields !== "object" ||
    Array.isArray(templateFields)
  ) {
    return null;
  }

  const brandSlug = templateFields.brand_slug;

  return brandSlug === "rallio" || brandSlug === "signal" ? brandSlug : null;
}

export function getPostBrandFilter(templateFields: Json): PostBrandFilter {
  return getPostBrandSlug(templateFields) || "unassigned";
}

export function getInitialPostBrand(
  posts: PostWithTemplateFields[],
): PostBrandFilter {
  for (const post of posts) {
    const brandSlug = getPostBrandSlug(post.template_fields);

    if (brandSlug) {
      return brandSlug;
    }
  }

  return "unassigned";
}

export function formatPostBrandName(brand: PostBrandFilter) {
  if (brand === "unassigned") {
    return "Unassigned";
  }

  return brand === "signal" ? "Signal" : "Rallio";
}
