import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { codexErrorStatus, requireCodexContext } from "@/lib/codex-auth";

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

// GET /api/codex/posts/[id] — a single post with full copy + design context.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, ownerUserId } = requireCodexContext(request);
    const { id } = routeParamsSchema.parse(await params);

    const { data, error } = await supabase
      .from("generated_posts")
      .select("*")
      .eq("id", id)
      .eq("user_id", ownerUserId)
      .single();

    if (error || !data) {
      throw new Error("Post not found or not owned by the Codex owner.");
    }

    return jsonOk({ post: data });
  } catch (error) {
    return jsonError(error, codexErrorStatus(error));
  }
}
