import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";

const bulkApproveSchema = z.object({
  post_ids: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = bulkApproveSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();

    const { data: posts, error } = await supabase
      .from("generated_posts")
      .update({ status: "approved", publish_error: null })
      .eq("user_id", user.id)
      .in("id", input.post_ids)
      .select("id, status");

    if (error) {
      throw new Error(error.message);
    }

    return jsonOk({
      approved: posts || [],
      approved_count: posts?.length || 0,
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
