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
