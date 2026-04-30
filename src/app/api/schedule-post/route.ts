import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { platforms } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { requireApiUser } from "@/lib/auth";
import type { Json } from "@/types/database";

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
      .select("id, platform, template_fields")
      .single();

    if (postError || !post) {
      throw new Error(postError?.message || "Could not schedule post.");
    }

    const selectedPlatforms = getSelectedPlatforms(post.template_fields, post.platform);
    const jobs = [];

    for (const platform of selectedPlatforms) {
      const { data: existingJob } = await supabase
        .from("publishing_jobs")
        .select("id")
        .eq("post_id", input.post_id)
        .eq("platform", platform)
        .maybeSingle();

      const jobPayload = {
        user_id: user.id,
        post_id: input.post_id,
        platform,
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

      jobs.push(jobResult.data);
    }

    return jsonOk({ post, jobs });
  } catch (error) {
    return jsonError(error, 400);
  }
}

function getSelectedPlatforms(templateFields: Json, fallback: string) {
  if (
    templateFields &&
    typeof templateFields === "object" &&
    !Array.isArray(templateFields) &&
    Array.isArray(templateFields.selected_platforms)
  ) {
    const selected = templateFields.selected_platforms.filter(
      (item): item is (typeof platforms)[number] =>
        typeof item === "string" &&
        platforms.includes(item as (typeof platforms)[number]),
    );

    if (selected.length) {
      return selected;
    }
  }

  return platforms.includes(fallback as (typeof platforms)[number])
    ? [fallback as (typeof platforms)[number]]
    : ["instagram"];
}
