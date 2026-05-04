import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { deleteGeneratedPosts } from "@/lib/content/delete-posts";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";

const bulkDeleteSchema = z.object({
  post_ids: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = bulkDeleteSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();
    const result = await deleteGeneratedPosts(supabase, {
      postIds: input.post_ids,
      userId: user.id,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
