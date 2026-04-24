import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
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
      .update({
        status: "scheduled",
        scheduled_for: input.scheduled_for,
      })
      .eq("id", input.post_id)
      .select("id, platform")
      .single();

    if (postError || !post) {
      throw new Error(postError?.message || "Could not schedule post.");
    }

    const { data: existingJob } = await supabase
      .from("publishing_jobs")
      .select("id")
      .eq("post_id", input.post_id)
      .eq("platform", post.platform)
      .maybeSingle();

    const jobPayload = {
      user_id: user.id,
      post_id: input.post_id,
      platform: post.platform,
      status: "queued",
      scheduled_for: input.scheduled_for,
      error: null,
    };

    const jobResult = existingJob
      ? await supabase
          .from("publishing_jobs")
          .update(jobPayload)
          .eq("id", existingJob.id)
          .select()
          .single()
      : await supabase.from("publishing_jobs").insert(jobPayload).select().single();

    if (jobResult.error || !jobResult.data) {
      throw new Error(jobResult.error?.message || "Could not create schedule job.");
    }

    return jsonOk({ post, job: jobResult.data });
  } catch (error) {
    return jsonError(error, 400);
  }
}
