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

    const { data: existingPost, error: existingPostError } = await supabase
      .from("generated_posts")
      .select("id, post_type, video_url")
      .eq("id", input.post_id)
      .eq("user_id", user.id)
      .single();

    if (existingPostError || !existingPost) {
      throw new Error(existingPostError?.message || "Post not found.");
    }

    if (existingPost.post_type === "reel" && !existingPost.video_url) {
      throw new Error("Attach the finished Reel video before marking it published.");
    }

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

    // Do not clobber a job that is mid-send (`processing`): the Buffer handoff
    // is in flight and its own compare-and-swap will resolve the final state.
    // Overwriting it here would mask an in-flight send (and any resulting error).
    await supabase
      .from("publishing_jobs")
      .update({ status: "published", error: null })
      .eq("post_id", input.post_id)
      .eq("user_id", user.id)
      .neq("status", "processing");

    return jsonOk({ post });
  } catch (error) {
    return jsonError(error, 400);
  }
}
