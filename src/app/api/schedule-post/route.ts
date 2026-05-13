import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { isRallioPost } from "@/lib/content/brand";
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

    const { data: existingPost, error: existingPostError } = await supabase
      .from("generated_posts")
      .select("id, user_id, template_fields")
      .eq("id", input.post_id)
      .eq("user_id", user.id)
      .single();

    if (existingPostError || !existingPost) {
      throw new Error(existingPostError?.message || "Generated post not found.");
    }

    if (isRallioPost(existingPost.template_fields)) {
      const { data: scheduledPost, error: scheduleError } = await supabase
        .from("generated_posts")
        .update({
          status: "scheduled",
          scheduled_for: input.scheduled_for,
          publish_error: null,
        })
        .eq("id", input.post_id)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (scheduleError || !scheduledPost) {
        throw new Error(scheduleError?.message || "Could not schedule post.");
      }

      return jsonOk({
        post: scheduledPost,
        jobs: [],
        selectedPlatforms: ["instagram"],
        scheduledFor: input.scheduled_for,
        message:
          "Rallio post scheduled in Content OS. Buffer handoff is disabled until a Rallio channel exists.",
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
