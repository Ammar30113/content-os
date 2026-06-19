import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { ensurePublishingJobsForPost } from "@/lib/content/publishing-workflow";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { requireApiUser } from "@/lib/auth";

const schedulePostSchema = z.object({
  post_id: z.string().uuid(),
  scheduled_for: z.string().datetime(),
});

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = schedulePostSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();

    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .select("id, post_type, video_url")
      .eq("id", input.post_id)
      .eq("user_id", user.id)
      .single();

    if (postError || !post) {
      throw new Error(postError?.message || "Generated post not found.");
    }

    if (post.post_type === "reel") {
      if (!post.video_url) {
        throw new Error("Attach the finished Reel video before scheduling.");
      }

      const { data: scheduledPost, error: scheduleError } = await supabase
        .from("generated_posts")
        .update({
          status: "scheduled",
          scheduled_for: input.scheduled_for,
          publish_error: null,
        })
        .eq("id", input.post_id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (scheduleError || !scheduledPost) {
        throw new Error(scheduleError?.message || "Could not schedule Reel.");
      }

      return jsonOk({
        post: scheduledPost,
        jobs: [],
        selectedPlatforms: ["instagram"],
        scheduledFor: input.scheduled_for,
      });
    }

    const result = await ensurePublishingJobsForPost(supabase, {
      postId: input.post_id,
      userId: user.id,
      scheduledFor: input.scheduled_for,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
