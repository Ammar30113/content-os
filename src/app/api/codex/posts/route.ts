import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { codexErrorStatus, requireCodexContext } from "@/lib/codex-auth";

const querySchema = z.object({
  needs_image: z.enum(["true", "false"]).optional().default("true"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// The design context Codex needs to produce an on-brand visual: the generated
// copy, the model's image_prompt, and template_fields (visual_style, spot, brand
// palette hints). ContentOS authored all of this — Codex only adds the picture.
const POST_DESIGN_FIELDS =
  "id, status, post_type, headline, hook, subhead, caption, cta, hashtags, image_prompt, image_url, image_status, rallio_pillar, primary_goal, secondary_goal, template_type, template_fields, created_at";

// GET /api/codex/posts — list posts that still need a visual (default), with
// full design context. Pass ?needs_image=false to list recent posts regardless.
export async function GET(request: Request) {
  try {
    const { supabase, ownerUserId } = requireCodexContext(request);
    const url = new URL(request.url);
    const { needs_image, limit } = querySchema.parse({
      needs_image: url.searchParams.get("needs_image") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    });

    let query = supabase
      .from("generated_posts")
      .select(POST_DESIGN_FIELDS)
      .eq("user_id", ownerUserId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (needs_image === "true") {
      query = query.eq("image_status", "not_generated");
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return jsonOk({ posts: data ?? [] });
  } catch (error) {
    return jsonError(error, codexErrorStatus(error));
  }
}
