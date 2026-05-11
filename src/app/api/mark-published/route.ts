import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { requireApiUser } from "@/lib/auth";

const markPublishedSchema = z.object({
  post_id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = markPublishedSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();

    const publishedAt = new Date().toISOString();
    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .update({
        status: "published",
        published_at: publishedAt,
      })
      .eq("id", input.post_id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (postError || !post) {
      throw new Error(postError?.message || "Could not mark post published.");
    }

    await supabase
      .from("publishing_jobs")
      .update({ status: "published", error: null })
      .eq("post_id", input.post_id)
      .eq("user_id", user.id);

    return jsonOk({ post });
  } catch (error) {
    return jsonError(error, 400);
  }
}
