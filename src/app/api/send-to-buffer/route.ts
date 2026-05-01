import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { sendPublishingJobToBuffer } from "@/lib/buffer/publishing";
import {
  ensurePublishingJobsForPost,
  markPostBufferHandoffComplete,
} from "@/lib/content/publishing-workflow";
import { platforms } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";

const sendToBufferSchema = z.object({
  post_id: z.string().uuid(),
  platform: z.enum(platforms).optional(),
  scheduled_for: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = sendToBufferSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();

    const ensured = await ensurePublishingJobsForPost(supabase, {
      postId: input.post_id,
      userId: user.id,
      scheduledFor: input.scheduled_for,
    });

    let query = supabase
      .from("publishing_jobs")
      .select("id, status")
      .eq("post_id", input.post_id)
      .eq("user_id", user.id);

    if (input.platform) {
      query = query.eq("platform", input.platform);
    }

    const { data: jobs, error } = await query.order("scheduled_for", {
      ascending: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    const pendingJobs = (jobs || []).filter(
      (job) => job.status !== "ready" && job.status !== "published",
    );

    if (!pendingJobs.length) {
      const post = await markPostBufferHandoffComplete(supabase, {
        postId: input.post_id,
        userId: user.id,
      });

      return jsonOk({
        sent: [],
        post,
        scheduled_for: ensured.scheduledFor,
        message: "All selected channels are already in Buffer.",
      });
    }

    const sent = [];

    for (const job of pendingJobs) {
      sent.push(
        await sendPublishingJobToBuffer(supabase, job.id, {
          userId: user.id,
        }),
      );
    }

    const post = await markPostBufferHandoffComplete(supabase, {
      postId: input.post_id,
      userId: user.id,
    });

    return jsonOk({
      sent,
      post,
      scheduled_for: ensured.scheduledFor,
      message: "Sent to Buffer and marked complete in Content OS.",
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
